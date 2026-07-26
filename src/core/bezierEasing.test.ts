import { describe, expect, it } from 'vitest'
import { createCubicBezier } from './bezierEasing'

describe('createCubicBezier', () => {
  it('maps the endpoints exactly', () => {
    const ease = createCubicBezier(0.16, 1, 0.3, 1)
    expect(ease(0)).toBe(0)
    expect(ease(1)).toBe(1)
  })

  it('clamps outside [0, 1]', () => {
    const ease = createCubicBezier(0.16, 1, 0.3, 1)
    expect(ease(-0.5)).toBe(0)
    expect(ease(1.5)).toBe(1)
  })

  it('linear(0.25,0.25,0.75,0.75) is the identity within tolerance', () => {
    const ease = createCubicBezier(0.25, 0.25, 0.75, 0.75)
    for (const x of [0.1, 0.3, 0.5, 0.7, 0.9]) {
      expect(ease(x)).toBeCloseTo(x, 3)
    }
  })

  it('an ease-out curve front-loads progress (output ahead of linear input)', () => {
    // cubic-bezier(0.16, 1, 0.3, 1) is a strong ease-out: y1=1 pulls the
    // curve up early, so at any mid x its y should be >= x.
    const ease = createCubicBezier(0.16, 1, 0.3, 1)
    for (const x of [0.1, 0.25, 0.5, 0.75, 0.9]) {
      expect(ease(x)).toBeGreaterThanOrEqual(x)
    }
  })

  it('is monotonically non-decreasing across the range', () => {
    const ease = createCubicBezier(0.16, 1, 0.3, 1)
    let prev = -Infinity
    for (let x = 0; x <= 1; x += 0.02) {
      const y = ease(x)
      expect(y).toBeGreaterThanOrEqual(prev - 1e-9)
      prev = y
    }
  })
})
