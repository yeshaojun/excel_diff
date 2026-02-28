import { ExcelComparator } from '../ExcelComparator'
import type { WorkbookData, ComparisonOptions, CellChange } from '../types'

describe('ExcelComparator', () => {
  let comparator: ExcelComparator

  beforeEach(() => {
    comparator = new ExcelComparator()
  })

  describe('compare', () => {
    it('should detect modified cell values', () => {
      // Arrange
      const baseData: WorkbookData = {
        sheet1: {
          A1: 'original',
          A2: 'value1',
        },
      }
      const targetData: WorkbookData = {
        sheet1: {
          A1: 'modified',
          A2: 'value1',
        },
      }

      // Act
      const changes = comparator.compare(baseData, targetData)

      // Assert
      expect(changes).toHaveLength(1)
      expect(changes[0]).toMatchObject({
        sheet: 'sheet1',
        cell: 'A1',
        changeType: 'modified',
        oldValue: 'original',
        newValue: 'modified',
      })
    })

    it('should detect added cells', () => {
      // Arrange
      const baseData: WorkbookData = {
        sheet1: {
          A1: 'value1',
        },
      }
      const targetData: WorkbookData = {
        sheet1: {
          A1: 'value1',
          B1: 'new value',
        },
      }

      // Act
      const changes = comparator.compare(baseData, targetData)

      // Assert
      expect(changes).toHaveLength(1)
      expect(changes[0]).toMatchObject({
        sheet: 'sheet1',
        cell: 'B1',
        changeType: 'added',
        oldValue: undefined,
        newValue: 'new value',
      })
    })

    it('should detect deleted cells', () => {
      // Arrange
      const baseData: WorkbookData = {
        sheet1: {
          A1: 'value1',
          A2: 'value2',
        },
      }
      const targetData: WorkbookData = {
        sheet1: {
          A1: 'value1',
        },
      }

      // Act
      const changes = comparator.compare(baseData, targetData)

      // Assert
      expect(changes).toHaveLength(1)
      expect(changes[0]).toMatchObject({
        sheet: 'sheet1',
        cell: 'A2',
        changeType: 'deleted',
        oldValue: 'value2',
        newValue: undefined,
      })
    })

    it('should detect changes across multiple sheets', () => {
      // Arrange
      const baseData: WorkbookData = {
        sheet1: { A1: 'value1' },
        sheet2: { A1: 'value2' },
      }
      const targetData: WorkbookData = {
        sheet1: { A1: 'modified' },
        sheet2: { A1: 'value2' },
      }

      // Act
      const changes = comparator.compare(baseData, targetData)

      // Assert
      expect(changes).toHaveLength(1)
      expect(changes[0]).toMatchObject({
        sheet: 'sheet1',
        cell: 'A1',
        changeType: 'modified',
      })
    })

    it('should detect new sheets', () => {
      // Arrange
      const baseData: WorkbookData = {
        sheet1: { A1: 'value1' },
      }
      const targetData: WorkbookData = {
        sheet1: { A1: 'value1' },
        sheet2: { A1: 'new sheet value' },
      }

      // Act
      const changes = comparator.compare(baseData, targetData)

      // Assert
      expect(changes).toHaveLength(1)
      expect(changes[0]).toMatchObject({
        sheet: 'sheet2',
        cell: 'A1',
        changeType: 'added',
      })
    })

    it('should detect deleted sheets', () => {
      // Arrange
      const baseData: WorkbookData = {
        sheet1: { A1: 'value1' },
        sheet2: { A1: 'value2' },
      }
      const targetData: WorkbookData = {
        sheet1: { A1: 'value1' },
      }

      // Act
      const changes = comparator.compare(baseData, targetData)

      // Assert
      expect(changes).toHaveLength(1)
      expect(changes[0]).toMatchObject({
        sheet: 'sheet2',
        cell: 'A1',
        changeType: 'deleted',
      })
    })

    it('should return no changes for identical data', () => {
      // Arrange
      const baseData: WorkbookData = {
        sheet1: { A1: 'value1', A2: 'value2' },
      }
      const targetData: WorkbookData = {
        sheet1: { A1: 'value1', A2: 'value2' },
      }

      // Act
      const changes = comparator.compare(baseData, targetData)

      // Assert
      expect(changes).toHaveLength(0)
    })
  })

  describe('with ignoreCase option', () => {
    it('should ignore case differences when comparing text', () => {
      // Arrange
      const options: ComparisonOptions = { ignoreCase: true }
      const caseInsensitiveComparator = new ExcelComparator(options)

      const baseData: WorkbookData = {
        sheet1: { A1: 'Hello World' },
      }
      const targetData: WorkbookData = {
        sheet1: { A1: 'hello world' },
      }

      // Act
      const changes = caseInsensitiveComparator.compare(baseData, targetData)

      // Assert
      expect(changes).toHaveLength(0)
    })
  })

  describe('with trimWhitespace option', () => {
    it('should ignore whitespace differences when enabled', () => {
      // Arrange
      const options: ComparisonOptions = { trimWhitespace: true }
      const trimComparator = new ExcelComparator(options)

      const baseData: WorkbookData = {
        sheet1: { A1: '  value  ' },
      }
      const targetData: WorkbookData = {
        sheet1: { A1: 'value' },
      }

      // Act
      const changes = trimComparator.compare(baseData, targetData)

      // Assert
      expect(changes).toHaveLength(0)
    })
  })

  describe('with ignoreEmptyCells option', () => {
    it('should ignore empty cells in comparison', () => {
      // Arrange
      const options: ComparisonOptions = { ignoreEmptyCells: true }
      const ignoreEmptyComparator = new ExcelComparator(options)

      const baseData: WorkbookData = {
        sheet1: { A1: 'value1', A2: '' },
      }
      const targetData: WorkbookData = {
        sheet1: { A1: 'value1', A3: '' },
      }

      // Act
      const changes = ignoreEmptyComparator.compare(baseData, targetData)

      // Assert
      expect(changes).toHaveLength(0)
    })
  })

  describe('createChangeRecord', () => {
    it('should create a change record with metadata', () => {
      // Arrange
      const changes = [
        {
          sheet: 'sheet1',
          cell: 'A1',
          changeType: 'modified' as const,
          oldValue: 'old',
          newValue: 'new',
        },
      ]
      const fileName = 'test.xlsx'
      const timestamp = new Date('2024-01-01T00:00:00.000Z')

      // Act
      const record = comparator.createChangeRecord(fileName, changes, timestamp)

      // Assert
      expect(record).toMatchObject({
        fileName,
        changes,
        timestamp,
      })
    })

    it('should use current timestamp when not provided', () => {
      // Arrange
      const changes: CellChange[] = []
      const fileName = 'test.xlsx'
      const before = new Date()

      // Act
      const record = comparator.createChangeRecord(fileName, changes)
      const after = new Date()

      // Assert
      expect(record.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(record.timestamp.getTime()).toBeLessThanOrEqual(after.getTime())
    })
  })
})
