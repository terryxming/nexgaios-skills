---
name: monitoring
metadata:
  version: 0.1.1
  provides: [jsonl-schema, revisit-signal, review-flow]
  depends_on: [kb-root, frontmatter-spec, concurrency-safe, credibility-spec]
---

# 监控与复盘

让本 skill 能用真实使用数据自我证伪、定向迭代，而不是凭空设计。监控只记"机械可得且真能驱动迭代决策"的东西，自身也遵守"ROI 必须为正"——不为复盘而复盘。

## 目录

- [1. jsonl-schema：沉淀日志字段](#schema)
- [2. revisit-signal：回访信号](#revisit)
- [3. review-flow：两周复盘](#review)

---

<a id="schema"></a>
## 1. jsonl-schema：沉淀日志字段

每次执行沉淀后，向 `{kb_root}/_meta/capture-log.jsonl` 追加一条单行 JSON（追加方式见 preflight.md 的 concurrency-safe）。字段刻意精简——只留能驱动某个具体迭代决策的：

```json
{"ts":"2026-06-25T14:30:00+08:00","mode":"A","trigger":"explicit","type":"研究型","template":"research","action":"append","credibility":{"已验证":2,"待验证":3,"推测":0},"target":"{kb_root}/00 - raw/00 - inbox/Loop Engineering 是什么.md"}
```

| 字段 | 含义 | 能驱动的迭代决策 |
|---|---|---|
| `ts` | 时间戳（含时区） | 时间序列分析 |
| `mode` | A / B | 看两类产出比例，决定优先级投向 |
| `trigger` | explicit / wrap-up | 看收尾触发到底用不用得上 |
| `type` | 研究型/实战型/项目日志 | 看哪个子类产出却从不回访 |
| `template` | research/practice/devlog | 配合回访看模板是否生效 |
| `action` | new / append | 看增量机制实际触发率 |
| `credibility` | 三档各计数 | 看笔记水分（待验证/推测占比） |
| `target` | 落点路径 | 看落点判定是否飘 |

刻意**不记**：压缩前后字数（虚荣指标，不驱动决策）、agent 质量自评（自评无信度，与铁律三同理）、耗时/token（与沉淀质量无关）。

---

<a id="revisit"></a>
## 2. revisit-signal：回访信号

**每次读取一篇已有笔记时**（无论为追加沉淀还是用户查阅），机械地更新该笔记 frontmatter：`read_count +1`、`last_read` 设为当天。纯计数，零额外判断。

这是补足"多数笔记不会被再读"这一盲区的唯一客观信号——没有它，复盘无法回答"哪些笔记真有价值"。字段定义见 frontmatter-tags.md 的 frontmatter-spec；本规则只定义"何时如何更新"。

---

<a id="review"></a>
## 3. review-flow：两周复盘

每两周一次，让 agent 读 `capture-log.jsonl` + 扫笔记的回访信号，产出可执行结论。

**铁律级注意：回访次数低 ≠ 该砍。** 低频但关键的"保险型知识"（如某个罕见报错的解法，一年用一次但那次价值千金）正是本 skill 要保护的对象。用回访次数一刀切会误杀它，违背本 skill"怕忘"的初衷。**删除决策永远留给人，复盘只呈现、不替用户删。**

复盘重心放在不会误杀价值的维度，产出三类结论：

1. **可信度健康度**：`credibility` 里"待验证 + 推测"占比是否过高 → 笔记水分大，提示哪些该回头验证（不是删，是验证）。
2. **孤儿笔记**：扫出没有任何 `[[双链]]` 的笔记 → 可能游离于知识体系外，提示是否该织进网。
3. **可能腐化的 living 笔记**：`状态/持续` 但 `updated` 距今很久的笔记 → 提示复核是否过期，必要时改 `状态/待复核`。

低回访笔记单独**列出供人工判断**（区分"保险型"还是"废笔记"），但不附带"建议删除"。

复盘服务于维护知识质量，不替用户做删除决策——这是它与"自动清理"的根本区别。
