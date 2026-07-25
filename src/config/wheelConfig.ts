/**
 * All tunable constants for the reel/wheel live here — nothing below should
 * be hardcoded again at the call site.
 */
export const WHEEL_CONFIG = {
  /** How many names are visible in the reel viewport at once. */
  visibleCount: 10,
  /** Height (px) of a single reel row — drives viewport height + scroll math. */
  itemHeightPx: 56,
  /** Max width (px) of the reel viewport at scale 1. */
  viewportMaxWidthPx: 520,
  /** Row height/width multiplier applied on the presenter (audience) window for projector visibility. */
  presenterScale: 1.4,
  /** How many extra full loops of the pool the reel scrolls through before landing, for a convincing spin. */
  minLoops: 3,
  maxLoops: 5,
  /** Spin duration bounds (ms) — actual duration scales with pool size within this range. */
  minDurationMs: 4000,
  maxDurationMs: 7000,
  /** CSS cubic-bezier easing used for the deceleration curve. */
  easing: 'cubic-bezier(0.12, 0.85, 0.16, 1)',
} as const

export const APP_CONFIG = {
  /** BroadcastChannel name shared by control + presenter windows. */
  syncChannelName: 'name-picker-sync',
  /** localStorage key prefix for all persisted slices. */
  storageKeyPrefix: 'name-picker:',
  /** Query param + value that gates the presenter (audience) view. */
  presenterViewParam: 'view',
  presenterViewValue: 'presenter',
} as const
