import { describe, expect, it } from 'vitest'
import { computeSpinY } from './spinMotion'
import { WHEEL_CONFIG } from '../config/wheelConfig'

const TARGET_Y = -5600 // negative: the reel scrolls upward
const DURATION_MS = 10000

describe('computeSpinY', () => {
  it('is at the origin at or before elapsed=0', () => {
    expect(computeSpinY(0, { targetY: TARGET_Y, durationMs: DURATION_MS })).toBe(0)
    expect(computeSpinY(-50, { targetY: TARGET_Y, durationMs: DURATION_MS })).toBe(0)
  })

  it('lands exactly on target at or after the full duration', () => {
    expect(computeSpinY(DURATION_MS, { targetY: TARGET_Y, durationMs: DURATION_MS })).toBe(TARGET_Y)
    expect(computeSpinY(DURATION_MS + 5000, { targetY: TARGET_Y, durationMs: DURATION_MS })).toBe(TARGET_Y)
  })

  it('reaches exactly cruiseY at the cruise/decel boundary', () => {
    const cruiseDurationMs = DURATION_MS * (1 - WHEEL_CONFIG.decelTimeFraction)
    const cruiseY = TARGET_Y * (1 - WHEEL_CONFIG.decelDistanceFraction)
    expect(computeSpinY(cruiseDurationMs, { targetY: TARGET_Y, durationMs: DURATION_MS })).toBeCloseTo(
      cruiseY,
      6,
    )
  })

  it('is linear during the cruise phase (half the cruise time = half the cruise distance)', () => {
    const cruiseDurationMs = DURATION_MS * (1 - WHEEL_CONFIG.decelTimeFraction)
    const cruiseY = TARGET_Y * (1 - WHEEL_CONFIG.decelDistanceFraction)
    const halfway = computeSpinY(cruiseDurationMs / 2, { targetY: TARGET_Y, durationMs: DURATION_MS })
    expect(halfway).toBeCloseTo(cruiseY / 2, 6)
  })

  it('is monotonic — never moves back toward the origin as time advances', () => {
    let prev = 0
    for (let elapsed = 0; elapsed <= DURATION_MS; elapsed += DURATION_MS / 50) {
      const y = computeSpinY(elapsed, { targetY: TARGET_Y, durationMs: DURATION_MS })
      // targetY is negative, so y should only ever become more negative (or equal).
      expect(y).toBeLessThanOrEqual(prev + 1e-9)
      prev = y
    }
  })

  it('handles a zero duration by landing immediately', () => {
    expect(computeSpinY(0, { targetY: TARGET_Y, durationMs: 0 })).toBe(TARGET_Y)
  })

  it('handles a zero target (degenerate winnerIndex === centerIndex) without NaN', () => {
    for (const elapsed of [0, 2000, 5000, DURATION_MS]) {
      expect(computeSpinY(elapsed, { targetY: 0, durationMs: DURATION_MS })).toBe(0)
    }
  })
})
