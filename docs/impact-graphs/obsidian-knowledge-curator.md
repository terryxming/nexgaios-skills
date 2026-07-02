# obsidian-knowledge-curator Impact 关系图谱

> 此文件由 `pnpm skill:impact <skill-id> --visualize` 生成，用于让用户阅读 impact 契约关系。CI 的事实源仍是 skill 根目录的 `impact.yaml`。

## 30 秒读法

- Skill：`obsidian-knowledge-curator`
- 版本：`0.4.3`
- 节点数：27
- 边数：114
- 契约组：6

## 图谱

```mermaid
flowchart LR
  N_9bd90e4523["impact-governance-contract<br/>impact 规则自身变化必须同步检查 OKC 的维护说明和验证..."]:::contract
  N_738307c0fd["project-memory-contract<br/>母文档规则必须同步检查生命周期、样本和自动验证"]:::contract
  N_c6e873840b["reference-system-contract<br/>reference 文件变化会影响渐进式披露、测试契约和执行路由"]:::contract
  N_0f8b1b6e6e["skill-entry-contract<br/>SKILL.md 与 agent 配置共同定义触发边界和入口行为"]:::contract
  N_e71db7daa6["validation-contract<br/>自动验证脚本和测试矩阵共同定义可机器检查的业务契约"]:::contract
  N_9b2cb3cb13["visual-showcase-contract<br/>视觉版式规则、CSS snippet 和样本模板必须作为同一组能..."]:::contract
  N_928bfd015a["agents/openai.yaml"]:::changed
  N_68323bdbc3["assets/okc-showcase-snippet.css"]:::changed
  N_db0f58c20a["assets/okc-showcase-template.md"]:::changed
  N_35b279e15e["assets/README.md"]:::changed
  N_7dfc0c8963["CHANGELOG.md"]:::changed
  N_f56a584812["impact.yaml"]:::changed
  N_aa4aca445b["README.md"]:::changed
  N_70de1aa2bd["references/anti-patterns.md"]:::changed
  N_f6280308e3["references/evaluation.md"]:::changed
  N_0f41e38159["references/information-types.md"]:::changed
  N_047ad688c5["references/lifecycle-policy.md"]:::changed
  N_0f10b51748["references/markdown-layout-patterns.md"]:::changed
  N_b56150316e["references/obsidian-visual-patterns.md"]:::changed
  N_8a012c3c55["references/project-memory.md"]:::changed
  N_f4ace2f4a9["references/quality-rubric.md"]:::changed
  N_8013a2f47e["references/README.md"]:::changed
  N_fba70ed4b5["scripts/README.md"]:::changed
  N_77ab7378ed["scripts/validate_okc_contract.py"]:::changed
  N_4c9ccb0122["SKILL.md"]:::changed
  N_1c4a858a3c["skill.yaml"]:::changed
  N_766a6eb89a["tests/README.md"]:::changed
  N_4c9ccb0122 -->|"source"| N_0f8b1b6e6e
  N_928bfd015a -->|"source"| N_0f8b1b6e6e
  N_0f8b1b6e6e -->|"witness"| N_7dfc0c8963
  N_0f8b1b6e6e -->|"witness"| N_aa4aca445b
  N_0f8b1b6e6e -->|"witness"| N_8013a2f47e
  N_0f8b1b6e6e -->|"witness"| N_1c4a858a3c
  N_0f8b1b6e6e -->|"witness"| N_766a6eb89a
  N_8013a2f47e -->|"source"| N_c6e873840b
  N_70de1aa2bd -->|"source"| N_c6e873840b
  N_f6280308e3 -->|"source"| N_c6e873840b
  N_0f41e38159 -->|"source"| N_c6e873840b
  N_047ad688c5 -->|"source"| N_c6e873840b
  N_0f10b51748 -->|"source"| N_c6e873840b
  N_b56150316e -->|"source"| N_c6e873840b
  N_8a012c3c55 -->|"source"| N_c6e873840b
  N_f4ace2f4a9 -->|"source"| N_c6e873840b
  N_c6e873840b -->|"witness"| N_7dfc0c8963
  N_c6e873840b -->|"witness"| N_4c9ccb0122
  N_c6e873840b -->|"witness"| N_8013a2f47e
  N_c6e873840b -->|"witness"| N_77ab7378ed
  N_c6e873840b -->|"witness"| N_1c4a858a3c
  N_c6e873840b -->|"witness"| N_766a6eb89a
  N_047ad688c5 -->|"source"| N_738307c0fd
  N_8a012c3c55 -->|"source"| N_738307c0fd
  N_738307c0fd -->|"witness"| N_7dfc0c8963
  N_738307c0fd -->|"witness"| N_4c9ccb0122
  N_738307c0fd -->|"witness"| N_db0f58c20a
  N_738307c0fd -->|"witness"| N_8013a2f47e
  N_738307c0fd -->|"witness"| N_77ab7378ed
  N_738307c0fd -->|"witness"| N_1c4a858a3c
  N_738307c0fd -->|"witness"| N_766a6eb89a
  N_35b279e15e -->|"source"| N_9b2cb3cb13
  N_68323bdbc3 -->|"source"| N_9b2cb3cb13
  N_db0f58c20a -->|"source"| N_9b2cb3cb13
  N_b56150316e -->|"source"| N_9b2cb3cb13
  N_9b2cb3cb13 -->|"witness"| N_7dfc0c8963
  N_9b2cb3cb13 -->|"witness"| N_aa4aca445b
  N_9b2cb3cb13 -->|"witness"| N_35b279e15e
  N_9b2cb3cb13 -->|"witness"| N_1c4a858a3c
  N_9b2cb3cb13 -->|"witness"| N_766a6eb89a
  N_77ab7378ed -->|"source"| N_e71db7daa6
  N_766a6eb89a -->|"source"| N_e71db7daa6
  N_e71db7daa6 -->|"witness"| N_7dfc0c8963
  N_e71db7daa6 -->|"witness"| N_aa4aca445b
  N_e71db7daa6 -->|"witness"| N_fba70ed4b5
  N_e71db7daa6 -->|"witness"| N_1c4a858a3c
  N_f56a584812 -->|"source"| N_9bd90e4523
  N_9bd90e4523 -->|"witness"| N_7dfc0c8963
  N_9bd90e4523 -->|"witness"| N_aa4aca445b
  N_9bd90e4523 -->|"witness"| N_77ab7378ed
  N_9bd90e4523 -->|"witness"| N_1c4a858a3c
  N_9bd90e4523 -->|"witness"| N_766a6eb89a
  N_7dfc0c8963 -->|"mentions"| N_f56a584812
  N_7dfc0c8963 -->|"mentions"| N_4c9ccb0122
  N_7dfc0c8963 -->|"mentions"| N_8013a2f47e
  N_7dfc0c8963 -->|"mentions"| N_8a012c3c55
  N_7dfc0c8963 -->|"mentions"| N_b56150316e
  N_7dfc0c8963 -->|"mentions"| N_db0f58c20a
  N_7dfc0c8963 -->|"mentions"| N_68323bdbc3
  N_aa4aca445b -->|"mentions"| N_4c9ccb0122
  N_aa4aca445b -->|"mentions"| N_1c4a858a3c
  N_aa4aca445b -->|"mentions"| N_7dfc0c8963
  N_aa4aca445b -->|"mentions"| N_f56a584812
  N_aa4aca445b -->|"mentions"| N_8a012c3c55
  N_aa4aca445b -->|"mentions"| N_b56150316e
  N_aa4aca445b -->|"mentions"| N_db0f58c20a
  N_aa4aca445b -->|"mentions"| N_68323bdbc3
  N_4c9ccb0122 -->|"mentions"| N_0f41e38159
  N_4c9ccb0122 -->|"mentions"| N_70de1aa2bd
  N_4c9ccb0122 -->|"mentions"| N_f6280308e3
  N_4c9ccb0122 -->|"mentions"| N_8a012c3c55
  N_4c9ccb0122 -->|"mentions"| N_047ad688c5
  N_4c9ccb0122 -->|"mentions"| N_f56a584812
  N_4c9ccb0122 -->|"mentions"| N_0f10b51748
  N_4c9ccb0122 -->|"mentions"| N_b56150316e
  N_4c9ccb0122 -->|"mentions"| N_f4ace2f4a9
  N_f56a584812 -->|"mentions"| N_4c9ccb0122
  N_f56a584812 -->|"mentions"| N_928bfd015a
  N_f56a584812 -->|"mentions"| N_aa4aca445b
  N_f56a584812 -->|"mentions"| N_8013a2f47e
  N_f56a584812 -->|"mentions"| N_766a6eb89a
  N_f56a584812 -->|"mentions"| N_1c4a858a3c
  N_f56a584812 -->|"mentions"| N_7dfc0c8963
  N_f56a584812 -->|"mentions"| N_77ab7378ed
  N_f56a584812 -->|"mentions"| N_8a012c3c55
  N_f56a584812 -->|"mentions"| N_047ad688c5
  N_f56a584812 -->|"mentions"| N_db0f58c20a
  N_f56a584812 -->|"mentions"| N_b56150316e
  N_f56a584812 -->|"mentions"| N_35b279e15e
  N_f56a584812 -->|"mentions"| N_fba70ed4b5
  N_f56a584812 -->|"mentions"| N_f56a584812
  N_8013a2f47e -->|"mentions"| N_f56a584812
  N_047ad688c5 -->|"mentions"| N_1c4a858a3c
  N_047ad688c5 -->|"mentions"| N_7dfc0c8963
  N_047ad688c5 -->|"mentions"| N_f56a584812
  N_b56150316e -->|"mentions"| N_db0f58c20a
  N_b56150316e -->|"mentions"| N_68323bdbc3
  N_8a012c3c55 -->|"mentions"| N_4c9ccb0122
  N_77ab7378ed -->|"mentions"| N_1c4a858a3c
  N_77ab7378ed -->|"mentions"| N_7dfc0c8963
  N_77ab7378ed -->|"mentions"| N_4c9ccb0122
  N_77ab7378ed -->|"mentions"| N_8013a2f47e
  N_77ab7378ed -->|"mentions"| N_047ad688c5
  N_77ab7378ed -->|"mentions"| N_0f10b51748
  N_77ab7378ed -->|"mentions"| N_8a012c3c55
  N_77ab7378ed -->|"mentions"| N_766a6eb89a
  N_77ab7378ed -->|"mentions"| N_db0f58c20a
  N_77ab7378ed -->|"mentions"| N_f56a584812
  N_1c4a858a3c -->|"mentions"| N_4c9ccb0122
  N_1c4a858a3c -->|"mentions"| N_77ab7378ed
  N_766a6eb89a -->|"mentions"| N_f56a584812
  N_1c4a858a3c -->|"entry"| N_4c9ccb0122
  N_1c4a858a3c -->|"command"| N_4c9ccb0122
  N_1c4a858a3c -->|"command"| N_77ab7378ed
  classDef contract fill:#ede9fe,stroke:#7c3aed,color:#111827;
  classDef changed fill:#fef3c7,stroke:#d97706,color:#111827;
  classDef file fill:#f8fafc,stroke:#64748b,color:#111827;
  classDef missing fill:#fee2e2,stroke:#dc2626,color:#111827;
```

## 契约组

| 契约 | 说明 | Sources | Witnesses |
| --- | --- | --- | --- |
| `skill-entry-contract` | SKILL.md 与 agent 配置共同定义触发边界和入口行为 | `SKILL.md`<br>`agents/openai.yaml` | `README.md`<br>`references/README.md`<br>`tests/README.md`<br>`skill.yaml`<br>`CHANGELOG.md` |
| `reference-system-contract` | reference 文件变化会影响渐进式披露、测试契约和执行路由 | `references/*.md` | `SKILL.md`<br>`references/README.md`<br>`tests/README.md`<br>`scripts/validate_okc_contract.py`<br>`skill.yaml`<br>`CHANGELOG.md` |
| `project-memory-contract` | 母文档规则必须同步检查生命周期、样本和自动验证 | `references/project-memory.md`<br>`references/lifecycle-policy.md` | `SKILL.md`<br>`references/README.md`<br>`tests/README.md`<br>`assets/okc-showcase-template.md`<br>`scripts/validate_okc_contract.py`<br>`skill.yaml`<br>`CHANGELOG.md` |
| `visual-showcase-contract` | 视觉版式规则、CSS snippet 和样本模板必须作为同一组能力维护 | `references/obsidian-visual-patterns.md`<br>`assets/*` | `README.md`<br>`tests/README.md`<br>`assets/README.md`<br>`skill.yaml`<br>`CHANGELOG.md` |
| `validation-contract` | 自动验证脚本和测试矩阵共同定义可机器检查的业务契约 | `scripts/*.py`<br>`tests/README.md` | `README.md`<br>`scripts/README.md`<br>`skill.yaml`<br>`CHANGELOG.md` |
| `impact-governance-contract` | impact 规则自身变化必须同步检查 OKC 的维护说明和验证闭环 | `impact.yaml` | `README.md`<br>`tests/README.md`<br>`scripts/validate_okc_contract.py`<br>`skill.yaml`<br>`CHANGELOG.md` |

## 文件节点

| 文件 | 类型 | 状态 | 角色 |
| --- | --- | --- | --- |
| `agents/openai.yaml` | agents | 已变更 / 已覆盖 | `source:skill-entry-contract` |
| `assets/okc-showcase-snippet.css` | assets | 已变更 / 已覆盖 | `source:visual-showcase-contract` |
| `assets/okc-showcase-template.md` | assets | 已变更 / 已覆盖 | `witness:project-memory-contract`<br>`source:visual-showcase-contract` |
| `assets/README.md` | assets | 已变更 / 已覆盖 | `source:visual-showcase-contract`<br>`witness:visual-showcase-contract` |
| `CHANGELOG.md` | core | 已变更 / 已覆盖 | `witness:skill-entry-contract`<br>`witness:reference-system-contract`<br>`witness:project-memory-contract`<br>`witness:visual-showcase-contract`<br>`witness:validation-contract`<br>`witness:impact-governance-contract` |
| `impact.yaml` | core | 已变更 / 已覆盖 | `source:impact-governance-contract` |
| `README.md` | core | 已变更 / 已覆盖 | `witness:skill-entry-contract`<br>`witness:visual-showcase-contract`<br>`witness:validation-contract`<br>`witness:impact-governance-contract` |
| `references/anti-patterns.md` | references | 已变更 / 已覆盖 | `source:reference-system-contract` |
| `references/evaluation.md` | references | 已变更 / 已覆盖 | `source:reference-system-contract` |
| `references/information-types.md` | references | 已变更 / 已覆盖 | `source:reference-system-contract` |
| `references/lifecycle-policy.md` | references | 已变更 / 已覆盖 | `source:reference-system-contract`<br>`source:project-memory-contract` |
| `references/markdown-layout-patterns.md` | references | 已变更 / 已覆盖 | `source:reference-system-contract` |
| `references/obsidian-visual-patterns.md` | references | 已变更 / 已覆盖 | `source:reference-system-contract`<br>`source:visual-showcase-contract` |
| `references/project-memory.md` | references | 已变更 / 已覆盖 | `source:reference-system-contract`<br>`source:project-memory-contract` |
| `references/quality-rubric.md` | references | 已变更 / 已覆盖 | `source:reference-system-contract` |
| `references/README.md` | references | 已变更 / 已覆盖 | `witness:skill-entry-contract`<br>`source:reference-system-contract`<br>`witness:reference-system-contract`<br>`witness:project-memory-contract` |
| `scripts/README.md` | scripts | 已变更 / 已覆盖 | `witness:validation-contract` |
| `scripts/validate_okc_contract.py` | scripts | 已变更 / 已覆盖 | `witness:reference-system-contract`<br>`witness:project-memory-contract`<br>`source:validation-contract`<br>`witness:impact-governance-contract` |
| `SKILL.md` | core | 已变更 / 已覆盖 | `source:skill-entry-contract`<br>`witness:reference-system-contract`<br>`witness:project-memory-contract` |
| `skill.yaml` | core | 已变更 / 已覆盖 | `witness:skill-entry-contract`<br>`witness:reference-system-contract`<br>`witness:project-memory-contract`<br>`witness:visual-showcase-contract`<br>`witness:validation-contract`<br>`witness:impact-governance-contract` |
| `tests/README.md` | tests | 已变更 / 已覆盖 | `witness:skill-entry-contract`<br>`witness:reference-system-contract`<br>`witness:project-memory-contract`<br>`witness:visual-showcase-contract`<br>`source:validation-contract`<br>`witness:impact-governance-contract` |
