# Impact 关系图谱

本目录存放 impact 机制的用户可读可视化产物。

生成命令：

```powershell
pnpm skill:impact <skill-id> --visualize --format all
```

默认会生成三类文件：

- `<skill-id>.md`：Markdown + Mermaid 图，适合在仓库或 Obsidian 笔记里阅读。
- `<skill-id>.canvas`：JSON Canvas 图，适合在 Obsidian Canvas 中打开、拖拽和缩放查看。
- `<skill-id>.json`：机器可读图谱数据，适合调试或后续接入其他可视化工具。

事实源仍然是 skill 根目录的 `impact.yaml`。本目录下的图谱是导出视图，用来帮助用户理解关系，不应该手动当作规则源维护。
