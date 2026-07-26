import type { Participant } from '../types/participant'
import type { ReelItem, ReelSequence } from '../types/spin'
import { WHEEL_CONFIG } from '../config/wheelConfig'
import { markPlayed, sanitizeQueue, type RigQueue } from './rigQueue'

export interface SpinSelection {
  winner: Participant
  rigged: boolean
  nextQueue: RigQueue
}

/**
 * Picks the winner for one spin: the rig queue's first *unplayed* entry
 * takes priority (if it still points at someone eligible), otherwise a
 * uniform-random pick from `eligible`. Returns null only when there is
 * nobody left to pick from. A rigged pick is marked played in `nextQueue`
 * rather than removed, so the operator can still see it happened.
 */
export function selectWinner(eligible: Participant[], rigQueue: RigQueue): SpinSelection | null {
  const eligibleIds = new Set(eligible.map((p) => p.id))
  const cleanQueue = sanitizeQueue(rigQueue, eligibleIds)
  const headEntry = cleanQueue.find((entry) => !entry.played)
  if (headEntry !== undefined) {
    const winner = eligible.find((p) => p.id === headEntry.participantId)
    if (winner) {
      return { winner, rigged: true, nextQueue: markPlayed(cleanQueue, headEntry.id) }
    }
  }
  if (eligible.length === 0) return null
  const winner = eligible[Math.floor(Math.random() * eligible.length)]
  return { winner, rigged: false, nextQueue: cleanQueue }
}

function shuffled<T>(arr: T[], rng: () => number): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function toReelItem(p: Participant, lap: number, seat: number): ReelItem {
  return { key: `${p.id}-${lap}-${seat}`, participantId: p.id, name: p.name }
}

/**
 * Same as `shuffled`, but if the result's first element would collide with
 * `avoidId` — typically whoever the reel just showed, right before this
 * shuffle's segment starts — swaps it out for a different position.
 *
 * Each independent shuffle only guarantees no repeats *within* itself, not
 * across the boundary with whatever segment came before it, so the same
 * participant can otherwise land in two adjacent rows purely by chance
 * right where one segment (a lap, or the pre/post-winner padding) meets the
 * next. This is a single, local, one-time fix applied at the moment each
 * segment is built, rather than a global pass over the finished sequence —
 * an earlier version of this logic re-scanned and swapped rows after the
 * fact and could undo its own fix a few rows later (each swap looked valid
 * in isolation), oscillating instead of converging and occasionally making
 * things worse. Fixing each boundary once, in construction order, can't do
 * that.
 */
function shuffledAvoidingFirst(
  pool: Participant[],
  rng: () => number,
  avoidId: string | null,
): Participant[] {
  const result = shuffled(pool, rng)
  if (avoidId !== null && result.length > 1 && result[0].id === avoidId) {
    const swapWith = 1 + Math.floor(rng() * (result.length - 1))
    ;[result[0], result[swapWith]] = [result[swapWith], result[0]]
  }
  return result
}

/**
 * Builds the full reel item list the UI animates through. `eligible` must
 * include `winner` (guaranteed by `selectWinner`'s contract) — every lap is
 * an independent shuffle of `eligible` so the reel doesn't visibly repeat a
 * fixed cycle while spinning.
 */
export function buildReelSequence(
  eligible: Participant[],
  winner: Participant,
  targetDurationMs: number,
  rng: () => number = Math.random,
): ReelSequence {
  const { visibleCount, minLoops, maxLoops } = WHEEL_CONFIG
  const centerIndex = Math.floor(visibleCount / 2)
  const tailAfterCount = visibleCount - centerIndex - 1
  const loops = minLoops + Math.floor(rng() * (maxLoops - minLoops + 1))

  const items: ReelItem[] = []
  let lastId: string | null = null
  for (let lap = 0; lap < loops; lap++) {
    const lapItems = shuffledAvoidingFirst(eligible, rng, lastId)
    lapItems.forEach((p, seat) => items.push(toReelItem(p, lap, seat)))
    lastId = lapItems[lapItems.length - 1]?.id ?? null
  }

  const preWinner = shuffledAvoidingFirst(eligible, rng, lastId)
  const preWinnerRows = Array.from({ length: centerIndex }, (_, i) => preWinner[i % preWinner.length])
  // The row right before the winner shouldn't show the winner again —
  // `shuffledAvoidingFirst` only protects preWinnerRows[0] (the boundary
  // with the lap above); this is the *other* boundary, with the winner's
  // own row right after it. Adjacent preWinnerRows entries can never
  // collide with each other (see the function doc above), so only this
  // last slot needs checking.
  if (centerIndex > 0 && preWinnerRows[centerIndex - 1].id === winner.id) {
    const prevId = centerIndex >= 2 ? preWinnerRows[centerIndex - 2].id : lastId
    const replacement = eligible.find((p) => p.id !== winner.id && p.id !== prevId)
    if (replacement) preWinnerRows[centerIndex - 1] = replacement
  }
  preWinnerRows.forEach((p, i) => items.push(toReelItem(p, loops, i)))

  const winnerIndex = items.length
  items.push(toReelItem(winner, loops, centerIndex))

  const postWinner = shuffledAvoidingFirst(eligible, rng, winner.id)
  for (let i = 0; i < tailAfterCount; i++) {
    items.push(toReelItem(postWinner[i % postWinner.length], loops + 1, i))
  }

  return { items, winnerIndex, durationMs: targetDurationMs }
}
