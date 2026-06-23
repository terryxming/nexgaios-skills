# 脚本

本目录用于存放 `obsidian-knowledge-curator` 的可执行脚本。

维护要求：

- 脚本必须可以从 skill 根目录运行。
- 需要外部密钥时，只读取 `.env` 或环境变量，不在代码中写入密钥。
- 生成文件默认写入本地 `artifacts/`，不要提交生成产物。
- `validate_okc_contract.py` 用于检查本 skill 的关键执行口径是否漂移，例如三表强绑定、状态符号、母文档同步检查、版式骨架边界，以及 Impact Console 的 React/Vite 源码、构建入口、SSE 和 Cytoscape 交互契约。
