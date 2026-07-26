import { useMemo } from 'react'
import { WHEEL_CONFIG } from '../../config/wheelConfig'
import type { ReelItem, ReelSequence } from '../../types/spin'
import { useSourceReelAnimation } from './useSourceReelAnimation'
import { ReelWheelView } from './ReelWheelView'

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
   * that compute their own responsive size rather than a fixed multiple of
   * the base config, since a fixed size can only ever be correct for one
   * specific container size.
   */
  itemHeightPxOverride?: number
  /** Skip the spin animation and land instantly. */
  instant?: boolean
  /**
   * How many rows the *viewport* actually shows, independent of
   * `WHEEL_CONFIG.visibleCount` (which sizes the padding baked into the
   * precomputed sequence so the winner has enough rows on every side to
   * center against). Cropping to fewer visible rows than that padding still
   * centers correctly — it just shows less of it.
   */
  visibleRows?: number
  /** Current spin's id, broadcast alongside every progress tick so the presenter window can mirror this exact spin. */
  spinId: string | null
}

/** The control window's reel — the authoritative animation source (see useSourceReelAnimation). */
export function ReelWheel({
  idleItems,
  sequence,
  onLanded,
  scale = 1,
  itemHeightPxOverride,
  instant = false,
  visibleRows = WHEEL_CONFIG.visibleCount,
  spinId,
}: ReelWheelProps) {
  const itemHeightPx = itemHeightPxOverride ?? WHEEL_CONFIG.itemHeightPx * scale
  // Drives font-size/max-width so they stay in proportion to whatever the
  // row height actually resolved to, fixed-scale or computed-responsive alike.
  const effectiveScale = itemHeightPx / WHEEL_CONFIG.itemHeightPx
  const centerIndex = Math.floor(visibleRows / 2)
  const trackRef = useSourceReelAnimation({
    sequence,
    onLanded,
    itemHeightPx,
    centerIndex,
    instant,
    spinId,
  })
  const viewportHeight = visibleRows * itemHeightPx

  const items = sequence ? sequence.items : idleItems.slice(0, visibleRows)

  const highlightStyle = useMemo(
    () => ({ top: centerIndex * itemHeightPx, height: itemHeightPx }),
    [centerIndex, itemHeightPx],
  )
  const pointerStyle = useMemo(
    () => ({ top: centerIndex * itemHeightPx + itemHeightPx / 2 }),
    [centerIndex, itemHeightPx],
  )

  return (
    <ReelWheelView
      trackRef={trackRef}
      items={items}
      itemHeightPx={itemHeightPx}
      viewportHeight={viewportHeight}
      viewportMaxWidthPx={WHEEL_CONFIG.viewportMaxWidthPx * effectiveScale}
      effectiveScale={effectiveScale}
      highlightStyle={highlightStyle}
      pointerStyle={pointerStyle}
    />
  )
}
