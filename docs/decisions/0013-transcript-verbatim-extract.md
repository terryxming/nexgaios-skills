# 0013. 追问链问答从会话 transcript 逐字扣，不再 agent 重写（精化 0011 决策 4·②）

- 状态:已接受（决策已定；Claude 侧机制经本机实测可行，但整套"逐字扣"效果未 dogfood、Codex 侧未验——见存疑段）
- 日期:2026-07-06
- 决策人:terry(公司机) + Claude

## 背景

0011 把 ob-notes 重定位为"从问答里分离已消化知识"，并立**决策 4·②「问题保真、回答重写」为基底通则**:用户的问原样保真，agent 的答一律**重写**成给未来读者的讲解，四条镣铐约束重写不越事实红线。

一次真实 dogfood（2026-07-05 家用机，已捕获为 pending 用例 `skills/first-party/ob-notes/evals/pending/2026-07-05-answer-rewrite-vs-verbatim.json`）暴露该通则的根本缺陷:一场对 Claude Code 底层机制的长篇深度问答，agent 依"答重写"把带表格、逐帧展开、原子级推导的详细原答压成简短讲解，用户明确否决——"禁止压缩，禁止回答重写，怎么问的就怎么答"。

追根因，问题比"压缩过度"更深:

1. **「答重写」本身是又一次 LLM 生成，受概率性支配。** 同一段原答重写两次结果不同，且与当时对话里真实产生的那一版都对不上——对"忠实沉淀"是致命的。
2. **上下文压缩（compaction）令 agent 记忆失真。** 长会话里 agent 的上下文前半段会被替换成摘要，它写笔记时对早期问答的"记忆"早已是压缩版，连"逐字保留"的原料都没有。

结论:**agent 的工作记忆不是可靠的保真来源;唯一的 ground truth 是落盘的会话 transcript(jsonl)。** 这与 ob-notes 反幻觉 / source-fidelity 哲学同向——"agent 事后重写"恰是最大的幻觉注入点，0011 的四条镣铐是打补丁，"直接从 transcript 扣原文"是拔病根。


## 决策

**作用域限定:仅追问链(问答实录)呈现。** 解法卡的逐字只作用于确切细节(报错/命令，0011 镣铐 b 已覆盖)，主题网是综合去骨架、多来源融合，二者均不整段逐字扣。

1. **追问链问答的数据来源改为从 transcript 逐字扣。** 不再让 agent 凭记忆转述/重写，而由脚本读会话 jsonl，提取当时真实落盘的问与答原文，**一字不改**（问、答对称保真，含代码块、表格、图片）。**0011 决策 4·② 的"回答重写"在追问链场景下被本决策取代;在主题网/解法卡等综合呈现下仍成立。**
2. **信号提取正向定义(结构层，机械硬滤)。** 只保留两类 block:① user 消息的真人 `text`/`image`;② assistant 消息的 `text`/`image`。其余全部机械滤除——assistant 的 `thinking`、`tool_use`;user 里的 `tool_result`;`mode`/`queue-operation`/`last-prompt`/`system`/`attachment` 等元数据整行;`isCompactSummary` 摘要行;`[Request interrupted by user]` 等中断标记。此层全部可脚本机械判定（A5 二值硬门禁）。
3. **语义层过 0011 参照读者判据。** 结构滤完剩下的"干净问答对"里，只留**有认知增量**的，滤掉纯操作指令轮次（如“pull到本地”“看下待做”），并滤掉答里夹的**操作旁白**（“我去读一下 / 先执行第 X 步”这类调工具报幕句——2026-07-06 dogfood 暴露、用户选 B）。分工:结构层定"是不是问答"，语义层定"这段问答值不值得沉淀"。
4. **thinking 不保留**——agent 思考不是"回答"。
5. **tool_result 不额外兜底。** 工具结果本身是噪音;其结论靠 agent 在 text 里的复述保留。接受"关键结果 agent 未复述则丢失"的残余风险，真缺时人工补。
6. **图片保留。** user/assistant content 里的 `image` block 逐字保留，落 Obsidian 时还原成 kbase 附件文件 + `![[]]` 引用;与 `attachment` 类型行区分（后者是 `deferred_tools_delta`/`agent_listing_delta` 等系统事件，属噪音）。
7. **平台范围:Claude 先行，Codex 待补。** Codex 侧 transcript 存在（`~/.codex/sessions/YYYY/MM/DD/rollout-*.jsonl`）但 payload schema 与运行时定位机制未验;实现时 Codex 侧降级为 agent 转述，平台差异与 `SKILL.md` 分离（桶二可移植纪律）。
8. **落地物:** 新增 `skills/first-party/ob-notes/scripts/extract_transcript.py`（定位 jsonl + 跨文件回溯 + 按 `parentUuid` 重建轮次 + 提取信号）;`distill.md` ② 与 `presentation.md` 追问链段随之改;pending 用例转正进 `evals.json`。


## 证据(附来源，区分已证实/推断)

**已证实(本机实测，2026-07-06 公司机，样本在 `~/.claude/projects/D--nexgaios-skills/`):**

1. **jsonl 位置与命名**:`~/.claude/projects/<cwd编码>/<session-id>.jsonl`;当前会话文件名 == 环境变量 `CLAUDE_CODE_SESSION_ID`(=`cfd6c225-6a68-479d-be96-9f9a39bed398`)，grep 直接命中本会话原文。→ **运行时可精确定位当前会话 transcript**。
2. **消息格式**:每行一条，含 `type`(user/assistant)、`message.content[]`（text/thinking/tool_use/tool_result/image）、`timestamp`、`parentUuid`、`logicalParentUuid`;assistant 正文在 `content[].type=="text"` 的 `.text`。
3. **compaction 不删原文**:触发过压缩的会话 `7dfa2aa1`(1212 行)中，`isCompactSummary` 摘要行在**第 1047 行**，其前 1046 行原始 user/assistant 消息全部保留 → **compaction 只追加摘要，不删逐字原文**。
4. **压缩后会话可续到新文件**:`537fe2d8`(391 行)**第 5 行**即为 compaction 摘要（`"This session is being continued from a previous conversation that ran out of context..."`），说明它是上一会话压缩后 resume 的新 jsonl，前半段原文在前序文件 → **提取需沿 `logicalParentUuid` 跨文件回溯**。
5. **注入内容不落盘**:6 条真人 user 行全部不含 `<system-reminder>`;CLAUDE.md / memory / hook 输出均不写入 message content（只在运行时拼进 prompt）→ **注入类噪音天然不存在**，脚本无需处理。
6. **信号占比约 17%**:当前会话 132 行中，真人问 6 + agent 正文 text 17 = 23 行为信号，其余（thinking 19 / tool_use 23 / tool_result 22 / 元数据约 40 / attachment 15）为噪音 → **逐字扣必须配噪音滤除**，否则退化为 transcript dump。
7. **attachment 行是系统事件**:本会话 15 条 `attachment` 全为 `deferred_tools_delta` / `agent_listing_delta`，非用户图片。

> **脚本 dogfood 实测（2026-07-06，最强证据）**：`extract_transcript.py` 拿当前会话（210 行）跑通——提取 9 轮问答，问与答逐字保真、thinking/tool_use/tool_result/元数据/中断标记全滤、被工具切断的多段答正确归并；暴露“操作旁白”需语义层处理，用户选 B（一并滤）。

**推断(待验证):**

8. compaction 不改历史 jsonl 的行为对**所有**触发场景成立——已见两种形态（同文件插入 / 新文件开头），但样本有限（n=2），标 `[试行待验证]`。
9. Codex 侧 rollout（`{timestamp,type,payload}`）可提取等价信号——文件存在已证实，payload schema 与运行时定位机制未验（跨平台，见速览「非 Claude 平台的事实」，须 Codex 实机核）。


## 影响

- **新增** `skills/first-party/ob-notes/scripts/extract_transcript.py`。
- **`distill.md`**:② "问题保真、回答重写" 增追问链逐字扣分支（限定作用域）;③ "留结果不留过程" 与结构层滤除对齐。
- **`presentation.md`**:追问链段"答重写成讲解"改为"答逐字扣";每轮总纲作为导航保留（是"带走判断"，非重写原答）。
- **`SKILL.md`**:mode-decision 追问链侧重说明 + workflow 增"扣 transcript"步;若新增 script 依赖则调 `metadata` 的 `provides`/`depends_on`。
- **受控词表(`maintenance.md` 归属表)**:新增"transcript-extract / 逐字保真"规则项，`build_depmap.py` 重跑验 MECE、重建依赖图。
- **evals**:`evals/pending/2026-07-05-answer-rewrite-vs-verbatim.json` 转正进 `evals.json`;补"逐字扣 vs 综合重写"对照、操作指令轮次滤除用例。
- **平台差异**:Codex 侧降级说明与 `SKILL.md` 分离（sidecar）。
- **`CHANGELOG.md` / `dev-log.md`**:同步。
- 仍 v1.0.0 候选（未发布，非 breaking）;发布前过发布门禁（ADR-0009，lint + 评测）。


## 存疑 / 待验证

- **Codex 侧全链路**（payload schema + 运行时定位当前会话）未验，须 Codex 实机（见速览「非 Claude 平台的事实」）。
- **跨文件回溯精确规则**:`logicalParentUuid` 是线索，但"新文件如何指向前序文件、如何串接完整问答"的确切算法待实现时验证，`[试行待验证]`。
- **compaction 全量性**样本有限（n=2），标 `[试行待验证]`;超长多次压缩链未测。
- **"只留有认知增量问答对"判据**继承 0011 参照读者判据的主观性，弱 agent 可能判不准——靠评测兜底。
- **图片 base64 还原**的体积/落点策略（大图、多图）未定，实现时按实际验证。
- 整套"逐字扣"目前 n=1（仅暴露它的那次失败），**正向效果未 dogfood**，发布前须补测（ADR-0012 回填闭环 / 发布门禁 ADR-0009 评测）。


## 来源

- 本仓对话（2026-07-06，公司机续工设计讨论）
- 实测样本:`~/.claude/projects/D--nexgaios-skills/` 下 `cfd6c225`(当前会话)、`7dfa2aa1`、`537fe2d8`、`f82a2f3c` 等 jsonl;环境变量 `CLAUDE_CODE_SESSION_ID`
- pending 用例:`skills/first-party/ob-notes/evals/pending/2026-07-05-answer-rewrite-vs-verbatim.json`
- ADR-0011(问答为基底、信号/噪音分离——本决策精化其决策 4·②)
