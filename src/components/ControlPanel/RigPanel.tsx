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
  const availableToAdd = useMemo(
    () => participants.filter((p) => !queue.includes(p.id)),
    [participants, queue],
  )

  const handleAdd = () => {
    if (!selectedId) return
    add(selectedId)
    setSelectedId('')
  }

  return (
    <div>
      <div className={styles.sectionHeader}>
        <h2>Cơ cấu trước ({queue.length})</h2>
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
        {queue.map((id, index) => {
          const participant = participantById.get(id)
          return (
            <li key={id} className={styles.listRow}>
              <span>
                Vòng {index + 1}: {participant?.name ?? '(không rõ)'}
              </span>
              <div className={styles.rowActions}>
                <button
                  type="button"
                  className={styles.iconButton}
                  disabled={index === 0}
                  onClick={() => reorder(index, index - 1)}
                  aria-label="Chuyển lên"
                >
                  ↑
                </button>
                <button
                  type="button"
                  className={styles.iconButton}
                  disabled={index === queue.length - 1}
                  onClick={() => reorder(index, index + 1)}
                  aria-label="Chuyển xuống"
                >
                  ↓
                </button>
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={() => remove(id)}
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
