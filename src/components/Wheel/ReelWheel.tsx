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
  /** Uniformly scales row height/width/font — used to enlarge the reel for the presenter window without CSS transform overflow issues. */
  scale?: number
  /** Skip the spin animation and land instantly (a presenter catching up to an already-decided spin). */
  instant?: boolean
}

export function ReelWheel({ idleItems, sequence, onLanded, scale = 1, instant = false }: ReelWheelProps) {
  const itemHeightPx = WHEEL_CONFIG.itemHeightPx * scale
  const trackRef = useReelAnimation({ sequence, onLanded, itemHeightPx, instant })
  const { visibleCount, viewportMaxWidthPx } = WHEEL_CONFIG
  const centerIndex = Math.floor(visibleCount / 2)
  const viewportHeight = visibleCount * itemHeightPx

  const items = sequence ? sequence.items : idleItems.slice(0, visibleCount)

  const highlightStyle = useMemo(
    () => ({ top: centerIndex * itemHeightPx, height: itemHeightPx }),
    [centerIndex, itemHeightPx],
  )

  const viewportStyle = { height: viewportHeight, maxWidth: viewportMaxWidthPx * scale }

  if (items.length === 0) {
    return (
      <div className={styles.viewport} style={viewportStyle}>
        <div className={styles.empty} style={{ height: viewportHeight, fontSize: `${scale}rem` }}>
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
            style={{ height: itemHeightPx, fontSize: `${1.1 * scale}rem` }}
          >
            {item.name}
          </div>
        ))}
      </div>
      <div className={styles.highlight} style={highlightStyle} />
    </div>
  )
}
