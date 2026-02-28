// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-explicit-any
const XlsxPopulate: any = require('xlsx-populate')
import type { CellChange } from './types'

export class ExcelExporter {
  /**
   * Check if buffer is xls format (binary Excel 97-2003 format)
   * xls files start with specific OLE compound file signature
   */
  private isXlsFormat(buffer: Buffer): boolean {
    // xlsx files are ZIP archives starting with PK
    // xls files are OLE compound files starting with specific bytes
    // Check for OLE2 Compound File signature: 0xD0 0xCF 0x11 0xE0
    return (
      buffer.length >= 8 &&
      buffer[0] === 0xd0 &&
      buffer[1] === 0xcf &&
      buffer[2] === 0x11 &&
      buffer[3] === 0xe0
    )
  }

  async exportModifiedExcel(
    targetData: Record<string, Record<string, unknown>>,
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

      // Check if file is xls format (old binary format not supported by xlsx-populate)
      const isXls = this.isXlsFormat(templateBuffer)
      console.log('Is xls format:', isXls)

      if (isXls) {
        console.log('xls format detected - creating new workbook (template not supported)')
        workbook = await XlsxPopulate.fromBlankAsync()
        console.log('New blank workbook created for xls conversion')
      } else {
        try {
          workbook = await XlsxPopulate.fromDataAsync(templateBuffer)
          console.log('Template workbook loaded successfully')
        } catch (error) {
          console.error('Error loading template workbook:', error)
          console.log('Falling back to blank workbook')
          workbook = await XlsxPopulate.fromBlankAsync()
        }
      }
    } else {
      console.log('Creating new blank workbook...')
      workbook = await XlsxPopulate.fromBlankAsync()
      console.log('New workbook created successfully')
    }

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

      // Get target data for this sheet
      const targetSheet = targetData[sheetName] || {}
      console.log(
        `Target data cells count for sheet "${sheetName}":`,
        Object.keys(targetSheet).length
      )

      // Get changes for this sheet
      const sheetChanges = changes.filter(c => c.sheet === sheetName)
      console.log(`Changes for sheet "${sheetName}":`, sheetChanges.length)

      // Update cells with target data (preserving existing formatting from template)
      console.log('Updating cells with target data...')
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
            strike: true,
            fontColor: '8B4513',
          })
          console.log('    Applied: deleted style (pink)')
          break
        default:
          // Don't apply any style for unchanged cells (keep original)
          console.log('    No style applied (default)')
          break
      }
    } catch (error) {
      console.error(`    Error applying style to cell:`, error)
      // Continue without applying style - don't break the export
    }
  }
}
