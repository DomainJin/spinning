import { useEffect, useLayoutEffect, useRef } from 'react'
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
  /**
   * True once the control window has confirmed this spin landed (status
   * 'result'). Forces the reel to the exact target position right then,
   * regardless of whether every 'spin-progress' tick in between was
   * actually received — BroadcastChannel delivery + React's render timing
   * give no hard guarantee every tick arrives before its subscriber is
   * listening for it, so relying on the tick stream alone to land the
   * *final* position correctly isn't safe. This is the correctness
   * backstop: the animation can look slightly off mid-flight if a tick is
   * missed, but the landed position is never wrong.
   */
  landed?: boolean
  /** Which spin's progress broadcasts to apply — messages for any other spinId are ignored. */
  spinId: string | null
}

/**
 * Drives the reel for the PRESENTER window — never measures its own time.
 * On each broadcast from the control window (see useSourceReelAnimation) it
 * re-evaluates the same pure motion function, core/spinMotion.computeSpinY,
 * using the *received* elapsedMs and this window's *own* row size/center.
 *
 * The BroadcastChannel subscription is set up exactly once (mount) and
 * never torn down/recreated per spin — it reads `spinId`/`targetY` from refs
 * updated via useLayoutEffect rather than closing over the props at
 * subscribe time, since a subscription recreated per spin can otherwise
 * miss the first messages of a new spin while React is still propagating
 * the new spinId down to it. `landed` is the final safety net on top of
 * that for the one moment that actually matters: where the reel ends up.
 */
export function useMirrorReelAnimation({
  sequence,
  itemHeightPx,
  centerIndex,
  instant = false,
  landed = false,
  spinId,
}: UseMirrorReelAnimationOptions) {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const spinIdRef = useRef(spinId)
  const targetYRef = useRef(0)
  const durationRef = useRef(0)

  useLayoutEffect(() => {
    spinIdRef.current = spinId
  }, [spinId])

  useLayoutEffect(() => {
    const track = trackRef.current
    if (!track) return

    if (!sequence) {
      track.style.animation = 'none'
      track.style.transform = 'translateY(0px)'
      return
    }

    const targetY = -(sequence.winnerIndex - centerIndex) * itemHeightPx
    targetYRef.current = targetY
    durationRef.current = sequence.durationMs

    if (instant) {
      track.style.animation = 'none'
      track.style.transform = `translateY(${targetY}px)`
      return
    }

    track.style.animation = `${BLUR_ANIMATION_NAME} ${sequence.durationMs}ms ease-out forwards`
    track.style.transform = 'translateY(0px)'
  }, [sequence, itemHeightPx, centerIndex, instant])

  // Correctness backstop — see the `landed` doc comment above.
  useLayoutEffect(() => {
    if (!landed) return
    const track = trackRef.current
    if (!track) return
    track.style.animation = 'none'
    track.style.transform = `translateY(${targetYRef.current}px)`
  }, [landed])

  // Persistent for the component's lifetime — see the hook doc comment
  // above on why a per-spin subscription is unsafe.
  useEffect(() => {
    return subscribeSyncChannel((message) => {
      if (message.type !== 'spin-progress') return
      if (message.payload.spinId !== spinIdRef.current) return
      const y = computeSpinY(message.payload.elapsedMs, {
        targetY: targetYRef.current,
        durationMs: durationRef.current,
      })
      const current = trackRef.current
      if (current) current.style.transform = `translateY(${y}px)`
    })
  }, [])

  return trackRef
}
