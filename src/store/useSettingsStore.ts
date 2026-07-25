import { create } from 'zustand'
import { loadPersisted, savePersisted } from './persist'

const STORAGE_KEY = 'settings:removeAfterWin'

interface SettingsState {
  /** When true, a winner is taken out of the pool for future spins; when false, they can win again. */
  removeAfterWin: boolean
  setRemoveAfterWin: (value: boolean) => void
}

export const useSettingsStore = create<SettingsState>((set) => ({
  removeAfterWin: loadPersisted<boolean>(STORAGE_KEY, true),
  setRemoveAfterWin: (value) => {
    savePersisted(STORAGE_KEY, value)
    set({ removeAfterWin: value })
  },
}))
