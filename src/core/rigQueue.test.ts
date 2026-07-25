import { describe, expect, it } from 'vitest'
import { enqueue, removeFromQueue, reorderQueue, sanitizeQueue } from './rigQueue'

describe('enqueue / removeFromQueue', () => {
  it('appends ids in order', () => {
    expect(enqueue(enqueue([], 'a'), 'b')).toEqual(['a', 'b'])
  })

  it('removes only the matching id, preserving order of the rest', () => {
    expect(removeFromQueue(['a', 'b', 'c'], 'b')).toEqual(['a', 'c'])
  })

  it('removeFromQueue is a no-op for an id not present', () => {
    expect(removeFromQueue(['a', 'b'], 'z')).toEqual(['a', 'b'])
  })
})

describe('reorderQueue', () => {
  it('moves an entry from one index to another', () => {
    expect(reorderQueue(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a'])
    expect(reorderQueue(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b'])
  })

  it('ignores out-of-range indices', () => {
    const queue = ['a', 'b']
    expect(reorderQueue(queue, -1, 1)).toEqual(queue)
    expect(reorderQueue(queue, 0, 5)).toEqual(queue)
  })

  it('is a no-op when from and to are equal', () => {
    const queue = ['a', 'b']
    expect(reorderQueue(queue, 1, 1)).toEqual(queue)
  })
})

describe('sanitizeQueue', () => {
  it('drops ids no longer in the eligible set, preserving order of survivors', () => {
    const eligible = new Set(['a', 'c'])
    expect(sanitizeQueue(['a', 'b', 'c'], eligible)).toEqual(['a', 'c'])
  })

  it('returns an empty queue when nothing is eligible', () => {
    expect(sanitizeQueue(['a', 'b'], new Set())).toEqual([])
  })

  it('is a no-op when every id is already eligible', () => {
    const queue = ['a', 'b']
    expect(sanitizeQueue(queue, new Set(['a', 'b']))).toEqual(queue)
  })
})
