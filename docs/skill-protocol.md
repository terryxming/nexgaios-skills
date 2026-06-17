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
