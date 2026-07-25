export interface HistoryEntry {
  id: string
  participantId: string
  name: string
  /** ISO timestamp. */
  wonAt: string
  rigged: boolean
}
