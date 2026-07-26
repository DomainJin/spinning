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
  /**
   * Rows actually rendered in the presenter's viewport — deliberately fewer
   * than `visibleCount` because the LED wall is only 4m tall against 20m
   * wide (5:1): 10 rows at a readable size simply doesn't fit that height
   * budget. Still centers correctly (see ReelWheel's `visibleRows` prop).
   */
  presenterVisibleRows: 5,
  /**
   * Fraction of the letterboxed presenter stage's height the reel viewport
   * is allowed to occupy (the rest is left for glass-panel padding + the
   * status/winner line). Row height is derived from this at runtime — see
   * useStageHeightPx — instead of a fixed px/scale, because a fixed size
   * can only ever be correct for one specific output resolution, and this
   * stage's actual resolution depends on the LED wall's AV setup.
   */
  presenterReelHeightFraction: 0.58,
  /** How many extra full loops of the pool the reel scrolls through before landing, for a convincing spin. */
  minLoops: 3,
  maxLoops: 5,
  /**
   * Spin duration is operator-adjustable (see useSettingsStore.spinDurationSec)
   * and used exactly as set, regardless of pool size — these just bound the
   * slider and seed its default.
   */
  minSpinDurationSec: 5,
  maxSpinDurationSec: 20,
  defaultSpinDurationSec: 10,
  /**
   * The spin runs in two explicit phases rather than one bezier curve for
   * the whole thing — a single easing curve strong enough to look fast at
   * the start ends up finishing ~85-100% of the distance in the first
   * 15-20% of the *time*, so the rest of the configured duration is spent
   * essentially frozen waiting for transitionend. Splitting it out gives
   * exact control over when the visible slow-down starts.
   */
  /** Fraction of total spin time spent in the slow-down phase (the rest is constant-speed cruising). */
  decelTimeFraction: 0.3,
  /** Fraction of total scroll distance covered during that slow-down phase (the rest happens during the fast cruise). */
  decelDistanceFraction: 0.12,
  /** CSS timing function for the slow-down phase — smooth, decisive stop. */
  decelEasing: 'cubic-bezier(0.16, 1, 0.3, 1)',
} as const

export const APP_CONFIG = {
  /** BroadcastChannel name shared by control + presenter windows. */
  syncChannelName: 'name-picker-sync',
  /** localStorage key prefix for all persisted slices. */
  storageKeyPrefix: 'name-picker:',
  /** Query param + value that gates the presenter (audience) view. */
  presenterViewParam: 'view',
  presenterViewValue: 'presenter',
  /**
   * Width:height ratio of the physical LED wall (20m × 4m = 5:1). The
   * presenter stage is letterboxed to this ratio via CSS regardless of the
   * actual browser window size, so it renders correctly as long as
   * whatever feeds the LED processor preserves aspect ratio end to end.
   */
  presenterAspectRatio: 5,
  /**
   * Where the reel/winner overlay sits on the presenter background, as a
   * fraction of stage width/height. Measured directly from the KV artwork's
   * clear negative-space band (product box ~0-20%, face illustration from
   * ~51% onward) — the empty gap is centered around 35.5%, not 50%.
   */
  presenterContentCenterX: 0.355,
  presenterContentMaxWidthPct: 0.3,
} as const
