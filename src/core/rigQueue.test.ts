import { describe, expect, it } from 'vitest'
import {
  enqueue,
  markPlayed,
  removeFromQueue,
  reorderPending,
  reorderQueue,
  sanitizeQueue,
  type RigQueue,
} from './rigQueue'

describe('enqueue / removeFromQueue', () => {
  it('appends unplayed entries in order', () => {
    expect(enqueue(enqueue([], '1', 'a'), '2', 'b')).toEqual([
      { id: '1', participantId: 'a', played: false },
      { id: '2', participantId: 'b', played: false },
    ])
  })

  it('removes only the matching entry id, preserving order of the rest', () => {
    const queue: RigQueue = [
      { id: '1', participantId: 'a', played: false },
      { id: '2', participantId: 'b', played: false },
      { id: '3', participantId: 'c', played: false },
    ]
    expect(removeFromQueue(queue, '2')).toEqual([queue[0], queue[2]])
  })

  it('removeFromQueue is a no-op for an id not present', () => {
    const queue: RigQueue = [{ id: '1', participantId: 'a', played: false }]
    expect(removeFromQueue(queue, 'z')).toEqual(queue)
  })
})

describe('reorderQueue', () => {
  it('moves an entry from one index to another', () => {
    const queue: RigQueue = [
      { id: '1', participantId: 'a', played: false },
      { id: '2', participantId: 'b', played: false },
      { id: '3', participantId: 'c', played: false },
    ]
    expect(reorderQueue(queue, 0, 2)).toEqual([queue[1], queue[2], queue[0]])
    expect(reorderQueue(queue, 2, 0)).toEqual([queue[2], queue[0], queue[1]])
  })

  it('ignores out-of-range indices', () => {
    const queue: RigQueue = [
      { id: '1', participantId: 'a', played: false },
      { id: '2', participantId: 'b', played: false },
    ]
    expect(reorderQueue(queue, -1, 1)).toEqual(queue)
    expect(reorderQueue(queue, 0, 5)).toEqual(queue)
  })

  it('is a no-op when from and to are equal', () => {
    const queue: RigQueue = [
      { id: '1', participantId: 'a', played: false },
      { id: '2', participantId: 'b', played: false },
    ]
    expect(reorderQueue(queue, 1, 1)).toEqual(queue)
  })
})

describe('reorderPending', () => {
  it('reorders unplayed entries among themselves, leaving played entries in their original slot', () => {
    const queue: RigQueue = [
      { id: '1', participantId: 'a', played: true },
      { id: '2', participantId: 'b', played: false },
      { id: '3', participantId: 'c', played: true },
      { id: '4', participantId: 'd', played: false },
      { id: '5', participantId: 'e', played: false },
    ]
    // pending entries, in order, are b(0) d(1) e(2) — move e (pending index 2) to pending index 0
    const result = reorderPending(queue, 2, 0)
    expect(result).toEqual([
      { id: '1', participantId: 'a', played: true },
      { id: '5', participantId: 'e', played: false },
      { id: '3', participantId: 'c', played: true },
      { id: '2', participantId: 'b', played: false },
      { id: '4', participantId: 'd', played: false },
    ])
  })

  it('ignores out-of-range pending indices', () => {
    const queue: RigQueue = [
      { id: '1', participantId: 'a', played: true },
      { id: '2', participantId: 'b', played: false },
    ]
    expect(reorderPending(queue, -1, 0)).toEqual(queue)
    expect(reorderPending(queue, 0, 5)).toEqual(queue)
  })

  it('is a no-op when from and to are equal', () => {
    const queue: RigQueue = [
      { id: '1', participantId: 'a', played: false },
      { id: '2', participantId: 'b', played: false },
    ]
    expect(reorderPending(queue, 0, 0)).toEqual(queue)
  })
})

describe('markPlayed', () => {
  it('flips only the matching entry to played, keeping the rest untouched', () => {
    const queue: RigQueue = [
      { id: '1', participantId: 'a', played: false },
      { id: '2', participantId: 'b', played: false },
    ]
    expect(markPlayed(queue, '1')).toEqual([
      { id: '1', participantId: 'a', played: true },
      { id: '2', participantId: 'b', played: false },
    ])
  })

  it('is a no-op for an id not present', () => {
    const queue: RigQueue = [{ id: '1', participantId: 'a', played: false }]
    expect(markPlayed(queue, 'z')).toEqual(queue)
  })
})

describe('sanitizeQueue', () => {
  it('drops unplayed entries whose id is no longer eligible, preserving order of survivors', () => {
    const eligible = new Set(['a', 'c'])
    const queue: RigQueue = [
      { id: '1', participantId: 'a', played: false },
      { id: '2', participantId: 'b', played: false },
      { id: '3', participantId: 'c', played: false },
    ]
    expect(sanitizeQueue(queue, eligible)).toEqual([queue[0], queue[2]])
  })

  it('keeps played entries even when their id is no longer eligible', () => {
    const queue: RigQueue = [
      { id: '1', participantId: 'a', played: true },
      { id: '2', participantId: 'b', played: false },
    ]
    expect(sanitizeQueue(queue, new Set())).toEqual([queue[0]])
  })

  it('is a no-op when every entry is already eligible', () => {
    const queue: RigQueue = [
      { id: '1', participantId: 'a', played: false },
      { id: '2', participantId: 'b', played: false },
    ]
    expect(sanitizeQueue(queue, new Set(['a', 'b']))).toEqual(queue)
  })
})
