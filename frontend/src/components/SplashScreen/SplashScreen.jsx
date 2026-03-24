import { useState, useEffect, useRef } from 'react'

const KEYFRAMES = `
@keyframes splash-fade-in {
  from { opacity: 0; transform: scale(0.92); }
  to   { opacity: 1; transform: scale(1); }
}
@keyframes splash-fade-out {
  from { opacity: 1; }
  to   { opacity: 0; }
}
@keyframes splash-logos-rise {
  from {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  to {
    opacity: 0;
    transform: translate(-50%, -320%) scale(0.38);
  }
}
@keyframes rotate-pulse {
  0%, 100% { transform: rotate(-15deg); }
  50%       { transform: rotate(15deg); }
}
`

// ─── Portrait gate ────────────────────────────────────────────────────────────
function PortraitGate({ onProceed }) {
  const [pressing, setPressing] = useState(false)

  async function handleEnter() {
    setPressing(true)
    try {
      await document.documentElement.requestFullscreen()
    } catch (_) {}
    try {
      await screen.orientation.lock('landscape')
    } catch (_) {}
    // Small delay so orientation has time to settle
    setTimeout(onProceed, 300)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'white',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: '2rem',
      padding: '2rem',
    }}>
      {/* Logos */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '0.5rem' }}>
        <img src="/logo-iteso.png" alt="ITESO" style={{ height: 64, width: 'auto', objectFit: 'contain' }} />
        <span style={{ fontSize: 28, color: 'oklch(0.75 0.01 250)', fontWeight: 200 }}>|</span>
        <img src="/logo-epics.png" alt="EPICS in IEEE" style={{ height: 52, width: 'auto', objectFit: 'contain' }} />
      </div>

      {/* Phone rotate icon */}
      <div style={{
        animation: 'rotate-pulse 1.6s ease-in-out infinite',
        transformOrigin: 'center',
        fontSize: 48,
        lineHeight: 1,
        color: 'oklch(0.30 0.07 250)',
      }}>
        ↻
      </div>

      <div style={{ textAlign: 'center' }}>
        <p style={{
          fontSize: 'clamp(1rem, 3vw, 1.25rem)',
          fontWeight: 600,
          color: 'oklch(0.20 0.04 250)',
          marginBottom: '0.375rem',
          letterSpacing: '-0.01em',
        }}>
          Rota tu dispositivo
        </p>
        <p style={{
          fontSize: 'clamp(0.8rem, 2.2vw, 0.95rem)',
          color: 'oklch(0.55 0.02 250)',
          fontWeight: 400,
        }}>
          Esta interfaz requiere orientación horizontal
        </p>
      </div>

      <button
        onPointerDown={() => setPressing(true)}
        onPointerUp={handleEnter}
        style={{
          marginTop: '0.5rem',
          padding: '0.875rem 2.5rem',
          borderRadius: '9999px',
          border: 'none',
          cursor: 'pointer',
          fontSize: '1rem',
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          background: pressing ? 'oklch(0.24 0.07 250)' : 'oklch(0.30 0.07 250)',
          color: 'white',
          transition: 'background 0.1s, transform 0.1s',
          transform: pressing ? 'scale(0.96)' : 'scale(1)',
          boxShadow: '0 4px 24px oklch(0.30 0.07 250 / 0.30)',
        }}
      >
        Entrar
      </button>
    </div>
  )
}

// ─── Intro animation ──────────────────────────────────────────────────────────
function IntroAnimation({ onComplete }) {
  // phase: 'in' → logos fade in | 'rise' → logos fly to header | 'done'
  const [phase, setPhase] = useState('in')
  const [overlayFading, setOverlayFading] = useState(false)

  useEffect(() => {
    // After fade-in hold, start the rise
    const t1 = setTimeout(() => setPhase('rise'), 1400)
    // Slightly before rise ends, fade out the overlay
    const t2 = setTimeout(() => setOverlayFading(true), 2000)
    // Call onComplete when overlay is gone
    const t3 = setTimeout(onComplete, 2550)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onComplete])

  const logosStyle = phase === 'in'
    ? {
        animation: 'splash-fade-in 0.55s cubic-bezier(0.22,1,0.36,1) both',
      }
    : {
        animation: 'splash-logos-rise 0.72s cubic-bezier(0.4,0,0.2,1) both',
      }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9998,
      background: 'white',
      pointerEvents: 'none',
      animation: overlayFading ? 'splash-fade-out 0.5s ease both' : undefined,
    }}>
      {/* Centered logos */}
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        display: 'flex', alignItems: 'center',
        gap: 'clamp(12px, 2.5vw, 28px)',
        transformOrigin: 'top center',
        ...logosStyle,
      }}>
        <img
          src="/logo-iteso.png"
          alt="ITESO"
          style={{ height: 'clamp(56px, 10vh, 80px)', width: 'auto', objectFit: 'contain' }}
        />
        <span style={{ fontSize: 'clamp(22px, 4vh, 32px)', color: 'oklch(0.75 0.01 250)', fontWeight: 200, lineHeight: 1 }}>|</span>
        <img
          src="/logo-epics.png"
          alt="EPICS in IEEE"
          style={{ height: 'clamp(88px, 16vh, 128px)', width: 'auto', objectFit: 'contain' }}
        />
      </div>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function SplashScreen({ onComplete }) {
  const isPortrait = () =>
    window.matchMedia('(orientation: portrait)').matches

  const [step, setStep] = useState(() => isPortrait() ? 'portrait' : 'intro')

  // Listen for orientation changes while on portrait gate
  useEffect(() => {
    if (step !== 'portrait') return
    const mq = window.matchMedia('(orientation: landscape)')
    const handler = (e) => { if (e.matches) setStep('intro') }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [step])

  return (
    <>
      <style>{KEYFRAMES}</style>
      {step === 'portrait' && <PortraitGate onProceed={() => setStep('intro')} />}
      {step === 'intro'    && <IntroAnimation onComplete={onComplete} />}
    </>
  )
}
