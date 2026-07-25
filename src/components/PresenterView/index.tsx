import { usePresenterSync } from '../../hooks/usePresenterSync'
import { ReelWheel } from '../Wheel/ReelWheel'
import { WHEEL_CONFIG } from '../../config/wheelConfig'
import styles from './PresenterView.module.css'

/**
 * Audience-facing window: no operator controls, cursor hidden, state driven
 * entirely by BroadcastChannel messages from the control window (see
 * usePresenterSync) — it never computes its own spin outcome.
 */
export function PresenterView() {
  const { status, lastResult, instant } = usePresenterSync()

  return (
    <div className={styles.stage}>
      <div className={styles.wheelWrap}>
        <ReelWheel
          idleItems={[]}
          sequence={lastResult?.sequence ?? null}
          scale={WHEEL_CONFIG.presenterScale}
          instant={instant}
        />
      </div>
      {status === 'idle' && <p className={styles.status}>Đang chờ vòng quay tiếp theo...</p>}
      {status === 'spinning' && <p className={styles.status}>Đang quay...</p>}
      {status === 'result' && lastResult && (
        <p className={styles.winner}>🎉 {lastResult.winnerName} 🎉</p>
      )}
    </div>
  )
}
