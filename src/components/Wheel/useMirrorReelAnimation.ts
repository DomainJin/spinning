import { useEffect, useRef } from 'react'
import { computeSpinY } from '../../core/spinMotion'
import { subscribeSyncChannel } from '../../store/syncChannel'
import { BLUR_ANIMATION_NAME } from './blurAnimation'
import type { ReelSequence } from '../../types/spin'

interface UseMirrorReelAnimationOptions {
  sequence: ReelSequence | null
  itemHeightPx: number
  centerIndex: number
  /** Land instantly with no animation — a presenter that joined after this spin already resolved elsewhere. */
  instant?: boolean
  /** Which spin's progress broadcasts to apply — messages for any other spinId are ignored. */
  spinId: string | null
}

/**
 * Drives the reel for the PRESENTER window — never measures its own time.
 * On each broadcast from the control window (see useSourceReelAnimation) it
 * re-evaluates the same pure motion function, core/spinMotion.computeSpinY,
 * using the *received* elapsedMs and this window's *own* row size/center —
 * not a raw pixel position, because the presenter renders the reel at a
 * completely different scale (fewer, larger rows for the LED wall) than the
 * control window's preview, so a pixel value computed for one would land
 * nowhere near the right row on the other. The elapsed time itself is never
 * measured locally — it always comes from the control window's clock — so
 * the two can't drift the way two separately-timed animations would.
 */
export function useMirrorReelAnimation({
  sequence,
  itemHeightPx,
  centerIndex,
  instant = false,
  spinId,
}: UseMirrorReelAnimationOptions) {
  const trackRef = useRef<HTMLDivElement | null>(null)

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
      return
    }

    track.style.animation = `${BLUR_ANIMATION_NAME} ${sequence.durationMs}ms ease-out forwards`
    track.style.transform = 'translateY(0px)'

    if (!spinId) return

    return subscribeSyncChannel((message) => {
      if (message.type !== 'spin-progress') return
      if (message.payload.spinId !== spinId) return
      const y = computeSpinY(message.payload.elapsedMs, { targetY, durationMs: sequence.durationMs })
      const current = trackRef.current
      if (current) current.style.transform = `translateY(${y}px)`
    })
  }, [sequence, itemHeightPx, centerIndex, instant, spinId])

  return trackRef
}
