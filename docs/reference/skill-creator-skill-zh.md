---
name: skill-creator
description: 创建新 skill、修改与改进现有 skill，并度量 skill 表现。当用户想从零创建一个 skill、编辑或优化现有 skill、跑评测（eval）验证 skill、用方差分析做基准测试（benchmark），或优化 skill 的 description 以提升触发准确率时使用。
---

# Skill Creator（skill 创建器）

> 译注：本文件是 Claude 官方内置 skill `skill-creator` 的 `SKILL.md` 中文译本，仅供研读架构与原理。遵循本仓命名规范——正文中文化，而标识符、文件名、路径、frontmatter 字段名、代码块、脚本名一律保留英文原样（它们是机器契约，翻译会破坏引用）。

一个用于创建新 skill 并对其迭代改进的 skill。

从宏观看，创建一个 skill 的流程是这样的：

- 想清楚你要这个 skill 干什么，以及它大致该怎么干
- 写出 skill 的草稿
- 造几条测试 prompt，用「挂载了该 skill 的 Claude」去跑它们
- 帮用户从定性和定量两个维度评估结果
  - 在后台跑那些 run 的同时，如果还没有定量评测就起草一批（若已有，可直接用，或按需修改）。然后把它们讲给用户听（如果本来就有，就解释已有的那些）
  - 用 `eval-viewer/generate_review.py` 脚本把结果呈现给用户看，同时也让他们看定量指标
- 根据用户对结果的评估反馈重写 skill（如果定量基准里暴露出明显缺陷，也一并修）
- 重复，直到你满意为止
- 扩大测试集，再在更大规模上试一遍

用这个 skill 时你的工作，是判断用户现在处在流程的哪一步，然后跳进去帮他们往前推进。举例：也许用户说「我想做一个做 X 的 skill」。你可以帮他把「X 到底指什么」收敛清楚、写草稿、写测试用例、弄清他们想怎么评估、跑完所有 prompt，然后循环。

反过来，也许用户已经有了 skill 草稿。那就直接进入「评测/迭代」这段循环。

当然，你要始终保持灵活——如果用户说「我不需要跑一堆评测，跟我随便捣鼓就行」，那你就那么做。

等 skill 做完之后（同样，顺序是灵活的），你还可以跑 skill description 优化器——我们为它准备了一整个独立脚本——来优化这个 skill 的触发表现。

明白了吗？很好。


## 与用户沟通

skill 创建器可能被各种编程行话熟悉程度天差地别的人使用。你要是没听说过（也难怪，这股风潮很近才起来）：如今 Claude 的能力正激励着水管工打开自己的终端、让父母和祖父母去谷歌搜「怎么装 npm」。而另一方面，大部分用户大概还是相当熟悉计算机的。

所以请留意上下文线索，据此判断该怎么措辞！在默认情况下，给你点感觉：

- 「evaluation（评测）」和「benchmark（基准测试）」算是模棱两可、但还能用
- 至于「JSON」和「assertion（断言）」，你得看到用户明确表现出懂这些东西的信号，才可以不加解释地直接用

如果拿不准，简短解释一下术语是完全 OK 的；不确定用户是否听得懂时，尽管用一句短定义把术语点明。

---


## 创建一个 skill


### 捕捉意图（Capture Intent）

先从理解用户的意图开始。当前这段对话里可能已经包含了用户想要捕捉的工作流（比如他们说「把这个变成一个 skill」）。若是如此，先从对话历史里把答案抽取出来——用了哪些工具、步骤顺序、用户做过哪些纠正、观察到的输入/输出格式。用户可能需要补上缺口，并应在进入下一步前确认。

1. 这个 skill 应该让 Claude 能做什么？
2. 这个 skill 应该在什么时候触发？（什么用户措辞/什么上下文）
3. 期望的输出格式是什么？
4. 我们要不要搭一套测试用例来验证这个 skill 能用？输出可被客观验证的 skill（文件转换、数据抽取、代码生成、固定的工作流步骤）能从测试用例中获益。输出主观的 skill（写作风格、艺术创作）往往不需要。根据 skill 类型给出合适的默认建议，但把决定权交给用户。


### 访谈与调研（Interview and Research）

主动就边界情况、输入/输出格式、示例文件、成功标准和依赖发问。在把这部分敲定之前，别急着写测试 prompt。

检查可用的 MCP——如果对调研有用（搜文档、找相似 skill、查最佳实践），有子代理就并行调研，没有就内联做。带着上下文有备而来，减轻用户负担。


### 编写 SKILL.md

基于对用户的访谈，把下面这些部件填好：

- **name**：skill 标识符
- **description**：何时触发、它做什么。这是首要的触发机制——既要写清 skill 做什么，也要写清何时使用它的具体上下文。所有「何时使用」的信息都放在这里，不放在正文。注意：目前 Claude 有「欠触发」skill 的倾向——本该有用时却不去用。为对抗这一点，请把 skill 的 description 写得稍微「主动/带点推力」一些。举例：与其写「如何构建一个简单快速的仪表盘来展示 Anthropic 内部数据。」，不如写「如何构建一个简单快速的仪表盘来展示 Anthropic 内部数据。只要用户提到 dashboard、数据可视化、内部指标，或想展示任何形式的公司数据，即便他们没有明确说出『dashboard』这个词，也务必使用本 skill。」
- **compatibility**：所需工具、依赖（可选，很少需要）
- **skill 的其余部分 :)**


### skill 写作指南


#### skill 的解剖结构（Anatomy of a Skill）

```text
skill-name/
├── SKILL.md (required)
│   ├── YAML frontmatter (name, description required)
│   └── Markdown instructions
└── Bundled Resources (optional)
    ├── scripts/    - Executable code for deterministic/repetitive tasks
    ├── references/ - Docs loaded into context as needed
    └── assets/     - Files used in output (templates, icons, fonts)
```


#### 渐进式披露（Progressive Disclosure）

skill 采用三级加载系统：
1. **元数据 Metadata**（name + description）——始终在上下文中（约 100 词）
2. **SKILL.md 正文**——只要 skill 被触发就进入上下文（理想 <500 行）
3. **打包资源 Bundled resources**——按需加载（无上限；脚本可直接执行而无需加载进上下文）

这些词数是近似值，需要时你尽可以写更长。

**关键模式：**
- 让 SKILL.md 保持在 500 行以内；如果快到这个上限了，就再加一层层级，并附上清晰的指引，告诉用这个 skill 的模型接下来该去哪里跟进。
- 从 SKILL.md 里清楚地引用各文件，并说明何时该去读它们
- 对于大的 reference 文件（>300 行），加一个目录（table of contents）

**领域组织（Domain organization）**：当一个 skill 支持多个领域/框架时，按变体（variant）来组织：
```text
cloud-deploy/
├── SKILL.md (workflow + selection)
└── references/
    ├── aws.md
    ├── gcp.md
    └── azure.md
```
Claude 只读相关的那份 reference 文件。


#### 「不出意外」原则（Principle of Lack of Surprise）

这本不用说，但 skill 绝不能包含恶意软件、漏洞利用代码，或任何可能危及系统安全的内容。一个 skill 的内容，若按其描述去理解，不应让用户感到意外。不要配合那些要求创建误导性 skill、或旨在便利未授权访问、数据外泄或其他恶意活动的请求。不过像「roleplay as an XYZ（扮演某某角色）」这类是 OK 的。


#### 写作模式（Writing Patterns）

指令优先用祈使句（imperative form）。

**定义输出格式**——可以这样写：
```markdown
## Report structure
ALWAYS use this exact template:
# [Title]
## Executive summary
## Key findings
## Recommendations
```

**示例模式**——放一些示例很有用。可以这样排版（但如果示例里出现「Input」和「Output」，你可能想稍作变通）：
```markdown
## Commit message format
**Example 1:**
Input: Added user authentication with JWT tokens
Output: feat(auth): implement JWT-based authentication
```


### 写作风格（Writing Style）

试着向模型解释「为什么这些重要」，而不是堆一大堆刻板发霉的「MUST」。运用心智理论（theory of mind），努力让 skill 通用，而不要死抠具体示例、过分狭窄。先写一版草稿，然后用一双新的眼睛重看一遍、加以改进。


### 测试用例（Test Cases）

写完 skill 草稿后，想出 2-3 条贴近真实的测试 prompt——就是真实用户实际会说的那种话。把它们拿给用户看：[你不必用这一模一样的措辞]「这里有几条测试用例我想跑一下。看着对吗，还是你想再加几条？」然后跑它们。

把测试用例存到 `evals/evals.json`。此刻先别写 assertion——只写 prompt。你会在下一步、趁 run 还在进行时起草 assertion。

```json
{
  "skill_name": "example-skill",
  "evals": [
    {
      "id": 1,
      "prompt": "User's task prompt",
      "expected_output": "Description of expected result",
      "files": []
    }
  ]
}
```

完整 schema（包括你之后才会补的 `assertions` 字段）见 `references/schemas.md`。


## 运行与评估测试用例

本节是一段连续的序列——不要中途停下。**不要**使用 `/skill-test` 或任何其他测试类 skill。

把结果放进 `<skill-name>-workspace/`，作为 skill 目录的同级兄弟目录。在这个 workspace 里，按迭代组织结果（`iteration-1/`、`iteration-2/` 等等），其中每个测试用例各占一个目录（`eval-0/`、`eval-1/` 等等）。别一开始就把这些全建出来——用到哪个才建哪个。


### 第 1 步：在同一轮里把所有 run（with-skill 和 baseline）都发出去

对每个测试用例，在同一轮里发两个子代理（subagent）——一个挂 skill，一个不挂。这点很重要：不要先发 with-skill 的 run，之后再回头补 baseline。要一次性全都发出去，让它们大约同时跑完。

**With-skill run（挂 skill 的 run）：**

```text
Execute this task:
- Skill path: <path-to-skill>
- Task: <eval prompt>
- Input files: <eval files if any, or "none">
- Save outputs to: <workspace>/iteration-<N>/eval-<ID>/with_skill/outputs/
- Outputs to save: <what the user cares about — e.g., "the .docx file", "the final CSV">
```

**Baseline run（基线 run，同样的 prompt，但基线取决于场景）：**
- **创建新 skill 时**：完全不挂任何 skill。同样的 prompt、不给 skill path，存到 `without_skill/outputs/`。
- **改进现有 skill 时**：旧版本。编辑之前先给 skill 拍个快照（`cp -r <skill-path> <workspace>/skill-snapshot/`），然后让 baseline 子代理指向那个快照。存到 `old_skill/outputs/`。

给每个测试用例写一份 `eval_metadata.json`（assertions 现在可以先留空）。给每个 eval 取一个能说明「它在测什么」的描述性名字——别就叫「eval-0」。目录名也用这个名字。如果这一轮迭代用的是新的或改过的 eval prompt，就为每个新的 eval 目录建这些文件——别假设它们能从上一轮迭代自动带过来。

```json
{
  "eval_id": 0,
  "eval_name": "descriptive-name-here",
  "prompt": "The user's task prompt",
  "assertions": []
}
```


### 第 2 步：趁 run 在跑，起草 assertion

别只是干等 run 跑完——这段时间你可以用起来。为每个测试用例起草定量 assertion，并向用户解释它们。如果 `evals/evals.json` 里已经有 assertion，就复查一遍并解释它们各查什么。

好的 assertion 是可被客观验证、且有描述性名字的——它们应当在 benchmark viewer 里读起来一目了然，让扫一眼结果的人立刻明白每一条在查什么。主观类 skill（写作风格、设计质量）更适合定性评估——别硬把 assertion 塞给那些需要人类判断的东西。

起草好 assertion 后，把它们更新进各 `eval_metadata.json` 和 `evals/evals.json`。同时向用户解释他们将在 viewer 里看到什么——既有定性的输出，也有定量的 benchmark。


### 第 3 步：run 完成时，捕获计时数据

每个子代理任务完成时，你会收到一条通知，内含 `total_tokens` 和 `duration_ms`。立即把这些数据存到该 run 目录下的 `timing.json`：

```json
{
  "total_tokens": 84852,
  "duration_ms": 23332,
  "total_duration_seconds": 23.3
}
```

这是捕获该数据的唯一机会——它随任务通知一次性到来，别处不会持久化。每条通知一到就处理，别想着攒起来批量处理。


### 第 4 步：打分、聚合、启动 viewer

所有 run 都跑完后：

1. **给每个 run 打分（Grade）**——起一个 grader 子代理（或内联打分），让它读 `agents/grader.md`，逐条 assertion 对照输出进行评估。把结果存到每个 run 目录下的 `grading.json`。grading.json 的 expectations 数组必须使用 `text`、`passed`、`evidence` 这几个字段（不是 `name`/`met`/`details` 或其他变体）——viewer 依赖这些精确的字段名。对于能程序化检查的 assertion，写一个脚本去跑，别用肉眼瞄——脚本更快、更可靠，而且能跨迭代复用。

2. **聚合成 benchmark**——从 skill-creator 目录里跑聚合脚本：
   ```bash
   python -m scripts.aggregate_benchmark <workspace>/iteration-N --skill-name <name>
   ```
   它会产出 `benchmark.json` 和 `benchmark.md`，含每个配置的 pass_rate、time、tokens，附均值 ± 标准差以及 delta（差值）。如果你要手动生成 benchmark.json，viewer 期望的精确 schema 见 `references/schemas.md`。
把每个 with_skill 版本放在它对应的 baseline 之前。

3. **做一次分析师（analyst）过审**——读 benchmark 数据，把聚合统计可能掩盖的模式浮现出来。该找什么见 `agents/analyzer.md`（其「Analyzing Benchmark Results」一节）——比如那些无论有没有 skill 都恒过的 assertion（不具区分度）、高方差的 eval（可能是 flaky 抖动）、以及时间/token 的权衡取舍。

4. **启动 viewer**，同时呈现定性输出和定量数据：
   ```bash
   nohup python <skill-creator-path>/eval-viewer/generate_review.py \
     <workspace>/iteration-N \
     --skill-name "my-skill" \
     --benchmark <workspace>/iteration-N/benchmark.json \
     > /dev/null 2>&1 &
   VIEWER_PID=$!
   ```
   对于第 2 轮及以后的迭代，还要传 `--previous-workspace <workspace>/iteration-<N-1>`。

   **Cowork / 无头（headless）环境：** 如果 `webbrowser.open()` 不可用，或环境没有显示器，就用 `--static <output_path>` 写出一个独立的 HTML 文件，而不是起服务器。当用户点击「Submit All Reviews」时，反馈会作为一个 `feedback.json` 文件下载下来。下载后，把 `feedback.json` 拷进 workspace 目录，供下一轮迭代取用。

注意：请用 generate_review.py 来生成 viewer；没必要自己手写 HTML。

5. **告诉用户**类似这样的话：「我已经在你的浏览器里打开了结果。有两个标签页——『Outputs』让你逐个点开每个测试用例并留下反馈，『Benchmark』展示定量对比。看完后回到这里告诉我一声。」


### 用户在 viewer 里看到什么

「Outputs」标签页一次展示一个测试用例：
- **Prompt**：给出的任务
- **Output**：skill 产出的文件，尽可能内联渲染
- **Previous Output**（第 2 轮起）：折叠区，显示上一轮迭代的输出
- **Formal Grades**（若跑了打分）：折叠区，显示各 assertion 的过/不过
- **Feedback**：一个随打字自动保存的文本框
- **Previous Feedback**（第 2 轮起）：他们上次的评论，显示在文本框下方

「Benchmark」标签页展示统计摘要：各配置的 pass rate、计时、token 用量，附每个 eval 的细分和分析师观察。

导航靠上一个/下一个按钮或方向键。看完后，他们点「Submit All Reviews」，会把所有反馈保存到 `feedback.json`。


### 第 5 步：读反馈

当用户告诉你他们看完了，读 `feedback.json`：

```json
{
  "reviews": [
    {"run_id": "eval-0-with_skill", "feedback": "the chart is missing axis labels", "timestamp": "..."},
    {"run_id": "eval-1-with_skill", "feedback": "", "timestamp": "..."},
    {"run_id": "eval-2-with_skill", "feedback": "perfect, love this", "timestamp": "..."}
  ],
  "status": "complete"
}
```

反馈为空意味着用户觉得那条没问题。把你的改进精力集中在用户有具体不满的那些测试用例上。

用完 viewer 后，把它的服务器进程杀掉：

```bash
kill $VIEWER_PID 2>/dev/null
```

---


## 改进 skill（Improving the skill）

这是整个循环的核心。你已经跑完测试用例，用户已经审阅了结果，现在你要根据他们的反馈把 skill 做得更好。


### 该怎么看待「改进」

1. **从反馈中做泛化（Generalize）。** 这里正在发生的大局是：我们要创造能被使用上百万次（也许真的字面意义上如此，甚至更多，谁知道呢）、横跨许多不同 prompt 的 skill。你和用户在这里之所以反复只在少数几个例子上迭代，是因为这样推进更快。用户对这些例子了如指掌，评估新输出对他们来说很快。但如果你和用户共同开发出的 skill 只对这几个例子有效，那它就毫无用处。与其塞进那些拧巴的、过拟合的改动，或压迫性、束缚性的一堆 MUST，不如：碰到某个顽固问题时，试试跳出去、换个比喻，或推荐不同的工作模式。试错成本相对很低，也许你就撞上了某个很棒的东西。

2. **保持 prompt 精简（Keep the prompt lean）。** 把那些没在发挥作用的东西删掉。一定要去读 transcript（执行记录），而不只是看最终输出——如果看起来 skill 在让模型浪费一堆时间做无用功，你可以试着把 skill 里造成这种行为的部分删掉，看看会怎样。

3. **解释「为什么」（Explain the why）。** 尽最大努力解释你要模型做的每件事背后的「为什么」。今天的 LLM 很**聪明**。它们有很好的心智理论，一旦给了好的骨架（harness），就能超越死记硬背的指令，真正把事情办成。哪怕用户的反馈简短或带着火气，也要努力真正理解任务、理解用户为什么写下他所写的东西、他到底写了什么，然后把这份理解注入到指令里。如果你发现自己在写全大写的 ALWAYS 或 NEVER，或在用超级僵硬的结构，那是个黄色警示——若有可能，就重新表述、把道理讲清楚，让模型理解你所要求的东西为什么重要。那是一种更人性、更有力、也更有效的做法。

4. **留意跨测试用例的重复劳动。** 读测试 run 的 transcript，注意子代理们是不是各自独立地写了相似的辅助脚本、或对某件事采取了同样的多步做法。如果 3 个测试用例都导致子代理写了个 `create_docx.py` 或 `build_chart.py`，那是一个强烈信号：这个 skill 应该把那段脚本打包进去。写一次，放进 `scripts/`，然后叫 skill 去用它。这能让未来每一次调用都省下重造轮子的功夫。

这个任务相当重要（我们可是在试图创造每年数十亿的经济价值！），而你的思考时间不是瓶颈；慢慢来，真正把事情琢磨透。我建议你先写一版修订草稿，然后重新审视、加以改进。真的尽你所能钻进用户的脑子里，理解他们想要什么、需要什么。


### 迭代循环（The iteration loop）

改进完 skill 之后：

1. 把你的改进应用到 skill 上
2. 把所有测试用例重新跑进一个新的 `iteration-<N+1>/` 目录，包含 baseline run。如果你在创建新 skill，baseline 永远是 `without_skill`（不挂 skill）——它跨迭代保持不变。如果你在改进现有 skill，就用你的判断决定什么当 baseline 合适：用户带进来的原始版本，或上一轮迭代。
3. 启动 reviewer，并用 `--previous-workspace` 指向上一轮迭代
4. 等用户审阅并告诉你他看完了
5. 读新反馈，再改进，再循环

一直做下去，直到：
- 用户说他们满意了
- 反馈全都为空（一切看着都好）
- 你不再取得有意义的进展

---


## 进阶：盲测对比（Blind comparison）

当你想在一个 skill 的两个版本之间做更严格的对比时（比如用户问「新版本真的更好吗？」），有一套盲测对比系统。细节读 `agents/comparator.md` 和 `agents/analyzer.md`。基本思路是：把两份输出交给一个独立的 agent，不告诉它哪份是哪份，让它评判质量。然后再分析赢家为什么赢。

这是可选的，需要子代理，多数用户用不上。人类审阅循环通常就够了。

---


## description 优化（Description Optimization）

SKILL.md frontmatter 里的 description 字段，是决定 Claude 是否调用某个 skill 的首要机制。创建或改进完 skill 后，主动提出为触发准确率优化这个 description。


### 第 1 步：生成触发评测查询

造 20 条评测查询——应触发（should-trigger）和不应触发（should-not-trigger）混着来。存成 JSON：

```json
[
  {"query": "the user prompt", "should_trigger": true},
  {"query": "another prompt", "should_trigger": false}
]
```

这些查询必须真实，是 Claude Code 或 Claude.ai 用户真的会打出来的东西。不是抽象的请求，而是具体、明确、有相当细节量的请求。比如文件路径、关于用户工作或处境的个人上下文、列名和取值、公司名、URL。带一点背景故事。有些可以是小写、或含缩写、错别字、口语化表达。用长短不一的混合，并且聚焦边界情况，而不是把它们写得泾渭分明（用户之后会有机会签字确认）。

差的：`"Format this data"`、`"Extract text from PDF"`、`"Create a chart"`

好的：`"ok so my boss just sent me this xlsx file (its in my downloads, called something like 'Q4 sales final FINAL v2.xlsx') and she wants me to add a column that shows the profit margin as a percentage. The revenue is in column C and costs are in column D i think"`

对于 **should-trigger** 查询（8-10 条），要想着覆盖度。你要同一意图的不同措辞——有些正式、有些随意。包含那些用户没有明确点出 skill 名或文件类型、但明显需要它的情况。丢进去一些不常见的用例，以及本 skill 与另一个 skill 竞争、但本 skill 应当胜出的情况。

对于 **should-not-trigger** 查询（8-10 条），最有价值的是「险些命中（near-miss）」的那些——与 skill 共享关键词或概念、但实际上需要别的东西的查询。想想相邻领域、以及那种「朴素的关键词匹配会触发但其实不该触发」的含糊措辞，还有那种「查询确实触及了 skill 会做的事、但在此上下文里另一个工具更合适」的情况。

要极力避免的一点：别把 should-not-trigger 查询写得明显不相干。「写一个斐波那契函数」作为 PDF skill 的负例太容易了——它什么都没测到。负例应当是真正刁钻的。


### 第 2 步：与用户一起复查

用 HTML 模板把这套评测集呈现给用户复查：

1. 读 `assets/eval_review.html` 模板
2. 替换占位符：
   - `__EVAL_DATA_PLACEHOLDER__` → 评测项的 JSON 数组（不要给它加引号——它是一个 JS 变量赋值）
   - `__SKILL_NAME_PLACEHOLDER__` → skill 的 name
   - `__SKILL_DESCRIPTION_PLACEHOLDER__` → skill 当前的 description
3. 写到一个临时文件（如 `/tmp/eval_review_<skill-name>.html`）并打开它：`open /tmp/eval_review_<skill-name>.html`
4. 用户可以编辑查询、切换 should-trigger、增删条目，然后点「Export Eval Set」
5. 文件会下载到 `~/Downloads/eval_set.json`——去 Downloads 文件夹里找最新的那份，以防有多个（比如 `eval_set (1).json`）

这一步很关键——糟糕的评测查询会导致糟糕的 description。


### 第 3 步：跑优化循环

告诉用户：「这会花点时间——我会在后台跑优化循环，并周期性地来查看进度。」

把评测集存到 workspace，然后后台运行：

```bash
python -m scripts.run_loop \
  --eval-set <path-to-trigger-eval.json> \
  --skill-path <path-to-skill> \
  --model <model-id-powering-this-session> \
  --max-iterations 5 \
  --verbose
```

用你系统提示里的那个 model ID（即驱动当前会话的那个），好让触发测试与用户实际体验到的一致。

跑的时候，周期性地 tail 一下输出，给用户更新它跑到第几轮、分数看起来怎么样。

这个脚本会自动处理整个优化循环。它把评测集切成 60% 训练（train）和 40% 留出测试（held-out test），评估当前 description（每条查询跑 3 次以拿到可靠的触发率），然后调用 Claude、根据失败项提出改进。它在 train 和 test 上重新评估每个新 description，最多迭代 5 次。跑完后，它会在浏览器里打开一份 HTML 报告，逐轮展示结果，并返回含 `best_description` 的 JSON——该 description 是按 test 分数（而非 train 分数）选出的，以避免过拟合。


### 触发机制是怎么工作的

理解触发机制有助于设计更好的评测查询。skill 会带着它的 name + description 出现在 Claude 的 `available_skills` 列表里，Claude 基于该 description 决定是否去参考某个 skill。要紧的一点是：Claude 只会为那些它自己没法轻松搞定的任务去参考 skill——像「读这个 PDF」这种简单的一步查询，即便 description 完美匹配也可能不触发 skill，因为 Claude 用基础工具就能直接处理。复杂、多步或专门化的查询，在 description 匹配时会可靠地触发 skill。

这意味着你的评测查询应当足够有分量，让 Claude 真的会从参考 skill 中获益。像「读文件 X」这种简单查询是糟糕的测试用例——无论 description 质量如何它们都不会触发 skill。


### 第 4 步：应用结果

从 JSON 输出里取出 `best_description`，更新 skill 的 SKILL.md frontmatter。把改动前/后拿给用户看，并报告分数。

---


### 打包与呈现（仅当有文件投递工具时）

检查你是否有能把文件呈现给用户的工具——`present_files`，或 Cowork remote 里的 `SendUserFile`。两者都没有就跳过这一步。如果有，就把 skill 打包，用那个工具把产出的 `.skill` 文件发给用户：

```bash
python -m scripts.package_skill <path/to/skill-folder>
```

当用户所在组织允许创建 skill 时，被呈现的 `.skill`（或裸 `SKILL.md`）文件卡片会显示一个 **Save skill** 按钮；点击它就会把该 skill 安装进他们的个人档案。

---


## Claude.ai 专属说明

在 Claude.ai 中，核心工作流是一样的（draft → test → review → improve → repeat），但因为 Claude.ai 没有子代理，一些机制会变。以下是需要适配的地方：

**跑测试用例**：没有子代理意味着没有并行执行。对每个测试用例，读该 skill 的 SKILL.md，然后遵循它的指令、你自己去完成那条测试 prompt。一次做一个。这不如「独立子代理」严谨（skill 是你写的、跑也是你跑，你有完整上下文），但作为一次合理性检查（sanity check）仍然有用——而且人类审阅这一步能补偿。跳过 baseline run——就用 skill 按要求把任务做完即可。

**审阅结果**：如果你打不开浏览器（比如 Claude.ai 的 VM 没有显示器，或你在远程服务器上），就完全跳过浏览器 reviewer。改为直接在对话里呈现结果。对每个测试用例，展示 prompt 和输出。如果输出是用户需要看的文件（如 .docx 或 .xlsx），把它存到文件系统并告诉他们在哪，以便下载查看。内联索取反馈：「这个看着怎么样？有什么想改的吗？」

**基准测试（Benchmarking）**：跳过定量 benchmark——它依赖 baseline 对比，而没有子代理时这种对比没有意义。聚焦于来自用户的定性反馈。

**迭代循环**：跟之前一样——改进 skill、重跑测试用例、索取反馈——只是中间没有浏览器 reviewer。如果你有文件系统，仍然可以把结果组织进 iteration 目录。

**description 优化**：本节需要 `claude` CLI 工具（具体是 `claude -p`），它只在 Claude Code 里有。在 Claude.ai 上就跳过它。

**盲测对比**：需要子代理。跳过。

**打包**：`package_skill.py` 脚本在任何有 Python 和文件系统的地方都能用。在 Claude.ai 上，你可以运行它，用户能下载产出的 `.skill` 文件。

**更新现有 skill**：用户可能是让你更新一个现有 skill，而不是创建新的。这种情况下：
- **保留原有 name。** 记下 skill 的目录名和 `name` frontmatter 字段——原封不动地用。比如已安装的 skill 是 `research-helper`，就输出 `research-helper.skill`（不是 `research-helper-v2`）。
- **编辑前先拷到可写位置。** 已安装的 skill 路径可能是只读的。拷到 `/tmp/skill-name/`，在那里编辑，从副本打包。
- **若手动打包，先在 `/tmp/` 里暂存**，再拷到输出目录——直接写可能因权限失败。

---


## Cowork 专属说明

如果你在 Cowork 里，主要要知道这些：

- 你有子代理，所以主工作流（并行发测试用例、跑 baseline、打分等）全都能用。（不过，如果你遇到严重的超时问题，把测试 prompt 串行跑而非并行也是 OK 的。）
- 你没有浏览器或显示器，所以生成 eval viewer 时，用 `--static <output_path>` 写出一个独立 HTML 文件，而不是起服务器。然后递给用户一个可点击的链接，让他在浏览器里打开该 HTML。
- 不知为何，Cowork 的设置似乎会让 Claude 不太愿意在跑完测试后去生成 eval viewer，所以再强调一遍：无论你在 Cowork 还是 Claude Code 里，跑完测试后，你都应该总是生成 eval viewer 供人类查看示例——在你自己动手修订 skill、尝试纠正之前——用 `generate_review.py`（而不是自己手写花哨的 html）。抱歉我要用全大写了：在你自己评估输入之前，**先生成 EVAL VIEWER**。你要尽快把它们摆到人类面前！
- 反馈的运作方式不同：因为没有运行中的服务器，viewer 的「Submit All Reviews」按钮会把 `feedback.json` 作为文件下载下来。你之后可以从那里读它（你可能得先申请访问权限）。
- 打包能用——`package_skill.py` 只需要 Python 和文件系统。
- description 优化（`run_loop.py` / `run_eval.py`）在 Cowork 里应该能正常用，因为它是通过 subprocess 调 `claude -p`、而非浏览器，但请把它留到你彻底做完 skill、且用户同意它已处于良好状态之后再跑。
- **更新现有 skill**：用户可能是让你更新一个现有 skill，而不是创建新的。遵循上面 Claude.ai 一节里的更新指引。

---


## Reference 文件

agents/ 目录含各专门子代理的指令。当你需要发起相应子代理时去读它们。

- `agents/grader.md` —— 如何对照输出评估各 assertion
- `agents/comparator.md` —— 如何在两份输出间做盲测 A/B 对比
- `agents/analyzer.md` —— 如何分析某个版本为何胜出

references/ 目录含额外文档：
- `references/schemas.md` —— evals.json、grading.json 等的 JSON 结构

---

再把核心循环重复一遍以示强调：

- 弄清这个 skill 是关于什么的
- 起草或编辑该 skill
- 用「挂载了该 skill 的 Claude」去跑测试 prompt
- 与用户一起，评估各输出：
  - 创建 benchmark.json 并跑 `eval-viewer/generate_review.py` 帮用户审阅它们
  - 跑定量评测
- 重复，直到你和用户都满意
- 打包最终的 skill 并交还给用户。

如果你有 TodoList 之类的东西，请把这些步骤加进去，免得忘。如果你在 Cowork 里，请特别把「Create evals JSON and run `eval-viewer/generate_review.py` so human can review test cases」放进 TodoList，确保它真的发生。

祝你好运！
