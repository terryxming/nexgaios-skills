# OKC Impact Console

这个目录存放 `obsidian-knowledge-curator` 自身的 impact 治理可视化资产。控制台的产品定位是“文件关系图谱 + 实时修改监控 + 影响链路检查”基础设施试点：先让用户看清 skill 内所有文件如何关联，再让 Agent 修改 A 时及时检查上下游是否还需要同步修改。

启动实时控制台：

```powershell
pnpm skill:impact:watch obsidian-knowledge-curator
```

打开命令输出的本地地址后，控制台会从同一个 impact 引擎读取状态：

- `source -> contract -> witness` 契约链路。
- Markdown/YAML 中识别出的本地文件引用链路。
- 当前工作区变更、strict 失败、孤儿文件、断裂引用和待处理 witness。

0.4.6 起，控制台由 `impact-console/` 中的 `Vite + React + TypeScript + Cytoscape.js` 前端工程构建到本目录。后端 watcher、`/api/state` 和 `/events` 数据协议保持不变。

0.4.7 起优先尝试 D3-force 作为关系图谱的默认物理布局引擎：Cytoscape.js 继续负责画布渲染、节点事件、hover/选中和样式层，D3-force 负责力导向布局、节点碰撞、拖拽释放后的轻量回温，以及 SSE 新增节点后的局部物理响应。工具栏保留 `CoSE` 回退开关，用于和旧布局手感做真实对比。

构建控制台前端：

```powershell
pnpm okc:impact-console:typecheck
pnpm okc:impact-console:build
```

控制台使用 Cytoscape.js 图谱引擎。v0.3 的核心界面是一张文件关系图谱：

- 完整图谱：默认显示 skill 内全部文件节点，关系来自真实引用、`impact.yaml` 契约和 missing reference。
- Obsidian-like 视觉手感：文件名短标签按缩放、hover、搜索和选中状态做 LOD 显示，节点大小更明显地参考连接度并辅以文件大小，普通关系保持灰阶轻量，历史变更只作为不抢主图的监控叠加层。
- 实时修改监控：正在修改或刚修改的文件节点高亮，已修改文件保留状态标识但不抢占全图。
- 实时拓扑更新：Cytoscape 实例保持常驻，SSE 新状态通过元素 diff 增量 add/remove/update，同步时保留 pan、zoom 和已有节点位置；新增文件优先从相关邻居附近进入图谱，无关系文件进入外围未接入区。
- D3 物理布局：默认使用 D3-force 的 link、charge、collision 和 x/y 目标力组合；布局前先按真实关系计算连通分量，并调低无关排斥、加强主契约链路和节点碰撞，让核心簇更紧、弱连接更轻、孤立节点各自有稳定区域。
- 局部物理响应：新增节点进入后对当前图谱做轻量 reheat，保持 pan、zoom，不因单个文件变化洗牌整张图；CoSE 回退模式下仍只对新增节点邻域 reheat。
- 选中文件影响检查：点击或搜索文件 A 后，同一张图谱高亮 A 的上下游，右侧列出需要检查的相关文件。
- 缺口图层：在同一张图谱中过滤 witness pending、orphan、broken reference、version pending 等 strict gate 会处理的对象。
- 文件影响检查面板：右侧回答为什么相关、是否已修改/已审查、是否仍需处理。

新文件必须立即出现在图中；如果还没有真实引用或 `impact.yaml` 契约关系，控制台会把它显示为未接入节点，避免它成为无人检查的孤儿文件。

基础手感仍然保留图谱产品应有的拖动画布、滚轮缩放、拖拽节点、hover 邻域淡化、Fit、重布局、搜索、契约筛选和关系筛选。视觉上保持 Obsidian-like 的低噪声灰阶图谱：远景只显示 hub 和状态关键标签，近景逐步显示全部文件名；默认节点和边不抢色，状态色只作为边框、光晕或选中叠加层出现，hover/搜索/选中时再增强标签和上下游关系。交付前必须模拟真实用户操作确认画布不会抖动、不会周期性重排、SSE 增量更新不会丢失视口位置、浏览器 console 无 error/warn。

控制台只解释状态，不自动修改 skill 文件。最终硬闸门仍然是：

```powershell
pnpm skill:impact obsidian-knowledge-curator --strict
```
