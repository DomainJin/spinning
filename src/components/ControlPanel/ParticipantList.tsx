import { useMemo, useState } from 'react'
import { useParticipantsStore } from '../../store/useParticipantsStore'
import styles from './ControlPanel.module.css'

export function ParticipantList() {
  const participants = useParticipantsStore((s) => s.participants)
  const remove = useParticipantsStore((s) => s.remove)
  const clearAll = useParticipantsStore((s) => s.clearAll)
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return participants
    return participants.filter((p) => p.name.toLowerCase().includes(q))
  }, [participants, query])

  const remainingCount = participants.filter((p) => !p.hasWon).length

  return (
    <div>
      <div className={styles.sectionHeader}>
        <h2>Người tham dự ({participants.length})</h2>
        <span className={styles.subtle}>{remainingCount} chưa thắng</span>
      </div>
      <input
        className={styles.textInput}
        placeholder="Tìm tên..."
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <ul className={styles.list} style={{ marginTop: 12 }}>
        {filtered.map((p) => (
          <li key={p.id} className={styles.listRow}>
            <span className={p.hasWon ? styles.wonName : undefined}>{p.name}</span>
            <div className={styles.rowActions}>
              {p.hasWon && <span className={styles.badge}>Đã thắng</span>}
              <button
                type="button"
                className={styles.iconButton}
                onClick={() => remove(p.id)}
                aria-label={`Xóa ${p.name}`}
              >
                ✕
              </button>
            </div>
          </li>
        ))}
        {filtered.length === 0 && <li className={styles.emptyRow}>Không có ai trong danh sách.</li>}
      </ul>
      {participants.length > 0 && (
        <button
          type="button"
          className={styles.dangerLink}
          onClick={() => {
            if (confirm('Xóa toàn bộ danh sách người tham dự?')) clearAll()
          }}
        >
          Xóa toàn bộ danh sách
        </button>
      )}
    </div>
  )
}
