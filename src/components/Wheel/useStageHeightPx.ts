import { useLayoutEffect, useRef, useState, type RefObject } from 'react'

function measure(el: HTMLElement | null): number {
  return el ? el.getBoundingClientRect().height : 0
}

/**
 * Live height (px) of the letterboxed presenter stage — measured directly
 * from the DOM element the browser actually laid out, not recomputed
 * independently from window.innerWidth/innerHeight.
 *
 * The stage's real size is decided by CSS (`width: min(100vw, 100vh *
 * ratio)` + `aspect-ratio`), which can round/resolve to a slightly
 * different pixel value than a parallel JS division of the raw window
 * dimensions (e.g. scrollbar reservation, subpixel layout rounding). That
 * drift is a fraction of a pixel per reel row and invisible at a glance,
 * but it compounds across the hundreds of rows a large participant pool
 * produces into a landing position that's visibly off — reading the
 * rendered box directly removes the two-sources-of-truth gap entirely.
 */
export function useStageHeightPx(): [RefObject<HTMLDivElement | null>, number] {
  const ref = useRef<HTMLDivElement | null>(null)
  const [height, setHeight] = useState(0)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    setHeight(measure(el))

    const observer = new ResizeObserver(() => setHeight(measure(el)))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return [ref, height]
}
