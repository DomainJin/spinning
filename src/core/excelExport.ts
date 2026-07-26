import type { HistoryEntry } from '../types/history'

function toRows(history: HistoryEntry[]) {
  return history.map((entry, index) => ({
    STT: index + 1,
    'Tên người thắng': entry.name,
    'Thời gian': new Date(entry.wonAt).toLocaleString('vi-VN'),
    'Config trước': entry.rigged ? 'Có' : 'Không',
  }))
}

export async function historyToWorkbookBuffer(history: HistoryEntry[]): Promise<ArrayBuffer> {
  const XLSX = await import('xlsx')
  const sheet = XLSX.utils.json_to_sheet(toRows(history))
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Lich su')
  return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
}

function csvEscape(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function historyToCsv(history: HistoryEntry[]): string {
  const header = ['STT', 'Ten nguoi thang', 'Thoi gian', 'Config truoc']
  const lines = [header.join(',')]
  history.forEach((entry, index) => {
    const cells = [
      String(index + 1),
      csvEscape(entry.name),
      csvEscape(new Date(entry.wonAt).toLocaleString('vi-VN')),
      entry.rigged ? 'Co' : 'Khong',
    ]
    lines.push(cells.join(','))
  })
  return lines.join('\r\n')
}
