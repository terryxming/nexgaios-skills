# 0006. skill 源域与分发物分层：开发文件域内聚合、分发时排除

- 状态:已接受（精化 [ADR-0005](0005-delegate-to-skill-creator.md) 决策 3）
- 日期:2026-07-03
- 决策人:terry（公司电脑）+ Claude


## 背景

ob-notes 迁入时，按 ADR-0005"skill 内不放 CHANGELOG.md"把 dev-log.md 与 CHANGELOG.md 外迁到 `docs/skill-logs/`。用户纠正：**每个 skill 是单一发布源（自治域），它的 dev-log、CHANGELOG 应留在该 skill 域内**。复盘发现原做法犯了概念错误——官方"skill 不含杂物"约束的真正对象是**分发给使用者的包**，不是**开发源**；把分发约束错套到源域上，代价是拆散 skill 的项目记忆（发现性差：迭代者不会想到去 docs/ 找 dev-log，ob-notes 自身"铁律五：先读 dev-log"也会落空）。


## 决策

1. **两层分离**：`skills/<name>/` = **自治开发域**（单一事实源），含运行文件 + 域内开发文件；`dist/` = **分发物**，只含运行所需。
2. **域内开发文件清单**（留在源、构建分发时排除）：顶层 `dev-log.md`（开发史/项目记忆）、顶层 `CHANGELOG.md`（人读版本叙事）、`evals/`（评测用例）。官方"不含 CHANGELOG/README 等"约束由 **build 排除**满足，不靠源域禁放。
3. **杂物门禁收窄**：lint 只禁与 `SKILL.md` 职责重复的文档（README.md / INSTALLATION_GUIDE.md / QUICK_REFERENCE.md 等）——它们在源域也无正当性；dev-log/CHANGELOG 放行。
4. **可移植门禁范围 = 会被分发的文件**：域内开发文件（dev-log/CHANGELOG/evals）排除扫描——历史与用例忠实记录真机路径是其本性（A4·7 不篡改历史），且不出域。
5. **版本机械参照不变**：git tag `skill-name/vX.Y.Z` + `metadata.version` 仍是 G③ 的机械锚点；CHANGELOG 是叙事（为什么改），二者职责不同、可共存。


## 证据

1. 官方 Codex skill-creator 的杂物条款语境是"skill 应只含 AI agent 完成任务所需信息"——针对**交付使用**的包（本机 `~/.codex/skills/.system/skill-creator/SKILL.md`，"What to Not Include in a Skill"节）；同文档亦认可 skill 域是开发单元（init/validate/iterate 全在域内）。
2. ob-notes 自身机制自洽性：其铁律五与 mode-b-devlog 规定"dev-log 跟项目走"——skill 的开发项目就是 skill 目录本身，dev-log 域内放置与其哲学一致（`skills/ob-notes/SKILL.md` 铁律五）。
3. 外迁的实际伤害在迁入当日即显现：dev-log 与 skill 分离后，`docs/skill-logs/` 的发现性依赖口口相传，无任何机制指向它。


## 影响

- `skills/ob-notes/` 收回 dev-log.md 与 CHANGELOG.md；`docs/skill-logs/` 删除。
- `tools/lint.py`：check_clutter 白名单化（禁 README 等、放行两开发文件）；check_portability 排除顶层 dev-log/CHANGELOG（evals 原已排除）。
- 纪律双份：E 桶二增第 4（杂物拦截）、第 5（版本存在）条；G 段与 H.2 相应改写。
- ADR-0005 决策 3 被本篇精化（源域允放，分发排除）。
- **build 脚本的排除清单**以本篇第 2 条为准（dist 专题实现时落地）。


## 存疑 / 待验证

- build 排除机制未实现（dist 专题推后中）——在此之前 dist 无产物，无泄漏风险；实现时须按第 2 条清单排除并加 dist 一致性门禁。
- 域内开发文件清单目前三项，后续若出现新类别（如设计稿），按同一判据归类：**运行不需要 + 开发需要 → 域内留、分发排**。


## 来源

- 本机 Codex skill-creator：`~/.codex/skills/.system/skill-creator/SKILL.md`（"What to Not Include in a Skill"）
- 本仓库 `skills/ob-notes/SKILL.md`（铁律五）、ADR-0005
