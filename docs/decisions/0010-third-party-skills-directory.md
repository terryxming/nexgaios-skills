# 0010. third-party 目录:第三方 skill 与自主开发分域

- 状态:已接受
- 日期:2026-07-04
- 决策人:terry(家用电脑)+ Claude

## 背景

用户会从 GitHub 等处下载第三方 skill,用于研究学习或安装进本机 agent 路径;跨机同步需求(纪律 C 铁律:需延续的状态必须进仓库)要求这些收藏入库。但 `skills/` 按 ADR-0008 是"发布单元"语义——main 上即可安装的已发布版,且八门禁(中文化兵底、杂物拦截、metadata.version 等)全为自产 skill 设计,第三方 skill 一进即红。研究收藏与发布单元混在同一语义目录,会污染"main = 可安装态"的承诺。

## 决策

1. **顶层新建 `third-party/`**:存第三方 skill 的**原样副本**(逐字节不改,保 diff 上游的能力),`skills/` 语义不变、现有机制零波及。命名从业界惯例(Chromium `third_party/`;`vendor/` 语义偏构建依赖,落选),kebab-case 合 A3。
2. **门禁全豁免**:桶一/桶二/桶三、G 发布门禁、中文化对 `third-party/` 不适用;lint 路径 ASCII 检查排除该目录(第三方文件名不是本仓标识符)。
3. **入库边界 = 再分发许可**:本仓公开,push 即再分发;有 MIT/Apache 等再分发许可才提交内容,无许可或不明的只在 `third-party/sources.md` 记一行、内容留本机。
4. **溯源清单** `third-party/sources.md`:名称/来源/ref/取回日期/license/内容入库/备注,单文件置于目录顶层——不塞进副本内部,保持副本原样。含安全提醒(半信任内容,安装前通读)。
5. **改造 = fork,入纪律 H**:从 `third-party/` 复制到 `skills/<name>/` 后按仓库规则迭代发布;上游继续存在、不退役(区别于收编),副本记 upstream 出处、license 义务随行。
6. **机械防线**:lint marketplace 门禁新增断言——条目路径必须在 `skills/` 下,第三方永远进不了分发渠道。
7. **install.py 双目录**:`skills/` 与 `third-party/` 都可安装,`--list` 分节列出,同名冲突报错并要求 `--from` 指定,不静默选一。
8. **CI handoff 联动不盯 `third-party/`**:收藏动作不强制交接。

## 证据(附来源,区分已证实/推断)

1. **已证实(常识)**:无 license 的作品默认保留所有权利,公开仓提交并推送构成再分发——这是第 3 条边界的依据。
2. **已证实(库内)**:lint 八门禁的自产假设——中文化兵底、杂物拦截(禁 README)、metadata.version 均会将典型英文第三方 skill 判红(tools/lint.py)。
3. **已证实(惯例)**:第三方代码独立目录是业界通行做法(Chromium `third_party/`、Go `vendor/`)。
4. **推断**:第三方 skill 与自产 skill 同名冲突低频但会发生(fork 后原副本仍在)——install.py 以显式 `--from` 消歧,不静默。

## 影响

- 纪律双份:速览"单一事实源"句、E 节豁免声明、H 节改造(fork)路径(共享段同步,漂移校验须绿)。
- `tools/lint.py`:路径检查豁免 + marketplace 路径断言;`tools/install.py`:双目录查找与 `--from`。
- README:目录结构表与本地安装节。

## 存疑 / 待验证

- 第三方 skill 的上游更新追踪暂为手动(重新取回、diff、更新 sources.md 行);量大再考虑脚本化。
- install.py 的 third-party 安装路径待首个第三方 skill 入库时实测(试行待验证)。

## 来源

- ADR-0008(单仓公开制,skills/ = 发布单元)
- tools/lint.py(门禁的自产假设)
- 业界惯例:Chromium third_party/、Go vendor/
