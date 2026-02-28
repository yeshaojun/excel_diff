TC-C Guide: Content-Disposition 指定 filename 场景

目标

- 验证 Content-Disposition 指定的 filename 在下载时被优先使用

前提

- 服务器/代理能返回 Content-Disposition; filename=xxx（xls 或 xlsx）
- 测试数据：base.xlsx/target.xlsx 或 base.xls/target.xls，视需要测试的扩展名

步骤

- 设置后端头信息后，上传测试数据并触发对比
- 下载带标记的 Excel
- 验证下载名等于 header 指定的 filename，扩展名与 header 扩展一致
- 记录头信息和下载证据

证据模板

- Test Case: TC-C (Content-Disposition)
- Content-Disposition observed:
- Downloaded filename observed:
- Extension observed:
- Openable:
- Evidence:
