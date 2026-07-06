# 交接（唯一交接文档）

> 本文件每次收工**覆盖重写**（纪律 C2），历史见 `git log -- handoff.md`，不另存副本。续工（C3）：先 `git pull`，读本文件 + `docs/decisions/`；切机器先跑 C1 巡检。坑与经验的沉淀见 [docs/lessons-learned.md](docs/lessons-learned.md)（追加式，本文件不复述）。

## 当前状态

- **ob-notes v2.0.0 候选（分支 `ob-notes`，本会话大改，尚未 commit）**：架构再翻转——**三种呈现正文一律逐字，区分「重写」与「编排」**（ADR-0014，扩展 0013 作用域）。
  - **动机**：用户提出比 0013 更强的统一原则「所有沉淀禁止重写、正文一律逐字」——重写是又一次 LLM 概率生成、丢信息且对不上原话；0013 已在追问链证实，本次推广到三种呈现。用户 AskUserQuestion 选「综合头 + 逐字正文」（非纯逐字，保住主题网跨会话综合）。
  - **核心界线**：**块内逐字（禁改块内一字）+ 块间自由（挑块 / 排序 / 加小标题·总纲·双链）**。综合概括只允许在 30 秒读法头。
  - **改动（lint 全绿）**：distill ②（删答重写四镣铐、立重写 vs 编排）+ transcript-extract 升三种通用 + source-fidelity 标 `[待定]`；presentation 解法卡/主题网正文改逐字块编排、30 秒读法加「背景」字段统一套用、mastery-lens 转「挑块/编排」；SKILL 铁律二改「正文逐字」+ 补 输出格式/失败边界/脚本加载/评测规则指针；quality-check §2 加「偷偷重写」检查；maintenance 归属表四行 + 易混对更新。各文件版本 bump，对外 SKILL 2.0.0。
  - **evals（已翻转，未跑）**：id6 `topic-web-still-rewrites`→`topic-web-verbatim-organized`（prompt 改真实多轮 transcript、断言测逐字块编排）；id1 解法卡补 30 秒读法 + 逐字断言；新增 `evals/README.md` 评测规则。
  - **dev-log 拆分**：按 SSOT + 索引 + 指针拆为 `dev-log/`（decisions / timeline / pitfalls 三分册）+ `dev-log.md` 索引；`tools/lint.py` check_portability 豁免 `dev-log/`。
  - **留痕**：ADR-0014、CHANGELOG [2.0.0]、dev-log 三分册均已记。**全为纸面翻转，未 commit、未 dogfood（`[试行待验证]`）。**
  - **正文体例重构（本会话第二轮，用户要求）**：按「对所有 .md 的写作要求」把 SKILL + 全 references 正文改为祈使体（条件第三人称 / 动作祈使）、SKILL 落显式「## 工作流」（5 步 + checklist）作主干；distill / presentation 全 rewrite、模板骨架零改动；preflight / quality-check / anti-patterns / frontmatter-tags 真实收紧 + version bump；maintenance / feedback / evals-README 评审为已达标不 churn。官方 best-practices 全文核对：第三人称只管 description、正文祈使即最佳实践。**Q2 图片落盘已实现**：`extract_transcript.py` 加可选 `--attachments-dir`（传了才解码 base64 存 `{kb_root}/00 - raw/attachments/`、emit `![[]]`，保只读契约），合成 png 测通。quality-check 加第 6 测格式合规。**dev-log 排版重构**：三分册按可读性重排（decisions 表格→块、timeline/pitfalls→结构化块，内容逐字、条目数验证无丢失）。排版标准 = skill 自己的 `layout-rule`（无墙 + 段落优先，用户选 A），skill 言行一致、layout-rule 不动。build_depmap 27 + lint 仍全绿。
- **延续**：ADR-0011/0012/0013、目录二分（ADR-0010）、纪律双份、CI 门禁同前，未动。本会话另把分支 `codex/ob-notes-obsidian-only`→`ob-notes`、`learn-everything-skill`→`learn-everything`（远端走 GitHub rename API、本地重挂 upstream）；纪律 §9 增「排版要能扫读」款（双份同步，已 push 到 ob-notes）。
- **发布态**：`ob-notes/v0.8.0` 已发布；marketplace 条目 pin 于 v0.8.0 tag 旧路径 `skills/ob-notes`（该 tag 树内有效，勿改），v2.0.0 发布时更新 path。

## 下一步

1. **本次改动未 commit**：等用户 review 后决定是否提交（分支 `ob-notes`）。
2. **evals 用户过目后跑（G·2，F 人在环）**：6 条执行用例（id6/id1 本次改）须用户确认贴近真实场景，再委托 skill-creator 跑 with-skill vs baseline(v1.0.0)。依赖 `claude -p` API key 环境（run_loop 嵌套鉴权坑未解，见未决）。
3. **补 dogfood**：主题网「逐字块编排」深度成色 n=0，用 CRDT/AWS 类多轮素材实测；解法卡纯逐字是否够扫读也要验。
4. **source-fidelity `[待定]`**：外部长文在逐字架构下怎么处理（覆盖表进综合头 + 正文放逐字讨论？）——本次暂不动，单独找用户拍板后重构。
5. 走发布链：eval 过目 → 达标 → 合 main → tag `ob-notes/v2.0.0`（tag message 用中文）→ 更 marketplace.json（path 改 `skills/first-party/ob-notes`）。发布须过 `lint --release`（pending 已空）。

## 未决问题

- 逐字正文正向效果未 dogfood（主题网/解法卡 n=0）、source-fidelity 逐字处理待定，均 `[试行待验证]`。
- 跨文件回溯确切规则、Codex 侧全链路（逐字扩到三种后 Codex 全量降级 agent 转述，影响面更大）—— 待实机。
- run_loop.py（description 优化）依赖 `claude -p`，嵌套鉴权失败，待 API key 环境。
- pass^k 的 k 与各 skill 触发率阈值未定；多 skill 触发互斥性未测；ADR-0010 third-party 安装路径待首个第三方 skill 实测。

## 环境备忘

- 公司机 CHINAMI-5T8IKFA：Windows 11；git 2.53.0 / Python 3.13.5（另装 3.14）/ Node 24.14.1 / pwsh 7.6.3；Codex `project_doc_max_bytes=131072` 已设；skills-ref 桶一通过。
- 家用机 TerryXming：git 2.53.0 / Python 3.14.2 / Node 24.14.1 / pwsh 7.6.3；Codex 128 KiB。
- 两机各配 `~/.config/ob-notes/config.json` 指向自己 kbase（公司机 `D:\nexgaios-kbase`；读取顺序见 preflight.md）。
- **会话 jsonl 定位**：Claude Code 当前会话 = `~/.claude/projects/<cwd编码>/${CLAUDE_CODE_SESSION_ID}.jsonl`（cwd 编码：非字母数字 → `-`；按 session id 直接 glob 最稳）。compaction 只追加 `isCompactSummary` 摘要行、不删原文；压缩后可能续到新文件（沿 `logicalParentUuid` 回溯）。

## 上次会话摘要（2026-07-07 · 本会话）

列远端分支 → 分支改名（codex/ob-notes-obsidian-only→ob-notes、learn-everything-skill→learn-everything，GitHub rename API + 本地重挂 upstream）→ 纪律 §9 增「排版要能扫读」款（记忆 + 双份同步，push ob-notes）→ **用 skill-creator 迭代 ob-notes**：联网核官方最佳实践 + 读穿现有 skill，判定「三种信息=现有三呈现、30 秒读法已存在」故是叠加非重写；识别根本冲突（用户「禁止重写」vs 现有「主题网/解法卡重写」）→ AskUserQuestion 拍板「综合头 + 逐字正文」+ 评测规则下沉 evals/ + dev-log 拆分 → 按 maintenance §6 翻转 8+ 文件（distill/presentation/SKILL/quality-check/maintenance + evals + ADR-0014 + CHANGELOG + dev-log 三分册 + lint 豁免）→ build_depmap 27 项绿、lint 全绿 → 用户逐行审 spec 图，点破两处欠账（写作要求没主动重构、5 步工作流没落地）→ 第二轮：全 .md 正文改祈使 + SKILL 落显式工作流 + Q2 图片落盘实现测通 + quality-check 加格式合规测 + 官方 best-practices 全文核对 → 未 commit，待用户 review + evals 过目。教训见踩坑（把显式指令降格成自评已达标）。全程 A2 声明、A4·3 待验证标注到位。
