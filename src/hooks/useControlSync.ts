import { useEffect } from 'react'
import { broadcastSettingsUpdate, broadcastStateSync, subscribeSyncChannel } from '../store/syncChannel'
import { useSettingsStore } from '../store/useSettingsStore'
import { useSpinStore } from '../store/useSpinStore'

/**
 * Lets a presenter window opened mid-session catch up: when it announces
 * itself ready, the control window replies with whatever it currently has
 * (idle / mid-spin / last result, plus the current presenter text scale)
 * instead of leaving the presenter blank or at the wrong size.
 */
export function useControlSync(): void {
  useEffect(() => {
    return subscribeSyncChannel((message) => {
      if (message.type !== 'presenter-ready') return
      const { status, spinId, sequence, winner } = useSpinStore.getState()
      broadcastStateSync({
        status,
        lastResult:
          spinId && sequence && winner ? { spinId, sequence, winnerName: winner.name } : undefined,
      })
      broadcastSettingsUpdate({ presenterTextScale: useSettingsStore.getState().presenterTextScale })
    })
  }, [])
}
