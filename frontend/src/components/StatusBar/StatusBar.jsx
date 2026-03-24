import { useState, useCallback, useEffect } from 'react'

// 12V system: 12.6V = 100%, 10.5V = 0%
function voltageToPercent(v) {
  if (v == null) return null
  return Math.round(Math.min(100, Math.max(0, ((v - 10.5) / (12.6 - 10.5)) * 100)))
}

function BatteryIcon({ percent }) {
  const fill = percent == null ? 0 : percent / 100
  const color = percent == null ? '#9ca3af'
    : percent > 50 ? '#22c55e'
    : percent > 20 ? '#f59e0b'
    : '#ef4444'

  return (
    <svg width="22" height="12" viewBox="0 0 22 12" fill="none">
      {/* body */}
      <rect x="0.5" y="0.5" width="18" height="11" rx="2" stroke={color} strokeWidth="1.2" />
      {/* terminal */}
      <rect x="19" y="3.5" width="2.5" height="5" rx="1" fill={color} />
      {/* fill */}
      <rect x="2" y="2" width={Math.round(15 * fill)} height="8" rx="1" fill={color} />
    </svg>
  )
}

function FullscreenIcon({ isFullscreen }) {
  if (isFullscreen) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 3v3a2 2 0 0 1-2 2H3" />
        <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
        <path d="M3 16h3a2 2 0 0 1 2 2v3" />
        <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
      </svg>
    )
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
    </svg>
  )
}

export function StatusBar({ connected, batteryVoltage }) {
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement)
  const visibleBatteryVoltage = connected ? batteryVoltage : null
  const percent = voltageToPercent(visibleBatteryVoltage)

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      document.documentElement.requestFullscreen()
    }
  }, [])

  return (
    <header className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center px-4 bg-white border-b border-border/50 shadow-[0_1px_6px_rgba(0,0,0,0.04)]" style={{ height: 'clamp(52px, 8dvh, 74px)', gap: 'clamp(8px, 2vw, 24px)' }}>
      <div className="flex items-center min-w-0 overflow-hidden" style={{ gap: 'clamp(6px, 1.2vw, 16px)' }}>
        <button
          onClick={toggleFullscreen}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 active:scale-90 transition-all duration-100 shrink-0"
          aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
        >
          <FullscreenIcon isFullscreen={isFullscreen} />
        </button>

        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ring-2 shrink-0 ${connected ? 'bg-green-500 ring-green-500/20' : 'bg-muted-foreground/30 ring-muted-foreground/10'}`} />
          <span className="text-[11px] text-muted-foreground font-medium tracking-wide uppercase">
            {connected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <BatteryIcon percent={percent} />
          <span className="text-[11px] font-medium tabular-nums" style={{
            color: percent == null ? '#9ca3af' : percent > 50 ? '#16a34a' : percent > 20 ? '#d97706' : '#dc2626'
          }}>
            {visibleBatteryVoltage != null ? `${visibleBatteryVoltage.toFixed(1)}V` : '—'}
          </span>
          {percent != null && (
            <span className="text-[10px] text-muted-foreground tabular-nums">{percent}%</span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-self-center h-full" style={{ gap: 'clamp(8px, 1.5vw, 20px)', paddingTop: 0, paddingBottom: 'clamp(6px, 1.2dvh, 10px)' }}>
        <img
          src="/logo-iteso.png"
          alt="ITESO, Universidad Jesuita de Guadalajara"
          className="w-auto object-contain shrink-0"
          style={{ height: 'clamp(42px, 8.5dvh, 76px)' }}
        />
        <span className="text-muted-foreground/40 leading-none" style={{ fontSize: 'clamp(20px, 4dvh, 36px)' }}>|</span>
        <img
          src="/logo-epics.png"
          alt="EPICS in IEEE"
          className="w-auto object-contain shrink-0"
          style={{ height: 'clamp(72px, 15dvh, 128px)' }}
        />
      </div>

      <div className="flex items-center justify-self-end pointer-events-none select-none">
        <h1 className="tracking-tight leading-none" style={{ fontSize: 'clamp(1rem, 2.4dvh, 1.5rem)' }}>
          <span style={{ fontWeight: 900, color: 'oklch(0.12 0.03 250)' }}>Robo</span>
          <span style={{ fontWeight: 300, color: 'oklch(0.58 0.015 250)', letterSpacing: '0.04em' }}>Mesh</span>
          <span style={{ fontWeight: 800, color: 'oklch(0.12 0.03 250)', display: 'inline-block', transform: 'skewX(11deg)' }}>A</span>
        </h1>
      </div>
    </header>
  )
}
