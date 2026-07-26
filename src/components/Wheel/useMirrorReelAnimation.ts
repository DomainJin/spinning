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

  // Recomputed every render from current props — itemHeightPx/centerIndex
  // change on window resize (see useStageHeightPx), so this must stay a
  // plain derived value rather than something only (re)computed inside an
  // effect keyed on the spin itself, otherwise a resize has no way to
  // correct it.
  const targetY = sequence ? -(sequence.winnerIndex - centerIndex) * itemHeightPx : 0

  useLayoutEffect(() => {
    spinIdRef.current = spinId
  }, [spinId])

  useLayoutEffect(() => {
    targetYRef.current = targetY
    durationRef.current = sequence?.durationMs ?? 0
  }, [targetY, sequence])

  // Starts (or stops) the spin animation. Keyed only on the spin itself
  // (sequence identity + instant), never on itemHeightPx/centerIndex —
  // those change on every window resize/fullscreen toggle, and keying this
  // effect on them made a resize look like a brand new spin: it reset the
  // reel to translateY(0) and replayed the blur keyframe from scratch,
  // which is the "jumps back / blurs then clears" resize glitch. Resizing
  // must only change *where* the reel already sitting still lands — see
  // the correction effect below — never restart the animation itself.
  useLayoutEffect(() => {
    const track = trackRef.current
    if (!track) return

    if (!sequence) {
      track.style.animation = 'none'
      track.style.transform = 'translateY(0px)'
      return
    }

    if (instant) return // the correction effect below snaps it directly

    track.style.animation = `${BLUR_ANIMATION_NAME} ${sequence.durationMs}ms ease-out forwards`
    track.style.transform = 'translateY(0px)'
  }, [sequence, instant])

  // Correctness backstop — see the `landed` doc comment above. Also doubles
  // as the resize correction: whenever the reel is supposed to be resting
  // at an exact known position (already landed, or a late-joining instant
  // land) and that position's pixel value changes — the spin landing, or a
  // resize changing itemHeightPx while already resting — snap straight to
  // it with no animation. Guarded to skip entirely while a spin is still
  // genuinely in flight, so a resize mid-spin never interrupts it; only a
  // *held* position gets corrected.
  useLayoutEffect(() => {
    if (!landed && !instant) return
    const track = trackRef.current
    if (!track) return
    track.style.animation = 'none'
    track.style.transform = `translateY(${targetY}px)`
  }, [targetY, landed, instant])

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
