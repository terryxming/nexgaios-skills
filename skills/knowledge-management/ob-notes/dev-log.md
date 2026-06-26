---
title: ob-notes 开发日志
date: 2026-06-26
updated: 2026-06-26
source: claude (网页对话) / 交接给 Claude Code 续做
tags: [类型/项目日志, 状态/持续]
read_count: 0
last_read:
---

# ob-notes 开发日志

> [!note] 交接说明
> 本文件是 ob-notes 这个 skill 自身的项目记忆（Mode B）。它在一个 Claude 网页对话里设计成型，现交接给 Claude Code 续做。**接手前请先读本文件 + SKILL.md + references/maintenance.md**，即可恢复全部设计上下文，无需原始对话记录。

## 项目意图

做一个遵循 Agent Skills 开放标准、可被 Claude/Codex 等多 agent 通用的 skill，把人与 agent 对话中产生的高价值信息（决策、踩坑、知识点、方案取舍、研究结论、项目进展）按统一规范沉淀成结构化 Markdown 笔记，回写到 Obsidian 知识库或项目目录。

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

## 当前状态 / 下一步（覆盖更新）

- 现状：**v0.4.0**（本地已成型，待提交）。`validate --all` 全绿，MECE 通过，**31 个规则项**。v0.4.0 新增"掌握视角"(mastery-lens) + 排版规约(layout-rule) + quality-rubric 掌握测试，把笔记从"记录"推向"驱动掌握"；并以 AWS dogfood 笔记反复打磨出"由浅入深 + 掌握靠行文功力不靠章节框架 + 版式克制"的样板。早前三批工作：
  - **v0.2.0（演练三问题，改在 frontmatter-tags.md 唯一家）**：①可信度收紧(信源可信≠内容已亲验) ②双链防死链((待建)标注) ③新增可选 source_url 字段。
  - **v0.3.0（从前作 OKC 捞取五件"编辑智慧"，丢弃流程重量）**：新增 3 规则项 + 2 reference——①source-fidelity(研究型原文结构覆盖+来源元数据块，防长文压成观点卡) ②anti-patterns(六类坏例库) ③quality-rubric(写盘前四测自检) ④⑤模板加"适用边界/下次怎么用"段、第一屏升级 30 秒读法。全程按 maintenance.md 流程走完。
  - **首次真实 dogfood（验证 v0.3.0 有效）**：拿当初栽过跟头的同一篇 AWS 记忆文章重跑——配好 kb_root、沉淀成研究型笔记 `agent-memory.md` 落知识库 inbox。三特性真实写盘验证通过：可信度全部正确落"待验证"(老坑没再踩)、source-fidelity 覆盖表生效未压成观点卡、第一屏/适用边界/下次怎么用按新模板出。监控层(`_meta`)按用户选择**暂缓未建**。
- 下一步（按优先级）：
  1. 继续观察真实沉淀数据（现有 1 篇 `agent-memory.md`）；攒多了再看 source-fidelity/可信度纪律是否稳定。监控层(`_meta`)等"规律沉淀 + 确认会复盘"时再一句话启用。
  2. **mode-decision 维持粗分、不细化**（2026-06-26 判定，见决策表）——落点轴粗分本就正确，结构需求改走**模板层**而非 mode 层。可量化触发闸：攒够约 10–15 篇真实笔记后，若"一篇硬塞两件事 / 模板大段留空 / 落点纠结"达可观比例，或某类(最可能是偏好/想法/讨论)反复无家可归，才在模板层加 1~2 个、不动 mode；否则不动。
  3. （可选）若日后要独立发布，补 `skill.yaml` 的 `package.command`。
- 卡点：无。
- **续做提示（给接手的你/agent）**：skill 代码全在 git、已推 GitHub，换机器 `git pull` 即续。注意：
  - ① ~~dogfood 那篇笔记与 kb_root 配置在**个人本机**，公司机器上没有、dogfood 不可复现~~ → **2026-06-26 公司机实测更正**：该公司机(用户 EDY)上 `D:\nexgaios-kbase`(含 dogfood 笔记 `agent-memory.md`)与完整 kbase 均在；已补建 `~/.config/ob-notes/config.json` 指向它，**dogfood 在此机可复现**。注意 `config.json` 是 per-machine、不随仓库走——换到无此库或未配 kb_root 的机器仍需另配(读取顺序见 preflight.md)。
  - ② git 身份：本机经查 local 未配、**global 即 `terryxming` / terry.xming@gmail.com**，署名正确；只有换到 global 非此身份的机器才需重设。
  - ③ 本分支是 feature/handoff 分支，尚未并 main、未开 PR。
- 已解决：原"与 OKC 做职责边界对比"——结论是 OKC 是本 skill 的**前作**(用户早先 Codex 版，因流程过重而重做)，已捞五件并入 v0.3.0；项目记忆之争以 ob-notes dev-log 为准。

## 进展时间线（只追加，倒序）

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

- 2026-06-26 官方 package_skill.py 报错 "Unexpected key(s) in frontmatter: depends_on, provides, version" — 根因：Agent Skills 标准顶层只允许 name/description/license/allowed-tools/metadata/compatibility `[已验证]` — 解法：把三个自定义字段移到 metadata 下，并同步改 build_depmap.py 的解析正则（从匹配顶层改为匹配缩进字段）。
- 2026-06-26 最终自检发现 preflight.md 含私人路径 nexgaios-kbase `[已验证]` — 根因：举例时写了真实私人路径，发布包不应含 — 解法：`sed -i 's/nexgaios-kbase/my-kbase/g'`，全包复查无残留。
- 2026-06-26 受控词表在代码里存了副本，构成双写隐患 `[已验证]` — 根因：脚本要可执行需要词表，初版硬编码在 CONTROLLED_VOCAB — 解法：改为运行时从 maintenance.md 第1节归属表正则解析，代码内零副本；脚本因此新增 depends_on: ssot-registry。
- 2026-06-26 sed 命令里用 `${PIPESTATUS[0]}` 在 sh 下报 "Bad substitution" `[已验证]` — 根因：PIPESTATUS 是 bash 特性、当前 shell 是 sh — 解法：改用独立命令分别取退出码，避免依赖 bash 专有语法。
- 2026-06-26 `build_depmap.py` 在 Windows 上每次跑校验都把 `dependency-map.md` 标成 modified(`git diff --ignore-all-space` 实为零内容差异) `[已验证]` — 根因：`Path.write_text` 默认 `newline=None`，写盘时把 `\n` 转成平台 `os.linesep`(Windows 即 `\r\n`)，与仓库 LF 版本不符，使"纯只读、仅生成 dependency-map"的脚本反而污染工作区、有误提交 CRLF 翻转之险 — 解法：改用 `open(OUTPUT, "w", encoding="utf-8", newline="\n")` 显式锁 LF(不用 `write_text` 的 `newline=` 参数，那要 Py3.10+)；连跑两次后 git status 干净，验收通过。

## 关联
- [[ob-notes SKILL]]
- [[obsidian-knowledge-curator]]  （**前作**：用户早先的 Codex 版，因流程过重而重做本 skill；v0.3.0 已从中捞取五件编辑智慧并入。未捞部分见"下一步"。）
