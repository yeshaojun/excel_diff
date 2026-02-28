const fs = require('fs')
const path = require('path')
const XLSX = require('xlsx')

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

const dataDir = path.resolve(__dirname, 'data')
ensureDir(dataDir)

// Create base.xls
const wbBase = XLSX.utils.book_new()
const wsBase = XLSX.utils.aoa_to_sheet([
  ['Header1', 'Header2'],
  ['Base', 123],
])
XLSX.utils.book_append_sheet(wbBase, wsBase, 'Sheet1')
XLSX.writeFile(wbBase, path.resolve(dataDir, 'base.xls'), { bookType: 'xls' })

// Create target.xls
const wbTar = XLSX.utils.book_new()
const wsTar = XLSX.utils.aoa_to_sheet([
  ['Header1', 'Header2'],
  ['Target', 456],
])
XLSX.utils.book_append_sheet(wbTar, wsTar, 'Sheet1')
XLSX.writeFile(wbTar, path.resolve(dataDir, 'target.xls'), { bookType: 'xls' })

console.log('TC-B data prepared: base.xls, target.xls')
