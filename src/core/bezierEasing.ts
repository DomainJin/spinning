/**
 * Evaluates a CSS-style `cubic-bezier(x1, y1, x2, y2)` timing function.
 * Given control points and a time fraction `t` in [0, 1], returns the eased
 * progress in [0, 1] — same algorithm browsers use internally (Newton-Raphson
 * with a bisection fallback) so a curve tuned as a CSS string and one
 * evaluated here for JS-driven animation produce the same motion.
 */
export function createCubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1
  const bx = 3 * (x2 - x1) - cx
  const ax = 1 - cx - bx
  const cy = 3 * y1
  const by = 3 * (y2 - y1) - cy
  const ay = 1 - cy - by

  const sampleCurveX = (t: number) => ((ax * t + bx) * t + cx) * t
  const sampleCurveY = (t: number) => ((ay * t + by) * t + cy) * t
  const sampleCurveDerivativeX = (t: number) => (3 * ax * t + 2 * bx) * t + cx

  function solveCurveX(x: number): number {
    let t2 = x
    for (let i = 0; i < 8; i++) {
      const dx = sampleCurveX(t2) - x
      if (Math.abs(dx) < 1e-6) return t2
      const derivative = sampleCurveDerivativeX(t2)
      if (Math.abs(derivative) < 1e-6) break
      t2 -= dx / derivative
    }

    let lo = 0
    let hi = 1
    t2 = x
    if (t2 < lo) return lo
    if (t2 > hi) return hi
    while (lo < hi) {
      const dx = sampleCurveX(t2)
      if (Math.abs(dx - x) < 1e-6) return t2
      if (x > dx) lo = t2
      else hi = t2
      t2 = (hi - lo) * 0.5 + lo
    }
    return t2
  }

  return function bezierEase(x: number): number {
    if (x <= 0) return 0
    if (x >= 1) return 1
    return sampleCurveY(solveCurveX(x))
  }
}
