---
title: "领星 AWS stdio MCP 直连时注意协议版本"
date: 2026-06-23
domain: "amazon"
tags: "lingxing, mcp, aws, stdio, protocol, windows"
status: active
---

# 领星 AWS stdio MCP 直连时注意协议版本

## 触发场景

需要在本地脚本中复用 Codex 已注册的 `LingXing-Readonly-AWS` MCP，而不是通过 Codex 工具面板直接调用时，先阅读本卡片。

典型场景：

- `lingxing-ad-operation-audit` 需要把 AWS MCP 的返回完整落地为 JSON/HTML 报告。
- 本地 skill 目录没有 `.env` 或 `LINGXING_REMOTE_MCP_KEY`，但 `C:\Users\<user>\.codex\config.toml` 已注册 `LingXing-Readonly-AWS`。
- 用本地 `@modelcontextprotocol/sdk` 的 `StdioClientTransport` 连接 AWS MCP 时连接立即关闭。

## 症状

- SSH 本身可连通，远端命令也能执行：

  ```powershell
  ssh -i "<pem>" ec2-user@<host> "cd /home/ec2-user/lingxing-readonly-mcp && pwd && node --version"
  ```

- 但本地 MCP SDK 客户端连接时报错：

  ```text
  MCP error -32000: Connection closed
  ```

- `transport.onerror` 无明显 stderr，`transport.onclose` 在 `client.connect()` 阶段触发。
- 手写 `Content-Length` MCP 帧没有响应；手写“每行一个 JSON-RPC”的 stdio 帧可以收到 `initialize` 响应。

## 根因

- 当前仓库解析到的 `@modelcontextprotocol/sdk` 版本可能比远端 `lingxing-readonly-mcp` 服务更新。
- 2026-06-23 验证时，本地 SDK 发出的初始化参数为：

  ```json
  {"protocolVersion":"2025-11-25"}
  ```

- 远端 `lingxing-readonly-mcp` 版本为 `0.1.2`，手写 `protocolVersion: "2025-06-18"` 可以成功初始化。
- 该 SDK 版本的 stdio 传输格式是“每行一个 JSON-RPC”，不是 `Content-Length` 帧。

## 解法

1. 先从 `C:\Users\<user>\.codex\config.toml` 读取 `LingXing-Readonly-AWS` 的 `command` / `args`，不要打印或复制任何密钥内容。
2. 如果本地 SDK `StdioClientTransport` 连接即关闭，改用轻量 line-delimited JSON-RPC 客户端，初始化时指定兼容协议：

   ```json
   {
     "jsonrpc": "2.0",
     "id": 1,
     "method": "initialize",
     "params": {
       "protocolVersion": "2025-06-18",
       "capabilities": {},
       "clientInfo": {
         "name": "local-script",
         "version": "0.1"
       }
     }
   }
   ```

3. 初始化成功后发送：

   ```json
   {"jsonrpc":"2.0","method":"notifications/initialized","params":{}}
   ```

4. 再调用标准 MCP 方法：

   ```json
   {"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}
   {"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"lingxing_ad_operation_log_scan","arguments":{}}}
   ```

5. 用 `tools/list` 验证可见工具包含 `lingxing_ad_operation_log_scan` 和 `lingxing_ad_report`。

## 适用边界

- 适用于通过 SSH stdio 方式连接 `LingXing-Readonly-AWS` 的本地一次性导出或调试脚本。
- 不适用于 Codex 当前线程里已经暴露的 `mcp__LingXing_Readonly_AWS.*` 工具；那些工具由 Codex App 负责连接，不需要本地脚本处理协议版本。
- 不等同于建议长期手写 MCP 客户端。长期方案应考虑让 skill 脚本显式支持已注册 stdio MCP，或约束本地 SDK 与远端 MCP 服务的协议兼容版本。
- 不要把 SSH pem、`X-Mcp-Key`、App ID、AppSecret 写入经验卡、报告或仓库文件。

## 验证记录

- 日期：2026-06-23
- 验证命令：

  ```powershell
  ssh -i "<pem>" ec2-user@<host> "cd /home/ec2-user/lingxing-readonly-mcp && pwd && node --version"
  ```

  ```text
  /home/ec2-user/lingxing-readonly-mcp
  v18.20.8
  ```

  手写 line-delimited JSON-RPC 初始化：

  ```json
  {"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"manual","version":"0.1"}}}
  ```

- 结果：
  - 远端返回 `serverInfo.name = lingxing-readonly-mcp`、`version = 0.1.2`。
  - `tools/list` 返回 `lingxing_ad_report`、`lingxing_ad_operation_log_scan` 等工具。
  - 使用该方式成功导出香港奥卡 US 站 `2026-05-25` 至 `2026-06-23` 广告操作日志 4800 条，并生成 HTML 审计报告。
