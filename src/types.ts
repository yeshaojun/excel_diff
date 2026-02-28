export type ChangeType = 'added' | 'deleted' | 'modified'

export interface CellChange {
  sheet: string
  cell: string
  changeType: ChangeType
  oldValue: unknown
  newValue: unknown
}

export interface ChangeRecord {
  fileName: string
  changes: CellChange[]
  timestamp: Date
}

export interface ComparisonResult {
  baseFile: string
  targetFiles: string[]
  records: ChangeRecord[]
}

export interface ComparisonOptions {
  ignoreEmptyCells?: boolean
  ignoreCase?: boolean
  trimWhitespace?: boolean
}

export interface SheetData {
  [cell: string]: unknown
}

export interface WorkbookData {
  [sheetName: string]: SheetData
}
