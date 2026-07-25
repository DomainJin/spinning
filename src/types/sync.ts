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

/** Messages exchanged between the control window and presenter window(s) over BroadcastChannel. */
export type SyncMessage =
  | { type: 'presenter-ready' }
  | { type: 'state-sync'; payload: PresenterState }
  | { type: 'spin-start'; payload: SpinBroadcastPayload }
  | { type: 'reset' }
