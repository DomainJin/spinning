import { createCubicBezier } from './bezierEasing'
import { WHEEL_CONFIG } from '../config/wheelConfig'

const decelEase = createCubicBezier(...WHEEL_CONFIG.decelEasingControlPoints)

export interface SpinMotionParams {
  /** Final resting translateY (px, negative — the reel scrolls upward). */
  targetY: number
  durationMs: number
}

/**
 * Pure "where should the reel be" function: given how much time has elapsed
 * since a spin started, returns the translateY (px) it should show right
 * now. Used by the control window every animation tick to drive its own
 * reel *and* as the value it broadcasts for the presenter to mirror — so
 * both windows are only ever a message-latency apart, never running two
 * independently-timed animations that can drift out of sync.
 *
 * Two phases: a linear "cruise" covering most of the distance at constant
 * speed, then an eased "decel" phase covering the rest — see
 * WHEEL_CONFIG.decelTimeFraction/decelDistanceFraction for why not one
 * curve for the whole thing.
 */
export function computeSpinY(elapsedMs: number, { targetY, durationMs }: SpinMotionParams): number {
  if (elapsedMs >= durationMs) return targetY
  if (elapsedMs <= 0) return 0

  const decelDurationMs = durationMs * WHEEL_CONFIG.decelTimeFraction
  const cruiseDurationMs = durationMs - decelDurationMs
  const cruiseY = targetY * (1 - WHEEL_CONFIG.decelDistanceFraction)

  if (elapsedMs <= cruiseDurationMs) {
    return cruiseDurationMs === 0 ? cruiseY : cruiseY * (elapsedMs / cruiseDurationMs)
  }

  const decelElapsedMs = elapsedMs - cruiseDurationMs
  const t = decelDurationMs === 0 ? 1 : decelElapsedMs / decelDurationMs
  return cruiseY + (targetY - cruiseY) * decelEase(t)
}
