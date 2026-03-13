import { useTouch } from '@/hooks/useTouch'
import { cn } from '@/lib/utils'

function RotateButton({ direction, onPress, onRelease, disabled = false }) {
  const { isPressed, ref } = useTouch({ onPress, onRelease, disabled })
  const isCW = direction === 'cw'

  return (
    <button
      ref={ref}
      disabled={disabled}
      className={cn(
        'rounded-2xl border border-border/50 bg-card shadow-sm flex items-center justify-center transition-all duration-75 select-none text-muted-foreground hover:bg-muted/50',
        disabled && 'pointer-events-none opacity-40',
        isPressed && 'bg-[#122A5E]/10 text-[#122A5E] shadow-[0_0_12px_rgba(18,42,94,0.25)] scale-95 border-[#122A5E]/30'
      )}
      style={{
        width: 'calc(var(--btn-size) * 1.6)',
        height: 'calc(var(--btn-size) * 2.8)',
      }}
      aria-label={isCW ? 'Rotar derecha' : 'Rotar izquierda'}
    >
      <svg
        className="w-[36%] h-[36%]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ transform: isCW ? 'scaleX(1)' : 'scaleX(-1)' }}
      >
        <path d="M21 12a9 9 0 1 1-3-6.7" />
        <path d="M21 3v5.5h-5.5" />
      </svg>
    </button>
  )
}

export function RotationControl({ onRotate, disabled = false }) {
  return (
    <div
      className="flex items-center"
      style={{ gap: 'calc(var(--btn-size) * 0.25)' }}
    >
      <RotateButton
        direction="ccw"
        onPress={() => onRotate?.('ccw', true)}
        onRelease={() => onRotate?.('ccw', false)}
        disabled={disabled}
      />
      <RotateButton
        direction="cw"
        onPress={() => onRotate?.('cw', true)}
        onRelease={() => onRotate?.('cw', false)}
        disabled={disabled}
      />
    </div>
  )
}
