---
name: ob-notes
description: 把与 agent 对话中产生的高价值信息（决策、踩坑、知识点、方案取舍、研究结论、项目进展）按统一规范沉淀成结构化 Markdown 笔记，回写到 Obsidian 知识库或项目目录。当用户说沉淀、记录、回写、存一下、写进笔记、记到 obsidian、更新 dev-log，或要求把对话里的上下文、决策、经验教训、研究结论、项目进展保存成笔记时使用——即使没有明说文件格式。项目类任务收尾、出现值得留存的决策或进展时也应触发。涉及把对话内容长期保存以备日后复用时务必使用本 skill，不要自行随意写 Markdown。
metadata:
  version: 0.3.0
  provides: [mode-decision, iron-laws, trigger-rule]
  depends_on: [kb-root, landing-rule, preflight-flow, credibility-spec, tag-system, frontmatter-spec, datestamp-rule, research-template, practice-template, devlog-template, jsonl-schema, revisit-signal, review-flow, maintenance-flow, source-fidelity, anti-patterns, quality-rubric]
---

# ob-notes — 对话价值沉淀

把一次对话里真正有价值的信息，按稳定规范抽取、结构化、格式化，回写到正确的位置。口头讨论里最值钱的东西（为什么做某个决策、踩了什么坑怎么解的、一个验证过的知识点）会随对话结束蒸发；随手让 agent "记一下"又常出四类毛病：不知道记什么、压缩过狠、格式丑、没重点。本 skill 用固定规范钉死这四点，并让遵循 Agent Skills 标准的多个 agent（Claude / Codex 等）产出一致的笔记。职责到"把格式正确的笔记投递到正确落点"为止；下游路由分发、Wiki 编译不归本 skill 管。

`{kb_root}` 表示可配置的知识库根路径，其定义与读取顺序见 `references/preflight.md`（规则项 kb-root），本文件只引用、不重复定义。

---

## 铁律

每次沉淀都必须守住这五条，不可妥协。它们是命令；命令所引用的细节规范（如可信度格式、日期标注格式）住在各自的 reference 文件里，本文件只下令、不复述。

**铁律一·先校验，绝不写到不确定的地方。** 任何写盘前，先按 `references/preflight.md` 校验环境。目标目录不存在就停下来问用户，绝不静默新建、绝不退而写到当前目录。理由：用户最大的恐惧不是"没沉淀"，而是"以为沉淀了、其实写丢或写错地方了"——失败可重试，静默写错无法挽回。当前 agent 无写入能力时，不要假装成功，把内容直接贴出来让用户手存。

**铁律二·保留确切细节，禁止过度概括。** 宁可留原始具体内容，也不要压成抽象描述：确切的命令、报错原文、数字、路径、版本号、配置片段一律原样保留。反例——把"2.1.3 版 Windows 上 Shift+Tab 跳过了 plan mode，需改用 /plan"压成"快捷键有兼容性问题"，后者三个月后毫无复用价值。概括是模型本能，要刻意对抗。压缩过狠的具体长相见 `references/anti-patterns.md`（规则项 anti-patterns）；沉淀网页/长文/报告时，按 `references/mode-a-research.md` 的 source-fidelity 做原文结构覆盖，别把长文压成观点卡。

**铁律三·每条结论标可信度。** 对话可能是错的：agent 会自信地说错、中途结论会被推翻。忠实记录而不甄别，等于把错误固化成带格式的"伪知识"，比不记更危险。故每条结论性内容必须标可信度。三档的定义与确切标记格式见 `references/frontmatter-tags.md`（规则项 credibility-spec）——写笔记前已要求读该文件，照其格式标即可。

**铁律四·追加带日期，不覆盖历史。** 向已有笔记追加内容时带日期；新信息推翻旧结论时保留旧的、不静默覆盖。其确切的日期与过时标注格式、以及"项目记忆当前状态块可覆盖更新"这一例外，见 `references/frontmatter-tags.md`（规则项 datestamp-rule）。

**铁律五·项目类对话先读 dev-log，收尾问是否更新。** 进入项目相关任务时，先查该项目是否已有 dev-log，有则先读以恢复上下文（dev-log 模板与落点见 `references/mode-b-devlog.md`）。任务收尾时主动问一句是否更新 dev-log。判定"收尾"的可操作信号见下方触发一节。除此之外不在对话中途打断用户。

---

## 判定沉淀类型

动手前先分清这次沉淀的是**知识**还是**项目记忆**——这一步决定后续读哪个模板、落到哪里。先用实例对照，拿不准再看对应模板文件的边界说明。

**Mode A — 知识沉淀**：可复用的知识点 / 研究结论 / 踩坑 / 方案取舍，复用者是"未来任意场景的你"，落 Obsidian 知识库。
- "loop engineering 是什么"一路深挖研究 → A 研究型。
- 查清"Claude plan mode 用 /plan 进入" → A 实战型（一个独立知识点）。

**Mode B — 项目记忆**：某项目"当时为什么这么做、做到哪了"，复用者是"未来继续做这个项目的你和 agent"，落该项目自己的目录。
- 开发某功能时的架构取舍 / 踩坑 / 进度 → B（属于那个功能所在项目）。
- 正在做的就是某个 skill 本身 → B（落该 skill 文件夹）。

Mode A 再分子类型：偏"持续生长的主题知识"走研究型，偏"一次性解决的具体问题"走实战型。

**交叉场景**（研究着就动手做了 / 做着沉淀出通用知识）：不硬切两半。选一个主落点（以做项目为主→B，以研究为主→A），另一侧产物在主笔记里用 `[[双链]]` 回指缝合，保持上下文连续。

---

## 沉淀动作

判定类型后，按需读取对应 reference 并据其规范产出笔记。各文件何时读、提供什么，见末尾引用清单。要点：

- **写入前必读对应模板**（research / practice / devlog 三选一）与 `references/frontmatter-tags.md`，严格套用其模板、清单与格式——不要凭印象写，这是防格式飘的关键。抽取时执行铁律二、三；过滤噪音时对照 `references/anti-patterns.md`（六类坏例与改写）。
- **写盘前过一遍质量自检**：落盘前按 `references/quality-check.md` 的四测（quality-rubric：30秒阅读 / 信号噪音 / 证据 / 复用）自查，不合格先重写再写——这是写盘前的质量闸，与复盘的事后批量复查分工不同。
- **落点由 `references/preflight.md` 的 landing-rule 决定**（Mode A 入知识库 inbox，Mode B 跟项目走），本文件不重复落点路径。校验未过则按铁律一停下来问。
- **写入后记监控**：按 `references/monitoring.md` 追加一条 jsonl 日志（jsonl-schema），并对读取过的笔记更新回访信号（revisit-signal）。监控数据落 `{kb_root}` 下的中立位置、不进本 skill 文件夹（skill 会被覆盖）；dev-log 是例外，它属于具体项目、跟项目走。

---

## 触发

- **显式**：用户说"沉淀 / 记录 / 回写 / 存一下 / 记到笔记"等——必应。
- **收尾**：项目类任务出现可操作的收尾信号时，主动问一次是否更新 dev-log。收尾信号满足任一即可：用户说出"搞定了 / 先这样 / 完成了 / 下次再说 / 今天到这"之类收束语；一个明确交付物刚产出；用户转向无关新话题。仅此一个主动时机，门槛要高，不在中途反复打断。

---

## 复盘

每两周一次，按 `references/monitoring.md` 的 review-flow 读监控日志与回访数据，产出可执行结论。注意：**回访次数低不等于该砍**——低频但关键的"保险型知识"（如某个罕见报错的解法）正是本 skill 要保护的对象，删除决策永远留给人。复盘重心放在不会误杀价值的维度：可信度分布（"待验证 / 推测"占比过高说明笔记水分大、该回头验证）、孤儿笔记（无任何双链、游离于体系外）、长期未更新的 living 笔记（标了"持续生长"却久未动、可能腐化）。复盘服务于维护知识质量，不替用户做删除。

---

## 引用文件（按需读，各注明时机）

- `references/preflight.md` — **每次写盘前必读**：`{kb_root}` 读取、落点规则、存在 / 可写校验、跨 OS 路径归一、并发安全。
- `references/mode-a-research.md` / `mode-a-practice.md` / `mode-b-devlog.md` — **判定类型后读对应一个**：模板 + 该记 / 该丢清单 + 边界示例（mode-b 另含与 CLAUDE.md/AGENTS.md 打通）。
- `references/frontmatter-tags.md` — **写任何笔记前必读**：frontmatter 规范、三轴 tag、可信度标记、日期 / 过时标注、双链 / callout、命名。
- `references/anti-patterns.md` — **抽取 / 过滤噪音时对照**：六类坏笔记（流水账 / 空泛 / 过度提炼 / 格式炫技 / Agent-only 等）的坏例与改写。
- `references/quality-check.md` — **写盘前自查**：30秒阅读 / 信号噪音 / 证据 / 复用四测，不合格先重写。
- `references/monitoring.md` — **写入后及复盘时读**：jsonl 字段、回访信号、复盘查询。

---

## 维护本 skill（仅维护者，沉淀时无需理会）

修改本 skill 任何文件前，**必读 `references/maintenance.md`**（规则项 maintenance-flow）：它规定每条规则的唯一家、文件间依赖、改动前如何用 `scripts/build_depmap.py` 查影响面、以及版本规则。不遵循会破坏 MECE 与版本契约。
