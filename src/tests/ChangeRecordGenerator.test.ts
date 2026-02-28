import { ChangeRecordGenerator } from '../ChangeRecordGenerator'
import type { CellChange, ChangeRecord } from '../types'

describe('ChangeRecordGenerator', () => {
  let generator: ChangeRecordGenerator

  beforeEach(() => {
    generator = new ChangeRecordGenerator()
  })

  describe('generateText', () => {
    it('should generate text output with no changes', () => {
      // Arrange
      const record: ChangeRecord = {
        fileName: 'test.xlsx',
        changes: [],
        timestamp: new Date('2024-01-01'),
      }

      // Act
      const output = generator.generateText(record)

      // Assert
      expect(output).toContain('File: test.xlsx')
      expect(output).toContain('Changes Detected: 0')
      expect(output).toContain('No changes detected')
    })

    it('should generate text output with changes', () => {
      // Arrange
      const changes: CellChange[] = [
        {
          sheet: 'sheet1',
          cell: 'A1',
          changeType: 'modified',
          oldValue: 'old',
          newValue: 'new',
        },
        {
          sheet: 'sheet1',
          cell: 'B1',
          changeType: 'added',
          oldValue: undefined,
          newValue: 'added value',
        },
      ]
      const record: ChangeRecord = {
        fileName: 'test.xlsx',
        changes,
        timestamp: new Date('2024-01-01'),
      }

      // Act
      const output = generator.generateText(record)

      // Assert
      expect(output).toContain('File: test.xlsx')
      expect(output).toContain('Changes Detected: 2')
      expect(output).toContain('Modified (1)')
      expect(output).toContain('Added (1)')
      expect(output).toContain('Sheet: sheet1 | Cell: A1')
      expect(output).toContain('Before: old')
      expect(output).toContain('After:  new')
    })
  })

  describe('generateJSON', () => {
    it('should generate valid JSON output', () => {
      // Arrange
      const result = {
        baseFile: 'base.xlsx',
        targetFiles: ['target.xlsx'],
        records: [
          {
            fileName: 'target.xlsx',
            changes: [
              {
                sheet: 'sheet1',
                cell: 'A1',
                changeType: 'modified' as const,
                oldValue: 'old',
                newValue: 'new',
              },
            ],
            timestamp: new Date('2024-01-01'),
          },
        ],
      }

      // Act
      const output = generator.generateJSON(result)

      // Assert
      expect(() => JSON.parse(output)).not.toThrow()
      const parsed = JSON.parse(output)
      expect(parsed).toMatchObject({
        baseFile: 'base.xlsx',
        targetFiles: ['target.xlsx'],
      })
    })
  })

  describe('generateMarkdown', () => {
    it('should generate markdown output', () => {
      // Arrange
      const changes: CellChange[] = [
        {
          sheet: 'sheet1',
          cell: 'A1',
          changeType: 'modified' as const,
          oldValue: 'old',
          newValue: 'new',
        },
      ]
      const record: ChangeRecord = {
        fileName: 'test.xlsx',
        changes,
        timestamp: new Date('2024-01-01'),
      }

      // Act
      const output = generator.generateMarkdown(record)

      // Assert
      expect(output).toContain('# Excel Comparison Report')
      expect(output).toContain('**File:** `test.xlsx`')
      expect(output).toContain('## Modified (1)')
      expect(output).toContain('### sheet1!A1')
      expect(output).toContain('| Before |')
      expect(output).toContain('| After |')
    })
  })

  describe('generateCSV', () => {
    it('should generate CSV output', () => {
      // Arrange
      const changes: CellChange[] = [
        {
          sheet: 'sheet1',
          cell: 'A1',
          changeType: 'modified' as const,
          oldValue: 'old',
          newValue: 'new',
        },
      ]
      const record: ChangeRecord = {
        fileName: 'test.xlsx',
        changes,
        timestamp: new Date('2024-01-01'),
      }

      // Act
      const output = generator.generateCSV(record)

      // Assert
      expect(output).toContain('Sheet,Cell,Change Type,Old Value,New Value')
      expect(output).toContain('sheet1,A1,modified,"old","new"')
    })

    it('should escape quotes in CSV values', () => {
      // Arrange
      const changes: CellChange[] = [
        {
          sheet: 'sheet1',
          cell: 'A1',
          changeType: 'added' as const,
          oldValue: undefined,
          newValue: 'value with "quotes"',
        },
      ]
      const record: ChangeRecord = {
        fileName: 'test.xlsx',
        changes,
        timestamp: new Date('2024-01-01'),
      }

      // Act
      const output = generator.generateCSV(record)

      // Assert
      expect(output).toContain('value with ""quotes""')
    })
  })
})
