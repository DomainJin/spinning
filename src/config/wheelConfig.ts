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
   * is allowed to occupy (the rest is glass-panel padding — the panel holds
   * nothing else now that the status/winner line has been removed). Row
   * height is derived from this at runtime — see useStageHeightPx — instead
   * of a fixed px/scale, because a fixed size can only ever be correct for
   * one specific output resolution, and this stage's actual resolution
   * depends on the LED wall's AV setup. Sized so the glass panel's bottom
   * edge reaches close to the stage's own bottom edge (measured against the
   * KV artwork's negative-space band, which stays clear all the way down —
   * see APP_CONFIG.presenterContentTopPct for the top anchor).
   */
  presenterReelHeightFraction: 0.65,
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
   * 15-20% of the *time*, leaving the rest of the configured duration spent
   * essentially frozen. Splitting it out gives exact control over when the
   * visible slow-down starts. The control window computes this motion in JS
   * every frame (see core/spinMotion.ts) and broadcasts the live position —
   * the presenter only ever renders whatever position it's told, never its
   * own independently-timed animation, so the two can't drift apart.
   */
  /** Fraction of total spin time spent in the slow-down phase (the rest is constant-speed cruising). */
  decelTimeFraction: 0.3,
  /** Fraction of total scroll distance covered during that slow-down phase (the rest happens during the fast cruise). */
  decelDistanceFraction: 0.12,
  /**
   * cubic-bezier control points for the slow-down phase. An "ease-out-quad"
   * curve — the previous [0.16, 1, 0.3, 1] was "ease-out-expo", which
   * reaches ~88% progress by just 30% of the way through this phase (it
   * front-loads nearly the entire deceleration into the first instant, then
   * crawls the rest), reading as a sudden brake rather than a gradual
   * slowdown. This curve is only at ~51% progress by that same point,
   * spreading the slowdown evenly across the whole phase for more felt
   * suspense before it settles.
   */
  decelEasingControlPoints: [0.5, 1, 0.89, 1] as [number, number, number, number],
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
   * fraction of stage width — measured directly from the KV artwork's
   * "Pharmalogy | Phaselisa meso lifter" logo text (pixel-scanned: spans
   * ~23.7%-42.9% of width, center ~33.3%), so the panel lines up under the
   * logo instead of sitting in the middle of the whole empty gap.
   */
  presenterContentCenterX: 0.333,
  /**
   * Fixed width of the overlay (not just a cap) — matched to the logo's
   * measured ~19.1% width so the panel visually lines up with it exactly,
   * regardless of whether the loaded content is short numbers or long
   * names (letting width track content length would drift off-alignment
   * with the logo depending on what's loaded).
   */
  presenterContentWidthPct: 0.2,
  /**
   * Top edge of the reel/winner overlay, as a fraction of stage height —
   * measured from the KV artwork's brightness (the "Pharmalogy | Phaselisa"
   * logo lockup spans roughly 8%-19% of stage height), so the panel starts
   * safely below it instead of covering it. Anchored from the top rather
   * than vertically centered so this stays true regardless of how tall the
   * panel ends up (reel row count, font sizes, etc. change).
   */
  presenterContentTopPct: 0.23,
  /** Upper bound on the "generate ticket numbers 1..N" quick-start input, so a typo doesn't allocate a huge in-memory list. */
  maxGeneratedTickets: 5000,
} as const
