import { useEffect } from 'react'
import { broadcastStateSync, subscribeSyncChannel } from '../store/syncChannel'
import { useSpinStore } from '../store/useSpinStore'

/**
 * Lets a presenter window opened mid-session catch up: when it announces
 * itself ready, the control window replies with whatever it currently has
 * (idle / mid-spin / last result) instead of leaving the presenter blank.
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
    })
  }, [])
}
