# 项目知识库

**生成时间：** 2026-02-28
**项目：** excel-file-diff (Excel 文件对比工具)

---

## 概述

Excel 文件对比工具，支持单元格级别的变更检测（新增、删除、修改），多工作表对比，提供多种输出格式（文本、JSON、Markdown、CSV），包含 CLI 和 Web 界面。

**技术栈**：TypeScript + Node.js + Express + xlsx/exceljs

---

## 项目结构

```
file_diff/
├── src/              # 核心业务逻辑
│   ├── ExcelComparator.ts       # 比较核心逻辑
│   ├── ExcelReader.ts           # Excel 读取
│   ├── ExcelExporter.ts         # Excel 导出
│   ├── ChangeRecordGenerator.ts # 变更记录生成
│   ├── cli.ts                   # CLI 入口
│   ├── server.ts                # Web 服务器
│   ├── config.ts                # 配置管理
│   ├── index.ts                 # 库入口
│   └── tests/                   # 测试文件
├── public/           # 前端资源
│   ├── index.html               # 主界面
│   ├── app.js                   # 前端逻辑
│   └── styles.css               # 样式
└── dist/             # 编译输出
```

---

## 快速定位

| 任务 | 位置 | 说明 |
|------|------|------|
| 修改比较逻辑 | `src/ExcelComparator.ts` | 核心算法 |
| 添加输出格式 | `src/ChangeRecordGenerator.ts` | 格式化器 |
| 修改 CLI | `src/cli.ts` | Commander 参数 |
| Web 界面 | `public/` | HTML/CSS/JS |
| 测试 | `src/tests/` | Jest 测试 |

---

## 命令参考

```bash
# 构建项目
npm run build

# 运行测试
npm test
npm test -- --watch
npm test -- --coverage

# 开发模式
npm run dev      # CLI 开发
npm run web      # Web 服务器

# 代码检查
npm run lint
npm run lint:fix
npm run type-check
npm run format

# 生产启动
npm start        # 构建并启动服务器
```

---

## 代码规范

### TypeScript
- 严格模式：`strict: true`
- 禁用 `any` 类型，使用 `unknown` 或泛型
- 接口优先（对象形状），类型用于联合
- 所有严格标志：`noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`

### 导入规范
```typescript
// ✅ 正确
import { readFile } from 'fs/promises';
import { parseExcel } from '@/utils/excel';
import type { CellChange } from '@/types';

// ❌ 错误
import * as fs from 'fs';
import { parseExcel } from '../../../utils/excel';
```

### 命名规范
- **文件**：工具函数 camelCase，组件/类 PascalCase
- **变量/函数**：camelCase（`parseExcelFile`, `cellValue`）
- **类/接口**：PascalCase（`ExcelComparator`, `ChangeRecord`）
- **常量**：UPPER_SNAKE_CASE（`MAX_CELL_SIZE`, `DEFAULT_FORMAT`）
- **私有成员**：下划线前缀（`_internalCache`）

### 错误处理
```typescript
// ✅ 正确
class ExcelParseError extends Error {
  constructor(filePath: string, cause: unknown) {
    super(`Failed to parse Excel file: ${filePath}`);
    this.name = 'ExcelParseError';
    this.cause = cause;
  }
}

try {
  const data = await parseExcel(file);
} catch (error) {
  if (error instanceof ExcelParseError) {
    logger.error('Excel parsing failed', { filePath: file, error });
  }
  throw error;
}

// ❌ 错误
try {
  // ...
} catch (e: any) {
  console.log(e.message);
}
```

---

## 项目约定

### 比较选项
| 选项 | CLI 标志 | 描述 |
|------|----------|------|
| 忽略大小写 | `--ignore-case` | 不区分大小写 |
| 修剪空白 | `--no-trim` | 不修剪空白（默认：true）|
| 忽略空单元格 | `--ignore-empty` | 跳过空单元格 |

### 输出格式
- **text**（默认）：带 emoji 指示符的人类可读文本
- **json**：用于程序处理的结构化 JSON
- **markdown**：格式化的 Markdown 用于文档
- **csv**：用于数据分析的逗号分隔值

### 关键依赖
- `xlsx`：Excel 文件解析和写入
- `exceljs`：高级 Excel 操作
- `commander`：CLI 接口
- `express`：Web 服务器
- `@js-preview/excel`：Excel 预览

---

## 反模式（本项目）

- **禁止**：使用 `any` 类型
- **禁止**：空 catch 块 `catch(e) {}`
- **禁止**：删除失败的测试来通过
- **禁止**：混用回调函数和 async/await
- **必须**：Excel 数据在比较前进行规范化（修剪字符串、处理 null）
- **必须**：保留变更记录中的文件元数据（文件名、时间戳）
- **必须**：有效处理大文件（必要时使用流式处理）

---

## 注意事项

1. **数据规范化**：比较前必须规范化 Excel 数据（修剪字符串、处理 null 值）
2. **多工作表支持**：支持跨工作簿的所有工作表比较
3. **文件元数据**：在变更记录中保留文件元数据（文件名、时间戳）
4. **大文件处理**：必要时使用流式处理以提高效率
5. **CI 配置**：项目目前无 `.github/workflows`，依赖本地 npm scripts

---

## Git 提交规范（如有使用）

- 格式：`type(scope): description`
- 类型：`feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `style`
- 示例：`feat(comparator): add multi-sheet comparison support`

