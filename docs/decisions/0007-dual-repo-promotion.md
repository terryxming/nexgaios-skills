# 0007. 分发与开源架构:双仓晋升制

- 状态:已接受
- 日期:2026-07-03
- 决策人:terry(家用电脑)+ Claude

## 背景

dist 专题(两份 2026-07-03 handoff 均列为第一优先,ob-notes 发布唯一卡点)。骨架期曾设 `dist/` 目录待入库。讨论演进:A(dist 入库+一致性门禁)→ B(GitHub Releases)→ C(CI 产物公开仓)→ 渠道路由 → X1(本仓转公开)/X2(双仓)。用户两次关键澄清:①开源分发是**主干需求**——大量外部用户要把 skill 装进自己的 agent,不是"以后再说的尾巴";②流水线未来必有**不能公开的内部 skill**(公司业务);且本仓 `journal/` 交接要忠实记录(机器名、内部上下文),不宜公开。

## 决策

1. **双仓晋升制**:本仓(私有)= 生产流水线全量——开发中半成品、内部 skill、journal、ADR、门禁工具链;公开仓 **`nexgaios-skills-prod`** = 开源项目本体——已发布 skill、README、`marketplace.json`、Codex 安装说明、issue 反馈通道。
2. **发布 = 晋升**:skill 过 G 门禁、打 tag 后,由晋升脚本同步到 prod 仓。prod 仓只含**已发布版本**,main 上的半成品永不外泄(与 G 门禁咬合)。
3. **prod 仓布局(试行待验证)**:`skills/<name>/` = **净化可安装目录**(排除开发文件,满足官方"分发物无杂物",承 ADR-0006);`dev/<name>/` = `dev-log.md` + `CHANGELOG.md` + `evals/`(**透明信任资产**,用户已定随晋升公开)。`marketplace.json` 与 `$skill-installer` 均指向 `skills/<name>`。
4. **本仓 `dist/` 目录取消**;原"dist 一致性门禁"(桶二第1)改为**晋升一致性**:prod 仓 skill 内容必须能由本仓 `skills/` 经晋升脚本完整重生,晋升只经脚本、不手改 prod 仓。
5. **四渠道路由**:
   | 渠道 | 路径 |
   |---|---|
   | 自用(两台机) | `tools/install.py` 本地净化安装,不经 GitHub |
   | 团队 · 内部 skill | 私有本仓直装($skill-installer 支持私有 repo) |
   | 团队 · 公开 skill | 与外部用户同路 |
   | 外部用户 | prod 仓:Claude `marketplace add` / Codex `$skill-installer` / 其他平台直接拷目录 |
6. **per-skill 渠道标记(试行待验证)**:frontmatter `metadata.channels: public | internal`,晋升脚本只放行 `public`;`internal` 永不出私有仓。

## 证据(附来源,区分已证实/推断)

1. **已证实**:Claude marketplace 拉取的是 git 仓库**目录树**(plugins-reference);Codex `$skill-installer` 从 GitHub repo path **复制安装**、官方明言支持私有 repo。→ Releases zip 不被两生态安装机制支持,方案 B 出局。
2. **已证实**:官方惯例即"源码仓库 = 安装源"——openai/skills 就是公开源码仓,skill-installer 默认从它装,**无产物构建环节**。
3. **推断(有依据)**:skill 构建近乎恒等变换(markdown+脚本,仅排除开发文件);开源场景 evals/dev-log 是**信任资产**而非杂物——官方杂物约束的对象是安装进 agent 的目录(承 ADR-0006 的"分发物"语义)。
4. **已证实(逻辑必然)**:私有仓无法服务公开 marketplace(外部用户无访问权);journal 忠实记录 + 内部 skill 要求本仓保持私有 → 公开产物必须住独立公开仓,双仓不可避免。

## 影响

- 工程纪律双份修订(共享段同步、漂移校验须绿):速览"单一事实源"、D④、E 桶二第1(晋升一致性)、E 桶二第4 措辞、G④ 与落点。
- README:删 `dist/` 行,分发章节改双仓晋升制;仓库删除空的 `dist/` 目录。
- 待实施(顺序):`tools/install.py`(渠道1,立即有用)→ `tools/promote.py`(晋升脚本)→ prod 仓初始化(首个 skill 公开发布时)。
- ob-notes 的发布卡点由"dist 构建"变为"晋升链路建成"。

## 存疑 / 待验证

- prod 仓布局(`skills/` + `dev/` 分区)为自定约定:marketplace.json 指向子目录、skill-installer 对该布局的实际兼容,**首次晋升实测**。
- 晋升脚本形态:本地脚本推送 vs CI 跨仓推送(token 配置),实现时定。
- `metadata.channels` 字段名/取值为自造(spec 的 `metadata` 允许任意键值,合法;命名待用一段时间检验)。
- Claude 私有 marketplace 的团队用法未一手验证(团队·内部渠道目前以 skill-installer 与 clone+install 为准)。
- Codex 用户级安装目录终审(`~/.codex/skills`,承 ADR-0001 实机证据)——`install.py` 实测时闭环。

## 来源

- https://code.claude.com/docs/en/plugins-reference
- https://github.com/openai/skills
- https://github.com/openai/skills/blob/main/skills/.system/skill-installer/SKILL.md
- https://github.com/anthropics/claude-plugins-official
