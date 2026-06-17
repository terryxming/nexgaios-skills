# LingXing Ad Operation Audit

`lingxing-ad-operation-audit` 是一个 Codex skill，用于通过只读 LingXing MCP 拉取广告操作日志，并生成可交互的 HTML 审计报告。

它回答的问题是：近 30-90 天广告到底改了什么变量、谁改的、改前改后是什么，以及这些调整前后的广告数据表现是否变好。

## 当前版本

```text
v0.1.1
```

## 能力

- 通过 MCP 工具 `lingxing_ad_operation_log_scan` 导出广告操作日志。
- 支持按店铺 SID、站点、日期范围、广告类型、对象类型、变量、操作人筛选。
- 可选导出 SP 广告活动和 SP 关键词日报，用于效果对比。
- 生成单文件 HTML 报告，包含：
  - 广告活动趋势图
  - 多指标真实值坐标轴
  - 曲线/图例点击高亮
  - 日期级全量指标 tooltip
  - 操作记录标记点
  - 变量变化前后稳定区间对比
  - 明细表和字段说明

## 安装依赖

```powershell
npm install
python -m pip install -r requirements.txt
```

## 配置

复制 `.env.example` 为 `.env`，填入管理员分配的只读 MCP Key。

```powershell
Copy-Item .env.example .env
```

必须配置：

```text
LINGXING_PUBLIC_MCP_URL=https://mcp.nexgaios.com/mcp-services/lingxing-mcp
LINGXING_REMOTE_MCP_KEY=YOUR_X_MCP_KEY_HERE
LINGXING_AD_AUDIT_SID=7481
LINGXING_AD_AUDIT_COUNTRY=US
LINGXING_AD_AUDIT_START_DATE=2026-03-19
LINGXING_AD_AUDIT_END_DATE=2026-06-16
```

不要把 `.env` 提交到 GitHub。

## 使用

1. 导出广告操作日志：

```powershell
npm run export:logs
```

2. 导出效果层日报：

```powershell
npm run export:performance
```

3. 生成 HTML 报告：

```powershell
python scripts/build_ad_operation_report.py `
  --input artifacts/lingxing-ad-operation-audit/data/export.json `
  --performance-input artifacts/lingxing-ad-operation-audit/data/performance-context.json `
  --output artifacts/lingxing-ad-operation-audit/report.html `
  --title "LingXing 广告操作日志监控" `
  --store-label "Store Label"
```

## Skill 位置

本 skill 已迁移到 `terryxming/nexgaios-skills` monorepo：

```text
skills/amazon/lingxing-ad-operation-audit
```

skill 根目录包含 `SKILL.md` 和 `skill.yaml`。

## 安全边界

- 本 skill 只读，不会写入 LingXing。
- 真实 Key 只放在本地 `.env`。
- 生成的 JSON、HTML、截图、CSV、Excel 默认被 `.gitignore` 排除。
- 报告中可能包含经营数据，不要发布到公开仓库。

## 版本记录

见 [CHANGELOG.md](CHANGELOG.md)。
