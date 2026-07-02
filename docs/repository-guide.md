# nexgaios-skills 仓库架构与工作指南

这份文档用于说明 `nexgaios-skills` 仓库的定位、架构、职责边界、自动化能力，以及你应该怎样从这个仓库开始维护 agent skill。

## 一句话定位

`D:\nexgaios-skills` 是 Nexgaios agent skills 的统一源码仓库，面向多运行时（Claude Code / Codex）通用。

这是当前电脑的本地仓库路径。另一台电脑可以使用自己的本地克隆路径，源码事实源仍然是 GitHub 仓库。

本机运行时安装目录按当前系统用户的 home 目录计算（不能写死某一台电脑的用户名）：`$env:USERPROFILE\.claude\skills`（Claude Code）和 `$env:USERPROFILE\.codex\skills`（Codex）。

日常开发应该在 `D:\nexgaios-skills` 中进行。开发、验证、提交、发布完成后，必须显式询问用户是否要同步到本机运行时安装目录；只有用户明确同意后，才执行同步命令。

## 核心设计原则

这个仓库采用四条边界：

- 仓库统一管理：统一维护脚本、模板、文档、CI 和发布规则。
- 业务域只分类：`amazon`、`product-design` 等目录只负责分类，不负责发布。
- skill 独立版本：每个 skill 在自己的 `skill.yaml` 中维护版本号。
- skill 独立发布：只有某个 skill 的版本号变化，才发布这个 skill。

这套设计解决的问题是：多个 skill 可以放在同一个仓库中维护，但互相不影响发布节奏。

## 仓库关键结构

```text
nexgaios-skills/
  .github/
    workflows/
      pr-validate.yml
      release-skills.yml

  skills/
    amazon/
      lingxing-ad-operation-audit/
    knowledge-management/
      ob-notes/
    product-design/
      apple-hig-web-design/
    skill-governance/
      skill-doctor/

  tools/
    skills/
      skill-cli.mjs

  templates/
    experience/
      lesson.md
    handoff/
      skill-handoff.md
    skill/

  docs/
    experience/
      cards/
      index.md
      README.md
    handoffs/
      README.md
    skill-protocol.md
    skills-overview.md
    repository-guide.md
    multi-computer-workflow.md

  catalog.yaml
  package.json
  pnpm-lock.yaml
  pnpm-workspace.yaml
  skill.cmd
  skill.ps1
```

这不是全量文件清单。它只展示仓库中需要理解的稳定源码层级；`node_modules/`、临时报告、构建产物和本机缓存不属于仓库结构说明。

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

`SKILL.md` 是各 agent 运行时（Claude Code / Codex）实际读取的 skill 入口文件，遵循 Agent Skills 通用格式。

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
pnpm skill:install <skill-id>
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
- `docs/multi-computer-workflow.md`：公司电脑和家里电脑之间的协同工作流。
- `docs/experience/`：失败、踩坑、根因和解法的可检索经验库。
- `docs/handoffs/`：未完成 skill 开发或维护工作的交接文档。

### `catalog.yaml`

`catalog.yaml` 是自动生成的 skill 索引。

它由命令生成：

```powershell
pnpm skill:list --write-catalog
```

不要手动编辑。

## 已经落地的自动化能力

### 0. 首次环境检查

首次 clone 仓库、换电脑工作，或发现 `node`、`pnpm`、`python`、`git` 等命令不可用时，先运行：

```powershell
node tools/skills/skill-cli.mjs env-check
```

如果 `node` 本身不可用，在 Windows 下运行：

```powershell
.\skill.ps1 env-check
```

环境检查会报告：

- Node.js 版本是否满足 `>=20`。
- Git、Python、Windows PowerShell、Corepack 是否可用。
- `pnpm` 命令入口是否可用，且是否匹配 `package.json` 中的 `packageManager`。
- 工作区依赖是否已经安装。
- GitHub CLI 是否可用；它只在 PR、CI 和发布工作流中需要。

环境检查只报告缺失项和建议操作，不会自动安装、启用或修改任何工具。

如果检查发现缺失项，必须先向用户报告缺失内容和建议命令，并等待用户明确批准后再执行安装或修复。例如：

```powershell
corepack prepare pnpm@11.7.0 --activate
corepack pnpm install --frozen-lockfile
```

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

### 2. 同步到本机运行时（Claude Code / Codex）

同步命令只在用户明确同意时执行。

安装单个 skill（按该 skill 在 `skill.yaml` 中声明的 `targets` 分发）：

```powershell
pnpm skill:install lingxing-ad-operation-audit
pnpm skill:install lingxing-ad-operation-audit --runtime claude
```

同步全部 active skill：

```powershell
pnpm skill:sync
pnpm skill:sync --runtime codex
```

同步目标按运行时区分：

```text
$env:USERPROFILE\.claude\skills   # Claude Code
$env:USERPROFILE\.codex\skills    # Codex
```

CLI 实际按当前系统用户的 home 目录计算目标路径（Node.js 的 `os.homedir()`）。`targets` 缺省时等价于 `[codex]`。

规则：

- 每次修改 `skills/<domain>/<skill-id>/` 后，最终回复前必须显式询问用户是否要同步到本机运行时安装目录。
- 用户明确同意同步单个 skill 时，优先运行 `pnpm skill:install <skill-id>`。
- 用户明确要求同步全部 active skill 时，才运行 `pnpm skill:sync`。
- 不得把“源码已更新”表述为“本机已安装更新”。
- `skill:sync` 默认只覆盖本仓库中同名 skill 的安装目录，不删除其他来源的 skill。

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

### 4. Obsidian 镜像文档

`docs/repository-guide.md` 还有一份本机 Obsidian 镜像：

```text
E:\nexgaios-gbrain-kbase\00 - raw\01 - AI Work\0102 - 项目\Nexgaios-skills 仓库\repository-guide.md
```

镜像是可选配置，只在配置了 E 盘知识库的机器（公司机）上维护。当仓库内 `docs/repository-guide.md` 发生变化时，在这类机器上同步这份 E 盘文件；未配置镜像的机器上命令会提示并跳过。

同步命令：

```powershell
pnpm guide:sync
```

一致性检查：

```powershell
pnpm guide:check
```

硬性规则：

- `docs/repository-guide.md` 是源文件。
- E 盘路径是本机 Obsidian 镜像文件，属于可选配置。
- 如果 E 盘镜像文件已有 YAML frontmatter，同步时必须保留 frontmatter，只更新指南正文。
- 镜像文件不存在时，`guide:sync` 和 `guide:check` 提示并跳过，不报错、不自动创建；如需启用镜像，先与用户确认。
- 该检查不接入 GitHub Actions，因为 GitHub Actions 无法访问本机 E 盘。

### 5. 经验库

项目经验存放在：

```text
docs/experience/
```

经验库用于沉淀已经验证过的失败、踩坑、根因和解法。它不是聊天流水账。

遇到错误、CI 失败、发布异常、路径问题、跨电脑同步问题、skill 触发或验证问题时，先运行：

```powershell
pnpm experience:search "关键词"
```

只读取搜索结果中相关的少量卡片，不要一次性读取整个 `docs/experience/cards/` 目录。

新增经验卡片：

```powershell
pnpm experience:new <slug> --domain <domain> --tags "<tag1,tag2>"
```

经验卡片必须包含触发场景、症状、根因、解法、适用边界和验证记录。

### 6. 双电脑协同

公司电脑和家里电脑之间以 GitHub 仓库作为唯一源码事实源。

详细规则见：

```text
docs/multi-computer-workflow.md
```

每台电脑开始工作前：

```powershell
cd D:\nexgaios-skills
node tools/skills/skill-cli.mjs env-check
git status --short --branch
git fetch origin
git pull --ff-only
pnpm install --frozen-lockfile
```

如果环境检查发现缺失项，不要直接安装或启用工具；先报告用户并等待明确批准。

如果 `pnpm` 命令入口不可用，但环境检查显示 `corepack pnpm` 可用，可以在用户批准后使用：

```powershell
corepack pnpm install --frozen-lockfile
```

不要把某台电脑的运行时安装目录当作源码目录。安装目录概念路径是 `$env:USERPROFILE\.claude\skills`（Claude Code）和 `$env:USERPROFILE\.codex\skills`（Codex），它们只是当前电脑的安装目录。

开始工作前不默认同步到本机安装目录。需要刷新本机已安装 skill 时，先明确询问用户；用户确认后再运行 `pnpm skill:install <skill-id>` 或 `pnpm skill:sync`。

### 7. 未完成工作交接

如果公司电脑上的 skill 开发或维护没有完成，需要家里电脑继续，必须创建或更新交接文档：

```powershell
pnpm handoff:new <skill-id> --title "<交接标题>"
```

交接文档位置：

```text
docs/handoffs/<skill-id>/<yyyy-mm-dd>-<slug>.md
```

查看交接文档：

```powershell
pnpm handoff:list <skill-id>
```

交接文档必须记录：

- 目标 skill。
- 当前分支和 commit。
- 已完成事项。
- 未完成事项和下一步。
- 阻塞或风险。
- 需要继续查看的文件。
- 已运行的验证命令和结果。
- 是否已经同步到本机运行时安装目录。

交接文档必须随当前分支提交并推送到 GitHub。否则另一台电脑拉取仓库后，无法可靠知道下一步要做什么。

### 8. 新建 skill 模板

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

#### `skill:new` 的验证边界

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

### 9. PR 自动说明与 auto-merge

创建 PR 后，GitHub Actions 会自动评论：

- 本次直接修改了哪些 skill。
- 每个 skill 的版本是否变化。
- 合并到 `main` 后是否会发布。
- 修改了哪些共享工具、模板、CI 或文档。

这能避免你在 PR 页面里看不清影响范围。

创建指向 `main`、来源于本仓库分支、且不是 Draft 的 PR 后，使用本机已登录的 GitHub CLI 启用 auto-merge：

```powershell
gh pr merge <PR 编号或 URL> --auto --squash --delete-branch
```

`validate` 通过后，GitHub 会自动 squash merge，并删除对应分支。

Draft PR 是暂停开关。只要 PR 仍是 Draft，就不会自动合并。

不要用 GitHub Actions 的 `GITHUB_TOKEN` 合并需要触发后续 workflow 的 PR。`GITHUB_TOKEN` 触发的合并不会再触发 `push` workflow，可能导致 `release-skills.yml` 不运行。

### 10. 防误传检查

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

### 11. GitHub Release Notes 中文化

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
- 运行时本机安装目录和源码目录容易混在一起。
- 很难一眼看清有哪些 skill、版本是多少、是否已纳入发布流程。

当前 monorepo 方案的价值是：

- 所有 skill 集中管理。
- 每个 skill 独立版本。
- 每个 skill 独立发布。
- 共享工具、模板、CI 可以统一维护。
- 旧 skill 可以逐个迁移，不需要一次性完成。
- 本机运行时安装目录和源码仓库职责分离。

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

如果需要同步到本机运行时，先询问用户。用户确认后，优先同步当前修改的单个 skill：

```powershell
pnpm skill:install lingxing-ad-operation-audit
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

2. 检查环境：

   ```powershell
   node tools/skills/skill-cli.mjs env-check
   ```

   如果发现缺失项，先报告用户并等待批准后再安装或修复。

3. 查看 skill 总览：

   ```powershell
   pnpm skill:list
   ```

4. 修改某个 skill：

   ```text
   skills/<domain>/<skill-id>/
   ```

5. 验证：

   ```powershell
   pnpm skill:validate <skill-id>
   ```

6. 询问用户是否要同步到本机运行时；用户确认后执行：

   ```powershell
   pnpm skill:install <skill-id>
   ```

7. 提交 PR 前检查：

   ```powershell
   pnpm skills:docs
   pnpm experience:search "当前问题关键词"
   pnpm guide:sync
   pnpm guide:check
   pnpm skills:guard
   pnpm skills:validate
   ```

## 当前仓库状态

当前已经纳入 monorepo 管理的 skill：

```text
skills/amazon/lingxing-ad-operation-audit
skills/knowledge-management/ob-notes
skills/product-design/apple-hig-web-design
skills/skill-governance/skill-doctor
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
