# nexgaios-skills

Monorepo for Nexgaios Codex skills.

The repository uses these boundaries:

- Repository boundary: shared governance, scripts, CI, templates.
- Domain boundary: cognitive grouping only, such as `amazon` or `product-design`.
- Release boundary: a single skill directory.

## Layout

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

## Daily Commands

Create a new skill:

```bash
pnpm skill:new amazon amazon-review-insight
```

List skills:

```bash
pnpm skill:list
```

Validate one skill:

```bash
pnpm skill:validate lingxing-ad-operation-audit
```

Install one skill into the local Codex runtime:

```bash
pnpm skill:install lingxing-ad-operation-audit
```

Ship a skill change to a branch and open a PR:

```bash
pnpm skill:ship lingxing-ad-operation-audit --patch -m "Improve audit report"
```

Use `--minor`, `--major`, or `--no-release` when appropriate.

On Windows, the direct wrapper is also available:

```bash
.\skill.cmd new amazon amazon-review-insight
.\skill.cmd validate lingxing-ad-operation-audit
.\skill.cmd ship lingxing-ad-operation-audit --patch -m "Improve audit report"
```

For automatic PR creation, install and log in to GitHub CLI:

```bash
gh auth login
```

## Release Rule

A skill is released only when its own `skill.yaml` version changes.

Updating `tools/`, `templates/`, CI, or another skill does not release unrelated skills.
