# Data Contract

The export script calls `lingxing_ad_operation_log_scan` and expects a text MCP result containing a JSON envelope:

```json
{
  "ok": true,
  "tool": "lingxing_ad_operation_log_scan",
  "data": [
    {
      "profile_id": "0",
      "sponsored_type": "sp",
      "operate_type": "campaigns",
      "campaign_id": "123",
      "campaign_name": "Campaign name",
      "ad_group_id": "456",
      "ad_group_name": "Ad group name",
      "object_id": "789",
      "object_name": "Object name",
      "function_name": "history",
      "change_type": "update",
      "user_id": "1",
      "user_name": "Operator",
      "operate_time": "2026-06-16 10:00:00",
      "changes": [
        { "code": "BID_AMOUNT", "before": "1.20", "after": "1.35" }
      ]
    }
  ],
  "summary": {},
  "metadata": {}
}
```

If `changes` is empty, keep the log-level record and mark the variable code as `(empty)`.

The report generator excludes the following variable codes from analysis before calculating summaries, trend markers, detail rows, and effect windows:

- `(empty)` / 无变量明细
- `IN_BUDGET` / 是否预算内

These records are treated as analysis noise because they usually represent pause/status propagation or budget-in/out state synchronization rather than an optimization lever whose before/after effect should be evaluated.

Core filters:

- `sponsored_type`: `sp`, `sb`, `sd`
- `operate_type`: `campaigns`, `adGroups`, `productAds`, `keywords`, `negativeKeywords`, `targets`, `negativeTargets`, `profiles`
- `log_source`: `all`, `erp`, `amazon`
- `campaign_query`: fuzzy query across campaign, object, and ad group names

## Performance Context

`export_ad_performance_context.ts` produces an optional second JSON file:

```json
{
  "date_range": { "start_date": "2026-03-12", "end_date": "2026-06-16" },
  "report_types": ["sp_campaign_reports", "sp_keyword_reports"],
  "rows": {
    "sp_campaign_reports": [],
    "sp_keyword_reports": []
  }
}
```

The HTML generator uses this data to calculate a before/after impact object per supported operation. The default row-level effect window compares adjacent stable intervals for the same ad object and same variable:

- Before interval: previous change date + 1 through current change date - 1, or the first available performance date through current change date - 1 when there is no previous change.
- After interval: current change date + 1 through next change date - 1, or current change date + 1 through the last available performance date when there is no next change.
- The operation date is excluded because operation logs are timestamped but performance reports are daily.

Metrics:

- CPC = cost / clicks
- CTR = clicks / impressions
- CVR = orders / clicks
- ACOS = cost / sales
- ad orders = `orders`
- direct orders = `same_orders`
- indirect orders = `orders - same_orders`
- indirect order share = indirect orders / orders

In the HTML effect window, quantity metrics are displayed as daily averages based on covered report days: impressions/day, clicks/day, cost/day, ad orders/day, direct orders/day, and indirect orders/day. Rate metrics remain weighted interval rates from the summed numerator/denominator.

When both before and after intervals have covered report days, the after interval displays an arrow before each metric value. Direction reflects numeric movement; color reflects whether that movement is favorable. Lower is better for CPC, ACOS, and cost/day. Higher is better for impressions/day, clicks/day, CTR, CVR, ad orders/day, direct orders/day, indirect orders/day, and indirect order share.

## Campaign Trend Chart

The HTML embeds `sp_campaign_reports` from the performance context to draw a client-side SVG campaign trend chart. The chart follows only two controls:

- operation date range
- campaign fuzzy-search text

Other detail-table filters such as variable, user, object type, and operation type must not change the trend chart dataset.

Metrics are multi-select in true-value mode. The default selected metrics are cost, ad orders, and ACOS.

The SVG chart must fill the available content width. Calculate the SVG viewBox width from the rendered chart container and rerender on browser resize.

The chart interaction model:

- Clicking a legend item or a plotted curve/point toggles highlight for that metric.
- While one metric is highlighted, other selected metrics are dimmed but remain visible for context.
- Hovering the chart should show a custom tooltip for the hovered date with the full trend metric set, not only the single series under the cursor.
- The tooltip should separate the advertising-metric block from the operation-record block with clear spacing or a divider.
- The operation-date marker legend should use a round dot symbol to match the chart marker dots.
- X-axis date labels should be density-aware and based on available plot width plus date count. Avoid a fixed six-tick axis because it is too sparse on wide screens and short ranges.

Trend axis behavior follows LingXing ERP's multi-axis pattern:

- Show at most three business metrics at once.
- Each selected metric owns an independent Y axis.
- The first selected metric uses the left axis.
- The second selected metric uses the right axis.
- The third selected metric uses a second right-side axis with visual offset.
- Selecting a fourth metric automatically removes the earliest selected metric.
- Deselecting the final remaining metric is blocked so the chart always has at least one business metric.
- Each axis is dynamically scaled from currently visible data. Percentage axes such as CTR, CVR, ACOS, and indirect order share must not be forced to 0-100% unless the visible data requires it.

Operation dates are rendered as marker lines/dots. Markers aggregate all matched operations on that date and expose a hover summary with operation count, variable, before/after values, and user.

Supported v0.1.1 joins:

- `sp/campaigns` -> `sp_campaign_reports`, matched by `campaign_id`
- `sp/keywords` -> `sp_keyword_reports`, matched by `object_id = keyword_id`, fallback `campaign_id + ad_group_id + keyword_text`
