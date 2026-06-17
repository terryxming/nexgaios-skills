# 数据契约

导出脚本会调用 `lingxing_ad_operation_log_scan`，并预期 MCP 返回一个文本内容，文本中包含如下 JSON envelope：

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

如果 `changes` 为空，仍保留日志级记录，并把变量 code 标记为 `(empty)`。

报告生成器会在计算摘要、趋势标记、明细行和效果窗口之前，排除以下变量 code：

- `(empty)` / 无变量明细
- `IN_BUDGET` / 是否预算内

这些记录通常代表暂停/状态传导或预算内外状态同步，不是用于评估广告优化收益的操作变量，因此视为分析噪音。

核心筛选字段：

- `sponsored_type`：`sp`、`sb`、`sd`
- `operate_type`：`campaigns`、`adGroups`、`productAds`、`keywords`、`negativeKeywords`、`targets`、`negativeTargets`、`profiles`
- `log_source`：`all`、`erp`、`amazon`
- `campaign_query`：在广告活动、对象和广告组名称中做模糊查询

## 效果层上下文

`export_ad_performance_context.ts` 会生成可选的第二个 JSON 文件：

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

HTML 生成器使用这份数据，为支持的操作计算每一行的改前/改后效果对象。默认行级效果窗口会针对同一个广告对象和同一个变量，比较相邻稳定区间：

- 改前区间：上一次变化日期 + 1 到当前变化日期 - 1；如果没有上一次变化，则使用第一天可用效果日报到当前变化日期 - 1。
- 改后区间：当前变化日期 + 1 到下一次变化日期 - 1；如果没有下一次变化，则使用当前变化日期 + 1 到最后一天可用效果日报。
- 操作当天排除，因为操作日志有具体时间戳，而效果报表是按天统计。

指标定义：

- CPC = 花费 / 点击
- CTR = 点击 / 曝光量
- CVR = 广告订单 / 点击
- ACOS = 花费 / 销售额
- 广告订单 = `orders`
- 直接订单 = `same_orders`
- 间接订单 = `orders - same_orders`
- 间接订单占比 = 间接订单 / 广告订单

HTML 效果窗口中，数量型指标按覆盖日报天数展示为日均值：曝光量/日、点击/日、花费/日、广告订单/日、直接订单/日、间接订单/日。比例型指标仍使用区间内分子/分母汇总后的加权比例。

当改前和改后区间都有覆盖日报时，改后区间会在每个指标值前展示箭头。箭头方向表示数值变化；颜色表示这个变化是否有利。CPC、ACOS、花费/日越低越好。曝光量/日、点击/日、CTR、CVR、广告订单/日、直接订单/日、间接订单/日、间接订单占比越高越好。

## 广告活动趋势图

HTML 会内嵌效果层中的 `sp_campaign_reports`，并用客户端 SVG 绘制广告活动趋势图。趋势图只跟随两个控件：

- 操作日期范围
- 广告活动模糊搜索文本

变量、用户、对象类型、操作类型等明细表筛选条件不得改变趋势图数据集。

指标采用多选真实值模式。默认选中指标为花费、广告订单和 ACOS。

SVG 图表必须铺满可用内容宽度。根据图表容器的实际渲染宽度计算 SVG viewBox，并在浏览器 resize 时重绘。

图表交互模型：

- 点击图例项、曲线或数据点时，切换该指标的高亮状态。
- 当某个指标高亮时，其他已选指标降透明，但仍保留在图中作为上下文。
- hover 图表时，应展示自定义悬浮提示，内容为 hover 日期下的完整趋势指标集，而不是只展示鼠标下单条曲线的值。
- 悬浮提示应用清晰的间距或分割线区分广告指标区块和操作记录区块。
- 操作日期标记图例应使用圆点符号，和图表中的圆形标记保持一致。
- X 轴日期标签应根据可用图表宽度和日期数量智能计算。避免固定 6 个 tick，因为这在宽屏和短日期范围下太稀疏。

趋势图坐标轴遵循领星 ERP 的多轴模式：

- 最多同时显示 3 个业务指标。
- 每个选中指标独立拥有一个 Y 轴。
- 第一个选中指标使用左轴。
- 第二个选中指标使用右轴。
- 第三个选中指标使用右侧偏移的第二右轴。
- 选择第 4 个指标时，自动移除最早选中的指标。
- 禁止取消最后一个指标，保证图表始终至少有一个业务指标。
- 每个坐标轴都基于当前可见数据动态缩放。CTR、CVR、ACOS、间接订单占比等百分比指标，除非可见数据确实需要，不应强制使用 0-100%。

操作日期会渲染为标记线和圆点。标记会聚合该日期下所有匹配操作，并在 hover 摘要中展示操作数、变量、改前/改后值和用户。

v0.1.2 支持的效果层关联：

- `sp/campaigns` -> `sp_campaign_reports`，按 `campaign_id` 匹配
- `sp/keywords` -> `sp_keyword_reports`，按 `object_id = keyword_id` 匹配，并用 `campaign_id + ad_group_id + keyword_text` 兜底
