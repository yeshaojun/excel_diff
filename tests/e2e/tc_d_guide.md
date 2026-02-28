TC-D Guide: Content-Type 指定为 Excel 场景

目标

- 验证 Content-Type 指定为 Excel MIME 时，下载扩展名正确映射

场景

- Content-Type: application/vnd.ms-excel (.xls)
- Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet (xlsx)

步骤

- 设置后端头信息
- 上传数据
- 触发导出下载
- 验证扩展名与 Content-Type 的对应关系
- 记录证据

证据模板

- Test Case: TC-D (Content-Type)
- Content-Type observed:
- Content-Disposition observed:
- Downloaded filename observed:
- Extension observed:
- Openable:
- Evidence:
