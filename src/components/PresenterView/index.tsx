import type { CSSProperties } from 'react'
import { usePresenterSync } from '../../hooks/usePresenterSync'
import { ReelWheel } from '../Wheel/ReelWheel'
import { useStageHeightPx } from '../Wheel/useStageHeightPx'
import { WHEEL_CONFIG, APP_CONFIG } from '../../config/wheelConfig'
import styles from './PresenterView.module.css'

const stageStyle = {
  aspectRatio: `${APP_CONFIG.presenterAspectRatio} / 1`,
  ['--presenter-ratio' as string]: APP_CONFIG.presenterAspectRatio,
  ['--content-center-x' as string]: APP_CONFIG.presenterContentCenterX,
  ['--content-max-width-pct' as string]: APP_CONFIG.presenterContentMaxWidthPct,
} as CSSProperties

/**
 * Audience-facing window: no operator controls, cursor hidden, state driven
 * entirely by BroadcastChannel messages from the control window (see
 * usePresenterSync) — it never computes its own spin outcome.
 *
 * Letterboxed to the LED wall's native aspect ratio (config-driven, see
 * APP_CONFIG.presenterAspectRatio) so the background art fills the frame
 * edge-to-edge instead of a thin cropped strip over a plain gradient.
 */
export function PresenterView() {
  const { status, lastResult, instant } = usePresenterSync()
  const stageHeightPx = useStageHeightPx()
  const itemHeightPxOverride =
    (stageHeightPx * WHEEL_CONFIG.presenterReelHeightFraction) / WHEEL_CONFIG.presenterVisibleRows

  return (
    <div className={styles.stageOuter}>
      <div className={styles.stage} style={stageStyle}>
        <img
          className={styles.backgroundImg}
          src="/kv-banner.webp"
          alt="Phaselisa — The Art of Bio-Lifting"
        />
        <div className={styles.overlay}>
          <div className={styles.glass}>
            <ReelWheel
              idleItems={[]}
              sequence={lastResult?.sequence ?? null}
              itemHeightPxOverride={itemHeightPxOverride}
              visibleRows={WHEEL_CONFIG.presenterVisibleRows}
              instant={instant}
            />
            {status === 'idle' && <p className={styles.status}>Đang chờ vòng quay tiếp theo...</p>}
            {status === 'spinning' && <p className={styles.status}>Đang quay...</p>}
            {status === 'result' && lastResult && (
              <p className={styles.winner}>🎉 {lastResult.winnerName} 🎉</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
