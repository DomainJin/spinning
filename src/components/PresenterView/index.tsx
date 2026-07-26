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
 *
 * The glass panel holds nothing but the reel — no separate status text or
 * winner banner. Once landed, ReelWheelView dims every row except the
 * highlighted one (see its `focused` prop) so the eye goes straight to the
 * winning row instead of splitting attention between the wheel and text
 * elsewhere in the panel.
 */
export function PresenterView() {
  const { status, lastResult, instant, presenterTextScale, idleItems } = usePresenterSync()
  const [stageRef, stageHeightPx] = useStageHeightPx()
  // Rounded to a whole pixel: the browser's layout engine can silently snap
  // a fractional CSS length to its own internal rounding grid (e.g. Blink
  // quantizes to 1/64px), so a row height computed as a raw fraction can
  // render a hair shorter than the value this component's own math assumes.
  // That's invisible on one row but accumulates linearly with row index —
  // for a large participant pool the reel can land many pixels off the
  // intended winner. Whole pixels have no such grid to fall between — the
  // operator's text-size slider (presenterTextScale) is applied *before*
  // this rounding, not after, so that invariant holds regardless of scale.
  const itemHeightPxOverride = Math.round(
    (stageHeightPx * WHEEL_CONFIG.presenterReelHeightFraction * presenterTextScale) /
      WHEEL_CONFIG.presenterVisibleRows,
  )

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
              idleItems={idleItems}
              itemHeightPxOverride={itemHeightPxOverride}
              visibleRows={WHEEL_CONFIG.presenterVisibleRows}
              instant={instant}
              landed={status === 'result'}
              spinId={lastResult?.spinId ?? null}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
