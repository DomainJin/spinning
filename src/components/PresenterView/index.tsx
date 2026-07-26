import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
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
  // long) get a smaller starting point from this character-count estimate.
  const winnerName = lastResult?.winnerName ?? ''
  const lengthFactor = Math.min(1, 16 / Math.max(winnerName.length, 1))
  const baseWinnerFontSizePx = Math.max(itemHeightPxOverride * 0.85 * lengthFactor, itemHeightPxOverride * 0.4)
  const statusFontSizePx = itemHeightPxOverride * 0.5

  const winnerRef = useRef<HTMLParagraphElement | null>(null)
  const [winnerFontSizePx, setWinnerFontSizePx] = useState(baseWinnerFontSizePx)

  // The character-count estimate above is only a rough starting point — it
  // undercounts wide glyphs like the 🎉 emoji flanking the name, so even a
  // short winner (a 3-digit ticket number) could still render wider than
  // the glass panel and spill past its edges. Re-measuring the actual
  // rendered width and shrinking to fit is the only way to guarantee it
  // stays on one line and inside the panel regardless of font/emoji
  // metrics.
  //
  // Resetting to the base size on a new winner is pure derived state, so
  // it's adjusted during render (React's sanctioned pattern for "reset
  // state when a prop changes") rather than in an effect — only the actual
  // DOM-measurement correction below needs to be an effect.
  const [prevWinnerName, setPrevWinnerName] = useState(winnerName)
  if (winnerName !== prevWinnerName) {
    setPrevWinnerName(winnerName)
    setWinnerFontSizePx(baseWinnerFontSizePx)
  }

  useLayoutEffect(() => {
    const el = winnerRef.current
    if (!el || el.clientWidth === 0) return
    const overflowPx = el.scrollWidth - el.clientWidth
    if (overflowPx <= 0.5) return
    const scale = el.clientWidth / el.scrollWidth
    setWinnerFontSizePx((prev) => Math.max(prev * scale, itemHeightPxOverride * 0.15))
    // `status` is included because it's what actually gates whether the
    // <p> this effect measures exists in the DOM at all — winnerName (and
    // therefore winnerFontSizePx) settles as soon as 'spin-start' arrives,
    // well before status flips to 'result' and the paragraph mounts, so
    // without status here this effect's dependencies stop changing before
    // there's anything to measure, and it never re-fires once the
    // paragraph actually appears.
  }, [winnerFontSizePx, itemHeightPxOverride, winnerName, status])

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
              <p ref={winnerRef} className={styles.winner} style={{ fontSize: winnerFontSizePx }}>
                🎉 {lastResult.winnerName} 🎉
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
