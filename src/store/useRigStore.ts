import { create } from 'zustand'
import { enqueue, removeFromQueue, reorderPending, type RigQueue } from '../core/rigQueue'
import { loadPersisted, savePersisted } from './persist'

const STORAGE_KEY = 'rigQueue'

interface RigState {
  queue: RigQueue
  add: (participantId: string) => void
  remove: (entryId: string) => void
  /** Indices are among unplayed entries only — see core/rigQueue.reorderPending. */
  reorder: (fromPendingIndex: number, toPendingIndex: number) => void
  setQueue: (queue: RigQueue) => void
  clear: () => void
}

export const useRigStore = create<RigState>((set) => ({
  queue: loadPersisted<RigQueue>(STORAGE_KEY, []),
  add: (participantId) =>
    set((state) => {
      const queue = enqueue(state.queue, crypto.randomUUID(), participantId)
      savePersisted(STORAGE_KEY, queue)
      return { queue }
    }),
  remove: (entryId) =>
    set((state) => {
      const queue = removeFromQueue(state.queue, entryId)
      savePersisted(STORAGE_KEY, queue)
      return { queue }
    }),
  reorder: (fromPendingIndex, toPendingIndex) =>
    set((state) => {
      const queue = reorderPending(state.queue, fromPendingIndex, toPendingIndex)
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
