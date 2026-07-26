import { describe, expect, it } from 'vitest'
import {
  addParticipants,
  generateNumberedNames,
  getEligibleParticipants,
  markWon,
  removeParticipant,
  resetWinners,
} from './participantPool'
import type { Participant } from '../types/participant'

describe('addParticipants', () => {
  it('adds trimmed names as new participants', () => {
    const pool = addParticipants([], ['  Alice  ', 'Bob'])
    expect(pool).toHaveLength(2)
    expect(pool[0].name).toBe('Alice')
    expect(pool[1].name).toBe('Bob')
    expect(pool[0].hasWon).toBe(false)
    expect(pool[0].id).not.toBe(pool[1].id)
  })

  it('drops empty/whitespace-only names', () => {
    const pool = addParticipants([], ['', '   ', 'Carol'])
    expect(pool.map((p) => p.name)).toEqual(['Carol'])
  })

  it('does not dedupe same-name participants (distinct people, distinct ids)', () => {
    const pool = addParticipants([], ['Nguyen Van A', 'Nguyen Van A'])
    expect(pool).toHaveLength(2)
    expect(pool[0].id).not.toBe(pool[1].id)
  })

  it('appends onto an existing pool without mutating it', () => {
    const original = addParticipants([], ['Alice'])
    const next = addParticipants(original, ['Bob'])
    expect(original).toHaveLength(1)
    expect(next).toHaveLength(2)
  })
})

describe('generateNumberedNames', () => {
  it('produces "1".."count" in order', () => {
    expect(generateNumberedNames(5)).toEqual(['1', '2', '3', '4', '5'])
  })

  it('returns an empty list for zero', () => {
    expect(generateNumberedNames(0)).toEqual([])
  })

  it('clamps negative counts to empty rather than throwing', () => {
    expect(generateNumberedNames(-3)).toEqual([])
  })

  it('floors a fractional count', () => {
    expect(generateNumberedNames(3.9)).toEqual(['1', '2', '3'])
  })
})

describe('removeParticipant', () => {
  it('removes only the matching id', () => {
    const pool = addParticipants([], ['Alice', 'Bob'])
    const next = removeParticipant(pool, pool[0].id)
    expect(next.map((p) => p.name)).toEqual(['Bob'])
  })

  it('is a no-op for an unknown id', () => {
    const pool = addParticipants([], ['Alice'])
    const next = removeParticipant(pool, 'does-not-exist')
    expect(next).toEqual(pool)
  })
})

describe('markWon / resetWinners', () => {
  it('flags only the targeted participant as won', () => {
    const pool = addParticipants([], ['Alice', 'Bob'])
    const next = markWon(pool, pool[0].id)
    expect(next[0].hasWon).toBe(true)
    expect(next[1].hasWon).toBe(false)
  })

  it('resetWinners clears every hasWon flag', () => {
    let pool = addParticipants([], ['Alice', 'Bob'])
    pool = markWon(pool, pool[0].id)
    pool = markWon(pool, pool[1].id)
    const reset = resetWinners(pool)
    expect(reset.every((p) => !p.hasWon)).toBe(true)
  })
})

describe('getEligibleParticipants', () => {
  const pool: Participant[] = [
    { id: '1', name: 'Alice', hasWon: true },
    { id: '2', name: 'Bob', hasWon: false },
  ]

  it('returns everyone when remove-after-win is off, including past winners', () => {
    expect(getEligibleParticipants(pool, false)).toHaveLength(2)
  })

  it('excludes past winners when remove-after-win is on', () => {
    const eligible = getEligibleParticipants(pool, true)
    expect(eligible).toHaveLength(1)
    expect(eligible[0].name).toBe('Bob')
  })

  it('returns an empty array once everyone has won under remove-mode', () => {
    const allWon: Participant[] = pool.map((p) => ({ ...p, hasWon: true }))
    expect(getEligibleParticipants(allWon, true)).toEqual([])
  })
})
