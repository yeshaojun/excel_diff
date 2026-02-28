import { read, utils, WorkSheet, WorkBook } from 'xlsx'
import type { WorkbookData, SheetData } from './types'

export class ExcelParseError extends Error {
  constructor(filePath: string, cause: unknown) {
    super(`Failed to parse Excel file: ${filePath}`)
    this.name = 'ExcelParseError'
    this.cause = cause
  }
}

export class ExcelReader {
  /**
   * Read and parse an Excel file into workbook data
   */
  async readFile(filePath: string): Promise<WorkbookData> {
    try {
      const { readFile } = await import('fs/promises')
      const buffer = await readFile(filePath)
      const workbook: WorkBook = read(buffer, { type: 'buffer', cellDates: true })
      return this.convertToWorkbookData(workbook)
    } catch (error) {
      throw new ExcelParseError(filePath, error)
    }
  }

  /**
   * Read and parse an Excel file from buffer
   */
  readFromBuffer(buffer: Buffer): WorkbookData {
    const workbook: WorkBook = read(buffer, { type: 'buffer', cellDates: true })
    return this.convertToWorkbookData(workbook)
  }

  /**
   * Convert xlsx workbook to our internal format
   */
  private convertToWorkbookData(workbook: WorkBook): WorkbookData {
    const result: WorkbookData = {}

    for (const sheetName of workbook.SheetNames) {
      const worksheet: WorkSheet = workbook.Sheets[sheetName]
      const sheetData = this.convertSheetData(worksheet)
      result[sheetName] = sheetData
    }

    return result
  }

  /**
   * Convert worksheet to cell data map
   */
  private convertSheetData(worksheet: WorkSheet): SheetData {
    const sheetData: SheetData = {}

    // Get the range of the worksheet
    const range = utils.decode_range(worksheet['!ref'] || 'A1:A1')

    for (let row = range.s.r; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = utils.encode_cell({ r: row, c: col })
        const cell = worksheet[cellAddress]

        if (cell && cell.v !== undefined) {
          sheetData[cellAddress] = cell.v
        }
      }
    }

    return sheetData
  }
}
