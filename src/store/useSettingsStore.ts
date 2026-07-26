import { create } from 'zustand'
import { WHEEL_CONFIG } from '../config/wheelConfig'
import { loadPersisted, savePersisted } from './persist'

const REMOVE_AFTER_WIN_KEY = 'settings:removeAfterWin'
const SPIN_DURATION_KEY = 'settings:spinDurationSec'

interface SettingsState {
  /** When true, a winner is taken out of the pool for future spins; when false, they can win again. */
  removeAfterWin: boolean
  setRemoveAfterWin: (value: boolean) => void
  /** Exact length of every spin, in seconds — see spinEngine.buildReelSequence. */
  spinDurationSec: number
  setSpinDurationSec: (value: number) => void
}

export const useSettingsStore = create<SettingsState>((set) => ({
  removeAfterWin: loadPersisted<boolean>(REMOVE_AFTER_WIN_KEY, true),
  setRemoveAfterWin: (value) => {
    savePersisted(REMOVE_AFTER_WIN_KEY, value)
    set({ removeAfterWin: value })
  },
  spinDurationSec: loadPersisted<number>(SPIN_DURATION_KEY, WHEEL_CONFIG.defaultSpinDurationSec),
  setSpinDurationSec: (value) => {
    savePersisted(SPIN_DURATION_KEY, value)
    set({ spinDurationSec: value })
  },
}))
