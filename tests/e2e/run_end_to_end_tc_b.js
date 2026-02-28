// Minimal Playwright-based end-to-end TC-B: base.xls + target.xls
const { chromium } = require('playwright')

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  try {
    await page.goto('http://localhost:3000')
    // Test data
    const base = 'tests-data/base.xls'
    const target = 'tests-data/target.xls'

    // Upload files
    const baseInput = await page.$('#baseFile')
    await baseInput.setInputFiles(base)
    const targetInput = await page.$('#targetFiles')
    await targetInput.setInputFiles(target)

    // Start compare and trigger download
    await page.click('#compareBtn')
    await page.waitForSelector('#downloadMarkedBtn:not([disabled])')
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('#downloadMarkedBtn'),
    ])

    const path = await download.path()
    const ext = path && path.match(/\.[^.]+$/) ? path.match(/\.[^.]+$/)[0] : ''
    console.log('TC-B downloaded path:', path, 'ext:', ext)
    process.exit(ext === '.xls' ? 0 : 1)
  } catch (err) {
    console.error('TC-B run error:', err)
    process.exit(2)
  } finally {
    await browser.close()
  }
})()
