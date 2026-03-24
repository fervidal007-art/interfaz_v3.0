import { useState, useEffect, useRef, useCallback } from 'react'

// ─── CSS Keyframes ────────────────────────────────────────────────────────────
const KEYFRAMES = `
  @keyframes ss-btn-in {
    from { opacity: 0; transform: translateY(12px) scale(0.95); }
    to   { opacity: 1; transform: translateY(0)    scale(1);    }
  }
  @keyframes ss-btn-out {
    from { opacity: 1; transform: scale(1);    }
    to   { opacity: 0; transform: scale(0.92); }
  }
  @keyframes ss-logos-in {
    from { opacity: 0; transform: translate(-50%, calc(-50% + 20px)) scale(0.92); }
    to   { opacity: 1; transform: translate(-50%, -50%)               scale(1);   }
  }
  @keyframes ss-logos-pulse {
    0%,100% { transform: translate(-50%, -50%) scale(1);    }
    50%     { transform: translate(-50%, -50%) scale(1.025); }
  }
  @keyframes ss-overlay-out {
    from { opacity: 1; }
    to   { opacity: 0; }
  }
  @keyframes ss-rotate-hint {
    0%,100% { transform: rotate(-20deg); }
    50%     { transform: rotate(20deg);  }
  }
  @keyframes ss-portrait-in {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
`

// ─── Portrait Gate ────────────────────────────────────────────────────────────
function PortraitGate({ onLandscape }) {
  useEffect(() => {
    const mq = window.matchMedia('(orientation: landscape)')
    if (mq.matches) { onLandscape(); return }
    const handler = (e) => { if (e.matches) onLandscape() }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [onLandscape])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'white',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: '2rem',
      animation: 'ss-portrait-in 0.5s cubic-bezier(0.22,1,0.36,1) both',
    }}>
      {/* Small logos at top */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
        <img src="/logo-iteso.png" alt="ITESO"
          style={{ height: 56, width: 'auto', objectFit: 'contain' }} />
        <span style={{ fontSize: 24, color: 'oklch(0.80 0.01 250)', fontWeight: 200, lineHeight: 1 }}>|</span>
        <img src="/logo-epics.png" alt="EPICS in IEEE"
          style={{ height: 44, width: 'auto', objectFit: 'contain' }} />
      </div>

      {/* Rotation hint icon */}
      <div style={{
        fontSize: 52,
        color: 'oklch(0.30 0.07 250)',
        lineHeight: 1,
        animation: 'ss-rotate-hint 1.8s ease-in-out infinite',
        transformOrigin: 'center',
        userSelect: 'none',
      }}>
        ↻
      </div>

      {/* Message */}
      <div style={{ textAlign: 'center', padding: '0 2rem' }}>
        <p style={{
          fontSize: 'clamp(1rem, 4vw, 1.2rem)',
          fontWeight: 700,
          color: 'oklch(0.18 0.05 250)',
          letterSpacing: '-0.02em',
          marginBottom: 6,
        }}>
          Rota tu dispositivo
        </p>
        <p style={{
          fontSize: 'clamp(0.78rem, 3vw, 0.92rem)',
          color: 'oklch(0.55 0.02 250)',
          fontWeight: 400,
        }}>
          Esta interfaz requiere orientación horizontal
        </p>
      </div>
    </div>
  )
}

// ─── Landing (button only) ────────────────────────────────────────────────────
function Landing({ onEnter }) {
  const [leaving, setLeaving] = useState(false)

  function handleTap() {
    if (leaving) return
    setLeaving(true)
    setTimeout(onEnter, 260)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'white',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <button
        onPointerUp={handleTap}
        style={{
          padding: '1rem 3.5rem',
          borderRadius: 9999,
          border: 'none',
          cursor: 'pointer',
          background: leaving ? 'oklch(0.24 0.07 250)' : 'oklch(0.30 0.07 250)',
          color: 'white',
          fontSize: '1.05rem',
          fontWeight: 800,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          boxShadow: '0 6px 32px oklch(0.30 0.07 250 / 0.28)',
          animation: leaving
            ? 'ss-btn-out 0.26s cubic-bezier(0.4,0,1,1) both'
            : 'ss-btn-in 0.55s cubic-bezier(0.22,1,0.36,1) 0.1s both',
          transition: 'background 0.1s',
        }}
      >
        Entrar
      </button>
    </div>
  )
}

// ─── Logos Stage ──────────────────────────────────────────────────────────────
function LogosStage({ onComplete }) {
  // 'measure' → wait for fullscreen to settle
  // 'show'    → logos centered, pulsing
  // 'fly'     → logos animate to header
  // 'out'     → overlay fading, done
  const [phase, setPhase] = useState('measure')
  const [vp, setVp] = useState({ w: window.innerWidth, h: window.innerHeight })
  const [overlayFading, setOverlayFading] = useState(false)

  // After fullscreen + orientation lock settle, re-measure viewport
  useEffect(() => {
    const measure = () => setVp({ w: window.innerWidth, h: window.innerHeight })
    // Measure now, then again after a tick and after resize settles
    measure()
    const t = setTimeout(() => {
      measure()
      setPhase('show')
    }, 320)
    window.addEventListener('resize', measure)
    return () => { clearTimeout(t); window.removeEventListener('resize', measure) }
  }, [])

  // Hold 3s then fly
  useEffect(() => {
    if (phase !== 'show') return
    const t = setTimeout(() => setPhase('fly'), 3000)
    return () => clearTimeout(t)
  }, [phase])

  // Fly: fade overlay after 200ms, call onComplete after 900ms
  useEffect(() => {
    if (phase !== 'fly') return
    const t1 = setTimeout(() => setOverlayFading(true), 200)
    const t2 = setTimeout(onComplete, 900)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [phase, onComplete])

  // Logos positioning & animation
  const logosStyle = (() => {
    const baseTranslate = 'translate(-50%, -50%)'
    if (phase === 'measure') {
      return { opacity: 0, transform: baseTranslate }
    }
    if (phase === 'show') {
      return {
        animation: 'ss-logos-in 0.65s cubic-bezier(0.22,1,0.36,1) both, ss-logos-pulse 2.2s ease-in-out 0.8s 1 both',
      }
    }
    if (phase === 'fly' || phase === 'out') {
      return {
        transition: 'top 0.8s cubic-bezier(0.4,0,0.2,1), left 0.8s cubic-bezier(0.4,0,0.2,1), transform 0.8s cubic-bezier(0.4,0,0.2,1)',
        top: 0,
        left: '50%',
        transform: 'translate(-50%, 0) scale(0.30)',
      }
    }
    return {}
  })()

  const logosPos = (phase === 'fly' || phase === 'out')
    ? {}
    : { top: vp.h / 2, left: vp.w / 2 }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'white',
      pointerEvents: 'none',
      animation: overlayFading ? 'ss-overlay-out 0.7s ease both' : undefined,
    }}>
      <div style={{
        position: 'absolute',
        display: 'flex',
        alignItems: 'center',
        gap: 28,
        transformOrigin: 'top center',
        willChange: 'transform, top, left',
        ...logosPos,
        ...logosStyle,
      }}>
        <img
          src="/logo-iteso.png"
          alt="ITESO, Universidad Jesuita de Guadalajara"
          style={{ height: 120, width: 'auto', objectFit: 'contain', display: 'block' }}
        />
        <span style={{
          fontSize: 44, color: 'oklch(0.78 0.01 250)',
          fontWeight: 200, lineHeight: 1, userSelect: 'none',
        }}>|</span>
        <img
          src="/logo-epics.png"
          alt="EPICS in IEEE"
          style={{ height: 180, width: 'auto', objectFit: 'contain', display: 'block' }}
        />
      </div>
    </div>
  )
}

// ─── Main SplashScreen ────────────────────────────────────────────────────────
export function SplashScreen({ onComplete }) {
  const isPortrait = () => window.matchMedia('(orientation: portrait)').matches
  const [step, setStep] = useState(() => isPortrait() ? 'portrait' : 'landing')

  const handleEnter = useCallback(async () => {
    try { await document.documentElement.requestFullscreen() } catch (_) {}
    try { await screen.orientation.lock('landscape') } catch (_) {}
    setStep('logos')
  }, [])

  return (
    <>
      <style>{KEYFRAMES}</style>

      {step === 'portrait' && (
        <PortraitGate onLandscape={() => setStep('landing')} />
      )}

      {step === 'landing' && (
        <Landing onEnter={handleEnter} />
      )}

      {step === 'logos' && (
        <LogosStage onComplete={onComplete} />
      )}
    </>
  )
}
