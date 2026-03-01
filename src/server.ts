import express from 'express'
import multer from 'multer'
import cors from 'cors'
import { join } from 'path'
import { ExcelReader } from './ExcelReader'
import { ExcelComparator } from './ExcelComparator'
import { ChangeRecordGenerator } from './ChangeRecordGenerator'
import { ExcelExporter } from './ExcelExporter'
import { messages } from './config'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'


/**
 * Decode multer's latin1 encoded filename to proper UTF-8
 * Multer uses latin1 encoding by default which causes Chinese characters to be garbled
 */
function decodeFilename(filename: string): string {
  try {
    // Convert latin1 encoded string back to buffer, then decode as utf-8
    return Buffer.from(filename, 'latin1').toString('utf8')
  } catch {
    return filename
  }
}

const app = express()
const PORT = process.env.PORT || 3000
const PUBLIC_DIR = join(process.cwd(), 'public')
const NODE_MODULES_DIR = join(process.cwd(), 'node_modules')

app.use(cors())
app.use(express.json())
// Serve static files from public directory
app.use(express.static(PUBLIC_DIR))
// Serve @js-preview/excel library files
app.use('/node_modules', express.static(NODE_MODULES_DIR))

const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ]
    const isExcel =
      allowedTypes.includes(file.mimetype) ||
      file.originalname.endsWith('.xlsx') ||
      file.originalname.endsWith('.xls')
    if (isExcel) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type'))
    }
  },
})

// Store preview buffers temporarily
const previewCache = new Map<string, { buffer: Buffer; timestamp: number }>()
const PREVIEW_TIMEOUT = 5 * 60 * 1000 // 5 minutes

app.post(
  '/api/compare',
  upload.fields([
    { name: 'base', maxCount: 1 },
    { name: 'targets', maxCount: 10 },
  ]),
  async (req, res) => {
    try {
      const files = req.files as any
      const baseFile = files.base?.[0]
      const targetFiles = files.targets || []

      if (!baseFile) {
        res.status(400).json({ error: messages.errors.baseFileRequired })
        return
      }

      if (targetFiles.length === 0) {
        res.status(400).json({ error: messages.errors.targetFileRequired })
        return
      }

      const options = req.body.options ? JSON.parse(req.body.options as string) : {}

      const reader = new ExcelReader()
      const comparator = new ExcelComparator({
        ignoreCase: options.ignoreCase || false,
        trimWhitespace: options.trimWhitespace !== false,
        ignoreEmptyCells: options.ignoreEmptyCells || false,
      })
      const generator = new ChangeRecordGenerator()

      const baseData = reader.readFromBuffer(baseFile.buffer)

      const records: any[] = []
      let totalAdded = 0
      let totalModified = 0
      let totalDeleted = 0

      for (const targetFile of targetFiles) {
        const targetData = reader.readFromBuffer(targetFile.buffer)
        const changes = comparator.compare(baseData, targetData)

        for (const change of changes) {
          if (change.changeType === 'added') totalAdded++
          else if (change.changeType === 'modified') totalModified++
          else if (change.changeType === 'deleted') totalDeleted++
        }

        // Decode filename to fix Chinese character encoding
        const decodedFilename = decodeFilename(targetFile.originalname)
        const record = comparator.createChangeRecord(decodedFilename, changes)
        records.push(record)
      }


      const format = options.format || 'text'

      // Always populate raw data for frontend display
      const raw = {
        baseFile: decodeFilename(baseFile.originalname),
        targetFiles: targetFiles.map((f: any) => decodeFilename(f.originalname)),
        records,
      }


      let output = ''
      if (format === 'json') {
        output = JSON.stringify(raw, null, 2)
      } else if (format === 'markdown') {
        output = records.map((r: any) => generator.generateMarkdown(r)).join('\n\n---\n\n')
      } else if (format === 'csv') {
        output = records.map((r: any) => generator.generateCSV(r)).join('\n')
      } else {
        output = records.map((r: any) => generator.generateText(r)).join('\n\n')
      }

      // Set UTF-8 charset for Chinese characters
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.json({
        success: true,
        output,
        raw,
        changeCounts: {
          added: totalAdded,
          modified: totalModified,
          deleted: totalDeleted,
        },
        totalChanges: totalAdded + totalModified + totalDeleted,
      })
    } catch (error) {
      console.error('Comparison error:', error)
      const message = error instanceof Error ? error.message : messages.errors.comparisonFailed
      res.status(500).json({ error: message })
    }
  }
)

app.post(
  '/api/export-marked-excel',
  upload.fields([
    { name: 'base', maxCount: 1 },
    { name: 'targets', maxCount: 10 },
  ]),
  async (req, res) => {
    try {
      console.log('=== /api/export-marked-excel START ===')
      const files = req.files as any
      const baseFile = files.base?.[0]
      const targetFiles = files.targets || []

      console.log('baseFile:', baseFile ? baseFile.originalname : 'none')
      console.log('baseFile.buffer size:', baseFile ? baseFile.buffer.byteLength : 0)
      console.log('targetFiles count:', targetFiles.length)

      if (!baseFile || targetFiles.length === 0) {
        res.status(400).json({ error: messages.errors.targetFileRequired })
        return
      }

      const reader = new ExcelReader()
      const comparator = new ExcelComparator()
      const exporter = new ExcelExporter()

      console.log('Reading base file...')
      const baseData = reader.readFromBuffer(baseFile.buffer)
      console.log('Base data sheets:', Object.keys(baseData))

      console.log('Reading target file...')
      const targetData = reader.readFromBuffer(targetFiles[0].buffer)
      console.log('Target data sheets:', Object.keys(targetData))

      console.log('Comparing files...')
      
      // Determine which comparison method to use, default to classic
      console.log('Using classic comparison logic');
      const changes = comparator.compare(baseData, targetData);
      
      console.log('Total changes found:', changes.length)
      
      console.log('Exporting marked Excel...')

      // Check if target file is xls format and convert to xlsx
      // This allows xlsx-populate to properly load the template and preserve formatting
      console.log('Starting export for target file:', targetFiles[0].originalname)
      console.log('Target file size (original):', targetFiles[0].buffer.byteLength)
      
      let targetFileBuffer = targetFiles[0].buffer
      const isXlsFormat = reader.isXlsFormat(targetFileBuffer)
      
      if (isXlsFormat) {
        console.log('Target file is xls format, converting to xlsx for template loading...')
        console.log('  Original buffer size:', targetFiles[0].buffer.byteLength)
        console.log('  Original file:', targetFiles[0].originalname)
        targetFileBuffer = reader.convertXlsToXlsx(targetFileBuffer)
        console.log('  Converted buffer size:', targetFileBuffer.byteLength)
        console.log('  Is converted buffer xlsx?:', !reader.isXlsFormat(targetFileBuffer))
      } else {
        console.log('Target file is already xlsx format, using directly')
      }



      const excelBuffer = await exporter.exportModifiedExcel(
        targetData,
        changes,
        targetFileBuffer
      )
      // Generate a preview ID
      const previewId = Date.now().toString() + Math.random().toString(36).substring(2, 9)
      previewCache.set(previewId, {
        buffer: excelBuffer,
        timestamp: Date.now(),
      })

      // Clean up old previews
      const now = Date.now()
      for (const [id, data] of previewCache.entries()) {
        if (now - data.timestamp > PREVIEW_TIMEOUT) {
          previewCache.delete(id)
        }
      }

      // Output is always xlsx format (xls is converted to xlsx above)
      // Generate filename based on original target file name
      const originalFilename = decodeFilename(targetFiles[0].originalname)
      const extIndex = originalFilename.lastIndexOf('.')
      const baseName = extIndex > 0 ? originalFilename.substring(0, extIndex) : originalFilename
      const downloadFilename = `${baseName}_标记.xlsx`

      // Use RFC 5987 encoding for Chinese filename support
      const encodedFilename = encodeURIComponent(downloadFilename)

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      )
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`)
      res.setHeader('X-Preview-Id', previewId)
      res.setHeader('X-Original-Filename', encodedFilename)
      res.send(excelBuffer)
      console.log('Output buffer size:', excelBuffer.byteLength)
      console.log('=== /api/export-marked-excel END ===\n')
    } catch (error) {
      console.error('Export error:', error)
      let message = messages.errors.exportFailed
      if (error instanceof Error) {
        message = error.message
        if (error.stack) {
          console.error('Stack trace:', error.stack)
        }
      }
      res.status(500).json({ error: message })
    }
  }
)

// Preview endpoint
app.get('/api/preview/:id', (req, res) => {
  const { id } = req.params
  const cached = previewCache.get(id)

  if (!cached) {
    res.status(404).json({ error: 'Preview not found or expired' })
    return
  }

  // Check if expired
  if (Date.now() - cached.timestamp > PREVIEW_TIMEOUT) {
    previewCache.delete(id)
    res.status(404).json({ error: 'Preview expired' })
    return
  }

  // Send the Excel file
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.send(cached.buffer)
})

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// Electron 专用：读取本地文件
app.get('/api/read-file', async (req, res) => {
  try {
    const filePath = req.query.path as string
    if (!filePath) {
      res.status(400).json({ error: 'File path is required' })
      return
    }

    // 安全检查：确保文件存在且是 Excel 文件
    if (!existsSync(filePath)) {
      res.status(404).json({ error: 'File not found' })
      return
    }

    const ext = filePath.toLowerCase().split('.').pop()
    if (!['xlsx', 'xls'].includes(ext || '')) {
      res.status(400).json({ error: 'Invalid file type. Only Excel files are allowed.' })
      return
    }

    const buffer = await readFile(filePath)
    const mimeType = ext === 'xls' 
      ? 'application/vnd.ms-excel'
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    
    res.setHeader('Content-Type', mimeType)
    res.send(buffer)
  } catch (error) {
    console.error('Read file error:', error)
    res.status(500).json({ error: 'Failed to read file' })
  }
})

app.listen(PORT, () => {
  console.log('')
  console.log('🚀 Excel Diff Server')
  console.log('')
  console.log('📁 Serving files from:', PUBLIC_DIR)
  console.log('🌐 Server running at: http://localhost:' + PORT)
  console.log('')
  console.log('Press Ctrl+C to stop')
  console.log('')
})
