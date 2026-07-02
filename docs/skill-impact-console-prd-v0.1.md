# Skill Impact Console PRD v0.1

日期：2026-06-23

## Problem Statement

在使用 Agent 编写和维护 Codex skill 时，随着 skill 内文件数量增加，维护者经常会遇到隐性依赖遗忘问题：

- 改了入口规则，却忘记同步测试矩阵。
- 改了 reference 文件，却忘记同步 `SKILL.md` 的渐进式披露路由。
- 改了输出契约，却忘记更新版本、CHANGELOG、样本或验证脚本。
- 新增文件后，没有进入任何契约组、引用链或验证范围，变成长期无人维护的孤儿文件。

这些问题不会立即表现为语法错误，但会导致 skill 的执行口径前后不一致、契约规则和真实能力断节、Agent 未来调用时读到互相冲突的规则。

当前已经有 impact 硬检查机制，可以在 CI 或本地 strict 模式中拦截一部分遗漏。但 CLI 输出和静态导出图谱主要服务 Agent 和维护者的事后检查，不足以支撑团队活动、实时开发观察和用户理解。

因此需要一个真正实时的 Skill Impact Console，让用户在 Agent 修改 skill 文件的过程中，看见当前文件变更、影响链路、契约断点、待处理 witness 和审查回执状态。

## Solution

建设一个随 skill 一起分发的实时 HTML 控制台。

它不是泛知识图谱，也不是普通代码依赖图，而是围绕 skill 维护契约工作的实时治理视图。

核心能力：

1. 监听某个 skill 目录的文件新增、修改和删除。
2. 动态重建 impact 图谱。
3. 在前端图谱中实时标记节点状态。
4. 展示每个变更触发了哪些契约组。
5. 展示哪些 witness 已同步、哪些还缺修改或审查回执。
6. 对新增但未覆盖的文件显示孤儿节点风险。
7. 保证控制台展示的失败原因与 strict impact 检查一致。

推荐启动方式：

```powershell
pnpm skill:impact:watch <skill-id>
```

该命令启动本地 watcher 和 HTTP server。用户打开浏览器后可以看到实时控制台。

推荐产物放在 skill 自身目录下的 `impact/` 子目录中，作为该 skill 的开发治理资产，而不是放在仓库级 docs 导出目录中。

## User Stories

1. 作为 skill 作者，我想在 Agent 修改 `SKILL.md` 时立即看到受影响的 reference、测试、版本和样本节点，从而不会只改入口规则却漏掉后续维护项。

2. 作为 skill 作者，我想看到新增文件是否已经被契约组或引用链覆盖，从而防止新文件成为无人维护的孤儿文件。

3. 作为 skill 作者，我想点击一个变更文件后看到它属于哪些契约组，从而理解为什么它会触发这些 witness。

4. 作为 skill 作者，我想看到每个 witness 的状态是已修改、已审查、待处理还是不适用，从而快速完成闭环。

5. 作为 skill 作者，我想在补写审查回执后看到节点状态自动恢复，从而确认 strict 检查可以通过。

6. 作为 skill 作者，我想看到 broken reference 节点，从而知道某个 Markdown 路由或命令引用指向了不存在的文件。

7. 作为团队成员，我想打开某个 skill 的控制台，理解这个 skill 的文件结构和维护契约，而不是先读一堆 YAML 和 CLI 输出。

8. 作为团队成员，我想通过图谱看懂 CI 为什么失败，从而能判断是需要改文件，还是只需要补审查回执。

9. 作为 reviewer，我想看到本次变更触发了哪些契约组和待处理项，从而减少人工 review 中的记忆负担。

10. 作为 Agent，我想让控制台和 CLI 使用同一套图谱计算结果，从而避免人看的图和机器拦截规则不一致。

11. 作为仓库维护者，我想先在 `obsidian-knowledge-curator` 上试点，等机制稳定后再推广到其他 skill 和新建 skill。

12. 作为未来的新 skill 作者，我想新建 skill 时默认获得 impact 控制台能力，从而从第一天就按可治理结构维护。

13. 作为用户，我想在团队活动中展示某个 skill 的实时维护图谱，从而讲清楚 skill 开发为什么需要契约和 witness。

14. 作为用户，我想控制台只聚焦“改 A 是否影响 B”，而不是变成宽泛的 Obsidian 知识图谱。

15. 作为用户，我想看到当前 strict 检查是否通过，从而知道这次 skill 修改是否已经治理闭环。

## Implementation Decisions

- 控制台必须以现有 impact 引擎为唯一事实源，不能复制一套独立规则。

- 运行时应分为两层：
  - 后端 watcher：监听 skill 文件变化、读取 git 状态、重建 impact graph、运行 strict 诊断。
  - 前端 console：渲染图谱、节点状态、契约详情和待处理清单。

- 后端应通过本地 HTTP server 提供控制台页面和图谱数据。

- 实时推送优先使用 Server-Sent Events 或 WebSocket。MVP 可以先使用 SSE，因为它足以完成单向状态推送，复杂度低。

- 前端 HTML 应随 skill 一起分发，放在 skill 自身的 impact 资产目录。

- 控制台需要显示两类关系：
  - 契约关系：source -> contract -> witness。
  - 自动引用关系：文件 -> 被引用文件。

- 图谱节点至少分为：
  - file。
  - contract。
  - review。
  - missing。
  - check-result。

- 文件节点至少支持以下状态：
  - clean。
  - changed。
  - added。
  - deleted。
  - orphan。
  - source-changed。
  - witness-pending。
  - reviewed。
  - updated。
  - broken-reference。

- 控制台主界面应该由四个区域组成：
  - 中央关系图谱。
  - 左侧当前变更列表。
  - 右侧节点详情。
  - 底部或侧边待处理清单。

- 控制台必须提供筛选：
  - 只看当前变更。
  - 只看失败链路。
  - 只看孤儿文件。
  - 只看某个契约组。
  - 只看 source/witness 关系。

- 控制台不负责自动修改文件，也不负责自动生成审查回执。它只负责展示状态、原因和下一步建议。

- strict 检查仍然是最终硬闸门。控制台是实时解释层，不替代 CI。

- MVP 只支持单个 skill 目录。多 skill 总览可以后续扩展。

- 首个试点 skill 是 `obsidian-knowledge-curator`。

## Interaction Model

### 启动

用户运行 watch 命令后，终端输出本地地址。浏览器打开后显示当前 skill 的实时 impact 控制台。

### 文件变化

当文件被 Agent 或用户修改时：

1. watcher 捕获变化。
2. debounce 一小段时间，避免连续保存导致抖动。
3. 重新计算 graph 和 strict diagnostics。
4. 前端收到新状态。
5. 对应节点更新颜色、标签和待处理项。

### 点击节点

点击文件节点时，右侧展示：

- 文件路径。
- 当前状态。
- 所属契约组。
- 作为 source 时影响哪些 witness。
- 作为 witness 时响应哪些 source。
- 是否已被自动引用图覆盖。
- 当前失败原因。
- 建议动作。

点击契约节点时，右侧展示：

- 契约说明。
- sources。
- witnesses。
- require 规则。
- 当前命中的变更。
- 当前未闭环 witness。

### 待处理清单

待处理清单按风险排序：

1. broken reference。
2. orphan file。
3. witness pending。
4. version or changelog pending。
5. review receipt needed。

每条待处理项必须解释：

- 哪个文件触发。
- 触发了哪个契约。
- 哪个 witness 缺口。
- 为什么需要处理。
- 可选动作是什么。

## MVP Acceptance Criteria

1. 能通过一个命令启动 OKC 的实时控制台。

2. 打开控制台后，能看到 OKC 的文件节点和契约节点。

3. 修改 `SKILL.md` 后，1-2 秒内对应节点显示 changed/source-changed。

4. 修改 `SKILL.md` 后，相关 witness 显示 pending，且待处理清单说明缺口。

5. 修改对应 witness 后，pending 状态自动减少或消失。

6. 新增一个未被引用、未被契约覆盖的文件后，该文件显示为 orphan。

7. 删除或写错一个被 Markdown 引用的文件后，显示 broken reference。

8. 新增有效审查回执后，相关 witness 显示 reviewed。

9. 控制台展示的失败数量和 CLI strict 检查一致。

10. 关闭 server 后，不留下后台进程。

11. 前端可以联网加载成熟商业化图谱前端依赖；控制台业务状态仍必须来自本地 impact 引擎和 watcher。

12. 控制台可以在 Windows 本地开发环境稳定运行。

13. 图谱必须支持商业化关系图谱基础交互：拖动画布、滚轮缩放、拖拽节点、点击节点聚焦上下游邻居、Fit、重布局、搜索和筛选。

## Testing Decisions

- 测试优先覆盖外部行为：给定文件变化和 impact 规则，控制台 graph state 应发生可预期变化。

- 后端 watcher 测试关注：
  - 初始图谱构建。
  - 文件新增。
  - 文件修改。
  - 文件删除。
  - debounce 后只推送稳定状态。
  - strict diagnostics 与 CLI 一致。

- 图谱状态测试关注：
  - source-changed 触发 witness-pending。
  - review receipt 关闭 pending。
  - orphan file 识别。
  - broken reference 识别。

- 前端测试可以先用轻量静态验证：
  - HTML 文件存在。
  - 本地 graph payload 可被渲染。
  - 关键状态 class 存在。
  - 在线图谱库引用明确固定版本。
  - 基础图谱交互入口存在。

- 前端交互变复杂后，必须增加浏览器级验证：
  - Cytoscape 图谱实例已初始化。
  - pan/zoom/drag 交互开关开启。
  - 点击节点后邻居链路高亮。
  - 搜索、契约筛选、关系筛选不会导致错误空白。

## Out of Scope

- 不做通用 Obsidian 全库知识图谱。

- 不做跨 repo 代码调用图。

- 不做自动修改 skill 文件。

- 不做自动判断业务规则应该怎么改。

- 不做团队权限、多人协同编辑或远程部署。

- 不在 MVP 中支持所有 skill 的总览大屏。

- 不把控制台作为 CI 的替代品。

- 不让控制台依赖在线业务服务；前端图谱库可以使用固定版本 CDN 或后续打包到本地资产。

## Rollout Plan

### Phase 1: OKC 实时控制台 MVP

- 支持单 skill watch。
- 支持 OKC impact 图谱实时更新。
- 支持 source/witness/orphan/broken 状态。
- 支持本地 HTML 控制台。

### Phase 2: 控制台体验打磨

- 增加节点筛选。
- 增加待处理项排序。
- 增加节点详情解释。
- 增加 graph snapshot 导出。

### Phase 3: 推广到新建 skill

- 新 skill 模板默认包含 impact 控制台资产。
- `skill:new` 后可以立即启动控制台。

### Phase 4: 推广到既有 skill

- 对既有 active skill 逐个补 impact 契约。
- 每个 skill 先通过 strict impact，再开启控制台。

## Further Notes

这个控制台的设计底线是：它必须围绕“维护契约是否断链”展开。

图谱本身不是目的。节点、颜色、动画、布局和筛选都必须服务以下问题：

1. 当前改了什么。
2. 它影响什么。
3. 哪些关联文件已经闭环。
4. 哪些关联文件还漏着。
5. 为什么这些文件相关。
6. 下一步怎么让 skill 回到一致状态。

如果某个功能不能帮助回答这些问题，就不应进入 MVP。
