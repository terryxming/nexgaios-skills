# ob-notes

把与 AI agent 对话中产生的高价值信息（决策、踩坑、知识点、方案取舍、研究结论、项目进展），按统一规范沉淀成结构化 Markdown 笔记，回写到 Obsidian 知识库或项目目录。

这是一个遵循 [Agent Skills 开放标准](https://agentskills.io) 的 skill，可被 Claude Code、Codex CLI、Gemini CLI 等兼容工具加载。

## 解决什么问题

口头讨论里最值钱的东西——为什么做某个决策、踩了什么坑怎么解的、一个验证过的知识点——会随对话结束蒸发。随手让 agent "记一下"又常出四类毛病：不知道记什么、压缩过狠、格式丑、没重点。ob-notes 用固定规范钉死这四点，并让多个 agent 产出一致的笔记。

## 两种沉淀

- **知识沉淀（Mode A）** → Obsidian 知识库
  - 研究型：一主题一笔记、长期生长、双链织网（如深挖某概念）。
  - 实战型：一事一笔记、带日期、写完冻结（如某报错的解法）。
- **项目记忆（Mode B）** → 跟所属项目走（dev-log）
  - 记录项目"当时为什么这么做、做到哪了、踩了什么坑"，让久别重逢的项目能无缝续上。

## 安装

将 `ob-notes/` 目录放入你的 agent 的 skills 目录：

- Claude Code / Claude.ai：放入 skills 插件目录后即可按描述自动触发。
- 其它兼容工具：参照各自的 skill 加载方式。

## 配置（首次使用必做）

ob-notes 不内置任何具体路径。使用前需告诉它你的知识库根路径 `{kb_root}`，二选一：

1. 环境变量：
   ```bash
   export OB_NOTES_KB_ROOT="/path/to/your/knowledge-base"
   ```
2. 配置文件 `~/.config/ob-notes/config.json`（Windows: `%USERPROFILE%\.config\ob-notes\config.json`）：
   ```json
   { "kb_root": "D:\\your-knowledge-base" }
   ```

未配置时，skill 会停下来询问，绝不猜测落点（这是设计上的安全保证）。

知识库目录约定：Mode A 笔记落 `{kb_root}/00 - raw/00 - inbox/`，监控日志落 `{kb_root}/_meta/`。

## 使用

直接对 agent 说"把刚才聊的沉淀一下""记录这个决策""更新 dev-log"等即可触发。项目类任务收尾时，agent 会主动问是否更新 dev-log。

## 环境要求

- 维护脚本 `scripts/build_depmap.py` 需要 Python 3（仅标准库，无第三方依赖）。该脚本仅供**维护本 skill** 时校验依赖关系用，日常沉淀不需要它。

## 维护与贡献

修改本 skill 前，请先读 `references/maintenance.md`——它规定了单一真相源、依赖声明规范、版本规则与修改流程。改动后运行：

```bash
python scripts/build_depmap.py
```

它会校验 MECE（一条规则只在一处定义）并刷新依赖图；校验不过会报错退出。

## 许可

本 skill 作为 `nexgaios-skills` monorepo 的一部分管理，许可遵循仓库根策略。
