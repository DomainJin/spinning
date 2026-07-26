import { useMemo } from 'react'
import { WHEEL_CONFIG } from '../../config/wheelConfig'
import { withStartMarker } from '../../core/participantPool'
import type { ReelItem, ReelSequence } from '../../types/spin'
import { useMirrorReelAnimation } from './useMirrorReelAnimation'
import { ReelWheelView } from './ReelWheelView'

export interface PresenterReelWheelProps {
  /** Precomputed spin payload received from the control window; when set, the reel mirrors its live position and lands on its winner. */
  sequence: ReelSequence | null
  /** Static rows shown before a spin starts (or after a reset) — mirrors the control window's own idleItems, broadcast over BroadcastChannel since the presenter never reads the participant store directly. */
  idleItems: ReelItem[]
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
  idleItems,
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

  // See ReelWheel.tsx (control) — same "START" placeholder under the
  // pointer while idle, so the audience doesn't see what looks like an
  // already-decided winner before a spin has actually happened.
  const items = sequence
    ? sequence.items
    : idleItems.length > 0
      ? withStartMarker(idleItems, centerIndex).slice(0, visibleRows)
      : []

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
      emptyMessage={null}
      focused={landed}
    />
  )
}
