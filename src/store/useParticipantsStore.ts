import { create } from 'zustand'
import type { Participant } from '../types/participant'
import { addParticipants, markWon, removeParticipant } from '../core/participantPool'
import { loadPersisted, savePersisted } from './persist'

const STORAGE_KEY = 'participants'

interface ParticipantsState {
  participants: Participant[]
  importNames: (names: string[]) => void
  remove: (id: string) => void
  markWinner: (id: string) => void
  clearAll: () => void
}

export const useParticipantsStore = create<ParticipantsState>((set) => ({
  participants: loadPersisted<Participant[]>(STORAGE_KEY, []),
  importNames: (names) =>
    set((state) => {
      const participants = addParticipants(state.participants, names)
      savePersisted(STORAGE_KEY, participants)
      return { participants }
    }),
  remove: (id) =>
    set((state) => {
      const participants = removeParticipant(state.participants, id)
      savePersisted(STORAGE_KEY, participants)
      return { participants }
    }),
  markWinner: (id) =>
    set((state) => {
      const participants = markWon(state.participants, id)
      savePersisted(STORAGE_KEY, participants)
      return { participants }
    }),
  clearAll: () => {
    savePersisted(STORAGE_KEY, [])
    set({ participants: [] })
  },
}))
