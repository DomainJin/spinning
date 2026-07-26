import { create } from 'zustand'
import { WHEEL_CONFIG } from '../config/wheelConfig'
import { loadPersisted, savePersisted } from './persist'
import { broadcastSettingsUpdate } from './syncChannel'

const REMOVE_AFTER_WIN_KEY = 'settings:removeAfterWin'
const SPIN_DURATION_KEY = 'settings:spinDurationSec'
const PRESENTER_TEXT_SCALE_KEY = 'settings:presenterTextScale'

const DEFAULT_REMOVE_AFTER_WIN = true
const DEFAULT_PRESENTER_TEXT_SCALE = 1

interface SettingsState {
  /** When true, a winner is taken out of the pool for future spins; when false, they can win again. */
  removeAfterWin: boolean
  setRemoveAfterWin: (value: boolean) => void
  /** Exact length of every spin, in seconds — see spinEngine.buildReelSequence. */
  spinDurationSec: number
  setSpinDurationSec: (value: number) => void
  /** Multiplier on the presenter's auto-computed row height, for manually correcting how it reads on the actual LED wall. */
  presenterTextScale: number
  setPresenterTextScale: (value: number) => void
  /** Restores every setting here to its out-of-the-box default (used by the full data reset). */
  resetToDefaults: () => void
}

export const useSettingsStore = create<SettingsState>((set) => ({
  removeAfterWin: loadPersisted<boolean>(REMOVE_AFTER_WIN_KEY, DEFAULT_REMOVE_AFTER_WIN),
  setRemoveAfterWin: (value) => {
    savePersisted(REMOVE_AFTER_WIN_KEY, value)
    set({ removeAfterWin: value })
  },
  spinDurationSec: loadPersisted<number>(SPIN_DURATION_KEY, WHEEL_CONFIG.defaultSpinDurationSec),
  setSpinDurationSec: (value) => {
    savePersisted(SPIN_DURATION_KEY, value)
    set({ spinDurationSec: value })
  },
  presenterTextScale: loadPersisted<number>(PRESENTER_TEXT_SCALE_KEY, DEFAULT_PRESENTER_TEXT_SCALE),
  setPresenterTextScale: (value) => {
    savePersisted(PRESENTER_TEXT_SCALE_KEY, value)
    set({ presenterTextScale: value })
    broadcastSettingsUpdate({ presenterTextScale: value })
  },
  resetToDefaults: () => {
    savePersisted(REMOVE_AFTER_WIN_KEY, DEFAULT_REMOVE_AFTER_WIN)
    savePersisted(SPIN_DURATION_KEY, WHEEL_CONFIG.defaultSpinDurationSec)
    savePersisted(PRESENTER_TEXT_SCALE_KEY, DEFAULT_PRESENTER_TEXT_SCALE)
    set({
      removeAfterWin: DEFAULT_REMOVE_AFTER_WIN,
      spinDurationSec: WHEEL_CONFIG.defaultSpinDurationSec,
      presenterTextScale: DEFAULT_PRESENTER_TEXT_SCALE,
    })
    broadcastSettingsUpdate({ presenterTextScale: DEFAULT_PRESENTER_TEXT_SCALE })
  },
}))
