End-to-end manual test run instructions for download extension verification

Overview

- Validate that the downloaded marked Excel file uses the correct extension (.xls or .xlsx) for base/target combinations and respects Content-Disposition filename when provided.

Prerequisites

- Server and web UI are up (http://localhost:3000).
- Test data available: base.xlsx, target.xlsx, base.xls, target.xls stored in test data location accessible to the app.
- Access to /api/export-marked-excel for the export operation.

Test plan (TC-A / TC-B / TC-C / TC-D / TC-E)

- TC-A: base.xlsx + target.xlsx
- TC-B: base.xls + target.xls
- TC-C: Content-Disposition specifies filename
- TC-D: Content-Type specifies Excel mime type
- TC-E: No headers (fallback)

How to record results

- For each TC, record: Content-Type observed, Content-Disposition observed, downloaded filename, extension, openable, evidence (screenshots/logs)
- Attach screenshots of download prompt (if browser prompts), file name after download, and a sample opened file showing markers

Post-test

- If all TC pass, note success in changelog; otherwise submit a patch for frontend extension inference improvements
