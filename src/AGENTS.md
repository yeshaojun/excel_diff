# src/ - 核心业务逻辑

## 概述

Excel 对比工具的核心实现，包含文件读取、比较算法、变更记录生成和导出功能。

---

## 结构

```
src/
├── ExcelComparator.ts       # 单元格比较核心算法
├── ExcelReader.ts           # Excel 文件解析
├── ExcelExporter.ts         # Excel 差异导出
├── ChangeRecordGenerator.ts # 变更记录格式化输出
├── cli.ts                   # 命令行入口
├── server.ts                # Web 服务器
├── config.ts                # 配置管理
├── index.ts                 # 库导出入口
├── types.ts                 # TypeScript 类型定义
└── tests/                   # 单元测试
    ├── ExcelComparator.test.ts
    └── ChangeRecordGenerator.test.ts
```

---

## 快速定位

| 任务             | 文件                     | 说明                             |
| ---------------- | ------------------------ | -------------------------------- |
| 修改比较逻辑     | ExcelComparator.ts       | compare() 方法核心算法           |
| 添加输出格式     | ChangeRecordGenerator.ts | generateText/JSON/Markdown/CSV() |
| 添加文件格式支持 | ExcelReader.ts           | readFile() 扩展                  |
| CLI 参数         | cli.ts                   | Commander 配置                   |
| API 路由         | server.ts                | Express 路由定义                 |

---

## 核心类

### ExcelComparator

- `compare(base: ExcelData, target: ExcelData): CellChange[]`
- `createChangeRecord(filename: string, changes: CellChange[]): ChangeRecord`

### ExcelReader

- `readFile(filePath: string): Promise<ExcelData>`
- `normalizeData(data: unknown): unknown`

### ChangeRecordGenerator

- `generateText(record: ChangeRecord): string`
- `generateJSON(record: ChangeRecord): string`
- `generateMarkdown(record: ChangeRecord): string`
- `generateCSV(record: ChangeRecord): string`

---

## 反模式（src/）

- **禁止**：在比较算法中忽略 null/undefined 处理
- **禁止**：直接比较未规范化的 Excel 数据
- **禁止**：变更记录中丢失文件元数据
- **必须**：所有导出方法处理空变更数组
- **必须**：ExcelReader 调用 normalizeData()
