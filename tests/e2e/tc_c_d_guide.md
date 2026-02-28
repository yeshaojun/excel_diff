TC-C and TC-D Guide: Head-Driven Tests for Download Extensions

- TC-C: Content-Disposition specified filename
- TC-D: Content-Type specified as Excel MIME

- Prerequisites: Backend/user-proxy supports injecting Content-Disposition and Content-Type headers for testing
- Steps:
  1. Configure backend to return Content-Disposition: attachment; filename="marked_changes.xlsx" (or .xls)
  2. Run TC-C, trigger export, download, verify downloaded file name matches header filename and extension
  3. Configure backend to return Content-Type: application/vnd.ms-excel or application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
  4. Run TC-D, trigger export, download, verify extension matches Content-Type
- Evidence: Capture Content-Type and Content-Disposition in the response, along with downloaded file name and a screenshot of opened file showing markers
