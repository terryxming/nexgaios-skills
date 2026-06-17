# Changelog

## v0.1.1 - 2026-06-17

### Added

- Added a readonly Codex skill for LingXing advertising operation audit reports.
- Added MCP-based log export through `lingxing_ad_operation_log_scan`.
- Added optional performance-context export for SP campaign and SP keyword reports.
- Added standalone HTML report generation with:
  - dual-month date picker
  - campaign fuzzy search with dropdown suggestions
  - Chinese labels for object types and variables
  - full-width campaign trend chart
  - multi-metric true-value axes
  - click-to-highlight trend series
  - dense date-axis ticks based on available chart width
  - full metric tooltip by date
  - separated tooltip sections for advertising metrics and operation records
  - row-level before/after effect windows

### Changed

- Default analysis now filters operation-noise variables before summaries, trends, detail rows, and effect windows:
  - `(empty)` / 无变量明细
  - `IN_BUDGET` / 是否预算内
- Operation-date marker legend now uses a round dot symbol to match the chart marker.

### Security

- Generated data and report artifacts are ignored by default.
- Real MCP keys must stay in local `.env` files only.
