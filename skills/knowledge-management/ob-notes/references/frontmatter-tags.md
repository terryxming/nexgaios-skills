---
name: frontmatter-tags
metadata:
  version: 0.2.0
  provides: [credibility-spec, tag-system, frontmatter-spec, linking-convention, naming-rule, datestamp-rule]
  depends_on: []
---

# 笔记格式规范 — frontmatter、tag、可信度、链接、命名、日期

本文件是所有笔记**格式细节**的唯一真相源。三套模板（research / practice / devlog）和铁律三、四都引用这里，不在别处重复定义。**写任何笔记前必读本文件。**

## 目录

- [1. frontmatter-spec：frontmatter 字段规范](#fm)
- [2. tag-system：三轴 tag 体系](#tag)
- [3. credibility-spec：可信度三档](#cred)
- [4. datestamp-rule：日期与过时标注](#date)
- [5. linking-convention：双链与 callout](#link)
- [6. naming-rule：文件命名](#name)

---

<a id="fm"></a>
## 1. frontmatter-spec：frontmatter 字段规范

每篇笔记顶部用 YAML frontmatter。字段分两类——内容字段（描述这篇笔记）与机制字段（供监控/复盘用）。

```yaml
---
title: 一句话标题
date: 2026-06-25            # 创建日期 YYYY-MM-DD
updated: 2026-06-25        # 最后更新日期，每次追加时刷新
source: claude             # 产出来源 agent / 任务名
source_url:                # 可选：原文/一手出处链接，内容有外部来源时填（见约定）
tags: [类型/研究, 可信/已验证, 状态/持续]   # 笔记存中文 tag，见第 2 节
read_count: 0             # 回访信号，读取时机械 +1（见 monitoring.md 的 revisit-signal）
last_read:                # 最后读取日期，读取时更新
---
```

约定：
- `date` 创建后不变；`updated` 每次追加内容时刷新（与 datestamp-rule 配合）。
- `source_url`：**可选字段**。内容有外部出处（文章、博客、官方文档、视频等）时，填一手原文链接——便于三个月后溯源，也便于把 `[待验证]` 升档前回查一手来源（与 credibility-spec 配合）。研究型/实战型有外链来源时尤其要填；纯对话产出或 dev-log 无外部出处时留空或省略。一篇有多个来源时写成 YAML 列表。
- `read_count` / `last_read` 的更新行为由 monitoring.md 的 revisit-signal 定义；本文件只声明字段存在与含义。
- frontmatter 内不出现尖括号等可能被误解析的字符。

---

<a id="tag"></a>
## 2. tag-system：三轴 tag 体系

tag 少而正交，分三轴：类型、可信、状态。每篇笔记每轴各取所需，不堆砌冗余 tag。领域 tag（如 ai / infra）**不在此预设**——那属于知识库下游路由层，本 skill 不抢这个活。

**中英双轨：笔记里实际存储中文 tag（单一真相，给人在 Obsidian 里直接可读）；英文别名仅供 agent 理解语义、对接下游路由或依赖系统时使用，不写进笔记。** 改名时只改下表（中文为主键），英文别名随之更新——一处维护，无双存。

| 中文 tag（笔记实际存储） | 英文别名（对接用，不入笔记） | 含义 |
|---|---|---|
| `类型/研究` | type/research | 研究型知识，主题深挖、长期生长 |
| `类型/实战` | type/practice | 实战型知识，一次性解决的具体问题 |
| `类型/决策` | type/decision | 决策记录（做了什么决定、为什么） |
| `类型/踩坑` | type/pitfall | 踩坑记录（现象/根因/解法） |
| `类型/项目日志` | type/project-log | 项目开发日志（Mode B 的 dev-log） |
| `可信/已验证` | trust/verified | 跑通或查证过 |
| `可信/待验证` | trust/unverified | agent 给出但未验证 |
| `可信/推测` | trust/speculation | 推测、推断或观点 |
| `状态/持续` | status/living | 持续生长中 |
| `状态/稳定` | status/stable | 已稳定 |
| `状态/待复核` | status/stale | 可能过期、待复核 |

说明：
- 三轴用 `/` 前缀形成 Obsidian 嵌套 tag，便于按轴分组浏览。
- 可信轴三值与第 3 节可信度三档同义、复用——可信轴 tag 标整篇总体可信度，第 3 节的行内标签标单条结论，粒度不同。
- 状态轴主要给研究型笔记防腐化用（复盘时筛"标了持续却久未更新"的可能过期笔记）。

---

<a id="cred"></a>
## 3. credibility-spec：可信度三档（铁律三的细则）

每条结论性内容必须标可信度。**判据是"内容是否已亲验"，不是"信源是否可信"**——这两者最容易混（演练里就把"权威文章这么说"当成了已验证，其实只是信源可信）。三档定义：

- **已验证 / verified**：**内容本身**已被亲手证实——你或 agent 实际跑通了命令、复现了结果，或亲自核对过一手权威来源（官方文档 / 源码 / 规范原文）确认无误。关键在"亲验"，不是"读到过"。
- **待验证 / unverified**：**未经亲验**的内容，无论信源多可信。包括：在可信文章 / 博客 / 他人转述里读到、但没回一手出处核对也没跑通的结论；agent 顺口给的最佳实践；未实际执行的方案。**拿不准默认落这一档**，宁可低估不可高估。
- **推测 / speculation**：明确的猜测、推断或个人观点，连可信信源都谈不上。

> [!warning] 信源可信 ≠ 内容已亲验
> "某官方博客说 X"——可信的是"博客这么说"，不是"X 为真"。只是读到、没回一手文档核对、没跑通，一律标 `[待验证]`，并在 frontmatter 的 `source_url` 留出处便于日后回查。只有当你亲自核对一手来源或复现过，才升到 `[已验证]`。

**标记格式**：行内用反引号标签，紧跟在结论后：

```markdown
- plan mode 用 /plan 进入 `[已验证]`
- 长 prompt 后段规则遵守度更低 `[待验证]`
- 这个设计以后可能要拆分 `[推测]`
```

多条同源结论也可在小节开头统一声明可信度，再列条目。可信轴 tag（第 2 节 `可信/*`）用于整篇笔记的总体可信度概览，行内标签用于单条——两者粒度不同，配合使用。

---

<a id="date"></a>
## 4. datestamp-rule：日期与过时标注（铁律四的细则）

向已有笔记追加内容时：

- **每条新增带日期**：`(2026-06-25)` 形式前缀或后缀，并刷新 frontmatter 的 `updated`。
- **不覆盖历史**：新信息推翻旧结论时，**保留旧的**、不静默删除。用删除线 + 过时标注：

```markdown
- ~~旧结论：X 不支持 Y~~（已过时 2026-06-25，原因：v2.2 起已支持）
- 新结论：X 现已支持 Y `[已验证]`
```

认知如何演化本身就是高价值信息，保留它。

**例外**：项目记忆（Mode B）里的"当前状态 / 下一步"块是**覆盖更新**的——它表达"此刻进展"，不需要历史堆叠；但同文件的"进展时间线 / 决策 / 踩坑"块仍只追加不删。该例外的具体应用见 mode-b-devlog.md。

---

<a id="link"></a>
## 5. linking-convention：双链与 callout

面向 Obsidian 的格式约定：

- **双链** `[[笔记名]]`：用于缝合相关笔记。交叉场景（见 SKILL.md mode-decision）下，主笔记用双链回指另一侧产物。不滥用——只在真有关联时建链，避免制造噪音链。
  - **建链前先查目标是否存在**：`[[X]]` 指向不存在的笔记会在 Obsidian 里变成死链。建链前先按 naming-rule 在知识库确认目标笔记确实存在，再建链。
  - **目标尚未建时显式标注，不留隐形死链**：若确实想预留指向一篇"该建但还没建"的笔记，在链后加 `(待建)`，如 `[[loop-engineering]] (待建)`——把它变成一个明确的待办钩子，复盘时据此补建，而非一条看不见的断链。
- **callout**：关键信息用 Obsidian callout 突出。常用：
  - `> [!summary]` TL;DR / 一句话结论
  - `> [!warning]` 坑 / 注意事项
  - `> [!note]` 补充说明
- **代码块**：命令、配置、报错一律用带语言标注的代码块（` ```bash ` 等），保留原样（呼应铁律二）。

---

<a id="name"></a>
## 6. naming-rule：文件命名

- 研究型（一主题一笔记）：以主题命名，稳定不变，如 `loop-engineering.md`，便于长期追加与双链。
- 实战型（一事一笔记）：主题 + 日期，如 `claude-plan-mode-2026-06-25.md`，写完冻结。
- 开发日志：固定名 `dev-log.md`（落点见 preflight.md landing-rule）。
- 命名用小写 + 连字符，不含空格、斜杠、引号等会破坏路径或双链的字符。
