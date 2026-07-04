---
title: ob-notes 开发日志
date: 2026-06-26
updated: 2026-07-03
source: claude (网页对话) / 交接给 Claude Code 续做
tags: [状态/持续]
---

# ob-notes 开发日志

> [!note] 交接说明
> 本文件是 ob-notes 这个 skill 自身的维护日志，属于仓库内开发记录，不代表 ob-notes 对外提供"写 dev-log"能力。它在一个 Claude 网页对话里设计成型，现由 Claude Code / Codex 接力维护。**接手前请先读本文件 + SKILL.md + references/maintenance.md**，即可恢复全部设计上下文，无需原始对话记录。

## 项目意图

做一个遵循 Agent Skills 开放标准、可被 Claude/Codex 等多 agent 通用的 skill，把人与 agent 对话中产生的高价值信息（决策、踩坑、知识点、方案取舍、研究结论、连续追问）按统一规范沉淀成结构化 Markdown 笔记，回写到 Obsidian 知识库。

成功标准：解决用户随手让 agent "记一下"时的四类毛病——不知道记什么、压缩过狠、格式丑、没重点；并且 skill 自身可长期维护、不随复杂度上升而前后矛盾。

## 架构与关键决策（只追加）

| 日期 | 决策 | 理由 | 否决的备选 |
|---|---|---|---|
| 2026-06-26 | 做成标准 Agent Skills 包，单包通吃多 agent | skill 已是公开标准（2025-12-18 发布），Claude/Codex/Gemini 等通读同一 SKILL.md | 原计划为 Codex 单独写 AGENTS.md 引用——标准化后无必要 |
| 2026-06-26 | 拆成知识沉淀(Mode A)与项目记忆(Mode B)两类 | 二者复用者、落点、生命周期都不同，强用一套两边都做不好 | 用单一模板覆盖所有——会失败 |
| 2026-06-26 | Mode A 再分研究型/实战型 | 持续生长的主题知识 vs 一次性解决的问题，结构天然不同 | 一种笔记结构通吃 |
| 2026-06-26 | 项目记忆(dev-log)跟项目走、不进知识库 inbox | skill 会被覆盖；项目记忆要随项目版本控制 | 全部沉淀进 Obsidian——dev-log 进了会脱离项目失去意义 |
| 2026-06-26 | 五条铁律为核心，细节下沉 references | 长 prompt 后段遵守度低；主文件只下令、不复述细节 | 把所有规则细节都写进 SKILL.md——会臃肿、被忽略 |
| 2026-06-26 | 可信度三档(已验证/待验证/推测)作为铁律 | 对话可能是错的，不甄别等于把错误固化成"伪知识" | 忠实记录全部内容——危险 |
| 2026-06-26 | 复盘不以回访次数作删除依据 | 低频但关键的"保险型知识"正是要保护的对象，按回访砍会误杀 | 砍长期零回访笔记——违背"怕忘"初衷 |
| 2026-06-26 | kb_root 可配置、存 skill 之外、未配置就停下问 | 既要可开源(不含私人路径)又要用户自用；呼应铁律一 | 硬编码绝对路径——换环境失效、泄私人路径 |
| 2026-06-26 | tag 中英双轨：笔记存中文、英文作别名 | Obsidian 无展示层翻译，要"给人看中文"只能实际存中文；机器靠规范理解 | 笔记里中英双存——一篇 tag 翻倍、搜索图谱乱 |
| 2026-06-26 | 维护治理层：SSOT/MECE + 依赖声明 + 校验脚本 | 防止复杂度上升后规则多处维护、前后矛盾 | 手维护一张静态依赖表——会腐化 |
| 2026-06-26 | 受控词表彻底 SSOT：脚本运行时从 maintenance.md 解析 | 代码内不存副本，词表只有一处 | 代码内硬编码词表镜像——构成双写 |
| 2026-06-26 | 自定义字段(version/provides/depends_on)放 frontmatter 的 metadata 下 | Agent Skills 标准只允许特定顶层 key，自定义字段必须收进 metadata | 放顶层——官方打包校验拒绝 |
| 2026-06-26 | LICENSE 选 MIT、起始版本 0.1.0、模板嵌 references 不建 assets | 匹配场景：纯指令+只读脚本无专利价值；早期未稳定；模板是给对照非原样搬运 | Apache 2.0 / 1.0.0 / 独立 assets 模板 |
| 2026-06-26 | 可信度收紧为"内容已亲验"，但保留三档名(已验证/待验证/推测)不变 | 演练把"信源可信"误判成"已验证"，要消歧；保名使改动向后兼容、不动 tag-system | 新增"信源可信"第四档——会改 tag-system 结构、变 breaking、徒增认知负担 |
| 2026-06-26 | source_url 作为 frontmatter-spec 下的可选字段，不登记为独立规则项 | 它是字段非规则；受控词表粒度是规则项，登记会污染词表，且加字段不该改依赖图 | 把 source_url 登进受控词表——粒度错配，会让 build_depmap 误判图结构变化 |
| 2026-06-26 | 加可选字段判 MINOR(0.1.0→0.2.0)，非 MAJOR | §5 MAJOR 的统帅定义是"使已有笔记/配置失效"；可选字段不致已有笔记失效，骨架仅多一可选行 | 判 MAJOR 升 1.0.0——过度，且与"加可选字段=MINOR"条直接冲突 |
| 2026-06-26 | 收编进 nexgaios-skills monorepo：拍平到 `skills/knowledge-management/ob-notes`、补 `skill.yaml`、登记 catalog；**不做 git init**，去掉 per-skill LICENSE（推翻交接文档与上面 MIT 那条的旧假设） | 该目录已在 monorepo 的 git 下，dev-log/CHANGELOG 随父仓库即受版本控制；monorepo 靠 `skill.yaml` 发现 skill，validate 强制 `skills/<domain>/<id>` 布局；同级 skill 均不带 per-skill LICENSE | 在子目录 `git init`——会造成仓库套仓库(嵌套 repo/gitlink)，父仓库反而跟踪不到内容；保留 `ob-notes-repo` 外壳——结构与同级 skill 不一致、CLI 识别不到 |
| 2026-06-26 | 从前作 obsidian-knowledge-curator(OKC，用户早先 Codex 版)捞取：只移植"编辑智慧"，丢弃"流程机器" | OKC 没做好的是流程重量(预览-确认闭环、母文档 ITER/DEC/TODO 三表、impact 控制台、CSS 视觉)，不是内容经验；ob-notes 重做就是为甩掉这层重量 | 整体合并两 skill / 照搬 OKC 的预览-确认闭环——会把 ob-notes 的"自动化、不打断"哲学破坏掉 |
| 2026-06-26 | source-fidelity 归 mode-a-research.md，不归 frontmatter-tags.md | 原文结构覆盖是研究型(长文/网页)特有的取舍纪律，不是所有笔记的通用格式；放 research 唯一家最贴职责 | 放 frontmatter-tags——它是全笔记通用格式 SSOT，会把研究型专属逻辑塞进通用层 |
| 2026-06-26 | anti-patterns / quality-rubric 各立为独立规则项+独立 reference | 坏例库与写盘前自检是可被 SKILL/铁律复用的横切关注；独立成项才能在受控词表里被引用、被 build_depmap 追踪 | 塞进现有模板或 SKILL 正文——无法被多处引用，且会让 SKILL 臃肿、违"细节下沉 references" |
| 2026-06-26 | quality-rubric(写盘前单篇自检) 与 review-flow(两周全库复盘) 显式划清，不算 MECE 重复 | 时机(写盘前 vs 事后)与对象(单篇 vs 全库)不同，是互补两道闸；已在 maintenance.md §1 注记 | 合成一条"质量"规则——会把两个不同时机的机制糊在一起，迟早矛盾 |
| 2026-06-26 | mode-decision 维持粗分、不向 OKC 的 8 分类细化；misfit 一律在模板层修、不在 mode 层；细化触发从"判不准"改为可量化闸 | mode-decision 实管两条**正交轴**——落点(去 inbox / 跟项目，本就只有 2~3 个目的地，粗分正确)与结构(该长啥样)；OKC 8 分类管的是结构轴，把它塞进落点判定＝把已甩掉的 OKC 流程重量请回来。且类别越多＝每次判断负担越大＝误分类越多，与 `anti-patterns` 的"过度结构化"自相矛盾——细化有**正确性成本**，非仅维护成本。`[推测]` 真会先撑爆粗分的是现在无家可归的三类(偏好/想法/讨论)，其中"偏好"最可能先破、且它缺的或是**落点**而非模板(性质近 agent 行为记忆) | 直接采纳"3桶→8类"细化——重新引入判断负担与误分类、违 anti-patterns；用模糊的"判不准"当触发——永远主观、无法收敛 |
| 2026-06-26 | 研究型笔记引入"掌握"目标：学习闭环落为 `mastery-lens`(写作纪律) + `quality-rubric` 掌握测试，**严禁做成"## 复述/## 迁移"等章节**；排版另立 `layout-rule`，但呈现层(字体/配色/间距)划归 Obsidian 主题/CSS、库级、不进 skill | 框架做成章节＝方法论上台面，会诱发"为填空而填空"的伪掌握、并把整合的理解切碎(失灵魂)；掌握只能从行文功力透出。呈现层堆 markdown 解决不了，且 CSS 是库级、与"跨 agent 通用"的 skill 定位冲突 | 七阶段做成固定章节模板(否：失灵魂)；靠"充分利用 markdown 语法"求美观(否：即格式炫技)；把 CSS 视觉塞进 skill(否：库级、不可移植) |
| 2026-06-26 | **v0.5.0(破坏性)**：文件名改为 = 显示标题(去文件系统非法字符)、研究/实战模板去 H1(靠 Obsidian 行内标题)、30 秒读法字段改"是什么/解决什么/最重要结论/怎么用/前置/边界"(前置=要看懂得先会什么；边界=能力边界非可信度) | 落点固定是 Obsidian、改名自动修链，slug 的跨工具收益基本不成立、徒增 slug↔标题映射；行内标题已承载标题，H1 是双标题冗余；旧 30 秒读法偏归档，新字段偏学习/使用(与 mastery-lens 同源)。佐证：用户既有库本就"文件名=中文标题"，slug 反是异类 | 保留英文 slug(否：本场景收益不成立)；保留 H1(否：与行内标题双标题)；把视觉 CSS 塞进 skill(否：库级、呈现层不归 skill) |
| 2026-06-26 | **漂移根因治理(v0.6)**：把 SSOT 延伸到"派生事实"(计数/名单/示例)，散文拷贝改引用或去数；§6 加"提及扫描"；**否决配置式哨兵 lint** | 审计追到根因=内容反范式(同一事实 N 份拷贝→更新异常),而 SSOT 原只覆盖"规则定义"、脚本只看结构依赖,"派生事实"层一直靠自觉、必漂。范式化(消拷贝)治本;lint 是看护残渣、且有"改时记得登记"的同源漏洞、属过度工程 | 配置式哨兵 lint(否:看门狗看的是正被消灭的残渣、自带同源漏洞、违 ROI);给铁律编号/命名示例做自动 lint(否:skill 自身文件名即 slug,正则全是误报) |
| 2026-06-27 | **v0.7.0**：source-fidelity 仪式闸→实质闸（覆盖表锁最细粒度、放行改"机制能否只凭笔记读懂"、保留清单补机制/确切名 + 源上限护栏） | dogfood 复盘：AWS 笔记出了覆盖表却仍把各框架 H3 机制（Mem0 六层模块名、Letta 工具名）压没——根因覆盖表停 H2 粒度、旧"<1/4 补覆盖表"出口被一张表满足（仪式≠实质）；核对原文区分"原文有却被压没"(保真 bug)与"原文本就没有"(源上限、非 bug)。实质闸与评测的回查测试同句，skill 标准＝评测标准、由构造一致 | 再加第六处反压缩声明(否:五处已存、B 类冗余、治不了仪式≠实质)；实质闸上提 SKILL 铁律二常驻(缓办:本次 source-fidelity 确被加载、无加载失败证据，留观察项) |
| 2026-07-03 | **迁入 `nexgaios-skills-dev`**：该仓库成唯一事实源、原仓库整体退役；SKILL.md 的 provides/depends_on 改逗号字符串、脚本解析兼容两式；归属表有家的孤儿规则由警告升 error | 双仓并存必双源漂移；官方 skills-ref 拒流式列表 + spec 要求 metadata 值为字符串；SKILL.md 声明断裂只配警告会被静默放行（宿主仓库 A5：不阻断的告警会被无视） | 保持流式列表（否：宿主桶一门禁红）；双仓各自维护（否：漂移）；孤儿一律 error（否：真"待实现"场景需要 warning） |
| 2026-07-03 | **v0.8.0 写入侧监控指令从 SKILL.md 拿走**（monitoring.md 保留、复盘引用保留；启用监控时再加回指令），收尾触发收窄为"确有留存价值时主动问一次" | 监控层暂缓是既定决策，但指令层仍无条件命令记 jsonl——执行模拟发现每次沉淀 preflight 都会因 `_meta` 不存在多问一次，指令与决策脱节（维护者知识没落到指令层）；description"也应触发"与触发节"问一次"语义不一致 | 加"未启用则跳过"条件开关（否：给暂缓功能留常驻分支判断，徒增读者负担；启用时机未到，拿走更干净） |
| 2026-07-03 | **v1.0.0 收敛为 Obsidian-only**：移除项目目录/dev-log 写入能力、删除 monitoring 回访机制、tag 移除 `类型/项目日志` | 用户重新明确定位：ob-notes 只做一件事，把人与 agent 对话里值得长期复用的信息写回 Obsidian；项目目录写入和回访信号都会把职责拉宽 | 保留 dev-log 作为第二模式（否：偏离定位）；保留 monitoring 空壳（否：无意义且制造机制负担） |
| 2026-07-03 | **v1.0.0 候选补问答实录型**：新增 `dialogue-template` 与 `类型/问答实录` | 用户指出实际知识库已有 `MCP 实战·...：问答实录` 体例，且"不要压缩/保留追问链"不属于 research/practice 任一模板；如果不纳入规范，agent 会继续误判成实战卡 | 硬塞进 practice（否：会丢学习路径）；硬塞进 research（否：会把问答过程改写成主题论文） |
| 2026-07-04 | **dialogue-template 重构：「问题保真、回答重写」**——回答区定讲解体禁转写体（原话降级为证据引用）、每轮收口一句总纲（30 秒读法从中摘）、认知增量为主角；anti-patterns 增坏例 7"搬运已留痕的记录"（唯一家在 anti-patterns，dialogue 只引用）；eval #4 断言先行（D⑤），运行推后至迭代完；顺修 build_depmap.py 控制台 GBK 乱码（补 stdout reconfigure，宿主机实测暴露） | 实库对比（《Codex 执行仓库纪律三次失守》vs 两篇《MCP 实战》实录，用户判定后者更好）：骨架同构而质量悬殊，差距全在骨架管不到处——转写体让读者隔着"当时它怎么说"才碰到结论；"确切细节"大半是 git 已留痕的过程记录（稀释信号）；可复用产出是复述宿主纪律的 checklist（双源）；无每轮收口导致 30 秒读法无处可摘 | 拆"学习型/复盘型"两亚型（否：三条纪律已覆盖失败模式，亚型徒增判断负担）；坏例 7 塞 dialogue 模板（否：实战型同样会犯，通用坏例唯一家在 anti-patterns）；把 checklist 禁令单独立规则项（否：坏例 7 + 讲解体已覆盖，新词表项过度工程） |
| 2026-07-04 | **v1.0.0 架构翻转（问答基底 + 信号/噪音分离为核心，宿主 ADR-0011）**：workflow 从"判定 research/practice/dialogue 三选一套模板"翻成"先分离信号噪音、再按复用目标定呈现侧重"；三模板合并为 presentation 三呈现骨架（追问链/解法卡有骨架、主题网去骨架），"问题保真、回答重写"升基底通则下沉 distill；source-fidelity 转横切纪律随 distill、mastery-lens 挂主题网；无问顺手存档划出；词表 26→25 | 分类驱动三处张力（三类非 MECE、固定模板诱导填空、三份"该记/该丢"重复）；更根本：有长期价值的知识几乎都生于问答，"问"是认知路径坐标、丢掉违背初衷，故问答是基底非三类之一，"有没有问"又是消化判据。主题网去骨架因研究型结构由内容定、固定章节削足适履且与 source-fidelity 打架（AWS 记忆文即此坑 dogfood 样本） | 留三选一入口（否：非 MECE + 判断负担 + 重复）；主题网留骨架（否：削足适履、与保真打架）；"问保真答重写"留 dialogue 专属（否：它是所有问答通则）；无问存档也收（否：未消化、非护城河） |

## 当前状态 / 下一步（覆盖更新）

- 现状：**v1.0.0 候选（架构翻转已落地，见宿主 ADR-0011）**：以问答为基底，workflow = 先信号/噪音分离（`distill.md` 引擎：三限定判据 + 问保真答重写四镣铐 + 操作留结果不留过程 + source-fidelity）再按复用目标定呈现侧重（`presentation.md`：追问链/解法卡有骨架、主题网去骨架、mastery-lens 挂主题网）；三 mode-a 文件已删、SKILL workflow 翻转、受控词表 26→25、depmap 全绿、5 处活跃死引用已修。当前改动在分支 `codex/ob-notes-obsidian-only`，待评测与发布门禁完成后才能合入 main 并打 tag。
- 下一步：
  1. **重写 evals 执行用例**：覆盖信号/噪音分离、问保真答重写、操作过程滤除、无问存档划出、主题网去骨架（触发用例基本不变）。
  2. **跑宿主 lint 全绿**（结构门禁）。
  3. **补跑 F/G② 评测**：重点覆盖问答基底判据、主题网去骨架的深度成色、kb_root 未配置停问；用 AWS 记忆文重测主题网去骨架是否真的更好。
  4. 达标后合入 main 并打 tag `ob-notes/v1.0.0`（对外仍 1.0.0，候选内演化）。
- 卡点：无。
- **续做提示（给接手的你/agent）**：先读宿主仓库 `CLAUDE.md`/`AGENTS.md`（工程纪律，含 skill 迁入/发布门禁）与 `docs/decisions/`；改本 skill 任何文件前必读 `references/maintenance.md`（§6 修改流程）。换新机器需自配 `~/.config/ob-notes/config.json` 指向自己的 kbase（读取顺序见 preflight.md）。旧仓库的"并 main/OKC console"开放项已随原仓库退役作废。
- 已解决：
  - 原"与 OKC 做职责边界对比"——OKC 是本 skill 的**前作**(用户早先 Codex 版，流程过重而重做)，已捞五件并入 v0.3.0；项目记忆之争以 ob-notes dev-log 为准。
  - **mode-decision 是否细化**——判定维持粗分、misfit 走模板层、定可量化触发闸（见决策表 2026-06-26）；触发条件挂在上方"继续观察数据"。
  - **dogfood / kb_root 环境**——公司机实测 kbase 与 dogfood 笔记均在 `D:\nexgaios-kbase`，已补建 `config.json` 指向它，dogfood 可复现。
  - **git 身份**——global 即 terryxming，署名正确，无需重设。
  - **package.command 是否要补**——查同级 skill：全 monorepo 每个 `package.command` 都空，属统一约定（打包不在 per-skill 层），无需补、结案。

## 进展时间线（只追加，倒序）

- 2026-07-04：**CHANGELOG 瘦身（123→约 90 行）**。按 maintenance §5 分工把各版本条目里的理由、触发、否决备选拆除——这些属 dev-log 职责且决策表/时间线均已有记录，CHANGELOG 只留"一行主题 + 变了什么"（B 纪律：消除双源复述）。逐版核对无信息丢失后执行；无行为变化、不动版本。
- 2026-07-04：**流程审查后补七处疏漏**（用户走查整套 workflow 后逐个补，分两批）。第一批三处：①`mode-decision` 单对边界扩成三对易混消歧（补「解法卡 vs 主题网」＝解完冻结 vs 持续生长、「解法卡 vs 追问链」＝要结论 vs 要理解路径）；②`distill.md` ③ 补「试错弯路是信号、非操作噪音」，消除与解法卡「踩过的弯路」的自相矛盾（划界＝带根因的失败留、机械操作/日志滤）；③`distill.md` 无问处补优雅引导话术（把「无问顺手存档」转成「聊几句你的疑问」的入口，不硬拒）。第二批四处：④交叉场景补「选哪个当主」判据（未来从哪个入口回来找＝主）；⑤`presentation.md` 增量优先从「建议」强化为「写盘前必做」，并诚实标执行力靠 agent、需 eval 盯；⑥铁律一手存补「连文件名 + 落点一起给」；⑦沉淀动作补「写盘后回一句确认落点」（轻量反馈、非 monitoring 回归）。均现有规则项内部补充，词表/结构/对外版本不变，depmap 25 + lint 全绿。诚实：七处全是纸面补丁、未 dogfood（`[试行待验证]`），边界判据应在 evals 重写时各补对照用例（纪律 F）。记录订正：上一轮误报"dev-log 已记"、实际时间线遗漏，本条一并补全（A4·7 教训见踩坑）。
- 2026-07-04：**架构翻转后首次 dogfood 执行测（隔离子代理）+ 回填一条判据**。装 v1.0.0 到本机 agent 目录，起全新子代理（无设计对话上下文）按新版 ob-notes 把 AWS 记忆文沉淀成主题网笔记（写测试目录、未碰真库）。结果正面：①主题网去骨架生效——结构服从文章逻辑（分类→四维→框架→选型）、未套固定格子；②旧版被压没的机制细节（Mem0 六层模块名、Letta 三工具名 core_memory_append/replace/recall、AgentCore API）**全保留**（source-fidelity 实质闸 + 去骨架合力）；③可信度/反幻觉在起作用（整篇钉待验证、选型钉推测、剔除 WebFetch 脑补的"选型矩阵表"）。暴露一处规范盲区：**追问链 vs 主题网边界**——有连续追问但无认知转折时判据不明示，子代理靠 distill "理解如何推进"反推判对。已回填 SKILL.md mode-decision 补判据（追问有无独立认知增量）。诚实：n=1，一次成功 ≠ 可靠，仍试行待验证；该盲区应在 evals 重写时补一条对照用例（纪律 F）。
- 2026-07-04：**v1.0.0 架构翻转（问答基底 + 信号/噪音分离）**。公司机续工，与用户逐轮对齐后落地宿主 ADR-0011：①建 `distill.md`（信号/噪音引擎：三限定判据 + 问保真答重写四镣铐 + 操作留结果 + source-fidelity）②建 `presentation.md`（三呈现骨架，主题网去骨架、mastery-lens 挂其下）③删 mode-a-research/practice/dialogue ④SKILL workflow 翻转 + metadata ⑤归属表 26→25、depmap 全绿 ⑥修 5 处活跃死引用 + frontmatter-tags 两处措辞（"三套模板"、"研究型按由浅入深"与去骨架矛盾）+ CHANGELOG 重写 [1.0.0]。主题网去骨架的诱因是用户以 AWS 记忆文为例点破"研究型套骨架削足适履"。evals 执行用例待重写（用户定：暂不跑评测）。
- 2026-07-03：**v1.0.0 候选补问答实录型**。用户指出刚写入的《Codex 执行仓库纪律三次失守》被误写成实战踩坑复盘，与知识库既有《MCP 实战·工具加载与粒度：问答实录》《MCP 实战·密钥与信任边界：问答实录》体例不一致；追问后确认 research/practice 都不覆盖"连续追问/不要压缩/保留学习路径"。动作：①Obsidian 笔记改名并重写为《Codex 执行仓库纪律三次失守：问答实录》；②新增 `references/mode-a-dialogue.md` 和 `dialogue-template`；③tag-system 增 `类型/问答实录`；④SKILL.md mode-decision 改为 research/practice/dialogue 三分；⑤evals 增问答实录触发与执行用例。待 lint/depmap/安装验证。
- 2026-07-03：**v1.0.0 候选改造初步收敛**。按用户确认：①摘除写项目目录能力，删除 `mode-b-devlog.md`；②删除 monitoring 回访机制与 `monitoring.md`，frontmatter 去掉 `read_count`/`last_read`；③tag 体系移除 `类型/项目日志`；④preflight 落点统一为 `{kb_root}/00 - raw/00 - inbox/`；⑤trigger/evals 增 dev-log 负例，项目决策正例改为 Obsidian-only。该步先把受控词表 31→25 项；随后同日补问答实录型后为 26 项。
- 2026-07-03：**执行评测第 1 轮：with-skill 两组全胜（独立盲评 grader，位置对照排除偏差）**。E1 白纸建笔记 **20:14 大胜**（增益 = 可信度三态自降级、frontmatter 可索引、第一屏摘要、适用边界）；E2 dev-log 更新 **20:18 小胜**（增益 = 被推翻决策就地"已过时"删除线留痕；差距小属预判混杂——预置 fixture 本身即 skill 模板，baseline 靠格式跟随得分）；E3 铁律一双侧零写盘（with 侧教科书：拒编造 + 停问 + 未新建目录；baseline 侧归因混杂——unstage 后子代理在仓库 cwd 读到 `skills/ob-notes` 源照做，**"skill 源在 cwd"本身即泄漏**，干净 baseline 需完全无源环境）。机械断言：E1w 9/9、E2w 9/9；差分证据：E1b 结构 0/5（无 frontmatter/可信度/tag）、E2b 无删除线留痕。**G② 执行侧"优于 baseline"初步达标（k=1）**；正式发布仍待 G④（dist 构建未建）。方法（可复用）：双沙箱 w/b 防交叉、config 挪移防写真库、两波串行防 skill 互见、盲评 A/B 反向排位。
- 2026-07-03：**触发评测第 1 轮（k=1）满分：20/20**——正例 10/10 触发（显式/隐式/情境/typo/竞争全命中）、负例 10/10 正确拒绝、**误触发 0（G 全局底线达标）**。方法：每条用例一个隔离子代理收 query 原文（无评测框架）、解析其转录 `Skill(ob-notes)` tool_use 客观判定；写盘隔离 = 临时挪走 `~/.config/ob-notes/config.json`，铁律一顺带实测通过（T1/T8/T9 走到写盘全部停下来问、零写盘、零编造）。事故与教训：①20 并发瞬间打满限流、10 个子代理被掐（其中 7 个已留下激活证据仍有效，F3/F9/F10 补跑）——**spawn 须分批（≤5）**；②F6"记住用 pnpm"被子代理当真实偏好写入宿主记忆——**负例的"正确行为"也有副作用，跑完须巡检**；③T1 在仓库 cwd 里 grep 出用例文件识破评测——触发判定不受污染（激活在先），但**执行评测须换干净 cwd**（环境泄漏）。诚实标注：k=1 摸底轮；pass^k 加采样与执行评测（baseline 对照）未跑，G② 尚未完全达标。
- 2026-07-03：**发 v0.8.0（MINOR）**——SKILL.md 内容质量专项审查（执行模拟镜头）：①写入侧监控指令拿走（监控暂缓却无条件命令记 jsonl，每次沉淀会被 preflight 多问一次；monitoring.md 与复盘引用保留）②收尾触发收窄并与触发节"问一次"对齐 ③铁律三倒置指代修正。SKILL.md depends_on 去掉 jsonl-schema/revisit-signal，depmap 重跑图变化确认。教训：审查结论须声明镜头与覆盖面——上一轮结构审查曾误背书"设计无问题"。
- 2026-07-03：**迁入 `nexgaios-skills-dev` 仓库 + 发 v0.7.1（PATCH）**。按宿主 H 流程收编：清 README/skill.yaml/.claude-plugin（杂物与双源）、dev-log/CHANGELOG 按宿主 ADR-0006 留域内、SKILL.md frontmatter 字符串化过 skills-ref 桶一、补 evals（触发 20 + 执行 3，用例经用户过目）、打基线 tag `ob-notes/v0.7.0`。随后全文件审查修复：build_depmap 解析兼容两式（修字符串化引入的解析回归——SKILL.md 三核心规则项曾被误报孤儿且仅 warning 放行）、归属表有家的孤儿升 error、description 补"何时不用"、maintenance §3/§5 对齐新语境。原仓库整体退役（用户删除）。
- 2026-06-27：v0.7.0 **受控验证（A/B+N dogfood）打脸诊断**。开 5 个干净 subagent 冷沉淀同一篇 AWS 文章——旧版(scratchpad 副本、source-fidelity 还原)×2 + 新版×3，同 prompt、唯一变量是 skill 路径。发现：①当初"压缩过狠"**5 次 fresh 全没复现**（带不带 fix 都没）→ 大半是 **run 方差、非确定性缺陷**；②fix 的设计效果（H3 粒度覆盖表 + Mem0 六模块枚举）只在 **2/3 新版**出现、**0/2 旧版**，方向对但不保证，且有 WebFetch 取数方差 confound；③大部分机制恢复 + 逮 fetch 幻觉是**基线行为**（铁律二/三），非 fix 之功。决策：v0.7.0 **留**（无害、在该生效处生效、零回退），但把"压缩过狠"从"确定性 bug"**降级为"低概率坏抽样 + 最细粒度偶失"**。教训：N=1 + 自演满分卷会高估可靠性，须 A/B+N；评测会打脸诊断，要接受。开放项：最细粒度命中率现仅 N=3 的 2/3，要当真比率需 N≥10。本轮成果另沉淀为知识库笔记《高质量 Skill 工程：问答实录》。
- 2026-06-27：发 v0.7.0（source-fidelity 仪式闸→实质闸 MINOR）。网页对话里用 dogfood 笔记《Agent 记忆模块最佳实践（AWS）》复盘 source-fidelity：笔记虽出覆盖表，却把各框架 H3 机制（Mem0 六层模块名、双 LLM、Letta 工具名/内外记忆定义）压没——核对原文确认这些原文确有、被笔记丢了（保真 bug）；而"双 LLM 怎么协作、递归摘要算法"原文本就没有（源上限、非 bug）。治理：覆盖表锁最细粒度、放行改实质闸（机制能否只凭笔记读懂）、保留清单补机制/确切名 + 源上限护栏。提及扫描确认无别处复述派生事实、无联动；build_depmap 验 MECE、图结构不变。
- 2026-06-26：盘点 dev-log 待办并闭环。删去旧模板 dogfood `agent-memory.md`（由终态 `Agent 记忆模块最佳实践（AWS）.md` 取代、去掉"样板"标签）；关掉 mode-decision（已决）、kb_root 环境、git 身份、package.command（查证全 monorepo 皆空、属约定）四项，移入"已解决"；剩"观察沉淀数据"开着，"并 main / PR"留作跨范围单独决策（本分支还驮 OKC console）。
- 2026-06-26：发 v0.6.0（漂移根因治理 MINOR）。审计追到根因 = 内容反范式（同一事实多份拷贝→更新异常），且 SSOT 原只覆盖"规则定义"、没延伸到"派生事实"层。治理：归属表 / SKILL 引用清单的计数与名单去重（改引用 / 去数，顺修一处已漂坏例名单）、quality-check §1 改测产出、maintenance 立"SSOT 管派生事实"原则 ＋ §6 加提及扫描。评估后否决配置式哨兵 lint（过度工程、看护残渣、同源漏洞）。无新规则项、图结构不变。
- 2026-06-26：发 v0.5.1（口径校正 PATCH）。迭代审计揪出旧口径残留并修正：多处"四测"→实为五测（掌握测试已并入）、实战命名 / 双链 / 监控示例 slug→标题式、anti-patterns 第一屏字段对齐新 30 秒读法、30 秒读法"边界"与正文"适用边界"消歧；SKILL 引用清单补全 layout-rule / mastery-lens。无行为变化、图结构不变。
- 2026-06-26：发 v0.5.0（破坏性）。以 dogfood 笔记打磨出终态样板后回灌：naming-rule 改"文件名=显示标题"、研究/实战模板去 H1、30 秒读法字段升级（是什么/解决什么/最重要结论/怎么用/前置/边界）、frontmatter-spec 写清三处标题关系；并在库里落一个极简阅读型 CSS snippet（呈现层、库级、不进 skill）。build_depmap 验 MECE 通过（无新规则项、图结构不变）。
- 2026-06-26：格式/信息设计深挖 + 回灌 v0.4.0。以 AWS dogfood 笔记反复打磨样板，否掉两条弯路(决策工具式倒排序、充分利用语法/做成章节框架)，确立"研究型笔记=由浅入深的学习材料、掌握靠行文功力而非章节、版式克制"；落为 `mastery-lens` + `layout-rule` 两规则项 + `quality-rubric` 掌握测试(均 MINOR、不动模板结构，规则项 29→31)，走完 §6。呈现层(Obsidian 主题/CSS，库级)列为下一步单独处理(用户要的"先1后2"之2)。
- 2026-06-26：质量梳理 + 修 F1 行尾 bug。系统读完全部 16 文件、跑两层校验(build_depmap 与 monorepo validate 均通过、29 规则项 MECE 全绿)。结论：设计强、验证薄(仅 1 篇 dogfood)。修 `build_depmap.py` 跨平台行尾 bug(F1，见踩坑) + README 对齐 monorepo(F5)；按"维护者-only、对外零影响"判定不升版本、不动 CHANGELOG。F2(验证薄)归入下一步第 1 条、F3(revisit-signal 依赖 agent 自觉)留作监控层激活前的已知最弱环。
- 2026-06-26：公司机首日续做。核对环境——git 身份(global 即 terryxming)、kb_root、dogfood 笔记(`agent-memory.md`)经查均在本机 `D:\nexgaios-kbase`，补建 `~/.config/ob-notes/config.json` 指向它(故旧续做提示①"公司机没有库/笔记"实测不成立)。就 mode-decision 是否细化形成判断并记入决策表：维持粗分、misfit 走模板层、定可量化触发闸。
- 2026-06-26：首次真实沉淀 dogfood + 推送 GitHub。配 kb_root（本机）→ 把 AWS 记忆文章沉淀成研究型笔记落 inbox，v0.3.0 三特性真实写盘验证通过；监控层按用户选择暂缓。本地两个 commit(v0.2.0/v0.3.0) + 本条 dev-log 更新推送 `origin`，交接明天到公司续做。
- 2026-06-26：从前作 OKC 捞取五件并入，发 v0.3.0。读穿 OKC 全部 reference，判定"捞编辑智慧、丢流程机器"——并入 source-fidelity/anti-patterns/quality-rubric 三规则项(2 新 reference) + 研究/实战模板增强。受控词表 26→29 项，build_depmap 验 MECE 通过、反向索引确认新规则项被正确依赖。
- 2026-06-26：收编进 `nexgaios-skills` monorepo——拍平 `ob-notes-repo/ob-notes` → `skills/knowledge-management/ob-notes`，补 `skill.yaml`、重生成 `catalog.yaml` 与分组 README、去掉外壳层 LICENSE，修正 README/CHANGELOG 里 `ob-notes/...` 旧相对路径。`validate --all` 全绿。澄清并作废了交接文档里"给目录做 git init"的旧建议（在 monorepo 子目录 init 会造成嵌套 repo）。
- 2026-06-26：Claude Code 接手续做，处理演练暴露的三个待迭代问题，发 v0.2.0。按 maintenance.md 修改流程查影响面 → 改 frontmatter-tags.md(唯一家) + research/practice 骨架联动 → build_depmap.py 验 MECE 通过(图无变化) → 记 CHANGELOG 与本 dev-log。
- 2026-06-26：用 AWS《Agent 记忆模块最佳实践》文章做真实沉淀演练，产出研究型笔记一篇，暴露上述三个待迭代问题。
- 2026-06-26：补本 dev-log，交接给 Claude Code 续做。
- 2026-06-26：完成打包。处理了 frontmatter 标准合规(字段移入 metadata，连带改脚本解析与 maintenance.md 文档)、清除私人路径泄漏。产出 .skill 包 + 仓库 zip。
- 2026-06-26：写完全部 references（preflight/frontmatter-tags/三套模板/monitoring），逐个跑脚本验证 MECE。
- 2026-06-26：定稿地基（maintenance.md 治理宪法 + build_depmap.py + 依赖图），实测 5 类违规拦截。彻底 SSOT 改造（脚本从归属表动态解析词表）。
- 2026-06-26：SKILL.md 经三版迭代。v1→v2 修审计问题；v2→v3 落实 MECE(引用不复述)、去过程化、description 全中文、复盘逻辑修正。

## 踩坑记录（只追加）

- 2026-07-04 Edit 替换含中文标点的行（README 索引、CHANGELOG）时 old_string 用半角冒号/逗号匹配不上 `[已验证]` — 根因：仓库中文文档标点是全角，凭记忆写半角对不上、工具的 \uXXXX 兜底也救不了标点差异 — 解法：先 Read 取精确全角文本再 Edit，构造 old_string 不凭记忆、精确复制。
- 2026-07-04 主梁"先建后删"中间态（新文件已 provides、旧文件未删）跑 depmap 报 source-fidelity/mastery-lens 重复定义 `[已验证]` — 根因：新旧唯一家并存、SSOT 冲突，是预期中间态 — 解法：该批不在中间态跑校验，删旧 + 改 SKILL 后一次跑绿（"先建后审可回退"策略的正常代价）。
- 2026-07-03 SKILL.md frontmatter 字符串化后 build_depmap 把三个核心规则项报成孤儿 `[已验证]` — 根因：parse_fm_list 只认 `[a,b]` 流式格式；且孤儿仅 warning、exit 0，声明断裂被静默放行 — 解法：解析兼容流式列表与逗号字符串两式；归属表已声明唯一家的孤儿升 error（不阻断的告警会被无视）。
- 2026-06-26 官方 package_skill.py 报错 "Unexpected key(s) in frontmatter: depends_on, provides, version" — 根因：Agent Skills 标准顶层只允许 name/description/license/allowed-tools/metadata/compatibility `[已验证]` — 解法：把三个自定义字段移到 metadata 下，并同步改 build_depmap.py 的解析正则（从匹配顶层改为匹配缩进字段）。
- 2026-06-26 最终自检发现 preflight.md 含私人路径 nexgaios-kbase `[已验证]` — 根因：举例时写了真实私人路径，发布包不应含 — 解法：`sed -i 's/nexgaios-kbase/my-kbase/g'`，全包复查无残留。
- 2026-06-26 受控词表在代码里存了副本，构成双写隐患 `[已验证]` — 根因：脚本要可执行需要词表，初版硬编码在 CONTROLLED_VOCAB — 解法：改为运行时从 maintenance.md 第1节归属表正则解析，代码内零副本；脚本因此新增 depends_on: ssot-registry。
- 2026-06-26 sed 命令里用 `${PIPESTATUS[0]}` 在 sh 下报 "Bad substitution" `[已验证]` — 根因：PIPESTATUS 是 bash 特性、当前 shell 是 sh — 解法：改用独立命令分别取退出码，避免依赖 bash 专有语法。
- 2026-06-26 `build_depmap.py` 在 Windows 上每次跑校验都把 `dependency-map.md` 标成 modified(`git diff --ignore-all-space` 实为零内容差异) `[已验证]` — 根因：`Path.write_text` 默认 `newline=None`，写盘时把 `\n` 转成平台 `os.linesep`(Windows 即 `\r\n`)，与仓库 LF 版本不符，使"纯只读、仅生成 dependency-map"的脚本反而污染工作区、有误提交 CRLF 翻转之险 — 解法：改用 `open(OUTPUT, "w", encoding="utf-8", newline="\n")` 显式锁 LF(不用 `write_text` 的 `newline=` 参数，那要 Py3.10+)；连跑两次后 git status 干净，验收通过。

## 关联
- [[ob-notes SKILL]]
- [[obsidian-knowledge-curator]]  （**前作**：用户早先的 Codex 版，因流程过重而重做本 skill；v0.3.0 已从中捞取五件编辑智慧并入。未捞部分见"下一步"。）
