import { describe, expect, it } from 'vitest'
import { appendHistory, createHistoryEntry } from './historyLog'
import type { Participant } from '../types/participant'

const winner: Participant = { id: 'p1', name: 'Alice', hasWon: true }

describe('createHistoryEntry', () => {
  it('captures winner name, id, rigged flag and timestamp', () => {
    const entry = createHistoryEntry(winner, true, '2026-07-25T10:00:00.000Z')
    expect(entry.participantId).toBe('p1')
    expect(entry.name).toBe('Alice')
    expect(entry.rigged).toBe(true)
    expect(entry.wonAt).toBe('2026-07-25T10:00:00.000Z')
    expect(entry.id).toBeTruthy()
  })

  it('defaults wonAt to now when not provided', () => {
    const before = Date.now()
    const entry = createHistoryEntry(winner, false)
    const after = Date.now()
    const wonAtMs = new Date(entry.wonAt).getTime()
    expect(wonAtMs).toBeGreaterThanOrEqual(before)
    expect(wonAtMs).toBeLessThanOrEqual(after)
  })
})

describe('appendHistory', () => {
  it('prepends the new entry so history is newest-first', () => {
    const first = createHistoryEntry(winner, false, '2026-07-25T09:00:00.000Z')
    const second = createHistoryEntry(winner, true, '2026-07-25T09:05:00.000Z')
    const log = appendHistory(appendHistory([], first), second)
    expect(log.map((e) => e.wonAt)).toEqual([second.wonAt, first.wonAt])
  })

  it('does not mutate the original log array', () => {
    const original = appendHistory([], createHistoryEntry(winner, false))
    const next = appendHistory(original, createHistoryEntry(winner, false))
    expect(original).toHaveLength(1)
    expect(next).toHaveLength(2)
  })
})
