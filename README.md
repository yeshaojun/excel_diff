# Excel File Diff Tool

[English](README.md) | [中文](README.zh-CN.md)

A powerful Excel file comparison tool that detects changes between multiple Excel files and generates detailed change records.

## Features

- ✅ **Cell-level comparison**: Detects additions, deletions, and modifications
- 📊 **Multi-sheet support**: Compares across all sheets in workbooks
- 🎯 **Flexible comparison modes**:
  - Ignore case sensitivity
  - Trim whitespace
  - Ignore empty cells
- 📝 **Multiple output formats**: Text, JSON, Markdown, CSV
- 🚀 **CLI interface**: Easy command-line usage
- 🌐 **Web interface**: Modern, user-friendly web UI

## Installation

```bash
npm install
npm run build
```

## Usage

### Web Interface

Start the web server:

```bash
npm run web
```

Then open http://localhost:3000 in your browser.

Features:

- Drag and drop file uploads
- Multiple target file comparison
- Real-time comparison options
- Download results in multiple formats
- Copy results to clipboard

### Command Line

```bash
# Compare files with text output
npx ts-node src/cli.ts base.xlsx target1.xlsx target2.xlsx

# Output to file with specific format
npx ts-node src/cli.ts base.xlsx target.xlsx -o changes_{name}.md -f markdown

# Ignore case and empty cells
npx ts-node src/cli.ts base.xlsx target.xlsx --ignore-case --ignore-empty

# Export as CSV
npx ts-node src/cli.ts base.xlsx target.xlsx -o changes_{name}.csv -f csv
```

### Programmatic Usage

```typescript
import { ExcelReader, ExcelComparator, ChangeRecordGenerator } from './src'

const reader = new ExcelReader()
const comparator = new ExcelComparator({ ignoreEmptyCells: true })
const generator = new ChangeRecordGenerator()

// Read Excel files
const baseData = await reader.readFile('base.xlsx')
const targetData = await reader.readFile('target.xlsx')

// Compare files
const changes = comparator.compare(baseData, targetData)

// Generate change record
const record = comparator.createChangeRecord('target.xlsx', changes)

// Output in desired format
const textOutput = generator.generateText(record)
console.log(textOutput)
```

## Comparison Options

| Option             | CLI Flag         | Description                           |
| ------------------ | ---------------- | ------------------------------------- |
| Ignore case        | `--ignore-case`  | Case-insensitive text comparison      |
| Trim whitespace    | `--no-trim`      | Don't trim whitespace (default: true) |
| Ignore empty cells | `--ignore-empty` | Skip empty cells in comparison        |

## Output Formats

- **text** (default): Human-readable text with emoji indicators
- **json**: Structured JSON for programmatic processing
- **markdown**: Formatted Markdown for documentation
- **csv**: Comma-separated values for data analysis

## Development

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Type check
npm run type-check

# Lint
npm run lint

# Format
npm run format
```

## License

MIT
