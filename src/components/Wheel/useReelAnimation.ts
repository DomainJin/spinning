import { useEffect, useRef } from 'react'
import { WHEEL_CONFIG } from '../../config/wheelConfig'
import type { ReelSequence } from '../../types/spin'

/** Must match the @keyframes name in src/styles/global.css exactly. */
const BLUR_ANIMATION_NAME = 'reel-blur-spin'

interface UseReelAnimationOptions {
  sequence: ReelSequence | null
  onLanded?: () => void
  /** Row height in px used for the translateY math — must match the caller's actual rendered row height. */
  itemHeightPx: number
  /** Which row index lands in the viewport's highlighted center — must match whatever positions the highlight element, or the reel lands visually off from where the pointer marks. */
  centerIndex: number
  /** Skip the spin animation and jump straight to the resting position (e.g. a presenter catching up to an already-decided spin). */
  instant?: boolean
}

/**
 * Drives the reel's transform imperatively via a ref instead of React state,
 * so the CSS transition runs smoothly without a re-render on every frame.
 * A fresh `sequence` reference re-triggers the "snap to top, then animate to
 * target" sequence; `sequence === null` just snaps back to the idle view.
 *
 * The spin itself runs as two chained CSS transitions — a fast constant-speed
 * "cruise" covering most of the distance, then a short eased "decel" phase
 * covering the rest — rather than one easing curve for the whole duration.
 * A single curve strong enough to *look* fast at the start visually finishes
 * almost all the movement in the first ~15% of the time and then sits nearly
 * still for the remainder while still waiting on transitionend; chaining two
 * transitions gives exact control over when the visible slow-down starts.
 */
export function useReelAnimation({
  sequence,
  onLanded,
  itemHeightPx,
  centerIndex,
  instant = false,
}: UseReelAnimationOptions) {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const onLandedRef = useRef(onLanded)

  useEffect(() => {
    onLandedRef.current = onLanded
  }, [onLanded])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    if (!sequence) {
      track.style.transition = 'none'
      track.style.animation = 'none'
      track.style.transform = 'translateY(0px)'
      return
    }

    const targetY = -(sequence.winnerIndex - centerIndex) * itemHeightPx

    if (instant) {
      track.style.transition = 'none'
      track.style.animation = 'none'
      track.style.transform = `translateY(${targetY}px)`
      onLandedRef.current?.()
      return
    }

    track.style.transition = 'none'
    track.style.animation = 'none'
    track.style.transform = 'translateY(0px)'
    // Force the browser to commit the transition-less reset before re-enabling it below.
    void track.offsetHeight

    const decelDurationMs = sequence.durationMs * WHEEL_CONFIG.decelTimeFraction
    const cruiseDurationMs = sequence.durationMs - decelDurationMs
    const cruiseY = targetY * (1 - WHEEL_CONFIG.decelDistanceFraction)

    let frame1 = 0
    let frame2 = 0
    let decelStarted = false

    const startDecelPhase = () => {
      const current = trackRef.current
      if (!current || decelStarted) return
      decelStarted = true
      current.style.transition = `transform ${decelDurationMs}ms ${WHEEL_CONFIG.decelEasing}`
      current.style.transform = `translateY(${targetY}px)`
    }

    const handleTransitionEnd = (event: TransitionEvent) => {
      if (event.propertyName !== 'transform') return
      if (!decelStarted) {
        startDecelPhase()
      } else {
        onLandedRef.current?.()
      }
    }
    track.addEventListener('transitionend', handleTransitionEnd)

    frame1 = requestAnimationFrame(() => {
      frame2 = requestAnimationFrame(() => {
        const current = trackRef.current
        if (!current) return
        current.style.transition = `transform ${cruiseDurationMs}ms linear`
        current.style.animation = `${BLUR_ANIMATION_NAME} ${sequence.durationMs}ms ease-out forwards`
        current.style.transform = `translateY(${cruiseY}px)`
      })
    })

    return () => {
      cancelAnimationFrame(frame1)
      cancelAnimationFrame(frame2)
      track.removeEventListener('transitionend', handleTransitionEnd)
    }
  }, [sequence, itemHeightPx, centerIndex, instant])

  return trackRef
}
