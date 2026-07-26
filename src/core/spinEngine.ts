import type { Participant } from '../types/participant'
import type { ReelItem, ReelSequence } from '../types/spin'
import { WHEEL_CONFIG } from '../config/wheelConfig'
import { sanitizeQueue, type RigQueue } from './rigQueue'

export interface SpinSelection {
  winner: Participant
  rigged: boolean
  nextQueue: RigQueue
}

/**
 * Picks the winner for one spin: the rig queue's head takes priority (if it
 * still points at someone eligible), otherwise a uniform-random pick from
 * `eligible`. Returns null only when there is nobody left to pick from.
 */
export function selectWinner(eligible: Participant[], rigQueue: RigQueue): SpinSelection | null {
  const eligibleIds = new Set(eligible.map((p) => p.id))
  const cleanQueue = sanitizeQueue(rigQueue, eligibleIds)
  const headId = cleanQueue[0]
  if (headId !== undefined) {
    const winner = eligible.find((p) => p.id === headId)
    if (winner) {
      return { winner, rigged: true, nextQueue: cleanQueue.slice(1) }
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
 * Spin duration scales with pool size (bigger pool = longer suspense)
 * between `spinDurationMinRatio × targetDurationMs` and `targetDurationMs`
 * itself — `targetDurationMs` is the operator-adjustable spin duration
 * setting (see useSettingsStore.spinDurationSec), not a fixed constant.
 */
export function computeDurationMs(poolSize: number, targetDurationMs: number): number {
  const minDurationMs = targetDurationMs * WHEEL_CONFIG.spinDurationMinRatio
  const sizeFactor = Math.min(Math.max(poolSize, 1), 100) / 100
  return Math.round(minDurationMs + (targetDurationMs - minDurationMs) * sizeFactor)
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
  for (let lap = 0; lap < loops; lap++) {
    shuffled(eligible, rng).forEach((p, seat) => items.push(toReelItem(p, lap, seat)))
  }

  const preWinner = shuffled(eligible, rng)
  for (let i = 0; i < centerIndex; i++) {
    items.push(toReelItem(preWinner[i % preWinner.length], loops, i))
  }

  const winnerIndex = items.length
  items.push(toReelItem(winner, loops, centerIndex))

  const postWinner = shuffled(eligible, rng)
  for (let i = 0; i < tailAfterCount; i++) {
    items.push(toReelItem(postWinner[i % postWinner.length], loops + 1, i))
  }

  return { items, winnerIndex, durationMs: computeDurationMs(eligible.length, targetDurationMs) }
}
