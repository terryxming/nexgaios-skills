# 技能协议

每个技能都可以拥有自己的目录结构和发布节奏。monorepo 只要求技能根目录里存在一个小型 `skill.yaml` 文件。

必填字段：

```yaml
id: lingxing-ad-operation-audit
domain: amazon
version: 0.1.0
entry: SKILL.md
status: active
```

可选命令：

```yaml
validate:
  command: npm test

package:
  command: npm run package

release:
  tag: lingxing-ad-operation-audit@0.1.0
```

导入来源也可以记录在 `source` 中：

```yaml
source:
  repository: "https://github.com/terryxming/apple-hig-web-design"
  ref: "v1.1"
  commit: "4115b523cb0649b7a595d478abb4dfeffec5162f"
```

规则：

- 业务域目录只负责分类，不作为发布单位。
- 每次发布只对应一个技能。
- CI 只在该技能的 `version` 变化时发布它。
- 共享工具变更可以触发验证，但不会触发技能发布。
- 复杂技能可以包含 `references/`、`scripts/`、`assets/`、`tests/` 或 MCP 代码。

Windows 下可以使用仓库包装脚本：

```powershell
.\skill.cmd validate lingxing-ad-operation-audit
.\skill.cmd ship lingxing-ad-operation-audit --patch -m "优化审计报告"
```

也可以使用推荐的 pnpm 入口：

```powershell
pnpm skill:validate lingxing-ad-operation-audit
pnpm skill:ship lingxing-ad-operation-audit --patch -m "优化审计报告"
```

导入已有技能：

```powershell
pnpm skill:import <domain> <skill-id> --from <本地目录或 GitHub URL> [--ref <tag/branch>] [--version <semver>] [--force]
```

导入命令会复制技能文件、补齐缺失的 `skill.yaml`、`README.md` 和 `CHANGELOG.md`、更新 `catalog.yaml`，并做基础协议验证。

## 新建 skill 的验证边界

`pnpm skill:new <domain> <skill-id>` 只证明“仓库骨架和基础协议已经生成”，不证明“这个 skill 的业务能力已经正确”。

`skill:new` 能自动完成并可被基础命令验证的范围：

- 创建 `skills/<domain>/<skill-id>/`。
- 生成 `skill.yaml`、`SKILL.md`、`README.md`、`CHANGELOG.md`。
- 生成 `references/`、`scripts/`、`assets/`、`tests/` 目录说明。
- 更新 `catalog.yaml`。
- 允许 `pnpm skill:validate <skill-id>` 检查必填字段、SemVer 版本号、目录位置和入口文件。

`skill:new` 不验证以下业务能力：

- 触发描述是否覆盖真实用户表达。
- 工作流程是否足以完成目标任务。
- references 是否完整、准确、按需路由。
- scripts 是否正确、安全、可复现。
- 输出格式是否符合用户验收标准。
- 发布版本是否可回滚、可测试、可复盘。

业务能力需要通过该 skill 自己的验证命令、脚本测试、真实 prompt 测试、误触发测试、输出契约测试和必要的 forward-test 证明。

## 安装与同步

安装单个 skill：

```powershell
pnpm skill:install <skill-id>
```

同步仓库内全部 `status: active` 的 skill 到本机 Codex：

```powershell
pnpm skill:sync
```

同步命令默认不会删除本机 Codex 目录中其他来源的 skill。只有使用 `--prune` 时，才会删除带有本仓库安装标记、且当前仓库已经不存在的旧 skill。

执行边界：

- 每次修改 `skills/<domain>/<skill-id>/` 后，最终回复前必须显式询问用户是否要同步到本机 Codex 安装目录。
- 用户明确同意同步单个 skill 时，优先运行 `pnpm skill:install <skill-id>`。
- 用户明确要求同步全部 active skill 时，才运行 `pnpm skill:sync`。
- 不得把“源码已更新”表述为“本机 Codex 已安装更新”。

## 生成文档

生成稳定的仓库文档：

```powershell
pnpm skills:docs
```

该命令会生成：

- `docs/skills-overview.md`
- `skills/<domain>/README.md`

这些文档只记录仓库内稳定信息，不记录本机安装状态。原因是本机安装状态属于机器状态，在 Windows 本机和 GitHub Actions Linux runner 上不一致。

## PR 说明与发布说明

PR 变更说明：

```powershell
pnpm skills:pr-summary --base origin/main...HEAD
```

Release Notes：

```powershell
node tools/skills/skill-cli.mjs release-notes <skill-id> --base <before-sha>...HEAD
```

发布判断严格使用 `skill.yaml` 的 `version` 字段：版本号变化则发布该 skill，版本号未变化则不发布该 skill。

## 防误传检查

运行：

```powershell
pnpm skills:guard
```

检查范围包括：

- `.env`、`.env.local` 等本地环境变量文件。
- `artifacts/`、`data/`、`outputs/`、`reports/`、`screenshots/`、`tmp/`、`temp/` 中的生成产物。
- `__pycache__/`、`.pytest_cache/`、`.mypy_cache/`、`node_modules/`、`dist/` 等缓存或构建目录。
- 超过 5 MiB 的文件。
- 常见 GitHub token、OpenAI API key、AWS access key、private key、Slack token 格式。

该检查是误提交拦截器，不等同于完整安全审计。
