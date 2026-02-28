# Changelog

Unreleased

- feat(frontend): 增强下载带标记的 Excel 的扩展名推断逻辑，优先使用 Content-Disposition 指定的 filename，次之依据 Content-Type；提供兜底策略，确保 .xls/.xlsx 双扩展名场景的兼容性。
- docs(test): 增加端到端测试计划文档，便于手动测试用例执行与结果记录。
