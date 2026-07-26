import type { Participant } from '../types/participant'

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

export function resetWinners(pool: Participant[]): Participant[] {
  return pool.map((p) => (p.hasWon ? { ...p, hasWon: false } : p))
}

/** Participants a spin may currently pick from — everyone when remove-after-win is off, otherwise only those who haven't won yet. */
export function getEligibleParticipants(pool: Participant[], removeAfterWin: boolean): Participant[] {
  return removeAfterWin ? pool.filter((p) => !p.hasWon) : pool
}
