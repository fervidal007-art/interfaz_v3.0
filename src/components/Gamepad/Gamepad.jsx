import { DPad } from '@/components/DPad/DPad'
import { RotationControl } from '@/components/RotationControl/RotationControl'
import { useTouch } from '@/hooks/useTouch'
import { cn } from '@/lib/utils'

function EStopButton({ onPress, onRelease }) {
  const { isPressed, ref } = useTouch({ onPress, onRelease })

  return (
    <button
      ref={ref}
      className={cn(
        'w-full rounded-2xl border-2 border-destructive bg-destructive text-destructive-foreground font-bold tracking-widest uppercase shadow-lg transition-all duration-100 select-none',
        isPressed && 'scale-[0.97] shadow-inner brightness-90'
      )}
      style={{
        height: 'calc(var(--btn-size) * 1.1)',
        fontSize: 'calc(var(--btn-size) * 0.3)',
      }}
    >
      E-STOP
    </button>
  )
}

export function Gamepad() {
  const handleDirection = (dir, pressed) => {
    console.log('Direction:', dir, pressed ? 'ON' : 'OFF')
  }

  const handleRotate = (dir, pressed) => {
    console.log('Rotate:', dir, pressed ? 'ON' : 'OFF')
  }

  const handleEStop = () => {
    console.log('E-STOP ACTIVATED')
  }

  return (
    <div
      className="flex-1 flex flex-col touch-none select-none overflow-hidden"
      style={{
        '--btn-size': 'clamp(48px, min(14vw, 12vh), 110px)',
      }}
    >
      <div className="flex-1 grid grid-cols-2 items-center px-[3vw]">
        {/* Left: D-Pad */}
        <div className="justify-self-start">
          <DPad onDirection={handleDirection} />
        </div>

        {/* Right: Rotation */}
        <div className="justify-self-end">
          <RotationControl onRotate={handleRotate} />
        </div>
      </div>

      {/* E-Stop */}
      <div className="px-[3vw] pb-[2vh]">
        <EStopButton onPress={handleEStop} />
      </div>
    </div>
  )
}
