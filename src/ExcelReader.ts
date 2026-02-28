// Fixed ExcelReader with only essential changes
import { read, utils, write, WorkSheet, WorkBook } from 'xlsx'
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
    const workbook: WorkBook = read(buffer, {
      type: 'buffer',
      cellDates: true,
      cellStyles: true,
      cellNF: true,
      cellFormula: true,
      sheetStubs: true,
      bookVBA: true,
    })
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

  /**
   * Check if buffer is xls format (binary Excel 97-2003 format)
   */
  isXlsFormat(buffer: Buffer): boolean {
    // xls files are OLE compound files starting with specific bytes
    // OLE2 Compound File signature: 0xD0 0xCF 0x11 0xE0
    return (
      buffer.length >= 8 &&
      buffer[0] === 0xd0 &&
      buffer[1] === 0xcf &&
      buffer[2] === 0x11 &&
      buffer[3] === 0xe0
    )
  }

  /**
   * Convert xls buffer to xlsx buffer
   * This allows xlsx-populate to properly load the template
   */
  convertXlsToXlsx(buffer: Buffer): Buffer {
    // Read the xls file
    const workbook: WorkBook = read(buffer, {
      type: 'buffer',
      cellDates: true,
      cellStyles: true,
      cellNF: true,
      cellFormula: true,
    })

    // Write as xlsx format (array type returns Uint8Array)
    const xlsxBuffer = write(workbook, { type: 'buffer', bookType: 'xlsx' })

    return Buffer.from(xlsxBuffer)
  }

  /**
   * Convert worksheet to cell data map with enhanced format information
   */
  convertWorksheetToEnhancedData(worksheet: WorkSheet): any {
    const cells: { [cell: string]: any } = {}
    const mergedCells: { s: { r: number; c: number }; e: { r: number; c: number } }[] = []
    const columnWidths: { [col: number]: number } = {}
    const rowHeights: { [row: number]: number } = {}

    // Get the range of the worksheet
    const range = utils.decode_range(worksheet['!ref'] || 'A1:A1')

    // Get merged cells information
    if (worksheet['!merges']) {
      for (const merge of worksheet['!merges']) {
        mergedCells.push(merge)
      }
    }

    // Get columns width info
    if (worksheet['!cols']) {
      worksheet['!cols'].forEach((colInfo: any, index: number) => {
        if (colInfo && (colInfo.wpx || colInfo.width)) {
          columnWidths[index] = colInfo.wpx || colInfo.width
        }
      })
    }

    // Get rows height info
    if (worksheet['!rows']) {
      worksheet['!rows'].forEach((rowInfo: any, index: number) => {
        if (rowInfo && (rowInfo.hpx || rowInfo.height)) {
          rowHeights[index] = rowInfo.hpx || rowInfo.height
        }
      })
    }

    for (let row = range.s.r; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = utils.encode_cell({ r: row, c: col })
        const origCell = worksheet[cellAddress]

        if (origCell) {
          // Determine if this cell is part of a merged range
          let isMerged = false
          let mergedRange: string | undefined
          if (mergedCells && mergedCells.length > 0) {
            for (const merge of mergedCells) {
              if (row >= merge.s.r && row <= merge.e.r && col >= merge.s.c && col <= merge.e.c) {
                isMerged = true
                mergedRange = `${utils.encode_cell(merge.s)}:${utils.encode_cell(merge.e)}`
                break
              }
            }
          }

          // Store cell value with additional format info
          cells[cellAddress] = {
            value: origCell.v,
            formula: origCell.f || null,
            style: origCell.s ? {} : null, // Simplification to avoid complex typing
            isMerged,
            mergedRange,
          }
        }
      }
    }

    return {
      cells,
      mergedCells,
      columnWidths,
      rowHeights,
    }
  }
}
