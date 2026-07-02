---
title: "impact console productization handoff"
date: 2026-06-23
updated: 2026-06-24
skill: "obsidian-knowledge-curator"
domain: "knowledge-management"
status: pushed
---

# impact console productization handoff

## 交接对象

- Skill：`obsidian-knowledge-curator`
- 业务域：`knowledge-management`
- 当前版本：`0.4.7`
- 源码路径：`skills/knowledge-management/obsidian-knowledge-curator`
- 当前分支：`codex/okc-impact-console-handoff`
- 当前 commit：`60e48fe77038f887dcb4c3203da87d03114d783e`
- 已推 tag：`obsidian-knowledge-curator@0.4.7`
- 远端仓库：`https://github.com/terryxming/nexgaios-skills`

## 当前定位

OKC 现在是 Skill Impact Infrastructure 的试点，不是单纯的事件流工具，也不是普通关系图 demo。

目标已经收敛为：

- 绘制 skill 内所有文件的关系图谱。
- 新增 skill 文件时立即进入图谱。
- Agent 修改或刚修改文件时，在图谱上高亮对应文件。
- 修改完 A 后，依据真实引用、`impact.yaml` 契约和 missing reference 检查上下游文件是否也需要同步修改或审查。
- 最终由 `pnpm skill:impact obsidian-knowledge-curator --strict` 做硬闸门。

## 已完成

- 将 OKC Impact Console 从单文件原生 HTML 迁移为 `Vite + React + TypeScript + Cytoscape.js + D3-force` 前端工程。
- 构建产物继续输出到：
  - `skills/knowledge-management/obsidian-knowledge-curator/impact/console.html`
  - `skills/knowledge-management/obsidian-knowledge-curator/impact/assets/console.js`
  - `skills/knowledge-management/obsidian-knowledge-curator/impact/assets/console.css`
- 默认首屏改为完整 skill 文件关系图谱，而不是任务队列或闭环工作台。
- 左侧改为文件索引，包含变更文件、新增文件、未接入文件和全部文件。
- 右侧改为选中文件后的文件影响检查，列出“需要检查的相关文件”。
- “影响检查”和“缺口视图”已经收敛为同一张图谱上的高亮层/过滤层，不再作为三个割裂视窗。
- 实时 watcher + SSE 增量更新已落地：
  - 新文件 add/remove/update 不销毁整张图。
  - 保留 pan、zoom 和已有节点位置。
  - 新增文件优先从相关邻居附近进入图谱。
  - 删除文件后节点和边会移除。
- 图谱视觉已按 Obsidian-like 手感打磨：
  - D3-force 默认布局，CoSE 可回退。
  - 节点大小按 degree 明显拉开层次，文件大小作为辅助。
  - 标签按 zoom / hover / search / selected 做 LOD。
  - hover 时强淡化非邻居。
  - 状态色只作为边框、光晕或选中叠加层，不把完整图谱染成任务看板。
- 增加 QA dataset 指标：
  - `labelLod`
  - `visibleLabels`
  - `hiddenLabels`
  - `nodeSizeSteps`
  - `hoverMuted`
  - `hoverNeighborNodes`
  - `d3Components`
  - `d3LargestComponent`
  - `addedNodes`
  - `removedElements`
  - `localReheat`
  - `preservedPanZoom`
- 修复 QA 中发现的问题：
  - 初始加载不再把历史 changed 文件误判为最近活动。
  - D3/CoSE 切换按钮补 `data-layout-engine` 和 `aria-pressed`，自动化和可访问性更稳定。
  - 删除临时文件后 `d3LargestComponent` stale 的问题已修复，现在每次写 dataset 时按当前拓扑重算。
  - 构建产物 `console.js` 尾随空格已清理，`git diff --check` 通过。
- 已新增经验卡：
  - `docs/experience/cards/2026-06-23-impact-directory-reference-broken.md`

## 已提交和推送

已提交：

```text
60e48fe feat(okc): add impact graph console infrastructure
```

已推送：

```powershell
git push origin codex/okc-impact-console-handoff
git push origin obsidian-knowledge-curator@0.4.7
```

远端 tag 已确认指向：

```text
60e48fe77038f887dcb4c3203da87d03114d783e refs/tags/obsidian-knowledge-curator@0.4.7
```

## 已运行验证

自动验证：

```powershell
pnpm okc:impact-console:typecheck
pnpm okc:impact-console:build
pnpm skill:validate obsidian-knowledge-curator
pnpm skill:impact obsidian-knowledge-curator --strict
pnpm skills:docs:check
pnpm skills:guard
pnpm skills:validate
git diff --check
git diff --cached --check
```

结果：

- 全部通过。
- `pnpm okc:impact-console:build` 仍有 Vite 单 chunk 超 500KB 提醒，非阻塞。

浏览器真实交互 QA：

- 打开 `http://127.0.0.1:4319/`，控制台加载成功。
- 初始完整图谱：`51` nodes / `162` edges。
- 标签 LOD：
  - 近景 `detail`：`visibleLabels=51`、`hiddenLabels=0`。
  - 远景 `compact`：`visibleLabels=15`、`hiddenLabels=36`。
- hover 节点：
  - 例如 hover 后 `hoverMuted=198`，只突出邻域。
- 点击节点：
  - 例如 `activePathEdges=43`、`triggerEdges=7`，舞台文案切到“已高亮上下游关系”。
- 搜索 `GraphCanvas`：
  - 左侧索引同步过滤到 `GraphCanvas.tsx`。
  - 图谱非命中节点退到背景。
- 图层切换：
  - 完整图谱 / 只看缺口可切换。
- 布局切换：
  - `D3 force` / `CoSE` 可切换，`layoutEngine` dataset 同步变化。
- Fit、重布局、拖动画布、拖拽节点：
  - 画布 pan 正常变化。
  - 拖拽节点释放后 D3 回温，随后停稳。
- 新增/删除临时文件：
  - 新增 `impact-console-qa-temp.md` 后：`51/162 -> 52/163`，`addedNodes=1`、`localReheat=true`、`preservedPanZoom=true`。
  - 删除后回到：`51/162`，`removedElements=2`，`d3LargestComponent=51`。
- 浏览器 console：
  - 无 error/warn。
- 临时 QA 文件已删除，没有残留。

## 回家电脑恢复步骤

```powershell
cd <本机 nexgaios-skills 仓库路径>
git fetch origin --tags
git switch codex/okc-impact-console-handoff
git pull --ff-only origin codex/okc-impact-console-handoff
pnpm install --frozen-lockfile
pnpm handoff:list obsidian-knowledge-curator
```

确认当前 commit：

```powershell
git log -1 --oneline
git rev-parse obsidian-knowledge-curator@0.4.7
```

期望都指向 `60e48fe...`。

启动本地控制台：

```powershell
pnpm skill:impact:watch obsidian-knowledge-curator
```

浏览器打开命令输出的本地地址，通常是：

```text
http://127.0.0.1:4319/
```

## 下一步建议

短期不要急着抽 MCP 或通用包。先继续把 OKC 试点打稳：

- 再做一轮产品视角 QA：默认图谱密度、标签显示、节点间距、侧栏信息是否足够高级和好理解。
- 检查完整图谱是否能承担“影响检查 + 缺口过滤”的全部职责，避免重新退化成多视窗工具。
- 继续真实模拟 Agent 修改 skill 文件时的场景：
  - 改 `SKILL.md`
  - 改 `impact.yaml`
  - 改 `impact-console/src/components/GraphCanvas.tsx`
  - 新增一个无引用文件
  - 新增一个引用 README 的文件
- 继续思考未来形态：
  - CLI/engine 是硬底座。
  - MCP 是 Agent 查询接口。
  - skill/AGENTS 是行为约束。
  - UI 是用户理解和监督层。

## 当前工作区注意事项

- 已提交并推送 OKC impact console 相关改动。
- 当前本机仍有一个非本次任务的未跟踪文件，未提交：

```text
docs/experience/cards/2026-06-23-lingxing-aws-mcp-protocol-version.md
```

不要在回家电脑上误以为这是本次 OKC 任务必需文件。

## 本机 Codex 安装同步状态

本次只是源码仓库和 GitHub 分支/tag 更新，不代表已经同步到本机 Codex 安装目录。

如果需要把 OKC 同步到当前电脑的 Codex 安装目录，必须用户明确同意后再运行：

```powershell
pnpm skill:install obsidian-knowledge-curator
```
