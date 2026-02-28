Step-by-step end-to-end manual test execution guide for download extension verification

- Ensure server and UI are running at http://localhost:3000
- Provide test data: base.xlsx, target.xlsx, base.xls, target.xls
- For each test case, perform the following and record results in tests/e2e/manual_test_results_template.md:
  1. Upload base and target files to their respective areas
  2. Click Start Compare
  3. Click Download Marked Excel
  4. Observe and record:
     - Downloaded file name and extension
     - Content-Type and Content-Disposition from response headers (if accessible)
     - Whether the file opens correctly in Excel and shows markers
     - Attach screenshot or logs

- Repeat for .xlsx and .xls combinations
- If server headers specify a filename, verify the downloaded file name matches that filename
