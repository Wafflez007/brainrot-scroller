import React, { useRef, useEffect, useState } from 'react';

const MemeCanvas = ({ imageSrc, topText, bottomText }) => {
  const canvasRef = useRef(null);
  const [dataUrl, setDataUrl] = useState('');

  // STANDARD SIZE: 500x500 pixels
  const CANVAS_SIZE = 500;

  // Helper: Text Wrapping
  const wrapText = (ctx, text, x, y, maxWidth, lineHeight, isBottom) => {
    if (!text) return;
    const words = text.split(' ');
    let line = '';
    const lines = [];

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        lines.push(line);
        line = words[n] + ' ';
      } else {
        line = testLine;
      }
    }
    lines.push(line);

    let startY = isBottom ? y - (lines.length - 1) * lineHeight : y;
    
    lines.forEach((l, i) => {
      // Thick black stroke for visibility
      ctx.strokeText(l.toUpperCase(), x, startY + (i * lineHeight));
      ctx.fillText(l.toUpperCase(), x, startY + (i * lineHeight));
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = "anonymous"; 
    img.src = imageSrc;

    img.onload = () => {
      // 1. FORCE STANDARD SIZE
      canvas.width = CANVAS_SIZE;
      canvas.height = CANVAS_SIZE;

      // 2. "OBJECT-FIT: COVER" LOGIC (Crop to Center)
      // Calculate scaling to fill the 500x500 square
      const scale = Math.max(CANVAS_SIZE / img.width, CANVAS_SIZE / img.height);
      const x = (CANVAS_SIZE / 2) - (img.width / 2) * scale;
      const y = (CANVAS_SIZE / 2) - (img.height / 2) * scale;

      // Draw black background first (in case of transparency)
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      // Draw image scaled and centered
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

      // 3. STYLING (Now standardized!)
      const fontSize = 50; // Fixed font size since canvas is fixed
      ctx.font = `${fontSize}px 'VT323', monospace`;
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 8; // Thicker stroke

      const maxWidth = CANVAS_SIZE * 0.9;
      const lineHeight = fontSize * 1.1;

      // 4. DRAW TEXT
      wrapText(ctx, topText, CANVAS_SIZE / 2, 20, maxWidth, lineHeight, false);
      
      ctx.textBaseline = 'bottom'; 
      wrapText(ctx, bottomText, CANVAS_SIZE / 2, CANVAS_SIZE - 20, maxWidth, lineHeight, true);

      setDataUrl(canvas.toDataURL('image/png'));
    };
  }, [imageSrc, topText, bottomText]);

  return (
    <div style={{ 
      border: '4px solid #333', 
      display: 'inline-block', 
      width: '100%', 
      maxWidth: '500px', // Responsive container
      aspectRatio: '1 / 1', // Forces the container to be square
      backgroundColor: '#000'
    }}>
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        
        {/* Render the generated image */}
        {dataUrl ? (
          <img 
            src={dataUrl} 
            alt="Generated Meme" 
            style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333' }}>
            LOADING PIXELS...
          </div>
        )}
    </div>
  );
};

export default MemeCanvas;