import { useEffect, useRef, useState } from 'react'
import { getActionForStep, formatDuration } from '@/lib/sequenceProfiles'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

const S = {
  gap:     'clamp(4px, 1.2vh, 12px)',
  gapSm:   'clamp(3px, 0.8vh, 8px)',
  pad:     'clamp(6px, 1.4vh, 14px)',
  padSm:   'clamp(4px, 1vh, 10px)',
  fs:      'clamp(11px, 1.5vh, 14px)',
  fsXs:    'clamp(9px, 1.2vh, 12px)',
  fsLabel: 'clamp(8px, 1vh, 11px)',
  r:       'clamp(12px, 2vh, 18px)',
  rSm:     'clamp(8px, 1.4vh, 12px)',
  icon:    'clamp(24px, 3.8vh, 34px)',
}

// ─── Glyphs ───────────────────────────────────────────────────────────────────

function StepGlyph({ step }) {
  const action = getActionForStep(step)
  if (!action) return <span style={{ fontSize: 12, fontWeight: 900 }}>?</span>
  if (step.type === 'estop') {
    return <span style={{ fontSize: 13, fontWeight: 900, color: 'oklch(0.55 0.24 25)' }}>!</span>
  }
  if (step.type === 'rotate') {
    return (
      <svg width={14} height={14} viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
        style={{ transform: step.value === 'cw' ? 'none' : 'scaleX(-1)', flexShrink: 0 }}>
        <path d="M21 12a9 9 0 1 1-3-6.7" /><path d="M21 3v5.5h-5.5" />
      </svg>
    )
  }
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: `rotate(${action.rotation ?? 0}deg)`, flexShrink: 0 }}>
      <path d="M12 5l0 14" /><path d="M5 12l7-7 7 7" />
    </svg>
  )
}

// ─── Mode switch ──────────────────────────────────────────────────────────────

function ModeSwitch({ mode, onChange }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr',
      borderRadius: S.r, background: 'oklch(0.93 0.01 250)',
      padding: '3px', gap: '3px',
    }}>
      {[{ id: 'manual', label: 'Manual' }, { id: 'sequence', label: 'Secuencia' }].map((item) => (
        <button key={item.id} type="button" onClick={() => onChange(item.id)} style={{
          borderRadius: `calc(${S.r} - 3px)`,
          padding: `${S.padSm} ${S.pad}`,
          fontSize: S.fs, fontWeight: 600, border: 'none', cursor: 'pointer',
          transition: 'all 150ms',
          background: item.id === mode ? 'white' : 'transparent',
          color: item.id === mode ? 'oklch(0.15 0.02 250)' : 'oklch(0.50 0.02 250)',
          boxShadow: item.id === mode ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
        }}>
          {item.label}
        </button>
      ))}
    </div>
  )
}

// ─── Profile dropdown ─────────────────────────────────────────────────────────

function ProfileDropdown({ profiles, selectedId, onSelect, disabled }) {
  const [open, setOpen] = useState(false)
  const selected = profiles.find((p) => p.id === selectedId) ?? null

  return (
    <>
      {open && (
        <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 50 }} />
      )}
      <div style={{ position: 'relative', zIndex: 51, flex: 1, minWidth: 0 }}>
        <button
          type="button"
          onClick={() => !disabled && setOpen((v) => !v)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            width: '100%', gap: S.gapSm,
            borderRadius: S.r, border: '1px solid oklch(0.88 0.01 250)',
            background: 'white', padding: `${S.padSm} ${S.pad}`,
            fontSize: S.fs, fontWeight: 500, color: 'oklch(0.20 0.02 250)',
            cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1,
            textAlign: 'left',
          }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selected?.name ?? '—'}
          </span>
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 150ms', flexShrink: 0 }}>
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        {open && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
            background: 'white', borderRadius: S.r,
            border: '1px solid oklch(0.88 0.01 250)',
            boxShadow: '0 8px 24px rgba(18,42,94,0.14)',
            overflow: 'hidden', zIndex: 52,
          }}>
            {profiles.length === 0 ? (
              <div style={{ padding: S.pad, fontSize: S.fsXs, color: 'oklch(0.60 0.02 250)' }}>
                Sin perfiles
              </div>
            ) : (
              profiles.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => { onSelect(p.id); setOpen(false) }}
                  style={{
                    display: 'flex', alignItems: 'center', width: '100%', textAlign: 'left',
                    borderTop: i === 0 ? 'none' : '1px solid oklch(0.93 0.01 250)',
                    background: p.id === selectedId ? 'oklch(0.30 0.07 250 / 0.07)' : 'transparent',
                    padding: `${S.padSm} ${S.pad}`, border: 'none',
                    fontSize: S.fs, fontWeight: p.id === selectedId ? 600 : 400,
                    color: 'oklch(0.15 0.02 250)', cursor: 'pointer', gap: S.gapSm,
                  }}
                >
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.name}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </>
  )
}

// ─── Step row ─────────────────────────────────────────────────────────────────

function StepRow({ step, index, isCurrent, canMoveUp, canMoveDown, onMove, onRemove, onChangeDuration, disabled, readOnly }) {
  const action = getActionForStep(step)
  const isEstop = step.type === 'estop'

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: readOnly ? `${S.icon} minmax(0,1fr)` : `${S.icon} minmax(0,1fr) auto`,
      alignItems: 'center',
      gap: S.gapSm,
      borderRadius: S.r,
      border: `1px solid ${isCurrent ? 'oklch(0.30 0.07 250 / 0.4)' : isEstop ? 'oklch(0.55 0.24 25 / 0.2)' : 'oklch(0.88 0.01 250)'}`,
      background: isCurrent ? 'oklch(0.30 0.07 250 / 0.07)' : isEstop ? 'oklch(0.55 0.24 25 / 0.04)' : 'white',
      padding: S.padSm,
      transition: 'background 150ms, border-color 150ms',
    }}>
      <div style={{
        width: S.icon, height: S.icon,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        borderRadius: S.rSm,
        background: isCurrent ? 'oklch(0.30 0.07 250 / 0.12)' : 'oklch(0.93 0.01 250)',
        color: isEstop ? 'oklch(0.55 0.24 25)' : isCurrent ? 'oklch(0.30 0.07 250)' : 'oklch(0.45 0.02 250)',
        flexShrink: 0, gap: 1,
      }}>
        <span style={{ fontSize: S.fsLabel, fontWeight: 700, lineHeight: 1, color: 'oklch(0.65 0.02 250)' }}>
          {index + 1}
        </span>
        <StepGlyph step={step} />
      </div>

      <div style={{ minWidth: 0 }}>
        <p style={{
          fontSize: S.fs, fontWeight: 600, margin: 0, lineHeight: 1.2,
          color: isEstop ? 'oklch(0.55 0.24 25)' : 'oklch(0.15 0.02 250)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {action?.label ?? 'Paso'}
        </p>
        {!readOnly ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 1 }}>
            <input
              type="text" inputMode="decimal"
              defaultValue={+(step.durationMs / 1000).toFixed(1)}
              onBlur={(e) => {
                const ms = Math.max(100, Math.round((Number(e.target.value) || 0.1) * 1000))
                onChangeDuration(index, ms)
                e.target.value = +(ms / 1000).toFixed(1)
              }}
              onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
              disabled={disabled}
              style={{
                width: 40, borderRadius: S.rSm, border: '1px solid oklch(0.88 0.01 250)',
                background: 'white', padding: '1px 4px',
                fontSize: S.fsLabel, fontWeight: 700, color: 'oklch(0.25 0.02 250)',
                outline: 'none', opacity: disabled ? 0.6 : 1,
                WebkitAppearance: 'none', MozAppearance: 'textfield',
              }}
            />
            <span style={{ fontSize: S.fsLabel, color: 'oklch(0.55 0.02 250)' }}>s</span>
            {isCurrent && <span style={{ fontSize: S.fsLabel, color: 'oklch(0.30 0.07 250)' }}>· ejecutando</span>}
          </div>
        ) : (
          <p style={{ fontSize: S.fsXs, color: 'oklch(0.55 0.02 250)', margin: 0, lineHeight: 1.2 }}>
            {formatDuration(step.durationMs)}{isCurrent ? ' · ejecutando' : ''}
          </p>
        )}
      </div>

      {!readOnly && (
        <div style={{ display: 'flex', flexDirection: 'row', gap: 2, flexShrink: 0 }}>
          <button type="button" onClick={() => onMove(index, -1)} disabled={disabled || !canMoveUp} style={{
            borderRadius: S.rSm, border: '1px solid oklch(0.88 0.01 250)',
            background: 'white', color: 'oklch(0.50 0.02 250)',
            padding: '2px 7px', fontSize: 11, fontWeight: 700, lineHeight: 1.4,
            cursor: (disabled || !canMoveUp) ? 'not-allowed' : 'pointer',
            opacity: (disabled || !canMoveUp) ? 0.25 : 1,
          }}>↑</button>
          <button type="button" onClick={() => onMove(index, 1)} disabled={disabled || !canMoveDown} style={{
            borderRadius: S.rSm, border: '1px solid oklch(0.88 0.01 250)',
            background: 'white', color: 'oklch(0.50 0.02 250)',
            padding: '2px 7px', fontSize: 11, fontWeight: 700, lineHeight: 1.4,
            cursor: (disabled || !canMoveDown) ? 'not-allowed' : 'pointer',
            opacity: (disabled || !canMoveDown) ? 0.25 : 1,
          }}>↓</button>
          <button type="button" onClick={() => onRemove(index)} disabled={disabled} style={{
            borderRadius: S.rSm, border: '1px solid oklch(0.55 0.24 25 / 0.25)',
            background: 'oklch(0.55 0.24 25 / 0.06)', color: 'oklch(0.55 0.24 25)',
            padding: '2px 7px', fontSize: 11, fontWeight: 700, lineHeight: 1.4,
            cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.35 : 1,
          }}>×</button>
        </div>
      )}
    </div>
  )
}

// ─── Sequence editor ──────────────────────────────────────────────────────────

function SequenceEditor({
  sequences, selectedProfileId, onSelectProfile,
  isEditing, onStartEdit, onCancelEdit, onSaveEdit,
  editName, onEditNameChange,
  onCreateProfile, onDeleteProfile, onClearDraft,
  durationInput, onDurationInputChange, onAddEstopStep,
  draftSteps, onReorderSteps, onRemoveStep, onChangeDuration,
  isPlaying, activeStepIndex, onPlay, onStop,
  maxSteps,
}) {
  const [showNewForm, setShowNewForm]             = useState(false)
  const [newProfileName, setNewProfileName]       = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const atLimit = draftSteps.length >= maxSteps
  const selectedProfile = sequences.find((p) => p.id === selectedProfileId)

  const listRef = useRef(null)

  // Scroll to active step during playback
  useEffect(() => {
    if (!listRef.current || activeStepIndex === null) return
    const items = listRef.current.children
    if (items[activeStepIndex]) items[activeStepIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [activeStepIndex])

  // Scroll to newest step when adding (not playing)
  useEffect(() => {
    if (!listRef.current || isPlaying || draftSteps.length === 0) return
    const items = listRef.current.children
    const last = items[items.length - 1]
    if (last) last.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [draftSteps.length, isPlaying])

  const handleCreateSubmit = () => {
    if (!newProfileName.trim()) return
    onCreateProfile(newProfileName)
    setNewProfileName('')
    setShowNewForm(false)
  }

  // ── Shared step list ──────────────────────────────────────────────────────

  const stepList = (
    <div ref={listRef} style={{
      display: 'flex', flexDirection: 'column', gap: S.gapSm,
      maxHeight: 'clamp(60px, 26vh, 220px)', overflowY: 'auto', paddingRight: 2,
    }}>
      {draftSteps.length === 0 ? (
        <div style={{
          borderRadius: S.r, border: '1px dashed oklch(0.85 0.01 250)',
          background: 'white', padding: S.pad,
          textAlign: 'center', fontSize: S.fsXs, color: 'oklch(0.60 0.02 250)',
        }}>
          {isEditing ? 'Toca el DPad, los giros o E STOP para agregar pasos' : 'Sin pasos'}
        </div>
      ) : (
        draftSteps.map((step, index) => (
          <StepRow
            key={`${step.type}-${step.value ?? 'estop'}-${index}`}
            step={step} index={index}
            isCurrent={activeStepIndex === index}
            canMoveUp={index > 0}
            canMoveDown={index < draftSteps.length - 1}
            onMove={onReorderSteps}
            onRemove={onRemoveStep}
            onChangeDuration={onChangeDuration}
            disabled={isPlaying}
            readOnly={!isEditing}
          />
        ))
      )}
    </div>
  )

  // ── Edit mode ─────────────────────────────────────────────────────────────

  if (isEditing) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: S.gap }}>

        {/* Name input */}
        <input
          type="text"
          value={editName}
          onChange={(e) => onEditNameChange(e.target.value)}
          placeholder="Nombre de la secuencia…"
          style={{
            borderRadius: S.r, border: '1px solid oklch(0.88 0.01 250)',
            background: 'white', padding: `${S.padSm} ${S.pad}`,
            fontSize: S.fs, fontWeight: 600, color: 'oklch(0.15 0.02 250)', outline: 'none',
          }}
        />

        {/* Duration + E-STOP */}
        <div style={{
          display: 'flex', gap: S.gapSm, alignItems: 'center',
          borderRadius: S.r, border: '1px solid oklch(0.88 0.01 250)',
          background: 'oklch(0.97 0.005 250 / 0.8)', padding: S.pad,
        }}>
          <span style={{
            fontSize: S.fsLabel, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.14em', color: 'oklch(0.55 0.02 250)', flexShrink: 0,
          }}>Dur.</span>
          <input
            type="number" min="0.1" max="30" step="0.1" inputMode="decimal"
            value={durationInput}
            onChange={(e) => onDurationInputChange(e.target.value)}
            disabled={isPlaying}
            style={{
              flex: 1, borderRadius: S.rSm, border: '1px solid oklch(0.88 0.01 250)',
              background: 'white', padding: `${S.padSm} 8px`,
              fontSize: S.fs, fontWeight: 700, color: 'oklch(0.15 0.02 250)',
              outline: 'none', minWidth: 0, opacity: isPlaying ? 0.6 : 1,
            }}
          />
          <span style={{ fontSize: S.fsXs, color: 'oklch(0.55 0.02 250)', flexShrink: 0 }}>s</span>
        </div>

        {/* Hint */}
        <p style={{
          fontSize: S.fsLabel, color: atLimit ? 'oklch(0.55 0.24 25)' : 'oklch(0.55 0.02 250)',
          margin: 0, textAlign: 'center', fontWeight: atLimit ? 600 : 400,
        }}>
          {atLimit ? `Límite de ${maxSteps} pasos alcanzado` : 'Toca el DPad, los giros o E STOP para agregar pasos'}
        </p>

        {/* Step list */}
        <div style={{
          borderRadius: S.r, border: '1px solid oklch(0.88 0.01 250)',
          background: 'oklch(0.97 0.005 250 / 0.8)', padding: S.pad,
          display: 'flex', flexDirection: 'column', gap: S.gapSm,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: S.gapSm }}>
            <span style={{
              fontSize: S.fsLabel, fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.14em', color: 'oklch(0.50 0.02 250)',
            }}>
              {draftSteps.length}/{maxSteps} pasos
            </span>
            <div style={{ display: 'flex', gap: S.gapSm }}>
              <button type="button" onClick={onClearDraft} disabled={isPlaying || draftSteps.length === 0}
                style={{
                  borderRadius: S.r, border: '1px solid oklch(0.88 0.01 250)',
                  background: 'white', padding: `${S.padSm} ${S.pad}`,
                  fontSize: S.fsXs, fontWeight: 600, color: 'oklch(0.55 0.02 250)',
                  cursor: (isPlaying || draftSteps.length === 0) ? 'not-allowed' : 'pointer',
                  opacity: (isPlaying || draftSteps.length === 0) ? 0.5 : 1, flexShrink: 0,
                }}>
                Limpiar
              </button>
              <button type="button" onClick={onSaveEdit} disabled={isPlaying || !editName.trim()}
                style={{
                  borderRadius: S.r, border: 'none',
                  background: (!isPlaying && editName.trim()) ? 'oklch(0.30 0.07 250)' : 'oklch(0.88 0.01 250)',
                  color: (!isPlaying && editName.trim()) ? 'white' : 'oklch(0.60 0.02 250)',
                  padding: `${S.padSm} ${S.pad}`, fontSize: S.fsXs, fontWeight: 700,
                  cursor: (isPlaying || !editName.trim()) ? 'not-allowed' : 'pointer',
                  flexShrink: 0, transition: 'background 150ms',
                }}>
                Guardar
              </button>
              <button type="button" onClick={onCancelEdit} disabled={isPlaying}
                style={{
                  borderRadius: S.r, border: '1px solid oklch(0.88 0.01 250)',
                  background: 'white', padding: `${S.padSm} ${S.pad}`,
                  fontSize: S.fsXs, fontWeight: 600, color: 'oklch(0.50 0.02 250)',
                  cursor: isPlaying ? 'not-allowed' : 'pointer', opacity: isPlaying ? 0.5 : 1, flexShrink: 0,
                }}>
                Cancelar
              </button>
            </div>
          </div>
          {stepList}
        </div>
      </div>
    )
  }

  // ── View mode ─────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: S.gap }}>

      {/* Profile row: dropdown + nueva + trash + editar */}
      <div style={{ display: 'flex', gap: S.gapSm, alignItems: 'center' }}>
        <ProfileDropdown
          profiles={sequences}
          selectedId={selectedProfileId}
          onSelect={onSelectProfile}
          disabled={isPlaying}
        />
        <button
          type="button"
          onClick={() => setShowNewForm((v) => !v)}
          disabled={isPlaying}
          title="Nueva secuencia"
          style={{
            flexShrink: 0, borderRadius: S.r,
            border: '1px dashed oklch(0.78 0.03 250)',
            background: showNewForm ? 'oklch(0.93 0.01 250)' : 'transparent',
            color: 'oklch(0.40 0.04 250)',
            padding: `${S.padSm} 10px`,
            fontSize: S.fs, fontWeight: 700, lineHeight: 1,
            cursor: isPlaying ? 'not-allowed' : 'pointer', opacity: isPlaying ? 0.4 : 1,
          }}
        >
          ＋
        </button>
        {selectedProfile?.isUserCreated && (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isPlaying}
            title="Eliminar secuencia"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, borderRadius: S.r,
              border: '1px solid oklch(0.55 0.24 25 / 0.3)',
              background: 'oklch(0.55 0.24 25 / 0.06)', color: 'oklch(0.55 0.24 25)',
              padding: `${S.padSm} 10px`,
              cursor: isPlaying ? 'not-allowed' : 'pointer', opacity: isPlaying ? 0.5 : 1,
            }}
          >
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14H6L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4h6v2" />
            </svg>
          </button>
        )}
        {selectedProfile && (
          <button
            type="button"
            onClick={onStartEdit}
            disabled={isPlaying}
            style={{
              flexShrink: 0, borderRadius: S.r,
              border: '1px solid oklch(0.30 0.07 250 / 0.35)',
              background: 'oklch(0.30 0.07 250 / 0.07)', color: 'oklch(0.25 0.07 250)',
              padding: `${S.padSm} ${S.pad}`,
              fontSize: S.fsXs, fontWeight: 600,
              cursor: isPlaying ? 'not-allowed' : 'pointer', opacity: isPlaying ? 0.5 : 1,
            }}
          >
            Editar
          </button>
        )}
      </div>

      {/* Nueva secuencia form (expands below the row) */}
      {showNewForm && (
        <div style={{ display: 'flex', gap: S.gapSm }}>
          <input
            type="text"
            value={newProfileName}
            onChange={(e) => setNewProfileName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateSubmit()}
            placeholder="Nombre de la secuencia…"
            autoFocus
            style={{
              flex: 1, borderRadius: S.r, border: '1px solid oklch(0.88 0.01 250)',
              background: 'white', padding: `${S.padSm} ${S.pad}`,
              fontSize: S.fsXs, color: 'oklch(0.20 0.02 250)', outline: 'none',
            }}
          />
          <button type="button" onClick={handleCreateSubmit} disabled={!newProfileName.trim()}
            style={{
              borderRadius: S.r, border: 'none',
              background: newProfileName.trim() ? 'oklch(0.30 0.07 250)' : 'oklch(0.88 0.01 250)',
              color: newProfileName.trim() ? 'white' : 'oklch(0.60 0.02 250)',
              padding: `${S.padSm} ${S.pad}`, fontSize: S.fsXs, fontWeight: 700,
              cursor: newProfileName.trim() ? 'pointer' : 'not-allowed', flexShrink: 0,
            }}>
            Crear
          </button>
          <button type="button" onClick={() => { setShowNewForm(false); setNewProfileName('') }}
            style={{
              borderRadius: S.r, border: '1px solid oklch(0.88 0.01 250)',
              background: 'white', padding: `${S.padSm} 10px`,
              fontSize: S.fsXs, fontWeight: 700, color: 'oklch(0.50 0.02 250)',
              cursor: 'pointer', flexShrink: 0,
            }}>
            ✕
          </button>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar secuencia?</DialogTitle>
            <DialogDescription>
              Se eliminará <strong>"{selectedProfile?.name}"</strong> permanentemente.
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline">Cancelar</Button>} />
            <Button
              variant="destructive"
              onClick={() => {
                onDeleteProfile(selectedProfileId)
                setShowDeleteConfirm(false)
              }}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Step list + playback */}
      <div style={{
        borderRadius: S.r, border: '1px solid oklch(0.88 0.01 250)',
        background: 'oklch(0.97 0.005 250 / 0.8)', padding: S.pad,
        display: 'flex', flexDirection: 'column', gap: S.gapSm,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: S.gapSm }}>
          <span style={{
            fontSize: S.fsLabel, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.14em', color: 'oklch(0.50 0.02 250)',
          }}>
            {draftSteps.length}/{maxSteps} pasos
          </span>
          <div style={{ display: 'flex', gap: S.gapSm }}>
            <button type="button" onClick={onPlay}
              disabled={isPlaying || draftSteps.length === 0}
              style={{
                borderRadius: S.r, border: 'none',
                background: 'oklch(0.30 0.07 250)', color: 'white',
                padding: `${S.padSm} ${S.pad}`, fontSize: S.fsXs, fontWeight: 700,
                cursor: (isPlaying || draftSteps.length === 0) ? 'not-allowed' : 'pointer',
                opacity: (isPlaying || draftSteps.length === 0) ? 0.6 : 1, flexShrink: 0,
              }}>
              {isPlaying ? 'Reproduciendo…' : 'Reproducir'}
            </button>
            <button type="button" onClick={onStop} disabled={!isPlaying}
              style={{
                borderRadius: S.r, border: '1px solid oklch(0.88 0.01 250)',
                background: 'white', color: 'oklch(0.25 0.03 250)',
                padding: `${S.padSm} ${S.pad}`, fontSize: S.fsXs, fontWeight: 700,
                cursor: !isPlaying ? 'not-allowed' : 'pointer',
                opacity: !isPlaying ? 0.55 : 1, flexShrink: 0,
              }}>
              Detener
            </button>
          </div>
        </div>
        {stepList}
      </div>

    </div>
  )
}

// ─── CenterPanel ──────────────────────────────────────────────────────────────

export function CenterPanel({
  mode, onModeChange,
  sequences, selectedProfileId, onSelectProfile,
  isEditing, onStartEdit, onCancelEdit, onSaveEdit,
  editName, onEditNameChange,
  onCreateProfile, onDeleteProfile, onClearDraft,
  durationInput, onDurationInputChange, onAddEstopStep,
  draftSteps, onReorderSteps, onRemoveStep, onChangeDuration,
  isPlaying, activeStepIndex, onPlay, onStop,
  maxSteps,
}) {
  return (
    <section style={{
      width: 'var(--center-panel-width)',
      maxHeight: '100%',
      overflowY: 'auto', overflowX: 'hidden',
      borderRadius: 'clamp(16px, 2.8vh, 28px)',
      border: '1px solid oklch(0.90 0.01 250)',
      background: 'oklch(1 0 0 / 0.82)',
      boxShadow: '0 8px 28px oklch(0.30 0.07 250 / 0.09)',
      backdropFilter: 'blur(4px)',
      padding: S.pad,
      display: 'flex', flexDirection: 'column', gap: S.gap,
    }}>
      <ModeSwitch mode={mode} onChange={onModeChange} />

      {mode === 'manual' && (
        <p style={{ fontSize: S.fsXs, color: 'oklch(0.60 0.02 250)', margin: 0, textAlign: 'center' }}>
          Control directo activo · usa el DPad y los giros
        </p>
      )}

      {mode === 'sequence' && (
        <SequenceEditor
          sequences={sequences}
          selectedProfileId={selectedProfileId}
          onSelectProfile={onSelectProfile}
          isEditing={isEditing}
          onStartEdit={onStartEdit}
          onCancelEdit={onCancelEdit}
          onSaveEdit={onSaveEdit}
          editName={editName}
          onEditNameChange={onEditNameChange}
          onCreateProfile={onCreateProfile}
          onDeleteProfile={onDeleteProfile}
          onClearDraft={onClearDraft}
          durationInput={durationInput}
          onDurationInputChange={onDurationInputChange}
          onAddEstopStep={onAddEstopStep}
          draftSteps={draftSteps}
          onReorderSteps={onReorderSteps}
          onRemoveStep={onRemoveStep}
          onChangeDuration={onChangeDuration}
          isPlaying={isPlaying}
          activeStepIndex={activeStepIndex}
          onPlay={onPlay}
          onStop={onStop}
          maxSteps={maxSteps}
        />
      )}
    </section>
  )
}
