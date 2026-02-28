import { writeFile } from 'fs/promises'
import type { CellChange, ChangeRecord, ComparisonResult } from './types'

export type OutputFormat = 'text' | 'json' | 'markdown' | 'csv'

export class ChangeRecordGenerator {
  /**
   * Generate human-readable text output
   */
  generateText(record: ChangeRecord): string {
    const lines: string[] = []

    lines.push(`\n📄 File: ${record.fileName}`)
    lines.push(`📅 Timestamp: ${record.timestamp.toISOString()}`)
    lines.push(`\n📊 Changes Detected: ${record.changes.length}`)
    lines.push(''.padEnd(60, '-'))

    if (record.changes.length === 0) {
      lines.push('✅ No changes detected')
    } else {
      // Group changes by type
      const byType = this.groupChangesByType(record.changes)

      for (const [changeType, changes] of Object.entries(byType)) {
        lines.push(
          `\n${this.getTypeIcon(changeType)} ${this.capitalize(changeType)} (${changes.length})`
        )
        lines.push('')

        for (const change of changes) {
          lines.push(`   Sheet: ${change.sheet} | Cell: ${change.cell}`)
          if (changeType !== 'added') {
            lines.push(`   Before: ${this.formatValue(change.oldValue)}`)
          }
          if (changeType !== 'deleted') {
            lines.push(`   After:  ${this.formatValue(change.newValue)}`)
          }
          lines.push('')
        }
      }
    }

    lines.push(''.padEnd(60, '-'))

    return lines.join('\n')
  }

  /**
   * Generate JSON output
   */
  generateJSON(result: ComparisonResult): string {
    return JSON.stringify(result, null, 2)
  }

  /**
   * Generate Markdown output
   */
  generateMarkdown(record: ChangeRecord): string {
    const lines: string[] = []

    lines.push(`# Excel Comparison Report`)
    lines.push(`\n**File:** \`${record.fileName}\``)
    lines.push(`**Timestamp:** ${record.timestamp.toISOString()}`)
    lines.push(`**Total Changes:** ${record.changes.length}`)
    lines.push('')

    if (record.changes.length === 0) {
      lines.push('✅ No changes detected')
    } else {
      const byType = this.groupChangesByType(record.changes)

      for (const [changeType, changes] of Object.entries(byType)) {
        lines.push(`\n## ${this.capitalize(changeType)} (${changes.length})\n`)

        for (const change of changes) {
          lines.push(`### ${change.sheet}!${change.cell}\n`)
          lines.push(`| Property | Value |`)
          lines.push(`|----------|-------|`)

          if (changeType !== 'added') {
            lines.push(`| Before | \`${this.formatValue(change.oldValue)}\` |`)
          }
          if (changeType !== 'deleted') {
            lines.push(`| After | \`${this.formatValue(change.newValue)}\` |`)
          }
          lines.push('')
        }
      }
    }

    return lines.join('\n')
  }

  /**
   * Generate CSV output
   */
  generateCSV(record: ChangeRecord): string {
    const lines: string[] = []

    // CSV header
    lines.push('Sheet,Cell,Change Type,Old Value,New Value')

    // CSV data
    for (const change of record.changes) {
      const oldValue = this.escapeCSV(this.formatValue(change.oldValue))
      const newValue = this.escapeCSV(this.formatValue(change.newValue))

      lines.push(`${change.sheet},${change.cell},${change.changeType},"${oldValue}","${newValue}"`)
    }

    return lines.join('\n')
  }

  /**
   * Write output to file
   */
  async writeToFile(content: string, filePath: string): Promise<void> {
    await writeFile(filePath, content, 'utf-8')
  }

  /**
   * Group changes by type for better organization
   */
  private groupChangesByType(changes: CellChange[]): Record<string, CellChange[]> {
    const grouped: Record<string, CellChange[]> = {
      added: [],
      modified: [],
      deleted: [],
    }

    for (const change of changes) {
      grouped[change.changeType].push(change)
    }

    return grouped
  }

  /**
   * Get icon for change type
   */
  private getTypeIcon(changeType: string): string {
    const icons: Record<string, string> = {
      added: '➕',
      modified: '✏️',
      deleted: '🗑️',
    }
    return icons[changeType] || '📝'
  }

  /**
   * Format value for display
   */
  private formatValue(value: unknown): string {
    if (value === undefined || value === null) {
      return '(empty)'
    }
    return String(value)
  }

  /**
   * Capitalize first letter
   */
  private capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1)
  }

  /**
   * Escape CSV special characters
   */
  private escapeCSV(value: string): string {
    return value.replace(/"/g, '""')
  }
}
