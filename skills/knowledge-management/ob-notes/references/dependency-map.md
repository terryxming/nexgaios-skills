<!-- 本文件由 scripts/build_depmap.py 自动生成，请勿手动编辑。 -->

# ob-notes 依赖图

> 本文件由 scripts/build_depmap.py 自动生成，请勿手动编辑。
> 修改 skill 后请运行 `python scripts/build_depmap.py` 刷新。

## 按文件

| 文件 | provides | depends_on |
|---|---|---|
| `CHANGELOG.md` | — | — |
| `README.md` | — | — |
| `SKILL.md` | mode-decision, iron-laws, trigger-rule | kb-root, landing-rule, preflight-flow, credibility-spec, tag-system, frontmatter-spec, datestamp-rule, research-template, practice-template, devlog-template, jsonl-schema, revisit-signal, review-flow, maintenance-flow, source-fidelity, anti-patterns, quality-rubric, mastery-lens, layout-rule |
| `dev-log.md` | — | — |
| `references/anti-patterns.md` | anti-patterns | credibility-spec |
| `references/frontmatter-tags.md` | credibility-spec, tag-system, frontmatter-spec, linking-convention, naming-rule, datestamp-rule, layout-rule | — |
| `references/maintenance.md` | controlled-vocab, dependency-spec, version-rule, maintenance-flow, ssot-registry | — |
| `references/mode-a-practice.md` | practice-template | credibility-spec, tag-system, frontmatter-spec, linking-convention, naming-rule, datestamp-rule |
| `references/mode-a-research.md` | research-template, source-fidelity, mastery-lens | credibility-spec, tag-system, frontmatter-spec, linking-convention, naming-rule, datestamp-rule |
| `references/mode-b-devlog.md` | devlog-template, devlog-integration | credibility-spec, frontmatter-spec, datestamp-rule, landing-rule |
| `references/monitoring.md` | jsonl-schema, revisit-signal, review-flow | kb-root, frontmatter-spec, concurrency-safe, credibility-spec |
| `references/preflight.md` | kb-root, landing-rule, preflight-flow, path-normalize, concurrency-safe | — |
| `references/quality-check.md` | quality-rubric | credibility-spec, source-fidelity, mastery-lens |
| `scripts/build_depmap.py` | — | dependency-spec, controlled-vocab, ssot-registry |

## 按规则项（反向索引）

| 规则项 | 定义于 | 被谁依赖 |
|---|---|---|
| `anti-patterns` | `references/anti-patterns.md` | `SKILL.md` |
| `concurrency-safe` | `references/preflight.md` | `references/monitoring.md` |
| `controlled-vocab` | `references/maintenance.md` | `scripts/build_depmap.py` |
| `credibility-spec` | `references/frontmatter-tags.md` | `references/anti-patterns.md`, `references/mode-a-practice.md`, `references/mode-a-research.md`, `references/mode-b-devlog.md`, `references/monitoring.md`, `references/quality-check.md`, `SKILL.md` |
| `datestamp-rule` | `references/frontmatter-tags.md` | `references/mode-a-practice.md`, `references/mode-a-research.md`, `references/mode-b-devlog.md`, `SKILL.md` |
| `dependency-spec` | `references/maintenance.md` | `scripts/build_depmap.py` |
| `devlog-integration` | `references/mode-b-devlog.md` | — |
| `devlog-template` | `references/mode-b-devlog.md` | `SKILL.md` |
| `frontmatter-spec` | `references/frontmatter-tags.md` | `references/mode-a-practice.md`, `references/mode-a-research.md`, `references/mode-b-devlog.md`, `references/monitoring.md`, `SKILL.md` |
| `iron-laws` | `SKILL.md` | — |
| `jsonl-schema` | `references/monitoring.md` | `SKILL.md` |
| `kb-root` | `references/preflight.md` | `references/monitoring.md`, `SKILL.md` |
| `landing-rule` | `references/preflight.md` | `references/mode-b-devlog.md`, `SKILL.md` |
| `layout-rule` | `references/frontmatter-tags.md` | `SKILL.md` |
| `linking-convention` | `references/frontmatter-tags.md` | `references/mode-a-practice.md`, `references/mode-a-research.md` |
| `maintenance-flow` | `references/maintenance.md` | `SKILL.md` |
| `mastery-lens` | `references/mode-a-research.md` | `references/quality-check.md`, `SKILL.md` |
| `mode-decision` | `SKILL.md` | — |
| `naming-rule` | `references/frontmatter-tags.md` | `references/mode-a-practice.md`, `references/mode-a-research.md` |
| `path-normalize` | `references/preflight.md` | — |
| `practice-template` | `references/mode-a-practice.md` | `SKILL.md` |
| `preflight-flow` | `references/preflight.md` | `SKILL.md` |
| `quality-rubric` | `references/quality-check.md` | `SKILL.md` |
| `research-template` | `references/mode-a-research.md` | `SKILL.md` |
| `review-flow` | `references/monitoring.md` | `SKILL.md` |
| `revisit-signal` | `references/monitoring.md` | `SKILL.md` |
| `source-fidelity` | `references/mode-a-research.md` | `references/quality-check.md`, `SKILL.md` |
| `ssot-registry` | `references/maintenance.md` | `scripts/build_depmap.py` |
| `tag-system` | `references/frontmatter-tags.md` | `references/mode-a-practice.md`, `references/mode-a-research.md`, `SKILL.md` |
| `trigger-rule` | `SKILL.md` | — |
| `version-rule` | `references/maintenance.md` | — |
