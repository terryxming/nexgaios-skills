---
name: lingxing-ad-operation-audit
description: Use this skill when you need a read-only LingXing advertising operation log audit, especially a 30-90 day HTML report showing what advertising variables changed, before/after values, who changed them, and filters by ad type or campaign name.
---

# LingXing Ad Operation Audit

## Overview

This skill generates a read-only advertising operation audit report from the deployed LingXing MCP service. It is intended for questions like "拉取近90天广告操作日志，看看广告调整了什么变量，改前改后是什么，以及调整前后效果有没有变好".

The workflow must use the MCP endpoint and key-based authorization path. Do not call LingXing OpenAPI directly unless the MCP service is unavailable and the user explicitly approves a fallback.

## Workflow

1. Confirm the reporting scope:
   - Store SID and country/site, such as `sid=7481`, `country=US` for 香港奥卡-US.
   - Date range. Default to the latest 90 calendar days when the user says "近90天".
   - Optional filters: `sponsored_type`, `operate_type`, `campaign_query`, `variable_code`, `user_query`, and `change_type`.
2. Export data with `scripts/export_ad_operation_logs.ts`.
   - Run from the MCP project root so `.env` and `node_modules` are available.
   - Use the deployed `lingxing_ad_operation_log_scan` tool.
   - Keep the output JSON in an artifact folder. Never print or persist the MCP key.
3. Export optional performance context with `scripts/export_ad_performance_context.ts`.
   - Default v0.1.1 effect layer covers SP campaign reports and SP keyword reports.
   - It pulls daily advertising metrics from the operation-log range so the report can compare stable variable intervals before and after each change.
   - The report later compares the same ad object and same variable across adjacent stable intervals, excluding the operation day because daily reports cannot represent intraday changes.
4. Build the report with `scripts/build_ad_operation_report.py`.
   - Generate one standalone HTML file with embedded data and client-side filters.
   - The HTML must support input-plus-dropdown fuzzy campaign filtering, ad type filtering, object/variable Chinese labels, a dual-month date picker, a campaign trend chart, field help badges, and a row-level effect window in the detail table.
5. Validate before handoff:
   - Confirm the exported envelope is `ok: true`.
   - Confirm total records, distinct campaigns, users, and variable-code counts are nonzero unless the source data is truly empty.
   - Open or inspect the HTML and verify filters, tooltips, dual-month date picker, campaign trend chart, row-level effect windows, and tables render.

## Default Export Command

Use explicit dates for reproducibility:

```powershell
$env:LINGXING_AD_AUDIT_SID="7481"
$env:LINGXING_AD_AUDIT_COUNTRY="US"
$env:LINGXING_AD_AUDIT_START_DATE="2026-03-19"
$env:LINGXING_AD_AUDIT_END_DATE="2026-06-16"
$env:LINGXING_AD_AUDIT_OUTPUT="artifacts/lingxing-ad-operation-audit/data/hk-aoka-us-90d.json"
npx tsx skills/lingxing-ad-operation-audit/scripts/export_ad_operation_logs.ts
```

## Default Performance Context Command

```powershell
$env:LINGXING_AD_IMPACT_INPUT="artifacts/lingxing-ad-operation-audit/data/hk-aoka-us-90d.json"
$env:LINGXING_AD_IMPACT_OUTPUT="artifacts/lingxing-ad-operation-audit/data/hk-aoka-us-performance-context.json"
npx tsx skills/lingxing-ad-operation-audit/scripts/export_ad_performance_context.ts
```

## Default Report Command

Use Codex's bundled Python when available because it includes the report dependencies:

```powershell
C:\Users\EDY\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe `
  skills/lingxing-ad-operation-audit/scripts/build_ad_operation_report.py `
  --input artifacts/lingxing-ad-operation-audit/data/hk-aoka-us-90d.json `
  --performance-input artifacts/lingxing-ad-operation-audit/data/hk-aoka-us-performance-context.json `
  --output artifacts/lingxing-ad-operation-audit/hk-aoka-us-ad-operation-audit-v0.1.0.html `
  --title "香港奥卡-US 广告操作日志监控" `
  --store-label "香港奥卡-US (SID 7481)"
```

## Report Expectations

The HTML report should include:

- Executive summary of operation volume, major levers, top campaigns, and active operators.
- A campaign trend chart, not static summary charts. The trend chart follows only the operation date range and campaign fuzzy-search controls.
- The report must exclude analysis-noise variables by default before calculating summaries, trends, and effect windows: `(empty)` / 无变量明细, and `IN_BUDGET` / 是否预算内.
- The campaign trend chart must provide multi-select metric toggles in true-value mode only. Do not include indexed/normalized trend mode.
- The campaign trend chart should follow LingXing ERP's multi-axis pattern: show at most three business metrics at once; each selected metric gets an independent Y axis; the first metric uses the left axis, the second uses the right axis, and the third uses a second right-side axis with visual offset.
- The campaign trend chart must use the full available content width. Recompute the SVG viewBox from the rendered container width and re-render on browser resize.
- The campaign trend chart must support click-to-highlight from both legend items and plotted curves/points. Highlighting one metric should make the selected series visually prominent and dim the other selected series; clicking it again should clear the highlight.
- The campaign trend chart X-axis labels must be density-aware. Do not hard-code a tiny fixed tick count; calculate date ticks from available plot width and date count so short ranges remain readable and wide screens show denser dates.
- The campaign trend chart tooltip must show the hovered date and the full trend metric set for that day, not only the single hovered series value.
- The campaign trend chart tooltip must visually separate advertising metrics from operation records with spacing or a divider.
- The operation-date marker legend must use a dot marker, matching the round dots shown on the chart.
- When the user selects a fourth metric, automatically remove the earliest selected metric. Prevent the user from deselecting the final remaining metric.
- Dynamically scale each metric's own axis from the currently visible data, especially percentage metrics such as CTR, CVR, ACOS, and indirect order share. Never force percentage axes to 0-100% unless the visible data requires it.
- The campaign trend chart must mark operation dates and expose a hover summary for operation count, changed variables, before/after values, and users.
- A detail table with changed variable code, before value, after value, user, time, campaign, object, ad type, and object type.
- Client-side filters for operation date range, ad type, object type, campaign fuzzy search, variable code, user, and change type.
- The dual-month date picker should not close after selecting only the start date. It should close and apply only after the end date is selected, or when the user explicitly applies a one-day range.
- Date picker quick ranges should include only today, yesterday, previous 7 days, recent 7 days, previous 30 days, recent 30 days, this month, and last month.
- A row-level effect window in the detail table comparing the before interval and after interval for each operation. The window must include CPC, impressions/day, clicks/day, CTR, CVR, ACOS, cost/day, ad orders/day, direct orders/day, indirect orders/day, and indirect order share.
- In the after interval, show an arrow before each metric when both intervals have covered report days. Arrow direction shows numeric movement; arrow color shows whether the movement is favorable. Lower is better for CPC, ACOS, and cost/day. Higher is better for impressions/day, clicks/day, CTR, CVR, ad orders/day, direct orders/day, indirect orders/day, and indirect order share.
- Caveats about API scope, date range, truncation, and records without before/after values.

## Effect Layer Rules

The v0.1.1 effect layer is deliberately conservative:

- The comparison unit is the same ad object plus the same changed variable.
- Before interval: from the day after the previous change to the day before the current change. If there is no previous change in the exported log, use the first available performance-report date.
- After interval: from the day after the current change to the day before the next change. If there is no next change in the exported log, use the last available performance-report date.
- The operation date itself is always excluded because the change can happen mid-day while the performance source is daily.
- SP campaigns are matched by `campaign_id`.
- SP keywords are matched by `object_id` to `keyword_id`, with a fallback on `campaign_id + ad_group_id + keyword_text`.
- Unsupported objects show "该对象暂未接入效果层"; unmatched report rows show "日报无匹配数据".

## Safety

- This skill is read-only.
- Do not expose `LINGXING_REMOTE_MCP_KEY`, external user keys, App ID, or AppSecret in generated reports.
- Generated reports may contain operational business data. Store them under `artifacts/` and do not publish them to a public repository unless the user explicitly approves.
