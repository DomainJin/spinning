import { useEffect, useState } from 'react'
import { APP_CONFIG } from '../../config/wheelConfig'

function computeStageHeightPx(): number {
  if (typeof window === 'undefined') return 0
  const { innerWidth, innerHeight } = window
  // Mirrors the CSS letterbox formula (`min(100vw, 100vh * ratio)` for
  // width) so JS knows the same resolved stage height the browser laid out,
  // without needing to measure the DOM.
  return Math.min(innerWidth / APP_CONFIG.presenterAspectRatio, innerHeight)
}

/** Live height (px) of the letterboxed presenter stage — recomputed on resize. */
export function useStageHeightPx(): number {
  const [height, setHeight] = useState(computeStageHeightPx)

  useEffect(() => {
    const onResize = () => setHeight(computeStageHeightPx())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return height
}
