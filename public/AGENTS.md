# public/ - Web 前端界面

## 概述

Excel 对比工具的 Web 界面，提供文件上传、对比选项配置和结果展示功能。

---

## 结构

```
public/
├── index.html               # 主界面 HTML
├── app.js                   # 前端逻辑（文件上传、API 调用）
├── styles.css               # 样式表
└── README.md                # 前端文档
```

---

## 快速定位

| 任务          | 文件       | 说明            |
| ------------- | ---------- | --------------- |
| 修改上传 UI   | index.html | form/input 元素 |
| 添加 API 调用 | app.js     | fetch 请求      |
| 修改样式      | styles.css | CSS 规则        |
| 添加对比选项  | app.js     | 选项处理逻辑    |

---

## API 端点

- `POST /api/upload` - 上传 Excel 文件
- `POST /api/compare` - 执行对比
- `GET /api/download/:filename` - 下载对比结果

---

## 反模式（public/）

- **禁止**：硬编码 API 地址（使用相对路径）
- **禁止**：同步阻塞 UI 操作（使用 async/await）
- **必须**：处理文件上传错误
- **必须**：显示加载状态指示器
