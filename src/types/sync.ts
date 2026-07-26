import type { ReelSequence } from './spin'

export interface SpinBroadcastPayload {
  /**
   * Stable id for one spin. BroadcastChannel structured-clones every message,
   * so `sequence` gets a fresh object reference each time it crosses the
   * channel even when re-sent for the *same* spin (e.g. the result
   * confirmation after 'spin-start'). Comparing `spinId` — not `sequence`
   * identity — is what lets the presenter tell "same spin, just confirming
   * it landed" apart from "a new spin started", so it doesn't restart an
   * in-flight reel animation.
   */
  spinId: string
  sequence: ReelSequence
  winnerName: string
}

export type PresenterStatus = 'idle' | 'spinning' | 'result'

export interface PresenterState {
  status: PresenterStatus
  lastResult?: SpinBroadcastPayload
}

/**
 * The control window's live spin clock, broadcast every animation tick
 * while a spin is running. The presenter re-evaluates the same pure motion
 * function (core/spinMotion.computeSpinY) with this `elapsedMs` and its own
 * row size/center — never its own independently-measured time — so the two
 * windows can't drift apart the way two separately-timed animations can.
 * (Broadcasting a raw pixel position instead would only be correct if both
 * windows rendered the reel at the exact same scale, which they don't — the
 * presenter's rows are sized completely differently for the LED wall.)
 */
export interface SpinProgressPayload {
  spinId: string
  elapsedMs: number
}

/** Messages exchanged between the control window and presenter window(s) over BroadcastChannel. */
export type SyncMessage =
  | { type: 'presenter-ready' }
  | { type: 'state-sync'; payload: PresenterState }
  | { type: 'spin-start'; payload: SpinBroadcastPayload }
  | { type: 'spin-progress'; payload: SpinProgressPayload }
  | { type: 'reset' }
