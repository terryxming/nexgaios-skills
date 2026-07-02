# Impact 审查回执

本目录存放 impact 硬检查的机器可读审查回执。

当某个文件变更触发 `impact.yaml` 契约组，但关联 witness 文件不需要同步修改时，必须在当前 PR 中新增一份回执文件，说明已经检查过且为什么不需要修改。

推荐路径：

```text
docs/impact-reviews/<skill-id>/<yyyy-mm-dd>-<slug>.yaml
```

推荐格式：

```yaml
skill: obsidian-knowledge-curator
date: 2026-06-23
changed:
  - SKILL.md
reviews:
  - file: references/project-memory.md
    decision: no-change-needed
    reason: 本次只调整入口措辞，没有改变母文档维护规则。
  - file: tests/README.md
    decision: updated
    reason: 已同步测试契约。
```

`decision` 可用值：

- `updated`：关联文件已同步修改。
- `no-change-needed`：已检查，确认无需修改。
- `not-applicable`：该关联在本次变更中不适用。
- `deferred`：延后处理；strict 模式下不会通过，必须改为已处理状态。

回执不是替代修改的捷径。它只用于记录“已经检查但确实无需修改”的判断，避免依赖图变成强制所有关联文件都要改的机械规则。
