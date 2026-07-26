import { useMemo, useState } from 'react'
import { useParticipantsStore } from '../../store/useParticipantsStore'
import { useRigStore } from '../../store/useRigStore'
import styles from './ControlPanel.module.css'

export function RigPanel() {
  const participants = useParticipantsStore((s) => s.participants)
  const queue = useRigStore((s) => s.queue)
  const add = useRigStore((s) => s.add)
  const remove = useRigStore((s) => s.remove)
  const reorder = useRigStore((s) => s.reorder)
  const clear = useRigStore((s) => s.clear)
  const [selectedId, setSelectedId] = useState('')

  const participantById = useMemo(() => new Map(participants.map((p) => [p.id, p])), [participants])

  // A participant can be queued again after their rigged round has already
  // played (e.g. to rig them a second time) — only a still-pending entry
  // blocks re-adding.
  const pendingParticipantIds = useMemo(
    () => new Set(queue.filter((e) => !e.played).map((e) => e.participantId)),
    [queue],
  )
  const availableToAdd = useMemo(
    () => participants.filter((p) => !pendingParticipantIds.has(p.id)),
    [participants, pendingParticipantIds],
  )

  // Reorder arrows move an entry among *unplayed* entries only — see
  // store/useRigStore.reorder — so each pending entry needs its index
  // within just that subset, not its raw position in the full queue.
  const pendingIndexById = useMemo(() => {
    const map = new Map<string, number>()
    let i = 0
    for (const entry of queue) {
      if (!entry.played) map.set(entry.id, i++)
    }
    return map
  }, [queue])
  const pendingCount = pendingIndexById.size

  const handleAdd = () => {
    if (!selectedId) return
    add(selectedId)
    setSelectedId('')
  }

  return (
    <div>
      <div className={styles.sectionHeader}>
        <h2>Cơ cấu trước ({pendingCount})</h2>
      </div>
      <div className={styles.importRow}>
        <select
          className={styles.textInput}
          value={selectedId}
          onChange={(event) => setSelectedId(event.target.value)}
        >
          <option value="">-- Chọn người thắng kế tiếp --</option>
          {availableToAdd.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={handleAdd}
          disabled={!selectedId}
        >
          Thêm vào hàng đợi
        </button>
      </div>
      <ol className={styles.list}>
        {queue.map((entry, index) => {
          const participant = participantById.get(entry.participantId)
          const pendingIndex = pendingIndexById.get(entry.id)
          return (
            <li
              key={entry.id}
              className={entry.played ? `${styles.listRow} ${styles.listRowPlayed}` : styles.listRow}
            >
              <span>
                Lần quay thứ {index + 1}: {participant?.name ?? '(không rõ)'}
                {entry.played && <span className={styles.badge}> Đã quay</span>}
              </span>
              <div className={styles.rowActions}>
                {!entry.played && (
                  <>
                    <button
                      type="button"
                      className={styles.iconButton}
                      disabled={pendingIndex === 0}
                      onClick={() => reorder(pendingIndex!, pendingIndex! - 1)}
                      aria-label="Chuyển lên"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className={styles.iconButton}
                      disabled={pendingIndex === pendingCount - 1}
                      onClick={() => reorder(pendingIndex!, pendingIndex! + 1)}
                      aria-label="Chuyển xuống"
                    >
                      ↓
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={() => remove(entry.id)}
                  aria-label="Xóa khỏi hàng đợi"
                >
                  ✕
                </button>
              </div>
            </li>
          )
        })}
        {queue.length === 0 && (
          <li className={styles.emptyRow}>
            Chưa cơ cấu người thắng nào — lượt quay tiếp theo sẽ ngẫu nhiên.
          </li>
        )}
      </ol>
      {queue.length > 0 && (
        <button type="button" className={styles.dangerLink} onClick={() => clear()}>
          Xóa toàn bộ hàng đợi
        </button>
      )}
    </div>
  )
}
