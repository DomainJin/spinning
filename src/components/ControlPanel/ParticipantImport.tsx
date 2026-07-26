import { useRef, useState } from 'react'
import { parseParticipantsFromWorkbook } from '../../core/excelImport'
import { generateNumberedNames } from '../../core/participantPool'
import { APP_CONFIG } from '../../config/wheelConfig'
import { useParticipantsStore } from '../../store/useParticipantsStore'
import styles from './ControlPanel.module.css'

export function ParticipantImport() {
  const importNames = useParticipantsStore((s) => s.importNames)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [ticketCount, setTicketCount] = useState('')

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

  const parsedCount = Number(ticketCount)
  const isValidCount =
    Number.isInteger(parsedCount) && parsedCount > 0 && parsedCount <= APP_CONFIG.maxGeneratedTickets

  const handleGenerate = () => {
    if (!isValidCount) return
    importNames(generateNumberedNames(parsedCount))
    setMessage(`Đã tạo ${parsedCount} số vé (1 – ${parsedCount}).`)
    setTicketCount('')
  }

  return (
    <div>
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
      </div>

      <div className={styles.importRow}>
        <input
          type="number"
          min={1}
          max={APP_CONFIG.maxGeneratedTickets}
          className={styles.textInput}
          placeholder="Hoặc nhập số lượng (vd: 200)"
          value={ticketCount}
          onChange={(event) => setTicketCount(event.target.value)}
        />
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={handleGenerate}
          disabled={!isValidCount}
        >
          Tạo danh sách theo số
        </button>
      </div>

      {message && <p className={styles.importMessage}>{message}</p>}
    </div>
  )
}
