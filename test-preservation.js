// Quick test to verify xlsx-populate preserves images and formatting
const XlsxPopulate = require('xlsx-populate')
const fs = require('fs')

async function testPreservation() {
  console.log('=== Testing xlsx-populate preservation ===\n')

  // Check if test file exists
  const testFilePath = process.argv[2] || './input1.xlsx'

  if (!fs.existsSync(testFilePath)) {
    console.log(`❌ Test file not found: ${testFilePath}`)
    console.log('Please provide path to an Excel file with images/formatting')
    process.exit(1)
  }

  console.log(`📂 Loading file: ${testFilePath}`)
  const buffer = fs.readFileSync(testFilePath)
  console.log(`✅ File loaded, size: ${buffer.length} bytes\n`)

  try {
    console.log('⏳ Loading workbook with xlsx-populate...')
    const workbook = await XlsxPopulate.fromDataAsync(buffer)
    console.log('✅ Workbook loaded successfully!\n')

    // Check sheets
    const sheets = workbook.sheets ? workbook.sheets() : []
    console.log(`📊 Found ${sheets.length} sheets:`)
    sheets.forEach((sheet, i) => {
      console.log(`   ${i + 1}. ${sheet.name()}`)
    })
    console.log()

    // Try to get a cell from first sheet
    if (sheets.length > 0) {
      const firstSheet = sheets[0]
      console.log(`🔍 Examining sheet: ${firstSheet.name()}\n`)

      // Check cell A1
      try {
        const cellA1 = firstSheet.cell('A1')
        const valueA1 = cellA1.value()
        console.log(`   Cell A1 value: ${valueA1}`)

        const styleA1 = cellA1.style()
        console.log(`   Cell A1 has style: ${Object.keys(styleA1 || {}).length > 0}`)
        console.log(`   Style keys: ${Object.keys(styleA1 || {}).join(', ')}`)
      } catch (e) {
        console.log(`   ⚠️  Could not access cell A1: ${e.message}`)
      }

      // Check cell B1
      try {
        const cellB1 = firstSheet.cell('B1')
        const valueB1 = cellB1.value()
        console.log(`   Cell B1 value: ${valueB1}`)

        const styleB1 = cellB1.style()
        console.log(`   Cell B1 has style: ${Object.keys(styleB1 || {}).length > 0}`)
      } catch (e) {
        console.log(`   ⚠️  Could not access cell B1: ${e.message}`)
      }
    }

    console.log('\n💾 Generating output buffer...')
    const outputBuffer = await workbook.outputAsync({ type: 'nodebuffer' })
    console.log(`✅ Output generated, size: ${outputBuffer.length} bytes\n`)

    const outputPath = testFilePath.replace('.xlsx', '_preserved.xlsx')
    console.log(`💾 Saving to: ${outputPath}`)
    fs.writeFileSync(outputPath, outputBuffer)
    console.log('✅ File saved successfully!\n')

    console.log('=== Test completed ===')
    console.log('✅ Now open the output file and check if:')
    console.log('   1. Images are preserved')
    console.log('   2. Cell formatting (fonts, colors, borders) are preserved')
    console.log('   3. Cover pages/themes are preserved')
    console.log()
    console.log('If formatting is lost, xlsx-populate may not be working as expected.')
  } catch (error) {
    console.error('\n❌ Error during test:')
    console.error(error)
    process.exit(1)
  }
}

testPreservation().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
