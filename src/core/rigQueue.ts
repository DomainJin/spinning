/** One pre-set winner slot. Stays in the queue after its round runs — see `RigQueue` — so the operator can see what already happened, not just what's next. */
export interface RigEntry {
  id: string
  participantId: string
  played: boolean
}

/** Ordered list of pre-set winners. Consumed head-first among *unplayed* entries — played ones are kept for history instead of being removed. */
export type RigQueue = RigEntry[]

export function enqueue(queue: RigQueue, entryId: string, participantId: string): RigQueue {
  return [...queue, { id: entryId, participantId, played: false }]
}

export function removeFromQueue(queue: RigQueue, entryId: string): RigQueue {
  return queue.filter((entry) => entry.id !== entryId)
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

/**
 * Reorders only the unplayed entries, indexed among themselves (0 = first
 * unplayed entry, regardless of how many played ones precede it) — already
 * played entries stay fixed in their original array slot, so moving a
 * pending entry past one never shifts a played entry's position (and thus
 * its "Lần quay thứ N" label) after the fact.
 */
export function reorderPending(queue: RigQueue, fromPendingIndex: number, toPendingIndex: number): RigQueue {
  const pendingSlots = queue.reduce<number[]>((slots, entry, i) => {
    if (!entry.played) slots.push(i)
    return slots
  }, [])

  if (
    fromPendingIndex < 0 ||
    fromPendingIndex >= pendingSlots.length ||
    toPendingIndex < 0 ||
    toPendingIndex >= pendingSlots.length ||
    fromPendingIndex === toPendingIndex
  ) {
    return queue
  }

  const pendingEntries = pendingSlots.map((slot) => queue[slot])
  const [moved] = pendingEntries.splice(fromPendingIndex, 1)
  pendingEntries.splice(toPendingIndex, 0, moved)

  const result = [...queue]
  pendingSlots.forEach((slot, i) => {
    result[slot] = pendingEntries[i]
  })
  return result
}

/** Marks the first unplayed entry pointing at `participantId` as played, leaving everything else untouched. */
export function markPlayed(queue: RigQueue, entryId: string): RigQueue {
  return queue.map((entry) => (entry.id === entryId ? { ...entry, played: true } : entry))
}

/**
 * Drops *unplayed* entries pointing at ids no longer eligible (removed from
 * the pool, or already won under remove-mode) — played entries are kept
 * regardless, since they're a record of what already happened, not a
 * pending selection that eligibility rules still apply to.
 */
export function sanitizeQueue(queue: RigQueue, eligibleIds: ReadonlySet<string>): RigQueue {
  return queue.filter((entry) => entry.played || eligibleIds.has(entry.participantId))
}
