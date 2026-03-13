import { cn } from '@/lib/utils'
import {
  SEQUENCE_ACTIONS,
  formatDuration,
  getActionForStep,
} from '@/lib/sequenceProfiles'

function ArrowGlyph({ rotation = 0, className = 'w-4 h-4' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <path d="M12 5l0 14" />
      <path d="M5 12l7-7 7 7" />
    </svg>
  )
}

function RotateGlyph({ clockwise, className = 'w-4 h-4' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: clockwise ? 'none' : 'scaleX(-1)' }}
    >
      <path d="M21 12a9 9 0 1 1-3-6.7" />
      <path d="M21 3v5.5h-5.5" />
    </svg>
  )
}

function ActionGlyph({ action, className }) {
  if (action.type === 'direction') {
    return <ArrowGlyph rotation={action.rotation} className={className} />
  }

  if (action.type === 'rotate') {
    return <RotateGlyph clockwise={action.value === 'cw'} className={className} />
  }

  return <span className={cn('font-black tracking-[0.2em]', className)}>!</span>
}

function ChevronGlyph({ expanded }) {
  return (
    <svg
      className={cn('h-4 w-4 transition-transform duration-150', expanded && 'rotate-180')}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

function ModeSwitch({ mode, onChange, disabled }) {
  const items = [
    { id: 'manual', label: 'Manual' },
    { id: 'sequence', label: 'Secuencia' },
  ]

  return (
    <div className="grid grid-cols-2 rounded-2xl bg-muted/60 p-1">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          disabled={disabled}
          className={cn(
            'rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-150',
            item.id === mode
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
            disabled && 'pointer-events-none opacity-60'
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

function ManualOverview({ sequenceCount }) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/60">
          Centro
        </p>
        <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-foreground">
          Control directo activo
        </h2>
        <p className="mt-1.5 max-w-xl text-sm leading-5 text-muted-foreground">
          Usa el pad lateral para maniobrar el robot. Cuando quieras automatizar un recorrido, cambia a
          <span className="font-medium text-foreground"> Secuencia </span>
          y arma los pasos desde este panel sin salirte del flujo actual.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-2xl border border-border/70 bg-card/80 p-3 shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Modo actual</p>
          <p className="mt-1.5 text-base font-semibold text-foreground">Manual</p>
          <p className="mt-1 text-sm text-muted-foreground">Respuesta inmediata desde los controles laterales.</p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card/80 p-3 shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Perfiles cargados</p>
          <p className="mt-1.5 text-base font-semibold text-foreground">{sequenceCount}</p>
          <p className="mt-1 text-sm text-muted-foreground">Secuencias listas para usar como base de trabajo.</p>
        </div>
      </div>
    </div>
  )
}

function ActionSelector({ selectedActionKey, onSelectAction, disabled }) {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {SEQUENCE_ACTIONS.map((action) => {
        const isSelected = action.key === selectedActionKey
        const isEstop = action.type === 'estop'

        return (
          <button
            key={action.key}
            type="button"
            onClick={() => onSelectAction(action.key)}
            disabled={disabled}
            className={cn(
              'rounded-2xl border px-3 py-3 text-left transition-all duration-150',
              isEstop
                ? 'border-destructive/20 bg-destructive/5 text-destructive'
                : 'border-border/70 bg-card/80 text-foreground/75 hover:border-primary/20 hover:bg-primary/5',
              isSelected && !isEstop && 'border-primary/30 bg-primary/10 text-primary shadow-sm',
              isSelected && isEstop && 'border-destructive/35 bg-destructive/12 shadow-sm',
              disabled && 'pointer-events-none opacity-55'
            )}
          >
            <div className="flex items-center justify-between">
              <ActionGlyph action={action} className={isEstop ? 'text-[14px]' : 'w-4 h-4'} />
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {action.group}
              </span>
            </div>
            <p className={cn('mt-4 text-sm font-semibold', isEstop ? 'text-destructive' : 'text-foreground')}>
              {action.label}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{action.shortLabel}</p>
          </button>
        )
      })}
    </div>
  )
}

function StepRow({ step, index, isCurrent, canMoveUp, canMoveDown, onMove, onRemove, disabled }) {
  const action = getActionForStep(step)
  const isEstop = step.type === 'estop'

  return (
    <div
      className={cn(
        'grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border px-3 py-3 transition-all duration-150',
        isCurrent ? 'border-primary/35 bg-primary/8 shadow-sm' : 'border-border/70 bg-card/75',
        isEstop && !isCurrent && 'border-destructive/15 bg-destructive/5'
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/70 text-muted-foreground">
        <ActionGlyph action={action} className={isEstop ? 'text-[13px]' : 'w-4 h-4'} />
      </div>

      <div className="min-w-0">
        <p className={cn('truncate text-sm font-semibold', isEstop ? 'text-destructive' : 'text-foreground')}>
          {action?.label || 'Paso'}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatDuration(step.durationMs)} {isCurrent ? '• ejecutando' : ''}
        </p>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onMove(index, -1)}
          disabled={disabled || !canMoveUp}
          className="rounded-lg border border-border/70 bg-background px-2 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-35"
        >
          ↑
        </button>
        <button
          type="button"
          onClick={() => onMove(index, 1)}
          disabled={disabled || !canMoveDown}
          className="rounded-lg border border-border/70 bg-background px-2 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-35"
        >
          ↓
        </button>
        <button
          type="button"
          onClick={() => onRemove(index)}
          disabled={disabled}
          className="rounded-lg border border-destructive/20 bg-destructive/5 px-2 py-1 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/10 disabled:pointer-events-none disabled:opacity-35"
        >
          Quitar
        </button>
      </div>
    </div>
  )
}

function SequenceEditor({
  profiles,
  selectedProfileId,
  onSelectProfile,
  onLoadProfile,
  onClearDraft,
  selectedActionKey,
  onSelectAction,
  durationInput,
  onDurationInputChange,
  onAddStep,
  draftSteps,
  onMoveStep,
  onRemoveStep,
  isPlaying,
  activeStepIndex,
  onPlay,
  onStop,
}) {
  return (
    <div className="space-y-3">
      <div className="grid gap-2 xl:grid-cols-[minmax(0,1fr)_auto_auto]">
        <label className="space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Perfil base
          </span>
          <select
            value={selectedProfileId}
            onChange={(event) => onSelectProfile(event.target.value)}
            disabled={isPlaying || profiles.length === 0}
            className="w-full rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm font-medium text-foreground shadow-sm outline-none transition-colors focus:border-primary/35 disabled:pointer-events-none disabled:opacity-60"
          >
            {profiles.length === 0 ? (
              <option value="">Sin perfiles</option>
            ) : (
              profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name}
                </option>
              ))
            )}
          </select>
        </label>

        <button
          type="button"
          onClick={onLoadProfile}
          disabled={isPlaying || profiles.length === 0}
          className="self-end rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted/40 disabled:pointer-events-none disabled:opacity-60"
        >
          Cargar perfil
        </button>

        <button
          type="button"
          onClick={onClearDraft}
          disabled={isPlaying}
          className="self-end rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-60"
        >
          Limpiar borrador
        </button>
      </div>

      <div className="rounded-3xl border border-border/70 bg-background/70 p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Constructor
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Primero elige el movimiento y luego define cuánto tiempo debe durar.
            </p>
          </div>
          <div className="rounded-full bg-muted/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {draftSteps.length} pasos
          </div>
        </div>

        <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1fr)_190px]">
          <ActionSelector
            selectedActionKey={selectedActionKey}
            onSelectAction={onSelectAction}
            disabled={isPlaying}
          />

          <div className="rounded-2xl border border-border/70 bg-card/80 p-3 shadow-sm">
            <label className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Duracion
            </label>
            <div className="mt-2 flex items-end gap-2">
              <input
                type="number"
                min="100"
                step="100"
                inputMode="numeric"
                value={durationInput}
                onChange={(event) => onDurationInputChange(event.target.value)}
                disabled={isPlaying}
                className="w-full rounded-2xl border border-border/70 bg-background px-4 py-3 text-lg font-semibold text-foreground outline-none transition-colors focus:border-primary/35 disabled:pointer-events-none disabled:opacity-60"
              />
              <span className="pb-3 text-sm font-medium text-muted-foreground">ms</span>
            </div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Usa valores enteros positivos. Recomendado: 300 a 3000 ms por paso.
            </p>

            <button
              type="button"
              onClick={onAddStep}
              disabled={isPlaying}
              className="mt-4 w-full rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:brightness-105 disabled:pointer-events-none disabled:opacity-60"
            >
              Agregar paso
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-border/70 bg-background/70 p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Lista
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Reordena, revisa tiempos y luego reproduce la secuencia desde aquí.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onPlay}
              disabled={isPlaying || draftSteps.length === 0}
              className="rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:brightness-105 disabled:pointer-events-none disabled:opacity-60"
            >
              Reproducir
            </button>
            <button
              type="button"
              onClick={onStop}
              disabled={!isPlaying}
              className="rounded-2xl border border-border/70 bg-card px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted/40 disabled:pointer-events-none disabled:opacity-60"
            >
              Detener
            </button>
          </div>
        </div>

        <div className="mt-3 max-h-[200px] space-y-2 overflow-auto pr-1">
          {draftSteps.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/80 bg-card/50 px-4 py-8 text-center text-sm text-muted-foreground">
              Todavia no hay pasos. Selecciona un movimiento y agrega la duracion para comenzar.
            </div>
          ) : (
            draftSteps.map((step, index) => (
              <StepRow
                key={`${step.type}-${step.value || 'estop'}-${index}`}
                step={step}
                index={index}
                isCurrent={activeStepIndex === index}
                canMoveUp={index > 0}
                canMoveDown={index < draftSteps.length - 1}
                onMove={onMoveStep}
                onRemove={onRemoveStep}
                disabled={isPlaying}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export function CenterPanel(props) {
  const {
    mode,
    onModeChange,
    expanded,
    onToggleExpanded,
    profiles,
    selectedProfileId,
    onSelectProfile,
    onLoadProfile,
    onClearDraft,
    selectedActionKey,
    onSelectAction,
    durationInput,
    onDurationInputChange,
    onAddStep,
    draftSteps,
    onMoveStep,
    onRemoveStep,
    isPlaying,
    activeStepIndex,
    onPlay,
    onStop,
  } = props

  return (
    <section
      className="w-full rounded-[2rem] border border-border/70 bg-card/75 p-3 shadow-[0_12px_30px_rgba(18,42,94,0.08)] backdrop-blur-[2px] sm:p-4"
      style={{
        width: 'var(--center-panel-width)',
        maxHeight: 'min(100%, calc(100dvh - var(--btn-size) * 2.5 - 5.5rem))',
      }}
    >
      <div className="space-y-3 overflow-y-auto pr-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/60">
              Centro operativo
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Panel desplegable para control manual y secuencias.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleExpanded}
              aria-expanded={expanded}
              className="inline-flex items-center gap-2 rounded-2xl border border-border/70 bg-background px-3 py-2 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted/40"
            >
              {expanded ? 'Ocultar' : 'Desplegar'}
              <ChevronGlyph expanded={expanded} />
            </button>
          </div>
          <div className="min-w-[200px]">
            <ModeSwitch mode={mode} onChange={onModeChange} disabled={false} />
          </div>
        </div>

        {expanded ? (
          mode === 'manual' ? (
            <ManualOverview sequenceCount={profiles.length} />
          ) : (
            <SequenceEditor
              profiles={profiles}
              selectedProfileId={selectedProfileId}
              onSelectProfile={onSelectProfile}
              onLoadProfile={onLoadProfile}
              onClearDraft={onClearDraft}
              selectedActionKey={selectedActionKey}
              onSelectAction={onSelectAction}
              durationInput={durationInput}
              onDurationInputChange={onDurationInputChange}
              onAddStep={onAddStep}
              draftSteps={draftSteps}
              onMoveStep={onMoveStep}
              onRemoveStep={onRemoveStep}
              isPlaying={isPlaying}
              activeStepIndex={activeStepIndex}
              onPlay={onPlay}
              onStop={onStop}
            />
          )
        ) : (
          <div className="rounded-2xl border border-dashed border-border/80 bg-background/45 px-4 py-3 text-sm text-muted-foreground">
            {mode === 'manual'
              ? 'Manual listo. Despliega este panel si quieres ver el estado o cambiar a secuencia.'
              : 'Secuencia lista. Despliega este panel para editar pasos, cargar perfiles o reproducir.'}
          </div>
        )}
      </div>
    </section>
  )
}
