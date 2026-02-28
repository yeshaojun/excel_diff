// Minimal end-to-end test runner for TC-B using Playwright (requires Playwright installed)
// This script tests base.xls + target.xls using the same flow as TC-A
const { chromium } = require('playwright')

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  const testPair = async (basePath, targetPath, expectedExt) => {
    await page.goto('http://localhost:3000')
    const baseInput = await page.$('#baseFile')
    await baseInput.setInputFiles(basePath)
    const targetInput = await page.$('#targetFiles')
    await targetInput.setInputFiles(targetPath)
    await page.click('#compareBtn')
    await page.waitForSelector('#downloadMarkedBtn:not([disabled])')
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
    const ext = await testPair('./tests-data/base.xls', './tests-data/target.xls', '.xls')
    process.exit(ext === '.xls' ? 0 : 1)
  } catch (err) {
    console.error('End-to-end TC-B test encountered error:', err)
    process.exit(2)
  } finally {
    await browser.close()
  }
})()
