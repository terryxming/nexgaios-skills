<!-- 本文件由 scripts/build_depmap.py 自动生成，请勿手动编辑。 -->

# ob-notes 依赖图

> 本文件由 scripts/build_depmap.py 自动生成，请勿手动编辑。
> 修改 skill 后请运行 `python scripts/build_depmap.py` 刷新。

## 按文件

| 文件 | provides | depends_on |
|---|---|---|
| `CHANGELOG.md` | — | — |
| `SKILL.md` | mode-decision, iron-laws, trigger-rule | kb-root, landing-rule, preflight-flow, signal-noise, presentation-modes, source-fidelity, credibility-spec, tag-system, frontmatter-spec, naming-rule, datestamp-rule, anti-patterns, quality-rubric, mastery-lens, layout-rule, maintenance-flow, feedback-loop |
| `dev-log.md` | — | — |
| `references/anti-patterns.md` | anti-patterns | credibility-spec |
| `references/distill.md` | signal-noise, source-fidelity | credibility-spec, anti-patterns |
| `references/feedback.md` | feedback-loop | — |
| `references/frontmatter-tags.md` | credibility-spec, tag-system, frontmatter-spec, linking-convention, naming-rule, datestamp-rule, layout-rule | — |
| `references/maintenance.md` | controlled-vocab, dependency-spec, version-rule, maintenance-flow, ssot-registry | — |
| `references/preflight.md` | kb-root, landing-rule, preflight-flow, path-normalize | — |
| `references/presentation.md` | presentation-modes, mastery-lens | source-fidelity, credibility-spec, tag-system, frontmatter-spec, linking-convention, naming-rule, datestamp-rule |
| `references/quality-check.md` | quality-rubric | signal-noise, anti-patterns, credibility-spec, source-fidelity, mastery-lens |
| `scripts/build_depmap.py` | — | dependency-spec, controlled-vocab, ssot-registry |

## 按规则项（反向索引）

| 规则项 | 定义于 | 被谁依赖 |
|---|---|---|
| `anti-patterns` | `references/anti-patterns.md` | `references/distill.md`, `references/quality-check.md`, `SKILL.md` |
| `controlled-vocab` | `references/maintenance.md` | `scripts/build_depmap.py` |
| `credibility-spec` | `references/frontmatter-tags.md` | `references/anti-patterns.md`, `references/distill.md`, `references/presentation.md`, `references/quality-check.md`, `SKILL.md` |
| `datestamp-rule` | `references/frontmatter-tags.md` | `references/presentation.md`, `SKILL.md` |
| `dependency-spec` | `references/maintenance.md` | `scripts/build_depmap.py` |
| `feedback-loop` | `references/feedback.md` | `SKILL.md` |
| `frontmatter-spec` | `references/frontmatter-tags.md` | `references/presentation.md`, `SKILL.md` |
| `iron-laws` | `SKILL.md` | — |
| `kb-root` | `references/preflight.md` | `SKILL.md` |
| `landing-rule` | `references/preflight.md` | `SKILL.md` |
| `layout-rule` | `references/frontmatter-tags.md` | `SKILL.md` |
| `linking-convention` | `references/frontmatter-tags.md` | `references/presentation.md` |
| `maintenance-flow` | `references/maintenance.md` | `SKILL.md` |
| `mastery-lens` | `references/presentation.md` | `references/quality-check.md`, `SKILL.md` |
| `mode-decision` | `SKILL.md` | — |
| `naming-rule` | `references/frontmatter-tags.md` | `references/presentation.md`, `SKILL.md` |
| `path-normalize` | `references/preflight.md` | — |
| `preflight-flow` | `references/preflight.md` | `SKILL.md` |
| `presentation-modes` | `references/presentation.md` | `SKILL.md` |
| `quality-rubric` | `references/quality-check.md` | `SKILL.md` |
| `signal-noise` | `references/distill.md` | `references/quality-check.md`, `SKILL.md` |
| `source-fidelity` | `references/distill.md` | `references/presentation.md`, `references/quality-check.md`, `SKILL.md` |
| `ssot-registry` | `references/maintenance.md` | `scripts/build_depmap.py` |
| `tag-system` | `references/frontmatter-tags.md` | `references/presentation.md`, `SKILL.md` |
| `trigger-rule` | `SKILL.md` | — |
| `version-rule` | `references/maintenance.md` | — |
