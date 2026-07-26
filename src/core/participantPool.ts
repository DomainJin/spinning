import type { Participant } from '../types/participant'
import type { ReelItem } from '../types/spin'

export function createParticipant(name: string): Participant {
  return { id: crypto.randomUUID(), name: name.trim(), hasWon: false }
}

/** Ticket numbers "1".."count" for a quick numeric draw when there's no name list — e.g. paper raffle-stub numbers. */
export function generateNumberedNames(count: number): string[] {
  const safeCount = Math.floor(Math.max(0, count))
  return Array.from({ length: safeCount }, (_, i) => String(i + 1))
}

export function addParticipants(pool: Participant[], names: string[]): Participant[] {
  const additions = names
    .map((name) => name.trim())
    .filter((name) => name.length > 0)
    .map(createParticipant)
  return [...pool, ...additions]
}

export function removeParticipant(pool: Participant[], id: string): Participant[] {
  return pool.filter((p) => p.id !== id)
}

export function markWon(pool: Participant[], id: string): Participant[] {
  return pool.map((p) => (p.id === id ? { ...p, hasWon: true } : p))
}

/** Participants a spin may currently pick from — everyone when remove-after-win is off, otherwise only those who haven't won yet. */
export function getEligibleParticipants(pool: Participant[], removeAfterWin: boolean): Participant[] {
  return removeAfterWin ? pool.filter((p) => !p.hasWon) : pool
}

/** Static (non-spinning) reel rows shown before a spin starts — one row per eligible participant, no repeat laps. */
export function toIdleReelItems(eligible: Participant[]): ReelItem[] {
  return eligible.map((p) => ({ key: p.id, participantId: p.id, name: p.name }))
}

export const START_MARKER_NAME = 'START'

/**
 * Inserts a "START" placeholder row at `centerIndex` — where the reel's
 * highlight/pointer sits — padding with blank rows before it if there
 * aren't enough real participants yet, so it always lands exactly under
 * the pointer regardless of pool size. Shown only while idle, in place of
 * whatever participant would otherwise happen to sit there, so the reel
 * doesn't read as "already decided a winner" before anyone's spun it.
 */
export function withStartMarker(items: ReelItem[], centerIndex: number): ReelItem[] {
  const before = items.slice(0, centerIndex)
  while (before.length < centerIndex) {
    before.push({ key: `idle-pad-${before.length}`, participantId: '', name: '' })
  }
  const marker: ReelItem = { key: 'idle-start-marker', participantId: '', name: START_MARKER_NAME }
  return [...before, marker, ...items.slice(centerIndex)]
}
