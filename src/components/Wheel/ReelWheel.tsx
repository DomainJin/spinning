import { useMemo } from 'react'
import { WHEEL_CONFIG } from '../../config/wheelConfig'
import type { ReelItem, ReelSequence } from '../../types/spin'
import { useReelAnimation } from './useReelAnimation'
import styles from './ReelWheel.module.css'

export interface ReelWheelProps {
  /** Static rows shown before a spin starts (or after a reset) — typically the current pool. */
  idleItems: ReelItem[]
  /** Precomputed spin payload; when set, the reel animates to it and lands on its winner. */
  sequence: ReelSequence | null
  onLanded?: () => void
  /** Uniformly scales row height/width/font from the base config size. Ignored when `itemHeightPxOverride` is set. */
  scale?: number
  /**
   * Exact row height (px) to render at, bypassing `scale` — for callers
   * that compute their own responsive size (see useStageHeightPx) rather
   * than a fixed multiple of the base config, since a fixed size can only
   * ever be correct for one specific container size.
   */
  itemHeightPxOverride?: number
  /** Skip the spin animation and land instantly (a presenter catching up to an already-decided spin). */
  instant?: boolean
  /**
   * How many rows the *viewport* actually shows, independent of
   * `WHEEL_CONFIG.visibleCount` (which sizes the padding baked into the
   * precomputed sequence so the winner has enough rows on every side to
   * center against). Cropping to fewer visible rows than that padding still
   * centers correctly — it just shows less of it. Lets a very short/wide
   * display (the presenter's LED-wall aspect ratio) shrink the viewport
   * without touching the shared sequence data both windows render.
   */
  visibleRows?: number
}

export function ReelWheel({
  idleItems,
  sequence,
  onLanded,
  scale = 1,
  itemHeightPxOverride,
  instant = false,
  visibleRows = WHEEL_CONFIG.visibleCount,
}: ReelWheelProps) {
  const itemHeightPx = itemHeightPxOverride ?? WHEEL_CONFIG.itemHeightPx * scale
  // Drives font-size/max-width so they stay in proportion to whatever the
  // row height actually resolved to, fixed-scale or computed-responsive alike.
  const effectiveScale = itemHeightPx / WHEEL_CONFIG.itemHeightPx
  const centerIndex = Math.floor(visibleRows / 2)
  const trackRef = useReelAnimation({ sequence, onLanded, itemHeightPx, centerIndex, instant })
  const { viewportMaxWidthPx } = WHEEL_CONFIG
  const viewportHeight = visibleRows * itemHeightPx

  const items = sequence ? sequence.items : idleItems.slice(0, visibleRows)

  const highlightStyle = useMemo(
    () => ({ top: centerIndex * itemHeightPx, height: itemHeightPx }),
    [centerIndex, itemHeightPx],
  )

  const viewportStyle = { height: viewportHeight, maxWidth: viewportMaxWidthPx * effectiveScale }

  if (items.length === 0) {
    return (
      <div className={styles.viewport} style={viewportStyle}>
        <div className={styles.empty} style={{ height: viewportHeight, fontSize: `${effectiveScale}rem` }}>
          Chưa có người tham dự — hãy nhập danh sách từ file Excel.
        </div>
      </div>
    )
  }

  return (
    <div className={styles.viewport} style={viewportStyle}>
      <div ref={trackRef} className={styles.track}>
        {items.map((item) => (
          <div
            key={item.key}
            className={styles.row}
            style={{ height: itemHeightPx, fontSize: `${1.1 * effectiveScale}rem` }}
          >
            {item.name}
          </div>
        ))}
      </div>
      <div className={styles.highlight} style={highlightStyle} />
    </div>
  )
}
