import { useRef, useState } from 'react'
import { parseParticipantsFromWorkbook } from '../../core/excelImport'
import { useParticipantsStore } from '../../store/useParticipantsStore'
import styles from './ControlPanel.module.css'

export function ParticipantImport() {
  const importNames = useParticipantsStore((s) => s.importNames)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleFile = async (file: File) => {
    const buffer = await file.arrayBuffer()
    const result = await parseParticipantsFromWorkbook(buffer)
    if (result.names.length > 0) {
      importNames(result.names)
      setMessage(`Đã nhập ${result.names.length} người từ "${file.name}".`)
    } else {
      setMessage(result.warnings[0] ?? 'Không đọc được file.')
    }
  }

  return (
    <div className={styles.importRow}>
      <button type="button" className={styles.primaryButton} onClick={() => inputRef.current?.click()}>
        Nhập danh sách Excel
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className={styles.hiddenInput}
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) void handleFile(file)
          event.target.value = ''
        }}
      />
      {message && <p className={styles.importMessage}>{message}</p>}
    </div>
  )
}
