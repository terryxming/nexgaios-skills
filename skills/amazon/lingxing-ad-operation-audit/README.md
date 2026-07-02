# 领星广告操作日志审计

`lingxing-ad-operation-audit` 是一个 agent skill，基于只读领星 MCP 的数据生成可交互的 HTML 广告操作审计报告。

它回答的问题是：近 30-90 天广告到底改了什么变量、谁改的、改前改后是什么，以及这些调整前后的广告数据表现是否变好。

## 当前版本

```text
v0.2.0
```

## 工作方式

自 v0.2.0 起，本 skill 不再内置 MCP 客户端取数脚本。取数由 agent 会话中已连接的领星只读 MCP 工具完成（MCP server 源码维护在同级仓库 `nexgaios-lingxing`）。本 skill 负责两件事：

1. 定义取数范围和数据契约：见 `SKILL.md` 和 `references/data-contract.md`。
2. 把落盘 JSON 渲染成单文件 HTML 审计报告：`scripts/build_ad_operation_report.py`。

## 使用前准备

- agent 会话已连接领星只读 MCP，且授权范围覆盖目标店铺和站点。
- Python 3.10+，并安装报告依赖：

```powershell
python -m pip install -r requirements.txt
```

## 生成报告

1. 让 agent 按 `SKILL.md` 的工作流程取数，把操作日志 JSON 和可选的效果层 JSON 落盘到 `artifacts/lingxing-ad-operation-audit/data/` 下，字段结构必须符合 `references/data-contract.md`。
2. 运行报告生成：

```powershell
python scripts/build_ad_operation_report.py `
  --input artifacts/lingxing-ad-operation-audit/data/export.json `
  --performance-input artifacts/lingxing-ad-operation-audit/data/performance-context.json `
  --output artifacts/lingxing-ad-operation-audit/report.html `
  --title "领星广告操作日志监控" `
  --store-label "香港奥卡-US (SID 7481)"
```

完成后打开 `--output` 指定的 HTML 文件。

## 报告怎么看

打开生成的 HTML 后，重点看三块：

- **广告活动趋势**：选择花费、订单、ACOS、CTR、CVR 等指标，观察操作日期前后的变化。
- **筛选明细**：按日期、广告类型、对象类型、广告活动、变量、用户过滤具体操作。
- **效果窗口**：每条操作会展示改前区间和改后区间的日均数据，用于判断调整后表现是否变好。

报告默认会过滤两类分析噪音：

- `无变量明细`：通常表示广告活动、广告组或广告被暂停，没有具体变量变化。
- `是否预算内`：预算状态同步，对分析广告操作收益帮助不大。

## 常见错误

### 找不到 python 或缺少 pandas

需要 Python 3.10+，并先执行 `python -m pip install -r requirements.txt`。

### 报告没有数据

依次检查：

- 日期范围内是否确实有广告操作。
- 取数时的店铺 SID 和站点是否正确。
- 落盘 JSON 是否符合 `references/data-contract.md` 的 envelope（`ok: true`、`data` 非空）。

### 日期格式错误

日期必须是 `YYYY-MM-DD`，例如 `2026-06-16`。不要写成 `2026/6/16`、`20260616` 或 `2026-6-16`。

## 安全边界

- 本 skill 只读，不会写入领星。
- 不要在落盘 JSON、日志或报告中留下任何 Key、App ID 或 AppSecret。
- 生成的 JSON、HTML、截图、CSV、Excel 默认被 `.gitignore` 排除。
- 报告中可能包含经营数据，不要发布到公开仓库。

## 版本记录

见 [CHANGELOG.md](CHANGELOG.md)。
