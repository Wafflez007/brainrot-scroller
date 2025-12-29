import { useState, useEffect, useRef, useCallback } from 'react';
import MemeCanvas from './MemeCanvas';
import FaceTracker from './FaceTracker';
import './Brainrot.css'; 

function App() {
  // --- STATE ---
  const [memes, setMemes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("Ready");
  const [hasStarted, setHasStarted] = useState(false); 
  const [isSmiling, setIsSmiling] = useState(false);
  
  // NEW: Game State
  const [health, setHealth] = useState(100); // 100% Brain Integrity
  const [isDead, setIsDead] = useState(false);

  // --- REFS ---
  const worker = useRef(null);
  const sentinelRef = useRef(null);

  // --- AUDIO LOGIC ---
  const playChaosSound = useCallback(() => {
    try {
      const totalSounds = 10; 
      const randomId = Math.floor(Math.random() * totalSounds) + 1;
      const audio = new Audio(`/sounds/${randomId}.mp3`);
      audio.volume = 0.6; 
      audio.play().catch(e => console.warn("Audio blocked:", e));
    } catch (e) {
      console.error("Audio error", e);
    }
  }, []);

  // --- CHAOS LOGIC ---
  const getChaosClass = () => {
    const classes = ['', '', '', 'chaos-shake', 'chaos-border', 'chaos-rainbow', 'chaos-glitch']; 
    return classes[Math.floor(Math.random() * classes.length)];
  };

  // --- GAME LOOP (THE DOOM METER) ---
  useEffect(() => {
    if (!hasStarted || isDead) return;

    const decayInterval = setInterval(() => {
      setHealth((prevHealth) => {
        // 1. Calculate Damage
        let damage = 0.05; // Base rot (slow)
        
        if (!isSmiling) {
          damage = 0.4; // FAST rot if not smiling (The Penalty)
        } else {
          damage = -0.3; // Regenerate if smiling (The Antidote)
        }

        // 2. Apply Damage
        const newHealth = prevHealth - damage;

        // 3. Check Death
        if (newHealth <= 0) {
          setIsDead(true);
          return 0;
        }

        // Clamp between 0 and 100
        return Math.min(100, Math.max(0, newHealth));
      });
    }, 50); // Run every 50ms for smooth updates

    return () => clearInterval(decayInterval);
  }, [hasStarted, isSmiling, isDead]);


  // --- WORKER SETUP ---
  useEffect(() => {
    worker.current = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });

    worker.current.onmessage = (e) => {
      const { status, message, result } = e.data;
      
      if (status === 'loading' || status === 'update') {
        setStatus(message);
      } else if (status === 'complete') {
        setIsLoading(false);
        setStatus("Ready");
        
        if (hasStarted) playChaosSound();

        const words = result.caption.split(' ');
        const midpoint = Math.ceil(words.length / 2);
        
        const newMeme = {
          id: Date.now(),
          image: result.imageUsed, 
          topText: words.slice(0, midpoint).join(' '),
          bottomText: words.slice(midpoint).join(' '),
          chaosClass: getChaosClass() 
        };

        setMemes(prev => [...prev, newMeme]);
      }
    };

    return () => worker.current.terminate();
  }, [hasStarted, playChaosSound]); 

  // --- GENERATOR ---
  const generateMeme = useCallback(() => {
    if (isLoading || isDead) return;
    setIsLoading(true);
    setStatus("CONSUMING DATA...");
    
    const totalImages = 20; 
    const nextImg = `/memes/${Math.floor(Math.random() * totalImages) + 1}.jpg`;
    
    worker.current.postMessage({ image: window.location.origin + nextImg, originalSrc: nextImg });
  }, [isLoading, isDead]);

  // --- INFINITE SCROLL ---
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !isLoading && hasStarted && !isDead) {
        generateMeme();
      }
    }, { threshold: 0.1 });

    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [generateMeme, isLoading, hasStarted, isDead]);


  // ==========================================
  // VIEW 1: BLUE SCREEN OF DEATH (GAME OVER)
  // ==========================================
  if (isDead) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: '#0000AA', color: 'white',
        fontFamily: 'Courier New', padding: '40px', zIndex: 9999,
        display: 'flex', flexDirection: 'column', justifyContent: 'center'
      }}>
        <h1 style={{ background: 'white', color: '#0000AA', display: 'inline-block', padding: '0 10px' }}>
          FATAL EXCEPTION 0xBRAINROT
        </h1>
        <p style={{ marginTop: '20px', fontSize: '1.2rem' }}>
          A fatal exception has occurred at address 0x00000000. The current application will be terminated.
        </p>
        <ul style={{ marginTop: '20px', lineHeight: '1.5' }}>
          <li>* User failed to maintain Positive Vibe Integrity.</li>
          <li>* Smile levels dropped below critical threshold.</li>
          <li>* Brain cells have been fully depleted.</li>
        </ul>
        <div style={{ marginTop: '50px', textAlign: 'center' }}>
          <p>Press F5 to restart your consciousness.</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ 
              background: 'white', color: '#0000AA', border: 'none', 
              padding: '10px 20px', fontSize: '1.2rem', cursor: 'pointer', marginTop: '10px'
            }}
          >
            [ REBOOT SYSTEM ]
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: ENTRY SCREEN
  // ==========================================
  if (!hasStarted) {
    return (
      <div style={{ 
        height: '100vh', background: 'black', display: 'flex', alignItems: 'center', 
        justifyContent: 'center', color: '#0f0', fontFamily: 'monospace', 
        flexDirection: 'column', textAlign: 'center' 
      }}>
        <h1 className="chaos-glitch" style={{ fontSize: '3rem', marginBottom: '2rem' }}>BRAINROT SCROLLER</h1>
        
        <div style={{ maxWidth: '600px', marginBottom: '2rem', border: '1px solid #333', padding: '20px' }}>
          <p>SURVIVAL MODE ENABLED.</p>
          <p style={{ color: 'red', fontWeight: 'bold' }}>WARNING: YOU MUST SMILE TO SURVIVE.</p>
          <p style={{ fontSize: '0.8rem', color: '#666' }}>IF YOU STOP SMILING, THE ROT WILL CONSUME YOU.</p>
        </div>

        <button 
          onClick={() => {
            setHasStarted(true);
            new Audio('/sounds/1.mp3').play().catch(() => {});
            setTimeout(() => generateMeme(), 500);
          }}
          className="chaos-border"
          style={{ 
            padding: '20px 40px', fontSize: '20px', background: '#0f0', color: 'black',
            border: 'none', cursor: 'pointer', fontWeight: 'bold', fontFamily: 'monospace'
          }}
        >
          [ I ACCEPT THE RISK ]
        </button>
      </div>
    );
  }

  // ==========================================
  // VIEW 3: MAIN FEED (WITH DOOM MECHANICS)
  // ==========================================
  
  // Calculate Dynamic Styles based on Health
  // As health drops, opacity of red overlay increases (max 0.6)
  const redOpacity = Math.max(0, (100 - health) / 100) * 0.6;
  
  // Shake screen if health is critical (< 30%)
  const isCritical = health < 30;

  return (
    <div className={isCritical ? "chaos-shake" : ""} style={{ 
      backgroundColor: '#000', minHeight: '100vh', color: '#0f0', 
      fontFamily: 'monospace', overflowX: 'hidden', position: 'relative' 
    }}>
      
      <FaceTracker onSmileChange={setIsSmiling} />
      
      {/* RED FILTER OVERLAY (THE PUNISHMENT) */}
      <div style={{
        position: 'fixed', inset: 0, background: 'red',
        opacity: redOpacity, pointerEvents: 'none', zIndex: 50,
        transition: 'opacity 0.2s ease-out'
      }} />

      {/* DOOM METER (HEALTH BAR) */}
      <div style={{
        position: 'fixed', top: '10px', left: '10px', right: '10px',
        height: '30px', border: '2px solid white', zIndex: 100,
        background: '#333'
      }}>
        <div style={{
          height: '100%',
          width: `${health}%`,
          background: isSmiling ? '#0f0' : 'red', // Green if healing, Red if dying
          transition: 'width 0.1s linear, background 0.2s',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'black', fontWeight: 'bold', overflow: 'hidden'
        }}>
          {health > 20 ? "BRAIN INTEGRITY" : "CRITICAL FAILURE"}
        </div>
      </div>

      {/* SMILE STATUS INDICATOR */}
      <div style={{ 
        position: 'fixed', top: '50px', left: '10px', zIndex: 100, 
        background: 'black', color: isSmiling ? '#0f0' : 'red', 
        border: '1px solid white', padding: '5px', fontSize: '12px', fontWeight: 'bold' 
      }}>
        STATUS: {isSmiling ? "STABILIZED" : "DECAYING..."}
      </div>

      {/* Header */}
      <div style={{ 
        position: 'fixed', top: 0, left: 0, right: 0, 
        zIndex: 10, padding: '10px', textAlign: 'center',
        marginTop: '50px' // Push down below health bar
      }}>
        <small style={{ color: isLoading ? 'yellow' : '#0f0', background: 'black' }}>AI STATUS: {status}</small>
      </div>

      {/* Feed Container */}
      <div style={{ 
        marginTop: '120px', display: 'flex', flexDirection: 'column', 
        alignItems: 'center', gap: '60px', paddingBottom: '100px' 
      }}>
        
        {memes.length === 0 && !isLoading && (
            <div className="chaos-shake">INITIALIZING ROT ENGINE...</div>
        )}

        {memes.map((meme) => (
          <div key={meme.id} className={meme.chaosClass} style={{ transition: 'all 0.2s' }}>
            <MemeCanvas 
              imageSrc={meme.image} 
              topText={meme.topText} 
              bottomText={meme.bottomText} 
            />
          </div>
        ))}

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