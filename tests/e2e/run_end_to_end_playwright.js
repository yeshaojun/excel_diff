// Minimal end-to-end test runner using Playwright (requires Playwright installed)
// This script tests two pairs: base.xlsx + target.xlsx and base.xls + target.xls
// Ensure test data is placed at tests-data/ as referenced below.

const { chromium } = require('playwright')

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  const testPair = async (basePath, targetPath, expectedExt) => {
    await page.goto('http://localhost:3000')
    // Upload base file
    const baseInput = await page.$('#baseFile')
    await baseInput.setInputFiles(basePath)
    // Upload target files
    const targetInput = await page.$('#targetFiles')
    await targetInput.setInputFiles(targetPath)
    // Start compare
    await page.click('#compareBtn')
    // Wait for download option to be enabled
    await page.waitForSelector('#downloadMarkedBtn:not([disabled])')
    // Trigger download
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('#downloadMarkedBtn'),
    ])
    const path = await download.path()
    const extMatch = path.match(/\.[^.]+$/)
    const ext = extMatch ? extMatch[0] : ''
    console.log(`Downloaded: ${path} | ext=${ext} | expected=${expectedExt}`)
    return ext
  }

  try {
    const ext1 = await testPair('./tests-data/base.xlsx', './tests-data/target.xlsx', '.xlsx')
    const ext2 = await testPair('./tests-data/base.xls', './tests-data/target.xls', '.xls')
    // Simple pass/fail output
    process.exit(ext1 === '.xlsx' && ext2 === '.xls' ? 0 : 1)
  } catch (err) {
    console.error('End-to-end test encountered error:', err)
    process.exit(2)
  } finally {
    await browser.close()
  }
})()
