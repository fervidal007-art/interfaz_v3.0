import { useTouch } from '@/hooks/useTouch'
import { cn } from '@/lib/utils'

function DirButton({ direction, rotation, variant = 'cardinal', onPress, onRelease, disabled = false }) {
  const { isPressed, ref } = useTouch({ onPress, onRelease, disabled })
  const isDiag = variant === 'diagonal'

  return (
    <button
      ref={ref}
      disabled={disabled}
      className={cn(
        'flex items-center justify-center transition-all duration-75 select-none',
        isDiag
          ? 'rounded-md bg-transparent text-muted-foreground/40 hover:text-muted-foreground/60'
          : 'rounded-lg bg-muted/60 text-muted-foreground hover:bg-muted',
        disabled && 'pointer-events-none opacity-40',
        isPressed && !isDiag && 'bg-[#122A5E]/10 text-[#122A5E] shadow-[0_0_12px_rgba(18,42,94,0.25)] scale-95',
        isPressed && isDiag && 'bg-[#122A5E]/8 text-[#122A5E]/70 scale-90',
      )}
      style={{ width: 'var(--dpad-btn)', height: 'var(--dpad-btn)' }}
      aria-label={direction}
    >
      <svg
        className={cn('transition-transform duration-75', isDiag ? 'w-[32%] h-[32%]' : 'w-[38%] h-[38%]')}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        <path d="M12 5l0 14" />
        <path d="M5 12l7-7 7 7" />
      </svg>
    </button>
  )
}

export function DPad({ onDirection, disabled = false }) {
  const fire = (dir, pressed) => onDirection?.(dir, pressed)

  return (
    <div
      className="rounded-2xl bg-card border border-border/50 shadow-sm p-[calc(var(--dpad-btn)*0.08)]"
      style={{
        '--dpad-btn': 'calc(var(--btn-size) * 1.3)',
      }}
    >
      <div
        className="grid grid-cols-3 place-items-center"
        style={{ gap: 'calc(var(--dpad-btn) * 0.05)' }}
      >
        <DirButton direction="nw" variant="diagonal" rotation={-45}
          onPress={() => fire('nw', true)} onRelease={() => fire('nw', false)} disabled={disabled} />
        <DirButton direction="n" rotation={0}
          onPress={() => fire('n', true)} onRelease={() => fire('n', false)} disabled={disabled} />
        <DirButton direction="ne" variant="diagonal" rotation={45}
          onPress={() => fire('ne', true)} onRelease={() => fire('ne', false)} disabled={disabled} />

        <DirButton direction="w" rotation={-90}
          onPress={() => fire('w', true)} onRelease={() => fire('w', false)} disabled={disabled} />
        <div className="flex items-center justify-center" style={{ width: 'var(--dpad-btn)', height: 'var(--dpad-btn)' }}>
          <div className="w-2 h-2 rounded-full bg-border/60" />
        </div>
        <DirButton direction="e" rotation={90}
          onPress={() => fire('e', true)} onRelease={() => fire('e', false)} disabled={disabled} />

        <DirButton direction="sw" variant="diagonal" rotation={-135}
          onPress={() => fire('sw', true)} onRelease={() => fire('sw', false)} disabled={disabled} />
        <DirButton direction="s" rotation={180}
          onPress={() => fire('s', true)} onRelease={() => fire('s', false)} disabled={disabled} />
        <DirButton direction="se" variant="diagonal" rotation={135}
          onPress={() => fire('se', true)} onRelease={() => fire('se', false)} disabled={disabled} />
      </div>
    </div>
  )
}
