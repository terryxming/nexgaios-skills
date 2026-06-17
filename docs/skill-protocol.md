# Skill Protocol

Each skill owns its structure and release lifecycle. The monorepo only requires a small `skill.yaml` file at the skill root.

Required fields:

```yaml
id: lingxing-ad-operation-audit
domain: amazon
version: 0.1.0
entry: SKILL.md
status: active
```

Optional commands:

```yaml
validate:
  command: npm test

package:
  command: npm run package

release:
  tag: lingxing-ad-operation-audit@0.1.0
```

Rules:

- Domain directories are grouping only.
- A release is scoped to exactly one skill.
- CI releases a skill only when that skill's `version` changes.
- Shared tooling changes may trigger validation, but they do not trigger skill releases.
- Complex skills may have `references/`, `scripts/`, `assets/`, `tests/`, or MCP code.

On Windows, use the repository wrapper:

```powershell
.\skill.cmd validate lingxing-ad-operation-audit
.\skill.cmd ship lingxing-ad-operation-audit --patch -m "Improve audit report"
```
