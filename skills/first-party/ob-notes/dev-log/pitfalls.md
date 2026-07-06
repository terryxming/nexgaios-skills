---
title: ob-notes 开发日志 · 踩坑记录
date: 2026-06-26
updated: 2026-07-07
source: ob-notes 维护（原 dev-log.md 拆分）
tags: [状态/持续]
---

## 踩坑记录（只追加）

**2026-07-07** — 重排 dev-log 时用脚本按 ①②③ 拆 timeline 长条目，误把「distill.md ③」「G②」「G④」这类**引用**当枚举拆开，几条历史条目被打乱 `[已验证]`

- **根因**：圆圈数字在内容里既作枚举也作引用（章节号 / 门禁关号），「≥2 个圆圈数字就拆」的启发式区分不了两者
- **解法**：机械转换历史记录后必须读回抽验；对语义歧义的标记（①②③）不做自动拆分，改用安全的块格式（日期加粗 + 内容内联）；本次从 git HEAD 取回原始条目重建，验证条目数无丢失

**2026-07-07** — 首轮把「对所有 .md 文件的写作要求 + 重构」误解为「新写部分照做 + 一次表层 grep」，对用户明列的 5 步工作流与全文件正文重构无动于衷，被用户当面点破 `[已验证]`

- **根因**：把用户的显式指令（主动重构每份文件正文、把工作流落成显式流程）降格成「我自评已达标、无需动」，跳过了逐条落实
- **解法**：用户列出的每条写作 / 结构要求都落成可核对的动作（改了哪个文件哪一节 / 加了哪个流程），逐项回给用户对照，不用「已达标」自评带过；判「已合规、不改」也要给出证据（哪些行本就是祈使 / 编号步骤），而非默认跳过。

**2026-07-07** — 大段 old_string Edit 反复匹配不上（warning 框"透出来："误写"透出——"、evals"传整个状态、"顿号误写逗号、dev-log"下一步："全角冒号误写半角）`[已验证]`

- **根因**：从几十轮前的 context 记忆重构 old_string，中文标点（、／，，：／——）与实际有细微差；2026-07-04 已记同类坑，本次一迭代内仍三次复发
- **解法（升级）**：改动大段前**先 Read 目标段落、当场精确复制**，不凭旧 context 记忆重构；标点差异连工具的 \uXXXX 兜底都救不了，唯一可靠是即时复制。

**2026-07-04** — Edit 替换含中文标点的行（README 索引、CHANGELOG）时 old_string 用半角冒号/逗号匹配不上 `[已验证]`

- **根因**：仓库中文文档标点是全角，凭记忆写半角对不上、工具的 \uXXXX 兜底也救不了标点差异
- **解法**：先 Read 取精确全角文本再 Edit，构造 old_string 不凭记忆、精确复制。

**2026-07-04** — 主梁"先建后删"中间态（新文件已 provides、旧文件未删）跑 depmap 报 source-fidelity/mastery-lens 重复定义 `[已验证]`

- **根因**：新旧唯一家并存、SSOT 冲突，是预期中间态
- **解法**：该批不在中间态跑校验，删旧 + 改 SKILL 后一次跑绿（"先建后审可回退"策略的正常代价）。

**2026-07-03** — SKILL.md frontmatter 字符串化后 build_depmap 把三个核心规则项报成孤儿 `[已验证]`

- **根因**：parse_fm_list 只认 `[a,b]` 流式格式；且孤儿仅 warning、exit 0，声明断裂被静默放行
- **解法**：解析兼容流式列表与逗号字符串两式；归属表已声明唯一家的孤儿升 error（不阻断的告警会被无视）。

**2026-06-26** — 官方 package_skill.py 报错 "Unexpected key(s) in frontmatter: depends_on, provides, version"

- **根因**：Agent Skills 标准顶层只允许 name/description/license/allowed-tools/metadata/compatibility `[已验证]`
- **解法**：把三个自定义字段移到 metadata 下，并同步改 build_depmap.py 的解析正则（从匹配顶层改为匹配缩进字段）。

**2026-06-26** — 最终自检发现 preflight.md 含私人路径 nexgaios-kbase `[已验证]`

- **根因**：举例时写了真实私人路径，发布包不应含
- **解法**：`sed -i 's/nexgaios-kbase/my-kbase/g'`，全包复查无残留。

**2026-06-26** — 受控词表在代码里存了副本，构成双写隐患 `[已验证]`

- **根因**：脚本要可执行需要词表，初版硬编码在 CONTROLLED_VOCAB
- **解法**：改为运行时从 maintenance.md 第1节归属表正则解析，代码内零副本；脚本因此新增 depends_on: ssot-registry。

**2026-06-26** — sed 命令里用 `${PIPESTATUS[0]}` 在 sh 下报 "Bad substitution" `[已验证]`

- **根因**：PIPESTATUS 是 bash 特性、当前 shell 是 sh
- **解法**：改用独立命令分别取退出码，避免依赖 bash 专有语法。

**2026-06-26** — `build_depmap.py` 在 Windows 上每次跑校验都把 `dependency-map.md` 标成 modified(`git diff --ignore-all-space` 实为零内容差异) `[已验证]`

- **根因**：`Path.write_text` 默认 `newline=None`，写盘时把 `\n` 转成平台 `os.linesep`(Windows 即 `\r\n`)，与仓库 LF 版本不符，使"纯只读、仅生成 dependency-map"的脚本反而污染工作区、有误提交 CRLF 翻转之险
- **解法**：改用 `open(OUTPUT, "w", encoding="utf-8", newline="\n")` 显式锁 LF(不用 `write_text` 的 `newline=` 参数，那要 Py3.10+)；连跑两次后 git status 干净，验收通过。
