import { test, expect, Page } from '@playwright/test'

// End-to-end tests for dynamic download extension of marked Excel

const baseXlsx = 'tests-data/base.xlsx'
const targetXlsx = 'tests-data/target1.xlsx'
const baseXls = 'tests-data/base.xls'
const targetXls = 'tests-data/target1.xls'

async function uploadFile(page: Page, selector: string, filePath: string) {
  const input = await page.$(selector)
  if (!input) throw new Error(`Input not found: ${selector}`)
  await input.setInputFiles(filePath)
}

async function runExportForPair(page: Page, base: string, target: string): Promise<string> {
  // Ensure we are on the app page
  await page.goto('http://localhost:3000')

  // Upload base and target
  await uploadFile(page, '#baseFile', base)
  await uploadFile(page, '#targetFiles', target)

  // Start compare
  await page.click('#compareBtn')
  // Wait for download button to be enabled
  await page.waitForSelector('#downloadMarkedBtn:not([disabled])')

  // Trigger download and capture path
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click('#downloadMarkedBtn'),
  ])
  const path = await download.path()
  return path ?? ''
}

test('下载带标记的 Excel 的扩展名：XLSX', async ({ page }) => {
  const path = await runExportForPair(page, baseXlsx, targetXlsx)
  expect(path.toLowerCase().endsWith('.xlsx')).toBe(true)
})

test('下载带标记的 Excel 的扩展名：XLS', async ({ page }) => {
  const path = await runExportForPair(page, baseXls, targetXls)
  expect(path.toLowerCase().endsWith('.xls')).toBe(true)
})
