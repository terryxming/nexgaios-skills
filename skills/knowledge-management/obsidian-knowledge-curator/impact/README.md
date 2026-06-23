# OKC Impact Console

这个目录存放 `obsidian-knowledge-curator` 自身的 impact 治理可视化资产。

启动实时控制台：

```powershell
pnpm skill:impact:watch obsidian-knowledge-curator
```

打开命令输出的本地地址后，控制台会从同一个 impact 引擎读取状态：

- `source -> contract -> witness` 契约链路。
- Markdown/YAML 中识别出的本地文件引用链路。
- 当前工作区变更、strict 失败、孤儿文件、断裂引用和待处理 witness。

0.4.5 起，控制台使用 Cytoscape.js 图谱引擎并允许在线加载成熟前端依赖。核心交互包括：

- 拖动画布。
- 滚轮缩放。
- 拖拽节点。
- 点击节点聚焦上下游邻居。
- Fit、重布局、搜索、契约筛选和关系筛选。

控制台只解释状态，不自动修改 skill 文件。最终硬闸门仍然是：

```powershell
pnpm skill:impact obsidian-knowledge-curator --strict
```
