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
