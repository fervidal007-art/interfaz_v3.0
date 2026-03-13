import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CenterPanel } from '@/components/CenterPanel/CenterPanel'
import { DPad } from '@/components/DPad/DPad'
import { RotationControl } from '@/components/RotationControl/RotationControl'
import { useTouch } from '@/hooks/useTouch'
import {
  buildStepFromAction,
  cloneSequenceSteps,
  getSequenceProfiles,
} from '@/lib/sequenceProfiles'
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

export function Gamepad({ send }) {
  const sequenceProfiles = useMemo(() => getSequenceProfiles(), [])
  const [mode, setMode] = useState('manual')
  const [selectedProfileId, setSelectedProfileId] = useState(sequenceProfiles[0]?.id || '')
  const [draftSteps, setDraftSteps] = useState(() => cloneSequenceSteps(sequenceProfiles[0]?.steps || []))
  const [selectedActionKey, setSelectedActionKey] = useState('n')
  const [durationInput, setDurationInput] = useState('1200')
  const [isPlaying, setIsPlaying] = useState(false)
  const [activeStepIndex, setActiveStepIndex] = useState(null)
  const timeoutRef = useRef(null)
  const activeStepRef = useRef(null)

  const controlsLocked = mode === 'sequence'

  const sendStepState = useCallback((step, pressed) => {
    if (!step) return

    if (step.type === 'direction') {
      send({ type: 'direction', direction: step.value, pressed })
      return
    }

    if (step.type === 'rotate') {
      send({ type: 'rotate', direction: step.value, pressed })
      return
    }

    send({ type: 'estop', pressed })
  }, [send])

  const cancelSequencePlayback = useCallback(({ releaseActive = true } = {}) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    if (releaseActive && activeStepRef.current) {
      sendStepState(activeStepRef.current, false)
    }

    activeStepRef.current = null
    setIsPlaying(false)
    setActiveStepIndex(null)
  }, [sendStepState])

  function playSequence(steps, index = 0) {
    if (index >= steps.length) {
      cancelSequencePlayback({ releaseActive: false })
      return
    }

    const step = steps[index]
    activeStepRef.current = step
    setActiveStepIndex(index)
    sendStepState(step, true)

    timeoutRef.current = window.setTimeout(() => {
      sendStepState(step, false)
      activeStepRef.current = null
      playSequence(steps, index + 1)
    }, step.durationMs)
  }

  useEffect(() => () => cancelSequencePlayback(), [cancelSequencePlayback])

  const handleDirection = (direction, pressed) => {
    send({ type: 'direction', direction, pressed })
  }

  const handleRotate = (direction, pressed) => {
    send({ type: 'rotate', direction, pressed })
  }

  const handleEStop = () => {
    if (isPlaying) {
      cancelSequencePlayback({ releaseActive: activeStepRef.current?.type !== 'estop' })
    }
    send({ type: 'estop', pressed: true })
  }

  const handleProfileLoad = () => {
    const profile = sequenceProfiles.find((item) => item.id === selectedProfileId)
    setDraftSteps(cloneSequenceSteps(profile?.steps || []))
  }

  const handleClearDraft = () => {
    cancelSequencePlayback()
    setDraftSteps([])
  }

  const handleAddStep = () => {
    const nextStep = buildStepFromAction(selectedActionKey, durationInput)
    if (!nextStep) return

    setDraftSteps((current) => [...current, nextStep])
  }

  const handleMoveStep = (index, delta) => {
    setDraftSteps((current) => {
      const targetIndex = index + delta
      if (targetIndex < 0 || targetIndex >= current.length) return current

      const next = [...current]
      const [moved] = next.splice(index, 1)
      next.splice(targetIndex, 0, moved)
      return next
    })
  }

  const handleRemoveStep = (index) => {
    setDraftSteps((current) => current.filter((_, currentIndex) => currentIndex !== index))
  }

  const handlePlaySequence = () => {
    if (draftSteps.length === 0) return

    cancelSequencePlayback({ releaseActive: false })
    setIsPlaying(true)
    playSequence(draftSteps, 0)
  }

  const handleStopSequence = () => {
    cancelSequencePlayback()
  }

  const handleModeChange = (nextMode) => {
    if (nextMode === mode) return

    if (nextMode === 'manual') {
      cancelSequencePlayback()
    }

    setMode(nextMode)
  }

  return (
    <div
      className="flex-1 flex flex-col touch-none select-none overflow-hidden"
      style={{
        '--btn-size': 'clamp(48px, min(14vw, 12vh), 110px)',
      }}
    >
      <div className="flex-1 grid grid-cols-1 items-center gap-5 px-[3vw] py-[2vh] lg:grid-cols-[auto_minmax(0,1fr)_auto]">
        {/* Left: D-Pad */}
        <div className="justify-self-center lg:justify-self-start">
          <DPad onDirection={handleDirection} disabled={controlsLocked} />
        </div>

        {/* Center: Manual / Sequence */}
        <div className="min-w-0">
          <CenterPanel
            mode={mode}
            onModeChange={handleModeChange}
            profiles={sequenceProfiles}
            selectedProfileId={selectedProfileId}
            onSelectProfile={setSelectedProfileId}
            onLoadProfile={handleProfileLoad}
            onClearDraft={handleClearDraft}
            selectedActionKey={selectedActionKey}
            onSelectAction={setSelectedActionKey}
            durationInput={durationInput}
            onDurationInputChange={setDurationInput}
            onAddStep={handleAddStep}
            draftSteps={draftSteps}
            onMoveStep={handleMoveStep}
            onRemoveStep={handleRemoveStep}
            isPlaying={isPlaying}
            activeStepIndex={activeStepIndex}
            onPlay={handlePlaySequence}
            onStop={handleStopSequence}
          />
        </div>

        {/* Right: Rotation */}
        <div className="justify-self-center lg:justify-self-end">
          <RotationControl onRotate={handleRotate} disabled={controlsLocked} />
        </div>
      </div>

      {/* E-Stop */}
      <div className="px-[3vw] pb-[2vh]">
        <EStopButton onPress={handleEStop} />
      </div>
    </div>
  )
}
