---
name: ob-notes
description: 把人与 agent 对话中产生的高价值信息（决策、踩坑、知识点、方案取舍、研究结论）按统一规范沉淀成结构化 Markdown 笔记，回写到 Obsidian 知识库。当用户说沉淀、记录、回写、存一下、写进笔记、记到 obsidian，或要求把对话里的上下文、决策、经验教训、研究结论保存成可长期复用的笔记时使用。只负责写入 Obsidian，不写项目目录、dev-log、README、代码注释或临时草稿；用户只要求解释、讨论或短期草稿时，不使用本 skill。
metadata:
  version: 1.0.0
  provides: "mode-decision, iron-laws, trigger-rule"
  depends_on: "kb-root, landing-rule, preflight-flow, credibility-spec, tag-system, frontmatter-spec, datestamp-rule, research-template, practice-template, maintenance-flow, source-fidelity, anti-patterns, quality-rubric, mastery-lens, layout-rule"
---

# ob-notes — 对话价值写回 Obsidian

把一次对话里真正有长期复用价值的信息，按稳定规范抽取、结构化、格式化，写回 Obsidian 知识库。口头讨论里最值钱的东西（为什么做某个决策、踩了什么坑怎么解、一个验证过的知识点）会随对话结束蒸发；随手让 agent "记一下"又常出四类毛病：不知道记什么、压缩过狠、格式丑、没重点。本 skill 用固定规范钉死这四点，并让遵循 Agent Skills 标准的多个 agent（Claude / Codex 等）产出一致的 Obsidian 笔记。

职责到"把格式正确的笔记投递到 Obsidian 入口"为止；下游路由分发、Wiki 编译、项目 dev-log、README、代码注释不归本 skill 管。

`{kb_root}` 表示可配置的 Obsidian 知识库根路径，其定义与读取顺序见 `references/preflight.md`（规则项 kb-root），本文件只引用、不重复定义。

---

## 铁律

每次沉淀都必须守住这些铁律，不可妥协。它们是命令；命令所引用的细节规范（如可信度格式、日期标注格式）住在各自的 reference 文件里，本文件只下令、不复述。

**铁律一·先校验，绝不写到不确定的地方。** 任何写盘前，先按 `references/preflight.md` 校验环境。目标目录不存在就停下来问用户，绝不静默新建、绝不退而写到当前目录。理由：用户最大的恐惧不是"没沉淀"，而是"以为沉淀了、其实写丢或写错地方了"。当前 agent 无写入能力时，不要假装成功，把内容直接贴出来让用户手存。

**铁律二·保留确切细节，禁止过度概括。** 宁可留原始具体内容，也不要压成抽象描述：确切的命令、报错原文、数字、路径、版本号、配置片段一律原样保留。反例：把"2.1.3 版 Windows 上 Shift+Tab 跳过了 plan mode，需改用 /plan"压成"快捷键有兼容性问题"，后者三个月后毫无复用价值。概括是模型本能，要刻意对抗。压缩过狠的具体长相见 `references/anti-patterns.md`（规则项 anti-patterns）；沉淀网页/长文/报告时，按 `references/mode-a-research.md` 的 source-fidelity 做原文结构覆盖，别把长文压成观点卡。

**铁律三·每条结论标可信度。** 对话可能是错的：agent 会自信地说错，中途结论会被推翻。忠实记录而不甄别，等于把错误固化成带格式的"伪知识"，比不记更危险。故每条结论性内容必须标可信度。三档的定义与确切标记格式见 `references/frontmatter-tags.md`（规则项 credibility-spec），照其格式标注即可。

**铁律四·追加带日期，不覆盖历史。** 向已有笔记追加内容时带日期；新信息推翻旧结论时保留旧的、不静默覆盖。其确切的日期与过时标注格式见 `references/frontmatter-tags.md`（规则项 datestamp-rule）。

---

## 判定笔记类型

动手前先分清这次沉淀更像**研究型笔记**还是**实战型笔记**。这一步决定后续读哪个模板；两者都只写入 Obsidian。

**研究型笔记**：偏持续生长的主题知识 / 研究结论，复用者是"未来任意场景的你"。
- "loop engineering 是什么"一路深挖研究 → 研究型。
- 对一篇长文、报告、官方文档做结构化吸收 → 研究型。

**实战型笔记**：偏一次性解决的具体问题 / 踩坑 / 决策 / 方案取舍，复用者是"未来遇到同类问题的你"。
- 查清"Claude plan mode 用 /plan 进入" → 实战型。
- 某项目里做过一个值得复用的架构取舍 → 实战型，并用 `类型/决策` 等 tag 标明性质。

项目相关信息只有在包含可复用决策、踩坑、方案取舍、研究结论时才沉淀为 Obsidian 笔记；单纯"今天做到哪了"这类流水进度不收。本 skill 不写项目目录，不更新 dev-log。

**交叉场景**（研究着就动手做了 / 做着沉淀出通用知识）：不硬切两半。选一个主笔记类型，另一侧信息在笔记里用 `[[双链]]` 回指缝合，保持上下文连续。

---

## 沉淀动作

判定类型后，按需读取对应 reference 并据其规范产出笔记。各文件何时读、提供什么，见末尾引用清单。要点：

- **写入前必读对应模板**（research / practice 二选一）与 `references/frontmatter-tags.md`，严格套用其模板、清单与格式。不要凭印象写，这是防格式飘的关键。抽取时执行铁律二、三；过滤噪音时对照 `references/anti-patterns.md`（坏例与改写）；排版按 frontmatter-tags 的 layout-rule 克制用 markdown（每元素一职责、段落优先、callout 克制）。
- **写研究型笔记时，落笔前先过 mode-a-research 的 mastery-lens**（学习闭环自问：能讲清 / 何时不成立 / 能迁到哪 / 连得上谁），让"掌握"从行文里透出来，而非做成"复述""迁移"等章节。
- **写盘前过一遍质量自检**：落盘前按 `references/quality-check.md` 的 quality-rubric 自查（30秒阅读 / 信号噪音 / 证据 / 复用；研究型笔记另加掌握测试），不合格先重写再写。
- **落点由 `references/preflight.md` 的 landing-rule 决定**。本 skill 只投递到 Obsidian 知识库入口；校验未过则按铁律一停下来问。

---

## 触发

- **显式触发**：用户说"沉淀 / 记录 / 回写 / 存一下 / 记到笔记 / 记到 Obsidian"等，或明确要求把对话内容长期保存，必应。
- **边界排除**：用户只是要解释、讨论、临时草稿、README、代码注释、项目 dev-log、项目进度流水时，不使用本 skill。项目任务收尾本身不是触发条件；只有用户明确要把其中的长期价值写回 Obsidian，才执行。

---

## 引用文件（按需读，各注明时机）

- `references/preflight.md` — **每次写盘前必读**：`{kb_root}` 读取、Obsidian 入口落点、存在 / 可写校验、跨 OS 路径归一。
- `references/mode-a-research.md` / `mode-a-practice.md` — **判定类型后读对应一个**：模板 + 该记 / 该丢清单 + 边界示例（research 另含 source-fidelity 原文保真与 mastery-lens 掌握视角）。
- `references/frontmatter-tags.md` — **写任何笔记前必读**：frontmatter 规范、三轴 tag、可信度标记、日期 / 过时标注、双链 / callout、命名（文件名 = 标题）、排版规约（layout-rule）。
- `references/anti-patterns.md` — **抽取 / 过滤噪音时对照**：各类坏笔记的坏例与改写（逐条见 anti-patterns）。
- `references/quality-check.md` — **写盘前自查**：30秒阅读 / 信号噪音 / 证据 / 复用 + 研究型掌握测试，不合格先重写。

---

## 维护本 skill（仅维护者，沉淀时无需理会）

修改本 skill 任何文件前，**必读 `references/maintenance.md`**（规则项 maintenance-flow）：它规定每条规则的唯一家、文件间依赖、改动前如何用 `scripts/build_depmap.py` 查影响面、以及版本规则。不遵循会破坏 MECE 与版本契约。
