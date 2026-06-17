# nexgaios-skills 仓库架构与工作指南

这份文档用于说明 `nexgaios-skills` 仓库的定位、架构、职责边界、自动化能力，以及你应该怎样从这个仓库开始维护 Codex skill。

## 一句话定位

`D:\nexgaios-skills` 是 Codex skill 的统一源码仓库。

`C:\Users\EDY\.codex\skills` 是本机 Codex 实际读取和运行 skill 的安装目录。

日常开发应该在 `D:\nexgaios-skills` 中进行。开发、验证、提交、发布完成后，再通过命令同步到本机 Codex 安装目录。

## 核心设计原则

这个仓库采用四条边界：

- 仓库统一管理：统一维护脚本、模板、文档、CI 和发布规则。
- 业务域只分类：`amazon`、`product-design` 等目录只负责分类，不负责发布。
- skill 独立版本：每个 skill 在自己的 `skill.yaml` 中维护版本号。
- skill 独立发布：只有某个 skill 的版本号变化，才发布这个 skill。

这套设计解决的问题是：多个 skill 可以放在同一个仓库中维护，但互相不影响发布节奏。

## 仓库结构

```text
nexgaios-skills/
  skills/
    amazon/
      lingxing-ad-operation-audit/
    product-design/
      apple-hig-web-design/

  tools/
    skills/
      skill-cli.mjs

  templates/
    skill/

  docs/
    skill-protocol.md
    skills-overview.md
    repository-guide.md

  catalog.yaml
  package.json
  pnpm-lock.yaml

  .github/
    workflows/
      pr-validate.yml
      release-skills.yml
```

## 各目录职责

### `skills/`

`skills/` 存放所有 skill 的源码。

目录规则：

```text
skills/<domain>/<skill-id>/
```

示例：

```text
skills/amazon/lingxing-ad-operation-audit/
skills/product-design/apple-hig-web-design/
```

其中：

- `<domain>` 是业务域，只用于分类。
- `<skill-id>` 是具体 skill，也是发布单位。

### `skill.yaml`

每个 skill 根目录必须有 `skill.yaml`。

它是 monorepo 管理这个 skill 的协议文件，至少包含：

```yaml
id: lingxing-ad-operation-audit
domain: amazon
version: 0.1.3
entry: SKILL.md
status: active
```

最关键的字段是 `version`。

合并到 `main` 后，发布 workflow 会判断该 skill 的 `version` 是否变化：

- 版本变化：发布这个 skill。
- 版本未变化：不发布这个 skill。

### `SKILL.md`

`SKILL.md` 是 Codex 实际读取的 skill 入口文件。

它应该说明：

- 什么时候使用这个 skill。
- 使用前需要确认什么输入。
- 工作流程是什么。
- 需要读取哪些 `references/` 文件。
- 验证和交付边界是什么。

### `README.md`

每个 skill 的 `README.md` 是给维护者看的说明。

它应该说明：

- 这个 skill 的用途。
- 怎么开发。
- 怎么验证。
- 怎么安装或打包。

### `CHANGELOG.md`

`CHANGELOG.md` 记录版本变更。

如果某次改动要发布新版本，应该同时修改：

- `skill.yaml` 中的 `version`
- `CHANGELOG.md` 中对应版本说明

### `tools/skills/skill-cli.mjs`

这是仓库的核心管理 CLI。

所有日常命令最终都进入这个文件执行，例如：

```powershell
pnpm skill:list
pnpm skill:sync
pnpm skills:validate
```

### `templates/skill/`

这是新建 skill 使用的模板。

执行：

```powershell
pnpm skill:new amazon amazon-review-insight
```

会从这里复制模板，生成标准 skill 结构。

### `docs/`

`docs/` 存放仓库级文档。

当前重点文档：

- `docs/repository-guide.md`：新人理解仓库的入口文档。
- `docs/skill-protocol.md`：skill 协议和命令说明。
- `docs/skills-overview.md`：自动生成的 skill 总览。

### `catalog.yaml`

`catalog.yaml` 是自动生成的 skill 索引。

它由命令生成：

```powershell
pnpm skill:list --write-catalog
```

不要手动编辑。

## 已经落地的自动化能力

### 1. 导入已有 skill

从本地目录导入：

```powershell
pnpm skill:import amazon some-skill --from D:\old-skill-path
```

从 GitHub 仓库或 tag 导入：

```powershell
pnpm skill:import product-design apple-hig-web-design --from https://github.com/terryxming/apple-hig-web-design --ref v1.1
```

导入命令会：

- 复制 skill 文件。
- 排除 `.git`、`.github`、`node_modules`、`dist`、`artifacts`、`data`、`.env` 等不应该进入源码仓库的内容。
- 补齐缺失的 `skill.yaml`、`README.md`、`CHANGELOG.md`。
- 更新 `catalog.yaml`。
- 做基础验证。

### 2. 同步到本机 Codex

同步全部 active skill：

```powershell
pnpm skill:sync
```

安装单个 skill：

```powershell
pnpm skill:install lingxing-ad-operation-audit
```

同步目标是：

```text
C:\Users\EDY\.codex\skills
```

`skill:sync` 默认只覆盖本仓库中同名 skill 的安装目录，不删除其他来源的 skill。

如果要删除曾由本仓库安装、但当前仓库已经不存在的旧 skill，显式执行：

```powershell
pnpm skill:sync --prune
```

### 3. 自动生成文档

生成总览文档和业务域 README：

```powershell
pnpm skills:docs
```

检查生成文档是否最新：

```powershell
pnpm skills:docs:check
```

生成文件包括：

```text
docs/skills-overview.md
skills/amazon/README.md
skills/product-design/README.md
```

这些文档只记录仓库内稳定信息，不记录本机安装状态。

原因是本机安装状态是机器状态，Windows 本机和 GitHub Actions Linux runner 上不一致。

### 4. 新建 skill 模板

新建 skill：

```powershell
pnpm skill:new amazon amazon-review-insight
```

会生成：

```text
SKILL.md
skill.yaml
README.md
CHANGELOG.md
references/
scripts/
assets/
tests/
```

这样新 skill 从一开始就有统一结构。

### `skill:new` 的验证边界

`pnpm skill:new` 只负责生成标准骨架，不负责证明 skill 的业务能力正确。

它能证明的事项是：

- skill 目录位于 `skills/<domain>/<skill-id>/`。
- `skill.yaml`、`SKILL.md`、`README.md`、`CHANGELOG.md` 已生成。
- `references/`、`scripts/`、`assets/`、`tests/` 目录说明已生成。
- `catalog.yaml` 可以识别这个 skill。
- `pnpm skill:validate <skill-id>` 能验证基础协议，例如必填字段、版本号格式、入口文件存在和目录位置正确。

它不能证明的事项是：

- `SKILL.md` 的触发描述一定准确。
- 用户自然语言一定能正确触发这个 skill。
- references 内容一定完整、不过期、无重复。
- scripts 行为一定正确、安全、可复现。
- 输出格式一定符合真实用户需要。
- 发布版本一定可回滚、可复盘、可长期维护。

业务能力必须通过额外验证证明，例如：

```powershell
pnpm skill:validate <skill-id>
pnpm skills:docs:check
pnpm skills:guard
python <skill-dir>\scripts\<script-name>.py <test-input>
```

复杂 skill 还需要做真实 prompt 测试、误触发测试、输出契约测试，必要时做 forward-test。

因此，`skill:new` 的结论只能写成“骨架创建正确”，不能写成“skill 已经可用”或“业务能力已经正确”。

### 5. PR 自动说明

创建 PR 后，GitHub Actions 会自动评论：

- 本次直接修改了哪些 skill。
- 每个 skill 的版本是否变化。
- 合并到 `main` 后是否会发布。
- 修改了哪些共享工具、模板、CI 或文档。

这能避免你在 PR 页面里看不清影响范围。

### 6. 防误传检查

执行：

```powershell
pnpm skills:guard
```

会检查：

- `.env`、`.env.local` 等本地环境变量文件。
- `artifacts/`、`data/`、`outputs/`、`reports/`、`screenshots/`、`tmp/`、`temp/` 中的生成产物。
- `__pycache__/`、`.pytest_cache/`、`.mypy_cache/`、`node_modules/`、`dist/` 等缓存或构建目录。
- 超过 5 MiB 的文件。
- 常见 GitHub token、OpenAI API key、AWS access key、private key、Slack token 格式。

这个检查是误提交拦截器，不等同于完整安全审计。

### 7. GitHub Release Notes 中文化

发布 workflow 会使用：

```powershell
node tools/skills/skill-cli.mjs release-notes <skill-id> --base <before-sha>...HEAD
```

生成中文 Release Notes。

发布说明会包含：

- skill 名称
- 业务域
- 版本变化
- 仓库路径
- 安装方式
- 本次变更文件
- `CHANGELOG.md` 中对应版本的说明

## 为什么这样做

你的 skill 数量会增加，而且属于不同业务域。

如果继续使用“一个 skill 一个 GitHub 仓库”，会出现这些问题：

- 仓库数量越来越多。
- 模板和脚本无法统一维护。
- 每个仓库都要单独配置 CI。
- Codex 本机安装目录和源码目录容易混在一起。
- 很难一眼看清有哪些 skill、版本是多少、是否已纳入发布流程。

当前 monorepo 方案的价值是：

- 所有 skill 集中管理。
- 每个 skill 独立版本。
- 每个 skill 独立发布。
- 共享工具、模板、CI 可以统一维护。
- 旧 skill 可以逐个迁移，不需要一次性完成。
- 本机 Codex 安装目录和源码仓库职责分离。

## 日常工作流

### 查看当前有哪些 skill

```powershell
cd D:\nexgaios-skills
pnpm skill:list
```

也可以打开：

```text
docs/skills-overview.md
```

### 修改已有 skill

只修改对应 skill 目录：

```text
skills/<domain>/<skill-id>/
```

例如：

```text
skills/amazon/lingxing-ad-operation-audit/
```

修改完成后验证：

```powershell
pnpm skill:validate lingxing-ad-operation-audit
```

同步到本机 Codex：

```powershell
pnpm skill:sync
```

### 新建 skill

```powershell
pnpm skill:new amazon amazon-review-insight
```

然后编辑：

```text
skills/amazon/amazon-review-insight/
```

### 导入旧 skill

从本地目录导入：

```powershell
pnpm skill:import amazon old-skill-id --from D:\old-skill-path
```

从 GitHub tag 导入：

```powershell
pnpm skill:import product-design apple-hig-web-design --from https://github.com/terryxming/apple-hig-web-design --ref v1.1
```

### 只改文档或工具，不发布 skill

如果只改：

```text
README.md
docs/
tools/
templates/
.github/workflows/
```

不需要改 skill 的 `version`。

合并到 `main` 后，CI 会验证，但不会发布 skill。

### 发布某个 skill 新版本

如果某个 skill 要发布新版本，必须修改该 skill 的：

```text
skill.yaml
CHANGELOG.md
```

例如把：

```yaml
version: 0.1.3
```

改为：

```yaml
version: 0.1.4
```

同时在 `CHANGELOG.md` 增加：

```markdown
## 0.1.4 - 2026-06-17

- 说明本次变化。
```

合并到 `main` 后，只会发布这个版本号变化的 skill。

## 最小上手步骤

你以后可以从这几步开始：

1. 进入仓库：

   ```powershell
   cd D:\nexgaios-skills
   ```

2. 查看 skill 总览：

   ```powershell
   pnpm skill:list
   ```

3. 修改某个 skill：

   ```text
   skills/<domain>/<skill-id>/
   ```

4. 验证：

   ```powershell
   pnpm skill:validate <skill-id>
   ```

5. 同步到 Codex：

   ```powershell
   pnpm skill:sync
   ```

6. 提交 PR 前检查：

   ```powershell
   pnpm skills:docs
   pnpm skills:guard
   pnpm skills:validate
   ```

## 当前仓库状态

当前已经纳入 monorepo 管理的 skill：

```text
skills/amazon/lingxing-ad-operation-audit
skills/product-design/apple-hig-web-design
```

后续迁移剩余 skill，本质上就是继续增加：

```text
skills/<domain>/<skill-id>
```

并确保每个 skill 都有：

```text
skill.yaml
SKILL.md
README.md
CHANGELOG.md
```
