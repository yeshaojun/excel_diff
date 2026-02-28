End-to-end manual run: download extension verification (current run)

Objective

- Validate that the downloaded marked Excel uses correct file extension (.xls or .xlsx) for current base/target pairs
- Validate Content-Disposition filename priority when header is present

Test data (place these files where you can upload from UI):

- base.xlsx, target.xlsx
- base.xls, target.xls

Environment

- UI: http://localhost:3000
- API: /api/export-marked-excel

Steps

- [ ] Prepare environment and ensure UI is accessible
- [ ] Upload base.xlsx to 基准文件
- [ ] Upload target.xlsx to 对比文件
- [ ] Click 开始对比
- [ ] Click 下载带标记的Excel
- [ ] Record the following for TC-A (base.xlsx + target.xlsx):
- [ ] Downloaded filename observed
- [ ] Extension observed
- [ ] Content-Type observed (if available)
- [ ] Content-Disposition observed (if available)
- [ ] Openable in Excel and visible markers
- [ ] Attach evidence files (screenshots or downloaded file)
- [ ] Repeat the same steps for TC-B using base.xls + target.xls
- [ ] For header testing, configure server to return Content-Disposition and/or Content-Type and repeat as applicable

Evidence template

- Test Case:
- Base File:
- Target File:
- Content-Type observed:
- Content-Disposition observed:
- Downloaded filename observed:
- Extension observed:
- Openable:
- Evidence (files/screenshots):

Notes

- After the test, update tests/e2e/manual_test_results_template.md with actual data gathered.
