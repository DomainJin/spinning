import type { CSSProperties } from 'react'
import { usePresenterSync } from '../../hooks/usePresenterSync'
import { PresenterReelWheel } from '../Wheel/PresenterReelWheel'
import { useStageHeightPx } from '../Wheel/useStageHeightPx'
import { WHEEL_CONFIG, APP_CONFIG } from '../../config/wheelConfig'
import styles from './PresenterView.module.css'

const stageStyle = {
  aspectRatio: `${APP_CONFIG.presenterAspectRatio} / 1`,
  ['--presenter-ratio' as string]: APP_CONFIG.presenterAspectRatio,
  ['--content-center-x' as string]: APP_CONFIG.presenterContentCenterX,
  ['--content-width-pct' as string]: APP_CONFIG.presenterContentWidthPct,
  ['--content-top-y' as string]: APP_CONFIG.presenterContentTopPct,
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
  const [stageRef, stageHeightPx] = useStageHeightPx()
  // Rounded to a whole pixel: the browser's layout engine can silently snap
  // a fractional CSS length to its own internal rounding grid (e.g. Blink
  // quantizes to 1/64px), so a row height computed as a raw fraction can
  // render a hair shorter than the value this component's own math assumes.
  // That's invisible on one row but accumulates linearly with row index —
  // for a large participant pool the reel can land many pixels off the
  // intended winner. Whole pixels have no such grid to fall between.
  const itemHeightPxOverride = Math.round(
    (stageHeightPx * WHEEL_CONFIG.presenterReelHeightFraction) / WHEEL_CONFIG.presenterVisibleRows,
  )

  // Scaled off the same resolved row height as the reel, not an independent
  // viewport-relative size, so the winner reveal stays proportionate to it
  // instead of dwarfing it. Long names (military-rank-prefixed names run
  // long) shrink further rather than wrapping to three huge lines.
  const winnerName = lastResult?.winnerName ?? ''
  const lengthFactor = Math.min(1, 16 / Math.max(winnerName.length, 1))
  const winnerFontSizePx = Math.max(itemHeightPxOverride * 0.85 * lengthFactor, itemHeightPxOverride * 0.4)
  const statusFontSizePx = itemHeightPxOverride * 0.5

  return (
    <div className={styles.stageOuter}>
      <div className={styles.stage} style={stageStyle} ref={stageRef}>
        <img
          className={styles.backgroundImg}
          src="/kv-banner.webp"
          alt="Phaselisa — The Art of Bio-Lifting"
        />
        <div className={styles.overlay}>
          <div className={styles.glass}>
            <PresenterReelWheel
              sequence={lastResult?.sequence ?? null}
              itemHeightPxOverride={itemHeightPxOverride}
              visibleRows={WHEEL_CONFIG.presenterVisibleRows}
              instant={instant}
              landed={status === 'result'}
              spinId={lastResult?.spinId ?? null}
            />
            {status === 'idle' && (
              <p className={styles.status} style={{ fontSize: statusFontSizePx }}>
                Đang chờ vòng quay tiếp theo...
              </p>
            )}
            {status === 'spinning' && (
              <p className={styles.status} style={{ fontSize: statusFontSizePx }}>
                Đang quay...
              </p>
            )}
            {status === 'result' && lastResult && (
              <p className={styles.winner} style={{ fontSize: winnerFontSizePx }}>
                🎉 {lastResult.winnerName} 🎉
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
