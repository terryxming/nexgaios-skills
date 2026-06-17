# 领星广告操作日志审计

`lingxing-ad-operation-audit` 是一个 Codex skill，用于通过只读 LingXing MCP 拉取广告操作日志，并生成可交互的 HTML 审计报告。

它回答的问题是：近 30-90 天广告到底改了什么变量、谁改的、改前改后是什么，以及这些调整前后的广告数据表现是否变好。

## 当前版本

```text
v0.1.3
```

## 使用前准备

你不需要领星 App ID、AppSecret，也不需要直接访问领星 OpenAPI。

你只需要管理员提供三类信息：

| 信息 | 从哪里来 | 示例 |
| --- | --- | --- |
| MCP 地址 | 管理员提供，通常固定不变 | `https://mcp.nexgaios.com/mcp-services/lingxing-mcp` |
| X-Mcp-Key | 管理员在 MCP 管理后台创建 | `lxmcp_key_xxx` |
| 授权店铺和站点 | 管理员告诉你能查哪些店铺 | `香港奥卡-US，SID=7481，country=US` |

如果你没有 `X-Mcp-Key`，脚本会返回鉴权失败，无法导出数据。

## Skill 位置

本 skill 已迁移到 `terryxming/nexgaios-skills` monorepo：

```text
skills/amazon/lingxing-ad-operation-audit
```

skill 根目录包含 `SKILL.md` 和 `skill.yaml`。如果你拿到的是发布包，解压后进入该 skill 根目录即可。

## 第一次配置

复制配置模板：

```powershell
Copy-Item .env.example .env
```

然后打开 `.env`，按下面说明填写。

### 必填配置

| 配置项 | 怎么填 | 示例 |
| --- | --- | --- |
| `LINGXING_PUBLIC_MCP_URL` | MCP 服务地址。一般不要改，除非管理员给了新地址。 | `https://mcp.nexgaios.com/mcp-services/lingxing-mcp` |
| `LINGXING_REMOTE_MCP_KEY` | 管理员分配给你的完整 `X-Mcp-Key`。不要发到群里，不要提交 GitHub。 | `lxmcp_key_xxx` |
| `LINGXING_AD_AUDIT_SID` | 店铺 SID。必须在你的 Key 授权范围内。 | `7481` |
| `LINGXING_AD_AUDIT_COUNTRY` | Amazon 站点国家码。必须在你的 Key 授权范围内。 | `US` |
| `LINGXING_AD_AUDIT_START_DATE` | 查询开始日期，格式必须是 `YYYY-MM-DD`。 | `2026-03-19` |
| `LINGXING_AD_AUDIT_END_DATE` | 查询结束日期，格式必须是 `YYYY-MM-DD`。 | `2026-06-16` |

一份最小可用配置如下：

```text
LINGXING_PUBLIC_MCP_URL=https://mcp.nexgaios.com/mcp-services/lingxing-mcp
LINGXING_REMOTE_MCP_KEY=lxmcp_key_xxx
LINGXING_AD_AUDIT_SID=7481
LINGXING_AD_AUDIT_COUNTRY=US
LINGXING_AD_AUDIT_START_DATE=2026-03-19
LINGXING_AD_AUDIT_END_DATE=2026-06-16
```

### 可选筛选配置

这些配置为空时表示不过滤。多个值用英文逗号分隔。

| 配置项 | 用途 | 示例 |
| --- | --- | --- |
| `LINGXING_AD_AUDIT_SPONSORED_TYPE` | 只看某些广告类型。 | `SP` 或 `SP,SB` |
| `LINGXING_AD_AUDIT_OPERATE_TYPE` | 只看某些对象层级。 | `campaigns,keywords` |
| `LINGXING_AD_AUDIT_VARIABLE_CODE` | 只看某些变量。 | `BID_AMOUNT,BUDGET_AMOUNT,STATUS` |
| `LINGXING_AD_AUDIT_CHANGE_TYPE` | 只看创建或更新。 | `update` |
| `LINGXING_AD_AUDIT_CAMPAIGN_QUERY` | 广告活动名称模糊搜索。 | `karaoke` |
| `LINGXING_AD_AUDIT_USER_QUERY` | 操作人模糊搜索。 | `亚马逊日志` |

常用变量含义：

| 变量 code | 中文含义 |
| --- | --- |
| `BID_AMOUNT` | 关键词或投放竞价 |
| `BUDGET_AMOUNT` | 广告活动预算 |
| `STATUS` | 状态，例如启用、暂停 |
| `NAME` | 名称 |
| `PLACEMENT_TOP` | 搜索首页顶部加价 |
| `PLACEMENT_REST_OF_SEARCH` | 搜索结果其余位置加价 |
| `PLACEMENT_PRODUCT_PAGE` | 商品页面加价 |

### 输出配置

| 配置项 | 用途 | 默认值 |
| --- | --- | --- |
| `LINGXING_AD_PYTHON` | 可选。如果电脑有多个 Python，用它指定 Python 路径。 | `python` |
| `LINGXING_AD_AUDIT_OUTPUT` | 操作日志 JSON 输出路径。 | `artifacts/lingxing-ad-operation-audit/data/export.json` |
| `LINGXING_AD_IMPACT_OUTPUT` | 效果层日报 JSON 输出路径。 | `artifacts/lingxing-ad-operation-audit/data/performance-context.json` |
| `LINGXING_AD_REPORT_OUTPUT` | 最终 HTML 报告路径。 | `artifacts/lingxing-ad-operation-audit/report.html` |
| `LINGXING_AD_REPORT_TITLE` | HTML 报告标题。 | `领星广告操作日志监控` |
| `LINGXING_AD_REPORT_STORE_LABEL` | 报告页显示的店铺名称。 | `香港奥卡-US (SID 7481)` |

## 一键生成报告

Windows PowerShell 下运行：

```powershell
.\scripts\run_report.ps1
```

也可以通过 npm 入口运行：

```powershell
npm run audit
```

这个脚本会依次做四件事：

1. 检查 `.env` 是否已填写。
2. 如果没有安装依赖，自动执行 `npm install` 和 `python -m pip install -r requirements.txt`。
3. 调用只读 MCP 导出广告操作日志和效果层日报。
4. 生成 HTML 报告。

完成后会显示 HTML 报告路径，例如：

```text
完成。HTML 报告位置：artifacts/lingxing-ad-operation-audit/report.html
```

## 分步运行

如果你想分开执行，可以按下面三步跑。

安装依赖：

```powershell
npm install
python -m pip install -r requirements.txt
```

导出广告操作日志：

```powershell
npm run export:logs
```

导出效果层日报：

```powershell
npm run export:performance
```

生成 HTML 报告：

```powershell
python scripts/build_ad_operation_report.py `
  --input artifacts/lingxing-ad-operation-audit/data/export.json `
  --performance-input artifacts/lingxing-ad-operation-audit/data/performance-context.json `
  --output artifacts/lingxing-ad-operation-audit/report.html `
  --title "领星广告操作日志监控" `
  --store-label "香港奥卡-US (SID 7481)"
```

## 报告怎么看

打开生成的 HTML 后，重点看三块：

- **广告活动趋势**：选择花费、订单、ACOS、CTR、CVR 等指标，观察操作日期前后的变化。
- **筛选明细**：按日期、广告类型、对象类型、广告活动、变量、用户过滤具体操作。
- **效果窗口**：每条操作会展示改前区间和改后区间的日均数据，用于判断调整后表现是否变好。

报告默认会过滤两类分析噪音：

- `无变量明细`：通常表示广告活动、广告组或广告被暂停，没有具体变量变化。
- `是否预算内`：预算状态同步，对分析广告操作收益帮助不大。

## 常见错误

### 401 Unauthorized

通常是 `LINGXING_REMOTE_MCP_KEY` 填错、过期，或复制时漏了一段。请联系管理员重新生成 Key。

### 请求 country 或 sid 超出授权范围

你的 Key 没有这个站点或店铺权限。检查：

- `LINGXING_AD_AUDIT_SID`
- `LINGXING_AD_AUDIT_COUNTRY`
- 管理员给你的授权范围

### 找不到 npm、node 或 python

需要先安装：

- Node.js 18+
- Python 3.10+

如果电脑上装了多个 Python，可以在 `.env` 里指定：

```text
LINGXING_AD_PYTHON=C:\Users\YourName\AppData\Local\Programs\Python\Python312\python.exe
```

### 日期格式错误

日期必须是 `YYYY-MM-DD`，例如：

```text
2026-06-16
```

不要写成 `2026/6/16`、`20260616` 或 `2026-6-16`。

### 报告没有数据

依次检查：

- 日期范围内是否确实有广告操作。
- `SID` 和 `country` 是否正确。
- 是否配置了过窄的筛选项，比如只查某个变量或某个广告活动。

## 安全边界

- 本 skill 只读，不会写入 LingXing。
- 真实 Key 只放在本地 `.env`。
- 生成的 JSON、HTML、截图、CSV、Excel 默认被 `.gitignore` 排除。
- 报告中可能包含经营数据，不要发布到公开仓库。

## 版本记录

见 [CHANGELOG.md](CHANGELOG.md)。
