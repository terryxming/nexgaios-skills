# 0010. skills 目录二分:first-party 与 third-party

- 状态:已接受
- 日期:2026-07-04
- 决策人:terry(家用电脑)+ Claude


## 背景

用户会从 GitHub 等处下载第三方 skill,用于研究学习或安装进本机 agent 路径;跨机同步需求(纪律 C 铁律:需延续的状态必须进仓库)要求这些收藏入库。但 `skills/` 按 ADR-0008 是"发布单元"语义——main 上即可安装的已发布版,且八门禁(中文化兵底、杂物拦截、metadata.version 等)全为自产 skill 设计,第三方 skill 一进即红。研究收藏与发布单元混在同一语义目录,会污染"main = 可安装态"的承诺。

实施注记:初版误落为顶层 `third-party/` 与 `skills/` 并列,用户同日澄清本意为 **skills/ 内二分**,随即修正;本 ADR 记录修正后的终态。嵌套分类恰是官方惯例(见证据 3)。


## 决策

1. **skills/ 内二分**:`skills/first-party/`(自主开发,发布单元)与 `skills/third-party/`(第三方**原样副本**,逐字节不改,保 diff 上游的能力)。`first-party` 是 `third-party` 的标准反义配对(纪律 A「文件命名规范」通用词);`skills/` 一级只允许这两个分类目录,lint 布局检查机械防呆(skill 落错层即红)。
2. **门禁豁免**:桶一/桶二/桶三、G 发布门禁、中文化对 `skills/third-party/` 不适用;lint 路径 ASCII 检查排除该目录(第三方文件名不是本仓标识符)。
3. **入库边界 = 再分发许可**:本仓公开,push 即再分发;有 MIT/Apache 等再分发许可才提交内容,无许可或不明的只在 `skills/third-party/sources.md` 记一行、内容留本机。
4. **溯源清单** `skills/third-party/sources.md`:名称/来源/ref/取回日期/license/内容入库/备注,单文件置于目录顶层——不塞进副本内部,保持副本原样。含安全提醒(半信任内容,安装前通读)。
5. **改造 = fork,入纪律 H**:从 `skills/third-party/` 复制到 `skills/first-party/<name>/` 后按仓库规则迭代发布;上游继续存在、不退役(区别于收编),副本记 upstream 出处、license 义务随行。
6. **机械防线(黑名单式)**:lint marketplace 门禁断言——条目路径**不得**在 `skills/third-party/` 下。取黑名单而非"必须在 first-party 下"的白名单,因现有条目 pin 在 `ob-notes/v0.8.0` tag,该 tag 树内路径仍是迁移前的 `skills/ob-notes`(有效可装,git-subdir 按 ref 取树);白名单会误红,条目路径的存在性已由"tag 树内 SKILL.md 可读"检查兜底。下次发布(v1.0.0)时条目改用新路径。
7. **install.py 双目录**:`first-party` 与 `third-party` 都可安装,`--list` 分节列出,同名冲突报错并要求 `--from` 指定,不静默选一。
8. **CI handoff 联动收窄至 `skills/first-party/`**:收藏第三方不强制交接。


## 证据(附来源,区分已证实/推断)

1. **已证实(常识)**:无 license 的作品默认保留所有权利,公开仓提交并推送构成再分发——第 3 条边界的依据。
2. **已证实(库内)**:lint 八门禁的自产假设——中文化兵底、杂物拦截(禁 README)、metadata.version 均会将典型英文第三方 skill 判红(tools/lint.py)。
3. **已证实(惯例)**:skills 目录内做分类子目录是官方做法——openai/skills 仓库即 `skills/.curated/`、`skills/.experimental/`、`skills/.system/`(本机 Codex 内置 skill-installer 的默认列表路径即指向 `skills/.curated`);Chromium `third_party/`、Go `vendor/` 亦证第三方独立目录惯例。
4. **推断**:第三方与自产 skill 同名冲突低频但会发生(fork 后原副本仍在)——install.py 以显式 `--from` 消歧,不静默。


## 影响

- 纪律双份:速览"单一事实源"句、E 节豁免声明、F 用例路径、G"main=可安装态"条、H 收编路径与 fork 路径(共享段同步,漂移校验须绿)。
- `tools/lint.py`:skill 扫描根改为 `skills/first-party/`、路径检查豁免、布局防呆、marketplace 黑名单断言;`tools/install.py`:双目录与 `--from`;`tools/check-handoff-sync.py`:监视收窄。
- `skills/ob-notes` → `skills/first-party/ob-notes`(git mv,历史随 rename 追踪);候选分支侧做同款 mv 后再合并,避免改名冲突。
- marketplace 现有条目 pin 于 v0.8.0 tag 的旧路径不改(该 tag 树内有效),v1.0.0 发布时更新。
- README 目录表、安装节与协作手册。


## 存疑 / 待验证

- 第三方 skill 的上游更新追踪暂为手动(重新取回、diff、更新 sources.md 行);量大再考虑脚本化。
- install.py 的 third-party 安装路径待首个第三方 skill 入库时实测(试行待验证)。
- 候选分支 merge 后 ob-notes 路径迁移的完整性(evals/依赖图脚本均为相对路径,应无恙——实测后销此项)。


## 来源

- ADR-0008(单仓公开制,skills/first-party = 发布单元)
- https://github.com/openai/skills(skills/.curated 等嵌套分类布局)
- tools/lint.py(门禁的自产假设)
