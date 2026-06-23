# Obsidian Knowledge Curator

## 用途

这个 skill 帮助 Codex 将踩坑、决策、知识点、复盘、想法、讨论、偏好和任务交接整理成可读、可复用、适合长期沉淀的 Obsidian / Markdown 笔记，也支持维护 skill 项目母文档和制作经过验收的 Obsidian 美化版。

它重点解决的问题是：Agent 回写的 `.md` 文件容易变成流水账、空泛总结、格式堆叠或只给 Agent 自己看的操作记录。

## 使用方式

```text
当需要把有价值的信息整理、改写、沉淀或回写到 Obsidian / Markdown 知识库时，让 Codex 使用 obsidian-knowledge-curator。
```

## 目录说明

```text
SKILL.md          skill 入口说明
skill.yaml        monorepo 管理协议
references/       任务相关参考资料
scripts/          可执行脚本
assets/           可复用资产
tests/            测试样例和夹具
impact/           impact 实时控制台前端资产
impact-console/   impact 控制台 React/Vite 前端源码
CHANGELOG.md      版本变更记录
impact.yaml       文件级影响链路契约
```

## 开发命令

```powershell
pnpm skill:validate obsidian-knowledge-curator
pnpm okc:impact-console:typecheck
pnpm okc:impact-console:build
pnpm skill:impact obsidian-knowledge-curator --strict
pnpm skill:impact:watch obsidian-knowledge-curator
pnpm skill:package obsidian-knowledge-curator --print-path
```

同步到本机 Codex 安装目录前必须先获得用户明确确认，然后才运行：

```powershell
pnpm skill:install obsidian-knowledge-curator
```

## 验证边界

`pnpm skill:new` 和 `pnpm skill:validate` 只能证明目录和协议正确，不证明这个 skill 的信息治理能力已经好用。

业务能力需要继续用真实 prompt、反例、误触发、输出契约、长文保真度和 forward-test 验证。

0.4.3 起新增 impact 硬自动化试点：

- `impact.yaml` 定义 OKC 文件级影响链路契约，覆盖入口规则、reference 路由、母文档规则、视觉样本、测试验证和 impact 规则自身。
- PR 中修改契约源文件时，关联 witness 文件必须同步修改；若确认无需修改，必须在 `docs/impact-reviews/obsidian-knowledge-curator/` 新增机器可读审查回执。
- 仓库级 CI 运行 `pnpm skills:impact --base <range> --strict`，检查不过不得合并。

0.4.4 起新增 impact 实时控制台试点：

- `impact/console.html` 是随 OKC skill 分发的本地前端资产，用 `pnpm skill:impact:watch obsidian-knowledge-curator` 启动后查看。
- 控制台只展示实时变更、契约链路、断裂引用、孤儿文件和待处理 witness，不自动改文件。
- 控制台状态必须来自同一套 impact 引擎；最终硬闸门仍然是 `pnpm skill:impact obsidian-knowledge-curator --strict`。

0.4.5 起，控制台升级为 Cytoscape.js 驱动的动态图谱工作台：

- 支持拖动画布、滚轮缩放、拖拽节点、点击节点聚焦邻居、Fit 和重布局。
- 支持搜索、契约筛选、关系筛选；早期的多视角模型已在 0.4.7 收敛为单一文件关系图谱。
- 允许在线加载成熟图谱库，不再把离线静态 HTML 当作产品目标。

0.4.6 起，控制台前端工程化为 `Vite + React + TypeScript + Cytoscape.js`：

- `impact-console/` 保存可维护源码，React 负责面板、筛选和状态，Cytoscape.js 继续负责关系图渲染和交互。
- `pnpm okc:impact-console:build` 将前端构建到 `impact/console.html`、`impact/assets/console.js` 和 `impact/assets/console.css`，watcher 继续使用同一个本地 URL。
- 后端 watcher、`/api/state` 和 `/events` 数据协议保持不变，避免把框架迁移和 impact 引擎改造混在一起。

0.4.7 起，控制台产品目标改准为文件关系图谱基础设施试点：

- 第一屏默认显示 skill 内所有文件节点，关系来自真实引用、`impact.yaml` 契约和 missing reference。
- 左侧是文件索引，按全部文件、变更文件、新增文件和未接入文件辅助定位。
- 正在修改或刚修改的文件节点会在图谱中高亮；新增文件必须立即进入图谱，无关系时显示为未接入。
- “影响检查”不是独立视窗；点击或搜索某个文件后，完整图谱直接高亮它的上下游，右侧只解释需要检查的相关文件、相关原因、修改/审查状态和剩余处理动作。
- “缺口”不是独立视窗；工具栏只提供缺口图层，用同一张图谱过滤 strict gate 会关注的 pending、orphan、missing 和 broken reference。
- 默认优先尝试 D3-force 物理布局，Cytoscape.js 继续负责图谱渲染和交互；工具栏保留 CoSE 回退，用于持续比较 Obsidian-like 流体手感。
- D3 布局会按连通分量稳定分群，核心簇、卫星簇和孤立节点各自有位置；默认视觉保持灰阶低噪声，状态色只作为边框、光晕和选中叠加层。
- 验收口径：Agent 修改一个文件时，用户应先看清完整文件网络，再能快速判断它的上下游依赖是否也需要同步修改。

0.4.2 起新增执行闭环边界：

- 修改 skill 源码、规则、reference、模板、样本、测试、版本或安装状态时，必须读取 `references/project-memory.md`，检查项目母文档是否需要同步维护。
- 项目迭代标题使用 `状态符号 ITER-XXXX | YYYY-MM-DD HH:mm | 标题`；状态符号必须由关联未闭环事项反推。
- 通用笔记骨架和网页/长文/报告骨架分开维护，不得把网页元数据或原文结构覆盖表强加到普通笔记。
- 测试矩阵必须覆盖三表强绑定、已闭环事项归档和 skill 修改后的母文档检查。

0.4.1 起新增项目治理边界：

- 项目迭代时间轴、已确认决策清单和当前未闭环事项是同一事件的三种投影；修改任意一处必须同步核对另外两处。
- 当前未闭环事项只保留未闭环、持续中或等待确认事项；已闭环事项回到时间轴记录。
- skill 修改后必须检查项目母文档中的项目元信息、当前能力、迭代时间轴、决策清单、当前未闭环事项和后续工作建议。

0.3.0 起新增母文档维护边界：

- 维护 skill 项目母文档时，必须包含项目元信息、项目架构、项目边界、项目迭代时间轴、决策索引、未闭环事项和带冻结编号的 workflow。
- 母文档路径或文件不存在时，不得自动创建，必须先询问用户。

0.4.0 起新增视觉版式执行边界：

- 制作 Obsidian 美化版时，必须读取 `references/obsidian-visual-patterns.md`，不能只靠抽象审美规则。
- CSS snippet 必须限定作用域，并验证图标、Mermaid、表格等关键渲染结果。
- 可复制样本位于 `assets/okc-showcase-template.md` 和 `assets/okc-showcase-snippet.css`；样本用于参考，不得把样本说明原样塞进用户笔记。

0.2.0 起新增两条维护边界：

- 修改行为规则、输出契约、评测标准或安全边界时，必须同步更新 `skill.yaml` 版本和 `CHANGELOG.md`。
- 网页、博客、报告等长文 raw 沉淀默认不是摘要任务，必须保留原文主干，并给出原文结构覆盖表。
