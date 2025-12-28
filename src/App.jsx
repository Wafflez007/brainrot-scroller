import { useState, useEffect, useRef, useCallback } from 'react';
import MemeCanvas from './MemeCanvas';
import './Brainrot.css'; 

function App() {
  // --- STATE ---
  const [memes, setMemes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("Ready");
  const [hasStarted, setHasStarted] = useState(false); // Controls the Entry Screen

  // --- REFS ---
  const worker = useRef(null);
  const sentinelRef = useRef(null);

  // --- AUDIO LOGIC (Uses your files) ---
  const playChaosSound = () => {
    try {
      const totalSounds = 10; 
      const randomId = Math.floor(Math.random() * totalSounds) + 1;
      const audio = new Audio(`/sounds/${randomId}.mp3`);
      audio.volume = 0.6; 
      audio.play().catch(e => console.warn("Audio blocked:", e));
    } catch (e) {
      console.error("Audio error", e);
    }
  };

  // --- CHAOS LOGIC ---
  const getChaosClass = () => {
    // Added 'chaos-glitch' to the mix
    const classes = ['', '', '', 'chaos-shake', 'chaos-border', 'chaos-rainbow', 'chaos-glitch']; 
    return classes[Math.floor(Math.random() * classes.length)];
  };

  // --- WORKER SETUP (Real AI) ---
  useEffect(() => {
    worker.current = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });

    worker.current.onmessage = (e) => {
      const { status, message, result } = e.data;
      
      if (status === 'loading' || status === 'update') {
        setStatus(message);
      } else if (status === 'complete') {
        setIsLoading(false);
        setStatus("Ready");
        
        // Play Sound only if user has entered
        if (hasStarted) playChaosSound();

        const words = result.caption.split(' ');
        const midpoint = Math.ceil(words.length / 2);
        
        const newMeme = {
          id: Date.now(),
          image: result.imageUsed, // Uses the real image passed back from worker
          topText: words.slice(0, midpoint).join(' '),
          bottomText: words.slice(midpoint).join(' '),
          chaosClass: getChaosClass() 
        };

        setMemes(prev => [...prev, newMeme]);
      }
    };

    return () => worker.current.terminate();
  }, [hasStarted]); // Add hasStarted as dependency to ensure audio context is ready

  // --- GENERATOR ---
  const generateMeme = useCallback(() => {
    if (isLoading) return;
    setIsLoading(true);
    setStatus("CONSUMING DATA...");
    
    // Use your LOCAL images
    const totalImages = 20; 
    const nextImg = `/memes/${Math.floor(Math.random() * totalImages) + 1}.jpg`;
    
    // Send to worker
    worker.current.postMessage({ image: window.location.origin + nextImg, originalSrc: nextImg });
  }, [isLoading]);

  // --- INFINITE SCROLL ---
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      // Only trigger if started and not loading
      if (entries[0].isIntersecting && !isLoading && hasStarted) {
        generateMeme();
      }
    }, { threshold: 0.1 });

    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [generateMeme, isLoading, hasStarted]);

  // ==========================================
  // VIEW 1: THE ENTRY SCREEN (Crucial for Audio)
  // ==========================================
  if (!hasStarted) {
    return (
      <div style={{ 
        height: '100vh', 
        background: 'black', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: '#0f0',
        fontFamily: 'monospace',
        flexDirection: 'column',
        textAlign: 'center'
      }}>
        <h1 className="chaos-glitch" style={{ fontSize: '3rem', marginBottom: '2rem' }}>BRAINROT SCROLLER</h1>
        
        <div style={{ maxWidth: '600px', marginBottom: '2rem', border: '1px solid #333', padding: '20px' }}>
          <p>WARNING: AUDIO & VISUAL OVERLOAD IMMINENT.</p>
          <p style={{ fontSize: '0.8rem', color: '#666' }}>AI MODELS LOADING IN BACKGROUND...</p>
        </div>

        <button 
          onClick={() => {
            setHasStarted(true);
            // Play a silent sound or first sound to unlock browser audio
            new Audio('/sounds/1.mp3').play().catch(() => {});
            // Trigger first meme
            setTimeout(() => generateMeme(), 500);
          }}
          className="chaos-border"
          style={{ 
            padding: '20px 40px', 
            fontSize: '20px', 
            background: '#0f0', 
            color: 'black',
            border: 'none', 
            cursor: 'pointer', 
            fontWeight: 'bold',
            fontFamily: 'monospace',
            textTransform: 'uppercase'
          }}
        >
          [ CLICK TO ENTER THE ROT ]
        </button>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: THE MAIN FEED
  // ==========================================
  return (
    <div style={{ backgroundColor: '#000', minHeight: '100vh', color: '#0f0', fontFamily: 'monospace', overflowX: 'hidden' }}>
      
      {/* Header */}
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        background: 'rgba(0,0,0,0.9)', 
        zIndex: 10, 
        padding: '10px', 
        borderBottom: '1px solid #0f0',
        textAlign: 'center'
      }}>
        <h1 className="chaos-rainbow" style={{ margin: 0, fontSize: '1.5rem' }}>BRAINROT_SCROLLER_FEED</h1>
        <small style={{ color: isLoading ? 'yellow' : '#0f0' }}>STATUS: {status}</small>
      </div>

      {/* Feed Container */}
      <div style={{ 
        marginTop: '100px', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        gap: '60px', 
        paddingBottom: '100px' 
      }}>
        
        {/* Loading Initial State */}
        {memes.length === 0 && !isLoading && (
            <div className="chaos-shake">INITIALIZING ROT ENGINE...</div>
        )}

        {/* Meme List */}
        {memes.map((meme) => (
          <div key={meme.id} className={meme.chaosClass} style={{ transition: 'all 0.2s' }}>
            <MemeCanvas 
              imageSrc={meme.image} 
              topText={meme.topText} 
              bottomText={meme.bottomText} 
            />
          </div>
        ))}

        {/* Sentinel / Loading Indicator */}
        <div ref={sentinelRef} style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          {isLoading ? (
            <h2 className="chaos-shake" style={{color: 'yellow'}}>GENERATING NEW ROT...</h2>
          ) : (
            <h2>SCROLL FOR MORE</h2>
          )}
        </div>

      </div>
    </div>
  );
}

export default App;