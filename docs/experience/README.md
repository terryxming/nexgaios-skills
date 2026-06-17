# 经验库

本目录用于沉淀 `nexgaios-skills` 项目中已经验证过的失败、踩坑、根因和解法。

经验库不是流水账。每条经验必须满足：

- 有明确触发场景。
- 有可观察症状。
- 有已经验证的根因，或明确写“未确认”。
- 有可执行解法。
- 有验证方式。
- 有适用边界。

## 使用方式

遇到错误、CI 失败、发布异常、路径不一致、跨电脑同步问题、skill 触发或验证问题时，先搜索经验库：

```powershell
pnpm experience:search "关键词"
```

示例：

```powershell
pnpm experience:search "GitHub CLI PATH"
pnpm experience:search "repository-guide Obsidian"
pnpm experience:search "git status porcelain"
```

只阅读搜索结果中相关的 1-3 条经验卡片，不要一次性读取整个 `docs/experience/cards/` 目录。

## 新增经验

创建新经验卡片：

```powershell
pnpm experience:new github-cli-path --domain repo --tags "github,windows,path"
```

经验卡片存放在：

```text
docs/experience/cards/
```

新增或修改经验后，运行：

```powershell
pnpm experience:search "刚刚新增的关键词"
pnpm skills:guard
```

## 维护边界

- 不记录聊天流水账。
- 不记录未验证的猜测；猜测必须标注为“未确认”。
- 不记录密钥、用户隐私数据、平台导出原始数据。
- 不把大段日志直接粘贴进经验卡片；只保留关键错误和复现条件。
- 同一问题如果已有卡片，优先更新原卡片，不新增重复卡片。
