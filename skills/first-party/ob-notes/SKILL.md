---
name: ob-notes
description: 把人与 agent 对话中产生的高价值信息（决策、踩坑、知识点、方案取舍、研究结论、连续追问）按统一规范沉淀成结构化 Markdown 笔记，回写到 Obsidian 知识库。当用户说沉淀、记录、回写、存一下、写进笔记、记到 obsidian、问答实录、不要压缩，或要求把对话里的上下文、决策、经验教训、研究结论、追问链保存成可长期复用的笔记时使用。只负责写入 Obsidian，不写项目目录、dev-log、README、代码注释或临时草稿；用户只要求解释、讨论或短期草稿时，不使用本 skill。
metadata:
  version: 1.0.0
  provides: "mode-decision, iron-laws, trigger-rule"
  depends_on: "kb-root, landing-rule, preflight-flow, signal-noise, presentation-modes, source-fidelity, credibility-spec, tag-system, frontmatter-spec, naming-rule, datestamp-rule, anti-patterns, quality-rubric, mastery-lens, layout-rule, maintenance-flow, feedback-loop"
---

# ob-notes — 对话价值写回 Obsidian

把一次对话里真正有长期复用价值的信息，按稳定规范抽取、结构化、格式化，写回 Obsidian 知识库。口头讨论里最值钱的东西（为什么做某个决策、踩了什么坑怎么解、一个验证过的知识点）会随对话结束蒸发；随手让 agent “记一下”又常出四类毛病：不知道记什么、压缩过狠、格式丑、没重点。本 skill 用固定规范钉死这四点，并让遵循 Agent Skills 标准的多个 agent（Claude / Codex 等）产出一致的 Obsidian 笔记。

有长期价值的知识几乎都产生于**问答**——用户的“问”是认知路径的坐标，不是要压缩掉的过程噪音。所以本 skill 以问答为基底：先把对话流里的信号从噪音里分离出来，再按复用目标摆成笔记。

职责到“把格式正确的笔记投递到 Obsidian 入口”为止；下游路由分发、Wiki 编译、项目 dev-log、README、代码注释不归本 skill 管。

`{kb_root}` 表示可配置的 Obsidian 知识库根路径，其定义与读取顺序见 `references/preflight.md`（规则项 kb-root），本文件只引用、不重复定义。

---

## 铁律

每次沉淀都必须守住这些铁律，不可妥协。它们是命令；命令所引用的细节规范（如可信度格式、日期标注格式）住在各自的 reference 文件里，本文件只下令、不复述。

**铁律一·先校验，绝不写到不确定的地方。** 任何写盘前，先按 `references/preflight.md` 校验环境。目标目录不存在就停下来问用户，绝不静默新建、绝不退而写到当前目录。理由：用户最大的恐惧不是“没沉淀”，而是“以为沉淀了、其实写丢或写错地方了”。当前 agent 无写入能力时，不要假装成功——把内容直接贴出来让用户手存，并**连同建议的文件名（按 naming-rule）和落点路径（`{kb_root}` 的 Obsidian 入口）一起给**，让用户复制粘贴就能存对位置，而不是甩一段内容让他自己琢磨怎么放。

**铁律二·保留确切细节，禁止过度概括。** 宁可留原始具体内容，也不要压成抽象描述：确切的命令、报错原文、数字、路径、版本号、配置片段一律原样保留。反例：把“2.1.3 版 Windows 上 Shift+Tab 跳过了 plan mode，需改用 /plan”压成“快捷键有兼容性问题”，后者三个月后毫无复用价值。概括是模型本能，要刻意对抗。从对话流里分离信号与噪音、并守住确切细节的完整方法，见 `references/distill.md`（规则项 signal-noise）；压缩过狠的具体长相见 `references/anti-patterns.md`。沉淀网页/长文/报告时，按 distill.md 的 source-fidelity 做原文结构覆盖，别把长文压成观点卡。

**铁律三·每条结论标可信度。** 对话可能是错的：agent 会自信地说错，中途结论会被推翻。忠实记录而不甄别，等于把错误固化成带格式的“伪知识”，比不记更危险。故每条结论性内容必须标可信度。三档的定义与确切标记格式见 `references/frontmatter-tags.md`（规则项 credibility-spec），照其格式标注即可。

**铁律四·追加带日期，不覆盖历史。** 向已有笔记追加内容时带日期；新信息推翻旧结论时保留旧的、不静默覆盖。其确切的日期与过时标注格式见 `references/frontmatter-tags.md`（规则项 datestamp-rule）。

---

## 分离信号噪音，再定呈现侧重

动手写之前有两步，顺序不能反。

**第一步 · 分离信号与噪音（核心动作）。** 以问答为基底，从这段对话里抽出该沉淀的信号、滤掉噪音——这一步决定**记什么**，是整个 skill 的心脏，必读 `references/distill.md`（规则项 signal-noise）。三条要点：① 判据——「删掉它，一个没有这场对话记忆、不熟这个主题、但懂通用常识的人会不会看不懂」，受损即信号；② 用户的问原样保真，回答重写成给未来读者的讲解（换讲法不换事实）；③ 操作与工具执行留结果不留过程。无问的顺手存档（没消化、只想存档）不归本 skill，交给剪藏/稍后读工具。

**第二步 · 定呈现侧重（mode-decision）。** 信号抽出来后，按**未来最想复用什么**选一种呈现，不是入口处给对话贴类型标签：

- 复用的是**追问路径本身**（连续追问、认知纠错的过程有价值）→ **追问链**
- 复用的是**一条具体解法**（某报错怎么修、某命令怎么用）→ **解法卡**
- 复用的是**一个要长期养的主题**（会反复回来深挖）→ **主题网**

**三种呈现易混时，按这几刀消歧**（都以「未来最想复用什么」为准）：
- **追问链 vs 主题网**：看追问本身有没有独立的认知增量——有认知转折（原以为 X → 发现 Y、被纠错、理解被一步步逼深）→ 追问路径值得复用 → 追问链；追问只是平行映射内容结构的入口（每问对应一个侧面、无转折）→ 问是内容的门 → 主题网，把问作为章节引入织进去。
- **解法卡 vs 主题网**：看解完是否冻结——一次性解决、下次同问题照抄 → 解法卡；会带着新理解反复回来追加 → 主题网。
- **解法卡 vs 追问链**：看复用时要结论还是路径——要照抄一条解法（过程压成解法卡里的「踩过的弯路」）→ 解法卡；要重走一段想通的理解（过程本身是复用对象）→ 追问链。

三种呈现的骨架与纪律见 `references/presentation.md`（规则项 presentation-modes）：追问链、解法卡由形式定结构、有骨架；主题网由内容定结构、不套骨架。**交叉场景**（研究着就动手了 / 解法里带出通用知识）不硬切：选一个主呈现定结构，另一侧信息用 `[[双链]]` 回指缝合。**选哪个当主**：问一句「未来更可能从哪个入口回来找这条知识」，那个是主、另一侧是附带产物——研究里带出解法 → 主题网为主 + 解法压一节并双链；解法里悟出通用原则 → 解法卡为主 + 原则双链到主题网或另立。

项目相关信息，只有在包含可复用的决策、踩坑、方案取舍、研究结论时才沉淀；单纯“今天做到哪了”这类进度流水不收。本 skill 只写入 Obsidian，不写项目目录、不更新 dev-log。

---

## 沉淀动作

按上面两步走，据规范产出笔记。各文件何时读、提供什么，见末尾引用清单。要点：

- **先分离，必读 `references/distill.md`**：signal-noise 判据、问保真答重写四镣铐、操作留结果不留过程；含外部材料时按其中的 source-fidelity 保留原文结构。这一步执行铁律二、三。
- **再按呈现侧重读 `references/presentation.md`**：追问链 / 解法卡有骨架，严格套用其骨架与清单；主题网不套骨架、由内容主导，守求深（mastery-lens）/ 保真（source-fidelity）/ 防腐化三条纪律。过滤噪音时对照 `references/anti-patterns.md`（坏例与改写）；排版按 frontmatter-tags 的 layout-rule 克制用 markdown（每元素一职责、段落优先、callout 克制）。
- **写盘前过一遍质量自检**：落盘前按 `references/quality-check.md` 的 quality-rubric 自查（30秒阅读 / 信号噪音 / 证据 / 复用；主题网另加掌握测试），不合格先重写再写。
- **落点由 `references/preflight.md` 的 landing-rule 决定**。本 skill 只投递到 Obsidian 知识库入口；校验未过则按铁律一停下来问。
- **写盘后回一句确认**：告诉用户沉淀成功、笔记标题与落点路径，让他知道东西落哪了、能去看——这是基本反馈，不是回访监控（那已在 v1.0.0 移除）。

---

## 触发

- **显式触发**：用户说“沉淀 / 记录 / 回写 / 存一下 / 记到笔记 / 记到 Obsidian”等，或明确要求把对话内容长期保存，必应。
- **边界排除**：用户只是要解释、讨论、临时草稿、README、代码注释、项目 dev-log、项目进度流水时，不使用本 skill。项目任务收尾本身不是触发条件；只有用户明确要把其中的长期价值写回 Obsidian，才执行。

---

## 引用文件（按需读，各注明时机）

- `references/preflight.md` — **每次写盘前必读**：`{kb_root}` 读取、Obsidian 入口落点、存在 / 可写校验、跨 OS 路径归一。
- `references/distill.md` — **动手第一步必读**：信号/噪音分离引擎（判据 + 问保真答重写 + 操作留结果不留过程），含引用外部材料时的原文保真（source-fidelity）。
- `references/presentation.md` — **定了呈现侧重后读**：追问链 / 解法卡骨架、主题网的放手写法与掌握视角（mastery-lens）。
- `references/frontmatter-tags.md` — **写任何笔记前必读**：frontmatter 规范、三轴 tag、可信度标记、日期 / 过时标注、双链 / callout、命名（文件名 = 标题）、排版规约（layout-rule）。
- `references/anti-patterns.md` — **分离噪音时对照**：各类坏笔记的坏例与改写（逐条见 anti-patterns）。
- `references/quality-check.md` — **写盘前自查**：30秒阅读 / 信号噪音 / 证据 / 复用 + 主题网掌握测试，不合格先重写。

---

## 维护本 skill（仅维护者，沉淀时无需理会）

修改本 skill 任何文件前，**必读 `references/maintenance.md`**（规则项 maintenance-flow）：它规定每条规则的唯一家、文件间依赖、改动前如何用 `scripts/build_depmap.py` 查影响面、以及版本规则。不遵循会破坏 MECE 与版本契约。

**失败回填**：用户指出本次沉淀产出有问题并要求记录 / 回填时，按 `references/feedback.md`（规则项 feedback-loop）把失败现场捕获成结构化用例暂存——失败案例是本 skill 迭代的燃料，未回填不得发布。未配置 `dev_repo` 的环境该通道惰性。
