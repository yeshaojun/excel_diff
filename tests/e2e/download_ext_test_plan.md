End-to-end manual test plan: dynamic extension for downloaded marked Excel

Objective:

- Verify that the front-end download of the marked Excel file uses the correct file extension (.xls or .xlsx) depending on the input and server response headers.

Test data preparation:

- Prepare sample Excel files in project/tests-data:
  - base.xlsx, target1.xlsx
  - base.xls, target1.xls
- Ensure the server can access these files via the web UI or an equivalent test harness.

Test scenarios:

1. Scenario A: base.xlsx + target1.xlsx
   - Steps:
     - Open web UI (http://localhost:3000 or your deployed URL)
     - Upload base.xlsx in 基准文件 area
     - Upload target1.xlsx in 对比文件 area
     - Click 开始对比
     - Click 下载带标记的Excel
   - Expected:
     - Download filename ends with .xlsx: 标记改动的Excel文件.xlsx
     - Open in Excel and verify marked changes are present.

2. Scenario B: base.xls + target1.xls
   - Steps: same as A but with .xls files.
   - Expected:
     - Download filename ends with .xls: 标记改动的Excel文件.xls
     - Open in Excel and verify marked changes are present.

3. Scenario C: Server returns Content-Disposition with filename
   - Setup: Configure backend to respond with header: Content-Disposition: attachment; filename="marked_changes.xlsx"
   - Steps: put same as A, trigger download.
   - Expected:
     - Download filename matches marked_changes.xlsx (override extension logic).

4. Scenario D: Server returns Content-Type for Excel
   - Setup: Backend ensures Content-Type: application/vnd.ms-excel or application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
   - Steps: as A
   - Expected:
     - If Content-Type is vnd.ms-excel -> .xls; if OpenXML -> .xlsx

5. Scenario E: Missing headers (fallback)
   - Setup: Backend omits Content-Type and Content-Disposition
   - Steps: as A
   - Expected:
     - Fallback to .xlsx

Evidence to collect:

- Screenshots or notes of downloaded file names for each scenario
- A sample downloaded file to verify that it can be opened and contains changes
- Console/network logs showing Content-Type and Content-Disposition when available

Notes:

- The front-end code changes are in public/app-v2.js within downloadMarkedExcel().
- If any scenario fails, capture the exact response headers from /api/export-marked-excel and adjust the front-end logic accordingly.
