# 安全策略

## 支持版本

| Version | Status |
| --- | --- |
| `v0.1.2` | Supported |

## 密钥处理

不要提交或发布以下内容：

- `LINGXING_REMOTE_MCP_KEY`
- 完整 `X-Mcp-Key`
- 领星 App ID 或 AppSecret
- 导出的 JSON 数据
- 包含经营数据的 HTML 报告
- 暴露敏感经营数据的截图

请使用 `.env.example` 作为模板，并只在本地保存真实 `.env` 文件。

## 报告安全问题

报告问题时只提供 Key ID，不要提供完整 Key。尽量同时提供客户端、发生时间、预期授权范围、实际表现和工具名。
