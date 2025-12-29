import React, { useEffect, useRef, useState } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

const FaceTracker = ({ onSmileChange }) => {
  const videoRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let faceLandmarker;
    let animationFrameId;

    const setupFaceLandmarker = async () => {
      // 1. Load the Vision Module
      const filesetResolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
      );

      // 2. Configure the Face Tracker
      faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
          delegate: "GPU" // Use the graphics card for speed [cite: 21]
        },
        outputFaceBlendshapes: true, // Crucial: This gives us "Smile" data [cite: 60]
        runningMode: "VIDEO",
        numFaces: 1
      });

      startWebcam();
    };

    const startWebcam = () => {
      navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.addEventListener("loadeddata", predictWebcam);
          setIsReady(true);
        }
      });
    };

    const predictWebcam = () => {
      if (!faceLandmarker || !videoRef.current) return;

      let startTimeMs = performance.now();
      
      // 3. Detect Face
      const results = faceLandmarker.detectForVideo(videoRef.current, startTimeMs);

      // 4. Analyze Smile
      if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
        const shapes = results.faceBlendshapes[0].categories;
        
        // Extract Smile Values (0.0 to 1.0)
        const smileLeft = shapes.find(s => s.categoryName === 'mouthSmileLeft')?.score || 0;
        const smileRight = shapes.find(s => s.categoryName === 'mouthSmileRight')?.score || 0;
        
        // Average the two sides
        const smileFactor = (smileLeft + smileRight) / 2;
        
        // Threshold: If > 0.4, count as smiling
        const isSmiling = smileFactor > 0.4;
        
        // Send data back to App parent
        onSmileChange(isSmiling);
      }

      animationFrameId = window.requestAnimationFrame(predictWebcam);
    };

    setupFaceLandmarker();

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (faceLandmarker) faceLandmarker.close();
    };
  }, [onSmileChange]);

  return (
    <div style={{ position: 'fixed', bottom: '10px', right: '10px', zIndex: 50, opacity: 0.8 }}>
      {/* Hidden Video Feed (We analyze it but don't need to see it) */}
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        style={{ width: '150px', borderRadius: '10px', border: '2px solid #0f0', transform: 'scaleX(-1)' }} 
      />
      {!isReady && <div style={{ color: 'yellow', background: 'black', fontSize: '10px' }}>LOADING VISION...</div>}
    </div>
  );
};

export default FaceTracker;