import { useState, useCallback, useRef, useEffect } from 'react'

export function useTouch({ onPress, onRelease, disabled = false } = {}) {
  const [isPressed, setIsPressed] = useState(false)
  const pressedRef = useRef(false)
  const elRef = useRef(null)

  const press = useCallback(() => {
    if (disabled) return
    if (pressedRef.current) return
    pressedRef.current = true
    setIsPressed(true)
    onPress?.()
  }, [disabled, onPress])

  const release = useCallback(() => {
    if (!pressedRef.current) return
    pressedRef.current = false
    setIsPressed(false)
    onRelease?.()
  }, [onRelease])

  useEffect(() => {
    const el = elRef.current
    if (!el) return

    const onTouchStart = (e) => {
      if (disabled) return
      e.preventDefault()
      press()
    }

    const onTouchEnd = (e) => {
      e.preventDefault()
      release()
    }

    const onTouchMove = (e) => {
      // If finger leaves the button bounds, release
      const touch = e.touches[0]
      if (!touch) return
      const rect = el.getBoundingClientRect()
      const inside =
        touch.clientX >= rect.left &&
        touch.clientX <= rect.right &&
        touch.clientY >= rect.top &&
        touch.clientY <= rect.bottom
      if (!inside) release()
    }

    // pointer events for desktop/mouse testing
    const onPointerDown = (e) => {
      if (disabled) return
      if (e.pointerType === 'touch') return // handled by touch events
      e.preventDefault()
      el.setPointerCapture(e.pointerId)
      press()
    }

    const onPointerUp = (e) => {
      if (e.pointerType === 'touch') return
      release()
    }

    // { passive: false } so preventDefault works
    el.addEventListener('touchstart', onTouchStart, { passive: false })
    el.addEventListener('touchend', onTouchEnd, { passive: false })
    el.addEventListener('touchcancel', onTouchEnd, { passive: false })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('pointerup', onPointerUp)
    el.addEventListener('pointercancel', onPointerUp)

    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('touchcancel', onTouchEnd)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('pointerup', onPointerUp)
      el.removeEventListener('pointercancel', onPointerUp)
    }
  }, [disabled, press, release])

  // ref callback to attach to the button element
  const refCallback = useCallback((node) => {
    elRef.current = node
  }, [])

  return { isPressed, ref: refCallback }
}
