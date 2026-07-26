import { useEffect, useRef } from 'react'
import { computeSpinY } from '../../core/spinMotion'
import { broadcastSpinProgress } from '../../store/syncChannel'
import { BLUR_ANIMATION_NAME } from './blurAnimation'
import type { ReelSequence } from '../../types/spin'

interface UseSourceReelAnimationOptions {
  sequence: ReelSequence | null
  onLanded?: () => void
  /** Row height in px used for the translateY math — must match the caller's actual rendered row height. */
  itemHeightPx: number
  /** Which row index lands in the viewport's highlighted center. */
  centerIndex: number
  /** Skip the spin animation and jump straight to the resting position. */
  instant?: boolean
  /** Included in every progress broadcast so the presenter can tell which spin a message belongs to. */
  spinId: string | null
}

/**
 * Drives the reel for the CONTROL window — the single source of truth.
 * Computes the live position every tick from elapsed wall-clock time (see
 * core/spinMotion.computeSpinY), applies it locally, and broadcasts it so
 * the presenter window can mirror the exact position instead of running its
 * own independently-timed animation (which is what let the two drift apart
 * — see useMirrorReelAnimation). Uses setTimeout rather than
 * requestAnimationFrame so the loop keeps ticking (and broadcasting) even
 * if this window itself loses focus mid-spin.
 */
export function useSourceReelAnimation({
  sequence,
  onLanded,
  itemHeightPx,
  centerIndex,
  instant = false,
  spinId,
}: UseSourceReelAnimationOptions) {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const onLandedRef = useRef(onLanded)

  useEffect(() => {
    onLandedRef.current = onLanded
  }, [onLanded])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    if (!sequence) {
      track.style.animation = 'none'
      track.style.transform = 'translateY(0px)'
      return
    }

    const targetY = -(sequence.winnerIndex - centerIndex) * itemHeightPx

    if (instant) {
      track.style.animation = 'none'
      track.style.transform = `translateY(${targetY}px)`
      if (spinId) broadcastSpinProgress({ spinId, elapsedMs: sequence.durationMs })
      onLandedRef.current?.()
      return
    }

    track.style.animation = `${BLUR_ANIMATION_NAME} ${sequence.durationMs}ms ease-out forwards`

    const startedAt = performance.now()
    let timer = 0
    let landed = false

    const tick = () => {
      const elapsed = performance.now() - startedAt
      const y = computeSpinY(elapsed, { targetY, durationMs: sequence.durationMs })

      const current = trackRef.current
      if (current) current.style.transform = `translateY(${y}px)`
      if (spinId) broadcastSpinProgress({ spinId, elapsedMs: elapsed })

      if (elapsed >= sequence.durationMs) {
        if (!landed) {
          landed = true
          onLandedRef.current?.()
        }
        return
      }
      timer = window.setTimeout(tick, 16)
    }
    tick()

    return () => {
      window.clearTimeout(timer)
    }
  }, [sequence, itemHeightPx, centerIndex, instant, spinId])

  return trackRef
}
