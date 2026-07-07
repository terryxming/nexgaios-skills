# 0008. 单仓公开制:仓库即分发,skill 为发布单元

- 状态:已接受(取代 [ADR-0007](0007-dual-repo-promotion.md) 双仓晋升制;精化 [ADR-0006](0006-skill-domain-vs-distribution.md) 的"分发时排除")
- 日期:2026-07-03
- 决策人:terry(家用电脑)+ Claude

## 背景

ADR-0007(双仓晋升制)落地当晚,用户连续两问击穿了它的两个支柱:

1. **"这是 agent skill,为什么要排除这些文件?"** —— 重审证据:官方安装链路($skill-installer / Claude marketplace)都是**整目录复制,生态中不存在"安装/分发时净化"环节**;官方"别放 CHANGELOG"条款是**创作指引**(防 AI 生成垃圾文档),不是出口净化要求。"晋升净化"是传统"源码→构建→产物"思维的误植。
2. **"双仓合一才对,skill 是单个发布单元。"** —— 净化取消后,"晋升"只剩纯复制;纯复制跨仓存在的唯一理由是隐私隔离(journal + 未来内部 skill),而为**尚不存在**的内部 skill 维持双仓同步机制,违反简单性纪律"没有第二个用例前不做抽象"。


## 决策

1. **单仓公开制**:本仓改名 **`nexgaios-skills`**(去 `-dev` 后缀),转 **public**——开发仓即分发仓。用户已手动转 public 并删除旧的同名本地目录/远端仓库;改名经 `gh repo rename` 完成,旧 URL 自动重定向。
2. **skill 是发布单元**:版本(`metadata.version`)、tag(`skill-name/vX.Y.Z`)、门禁(G 五关)、发布动作全部落在 skill 粒度;仓库层没有"发布"概念。
3. **源头干净,而非出口净化**:分发物 = **完整 skill 目录**(含 `dev-log.md`、`CHANGELOG.md`、`evals/`——透明信任资产)。质量由 lint 门禁在**源头**保证(README 类重复文档禁入),不在出口删文件。ADR-0006 的"构建分发时排除"条款废止,其"域内开发文件跟 skill 走"的方向保留并走到底。
4. **main = 可安装态(方案甲)**:`skills/<name>/` 目录的改动在**分支**上进行,全部门禁通过后 merge 进 main 并打 tag——外部用户从 main 装到的永远是已发布版。流水线自身文件(`tools/`、`docs/`、`journal/`、纪律双份)可在 main 直接迭代。
5. **机制拆除清单**:晋升脚本(promote)不建;"晋升一致性"门禁消失;`metadata.channels` 标记取消(内部 skill 根本不进本仓,无需路由);prod 仓不建。
6. **保留**:`tools/install.py`(自用渠道,纯复制到本机两端用户目录:Claude `~/.claude/skills`、Codex `$CODEX_HOME/skills`);`marketplace.json`(放本仓,首个 skill 正式发布时建;Claude Code 亦可经 plugin marketplace 安装)。
7. **内部 skill**(公司业务等不可公开者):未来真实出现时**另立私有仓**,届时才为它付费。


## 证据(附来源,区分已证实/推断)

1. **已证实**:Claude marketplace 拉取 git 仓库目录树;$skill-installer 从 repo path 复制安装(来源同 ADR-0007)。
2. **推断(强)**:两者均无"净化/排除"步骤——其文档只字未提;实施 install.py 时可读 skill-installer 脚本终审。
3. **已证实**:官方杂物条款原文为创作指引("Do NOT **create** extraneous documentation",本机实读 Codex skill-creator SKILL.md,承 ADR-0005 证据 2)。
4. **已证实(操作核验)**:仓库现为 `terryxming/nexgaios-skills`,visibility=PUBLIC,本地 remote 已切换且 ls-remote 连通。
5. **已证实(纠错留痕)**:Claude Code 存在用户级 personal skills 目录 `~/.claude/skills`(官方 plugins-reference:"`~/.claude/skills/` | personal | In every project",https://code.claude.com/docs/en/plugins-reference,2026-07-04 复核)。commit `a786c4d` 曾依据 `claude plugin --help` 与本机目录不存在,误判"Claude Code 无固定 skills 目录"并移除该安装目标——目录不存在只说明尚未使用,不能证明机制不存在;决策 6 与 install.py 已恢复两端安装。
6. **已证实(终审)**:官方安装链路为整目录复制、无净化——Codex skill-installer 的 `install-skill-from-github.py:176` 为裸 `shutil.copytree(src, dest_dir)`,无任何 ignore/exclude(本机实读,闭环证据 2 的待终审项);其安装目标 `$CODEX_HOME/skills/<skill-name>`(defaults to `~/.codex/skills`,SKILL.md:48,闭环"存疑"第 3 项)。


## 影响

- 纪律双份:速览、D④、E 桶二(删"晋升一致性",重编号为 4 条)、G④(改为 merge+tag)与落点、新增"main=可安装态"条(共享段同步,漂移校验绿)。
- README:改名、单仓公开制表述。
- ADR-0007 标注取代(其四渠道分析与"Releases 不可行"证据仍有效);ADR-0006 的排除条款废止。
- **存量违例(已闭环)**:ob-notes v0.8.0 早于方案甲生效时已在 main 但未打 v0.8.0 tag(基线仅 v0.7.0),属历史遗留;后续已走完 G 发布确认并补 `ob-notes/v0.8.0` tag,此后 skill 改动一律走分支。
- 本地目录名曾仍为 `nexgaios-skills-dev`,与远端名不一致;后续已由用户在会话外改名为 `nexgaios-skills`,git 不受目录名影响。


## 存疑 / 待验证

- 外部用户从"多 skill 单仓"安装单个 skill 的实际体验(marketplace.json 指向子目录、$skill-installer 按 path 装),首次外部发布时实测。
- journal 公开后"忠实记录 vs 自我审查"的张力,留观察;必要时敏感细节可写本机不入库文件。
- ~~Codex 用户级安装目录终审(`~/.codex/skills`,承 ADR-0001)~~ 已闭环:见证据 6(本机实读官方 skill-installer SKILL.md:48)。


## 来源

- https://code.claude.com/docs/en/plugins-reference
- https://github.com/openai/skills/blob/main/skills/.system/skill-installer/SKILL.md
- 本机 Codex skill-creator SKILL.md(杂物条款语境,承 ADR-0005)
