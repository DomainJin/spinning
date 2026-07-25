import { describe, expect, it } from 'vitest'
import * as XLSX from 'xlsx'
import { historyToCsv, historyToWorkbookBuffer } from './excelExport'
import type { HistoryEntry } from '../types/history'

const history: HistoryEntry[] = [
  { id: 'h1', participantId: 'p1', name: 'Alice', wonAt: '2026-07-25T09:00:00.000Z', rigged: false },
  { id: 'h2', participantId: 'p2', name: 'Bob, "The Great"', wonAt: '2026-07-25T09:05:00.000Z', rigged: true },
]

describe('historyToWorkbookBuffer', () => {
  it('round-trips through XLSX.read with the expected rows', async () => {
    const buffer = await historyToWorkbookBuffer(history)
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet)

    expect(rows).toHaveLength(2)
    expect(rows[0]['Tên người thắng']).toBe('Alice')
    expect(rows[0]['Cơ cấu trước']).toBe('Không')
    expect(rows[1]['Tên người thắng']).toBe('Bob, "The Great"')
    expect(rows[1]['Cơ cấu trước']).toBe('Có')
  })

  it('produces a valid (empty) workbook for an empty history', async () => {
    const buffer = await historyToWorkbookBuffer([])
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    expect(XLSX.utils.sheet_to_json(sheet)).toEqual([])
  })
})

describe('historyToCsv', () => {
  it('quotes and escapes values containing commas or quotes', () => {
    const csv = historyToCsv(history)
    const lines = csv.split('\r\n')
    expect(lines[0]).toBe('STT,Ten nguoi thang,Thoi gian,Co cau truoc')
    expect(lines[2]).toContain('"Bob, ""The Great"""')
  })

  it('returns just the header row for empty history', () => {
    expect(historyToCsv([])).toBe('STT,Ten nguoi thang,Thoi gian,Co cau truoc')
  })
})
