import { useEffect } from 'react'
import { getEligibleParticipants, toIdleReelItems } from '../core/participantPool'
import { WHEEL_CONFIG } from '../config/wheelConfig'
import {
  broadcastIdleItemsUpdate,
  broadcastSettingsUpdate,
  broadcastStateSync,
  subscribeSyncChannel,
} from '../store/syncChannel'
import { useParticipantsStore } from '../store/useParticipantsStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { useSpinStore } from '../store/useSpinStore'

function currentIdleItemsPreview() {
  const eligible = getEligibleParticipants(
    useParticipantsStore.getState().participants,
    useSettingsStore.getState().removeAfterWin,
  )
  // Only a preview slice, not the full (possibly thousands-strong) pool —
  // neither window ever displays more than WHEEL_CONFIG.visibleCount rows
  // of it anyway.
  return toIdleReelItems(eligible).slice(0, WHEEL_CONFIG.visibleCount)
}

/**
 * Lets a presenter window opened mid-session catch up: when it announces
 * itself ready, the control window replies with whatever it currently has
 * (idle / mid-spin / last result, current text scale, current idle-pool
 * preview) instead of leaving the presenter blank or stale.
 */
export function useControlSync(): void {
  const participants = useParticipantsStore((s) => s.participants)
  const removeAfterWin = useSettingsStore((s) => s.removeAfterWin)

  // Keeps the presenter's idle-state preview in sync any time the pool it's
  // drawn from actually changes — import, removal, a reset, or the
  // remove-after-win toggle changing who's currently eligible.
  useEffect(() => {
    broadcastIdleItemsUpdate({ items: currentIdleItemsPreview() })
  }, [participants, removeAfterWin])

  useEffect(() => {
    return subscribeSyncChannel((message) => {
      if (message.type !== 'presenter-ready') return
      const { status, spinId, sequence, winner } = useSpinStore.getState()
      broadcastStateSync({
        status,
        lastResult:
          spinId && sequence && winner ? { spinId, sequence, winnerName: winner.name } : undefined,
      })
      const settings = useSettingsStore.getState()
      broadcastSettingsUpdate({
        presenterTextScale: settings.presenterTextScale,
        presenterCentered: settings.presenterCentered,
      })
      broadcastIdleItemsUpdate({ items: currentIdleItemsPreview() })
    })
  }, [])
}
