import { useHistoryStore } from '../../store/useHistoryStore'
import { historyToCsv, historyToWorkbookBuffer } from '../../core/excelExport'
import styles from './ControlPanel.module.css'

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function HistoryPanel() {
  const entries = useHistoryStore((s) => s.entries)
  const clear = useHistoryStore((s) => s.clear)

  const exportXlsx = async () => {
    const buffer = await historyToWorkbookBuffer(entries)
    downloadBlob(
      new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
      'lich-su-trung-thuong.xlsx',
    )
  }

  const exportCsv = () => {
    const csv = historyToCsv(entries)
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'lich-su-trung-thuong.csv')
  }

  return (
    <div>
      <div className={styles.sectionHeader}>
        <h2>Lịch sử ({entries.length})</h2>
      </div>
      <div className={styles.importRow}>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={() => void exportXlsx()}
          disabled={entries.length === 0}
        >
          Xuất Excel
        </button>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={exportCsv}
          disabled={entries.length === 0}
        >
          Xuất CSV
        </button>
      </div>
      <ul className={styles.list}>
        {entries.map((entry) => (
          <li key={entry.id} className={styles.listRow}>
            <span>{entry.name}</span>
            <span className={styles.subtle}>
              {new Date(entry.wonAt).toLocaleTimeString('vi-VN')}
              {entry.rigged ? ' · cơ cấu' : ''}
            </span>
          </li>
        ))}
        {entries.length === 0 && <li className={styles.emptyRow}>Chưa có ai thắng.</li>}
      </ul>
      {entries.length > 0 && (
        <button
          type="button"
          className={styles.dangerLink}
          onClick={() => {
            if (confirm('Xóa toàn bộ lịch sử trúng thưởng?')) clear()
          }}
        >
          Xóa lịch sử
        </button>
      )}
    </div>
  )
}
