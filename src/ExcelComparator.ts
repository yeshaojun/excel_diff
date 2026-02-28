import type {
  CellChange,
  ChangeRecord,
  ComparisonOptions,
  SheetData,
  WorkbookData,
  EnhancedWorkbookData,
  CellValueType,
} from './types'

export class ExcelComparator {
  constructor(private options: ComparisonOptions = {}) {}

  /**
   * Compare two workbook data objects and detect cell changes
   */
  compare(baseData: WorkbookData, targetData: WorkbookData): CellChange[] {
    const changes: CellChange[] = []

    // Get all sheet names from both workbooks
    const allSheets = new Set([...Object.keys(baseData), ...Object.keys(targetData)])

    for (const sheet of allSheets) {
      const baseSheet = baseData[sheet] || {}
      const targetSheet = targetData[sheet] || {}

      const sheetChanges = this.compareSheets(sheet, baseSheet, targetSheet)
      changes.push(...sheetChanges)
    }

    return changes
  }

  /**
   * Enhanced comparision that handles enriched format data
   */
  compareEnhanced(base: EnhancedWorkbookData, target: EnhancedWorkbookData): CellChange[] {
    const changes: CellChange[] = []

    // Get all sheet names from both workbooks
    const allSheets = new Set([...Object.keys(base), ...Object.keys(target)])

    for (const sheetName of allSheets) {
      const baseSheet = base[sheetName] ? base[sheetName].cells : {}
      const targetSheet = target[sheetName] ? target[sheetName].cells : {}

      // Extract values from enhanced data for comparison
      const baseSimpleSheet: SheetData = {}
      const targetSimpleSheet: SheetData = {}

      // Map enhanced cell format to simple key-value pairs
      Object.entries(baseSheet).forEach(([cell, valueObj]) => {
        if (valueObj && typeof valueObj === 'object' && 'value' in valueObj) {
          baseSimpleSheet[cell] = (valueObj as CellValueType).value
        } else {
          baseSimpleSheet[cell] = valueObj
        }
      })

      Object.entries(targetSheet).forEach(([cell, valueObj]) => {
        if (valueObj && typeof valueObj === 'object' && 'value' in valueObj) {
          targetSimpleSheet[cell] = (valueObj as CellValueType).value
        } else {
          targetSimpleSheet[cell] = valueObj
        }
      })

      const sheetChanges = this.compareSheets(sheetName, baseSimpleSheet, targetSimpleSheet)
      changes.push(...sheetChanges)
    }

    return changes
  }

  /**
   * Compare two sheets and detect cell-level changes
   */
  private compareSheets(
    sheetName: string,
    baseSheet: SheetData,
    targetSheet: SheetData
  ): CellChange[] {
    const changes: CellChange[] = []

    // Get all cell addresses from both sheets
    const allCells = new Set([...Object.keys(baseSheet), ...Object.keys(targetSheet)])

    for (const cell of allCells) {
      const baseValue = baseSheet[cell]
      const targetValue = targetSheet[cell]
      const change = this.compareCell(sheetName, cell, baseValue, targetValue)

      if (change) {
        changes.push(change)
      }
    }

    return changes
  }

  /**
   * Compare a single cell and detect the type of change
   */
  private compareCell(
    sheet: string,
    cell: string,
    baseValue: unknown,
    targetValue: unknown
  ): CellChange | null {
    const normalizedBase = this.normalizeValue(baseValue)
    const normalizedTarget = this.normalizeValue(targetValue)

    // Skip if ignoring empty cells and both are empty
    if (this.options.ignoreEmptyCells && !normalizedBase && !normalizedTarget) {
      return null
    }

    // Cell exists in both but values differ - modified
    if (baseValue !== undefined && targetValue !== undefined) {
      if (normalizedBase !== normalizedTarget) {
        return {
          sheet,
          cell,
          changeType: 'modified',
          oldValue: baseValue,
          newValue: targetValue,
        }
      }
      return null
    }

    // Cell only in target - added
    if (targetValue !== undefined) {
      if (!this.options.ignoreEmptyCells || normalizedTarget) {
        return {
          sheet,
          cell,
          changeType: 'added',
          oldValue: undefined,
          newValue: targetValue,
        }
      }
      return null
    }

    // Cell only in base - deleted
    if (baseValue !== undefined) {
      if (!this.options.ignoreEmptyCells || normalizedBase) {
        return {
          sheet,
          cell,
          changeType: 'deleted',
          oldValue: baseValue,
          newValue: undefined,
        }
      }
      return null
    }

    return null
  }

  /**
   * Normalize value for comparison based on options
   */
  private normalizeValue(value: unknown): unknown {
    if (value === null || value === undefined) {
      return undefined
    }

    if (typeof value === 'string') {
      let normalized = value

      if (this.options.trimWhitespace) {
        normalized = normalized.trim()
      }

      if (this.options.ignoreCase) {
        normalized = normalized.toLowerCase()
      }

      return normalized
    }

    return value
  }

  /**
   * Create a change record with metadata
   */
  createChangeRecord(
    fileName: string,
    changes: CellChange[],
    timestamp: Date = new Date()
  ): ChangeRecord {
    return {
      fileName,
      changes,
      timestamp,
    }
  }
}
