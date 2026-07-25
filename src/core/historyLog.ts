import type { HistoryEntry } from '../types/history'
import type { Participant } from '../types/participant'

export function createHistoryEntry(
  winner: Participant,
  rigged: boolean,
  wonAt: string = new Date().toISOString(),
): HistoryEntry {
  return { id: crypto.randomUUID(), participantId: winner.id, name: winner.name, wonAt, rigged }
}

/** History is kept newest-first for display. */
export function appendHistory(log: HistoryEntry[], entry: HistoryEntry): HistoryEntry[] {
  return [entry, ...log]
}
