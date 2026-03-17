const DIRECTION_ACTIONS = [
  { key: 'nw', type: 'direction', value: 'nw', label: 'Diagonal sup. izq.', shortLabel: '↖', rotation: -45, group: 'direction' },
  { key: 'n', type: 'direction', value: 'n', label: 'Adelante', shortLabel: '↑', rotation: 0, group: 'direction' },
  { key: 'ne', type: 'direction', value: 'ne', label: 'Diagonal sup. der.', shortLabel: '↗', rotation: 45, group: 'direction' },
  { key: 'w', type: 'direction', value: 'w', label: 'Izquierda', shortLabel: '←', rotation: -90, group: 'direction' },
  { key: 'e', type: 'direction', value: 'e', label: 'Derecha', shortLabel: '→', rotation: 90, group: 'direction' },
  { key: 'sw', type: 'direction', value: 'sw', label: 'Diagonal inf. izq.', shortLabel: '↙', rotation: -135, group: 'direction' },
  { key: 's', type: 'direction', value: 's', label: 'Reversa', shortLabel: '↓', rotation: 180, group: 'direction' },
  { key: 'se', type: 'direction', value: 'se', label: 'Diagonal inf. der.', shortLabel: '↘', rotation: 135, group: 'direction' },
]

const ROTATION_ACTIONS = [
  { key: 'ccw', type: 'rotate', value: 'ccw', label: 'Giro izquierda', shortLabel: '⟲', group: 'rotate' },
  { key: 'cw', type: 'rotate', value: 'cw', label: 'Giro derecha', shortLabel: '⟳', group: 'rotate' },
]

const ESTOP_ACTION = {
  key: 'estop',
  type: 'estop',
  label: 'E-STOP',
  shortLabel: 'STOP',
  group: 'safety',
}

export const SEQUENCE_ACTIONS = [
  ...DIRECTION_ACTIONS,
  ...ROTATION_ACTIONS,
  ESTOP_ACTION,
]

const VALID_DIRECTIONS = new Set(DIRECTION_ACTIONS.map((action) => action.value))
const VALID_ROTATIONS = new Set(ROTATION_ACTIONS.map((action) => action.value))
const ACTIONS_BY_KEY = new Map(SEQUENCE_ACTIONS.map((action) => [action.key, action]))


export function cloneSequenceSteps(steps = []) {
  return steps.map((step) => (step.type === 'estop'
    ? { type: 'estop', durationMs: step.durationMs }
    : { type: step.type, value: step.value, durationMs: step.durationMs }))
}

export function buildStepFromAction(actionKey, durationMs) {
  const action = ACTIONS_BY_KEY.get(actionKey)
  if (!action) return null

  const normalizedDuration = Math.max(100, Math.round(Number(durationMs) || 0))

  if (action.type === 'estop') {
    return {
      type: 'estop',
      durationMs: normalizedDuration,
    }
  }

  return {
    type: action.type,
    value: action.value,
    durationMs: normalizedDuration,
  }
}

export function getActionForStep(step) {
  if (!step) return null

  if (step.type === 'estop') {
    return ESTOP_ACTION
  }

  return SEQUENCE_ACTIONS.find((action) => action.type === step.type && action.value === step.value) || null
}

export function formatDuration(durationMs) {
  if (durationMs >= 1000) {
    const seconds = durationMs / 1000
    return `${Number.isInteger(seconds) ? seconds : seconds.toFixed(1)} s`
  }

  return `${durationMs} ms`
}
