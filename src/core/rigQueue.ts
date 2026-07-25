/** Ordered queue of participant IDs pre-set to win upcoming rounds, consumed head-first. */
export type RigQueue = string[]

export function enqueue(queue: RigQueue, participantId: string): RigQueue {
  return [...queue, participantId]
}

export function removeFromQueue(queue: RigQueue, participantId: string): RigQueue {
  return queue.filter((id) => id !== participantId)
}

export function reorderQueue(queue: RigQueue, fromIndex: number, toIndex: number): RigQueue {
  if (
    fromIndex < 0 ||
    fromIndex >= queue.length ||
    toIndex < 0 ||
    toIndex >= queue.length ||
    fromIndex === toIndex
  ) {
    return queue
  }
  const copy = [...queue]
  const [moved] = copy.splice(fromIndex, 1)
  copy.splice(toIndex, 0, moved)
  return copy
}

/** Drops queue entries pointing at ids no longer eligible (removed from the pool, or already won under remove-mode), preserving order. */
export function sanitizeQueue(queue: RigQueue, eligibleIds: ReadonlySet<string>): RigQueue {
  return queue.filter((id) => eligibleIds.has(id))
}
