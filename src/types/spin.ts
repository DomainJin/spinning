/** One row of the reel, including a React-list-safe key. */
export interface ReelItem {
  key: string
  participantId: string
  name: string
}

/** Full precomputed animation payload — control and presenter windows render this exact data, never re-derive their own. */
export interface ReelSequence {
  items: ReelItem[]
  /** Index within `items` that lands in the reel's center/highlight row. */
  winnerIndex: number
  durationMs: number
}
