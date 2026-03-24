import { useState, useEffect, useCallback, useRef } from 'react'

// ─── CSS Keyframes (static — no translate offsets for centering) ─────────────
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
    from { opacity: 0; transform: translateY(20px) scale(0.92); }
    to   { opacity: 1; transform: translateY(0)    scale(1);    }
  }
  @keyframes ss-logos-pulse {
    0%,100% { transform: scale(1);     }
    50%     { transform: scale(1.025); }
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

// Shared full-viewport overlay style (flex-centered)
const OVERLAY_STYLE = {
  position: 'fixed',
  inset: 0,
  width: '100dvw',
  height: '100dvh',
  zIndex: 10000,
  background: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

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
      ...OVERLAY_STYLE,
      flexDirection: 'column',
      gap: '2rem',
      animation: 'ss-portrait-in 0.5s cubic-bezier(0.22,1,0.36,1) both',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
        <img src="/logo-iteso.png" alt="ITESO"
          style={{ height: 56, width: 'auto', objectFit: 'contain' }} />
        <span style={{ fontSize: 24, color: 'oklch(0.80 0.01 250)', fontWeight: 200, lineHeight: 1 }}>|</span>
        <img src="/logo-epics.png" alt="EPICS in IEEE"
          style={{ height: 44, width: 'auto', objectFit: 'contain' }} />
      </div>

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
// onEnter MUST be called synchronously inside the pointer event
// so fullscreen + orientation lock keep the user-gesture chain.
function Landing({ onEnter }) {
  const [leaving, setLeaving] = useState(false)

  function handleTap() {
    if (leaving) return
    setLeaving(true)
    // Fire fullscreen/orientation immediately (user-gesture context)
    onEnter()
  }

  return (
    <div style={OVERLAY_STYLE}>
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
// Flexbox-centered in show phase; dynamic keyframe animation for fly phase.
function LogosStage({ onComplete }) {
  const [phase, setPhase] = useState('wait')
  const [overlayFading, setOverlayFading] = useState(false)
  const [flyStyle, setFlyStyle] = useState(null)
  const logosRef = useRef(null)
  const styleRef = useRef(null)

  // Let fullscreen settle, then show
  useEffect(() => {
    const t = setTimeout(() => setPhase('show'), 500)
    return () => clearTimeout(t)
  }, [])

  // Hold 3s then fly
  useEffect(() => {
    if (phase !== 'show') return
    const t = setTimeout(() => setPhase('fly'), 3000)
    return () => clearTimeout(t)
  }, [phase])

  // Fly phase: measure current position, inject dynamic keyframes, animate
  useEffect(() => {
    if (phase !== 'fly') return

    const el = logosRef.current
    if (!el) return

    // Measure where the logos currently are
    const rect = el.getBoundingClientRect()
    const currentCenterX = rect.left + rect.width / 2
    const currentCenterY = rect.top + rect.height / 2

    // Target: top-center of viewport (header area)
    const targetCenterX = window.innerWidth / 2
    const targetCenterY = 0

    // Translate deltas from current position
    const dx = targetCenterX - currentCenterX
    const dy = targetCenterY - currentCenterY

    // Inject dynamic keyframes
    const keyframeName = 'ss-fly-dynamic'
    const css = `
      @keyframes ${keyframeName} {
        from { transform: translate(0, 0) scale(1); opacity: 1; }
        to   { transform: translate(${dx}px, ${dy}px) scale(0.28); opacity: 1; }
      }
    `
    const styleEl = document.createElement('style')
    styleEl.textContent = css
    document.head.appendChild(styleEl)
    styleRef.current = styleEl

    setFlyStyle({
      animation: `${keyframeName} 0.8s cubic-bezier(0.4,0,0.2,1) forwards`,
    })

    // Fade overlay partway through, then complete
    const t1 = setTimeout(() => setOverlayFading(true), 200)
    const t2 = setTimeout(onComplete, 900)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [phase, onComplete])

  // Clean up injected style on unmount
  useEffect(() => {
    return () => {
      if (styleRef.current) {
        styleRef.current.remove()
      }
    }
  }, [])

  const isWait = phase === 'wait'
  const isShow = phase === 'show'
  const isFly = phase === 'fly'

  // Logos container style per phase
  const logosStyle = (() => {
    if (isWait) return { opacity: 0 }
    if (isShow) return {
      animation: 'ss-logos-in 0.65s cubic-bezier(0.22,1,0.36,1) both, ss-logos-pulse 2.2s ease-in-out 0.8s 1 both',
    }
    // fly — use dynamically computed animation
    return flyStyle || {}
  })()

  return (
    <div style={{
      ...OVERLAY_STYLE,
      zIndex: 9999,
      pointerEvents: 'none',
      overflow: 'hidden',
      animation: overlayFading ? 'ss-overlay-out 0.7s ease both' : undefined,
    }}>
      <div
        ref={logosRef}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(16px, 3dvw, 32px)',
          willChange: 'transform, opacity',
          ...logosStyle,
        }}
      >
        <img
          src="/logo-iteso.png"
          alt="ITESO, Universidad Jesuita de Guadalajara"
          style={{ height: 'clamp(60px, 18dvh, 120px)', width: 'auto', objectFit: 'contain', display: 'block' }}
        />
        <span style={{
          fontSize: 'clamp(24px, 7dvh, 44px)',
          color: 'oklch(0.78 0.01 250)',
          fontWeight: 200, lineHeight: 1, userSelect: 'none',
        }}>|</span>
        <img
          src="/logo-epics.png"
          alt="EPICS in IEEE"
          style={{ height: 'clamp(100px, 38dvh, 240px)', width: 'auto', objectFit: 'contain', display: 'block' }}
        />
      </div>
    </div>
  )
}

// ─── Main SplashScreen ────────────────────────────────────────────────────────
export function SplashScreen({ onComplete }) {
  const isPortrait = () => window.matchMedia('(orientation: portrait)').matches
  const [step, setStep] = useState(() => isPortrait() ? 'portrait' : 'landing')

  // Called synchronously from the pointer event to keep user-gesture context
  const handleEnter = useCallback(() => {
    // Fire fullscreen + orientation lock immediately (user-gesture chain)
    document.documentElement.requestFullscreen().catch(() => {})
    try { screen.orientation.lock('landscape').catch(() => {}) } catch (_) {}
    // Transition to logos phase
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
