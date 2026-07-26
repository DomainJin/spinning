import { describe, expect, it } from 'vitest'
import { buildReelSequence, computeDurationMs, selectWinner } from './spinEngine'
import { WHEEL_CONFIG } from '../config/wheelConfig'
import type { Participant } from '../types/participant'

const TARGET_DURATION_MS = 10000

function makePool(names: string[]): Participant[] {
  return names.map((name, i) => ({ id: `p${i}`, name, hasWon: false }))
}

describe('selectWinner', () => {
  it('picks the rig queue head when it is eligible', () => {
    const pool = makePool(['Alice', 'Bob', 'Carol'])
    const result = selectWinner(pool, [pool[1].id])
    expect(result?.winner.name).toBe('Bob')
    expect(result?.rigged).toBe(true)
    expect(result?.nextQueue).toEqual([])
  })

  it('falls through to random when the rig queue is empty', () => {
    const pool = makePool(['Alice'])
    const result = selectWinner(pool, [])
    expect(result?.winner.name).toBe('Alice')
    expect(result?.rigged).toBe(false)
  })

  it('drops a rig entry pointing at someone no longer eligible and falls back to random', () => {
    const pool = makePool(['Alice', 'Bob'])
    const result = selectWinner(pool, ['ghost-id-not-in-pool'])
    expect(result).not.toBeNull()
    expect(result?.rigged).toBe(false)
    expect(result?.nextQueue).toEqual([])
  })

  it('returns null when there is nobody eligible to pick from', () => {
    expect(selectWinner([], [])).toBeNull()
  })

  it('random pick always lands on a pool member (many trials)', () => {
    const pool = makePool(['Alice', 'Bob', 'Carol'])
    const ids = new Set(pool.map((p) => p.id))
    for (let i = 0; i < 50; i++) {
      const result = selectWinner(pool, [])
      expect(ids.has(result!.winner.id)).toBe(true)
    }
  })
})

describe('computeDurationMs', () => {
  it('stays within the min-ratio..target bounds', () => {
    const minDurationMs = TARGET_DURATION_MS * WHEEL_CONFIG.spinDurationMinRatio
    expect(computeDurationMs(1, TARGET_DURATION_MS)).toBeGreaterThanOrEqual(minDurationMs)
    expect(computeDurationMs(1000, TARGET_DURATION_MS)).toBeLessThanOrEqual(TARGET_DURATION_MS)
  })

  it('grows with pool size', () => {
    expect(computeDurationMs(50, TARGET_DURATION_MS)).toBeGreaterThan(
      computeDurationMs(2, TARGET_DURATION_MS),
    )
  })

  it('scales with the target duration setting', () => {
    expect(computeDurationMs(50, 20000)).toBeGreaterThan(computeDurationMs(50, 10000))
  })
})

describe('buildReelSequence', () => {
  const pool = makePool(['Alice', 'Bob', 'Carol', 'Dave', 'Erin'])
  const winner = pool[2]

  it('lands the winner at winnerIndex, with correct head/tail padding around it', () => {
    const sequence = buildReelSequence(pool, winner, TARGET_DURATION_MS)
    const centerIndex = Math.floor(WHEEL_CONFIG.visibleCount / 2)
    const tailAfterCount = WHEEL_CONFIG.visibleCount - centerIndex - 1

    expect(sequence.items[sequence.winnerIndex].participantId).toBe(winner.id)
    expect(sequence.items).toHaveLength(sequence.winnerIndex + 1 + tailAfterCount)
    expect(sequence.winnerIndex).toBeGreaterThanOrEqual(pool.length * WHEEL_CONFIG.minLoops)
  })

  it('every reel item references a real pool member', () => {
    const sequence = buildReelSequence(pool, winner, TARGET_DURATION_MS)
    const validIds = new Set(pool.map((p) => p.id))
    expect(sequence.items.every((item) => validIds.has(item.participantId))).toBe(true)
  })

  it('produces a deterministic sequence for a deterministic rng', () => {
    const rng = () => 0
    const a = buildReelSequence(pool, winner, TARGET_DURATION_MS, rng)
    const b = buildReelSequence(pool, winner, TARGET_DURATION_MS, rng)
    expect(a).toEqual(b)
  })

  it('handles a single-eligible-participant pool without crashing', () => {
    const solo = makePool(['OnlyOne'])
    const sequence = buildReelSequence(solo, solo[0], TARGET_DURATION_MS)
    expect(sequence.items[sequence.winnerIndex].name).toBe('OnlyOne')
    expect(sequence.items.every((item) => item.participantId === solo[0].id)).toBe(true)
  })

  it('sets duration from computeDurationMs for the given pool size and target', () => {
    const sequence = buildReelSequence(pool, winner, TARGET_DURATION_MS, () => 0)
    expect(sequence.durationMs).toBe(computeDurationMs(pool.length, TARGET_DURATION_MS))
  })
})
