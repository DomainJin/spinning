import { useMemo } from 'react'
import { WHEEL_CONFIG } from '../../config/wheelConfig'
import type { ReelSequence } from '../../types/spin'
import { useMirrorReelAnimation } from './useMirrorReelAnimation'
import { ReelWheelView } from './ReelWheelView'

export interface PresenterReelWheelProps {
  /** Precomputed spin payload received from the control window; when set, the reel mirrors its live position and lands on its winner. */
  sequence: ReelSequence | null
  /** Exact row height (px) — see useStageHeightPx, since a fixed size can only ever fit one specific output resolution. */
  itemHeightPxOverride: number
  /** Land instantly with no animation — this presenter joined after the spin already resolved elsewhere. */
  instant?: boolean
  /** True once the control window has confirmed this spin landed — forces the reel to the exact final position regardless of the progress-tick stream (see useMirrorReelAnimation). */
  landed?: boolean
  visibleRows: number
  /** Which spin's progress broadcasts to mirror. */
  spinId: string | null
}

/** The presenter window's reel — a pure mirror, never its own animation source (see useMirrorReelAnimation). */
export function PresenterReelWheel({
  sequence,
  itemHeightPxOverride,
  instant = false,
  landed = false,
  visibleRows,
  spinId,
}: PresenterReelWheelProps) {
  const effectiveScale = itemHeightPxOverride / WHEEL_CONFIG.itemHeightPx
  const centerIndex = Math.floor(visibleRows / 2)
  const trackRef = useMirrorReelAnimation({
    sequence,
    itemHeightPx: itemHeightPxOverride,
    centerIndex,
    instant,
    landed,
    spinId,
  })
  const viewportHeight = visibleRows * itemHeightPxOverride

  const items = sequence ? sequence.items : []

  const highlightStyle = useMemo(
    () => ({ top: centerIndex * itemHeightPxOverride, height: itemHeightPxOverride }),
    [centerIndex, itemHeightPxOverride],
  )
  const pointerStyle = useMemo(
    () => ({ top: centerIndex * itemHeightPxOverride + itemHeightPxOverride / 2 }),
    [centerIndex, itemHeightPxOverride],
  )

  return (
    <ReelWheelView
      trackRef={trackRef}
      items={items}
      itemHeightPx={itemHeightPxOverride}
      viewportHeight={viewportHeight}
      viewportMaxWidthPx={WHEEL_CONFIG.viewportMaxWidthPx * effectiveScale}
      effectiveScale={effectiveScale}
      highlightStyle={highlightStyle}
      pointerStyle={pointerStyle}
    />
  )
}
