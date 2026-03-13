import { useTouch } from '@/hooks/useTouch'
import { cn } from '@/lib/utils'

function GameButton({ label, children, variant = 'default', onPress, onRelease }) {
  const { isPressed, ref } = useTouch({ onPress, onRelease })

  const variants = {
    default: 'bg-card border-border text-foreground/70 shadow-md',
    primary: 'bg-primary/10 border-primary/30 text-primary shadow-md',
  }

  return (
    <button
      ref={ref}
      className={cn(
        'aspect-square rounded-full border-2 flex items-center justify-center transition-all duration-100 select-none',
        variants[variant],
        isPressed && 'scale-90 shadow-inner brightness-90 bg-primary text-primary-foreground border-primary/60'
      )}
      style={{ width: 'var(--btn-size)' }}
      aria-label={label}
    >
      <svg className="w-[42%] h-[42%]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
    </button>
  )
}

export function ActionButtons({ onAction }) {
  return (
    <div
      className="relative"
      style={{
        width: 'calc(var(--btn-size) * 2.8)',
        height: 'calc(var(--btn-size) * 2.8)',
      }}
    >
      {/* Top - Speed */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2">
        <GameButton label="Velocidad" variant="primary"
          onPress={() => onAction?.('speed', true)} onRelease={() => onAction?.('speed', false)}>
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </GameButton>
      </div>
      {/* Left - Light */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2">
        <GameButton label="Luz"
          onPress={() => onAction?.('light', true)} onRelease={() => onAction?.('light', false)}>
          <path d="M9 18h6" /><path d="M10 22h4" />
          <path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" />
        </GameButton>
      </div>
      {/* Right - Signal */}
      <div className="absolute top-1/2 right-0 -translate-y-1/2">
        <GameButton label="Senal"
          onPress={() => onAction?.('signal', true)} onRelease={() => onAction?.('signal', false)}>
          <path d="M2 12h2" /><path d="M6 8v8" /><path d="M10 4v16" />
          <path d="M14 6v12" /><path d="M18 10v4" /><path d="M22 12h-2" />
        </GameButton>
      </div>
      {/* Bottom - Horn */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
        <GameButton label="Claxon"
          onPress={() => onAction?.('horn', true)} onRelease={() => onAction?.('horn', false)}>
          <path d="M11 5L6 9H2v6h4l5 4V5z" />
          <path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M19 5a9 9 0 0 1 0 14" />
        </GameButton>
      </div>
    </div>
  )
}
