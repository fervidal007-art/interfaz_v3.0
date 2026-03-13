import { useState, useCallback, useEffect } from 'react'

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

export function StatusBar() {
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement)

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
    <header className="flex items-center justify-between px-5 py-3.5 bg-white border-b border-border/50 shadow-[0_1px_6px_rgba(0,0,0,0.04)]">
      {/* Left: Title + Status */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <h1 className="text-lg font-bold text-foreground tracking-tight leading-none">
            Robot <span className="font-light text-primary/70">Control</span>
          </h1>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-2 h-2 rounded-full bg-muted-foreground/30 ring-2 ring-muted-foreground/10" />
            <span className="text-[11px] text-muted-foreground font-medium tracking-wide uppercase">
              Desconectado
            </span>
          </div>
        </div>
        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 active:scale-90 transition-all duration-100"
          aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
        >
          <FullscreenIcon isFullscreen={isFullscreen} />
        </button>
      </div>

      {/* Right: Logos */}
      <div className="flex items-center gap-4">
        <img
          src="/logo-iteso.png"
          alt="ITESO, Universidad Jesuita de Guadalajara"
          className="h-9 w-auto object-contain"
        />
        <div className="w-px h-8 bg-border/60" />
        <img
          src="/logo-epics.png"
          alt="EPICS in IEEE"
          className="h-10 w-auto object-contain"
        />
      </div>
    </header>
  )
}
