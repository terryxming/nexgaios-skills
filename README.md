# nexgaios-skills

这是 Nexgaios Codex 技能的统一源码仓库。

这个仓库按三层边界管理：

- 仓库边界：统一管理脚本、CI、模板和发布规则。
- 业务域边界：只用于分类，例如 `amazon`、`product-design`。
- 发布边界：永远是单个技能目录。

## 目录结构

```text
skills/
  <domain>/
    <skill-id>/
      skill.yaml
      SKILL.md
      README.md
      CHANGELOG.md

tools/
  skills/
    skill-cli.mjs

templates/
  skill/
```

## 日常命令

新建技能：

```bash
pnpm skill:new amazon amazon-review-insight
```

新建命令会生成 `SKILL.md`、`skill.yaml`、`README.md`、`CHANGELOG.md`，以及 `references/`、`scripts/`、`assets/`、`tests/` 目录说明。

从本地目录或 GitHub 仓库导入技能：

```bash
pnpm skill:import product-design apple-hig-web-design --from https://github.com/terryxming/apple-hig-web-design --ref v1.1
```

如果目标技能已存在，需要显式追加 `--force` 才会覆盖：

```bash
pnpm skill:import product-design apple-hig-web-design --from D:\skills\apple-hig-web-design --version 1.1.0 --force
```

列出所有技能：

```bash
pnpm skill:list
```

验证单个技能：

```bash
pnpm skill:validate lingxing-ad-operation-audit
```

安装到本地 Codex 运行目录：

```bash
pnpm skill:install lingxing-ad-operation-audit
```

安装仓库内全部 active 技能到本机 Codex：

```bash
pnpm skill:sync
```

`skill:sync` 默认只覆盖本仓库中同名 skill 的安装目录，不删除本机 Codex 里的其他 skill。如果要删除曾由本仓库安装、但当前仓库已经不存在的旧 skill，显式使用：

```bash
pnpm skill:sync --prune
```

重新生成技能总览和业务域 README：

```bash
pnpm skills:docs
```

检查生成文档是否已同步：

```bash
pnpm skills:docs:check
```

检查是否误提交临时文件、大文件或常见密钥格式：

```bash
pnpm skills:guard
```

提交技能变更、推送分支并创建 PR：

```bash
pnpm skill:ship lingxing-ad-operation-audit --patch -m "优化审计报告"
```

需要时可以使用 `--minor`、`--major` 或 `--no-release`。

Windows 下也可以直接使用仓库里的包装脚本：

```bash
.\skill.cmd new amazon amazon-review-insight
.\skill.cmd validate lingxing-ad-operation-audit
.\skill.cmd ship lingxing-ad-operation-audit --patch -m "优化审计报告"
```

如果要自动创建 PR，需要先安装并登录 GitHub CLI：

```bash
gh auth login
```

## 发布规则

只有某个技能自己的 `skill.yaml` 版本号发生变化时，才会发布这个技能。

更新 `tools/`、`templates/`、CI 或其他技能，不会发布无关技能。

PR 验证会自动评论本次变更涉及哪些 skill、版本是否变化、合并到 `main` 后是否会发布。GitHub Release 使用 `pnpm skill-cli release-notes` 生成中文发布说明。
