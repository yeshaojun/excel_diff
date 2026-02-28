import { Command } from 'commander'
import { ExcelReader } from './ExcelReader'
import { ExcelComparator } from './ExcelComparator'
import { ChangeRecordGenerator, OutputFormat } from './ChangeRecordGenerator'
import type { ComparisonOptions } from './types'

export async function runComparison(
  baseFile: string,
  targetFiles: string[],
  options: ComparisonOptions & {
    output?: string
    format?: OutputFormat
  }
): Promise<void> {
  const reader = new ExcelReader()
  const comparator = new ExcelComparator({
    ignoreEmptyCells: options.ignoreEmptyCells ?? false,
    ignoreCase: options.ignoreCase ?? false,
    trimWhitespace: options.trimWhitespace ?? true,
  })
  const generator = new ChangeRecordGenerator()

  // Read base file
  console.log(`📖 Reading base file: ${baseFile}`)
  const baseData = await reader.readFile(baseFile)

  // Process each target file
  const records: Array<{ fileName: string; changes: ReturnType<(typeof comparator)['compare']> }> =
    []

  for (const targetFile of targetFiles) {
    console.log(`📖 Reading target file: ${targetFile}`)

    const targetData = await reader.readFile(targetFile)
    const changes = comparator.compare(baseData, targetData)

    const record = comparator.createChangeRecord(targetFile, changes)
    records.push({ fileName: targetFile, changes })

    // Generate output based on format
    const format = options.format ?? 'text'

    if (format === 'json') {
      const jsonOutput = generator.generateJSON({
        baseFile,
        targetFiles,
        records: records.map(r => ({
          fileName: r.fileName,
          changes: r.changes,
          timestamp: new Date(),
        })),
      })
      console.log(jsonOutput)
    } else {
      let output: string

      switch (format) {
        case 'markdown':
          output = generator.generateMarkdown(record)
          break
        case 'csv':
          output = generator.generateCSV(record)
          break
        case 'text':
        default:
          output = generator.generateText(record)
          break
      }

      console.log(output)

      // Write to file if output path is specified
      if (options.output) {
        const outputPath = options.output.replace(
          '{name}',
          targetFile.split('/').pop() ?? targetFile
        )
        await generator.writeToFile(output, outputPath)
        console.log(`✅ Output saved to: ${outputPath}`)
      }
    }
  }
}

// CLI interface
export async function main(): Promise<void> {
  const program = new Command()

  program
    .name('excel-diff')
    .description('Excel file comparison tool with change tracking')
    .version('1.0.0')

  program
    .argument('<baseFile>', 'Base Excel file to compare against')
    .argument('<targetFiles...>', 'Target Excel files to compare')
    .option('-o, --output <path>', 'Output file path (use {name} as placeholder for filename)')
    .option('-f, --format <format>', 'Output format: text, json, markdown, csv', 'text')
    .option('--ignore-empty', 'Ignore empty cells in comparison')
    .option('--no-trim', 'Do not trim whitespace')
    .option('--ignore-case', 'Ignore case when comparing text values')
    .action(async (baseFile, targetFiles, options) => {
      try {
        await runComparison(baseFile, targetFiles, options)
      } catch (error) {
        if (error instanceof Error) {
          console.error(`❌ Error: ${error.message}`)
        }
        process.exit(1)
      }
    })

  await program.parseAsync(process.argv)
}

if (require.main === module) {
  main().catch(error => {
    console.error(error)
    process.exit(1)
  })
}
