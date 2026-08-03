---
title: ob-notes 开发日志 · 进展时间线
date: 2026-06-26
updated: 2026-08-03
source: ob-notes 维护（原 dev-log.md 拆分）
tags: [状态/持续]
---

## 进展时间线（只追加，倒序）

**2026-08-03** — **核心从全文逐字改为证据约束的忠实提炼（宿主 ADR-0015）**。用户重新审视逐字保真的优先级：逐字能防漂移，却损害解法卡扫读和主题网整合；真正要守的是结论可追溯与关键语义不漂移。落地为内部证据账本（结论 / 来源轮次 / 来源时间 / 事件时间 / 可信度 / 保真级别 / 受保护原子）→ 两档成文（显式问答实录逐字，解法卡 / 主题网忠实提炼）→ 带来源时间的脚注 → 写盘前漂移检查。受保护原子覆盖用户决定与约束、命令 / 代码 / 配置 / 报错、数字 / 日期 / 版本 / 路径、字段 / API / 参数名和否定 / 条件 / 边界。评测改测证据约束综合并新增确定性与边界漂移用例；用户过目前不运行行为评测、不提交推送。

**2026-07-07** — **全 .md 正文重构为祈使体 + 落显式工作流 + 图片落盘实现（用户要求）**。用户指出 v2.0.0 只补了四块、没按「对所有 .md 文件的写作要求」主动重构、也没把 5 步工作流落成显式流程。整改：

- ① SKILL.md 加「## 工作流」（5 步 + 官方 checklist 体）作主干、正文全改祈使（条件第三人称「当用户…」/ 动作祈使）
- ② distill / presentation 叙述体全 rewrite 为祈使、模板骨架零改动
- ③ preflight / quality-check / anti-patterns / frontmatter-tags 做真实祈使收紧 + version bump（本是指令 / spec 体、已 largely 达标，不空 churn）
- ④ maintenance / feedback / evals-README 评审为已达标（编号步骤 / spec），不 churn
- ⑤ 重取官方 best-practices 全文，确认「第三人称只管 description、正文用祈使句」——据此 description 保持第三人称、正文祈使即最佳实践
- ⑥ Q2 图片落盘：`extract_transcript.py` 加可选 `--attachments-dir`（传了才解码 base64 存 `{kb_root}/00 - raw/attachments/`、emit `![[]]`，保住脚本只读契约），合成 png 测通、distill 图片行同步
- ⑦ quality-check 加第 6 测「格式合规」。build_depmap 27 项 + lint 全绿。诚实：体例已合规，正向效果仍未 dogfood。

**2026-07-07** — **v2.0.0 架构再翻转（三种呈现正文一律逐字，宿主 ADR-0014）+ dev-log 拆分**。公司机续工，skill-creator 迭代：先联网核官方最佳实践（SKILL 精简 / 渐进披露 / 指令优先祈使句）+ 读穿现有 skill，发现「三种信息=现有三呈现、30 秒读法已存在」，故本次是叠加而非重写。用户 AskUserQuestion 拍板「综合头 + 逐字正文」：删 distill ② 答重写四镣铐、transcript-extract 升三种通用、presentation 解法卡/主题网正文改逐字块编排、30 秒读法加"背景"字段统一套用、mastery-lens 转挑块/编排、quality-check §2 加"偷偷重写"检查、maintenance 归属表四行 + 易混对更新；SKILL 补 输出格式 / 失败边界 / 脚本加载 / 评测规则指针。source-fidelity 标 `[待定]`（外部长文逐字处理未定）。evals：id6 翻 `topic-web-verbatim-organized`（prompt 改真实多轮 transcript）、id1 补断言、新增 `evals/README.md`。ADR-0014 + CHANGELOG [2.0.0]。dev-log 按 SSOT + 索引 + 指针拆为 `dev-log/` 三分册（脚本机械拆、锁 LF），`lint.py` check_portability 豁免 `dev-log/`。诚实：全为纸面翻转，evals 待用户过目后跑、主题网逐字编排 dogfood n=0（`[试行待验证]`）。

**2026-07-04** — **失败回填通道落地（宿主 ADR-0012，feedback-loop）**。动机：真实使用必有失败案例，需自动化回流给迭代；边界先划清——发现失败（语义判断）与用例审批（ADR-0012 人在环）原理上不可自动化，自动化目标=捕获零摩擦、遗失零容忍。四件构件：①捕获——用户说一句"回填用例"，agent 按 `references/feedback.md` 把现场（触发语/坏笔记摘录原样、用户原话逐字保真、疑似规则项、断言草稿）写成 `evals/pending/` 一个 JSON；config 可选键 `dev_repo` 门控（普通用户惰性，skill 源不写机器路径、过桶二·1）；②提醒——pending 只写文件不 commit，留 dirty 给§14「开工」巡检看见，零新增提醒机制；③转换——agent 起草 eval、用户过目（ADR-0012）、入 evals.json 删暂存；④发布闸——宿主 `lint.py --release` pending 非空即红（平时 CI 不查，防堵捕获通道）。与已删 monitoring 的区别=事件驱动、仅维护者，非每次沉淀无条件记录。词表 25→26，SKILL 维护节挂引导。否决：每次沉淀记 jsonl（即被删的 monitoring）；独立 feedback skill（新发布单元过重）；暂存放 ~/.config（CI 与§14「开工」巡检都看不见，会遗失）。通道全链路未经真实失败案例走通，试行待验证。

**2026-07-04** — **架构规范严格审查 + 修复一批**（用户要求全面审查后执行）。审查四层：依赖声明 vs 正文实际引用、ADR-0011 落地完整性、术语一致性、门禁符合度。查出 5 硬伤 + 5 一致性问题，其中 3 处（SKILL 引 naming-rule 未声明、归属表 mastery-lens 含义残留"主题网骨架"、frontmatter-tags"三种呈现骨架"措辞）是近两日补丁/瘦身自己引入——共同根因：改动时跳过 §6 第 2 步（更新声明）与第 3 步（提及扫描）。修复：①§3 立**声明分界**（规范性依赖须声明、指路引用不声明，判据="该规则变了本文件不改会不会出错"）——新规范，maintenance 1.2.0；②quality-check §2 重写为"复核 distill 分离结果"（落 ADR-0011 决策 8，消除与 distill 的派生事实复述），depends_on 补 signal-noise/anti-patterns，0.4.0；③SKILL depends_on 补 naming-rule、presentation 补 source-fidelity（mode-decision 按分界属指路、不声明）；④归属表 mastery-lens 含义去"骨架"、quality-rubric 含义与易混对及 quality-check 三处"研究型"→"主题网"（术语立规：呈现名=主题网，tag 名仍=类型/研究）；⑤frontmatter-tags"呈现骨架"→"呈现侧重"。遗留：description 补"无问存档不收"随 evals 重写一起动（桶三+触发重测）；evals 过时维持 handoff 安排。

**2026-07-04** — **CHANGELOG 瘦身（123→约 90 行）**。按 maintenance §5 分工把各版本条目里的理由、触发、否决备选拆除——这些属 dev-log 职责且决策表/时间线均已有记录，CHANGELOG 只留"一行主题 + 变了什么"（§13 单一事实源：消除双源复述）。逐版核对无信息丢失后执行；无行为变化、不动版本。

**2026-07-04** — **流程审查后补七处疏漏**（用户走查整套 workflow 后逐个补，分两批）。第一批三处：①`mode-decision` 单对边界扩成三对易混消歧（补「解法卡 vs 主题网」＝解完冻结 vs 持续生长、「解法卡 vs 追问链」＝要结论 vs 要理解路径）；②`distill.md` ③ 补「试错弯路是信号、非操作噪音」，消除与解法卡「踩过的弯路」的自相矛盾（划界＝带根因的失败留、机械操作/日志滤）；③`distill.md` 无问处补优雅引导话术（把「无问顺手存档」转成「聊几句你的疑问」的入口，不硬拒）。第二批四处：④交叉场景补「选哪个当主」判据（未来从哪个入口回来找＝主）；⑤`presentation.md` 增量优先从「建议」强化为「写盘前必做」，并诚实标执行力靠 agent、需 eval 盯；⑥铁律一手存补「连文件名 + 落点一起给」；⑦沉淀动作补「写盘后回一句确认落点」（轻量反馈、非 monitoring 回归）。均现有规则项内部补充，词表/结构/对外版本不变，depmap 25 + lint 全绿。诚实：七处全是纸面补丁、未 dogfood（`[试行待验证]`），边界判据应在 evals 重写时各补对照用例（ADR-0012）。记录订正：上一轮误报"dev-log 已记"、实际时间线遗漏，本条一并补全（A4·7 教训见踩坑）。

**2026-07-04** — **架构翻转后首次 dogfood 执行测（隔离子代理）+ 回填一条判据**。装 v1.0.0 到本机 agent 目录，起全新子代理（无设计对话上下文）按新版 ob-notes 把 AWS 记忆文沉淀成主题网笔记（写测试目录、未碰真库）。结果正面：①主题网去骨架生效——结构服从文章逻辑（分类→四维→框架→选型）、未套固定格子；②旧版被压没的机制细节（Mem0 六层模块名、Letta 三工具名 core_memory_append/replace/recall、AgentCore API）**全保留**（source-fidelity 实质闸 + 去骨架合力）；③可信度/反幻觉在起作用（整篇钉待验证、选型钉推测、剔除 WebFetch 脑补的"选型矩阵表"）。暴露一处规范盲区：**追问链 vs 主题网边界**——有连续追问但无认知转折时判据不明示，子代理靠 distill "理解如何推进"反推判对。已回填 SKILL.md mode-decision 补判据（追问有无独立认知增量）。诚实：n=1，一次成功 ≠ 可靠，仍试行待验证；该盲区应在 evals 重写时补一条对照用例（ADR-0012）。

**2026-07-04** — **v1.0.0 架构翻转（问答基底 + 信号/噪音分离）**。公司机续工，与用户逐轮对齐后落地宿主 ADR-0011：①建 `distill.md`（信号/噪音引擎：三限定判据 + 问保真答重写四镣铐 + 操作留结果 + source-fidelity）②建 `presentation.md`（三呈现骨架，主题网去骨架、mastery-lens 挂其下）③删 mode-a-research/practice/dialogue ④SKILL workflow 翻转 + metadata ⑤归属表 26→25、depmap 全绿 ⑥修 5 处活跃死引用 + frontmatter-tags 两处措辞（"三套模板"、"研究型按由浅入深"与去骨架矛盾）+ CHANGELOG 重写 [1.0.0]。主题网去骨架的诱因是用户以 AWS 记忆文为例点破"研究型套骨架削足适履"。evals 执行用例待重写（用户定：暂不跑评测）。

**2026-07-03** — **v1.0.0 候选补问答实录型**。用户指出刚写入的《Codex 执行仓库纪律三次失守》被误写成实战踩坑复盘，与知识库既有《MCP 实战·工具加载与粒度：问答实录》《MCP 实战·密钥与信任边界：问答实录》体例不一致；追问后确认 research/practice 都不覆盖"连续追问/不要压缩/保留学习路径"。动作：①Obsidian 笔记改名并重写为《Codex 执行仓库纪律三次失守：问答实录》；②新增 `references/mode-a-dialogue.md` 和 `dialogue-template`；③tag-system 增 `类型/问答实录`；④SKILL.md mode-decision 改为 research/practice/dialogue 三分；⑤evals 增问答实录触发与执行用例。待 lint/depmap/安装验证。

**2026-07-03** — **v1.0.0 候选改造初步收敛**。按用户确认：①摘除写项目目录能力，删除 `mode-b-devlog.md`；②删除 monitoring 回访机制与 `monitoring.md`，frontmatter 去掉 `read_count`/`last_read`；③tag 体系移除 `类型/项目日志`；④preflight 落点统一为 `{kb_root}/00 - raw/00 - inbox/`；⑤trigger/evals 增 dev-log 负例，项目决策正例改为 Obsidian-only。该步先把受控词表 31→25 项；随后同日补问答实录型后为 26 项。

**2026-07-03** — **执行评测第 1 轮：with-skill 两组全胜（独立盲评 grader，位置对照排除偏差）**。E1 白纸建笔记 **20:14 大胜**（增益 = 可信度三态自降级、frontmatter 可索引、第一屏摘要、适用边界）；E2 dev-log 更新 **20:18 小胜**（增益 = 被推翻决策就地"已过时"删除线留痕；差距小属预判混杂——预置 fixture 本身即 skill 模板，baseline 靠格式跟随得分）；E3 铁律一双侧零写盘（with 侧教科书：拒编造 + 停问 + 未新建目录；baseline 侧归因混杂——unstage 后子代理在仓库 cwd 读到 `skills/ob-notes` 源照做，**"skill 源在 cwd"本身即泄漏**，干净 baseline 需完全无源环境）。机械断言：E1w 9/9、E2w 9/9；差分证据：E1b 结构 0/5（无 frontmatter/可信度/tag）、E2b 无删除线留痕。**G② 执行侧"优于 baseline"初步达标（k=1）**；正式发布仍待发布门禁（ADR-0009）的 dist 构建（未建）。方法（可复用）：双沙箱 w/b 防交叉、config 挪移防写真库、两波串行防 skill 互见、盲评 A/B 反向排位。

**2026-07-03** — **触发评测第 1 轮（k=1）满分：20/20**——正例 10/10 触发（显式/隐式/情境/typo/竞争全命中）、负例 10/10 正确拒绝、**误触发 0（发布门禁（ADR-0009）全局底线达标）**。方法：每条用例一个隔离子代理收 query 原文（无评测框架）、解析其转录 `Skill(ob-notes)` tool_use 客观判定；写盘隔离 = 临时挪走 `~/.config/ob-notes/config.json`，铁律一顺带实测通过（T1/T8/T9 走到写盘全部停下来问、零写盘、零编造）。事故与教训：①20 并发瞬间打满限流、10 个子代理被掐（其中 7 个已留下激活证据仍有效，F3/F9/F10 补跑）——**spawn 须分批（≤5）**；②F6"记住用 pnpm"被子代理当真实偏好写入宿主记忆——**负例的"正确行为"也有副作用，跑完须巡检**；③T1 在仓库 cwd 里 grep 出用例文件识破评测——触发判定不受污染（激活在先），但**执行评测须换干净 cwd**（环境泄漏）。诚实标注：k=1 摸底轮；pass^k 加采样与执行评测（baseline 对照）未跑，G② 尚未完全达标。

**2026-07-03** — **发 v0.8.0（MINOR）**——SKILL.md 内容质量专项审查（执行模拟镜头）：①写入侧监控指令拿走（监控暂缓却无条件命令记 jsonl，每次沉淀会被 preflight 多问一次；monitoring.md 与复盘引用保留）②收尾触发收窄并与触发节"问一次"对齐 ③铁律三倒置指代修正。SKILL.md depends_on 去掉 jsonl-schema/revisit-signal，depmap 重跑图变化确认。教训：审查结论须声明镜头与覆盖面——上一轮结构审查曾误背书"设计无问题"。

**2026-07-03** — **迁入 `nexgaios-skills-dev` 仓库 + 发 v0.7.1（PATCH）**。按宿主 H 流程收编：清 README/skill.yaml/.claude-plugin（杂物与双源）、dev-log/CHANGELOG 按宿主 ADR-0006 留域内、SKILL.md frontmatter 字符串化过 skills-ref 桶一、补 evals（触发 20 + 执行 3，用例经用户过目）、打基线 tag `ob-notes/v0.7.0`。随后全文件审查修复：build_depmap 解析兼容两式（修字符串化引入的解析回归——SKILL.md 三核心规则项曾被误报孤儿且仅 warning 放行）、归属表有家的孤儿升 error、description 补"何时不用"、maintenance §3/§5 对齐新语境。原仓库整体退役（用户删除）。

**2026-06-27** — v0.7.0 **受控验证（A/B+N dogfood）打脸诊断**。开 5 个干净 subagent 冷沉淀同一篇 AWS 文章——旧版(scratchpad 副本、source-fidelity 还原)×2 + 新版×3，同 prompt、唯一变量是 skill 路径。发现：①当初"压缩过狠"**5 次 fresh 全没复现**（带不带 fix 都没）→ 大半是 **run 方差、非确定性缺陷**；②fix 的设计效果（H3 粒度覆盖表 + Mem0 六模块枚举）只在 **2/3 新版**出现、**0/2 旧版**，方向对但不保证，且有 WebFetch 取数方差 confound；③大部分机制恢复 + 逮 fetch 幻觉是**基线行为**（铁律二/三），非 fix 之功。决策：v0.7.0 **留**（无害、在该生效处生效、零回退），但把"压缩过狠"从"确定性 bug"**降级为"低概率坏抽样 + 最细粒度偶失"**。教训：N=1 + 自演满分卷会高估可靠性，须 A/B+N；评测会打脸诊断，要接受。开放项：最细粒度命中率现仅 N=3 的 2/3，要当真比率需 N≥10。本轮成果另沉淀为知识库笔记《高质量 Skill 工程：问答实录》。

**2026-06-27** — 发 v0.7.0（source-fidelity 仪式闸→实质闸 MINOR）。网页对话里用 dogfood 笔记《Agent 记忆模块最佳实践（AWS）》复盘 source-fidelity：笔记虽出覆盖表，却把各框架 H3 机制（Mem0 六层模块名、双 LLM、Letta 工具名/内外记忆定义）压没——核对原文确认这些原文确有、被笔记丢了（保真 bug）；而"双 LLM 怎么协作、递归摘要算法"原文本就没有（源上限、非 bug）。治理：覆盖表锁最细粒度、放行改实质闸（机制能否只凭笔记读懂）、保留清单补机制/确切名 + 源上限护栏。提及扫描确认无别处复述派生事实、无联动；build_depmap 验 MECE、图结构不变。

**2026-06-26** — 盘点 dev-log 待办并闭环。删去旧模板 dogfood `agent-memory.md`（由终态 `Agent 记忆模块最佳实践（AWS）.md` 取代、去掉"样板"标签）；关掉 mode-decision（已决）、kb_root 环境、git 身份、package.command（查证全 monorepo 皆空、属约定）四项，移入"已解决"；剩"观察沉淀数据"开着，"并 main / PR"留作跨范围单独决策（本分支还驮 OKC console）。

**2026-06-26** — 发 v0.6.0（漂移根因治理 MINOR）。审计追到根因 = 内容反范式（同一事实多份拷贝→更新异常），且 SSOT 原只覆盖"规则定义"、没延伸到"派生事实"层。治理：归属表 / SKILL 引用清单的计数与名单去重（改引用 / 去数，顺修一处已漂坏例名单）、quality-check §1 改测产出、maintenance 立"SSOT 管派生事实"原则 ＋ §6 加提及扫描。评估后否决配置式哨兵 lint（过度工程、看护残渣、同源漏洞）。无新规则项、图结构不变。

**2026-06-26** — 发 v0.5.1（口径校正 PATCH）。迭代审计揪出旧口径残留并修正：多处"四测"→实为五测（掌握测试已并入）、实战命名 / 双链 / 监控示例 slug→标题式、anti-patterns 第一屏字段对齐新 30 秒读法、30 秒读法"边界"与正文"适用边界"消歧；SKILL 引用清单补全 layout-rule / mastery-lens。无行为变化、图结构不变。

**2026-06-26** — 发 v0.5.0（破坏性）。以 dogfood 笔记打磨出终态样板后回灌：naming-rule 改"文件名=显示标题"、研究/实战模板去 H1、30 秒读法字段升级（是什么/解决什么/最重要结论/怎么用/前置/边界）、frontmatter-spec 写清三处标题关系；并在库里落一个极简阅读型 CSS snippet（呈现层、库级、不进 skill）。build_depmap 验 MECE 通过（无新规则项、图结构不变）。

**2026-06-26** — 格式/信息设计深挖 + 回灌 v0.4.0。以 AWS dogfood 笔记反复打磨样板，否掉两条弯路(决策工具式倒排序、充分利用语法/做成章节框架)，确立"研究型笔记=由浅入深的学习材料、掌握靠行文功力而非章节、版式克制"；落为 `mastery-lens` + `layout-rule` 两规则项 + `quality-rubric` 掌握测试(均 MINOR、不动模板结构，规则项 29→31)，走完 §6。呈现层(Obsidian 主题/CSS，库级)列为下一步单独处理(用户要的"先1后2"之2)。

**2026-06-26** — 质量梳理 + 修 F1 行尾 bug。系统读完全部 16 文件、跑两层校验(build_depmap 与 monorepo validate 均通过、29 规则项 MECE 全绿)。结论：设计强、验证薄(仅 1 篇 dogfood)。修 `build_depmap.py` 跨平台行尾 bug(F1，见踩坑) + README 对齐 monorepo(F5)；按"维护者-only、对外零影响"判定不升版本、不动 CHANGELOG。F2(验证薄)归入下一步第 1 条、F3(revisit-signal 依赖 agent 自觉)留作监控层激活前的已知最弱环。

**2026-06-26** — 公司机首日续做。核对环境——git 身份(global 即 terryxming)、kb_root、dogfood 笔记(`agent-memory.md`)经查均在本机 `D:\nexgaios-kbase`，补建 `~/.config/ob-notes/config.json` 指向它(故旧续做提示①"公司机没有库/笔记"实测不成立)。就 mode-decision 是否细化形成判断并记入决策表：维持粗分、misfit 走模板层、定可量化触发闸。

**2026-06-26** — 首次真实沉淀 dogfood + 推送 GitHub。配 kb_root（本机）→ 把 AWS 记忆文章沉淀成研究型笔记落 inbox，v0.3.0 三特性真实写盘验证通过；监控层按用户选择暂缓。本地两个 commit(v0.2.0/v0.3.0) + 本条 dev-log 更新推送 `origin`，交接明天到公司续做。

**2026-06-26** — 从前作 OKC 捞取五件并入，发 v0.3.0。读穿 OKC 全部 reference，判定"捞编辑智慧、丢流程机器"——并入 source-fidelity/anti-patterns/quality-rubric 三规则项(2 新 reference) + 研究/实战模板增强。受控词表 26→29 项，build_depmap 验 MECE 通过、反向索引确认新规则项被正确依赖。

**2026-06-26** — 收编进 `nexgaios-skills` monorepo——拍平 `ob-notes-repo/ob-notes` → `skills/knowledge-management/ob-notes`，补 `skill.yaml`、重生成 `catalog.yaml` 与分组 README、去掉外壳层 LICENSE，修正 README/CHANGELOG 里 `ob-notes/...` 旧相对路径。`validate --all` 全绿。澄清并作废了交接文档里"给目录做 git init"的旧建议（在 monorepo 子目录 init 会造成嵌套 repo）。

**2026-06-26** — Claude Code 接手续做，处理演练暴露的三个待迭代问题，发 v0.2.0。按 maintenance.md 修改流程查影响面 → 改 frontmatter-tags.md(唯一家) + research/practice 骨架联动 → build_depmap.py 验 MECE 通过(图无变化) → 记 CHANGELOG 与本 dev-log。

**2026-06-26** — 用 AWS《Agent 记忆模块最佳实践》文章做真实沉淀演练，产出研究型笔记一篇，暴露上述三个待迭代问题。

**2026-06-26** — 补本 dev-log，交接给 Claude Code 续做。

**2026-06-26** — 完成打包。处理了 frontmatter 标准合规(字段移入 metadata，连带改脚本解析与 maintenance.md 文档)、清除私人路径泄漏。产出 .skill 包 + 仓库 zip。

**2026-06-26** — 写完全部 references（preflight/frontmatter-tags/三套模板/monitoring），逐个跑脚本验证 MECE。

**2026-06-26** — 定稿地基（maintenance.md 治理宪法 + build_depmap.py + 依赖图），实测 5 类违规拦截。彻底 SSOT 改造（脚本从归属表动态解析词表）。

**2026-06-26** — SKILL.md 经三版迭代。v1→v2 修审计问题；v2→v3 落实 MECE(引用不复述)、去过程化、description 全中文、复盘逻辑修正。
