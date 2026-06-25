# knowledge-management 技能

> 此文件由 `pnpm skills:docs` 生成。不要手动编辑。

该业务域当前包含 2 个 active skill。

| 技能 | 版本 | 状态 | 说明 |
| --- | --- | --- | --- |
| [ob-notes](ob-notes/README.md) | 0.3.0 | active | 把与 agent 对话中产生的高价值信息（决策、踩坑、知识点、方案取舍、研究结论、项目进展）按统一规范沉淀成结构化 Markdown 笔记，回写到 Obsidian 知识库或项目目录。当用户说沉淀、记录、回写、存一下、写进笔记、记到 obsidian、更新 dev-log，或要求把对话里的上下文、决策、经验教训、研究结论、项目进展保存成笔记时使用——即使没有明说文件格式。项目类任务收尾、出现值得留存的决策或进展时也应触发。涉及把对话内容长期保存以备日后复用时务必使用本 skill，不要自行随意写 Markdown。 |
| [obsidian-knowledge-curator](obsidian-knowledge-curator/README.md) | 0.4.5 | active | 中文化 Obsidian / Markdown 信息组织与知识治理 skill。用于用户要求将踩坑、决策、知识点、复盘、想法、讨论、偏好、任务交接或有长期价值的上下文整理、改写、沉淀、回写到 Obsidian 或 Markdown 知识库时；也用于审查旧笔记为什么读不下去、识别流水账和噪音、设计更有阅读欲望的笔记结构；还用于维护 skill 或项目母文档、项目上下文、迭代时间轴、决策索引、未闭环事项、Obsidian 美化版、CSS snippet、callout/表格/Mermaid 视觉版式和渲染验收。默认独立于任何特定知识库、数据库、流水线或 vault 规则，先预览后写入。 |

## 业务域命令

```powershell
pnpm skill:sync
pnpm skills:validate
```
