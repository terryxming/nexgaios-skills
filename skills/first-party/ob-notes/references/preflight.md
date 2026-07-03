---
name: preflight
metadata:
  version: 1.0.0
  provides: [kb-root, landing-rule, preflight-flow, path-normalize]
  depends_on: []
---

# 环境契约 — Obsidian 落点解析与写盘前校验

本文件是所有写盘动作的前置关卡。它定义 Obsidian 知识库根路径怎么读、笔记落点在哪、写盘前必须校验什么、跨系统路径如何归一。**任何写入笔记的动作，都必须先走完这里的 preflight 四步。**

## 目录

- [1. kb-root：知识库根路径](#kb-root)
- [2. landing-rule：Obsidian 入口落点](#landing)
- [3. preflight-flow：写盘前四步校验](#flow)
- [4. path-normalize：跨系统路径归一](#norm)

---

<a id="kb-root"></a>
## 1. kb-root：知识库根路径

落点不硬编码绝对路径，统一基于一个可配置的根路径变量 `{kb_root}`。**配置存放在 skill 之外**，因为 skill 会被更新覆盖，配置若写进 skill 会在升级时丢失。

**读取顺序**（取第一个命中的）：

1. 环境变量 `OB_NOTES_KB_ROOT`。
2. 用户配置文件 `~/.config/ob-notes/config.json` 里的 `kb_root` 字段（Windows 为 `%USERPROFILE%\.config\ob-notes\config.json`）。
3. 都没有 → **停下来问用户知识库根路径，绝不猜测、绝不用任何默认值写盘**（与铁律一一致）。

> 发布说明：本 skill 不内置任何具体路径。使用者首次使用前，应设置上述环境变量或配置文件指向自己的知识库根。例如某用户的 `kb_root` 是 `<盘符>:\my-kbase`（`<盘符>` 代指其实际盘符），则由其自行配置，不写进 skill 源码。

配置文件示例（用户自建，不随 skill 发布；`<盘符>` 替换为实际盘符）：

```json
{ "kb_root": "<盘符>:\\my-kbase" }
```

---

<a id="landing"></a>
## 2. landing-rule：Obsidian 入口落点

本 skill 只把笔记投递到 Obsidian 知识库统一入口：

| 用途 | 落点 |
|---|---|
| 对话价值沉淀 | `{kb_root}/00 - raw/00 - inbox/` |

说明：

- 入口目录只负责接收 agent 产出的结构化笔记；下游路由、Wiki 编译、长期归档不归本 skill 管。
- 不根据当前 git 仓库、项目路径或 skill 目录推断落点。
- 不写项目目录，不创建或更新 `dev-log.md`、`README.md`、代码注释或项目流水记录。

---

<a id="flow"></a>
## 3. preflight-flow：写盘前四步校验

每次写入前按序执行，任一步不通过即停：

1. **解析落点**：先解析 `{kb_root}`（第 1 节），再得到确切目标目录 `{kb_root}/00 - raw/00 - inbox/`。未配置则停下来问。
2. **存在性检查**：目标目录是否存在？
   - 存在 → 继续。
   - 不存在 → **停下来问用户**："目标目录 `<路径>` 未找到，是路径变了，还是要我在此创建？" 由用户拍板，**绝不静默新建、绝不退而写到当前目录**（铁律一）。
3. **可写性检查**：当前 agent 是否具备文件写入工具 / 权限？
   - 有 → 继续。
   - 无 → 不假装成功，告知用户"此环境无法写文件"，把完整笔记内容**直接贴出来**让其手动保存。
4. **路径归一**：按第 4 节对路径做跨系统适配后再写。

校验全过 → 执行写入。任何一步触发"停下来问"，都不要在未确认前写盘。

---

<a id="norm"></a>
## 4. path-normalize：跨系统路径归一

本 skill 跨多 agent、多系统运行（同一用户可能在 Windows 本机用 Claude、在 WSL / Linux / macOS 用 Codex）。`{kb_root}` 在不同系统下形态不同，写盘前必须归一：

- **识别运行环境**：先判断当前是 Windows 原生、WSL、还是 POSIX（Linux/macOS）。
- **分隔符**：内部统一用 `/` 处理，最终写盘时按目标系统转换（Windows 原生可用 `\` 或 `/`，POSIX 用 `/`）。
- **盘符与挂载**：Windows 的 `<盘符>:\my-kbase` 在 WSL 下通常是 `/mnt/<盘符小写>/my-kbase`。若 `kb_root` 配置值与当前运行环境不匹配（如配置是 Windows 盘符路径但当前在 WSL），按已知映射换算；无法确定映射时，停下来问用户，不擅自猜测。
- **不在路径里放敏感信息**，不把路径塞进 URL 参数。

原则与铁律一一致：路径只要有不确定，就停下来问，不赌。
