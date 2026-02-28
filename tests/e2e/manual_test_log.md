End-to-end manual test log template for download extension verification

Plan to execute tests (to be filled after running):

- Test runs planned for both .xlsx and .xls scenarios with and without headers
- Expected results and observed results will be recorded below
- Screenshots or downloads will be attached as evidence

Test Plan Details:

- Objective: Validate that the downloaded marked Excel file uses correct file extension (.xls or .xlsx) across scenarios and respects Content-Disposition filename when provided.
- Environment:
  - Frontend: http://localhost:3000
  - Backend: /api/export-marked-excel
  - Test data: base.xlsx, target.xlsx, base.xls, target.xls
- Screenshots: To be attached per test case
- Logs: Network headers, downloaded file names, and Excel openability notes

Test Case Result Template (per TC):

- TC ID:
- Base file:
- Target file(s):
- Content-Type observed:
- Content-Disposition observed:
- Downloaded filename observed:
- Extension observed:
- Openable (Yes/No):
- Verification notes:
- Evidence (links/files):

Pre-test steps:

- Ensure server and UI are running
- Prepare test data in accessible locations
- Clear previous test artifacts if needed

Test Plan:

- Objective: Validate that the downloaded marked Excel file uses correct file extension (.xls or .xlsx) across scenarios and respects Content-Disposition filename when provided.
- Environment:
  - Frontend: http://localhost:3000
  - Backend: /api/export-marked-excel
  - Test data: base.xlsx, target.xlsx, base.xls, target.xls

Test Cases:

- TC-01: base.xlsx + target.xlsx
- TC-02: base.xls + target.xls
- TC-03: Content-Disposition header specifies filename
- TC-04: Content-Type header specifies Excel type
- TC-05: No header information (fallback)

Fields to capture (per TC):

- BaseFile
- TargetFile(s)
- Headers observed: Content-Type, Content-Disposition
- Downloaded file name
- Extension
- Openable: Yes/No
- Time
- Notes/Issue(s)

How to log results:

- Record results in a table; add screenshots for file name and a short note whether the file opens correctly in Excel.
- If any discrepancy is observed, attach the exact header values and describe the behavior.

Post-test:

- If all tests pass, update CHANGELOG with a summary of the validation.
- If any test fails, attach a patch or describe the fix needed, and push a changelog entry accordingly.
