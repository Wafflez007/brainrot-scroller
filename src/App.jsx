import { useState, useEffect, useRef, useCallback } from 'react';
import MemeCanvas from './MemeCanvas';
import './Brainrot.css'; // Import the chaos styles

function App() {
  const [memes, setMemes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("Ready");

  const worker = useRef(null);
  const sentinelRef = useRef(null);

  // Helper: Play Random Sound
  const playChaosSound = () => {
    const totalSounds = 3; // CHANGE THIS to match your file count
    const randomId = Math.floor(Math.random() * totalSounds) + 1;
    const audio = new Audio(`/sounds/${randomId}.mp3`);
    audio.volume = 0.5; // Save your ears
    audio.play().catch(e => console.log("Audio blocked until interaction"));
  };

  // Helper: Get Random Chaos Class
  const getChaosClass = () => {
    const classes = ['', '', '', 'chaos-shake', 'chaos-border', 'chaos-rainbow']; 
    // Blank strings mean "normal" (so not EVERYTHING is crazy)
    return classes[Math.floor(Math.random() * classes.length)];
  };

  useEffect(() => {
    worker.current = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });

    worker.current.onmessage = (e) => {
      const { status, message, result } = e.data;
      
      if (status === 'loading' || status === 'update') {
        setStatus(message);
      } else if (status === 'complete') {
        setIsLoading(false);
        setStatus("Ready");
        
        // Play Sound Effect!
        playChaosSound();

        const words = result.caption.split(' ');
        const midpoint = Math.ceil(words.length / 2);
        
        const newMeme = {
          id: Date.now(),
          image: result.imageUsed,
          topText: words.slice(0, midpoint).join(' '),
          bottomText: words.slice(midpoint).join(' '),
          chaosClass: getChaosClass() // Assign permanent chaos to this specific meme
        };

        setMemes(prev => [...prev, newMeme]);
      }
    };

    return () => worker.current.terminate();
  }, []);

  const generateMeme = useCallback(() => {
    if (isLoading) return;
    setIsLoading(true);
    
    const totalImages = 5; 
    const nextImg = `/memes/${Math.floor(Math.random() * totalImages) + 1}.jpg`;
    
    worker.current.postMessage({ image: window.location.origin + nextImg, originalSrc: nextImg });
  }, [isLoading]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !isLoading) {
        generateMeme();
      }
    }, { threshold: 1.0 });

    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [generateMeme, isLoading]);

  return (
    <div style={{ backgroundColor: '#000', minHeight: '100vh', color: '#0f0', fontFamily: 'monospace', overflowX: 'hidden' }}>
      
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, background: 'black', zIndex: 10, padding: '10px', borderBottom: '1px solid #0f0' }}>
        <h1 className="chaos-rainbow" style={{ margin: 0, fontSize: '1.5rem' }}>BRAINROT_SCROLLER_FEED</h1>
        <small>{status}</small>
      </div>

      <div style={{ marginTop: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '50px', paddingBottom: '100px' }}>
        
        {memes.map((meme) => (
          <div key={meme.id} className={meme.chaosClass} style={{ transition: 'all 0.2s' }}>
            <MemeCanvas 
              imageSrc={meme.image} 
              topText={meme.topText} 
              bottomText={meme.bottomText} 
            />
          </div>
        ))}

        <div ref={sentinelRef} style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isLoading ? <h2 className="chaos-shake">GENERATING NEW ROT...</h2> : <h2>SCROLL FOR MORE</h2>}
        </div>

      </div>
    </div>
  );
}

export default App;