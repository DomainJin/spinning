import { create } from 'zustand'
import type { ReelSequence } from '../types/spin'
import type { Participant } from '../types/participant'
import { getEligibleParticipants } from '../core/participantPool'
import { buildReelSequence, selectWinner } from '../core/spinEngine'
import { useParticipantsStore } from './useParticipantsStore'
import { useRigStore } from './useRigStore'
import { useHistoryStore } from './useHistoryStore'
import { useSettingsStore } from './useSettingsStore'
import { broadcastReset, broadcastSpinStart, broadcastStateSync } from './syncChannel'

export type SpinStatus = 'idle' | 'spinning' | 'result'

interface SpinState {
  status: SpinStatus
  spinId: string | null
  sequence: ReelSequence | null
  winner: Participant | null
  riggedThisRound: boolean
  error: string | null
  /** Resolves the winner and starts the reel animation (control window only). */
  spin: () => void
  /** Called once the reel's animation has visually landed — commits history + marks the winner. */
  completeSpin: () => void
  /** Clears winner flags so everyone is eligible again; leaves history and the rig queue untouched. */
  resetRound: () => void
  /** Wipes every participant, rig entry, history entry, and setting back to a blank first-run state. */
  resetAllData: () => void
}

export const useSpinStore = create<SpinState>((set, get) => ({
  status: 'idle',
  spinId: null,
  sequence: null,
  winner: null,
  riggedThisRound: false,
  error: null,

  spin: () => {
    if (get().status === 'spinning') return

    const { participants } = useParticipantsStore.getState()
    const { removeAfterWin, spinDurationSec } = useSettingsStore.getState()
    const { queue } = useRigStore.getState()
    const eligible = getEligibleParticipants(participants, removeAfterWin)
    const selection = selectWinner(eligible, queue)

    if (!selection) {
      set({
        error: 'Không còn ai để quay — hãy nhập thêm người tham dự hoặc tắt chế độ loại người thắng.',
      })
      return
    }

    useRigStore.getState().setQueue(selection.nextQueue)
    const sequence = buildReelSequence(eligible, selection.winner, spinDurationSec * 1000)
    const spinId = crypto.randomUUID()

    set({
      status: 'spinning',
      spinId,
      sequence,
      winner: selection.winner,
      riggedThisRound: selection.rigged,
      error: null,
    })
    broadcastSpinStart({ spinId, sequence, winnerName: selection.winner.name })
  },

  completeSpin: () => {
    const { winner, sequence, spinId, riggedThisRound, status } = get()
    if (!winner || !sequence || !spinId || status !== 'spinning') return

    const { removeAfterWin } = useSettingsStore.getState()
    if (removeAfterWin) {
      useParticipantsStore.getState().markWinner(winner.id)
    }
    useHistoryStore.getState().record(winner, riggedThisRound)

    set({ status: 'result' })
    broadcastStateSync({
      status: 'result',
      lastResult: { spinId, sequence, winnerName: winner.name },
    })
  },

  resetRound: () => {
    useParticipantsStore.getState().resetWinners()
    set({
      status: 'idle',
      spinId: null,
      sequence: null,
      winner: null,
      riggedThisRound: false,
      error: null,
    })
    broadcastReset()
  },

  resetAllData: () => {
    useParticipantsStore.getState().clearAll()
    useRigStore.getState().clear()
    useHistoryStore.getState().clear()
    useSettingsStore.getState().resetToDefaults()
    set({
      status: 'idle',
      spinId: null,
      sequence: null,
      winner: null,
      riggedThisRound: false,
      error: null,
    })
    broadcastReset()
  },
}))
