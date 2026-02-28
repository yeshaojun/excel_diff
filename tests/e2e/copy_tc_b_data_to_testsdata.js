const fs = require('fs')
const path = require('path')

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

const srcDir = path.resolve(__dirname, 'data')
const dstDir = path.resolve(__dirname, 'tests-data')
ensureDir(dstDir)

const copy = (src, dst) => {
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dst)
    console.log(`Copied ${src} -> ${dst}`)
  } else {
    console.warn(`Source not found: ${src}`)
  }
}

copy(path.join(srcDir, 'base.xls'), path.join(dstDir, 'base.xls'))
copy(path.join(srcDir, 'target.xls'), path.join(dstDir, 'target.xls'))

console.log('TC-B data prepared in tests-data/')
