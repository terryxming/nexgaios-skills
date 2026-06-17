---
name: lingxing-ad-operation-audit
description: 当需要做只读的领星广告操作日志审计时使用此 skill，尤其适用于生成近 30-90 天 HTML 报告，分析广告变量改了什么、改前改后是什么、谁操作的，以及支持按广告类型或广告活动名称筛选。
---

# 领星广告操作日志审计

## 概览

这个 skill 用于通过已部署的只读 LingXing MCP 服务生成广告操作日志审计报告。典型需求包括：“拉取近 90 天广告操作日志，看看广告调整了什么变量，改前改后是什么，以及调整前后效果有没有变好”。

必须走 MCP endpoint 和 Key 鉴权路径。除非 MCP 服务不可用且用户明确同意降级，否则不要直接调用领星 OpenAPI。

## 工作流程

1. 确认报告范围：
   - 店铺 SID 和国家/站点，例如香港奥卡-US 对应 `sid=7481`、`country=US`。
   - 日期范围。用户说“近 90 天”时，默认使用最近 90 个自然日。
   - 可选筛选条件：`sponsored_type`、`operate_type`、`campaign_query`、`variable_code`、`user_query`、`change_type`。
2. 用 `scripts/export_ad_operation_logs.ts` 导出广告操作日志。
   - 从 skill 根目录或已安装 skill 目录运行，确保 `.env` 和 `node_modules` 可用。
   - 使用已部署的 `lingxing_ad_operation_log_scan` 工具。
   - 输出 JSON 放在 `artifacts/` 下，不要打印或持久化完整 MCP Key。
3. 用 `scripts/export_ad_performance_context.ts` 导出可选效果层数据。
   - v0.1.2 默认覆盖 SP 广告活动报表和 SP 关键词报表。
   - 拉取操作日志日期范围内的广告日报，供报告比较每次变量变化前后的稳定区间。
   - 报告会按同一个广告对象和同一个变量，比较相邻稳定区间；操作当天默认排除，因为日报无法表达日内改动。
4. 用 `scripts/build_ad_operation_report.py` 生成报告。
   - 生成一个内嵌数据的单文件 HTML。
   - HTML 必须支持输入+下拉形式的广告活动模糊筛选、广告类型筛选、对象/变量中文标签、双月日期选择器、广告活动趋势图、字段帮助角标，以及明细表中的行级效果窗口。
5. 交付前验证：
   - 确认导出 envelope 的 `ok: true`。
   - 确认总记录数、广告活动数、操作人数、变量 code 数非零，除非源数据确实为空。
   - 打开或检查 HTML，确认筛选器、悬浮提示、双月日期选择器、广告活动趋势图、行级效果窗口和表格都能正常渲染。

## 默认导出命令

为了可复现，优先使用明确日期：

```powershell
$env:LINGXING_AD_AUDIT_SID="7481"
$env:LINGXING_AD_AUDIT_COUNTRY="US"
$env:LINGXING_AD_AUDIT_START_DATE="2026-03-19"
$env:LINGXING_AD_AUDIT_END_DATE="2026-06-16"
$env:LINGXING_AD_AUDIT_OUTPUT="artifacts/lingxing-ad-operation-audit/data/hk-aoka-us-90d.json"
npx tsx scripts/export_ad_operation_logs.ts
```

## 默认效果层导出命令

```powershell
$env:LINGXING_AD_IMPACT_INPUT="artifacts/lingxing-ad-operation-audit/data/hk-aoka-us-90d.json"
$env:LINGXING_AD_IMPACT_OUTPUT="artifacts/lingxing-ad-operation-audit/data/hk-aoka-us-performance-context.json"
npx tsx scripts/export_ad_performance_context.ts
```

## 默认报告生成命令

优先使用 Codex bundled Python，因为它通常已经包含报表依赖：

```powershell
C:\Users\EDY\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe `
  scripts/build_ad_operation_report.py `
  --input artifacts/lingxing-ad-operation-audit/data/hk-aoka-us-90d.json `
  --performance-input artifacts/lingxing-ad-operation-audit/data/hk-aoka-us-performance-context.json `
  --output artifacts/lingxing-ad-operation-audit/hk-aoka-us-ad-operation-audit-v0.1.2.html `
  --title "香港奥卡-US 广告操作日志监控" `
  --store-label "香港奥卡-US (SID 7481)"
```

## 报告要求

HTML 报告应包含：

- 操作量、主要调整变量、重点广告活动、活跃操作人的摘要。
- 广告活动趋势图，而不是静态汇总图。趋势图只跟随操作日期范围和广告活动模糊搜索两个控件。
- 报告必须在计算摘要、趋势、效果窗口和明细前，默认过滤分析噪音变量：`(empty)` / 无变量明细，以及 `IN_BUDGET` / 是否预算内。
- 广告活动趋势图必须支持多指标选择，且只使用真实值模式；不要提供指数化或归一化模式。
- 广告活动趋势图应遵循领星 ERP 的多坐标轴模式：最多同时显示 3 个业务指标；每个选中指标独立拥有一个 Y 轴；第一个指标使用左轴，第二个指标使用右轴，第三个指标使用右侧偏移的第二右轴。
- 广告活动趋势图必须铺满可用内容宽度。根据实际容器宽度重新计算 SVG viewBox，并在浏览器 resize 时重绘。
- 广告活动趋势图必须支持从图例、曲线和数据点点击高亮。高亮某个指标时，该指标更醒目，其他已选指标降透明；再次点击同一指标应取消高亮。
- 广告活动趋势图的 X 轴日期标签必须根据图表宽度和日期数量智能计算。不要硬编码很少的固定 tick 数；短日期范围和宽屏下应显示更密集日期。
- 广告活动趋势图悬浮提示必须展示 hover 日期和当天完整趋势指标，而不是只展示单条曲线的值。
- 广告活动趋势图悬浮提示必须用间距或分割线区分“广告指标”和“操作记录”。
- 操作日期标记的图例必须使用圆点，和图表中的圆形标记保持一致。
- 当用户选择第 4 个趋势指标时，自动移除最早选中的指标。禁止取消最后一个指标，保证图表始终至少有一个业务指标。
- 每个指标坐标轴必须基于当前可见数据动态缩放，尤其是 CTR、CVR、ACOS、间接订单占比等百分比指标。除非可见数据确实需要，否则不要强制使用 0-100%。
- 广告活动趋势图必须标记发生操作的日期，并在 hover 中展示操作数、变量、改前/改后值和操作人摘要。
- 明细表必须包含变化变量 code、改前值、改后值、用户、时间、广告活动、对象、广告类型和对象类型。
- 客户端筛选器必须支持操作日期范围、广告类型、对象类型、广告活动模糊搜索、变量 code、用户和变化类型。
- 双月日期选择器在只选择开始日期后不应自动关闭；应在选择结束日期后关闭并应用，或在用户明确应用单日范围时关闭。
- 日期快捷范围只包含：今天、昨天、前 7 天、近 7 天、前 30 天、近 30 天、本月、上月。
- 明细表的行级效果窗口必须比较每次操作的改前区间和改后区间，并包含 CPC、曝光量/日、点击/日、CTR、CVR、ACOS、花费/日、广告订单/日、直接订单/日、间接订单/日、间接订单占比。
- 改后区间中，当改前/改后两段都有覆盖日报时，每个指标前显示箭头。箭头方向表示数值变化，颜色表示该变化是否有利。CPC、ACOS、花费/日越低越好；曝光量/日、点击/日、CTR、CVR、广告订单/日、直接订单/日、间接订单/日、间接订单占比越高越好。
- 报告必须说明 API 范围、日期范围、截断限制，以及缺少改前/改后值的记录口径。

## 效果层规则

v0.1.2 的效果层刻意保持保守：

- 比较单元是同一个广告对象 + 同一个变化变量。
- 改前区间：从上一次变化的后一天到当前变化的前一天。如果导出日志中没有上一次变化，则使用第一天可用效果日报到当前变化的前一天。
- 改后区间：从当前变化的后一天到下一次变化的前一天。如果没有下一次变化，则使用当前变化的后一天到最后一天可用效果日报。
- 操作当天始终排除，因为操作日志有具体时间戳，但效果来源是日报。
- SP 广告活动按 `campaign_id` 匹配。
- SP 关键词按 `object_id` 匹配 `keyword_id`，并用 `campaign_id + ad_group_id + keyword_text` 作为兜底匹配。
- 不支持的对象显示“该对象暂未接入效果层”；日报匹配不到时显示“日报无匹配数据”。

## 安全要求

- 这个 skill 只能用于只读分析。
- 不要在生成报告中暴露 `LINGXING_REMOTE_MCP_KEY`、外部用户 Key、App ID 或 AppSecret。
- 生成的报告可能包含业务经营数据。默认存放在 `artifacts/` 下，除非用户明确批准，不要发布到公共仓库。
