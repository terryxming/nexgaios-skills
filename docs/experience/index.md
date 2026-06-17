# 经验检索索引

本文件只作为检索入口，不承载完整经验正文。

## 检索命令

```powershell
pnpm experience:search "<关键词>"
```

## 关键词路由

| 遇到的问题 | 推荐关键词 |
| --- | --- |
| GitHub CLI 找不到、`gh` 不在 PATH | `GitHub CLI PATH` |
| GitHub 登录、PR、release 命令异常 | `GitHub CLI gh auth release` |
| `docs/repository-guide.md` 与 Obsidian 不一致 | `repository-guide Obsidian mirror` |
| E 盘 Obsidian 文件缺失 | `Obsidian mirror missing` |
| `git status --porcelain` 路径解析异常 | `git status porcelain trim` |
| 新建 skill 后不知道验证边界 | `skill:new 骨架 业务能力 边界` |
| 两台电脑协同、pull/push/同步安装目录 | `multi-computer workflow` |
| 未完成工作换电脑继续 | `handoff 交接 未完成 下一步` |
| 修改 skill 后是否同步到本机 Codex | `skill install sync 安装目录` |
| PR 是否会自动合并、CI 通过后的行为 | `pr auto-merge validate` |

## 使用规则

1. 先用关键词搜索。
2. 只阅读搜索结果中相关的少量卡片。
3. 如果没有命中，再读本文件扩展关键词。
4. 问题解决后，如果经验可复用，新增或更新经验卡片。
