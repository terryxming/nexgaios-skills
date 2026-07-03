# 0009. 交接单文档化与经验台账:journal 退役

- 状态:已接受
- 日期:2026-07-04
- 决策人:terry(家用电脑)+ Claude

## 背景

journal/ 逐次追加式交接运行三天即暴露结构问题:6 份文件互相搬运"未决项/环境备忘"(违反纪律 B 条·禁止可避免的重复——历史状态序列本就是 git 天然记录的东西);"该读哪份、读几份"存在歧义,直接诱发 Codex 失守(补写 handoff 前只列文件名未读正文→格式漂移);会话起点重建状态需读多份文件。同时,不够格进纪律/ADR 的运营性经验(限流、评测副作用、平台怪癖)散落在不会被重读的 handoff 里,无固化管道。用户提出:交接的本质是续接,应由一个文档承载;仓库缺踩坑记录。经反方审查确认两点修正:①文件拓扑只解决可发现性,防复发的载荷在机械门禁;②新机制必须是净减法,不得增加会话写入义务。

## 决策

1. **交接单文档化**:根目录 `handoff.md`(唯一交接文档),每次收工**覆盖重写**,固定节:当前状态 / 下一步 / 未决问题 / 环境备忘 / 上次会话摘要;历史由 `git log -- handoff.md` 承载,不另存副本。
2. **经验台账**:`docs/lessons-learned.md`,追加式,每条必填**"已固化到哪"**——使其成为机械化队列(坑最终毕业成门禁/hook/eval/纪律,或显式"暂留为知识")。MECE 边界:ADR=难逆转决策,skill dev-log=skill 域内,handoff=易变状态,本表=流水线/平台层经验;互链不复述。
3. **journal/ 退役并删除**:存量 6 份的活性内容迁入上述两文件,文件删除(git 历史即归档,保留目录反制造"还要不要读"的歧义)。
4. **纪律修订**(C1⑤/C2/C3 与"main=可安装态"条,双份共享段同步):巡检读 `handoff.md`;收工=覆盖重写 handoff + 有坑记台账;续工=pull 后读 handoff 与 ADR。
5. **机械兜底(C2 门禁,试行待验证)**:CI 扩至全分支 push(原仅 main,Codex 分支推送根本不触发 CI);新增 `tools/check-handoff-sync.py`——push 范围内动了 `skills/**` 或 `docs/decisions/**` 而未同批更新 `handoff.md` 即红。
6. **发布一致性门禁(G④)**:lint 新增 marketplace↔tag 检查——marketplace.json 条目的 `ref` 必须是已存在的 git tag,且条目 `version` 与**该 tag 处**的 `metadata.version` 一致(不与工作树比,开发期不误红)。
7. **验收标准(净减法)**:重构后每会话固定写入义务数不增——journal 义务被 handoff 义务 1:1 替代,台账仅有坑才写。
8. **命名(A3 惯例查证)**:`lessons-learned` 为业界既定术语(postmortem=单次事故复盘,lessons learned=跨项目可复用经验沉淀,语义正合本表);`handoff.md` 用小写守 kebab-case——本仓大写文件名仅限平台/生态强制(CLAUDE/AGENTS/README/CHANGELOG),不自增例外。

## 证据(附来源,区分已证实/推断)

1. **已证实(库内实例)**:连续 handoff 重复搬运未决项与环境备忘(如 run_loop 鉴权问题连续出现于多份);Codex 补写 handoff 前未读既有正文致格式漂移(见知识库《Codex 执行仓库纪律三次失守:问答实录》)。
2. **已证实(操作核验)**:原 CI 触发器为 `push: branches: [main]`——skill 分支推送不跑任何门禁。
3. **已证实(术语惯例)**:postmortem 与 lessons learned 的语义分层见来源 1/2。
4. **推断(有行为证据)**:纪律常驻不等于执行,防复发靠门禁而非文件拓扑——三次失守均发生在纪律全文常驻上下文的状态下。

## 影响

- 纪律双份:C1⑤/C2/C3、"main=可安装态"条的 journal 字样(共享段同步,漂移校验须绿)。
- README:目录表与跨设备协作节。
- ADR-0008 存疑项"journal 公开后忠实记录 vs 自我审查的张力"随 journal 退役消解:handoff 只存易变状态,叙事经编辑进台账(可公开粒度)。
- ADR-0007/0008 正文中的 journal 提法是历史记录,不改。
- ob-notes v1.0.0 候选分支上残留 1 份 journal,merge main 后一并删除。

## 存疑 / 待验证

- **handoff 联动门禁的触发粒度**:按 push 检查可能对同分支的 WIP 高频推送产生纠缠,诱发敷衍式 handoff 更新——试行观察,必要时调整门槛(如仅查含 skill 变更的推送、或改在 PR 层)。
- 单文档在**并行会话**下会产生合并冲突——当前单人两机串行接力,不成立;真并行时再议。
- `github.event.before` 在 force-push / 新分支场景的取值边界(脚本已做全零回退 merge-base,真实事件表现待观察)。

## 来源

- https://en.wikipedia.org/wiki/Postmortem_documentation
- https://plane.so/blog/how-to-document-lessons-learned-from-projects
- 本仓纪律 B 条(单一事实源)、A3(命名)、A5(门禁二值化)、C1-C4;ADR-0004(CI 只跑二值硬门禁)
