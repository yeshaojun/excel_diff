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


export type CellValueType = {
  value: unknown,
  formula: string | null,
  style: {
    fill: { fgColor: ColorValue, bgColor?: ColorValue } | null,
    font: {
      name?: string,
      sz?: number,
      color?: ColorValue,
      bold?: boolean,
      italic?: boolean,
      underline?: boolean
    } | null,
    border?: BorderValue,
    alignment?: AlignmentValue
  } | null,
  isMerged: boolean,
  mergedRange?: string
}

export type ColorValue = {
  rgb?: string,
  theme?: number,
  indexed?: number,
  auto?: boolean
}

export type BorderValue = {
  top?: BorderSide,
  bottom?: BorderSide,
  left?: BorderSide,
  right?: BorderSide
}

export type BorderSide = {
  style?: string,
  color?: ColorValue
}

export type AlignmentValue = {
  horizontal?: string,
  vertical?: string
}

export type EnhancedSheetData = {
  cells: { [cell: string]: CellValueType },
  mergedCells: [{ s: { r: number, c: number }, e: { r: number, c: number }}],
  columnWidths: { [col: number]: number },
  rowHeights: { [row: number]: number }
}

export type EnhancedWorkbookData = {
  [sheetName: string]: EnhancedSheetData
}

export interface SheetData {
  [cell: string]: unknown
}

export interface WorkbookData {
  [sheetName: string]: SheetData

}
