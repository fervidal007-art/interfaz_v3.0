import { useCallback, useEffect, useRef, useState } from 'react'
import { CenterPanel } from '@/components/CenterPanel/CenterPanel'
import { DPad } from '@/components/DPad/DPad'
import { RotationControl } from '@/components/RotationControl/RotationControl'
import { useTouch } from '@/hooks/useTouch'
import { cloneSequenceSteps } from '@/lib/sequenceProfiles'
import { cn } from '@/lib/utils'

const MAX_STEPS = 10
const API_BASE = import.meta.env.VITE_API_URL ?? `http://${window.location.hostname}:8000`

function makeDurationMs(input) {
  return Math.max(100, Math.round((Number(input) || 1.2) * 1000))
}

async function apiFetch(path, options) {
  const res = await fetch(`${API_BASE}${path}`, options)
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`)
  return res.json()
}

function EStopButton({ onPress, onRelease }) {
  const { isPressed, ref } = useTouch({ onPress, onRelease })
  return (
    <button
      ref={ref}
      className={cn(
        'w-full rounded-2xl border-2 border-destructive bg-destructive text-destructive-foreground font-bold tracking-widest uppercase shadow-lg transition-all duration-100 select-none',
        isPressed && 'scale-[0.97] shadow-inner brightness-90'
      )}
      style={{ height: 'calc(var(--btn-size) * 1.1)', fontSize: 'calc(var(--btn-size) * 0.3)' }}
    >
      E-STOP
    </button>
  )
}

export function Gamepad({ send }) {
  const [sequences, setSequences]           = useState([])
  const [selectedProfileId, setSelectedProfileId] = useState('')
  const [draftSteps, setDraftSteps]         = useState([])
  const [originalSteps, setOriginalSteps]   = useState([])
  const [editName, setEditName]             = useState('')
  const [isEditing, setIsEditing]           = useState(false)
  const [isNewProfile, setIsNewProfile]     = useState(false)
  const [mode, setMode] = useState(() => {
    const tab = new URLSearchParams(window.location.search).get('tab')
    return tab === 'secuencia' ? 'sequence' : 'manual'
  })
  const [durationInput, setDurationInput]   = useState('1.2')
  const [isPlaying, setIsPlaying]           = useState(false)
  const [activeStepIndex, setActiveStepIndex] = useState(null)

  const timeoutRef    = useRef(null)
  const activeStepRef = useRef(null)

  // ─── API helpers ─────────────────────────────────────────────────────────────

  const loadSequences = useCallback(async () => {
    try {
      const data = await apiFetch('/sequences')
      const seqs = data.map((s) => ({ ...s, isUserCreated: true }))
      setSequences(seqs)
      return seqs
    } catch {
      return []
    }
  }, [])

  useEffect(() => {
    loadSequences().then((seqs) => {
      if (seqs.length > 0) {
        const first = seqs[0]
        setSelectedProfileId(first.id)
        setDraftSteps(cloneSequenceSteps((first.steps || []).slice(0, MAX_STEPS)))
      }
    })
  }, [loadSequences])

  // ─── Playback ─────────────────────────────────────────────────────────────

  const sendStepState = useCallback((step, pressed) => {
    if (!step) return
    if (step.type === 'direction') { send({ type: 'direction', direction: step.value, pressed }); return }
    if (step.type === 'rotate')    { send({ type: 'rotate',    direction: step.value, pressed }); return }
    send({ type: 'estop', pressed })
  }, [send])

  const cancelSequencePlayback = useCallback(({ releaseActive = true } = {}) => {
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null }
    if (releaseActive && activeStepRef.current) sendStepState(activeStepRef.current, false)
    activeStepRef.current = null
    setIsPlaying(false)
    setActiveStepIndex(null)
  }, [sendStepState])

  function playSequence(steps, index = 0) {
    if (index >= steps.length) { cancelSequencePlayback({ releaseActive: false }); return }
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

  // ─── Profile handlers ─────────────────────────────────────────────────────

  const handleSelectProfile = (id) => {
    if (isEditing) return
    const profile = sequences.find((p) => p.id === id)
    setSelectedProfileId(id)
    setDraftSteps(cloneSequenceSteps((profile?.steps || []).slice(0, MAX_STEPS)))
  }

  const handleStartEdit = () => {
    const profile = sequences.find((p) => p.id === selectedProfileId)
    setEditName(profile?.name ?? '')
    setOriginalSteps(cloneSequenceSteps(draftSteps))
    setIsNewProfile(false)
    setIsEditing(true)
  }

  const handleCancelEdit = async () => {
    if (isNewProfile) {
      // Delete the profile that was just created
      try { await apiFetch(`/sequences/${selectedProfileId}`, { method: 'DELETE' }) } catch {}
      const seqs = await loadSequences()
      const first = seqs[0] ?? null
      setSelectedProfileId(first?.id ?? '')
      setDraftSteps(cloneSequenceSteps((first?.steps || []).slice(0, MAX_STEPS)))
    } else {
      setDraftSteps(cloneSequenceSteps(originalSteps))
    }
    setIsEditing(false)
    setIsNewProfile(false)
    setEditName('')
  }

  const handleSaveEdit = async () => {
    const profile = sequences.find((p) => p.id === selectedProfileId)
    if (!profile) return
    const updated = { ...profile, name: editName.trim() || profile.name, steps: draftSteps }
    try {
      await apiFetch(`/sequences/${selectedProfileId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      })
      const seqs = await loadSequences()
      const saved = seqs.find((p) => p.id === selectedProfileId)
      setDraftSteps(cloneSequenceSteps((saved?.steps || []).slice(0, MAX_STEPS)))
      setIsEditing(false)
      setIsNewProfile(false)
      setEditName('')
    } catch (err) {
      console.error('Save failed', err)
    }
  }

  const handleCreateProfile = async (name) => {
    const id = `seq-${Date.now()}`
    const newProfile = { id, name: name.trim() || 'Nueva secuencia', steps: [] }
    try {
      const created = await apiFetch('/sequences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProfile),
      })
      await loadSequences()
      setSelectedProfileId(created.id)
      setDraftSteps([])
      setOriginalSteps([])
      setEditName(created.name)
      setIsNewProfile(true)
      setIsEditing(true)
    } catch (err) {
      console.error('Create failed', err)
    }
  }

  const handleDeleteProfile = async (profileId) => {
    try {
      await apiFetch(`/sequences/${profileId}`, { method: 'DELETE' })
      const seqs = await loadSequences()
      if (selectedProfileId === profileId) {
        const first = seqs[0] ?? null
        setSelectedProfileId(first?.id ?? '')
        setDraftSteps(cloneSequenceSteps((first?.steps || []).slice(0, MAX_STEPS)))
      }
    } catch (err) {
      console.error('Delete failed', err)
    }
  }

  // ─── Control handlers ─────────────────────────────────────────────────────

  // In sequence mode: never send to robot. Only add steps when editing + profile selected.
  const handleDirection = (direction, pressed) => {
    if (mode === 'sequence') {
      if (isEditing && selectedProfileId && !isPlaying && pressed) {
        setDraftSteps((current) => {
          if (current.length >= MAX_STEPS) return current
          return [...current, { type: 'direction', value: direction, durationMs: makeDurationMs(durationInput) }]
        })
      }
      return
    }
    send({ type: 'direction', direction, pressed })
  }

  const handleRotate = (direction, pressed) => {
    if (mode === 'sequence') {
      if (isEditing && selectedProfileId && !isPlaying && pressed) {
        setDraftSteps((current) => {
          if (current.length >= MAX_STEPS) return current
          return [...current, { type: 'rotate', value: direction, durationMs: makeDurationMs(durationInput) }]
        })
      }
      return
    }
    send({ type: 'rotate', direction, pressed })
  }

  const handleEStop = () => {
    if (isPlaying) cancelSequencePlayback({ releaseActive: activeStepRef.current?.type !== 'estop' })
    send({ type: 'estop', pressed: true })
  }

  const handleClearDraft = () => {
    cancelSequencePlayback()
    setDraftSteps([])
  }

  const handleAddEstopStep = () => {
    setDraftSteps((current) => {
      if (current.length >= MAX_STEPS) return current
      return [...current, { type: 'estop', durationMs: makeDurationMs(durationInput) }]
    })
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
    setDraftSteps((current) => current.filter((_, i) => i !== index))
  }

  const handleChangeDuration = (index, durationMs) => {
    setDraftSteps((current) =>
      current.map((step, i) => i === index ? { ...step, durationMs } : step)
    )
  }

  const handleReorderSteps = (from, to) => {
    setDraftSteps((current) => {
      const next = [...current]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
  }

  const handlePlaySequence = () => {
    if (draftSteps.length === 0) return
    cancelSequencePlayback({ releaseActive: false })
    setIsPlaying(true)
    playSequence(draftSteps, 0)
  }

  const handleStopSequence = () => cancelSequencePlayback()

  const handleModeChange = (nextMode) => {
    if (nextMode === mode) return
    const url = new URL(window.location.href)
    url.searchParams.set('tab', nextMode === 'sequence' ? 'secuencia' : 'manual')
    window.history.replaceState({}, '', url)
    if (nextMode === 'manual') {
      cancelSequencePlayback()
      if (isEditing) handleCancelEdit()
    }
    setMode(nextMode)
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      className="flex-1 flex flex-col touch-none select-none overflow-hidden"
      style={{
        '--btn-size': 'clamp(48px, min(14vw, 12vh), 110px)',
        '--center-panel-width': 'min(100%, clamp(250px, 34vw, 520px))',
      }}
    >
      <div
        className="flex-1 min-h-0 grid items-center px-[3vw] py-[1.8vh]"
        style={{ gridTemplateColumns: 'auto minmax(0, 1fr) auto', columnGap: 'clamp(12px, 2vw, 26px)' }}
      >
        <div className="justify-self-start">
          <DPad onDirection={handleDirection} disabled={isPlaying || (mode === 'sequence' && !isEditing)} />
        </div>

        <div className="min-w-0 flex justify-center px-[1vw]">
          <CenterPanel
            mode={mode}
            onModeChange={handleModeChange}
            sequences={sequences}
            selectedProfileId={selectedProfileId}
            onSelectProfile={handleSelectProfile}
            isEditing={isEditing}
            onStartEdit={handleStartEdit}
            onCancelEdit={handleCancelEdit}
            onSaveEdit={handleSaveEdit}
            editName={editName}
            onEditNameChange={setEditName}
            onCreateProfile={handleCreateProfile}
            onDeleteProfile={handleDeleteProfile}
            onClearDraft={handleClearDraft}
            durationInput={durationInput}
            onDurationInputChange={setDurationInput}
            onAddEstopStep={handleAddEstopStep}
            draftSteps={draftSteps}
            onReorderSteps={handleMoveStep}
            onRemoveStep={handleRemoveStep}
            onChangeDuration={handleChangeDuration}
            isPlaying={isPlaying}
            activeStepIndex={activeStepIndex}
            onPlay={handlePlaySequence}
            onStop={handleStopSequence}
            maxSteps={MAX_STEPS}
          />
        </div>

        <div className="justify-self-end">
          <RotationControl onRotate={handleRotate} disabled={isPlaying || (mode === 'sequence' && !isEditing)} />
        </div>
      </div>

      <div className="px-[3vw] pb-[2vh]">
        <EStopButton onPress={handleEStop} />
      </div>
    </div>
  )
}
