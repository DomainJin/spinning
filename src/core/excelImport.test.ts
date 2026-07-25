import { describe, expect, it } from 'vitest'
import * as XLSX from 'xlsx'
import { parseParticipantsFromWorkbook } from './excelImport'

function bufferFromRows(rows: (string | number | undefined)[][]): ArrayBuffer {
  const sheet = XLSX.utils.aoa_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Sheet1')
  return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
}

describe('parseParticipantsFromWorkbook', () => {
  it('detects a Vietnamese "Tên" header and extracts names below it', async () => {
    const buffer = bufferFromRows([
      ['STT', 'Tên'],
      [1, 'Nguyễn Văn A'],
      [2, 'Trần Thị B'],
    ])
    const result = await parseParticipantsFromWorkbook(buffer)
    expect(result.names).toEqual(['Nguyễn Văn A', 'Trần Thị B'])
    expect(result.warnings).toEqual([])
  })

  it('detects a "Họ và tên" header', async () => {
    const buffer = bufferFromRows([
      ['Họ và tên', 'Phòng ban'],
      ['Lê Văn C', 'Kỹ thuật'],
    ])
    const result = await parseParticipantsFromWorkbook(buffer)
    expect(result.names).toEqual(['Lê Văn C'])
  })

  it('detects an English "Name" header', async () => {
    const buffer = bufferFromRows([
      ['Name', 'Email'],
      ['Alice', 'alice@example.com'],
      ['Bob', 'bob@example.com'],
    ])
    const result = await parseParticipantsFromWorkbook(buffer)
    expect(result.names).toEqual(['Alice', 'Bob'])
  })

  it('falls back to the first column when no header is recognized', async () => {
    const buffer = bufferFromRows([['Alice'], ['Bob'], ['Carol']])
    const result = await parseParticipantsFromWorkbook(buffer)
    expect(result.names).toEqual(['Alice', 'Bob', 'Carol'])
  })

  it('skips blank name cells within the data rows', async () => {
    const buffer = bufferFromRows([['Tên'], ['Alice'], [''], ['Carol']])
    const result = await parseParticipantsFromWorkbook(buffer)
    expect(result.names).toEqual(['Alice', 'Carol'])
  })

  it('warns and returns no names for a sheet with only a header row', async () => {
    const buffer = bufferFromRows([['Tên']])
    const result = await parseParticipantsFromWorkbook(buffer)
    expect(result.names).toEqual([])
    expect(result.warnings).toContain('Không tìm thấy tên nào trong file.')
  })
})
