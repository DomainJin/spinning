import { create } from 'zustand'
import { enqueue, removeFromQueue, reorderQueue, type RigQueue } from '../core/rigQueue'
import { loadPersisted, savePersisted } from './persist'

const STORAGE_KEY = 'rigQueue'

interface RigState {
  queue: RigQueue
  add: (participantId: string) => void
  remove: (participantId: string) => void
  reorder: (fromIndex: number, toIndex: number) => void
  setQueue: (queue: RigQueue) => void
  clear: () => void
}

export const useRigStore = create<RigState>((set) => ({
  queue: loadPersisted<RigQueue>(STORAGE_KEY, []),
  add: (participantId) =>
    set((state) => {
      const queue = enqueue(state.queue, participantId)
      savePersisted(STORAGE_KEY, queue)
      return { queue }
    }),
  remove: (participantId) =>
    set((state) => {
      const queue = removeFromQueue(state.queue, participantId)
      savePersisted(STORAGE_KEY, queue)
      return { queue }
    }),
  reorder: (fromIndex, toIndex) =>
    set((state) => {
      const queue = reorderQueue(state.queue, fromIndex, toIndex)
      savePersisted(STORAGE_KEY, queue)
      return { queue }
    }),
  setQueue: (queue) => {
    savePersisted(STORAGE_KEY, queue)
    set({ queue })
  },
  clear: () => {
    savePersisted(STORAGE_KEY, [])
    set({ queue: [] })
  },
}))
