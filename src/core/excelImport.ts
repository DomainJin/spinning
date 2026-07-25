const NAME_HEADER_PATTERNS = [
  /^h[oọ]\s*(v[aà])?\s*t[eê]n$/i,
  /^t[eê]n$/i,
  /^name$/i,
  /^full\s*name$/i,
  /^attendee$/i,
]

export interface ExcelImportResult {
  names: string[]
  warnings: string[]
}

/**
 * Reads the first sheet of an uploaded workbook and extracts a flat name
 * list. Looks for a header cell matching a known "name" pattern (Vietnamese
 * or English); if none is found, assumes a single unlabeled name-per-row
 * column and reads from the first column starting at row 1.
 */
export async function parseParticipantsFromWorkbook(data: ArrayBuffer): Promise<ExcelImportResult> {
  const XLSX = await import('xlsx')
  const workbook = XLSX.read(data, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) {
    return { names: [], warnings: ['File Excel không có sheet nào.'] }
  }

  const sheet = workbook.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false })
  if (rows.length === 0) {
    return { names: [], warnings: ['Sheet đầu tiên trống.'] }
  }

  const headerRow = (rows[0] ?? []).map((cell) => String(cell ?? '').trim())
  const nameColIndex = headerRow.findIndex((header) =>
    NAME_HEADER_PATTERNS.some((pattern) => pattern.test(header)),
  )

  const hasHeader = nameColIndex >= 0
  const useColumn = hasHeader ? nameColIndex : 0
  const dataRows = hasHeader ? rows.slice(1) : rows

  const names = dataRows
    .map((row) => String(row[useColumn] ?? '').trim())
    .filter((name) => name.length > 0)

  const warnings: string[] = []
  if (names.length === 0) {
    warnings.push('Không tìm thấy tên nào trong file.')
  }

  return { names, warnings }
}
