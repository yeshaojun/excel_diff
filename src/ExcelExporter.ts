// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-explicit-any
const XlsxPopulate: any = require('xlsx-populate')
import { utils } from 'xlsx'
import type { CellChange } from './types'
// Define types locally to avoid compatibility problems
type CellValueType = {
  value: unknown
  formula: string | null
  style: {
    fill: { fgColor: any; bgColor?: any } | null
    font: {
      name?: string
      sz?: number
      color?: any
      bold?: boolean
      italic?: boolean
      underline?: boolean
    } | null
    border?: any
    alignment?: any
  } | null
  isMerged: boolean
  mergedRange?: string
}

type EnhancedSheetData = {
  cells: { [cell: string]: CellValueType }
  mergedCells: [{ s: { r: number; c: number }; e: { r: number; c: number } }]
  columnWidths: { [col: number]: number }
  rowHeights: { [row: number]: number }
}

type EnhancedWorkbookData = {
  [sheetName: string]: EnhancedSheetData
}

export class ExcelExporter {
  async exportModifiedExcel(
    targetData: Record<string, Record<string, unknown>> | EnhancedWorkbookData,
    changes: CellChange[],
    templateBuffer?: Buffer
  ): Promise<Buffer> {
    console.log('=== ExcelExporter.exportModifiedExcel START ===')
    console.log('targetData keys:', Object.keys(targetData))
    console.log('changes count:', changes.length)
    console.log('templateBuffer exists:', !!templateBuffer)
    if (templateBuffer) {
      console.log('templateBuffer size:', templateBuffer.byteLength)
    }

    // Load template workbook (target file) to preserve all formatting
    let workbook
    if (templateBuffer) {
      console.log('Loading template workbook from buffer...')

      try {
        workbook = await XlsxPopulate.fromDataAsync(templateBuffer)
        console.log('Template workbook loaded successfully')
        console.log('  Sheets count:', workbook.sheets().length)
        console.log(
          '  Sheet names:',
          workbook.sheets().map((s: any) => s.name())
        )
      } catch (error) {
        console.error('Error loading template workbook:', error)
        console.log('Falling back to blank workbook')
        workbook = await XlsxPopulate.fromBlankAsync()
      }
    } else {
      console.log('Creating new blank workbook...')
      workbook = await XlsxPopulate.fromBlankAsync()
      console.log('New workbook created successfully')
    }

    // Check for enhanced format type
    const hasEnhancedFormat =
      targetData &&
      typeof (targetData as EnhancedWorkbookData)[Object.keys(targetData)[0]] !== 'undefined' &&
      typeof ((targetData as EnhancedWorkbookData)[Object.keys(targetData)[0]] as any).cells !==
        'undefined'

    // Collect all sheet names from target data and changes
    const allSheets = new Set([...Object.keys(targetData), ...changes.map(c => c.sheet)])
    console.log('All sheets to process:', Array.from(allSheets))

    for (const sheetName of allSheets) {
      console.log(`\n--- Processing sheet: ${sheetName} ---`)

      // Get or create worksheet
      let sheet = workbook.sheet(sheetName)
      if (!sheet) {
        console.log(`Sheet "${sheetName}" not found in workbook, creating new sheet`)
        sheet = workbook.addSheet(sheetName)
        console.log(`New sheet created: ${sheetName}`)
      } else {
        console.log(`Found existing sheet: ${sheetName}`)
      }

      // Process different data types
      if (hasEnhancedFormat) {
        const enhancedData = targetData as EnhancedWorkbookData
        const targetSheetEnhanced = enhancedData[sheetName]?.cells || {}
        const mergedCellRanges = enhancedData[sheetName]?.mergedCells || []

        // Process merged cells first
        if (mergedCellRanges && mergedCellRanges.length > 0) {
          console.log(
            `Sheet "${sheetName}" has ${mergedCellRanges.length} merged ranges, applying...`
          )
          for (const mergeRange of mergedCellRanges) {
            try {
              const startCell = utils.encode_cell(mergeRange.s)
              const endCell = utils.encode_cell(mergeRange.e)
              const rangeStr = `${startCell}:${endCell}`

              // Apply merge using xlsx-populate
              const range = sheet.range(rangeStr)
              if (range) {
                range.merge()
                console.log(`  Merged range: ${rangeStr}`)
              }
            } catch (mergeError) {
              console.error(`  Error merging range:`, mergeError)
            }
          }
        }

        console.log(
          `Enhanced target data cells count for sheet "${sheetName}":`,
          Object.keys(targetSheetEnhanced).length
        )

        // Update cells with enhanced data
        for (const [cellAddress, cellObj] of Object.entries(targetSheetEnhanced)) {
          try {
            if (!this.isValidCellAddress(cellAddress)) {
              console.warn(`Invalid cell address: ${cellAddress}, skipping`)
              continue
            }
            const cell = sheet.cell(cellAddress)
            if (cellObj.value !== null && cellObj.value !== undefined) {
              cell.value(cellObj.value as string | number | boolean)

              // Apply format from original data if present
              if (cellObj.style) {
                this.applyEnhancedFormatToCell(cell, cellObj.style)
              }
            }
          } catch (cellError) {
            console.error(`Error updating cell ${cellAddress}:`, cellError)
          }
        }
      } else {
        // Standard processing (backward compatibility)
        const targetSheet = targetData[sheetName] || {}
        console.log(
          `Target data cells count for sheet "${sheetName}":`,
          Object.keys(targetSheet).length
        )

        // Update cells with target data (preserving existing formatting from template)
        for (const [cellAddress, value] of Object.entries(targetSheet)) {
          try {
            if (!this.isValidCellAddress(cellAddress)) {
              console.warn(`Invalid cell address: ${cellAddress}, skipping`)
              continue
            }
            const cell = sheet.cell(cellAddress)
            if (value !== null && value !== undefined) {
              cell.value(value as string | number | boolean)
            }
          } catch (cellError) {
            console.error(`Error updating cell ${cellAddress}:`, cellError)
          }
        }
      }

      // Get changes for this sheet
      const sheetChanges = changes.filter(c => c.sheet === sheetName)
      console.log(`Changes for sheet "${sheetName}":`, sheetChanges.length)

      console.log('Target data updated')

      // Apply changes with highlight colors
      if (sheetChanges.length > 0) {
        console.log('Applying change highlights...')
        for (const change of sheetChanges) {
          const { cell, changeType, newValue } = change
          console.log(`  Applying ${changeType} to cell ${cell}`)

          try {
            const cellObj = sheet.cell(cell)
            if (!cellObj) {
              console.warn(`  Cell ${cell} not found in sheet, skipping`)
              continue
            }

            // Set new value
            if (newValue !== null && newValue !== undefined) {
              cellObj.value(newValue as string | number | boolean)
            }

            // Apply highlight style based on change type
            if (changeType) {
              this.applyHighlightStyle(cellObj, changeType)
            }
          } catch (cellError) {
            console.error(`  Error processing cell ${cell}:`, cellError)
          }
        }
        console.log('Changes applied')

        // Set sheet tab color based on change types
        try {
          const hasModified = sheetChanges.some(c => c.changeType === 'modified')
          const hasAdded = sheetChanges.some(c => c.changeType === 'added')
          const hasDeleted = sheetChanges.some(c => c.changeType === 'deleted')

          if (hasModified) {
            sheet.tabColor('FF6B6B') // Red for modified
            console.log('Tab color set: red (modified)')
          } else if (hasAdded) {
            sheet.tabColor('90EE90') // Green for added
            console.log('Tab color set: green (added)')
          } else if (hasDeleted) {
            sheet.tabColor('FFC0CB') // Pink for deleted
            console.log('Tab color set: pink (deleted)')
          }
        } catch (tabColorError) {
          console.error('Error setting tab color:', tabColorError)
        }
      }
    }

    // Generate buffer
    console.log('\n=== Generating output buffer ===')
    const buffer = await workbook.outputAsync({ type: 'nodebuffer' })
    console.log('Buffer generated successfully, size:', buffer.byteLength)
    console.log('=== ExcelExporter.exportModifiedExcel END ===\n')

    return Buffer.from(buffer)
  }

  /**
   * Validate cell address format (e.g., "A1", "BC123")
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private isValidCellAddress(address: string): boolean {
    // Basic cell address validation: column letters followed by row number
    return /^[A-Z]+\d+$/i.test(address)
  }

  private applyEnhancedFormatToCell(cell: any, style: any): void {
    if (!style) {
      // No style to apply
      return
    }

    try {
      // Apply fill style from source data if available
      if (style.fill && style.fill.fgColor) {
        const fgColor =
          style.fill.fgColor.rgb || style.fill.fgColor.theme || style.fill.fgColor.indexed
        if (fgColor) {
          cell.style('fill', {
            type: 'solid',
            color: { rgb: fgColor.toString().padStart(6, '0') || 'FFFFFF' }, // default to white
          })
        }
      }

      // Apply font styles if available
      if (style.font) {
        if (style.font.bold !== undefined) {
          cell.style('fontBold', style.font.bold)
        }
        if (style.font.italic !== undefined) {
          cell.style('fontItalic', style.font.italic)
        }
        if (style.font.name) {
          cell.style('fontName', style.font.name)
        }
        if (style.font.sz) {
          cell.style('fontSize', style.font.sz)
        }
        if (style.font.color) {
          const fontColor =
            style.font.color.rgb || style.font.color.theme || style.font.color.indexed
          if (fontColor) {
            cell.style('fontColor', fontColor.toString().padStart(6, '0'))
          }
        }
      }

      // Apply alignment if available
      if (style.alignment) {
        if (style.alignment.horizontal) {
          cell.style('horizontalAlignment', style.alignment.horizontal)
        }
        if (style.alignment.vertical) {
          cell.style('verticalAlignment', style.alignment.vertical)
        }
      }
    } catch (styleError) {
      // Skip formatting if error occurred
      console.warn('Warning - could not apply enhanced formatting to cell:', {
        error: (styleError as Error).message,
        cell,
      })
    }
  }

  /**
   * Apply highlight color based on change type
   * This overlays on top of existing formatting
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private applyHighlightStyle(cell: any, changeType: string): void {
    console.log(`    applyHighlightStyle: ${changeType}`)

    try {
      switch (changeType) {
        case 'added':
          // Green highlight for added cells
          cell.style({
            fill: '90EE90',
            bold: true,
            fontColor: '006400',
          })
          console.log('    Applied: added style (green)')
          break
        case 'modified':
          // Red highlight for modified cells
          cell.style({
            fill: 'FF6B6B',
            bold: true,
            fontColor: '8B0000',
          })
          console.log('    Applied: modified style (red)')
          break
        case 'deleted':
          // Pink highlight for deleted cells
          cell.style({
            fill: 'FFC0CB',
            strikethrough: true,
            fontColor: '8B4513',
          })
          console.log('    Applied: deleted style (pink)')
          break
        default:
          // Don't apply any style for unchanged cells (keep original)
          console.log('    No style applied (default)')
          break
      }
    } catch (error: any) {
      console.error('    Error applying style to cell:', { error: error.message, changeType })
      // Continue without applying style - don't break the export
    }
  }
}
