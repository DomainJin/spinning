import { useParticipantsStore } from '../../store/useParticipantsStore'
import { useSettingsStore } from '../../store/useSettingsStore'
import { useSpinStore } from '../../store/useSpinStore'
import styles from './ControlPanel.module.css'

export function SpinControls() {
  const hasParticipants = useParticipantsStore((s) => s.participants.length > 0)
  const removeAfterWin = useSettingsStore((s) => s.removeAfterWin)
  const setRemoveAfterWin = useSettingsStore((s) => s.setRemoveAfterWin)
  const status = useSpinStore((s) => s.status)
  const winner = useSpinStore((s) => s.winner)
  const error = useSpinStore((s) => s.error)
  const spin = useSpinStore((s) => s.spin)
  const resetRound = useSpinStore((s) => s.resetRound)

  return (
    <div className={styles.spinControls}>
      <label className={styles.toggleRow}>
        <input
          type="checkbox"
          checked={removeAfterWin}
          onChange={(event) => setRemoveAfterWin(event.target.checked)}
        />
        Loại người thắng khỏi vòng quay sau
      </label>

      <button
        type="button"
        className={styles.spinButton}
        onClick={() => spin()}
        disabled={status === 'spinning' || !hasParticipants}
      >
        {status === 'spinning' ? 'Đang quay...' : 'Quay'}
      </button>

      <button type="button" className={styles.secondaryButton} onClick={() => resetRound()}>
        Đặt lại lượt quay
      </button>

      {status === 'result' && winner && (
        <p className={styles.winnerBanner}>🎉 Người thắng: {winner.name}</p>
      )}
      {error && <p className={styles.errorText}>{error}</p>}
    </div>
  )
}
