---
title: "impact console productization handoff"
date: 2026-06-23
skill: "obsidian-knowledge-curator"
domain: "knowledge-management"
status: draft
---

# impact console productization handoff

## 交接对象

- Skill：`obsidian-knowledge-curator`
- 业务域：`knowledge-management`
- 当前版本：`0.4.5`
- 源码路径：`skills/knowledge-management/obsidian-knowledge-curator`
- 当前分支：`codex/okc-impact-console-handoff`
- 当前 commit：`f55561b`（提交后已记录；如果看到更新的 amend commit，以分支最新 HEAD 为准）

## 当前目标

为 `obsidian-knowledge-curator` 试点落地 Skill Impact 机制：

- 用 `impact.yaml` 和动态图谱解决“改了 A，但忘了 B 也要同步维护”的问题。
- 把影响检查从人工提示升级为可验证的 strict gate。
- 把图谱从离线静态产物升级为可打开、可搜索、可点击、可实时刷新的前端控制台。
- 继续把控制台打磨成真正给团队活动使用的产品界面，而不是调试图。

## 已完成

- 新增通用 impact 引擎：`tools/skills/impact-graph.mjs`。
- 在 `tools/skills/skill-cli.mjs` 接入：
  - `pnpm skill:impact <skill-id> --strict`
  - `pnpm skills:impact --strict`
  - `pnpm skill:impact:watch <skill-id>`
- 在 `package.json` 和 PR workflow 中接入 impact 检查。
- 为 OKC 新增 `impact.yaml`，覆盖 skill entry、reference system、project memory、visual showcase、validation、impact governance、impact console 等契约组。
- 为 OKC 新增 `impact/console.html`，通过本地 HTTP server + SSE + Cytoscape.js 展示实时影响图谱。
- 控制台已做一轮真实 Chrome 交互 QA：
  - 默认视图改为“一跳影响链路”，source、contract、witness 分区展示。
  - “风险优先”没有 pending/missing/orphan/failing 时显示空状态。
  - 搜索联动左侧队列和右侧节点工作台。
  - 左侧点击文件会清掉搜索并回到该文件的一跳影响链路。
  - 修复左侧点击后只居中单个节点导致链路挤出画布的问题。
  - 修复 source/witness/mentions 布局优先级冲突。
  - 过滤与契约主边重复的 mention 边，减少噪音。
- 浏览器确认 Cytoscape 实例可用：pan、zoom、drag 都已开启。
- 经验卡片已记录：`docs/experience/cards/2026-06-23-skill-impact-hard-gate.md`。
- 已清理浏览器 QA 产生的 `tmp-impact*.png` 临时截图。

## 未完成和下一步

- 到公司电脑后先拉取并切换本分支，继续从产品体验角度做第二轮 UI/UX：
  - 检查中文标签字号、节点间距、搜索结果密度是否足够商业化。
  - 继续优化“全部图谱”视角，它现在更像诊断视图，不应作为主工作流。
  - 考虑是否把 `impact/console.html` 从单文件原生 HTML 迁移为 `Vite + React + Cytoscape.js`，以便后续组件化、快捷键、命令面板、审查任务流。
  - 继续设计真正的实时状态：新增/修改/检查中文件时，节点可以出现 processing、changed、needs-review、reviewed 等状态。
  - 决定是否把成熟后的机制推广到其他 skill 模板和 `pnpm skill:new` 生成骨架。
- 如果要继续推进到 main，建议先开 Draft PR，而不是直接推 main，避免半成品触发发布链路。

## 当前阻塞或风险

- 当前分支包含一批较大的仓库级改动和一个完整新增 OKC skill 目录，提交前后都要注意只处理本任务相关文件。
- `impact/console.html` 目前是原生 HTML/CSS/JS + Cytoscape.js CDN，不是 React/Vue 工程化前端；短期便于 skill 目录内分发，长期复杂产品能力会变重。
- `skills/knowledge-management/obsidian-knowledge-curator` 是新目录，当前在 git 中仍属于未跟踪目录；本次提交会把它整体纳入版本库。
- 本次只是源码仓库更新，不代表已经同步到本机 Codex 安装目录。

## 需要继续查看的文件

- `skills/knowledge-management/obsidian-knowledge-curator/SKILL.md`
- `skills/knowledge-management/obsidian-knowledge-curator/impact.yaml`
- `skills/knowledge-management/obsidian-knowledge-curator/impact/console.html`
- `skills/knowledge-management/obsidian-knowledge-curator/scripts/validate_okc_contract.py`
- `tools/skills/impact-graph.mjs`
- `tools/skills/skill-cli.mjs`
- `docs/skill-impact-console-prd-v0.1.md`
- `docs/experience/cards/2026-06-23-skill-impact-hard-gate.md`

## 已运行验证

- `node tools/skills/skill-cli.mjs env-check`：通过，Node/Git/Python/pnpm/GitHub CLI 均可用。
- `pnpm install --frozen-lockfile`：通过，依赖已是最新。
- `node --check tools\skills\impact-graph.mjs`：通过。
- `node --check tools\skills\skill-cli.mjs`：通过。
- `pnpm skill:validate obsidian-knowledge-curator`：通过，`okc contract checks passed`。
- `pnpm skills:impact --strict`：通过。
- `pnpm skills:docs:check`：通过。
- `pnpm skills:validate`：通过。
- `pnpm skills:guard`：最终通过。
- `Invoke-WebRequest http://127.0.0.1:4319/api/state`：返回 `200`。
- Chrome DevTools 浏览器检查：
  - 打开 `http://127.0.0.1:4319/`。
  - 点击“风险优先”，无风险时显示空状态。
  - 搜索 `impact`，左侧队列缩到 `3/23 items`，图谱缩到 10 个节点，右侧工作台切到命中节点。
  - 点击左侧 `impact/console.html`，回到该文件一跳影响链路。
  - 浏览器中读取 Cytoscape 状态：`panning=true`、`zooming=true`、节点 `grabbable=true`。

## 工作区状态

```text
M .github/workflows/pr-validate.yml
 M AGENTS.md
 M README.md
 M catalog.yaml
 M docs/experience/cards/2026-06-17-repository-guide-obsidian-mirror.md
 M docs/experience/index.md
 M docs/multi-computer-workflow.md
 M docs/repository-guide.md
 M docs/skill-protocol.md
 M docs/skills-overview.md
 M package.json
 M skill.cmd
 M skill.ps1
 M templates/skill/README.md
 M tools/skills/skill-cli.mjs
?? CONTEXT.md
?? docs/experience/cards/2026-06-20-env-check-before-install.md
?? docs/experience/cards/2026-06-23-skill-impact-hard-gate.md
?? docs/impact-graphs/
?? docs/impact-reviews/
?? docs/intelligence-system-v0.1-design-notes.md
?? docs/skill-impact-console-prd-v0.1.md
?? skills/knowledge-management/
?? templates/skill/impact.yaml
?? tools/skills/impact-graph.mjs
```

## 下台电脑恢复步骤

```powershell
cd <本机 nexgaios-skills 仓库路径>
git fetch origin
git switch codex/okc-impact-console-handoff
git pull --ff-only origin codex/okc-impact-console-handoff
pnpm install --frozen-lockfile
pnpm handoff:list obsidian-knowledge-curator
```

继续工作前，先阅读本交接文档，再打开：

```powershell
pnpm skill:impact:watch obsidian-knowledge-curator
```

然后在浏览器访问本地控制台，继续按真实用户路径测试。

## 本机 Codex 安装同步状态

本次交接不代表已经同步到本机 Codex 安装目录。

如果修改过 `skills/<domain>/<skill-id>/`，完成验证后必须显式询问用户是否要同步到本机 Codex 安装目录；只有用户明确同意后，才运行：

```powershell
pnpm skill:install obsidian-knowledge-curator
```
