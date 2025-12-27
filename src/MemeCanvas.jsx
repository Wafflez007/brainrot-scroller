import React, { useRef, useEffect, useState } from 'react';

const MemeCanvas = ({ imageSrc, topText, bottomText }) => {
  const canvasRef = useRef(null);
  const [dataUrl, setDataUrl] = useState('');

  // Helper: Logic to wrap text onto multiple lines
  const wrapText = (ctx, text, x, y, maxWidth, lineHeight, isBottom) => {
    if (!text) return;
    const words = text.split(' ');
    let line = '';
    const lines = [];

    // Calculate lines
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        lines.push(line);
        line = words[n] + ' ';
      } else {
        line = testLine;
      }
    }
    lines.push(line);

    // Draw lines
    // If bottom text, draw upwards from the bottom
    let startY = isBottom ? y - (lines.length - 1) * lineHeight : y;
    
    lines.forEach((l, i) => {
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
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Styling
      const fontSize = Math.floor(img.width * 0.1); 
      ctx.font = `${fontSize}px 'VT323', monospace`;
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = fontSize / 4;

      const maxWidth = canvas.width * 0.9; // 90% of width
      const lineHeight = fontSize * 1.1;

      // Draw Top Text (Wrapped)
      wrapText(ctx, topText, canvas.width / 2, 10, maxWidth, lineHeight, false);

      // Draw Bottom Text (Wrapped)
      // Note: We pass 'true' for isBottom to handle vertical positioning
      ctx.textBaseline = 'bottom'; 
      wrapText(ctx, bottomText, canvas.width / 2, canvas.height - 10, maxWidth, lineHeight, true);

      setDataUrl(canvas.toDataURL('image/png'));
    };
  }, [imageSrc, topText, bottomText]);

  return (
    <div style={{ border: '2px solid #333', display: 'inline-block', maxWidth: '100%' }}>
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        {dataUrl && <img src={dataUrl} alt="Generated Meme" style={{ width: '100%', display: 'block' }} />}
    </div>
  );
};

export default MemeCanvas;