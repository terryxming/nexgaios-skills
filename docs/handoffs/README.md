# Skill 交接文档

本目录用于记录未完成的 skill 开发或维护工作，服务于公司电脑和家里电脑之间的续接。

交接文档不是聊天记录，也不是发布记录。它只记录下一台电脑继续工作必须知道的信息：目标、已完成、未完成、阻塞、验证状态、需要继续查看的文件，以及是否已经同步到本机 Codex 安装目录。

## 创建交接文档

```powershell
pnpm handoff:new <skill-id> --title "<交接标题>"
```

生成路径：

```text
docs/handoffs/<skill-id>/<yyyy-mm-dd>-<slug>.md
```

## 查看交接文档

查看全部：

```powershell
pnpm handoff:list
```

查看某个 skill：

```powershell
pnpm handoff:list <skill-id>
```

## 使用规则

- 如果一次 skill 开发或维护没有完成，并且需要换电脑继续，必须创建或更新交接文档。
- 交接文档必须随当前分支提交并推送到 GitHub；否则另一台电脑拉不到。
- 交接文档必须写明已经运行的验证命令，不能只写“已验证”。
- 修改过 `skills/<domain>/<skill-id>/` 后，最终回复前必须显式询问用户是否要同步到本机 Codex 安装目录。
- 只有用户明确同意同步时，才运行 `pnpm skill:install <skill-id>` 或 `pnpm skill:sync`。
