# 交接（唯一交接文档）

> 本文件每次收工**覆盖重写**（纪律 C2），历史见 `git log -- handoff.md`，不另存副本。续工（C3）：先 `git pull`，读本文件 + `docs/decisions/`；切机器先跑 C1 巡检。坑与经验的沉淀见 [docs/lessons-learned.md](docs/lessons-learned.md)（追加式，本文件不复述）。

## 当前状态

- **ob-notes v1.0.0 候选**（分支 `codex/ob-notes-obsidian-only`）本次新增 **追问链改逐字扣（ADR-0013）**：
  - **动机**：agent "答重写"本身是又一次 LLM 生成、会漂移（同段答重写两次都不同、都对不上原话）；长会话 compaction 后 agent 上下文前半段被摘要替换、记忆已失真 → 唯一 ground truth 是会话 jsonl。
  - **新增规则项 `transcript-extract`**（唯一家 distill.md）+ **`scripts/extract_transcript.py`**：按 `CLAUDE_CODE_SESSION_ID` 定位 jsonl、结构层机械滤噪（thinking/tool_use/tool_result/元数据/中断/compact 摘要）、逐字提取问答；**dogfood 当前会话 9 轮通过**（问答逐字保真、噪音全滤、被工具切断的多段答正确归并）。
  - **规范落地**：distill ② 限综合呈现 / ③ 补操作旁白；presentation 追问链答→逐字扣（总纲留作导航）；SKILL workflow/mode-decision/依赖；maintenance 登记（受控词表 26→27）；**depmap 27 项全绿**。
  - **evals 转正**：翻转 stale 的 id4（原测"答重写成讲解体"与新架构冲突）、新增 id5（逐字保真 + 操作旁白滤，选 B）/ id6（主题网对照守"逐字只限追问链"边界）；`evals/pending/` 清空、`lint --release` 发布闸解除。
  - **整套逐字扣仍试行待验证**：正向效果 n=1（仅暴露它的那次失败），未做正向 dogfood。
- **延续**：ADR-0011 架构翻转、ADR-0012 feedback 通道、目录二分（ADR-0010）、纪律双份、CI 门禁同前，未动。
- **另一条线**：learn-everything skill v0.1.0 骨架已 commit（分支 `learn-everything-skill`，off main，`ee168d3`），未过门禁未 dogfood，本会话未推进。
- **发布态**：`ob-notes/v0.8.0` 已发布；marketplace 条目 pin 于 v0.8.0 tag 旧路径 `skills/ob-notes`（该 tag 树内有效，勿改），v1.0.0 发布时更新 path。

## 下一步

1. **评测重跑（G·2）**：触发 + 执行评测（架构大改必测），委托 skill-creator；执行用例已随逐字扣重写（`evals/evals.json` 6 条）。依赖 `claude -p` API key 环境（run_loop 嵌套鉴权坑未解，见未决）。评测用例须先给用户过目（F 人在环）。
2. **跨文件回溯实机验证**：需一个由 compaction 续接的会话（jsonl 开头即 `isCompactSummary`）才能验 `logicalParentUuid` 回溯；当前会话未触发压缩、测不到。`[试行待验证]`
3. **Codex 侧 transcript-extract**：`~/.codex/sessions/YYYY/MM/DD/rollout-*.jsonl`（每行 `{timestamp,type,payload}`）的 payload schema + 运行时定位当前会话机制待 Codex 实机验；未通前该侧降级 agent 转述（平台差异走 sidecar，不写进 distill.md）。
4. **图片还原**：extract_transcript.py 现出 `[图片:media_type]` 占位，base64 → 附件文件的体积/落点策略待实现。
5. 走发布链：eval 过目 → 评测达标 → 合 main → tag `ob-notes/v1.0.0`（对外仍 1.0.0，候选内演化；tag message 用中文）→ 更 marketplace.json（path 改 `skills/first-party/ob-notes`，lint 一致性门禁兜底）。发布须过 `lint --release`（pending 已空）。

## 未决问题

- 逐字扣正向效果 n=1、compaction 全量性 n=2，均 `[试行待验证]`（发布前须补 F/G② 评测）。
- 跨文件回溯确切规则、Codex 侧全链路 —— 待实机。
- run_loop.py（description 优化）依赖 `claude -p`，嵌套鉴权失败，待 API key 环境。
- pass^k 的 k 与各 skill 触发率阈值未定；多 skill 触发互斥性未测（第二个 skill 出现时负例集互含）；ADR-0010 third-party 安装路径待首个第三方 skill 实测；AGENTS.md 平台段接管。

## 环境备忘

- 公司机 CHINAMI-5T8IKFA（本次会话机）：Windows 11；git 2.53.0 / Python 3.13.5 / Node 24.14.1 / pwsh 7.6.3；Codex `project_doc_max_bytes=131072` 已设；skills-ref 桶一通过。
- 家用机 TerryXming：git 2.53.0 / Python 3.14.2 / Node 24.14.1 / pwsh 7.6.3；Codex 128 KiB。
- 两机各配 `~/.config/ob-notes/config.json` 指向自己 kbase（公司机 `D:\nexgaios-kbase`；读取顺序见 preflight.md）。
- **会话 jsonl 定位（本次查证，供 transcript-extract 落地用）**：Claude Code 当前会话 = `~/.claude/projects/<cwd编码>/${CLAUDE_CODE_SESSION_ID}.jsonl`（cwd 编码规律：非字母数字 → `-`，如 `D:\nexgaios-skills` → `D--nexgaios-skills`；按 session id 直接 glob 最稳、不必重算编码）。compaction **只追加** `isCompactSummary` 摘要行、**不删原文**；压缩后可能续到**新文件**（前文在前序文件，沿 `logicalParentUuid` 回溯）。Codex 侧格式见下一步 #3。

## 上次会话摘要（2026-07-06 · 公司机 · 本会话）

pull 续工 → 看待做（learn-everything 与 ob-notes 两线）→ 用户定先做 ob-notes、提出「追问链应逐字保真，且因 LLM 概率性须从会话 jsonl 扣原文」→ 查证（Claude 侧 jsonl 位置 / `CLAUDE_CODE_SESSION_ID` 定位 / compaction 不删原文 / 跨文件回溯 / 信号占比约 17% 全实测）→ 落 ADR-0013 → 写 `extract_transcript.py`、拿本会话 dogfood 9 轮通过 → 用户三点拍板（thinking 不留、信号逐字全留、噪音单独定义；操作旁白选 B 滤）→ 改 distill/presentation/SKILL/maintenance（登记 `transcript-extract` 规则项、词表 27）、门禁全绿 → CHANGELOG/dev-log 留痕 → evals 转正（翻 id4 + 新 id5/6、pending 清空）→ 收工 commit + push。全程 A2 落盘声明、A4·3 待验证标注到位。
