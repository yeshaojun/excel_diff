Header-based testing guidance for download extension handling

- TC-C: Content-Disposition header testing guidance
- TC-D: Content-Type header testing guidance
- Approach: Backend must be configurable to return headers for test scenarios or use a staging server that can inject these headers.
- Test plan:
  - Ensure the backend returns Content-Disposition: attachment; filename="marked_changes.xlsx" (or .xls) and verify the front-end downloads with the correct extension
  - Ensure the backend returns Content-Type: application/vnd.ms-excel (xls) or application/vnd.openxmlformats-officedocument.spreadsheetml.sheet (xlsx) and verify extension accordingly
- If backend cannot be configured, use Playwright to simulate headers via response interception (advanced) or add a small proxy layer to inject headers for testing
