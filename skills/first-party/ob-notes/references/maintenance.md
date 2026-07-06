---
name: maintenance
metadata:
  version: 1.4.0
  provides: [controlled-vocab, dependency-spec, version-rule, maintenance-flow, ssot-registry]
  depends_on: []
---

# 维护治理 — ob-notes 怎么被安全地修改

> 本文件是 ob-notes 的"宪法"。**修改本 skill 任何文件前，必读本文件。** 它规定：每条规则住在哪（单一真相源）、文件间谁依赖谁、改动如何检查影响面、如何升版本。
>
> 本文件不参与"沉淀"主流程；它只约束 skill 自身的演化。

## 目录

- [1. 单一真相源（SSOT）与规则归属表](#1)
- [2. 受控词表](#2)
- [3. 依赖声明规范](#3)
- [4. 依赖图脚本 build_depmap.py](#4)
- [5. 版本规则](#5)
- [6. 修改流程（强制）](#6)

---

<a id="1"></a>
## 1. 单一真相源（SSOT）与规则归属表

**核心原则（MECE）**：每一条规则只在一个文件里定义（该文件在 frontmatter 的 `provides` 中声明它）。所有其它文件只能**引用**该规则，不得复述其内容。复述 = 多处维护 = 迟早矛盾。

**这条原则同样适用于"派生事实"**——计数（几测 / 几类）、清单（坏例名单）、示例（命名样例）也不得在多处手抄：可派生的别写死（能引用就引用、能生成就生成，如自动生成的 `dependency-map.md`）；必须就地的用引用而非复述；消不掉的教学拷贝，改约定时按第 6 节做"提及扫描"。**漂移几乎都发生在这一层**——尤其本归属表的"含义"列、SKILL 引用清单这类"天生在转述别处"的地方，要格外警惕。

下表是全部规则项的唯一归属。改某条规则，只改它的"唯一家"；然后按第 6 节检查依赖它的文件是否需要联动。

| 规则项（标识符） | 含义 | 唯一家 |
|---|---|---|
| `kb-root` | 知识库根路径配置变量 `{kb_root}` 的定义与读取顺序 | preflight.md |
| `landing-rule` | Obsidian 入口落点路径规则 | preflight.md |
| `preflight-flow` | 写盘前的环境校验流程 | preflight.md |
| `path-normalize` | 跨 OS 路径形态归一 | preflight.md |
| `credibility-spec` | 可信度三档的定义与标记格式 | frontmatter-tags.md |
| `tag-system` | 三轴 tag 体系 | frontmatter-tags.md |
| `frontmatter-spec` | 笔记 frontmatter 字段规范 | frontmatter-tags.md |
| `linking-convention` | 双链与 callout 使用约定 | frontmatter-tags.md |
| `naming-rule` | 笔记文件命名规则 | frontmatter-tags.md |
| `datestamp-rule` | 追加带日期、过时标注、不覆盖历史 | frontmatter-tags.md |
| `layout-rule` | 排版规约（markdown 元素用途与克制，反炫技） | frontmatter-tags.md |
| `mode-decision` | 呈现侧重判定：消化后按“未来复用什么”选追问链/解法卡/主题网 | SKILL.md |
| `iron-laws` | 铁律本身 | SKILL.md |
| `trigger-rule` | 触发方式与边界排除 | SKILL.md |
| `signal-noise` | 信号/噪音分离引擎：三限定判据 + 正文逐字（重写 vs 编排界线）+ 操作留结果不留过程 | distill.md |
| `transcript-extract` | 所有正文从会话 transcript 逐字扣：结构层保留/滤除 + 操作旁白也滤 + 图片保留 + 跨文件回溯；脚本 extract_transcript.py 为其实现 | distill.md |
| `source-fidelity` | 引用外部材料时的原文保真：结构覆盖，防长文压成观点卡 | distill.md |
| `presentation-modes` | 三种呈现侧重（均综合头 + 逐字正文）：追问链/解法卡按骨架编排逐字块 + 主题网内容主导编排 | presentation.md |
| `mastery-lens` | 主题网的掌握视角：写前自问 + 用挑块/编排体现掌握（不自己写讲解顶替、不做章节） | presentation.md |
| `anti-patterns` | 坏例库与改写策略（各类坏笔记，逐条见 anti-patterns） | anti-patterns.md |
| `quality-rubric` | 写盘前单篇质量自检量表（30秒阅读/信号噪音/证据/复用 + 主题网掌握测试） | quality-check.md |
| `feedback-loop` | 失败案例回填闭环：捕获格式、pending 暂存、转换流程与发布闸（仅维护者） | feedback.md |
| `controlled-vocab` | 受控词表本身（本表第 2 节） | maintenance.md |
| `dependency-spec` | 依赖声明规范（第 3 节） | maintenance.md |
| `version-rule` | 版本规则（第 5 节） | maintenance.md |
| `maintenance-flow` | 修改流程（第 6 节） | maintenance.md |
| `ssot-registry` | 本归属表（第 1 节） | maintenance.md |

注：以下几对易混，特此划清（均不算 MECE 重复）：
- `source-fidelity`（针对**外部来源**：源材料别被压没）vs `anti-patterns`（针对**所有笔记**的通用坏例）——前者管保真、后者管通病，互补不重叠。
- `anti-patterns` 只给坏例与改写方向，**不重新定义**可信度/日期/双链等规则；命中处一律按各自唯一家（如 credibility-spec）处理。
- `mastery-lens`（主题网**写作时**的思考纪律：写前自问、让掌握从字里行间透出）vs `quality-rubric` 的掌握测试（**写盘前**检验掌握有没有透出来）——前者写时心法、后者写后判据，时机不同，不重复。
- `layout-rule`（markdown 元素用途的**正面规约**）vs `anti-patterns` 第 5 条格式炫技（**坏例**）——正例与坏例互补；callout / 双链 / 代码块细节仍归 `linking-convention`，`layout-rule` 不重定义。
- `signal-noise`（判断层：什么进正文 + 「重写 vs 编排」的界线）vs `transcript-extract`（执行层：逐字扣的机械规则，怎么把原话原样扣出）——前者判该留什么、后者管怎么扣，互补不重叠；两者对三种呈现一视同仁，不再按呈现分流。

<a id="2"></a>
## 2. 受控词表

`provides` / `depends_on` 里只能填**上表"规则项"列**中的标识符。新增规则项时：先在上表登记（含唯一家），再在词表生效。词表 = 上表第一列的全集。

标识符规范：kebab-case，语义稳定。**重命名一个标识符是 breaking 操作**（所有引用它的文件都要改），按第 5 节升版本。

<a id="3"></a>
## 3. 依赖声明规范

每个 skill 内的 markdown 文件，frontmatter 把依赖字段放在 `metadata` 下（顶层只保留 Agent Skills 标准允许的 name/description 等键，自定义字段必须收纳在 metadata 容器内，否则官方打包校验会拒绝）：

```yaml
---
name: 文件名（不含扩展名）
metadata:
  version: 语义化版本，与该文件最后修改对应
  provides: [本文件定义的规则项，来自受控词表]
  depends_on: [本文件引用的规则项，来自受控词表]
---
```

SKILL.md 顶层另含 description（触发描述）；reference 文件可只有 name + metadata。

规则：

- `provides`：本文件是哪些规则项的唯一家。**同一规则项只能出现在一个文件的 provides 中**（脚本强制校验）。无定义则写 `[]`。
- `depends_on`：本文件引用了哪些别处定义的规则项。无依赖则写 `[]`。
- 二者的标识符**必须**来自受控词表；未登记的标识符视为错误（脚本报错）。
- **声明分界（规范性依赖 vs 指路引用）**：`depends_on` 只登记**规范性依赖**——执行本文件职责时必须按该规则项的定义产出或校验，该规则变了、本文件不跟着变就会出错的，才登记。仅告诉读者"细节 / 相关内容在哪"的**指路引用**（"见 X 的 Y"式说明、上下游流程描述）不登记——否则依赖图会稠密到失去"改了谁必须联动谁"的信号。判不准时问一句：**该规则项的内容变了，本文件不改会不会出错？** 会 → 声明；不会 → 指路。
- **SKILL.md 特例**：官方 `skills-ref validate` 拒收流式列表、且 Agent Skills spec 要求 metadata 值为字符串，故 SKILL.md 的 `provides`/`depends_on` 写成**逗号分隔字符串**（如 `provides: "a, b"`）；references 文件不受官方校验，保持流式列表。`build_depmap.py` 两种写法都解析。
- **就近原则**：依赖信息住在文件自己身上，不维护任何中心化的手写依赖表。依赖图由脚本从这些声明**派生**。
- 脚本 `build_depmap.py` 自身也是依赖图节点。它在运行时从本文件第 1 节归属表**动态解析受控词表**（不在代码内存副本，彻底单一真相源），因此依赖 `dependency-spec`、`controlled-vocab`、`ssot-registry`（解析逻辑与归属表格式耦合）。在脚本顶部注释里以 `# depends_on: dependency-spec, controlled-vocab, ssot-registry` 形式声明（脚本非 markdown，无 frontmatter，用注释等价表达）。

<a id="4"></a>
## 4. 依赖图脚本 build_depmap.py

**行为契约（纯只读，不可违反）**：

- 只做：扫描 skill 目录所有 `.md` 的 frontmatter + 脚本顶部注释，收集 `provides`/`depends_on`；校验；生成 `references/dependency-map.md`；向控制台打印校验结果。
- **绝不**：修改除 `dependency-map.md` 外的任何文件；读取或写入用户知识库；联网；执行任何其它副作用。
- 仅用 Python 标准库，无第三方依赖。

**校验项（任一失败 → 报错退出，exit code 1）**：

1. **重复定义**：同一规则项出现在多个文件的 `provides` → 报错（违反 SSOT）。
2. **悬空依赖**：某 `depends_on` 的规则项无任何文件 `provides`，且不在受控词表 → 报错。
3. **未登记标识符**：`provides`/`depends_on` 出现受控词表外的标识符 → 报错。
4. **孤儿规则**：受控词表登记了但无任何文件 `provides` → 警告（不阻断，可能是待实现）。

**输出 `dependency-map.md`**：含"本文件由 build_depmap.py 自动生成，请勿手动编辑"头；含两个视图——按文件列出其 provides/depends_on，以及按规则项列出"定义于谁 / 被谁依赖"的反向索引。

**调用**：`python scripts/build_depmap.py`（在 skill 根目录运行）。`dependency-map.md` 预生成并随包发布，便于用户克隆后直接查看；改动 skill 后须重跑刷新。

<a id="5"></a>
## 5. 版本规则

遵循语义化版本 `MAJOR.MINOR.PATCH`，起始 `0.1.0`（早期，未承诺稳定）。

- **MAJOR**：breaking change——改变会使用户**已有笔记 / 配置 / 工作流失效或不一致**的改动。包括：`landing-rule` 落点变更、任一模板结构变更、`tag-system` 或 `frontmatter-spec` 变更、受控词表标识符重命名。
- **MINOR**：向后兼容的新增——加新规则项、加新 reference、加可选字段。
- **PATCH**：不改行为的修正——措辞、错别字、补充示例。

两个版本号要分清职责（不算 MECE 重复）：
- 每个文件 frontmatter 的 `version` = **该文件**的版本。
- SKILL.md frontmatter 的 `version` = **整个 skill** 的对外版本，进 CHANGELOG。

CHANGELOG.md（skill 域内，给人看的版本叙事，随 skill 入库并一同分发，见宿主仓库 ADR-0008）记录 skill 对外版本间的变化；ob-notes 自身的开发细节（为什么这么改、踩了什么坑）记在 ob-notes 自己的 dev-log（仓库维护文件，不是对外写入能力）。两者职责不同：CHANGELOG 面向用户讲"变了什么"，dev-log 面向维护者讲"为什么、怎么踩坑"。

<a id="6"></a>
## 6. 修改流程（强制）

修改 ob-notes 任何文件时，按序执行，缺一不可：

1. **定位唯一家**：在第 1 节归属表确认要改的规则项的唯一家，只在唯一家修改；其它文件若复述了该规则，说明已违反 SSOT，就地改为引用。
2. **更新声明**：若改动新增/删除了依赖关系，更新相关文件的 `provides`/`depends_on`；若新增规则项，先在受控词表登记。
3. **跑脚本查影响面 ＋ 提及扫描**：先运行 `python scripts/build_depmap.py`，依据反向索引找出"依赖了被改规则项"的文件逐一联动。**但脚本只看结构依赖，看不到散文里的复述 / 计数 / 示例**——所以再手动 grep 被改规则的**名字 ＋ 它的派生事实**（计数、名单、示例）across 全库（排除 CHANGELOG / dev-log 这类历史），把散落的旧口径一并改掉。两步合起来替代人脑记忆，防"改了 A 忘了 B"。
4. **校验门禁**：脚本若报错（重复定义/悬空依赖/未登记标识符），先解决再继续，不得带病提交。
5. **定版本**：按第 5 节判定本次属 MAJOR/MINOR/PATCH，更新涉及文件的 `version` 与 SKILL.md 的对外版本，写 CHANGELOG。
6. **记 dev-log**：将本次改动的决策与踩坑追加到 ob-notes 自己的 dev-log。
