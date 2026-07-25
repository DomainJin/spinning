import { create } from 'zustand'
import type { HistoryEntry } from '../types/history'
import { appendHistory, createHistoryEntry } from '../core/historyLog'
import type { Participant } from '../types/participant'
import { loadPersisted, savePersisted } from './persist'

const STORAGE_KEY = 'history'

interface HistoryState {
  entries: HistoryEntry[]
  record: (winner: Participant, rigged: boolean) => void
  clear: () => void
}

export const useHistoryStore = create<HistoryState>((set) => ({
  entries: loadPersisted<HistoryEntry[]>(STORAGE_KEY, []),
  record: (winner, rigged) =>
    set((state) => {
      const entries = appendHistory(state.entries, createHistoryEntry(winner, rigged))
      savePersisted(STORAGE_KEY, entries)
      return { entries }
    }),
  clear: () => {
    savePersisted(STORAGE_KEY, [])
    set({ entries: [] })
  },
}))
