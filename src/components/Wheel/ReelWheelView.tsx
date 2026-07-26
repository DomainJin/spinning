import type { RefObject } from 'react'
import type { ReelItem } from '../../types/spin'
import styles from './ReelWheel.module.css'

export interface ReelWheelViewProps {
  trackRef: RefObject<HTMLDivElement | null>
  items: ReelItem[]
  itemHeightPx: number
  viewportHeight: number
  viewportMaxWidthPx: number
  /** Drives font sizing so it stays proportional to whatever itemHeightPx resolved to. */
  effectiveScale: number
  highlightStyle: { top: number; height: number }
  pointerStyle: { top: number }
  /**
   * Message shown when `items` is empty. Defaults to the operator-facing
   * import instruction; pass `null` to render nothing (the presenter window
   * has its own audience-facing status text elsewhere and showing this
   * operator instruction there too is just confusing noise).
   */
  emptyMessage?: string | null
}

/**
 * Pure rendering of the reel — viewport, track, rows, highlight, decorative
 * rails/pointers. No animation logic of its own; `trackRef` is driven
 * externally by whichever hook owns the motion (see useSourceReelAnimation
 * for the control window, useMirrorReelAnimation for the presenter).
 */
export function ReelWheelView({
  trackRef,
  items,
  itemHeightPx,
  viewportHeight,
  viewportMaxWidthPx,
  effectiveScale,
  highlightStyle,
  pointerStyle,
  emptyMessage = 'Chưa có người tham dự — hãy nhập danh sách từ file Excel.',
}: ReelWheelViewProps) {
  const viewportStyle = { height: viewportHeight, maxWidth: viewportMaxWidthPx }

  if (items.length === 0) {
    return (
      // key="empty" forces React to unmount/remount rather than patch the
      // previous render's track element in place — without it, React reuses
      // the same <div> (same tag, same position) across this branch and the
      // track branch below, and any style property the animation hooks set
      // imperatively (transform/animation — never part of this component's
      // own `style` prop) isn't something React knows to clear, so it
      // silently lingers on the reused node into the "empty" state.
      <div className={styles.viewport} style={viewportStyle} key="empty">
        {emptyMessage && (
          <div className={styles.empty} style={{ height: viewportHeight, fontSize: `${effectiveScale}rem` }}>
            {emptyMessage}
          </div>
        )}
        <div className={`${styles.rail} ${styles.railLeft}`} />
        <div className={`${styles.rail} ${styles.railRight}`} />
      </div>
    )
  }

  return (
    <div className={styles.viewport} style={viewportStyle} key="track">
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
      <div className={`${styles.rail} ${styles.railLeft}`} />
      <div className={`${styles.rail} ${styles.railRight}`} />
      <div className={`${styles.pointer} ${styles.pointerLeft}`} style={pointerStyle} />
      <div className={`${styles.pointer} ${styles.pointerRight}`} style={pointerStyle} />
    </div>
  )
}
