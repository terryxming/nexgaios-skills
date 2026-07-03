# 交接:2026-07-04 家用机 · Codex 产出检查修正 + 问答实录对比

> 续工先 `git pull`,读本文件 + `journal/2026-07-03-home-ob-notes-obsidian-only.md`,再动手。工作分支 `codex/ob-notes-obsidian-only`(未合 main);main 上另有本次修正 `d3bb020`,分支未改动同批文件,合并时自动汇合、无冲突。

## 本次起点巡检

- 家用机 TerryXming;git 2.53.0 / Python 3.14.2 / Node v24.14.1;Codex `project_doc_max_bytes=131072` 生效。
- 起点:main 与远端同步;分支 `codex/ob-notes-obsidian-only` 已推送(Codex 在 Claude 用量超额期间完成);未跟踪 `.codex/hooks.json`。

## 本次完成(对 Codex 产出的检查与修正)

1. **核查通过项**(均实跑/实读验证,非转述):tag `ob-notes/v0.8.0`(打在 `175ff28`,G④ 闭环);marketplace.json schema 合规(`claude plugin validate` 复跑通过;`git-subdir` 用 `owner/repo` 简写为官方明文支持;pin tag + version 0.8.0 一致);分支 v1.0.0 候选内容质量过关(SKILL.md 三要素齐、无删除能力残留引用、evals 防回流负例 F11 手法正确);lint 分支实跑全绿;Obsidian 库改名属实。
2. **修正一处事实性错误(main `d3bb020`)**:`a786c4d` 误判"Claude Code 无固定 `~/.claude/skills` 目录"并删除 install.py 的 Claude 安装目标——官方 plugins-reference 明文 `~/.claude/skills/` = personal scope。已恢复默认双端安装,README/ADR-0008 决策⑥复原,ADR 证据区补纠错留痕(典型 A4·6 跨 agent 幻觉案例:以"目录不存在"推出"机制不存在")。
3. **修 GBK 崩溃**(同在 `d3bb020`):`check-discipline-drift.py` 单跑假红 + install.py stderr 乱码,补 UTF-8 reconfigure,实测通过。
4. **ADR-0008 存疑闭环**:实读 skill-installer 源码证实整目录复制无净化(`install-skill-from-github.py:176` 裸 copytree)、Codex 用户级目录 `$CODEX_HOME/skills`(SKILL.md:48)。
5. **`.codex/hooks.json` 处置(用户拍板)**:已删除。它是 Codex 镜像 `.claude/settings.json` 生成的;Codex hooks 机制存在(官方 developers.openai.com/codex/hooks,v0.114 起)但实验性、默认关闭、**Windows 不可用**,本机 config.toml 也未开 `[features] codex_hooks = true`——完全不生效,schema 是否匹配 Codex 真实约定未终审。若 Codex 再自动生成,届时按官方 schema 验证后再决定入库。
6. **机外修正**:`~/.codex/config.toml` 第 10 行注释旧仓名 `nexgaios-skills-dev` → `nexgaios-skills`。
7. **问答实录笔记对比分析**(Codex 的《Codex 执行仓库纪律三次失守》vs Claude 的两篇 MCP 实录):结论与模板反哺建议见下"未决/后续"第 1 条,完整分析在会话记录。

## 验证记录

- `python tools/lint.py` → 全绿(main 与分支各跑一次)。
- `python tools/check-discipline-drift.py` 单独跑 → 修后 exit 0、输出正常(修前 GBK 控制台崩溃,家用机复现)。
- `claude plugin validate .` → Validation passed(复跑)。
- `python tools/install.py --list` / `--dest <scratch>` → 16/16 文件与源一致;无 `--force` 重复安装正确拦截 exit 1;`--force` 覆盖正常。**默认双端安装路径刻意未实跑**(会把 `~/.codex/skills` 的 1.0.0 候选踩回 0.8.0)——标「试行待验证」,与 `--dest` 路径仅差目标列表构造。
- Obsidian 库:《Codex 执行仓库纪律三次失守:问答实录.md》在 inbox、旧文件已删(全角冒号会让 Glob 匹配失败,用目录 listing 复核)。

## 已推送

- main `d3bb020` — 恢复 install.py 的 Claude 用户级安装目标并修 GBK 控制台崩溃。
- 本 handoff。

## 未决 / 后续(明日公司机,建议顺序)

1. **mode-a-dialogue 模板反哺**(本次对比分析的落点,在分支上改):模板骨架没问题(两家笔记结构几乎同构),差距在骨架管不到的四处,建议补进"写作纪律":
   - **讲解体,非转写体**:回答区写给未来读者,禁止"agent 当时说/随后承认"式第三人称转述(除非该句本身是证据);
   - **每轮收口一句可带走的总纲**(判断/公式/对比表),30 秒读法从中摘;
   - **与 git/journal 守单一事实源**:仓库已留痕的过程细节(提交链、文件清单、格式对比)只引用不搬运;
   - **认知增量是主角**:优先保留"理解对一半、错在哪"的误解→修正瞬间(强化现有"保留纠错瞬间"条)。
2. **ob-notes v1.0.0 继续迭代**(用户明确:还没迭代完,暂不重跑评测)。
3. 迭代完后走发布链:eval 用例过目(F 人在环)→ 触发+执行评测重跑(description 大改,必须重测)→ 合 main → tag `ob-notes/v1.0.0`(**tag message 用中文**,v0.8.0 用了英文,已推送不重打)→ **更新 marketplace.json**(ref/version/description——现 description 还写着"或项目目录",v1.0.0 后失效)。
4. Codex 侧遗留:run_loop.py 依赖 `claude -p` 嵌套鉴权问题、AGENTS.md 平台段接管(承旧 handoff)。
