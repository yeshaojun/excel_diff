// Minimal Playwright-based end-to-end TC-A: base.xlsx + target.xlsx
const { chromium } = require('playwright')

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  try {
    await page.goto('http://localhost:3000')
    // Ensure test data exists
    const base = 'tests-data/base.xlsx'
    const target = 'tests-data/target.xlsx'
    // Upload files
    await page.setInputFiles('#baseFile', base)
    await page.setInputFiles('#targetFiles', target)
    // Run comparison
    await page.click('#compareBtn')
    // Trigger download
    await page.waitForSelector('#downloadMarkedBtn:not([disabled])')
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('#downloadMarkedBtn'),
    ])
    const path = await download.path()
    const ext = path && path.match(/\.[^.]+$/) ? path.match(/\.[^.]+$/)[0] : ''
    console.log('TC-A downloaded path:', path, 'ext:', ext)
    process.exit(ext === '.xlsx' ? 0 : 1)
  } catch (err) {
    console.error('TC-A run error:', err)
    process.exit(2)
  } finally {
    await browser.close()
  }
})()
