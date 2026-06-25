---
name: preflight
metadata:
  version: 0.1.0
  provides: [kb-root, landing-rule, preflight-flow, path-normalize, concurrency-safe]
  depends_on: []
---

# 环境契约 — 落点解析与写盘前校验

本文件是所有写盘动作的前置关卡。它定义知识库根路径怎么读、各 Mode 落点在哪、写盘前必须校验什么、跨系统路径如何归一、并发写如何安全。**任何写入笔记或日志的动作，都必须先走完这里的 preflight 五步。**

## 目录

- [1. kb-root：知识库根路径](#kb-root)
- [2. landing-rule：各 Mode 落点](#landing)
- [3. preflight-flow：写盘前五步校验](#flow)
- [4. path-normalize：跨系统路径归一](#norm)
- [5. concurrency-safe：并发写安全](#conc)

---

<a id="kb-root"></a>
## 1. kb-root：知识库根路径

落点不硬编码绝对路径，统一基于一个可配置的根路径变量 `{kb_root}`。**配置存放在 skill 之外**——因为 skill 会被更新覆盖，配置若写进 skill 会在升级时丢失。

**读取顺序**（取第一个命中的）：

1. 环境变量 `OB_NOTES_KB_ROOT`。
2. 用户配置文件 `~/.config/ob-notes/config.json` 里的 `kb_root` 字段（Windows 为 `%USERPROFILE%\.config\ob-notes\config.json`）。
3. 都没有 → **停下来问用户知识库根路径，绝不猜测、绝不用任何默认值写盘**（与铁律一一致）。

> 发布说明：本 skill 不内置任何具体路径。使用者首次使用前，应设置上述环境变量或配置文件指向自己的知识库根。例如某用户的 `kb_root` 是 `D:\my-kbase`，则由其自行配置，不写进 skill 源码。

配置文件示例（用户自建，不随 skill 发布）：

```json
{ "kb_root": "D:\\my-kbase" }
```

---

<a id="landing"></a>
## 2. landing-rule：各 Mode 落点

落点由沉淀类型（Mode，判定见 SKILL.md 的 mode-decision）决定：

| 用途 | 落点 |
|---|---|
| Mode A 知识沉淀 | `{kb_root}/00 - raw/00 - inbox/`（知识库统一入口，只投递，下游路由/编译不归本 skill 管） |
| Mode B 项目记忆 | 跟所属项目走，落项目根（见下分支） |
| 监控日志 | `{kb_root}/_meta/capture-log.jsonl`（中立持久区，不进 skill 文件夹） |

**Mode B 落点分支**（按当前工作环境判定）：

1. 当前工作目录是 git 仓库 → 落仓库内 `docs/dev-log.md`。
2. 当前正在开发的项目本身就是某个 skill / 工具目录 → 落该目录根（如 `<该skill>/dev-log.md`）。
3. 非代码项目、且无项目目录 → 退回知识库的项目区 `{kb_root}/projects/<项目名>/dev-log.md`（**不是 inbox**——inbox 是知识流入口，不是项目记忆的家）。

判定原则：项目记忆永远跟着"它所属的那个项目"走，与代码同库版本控制；只有无处可归时才退回知识库项目区。

---

<a id="flow"></a>
## 3. preflight-flow：写盘前五步校验

每次写入前按序执行，任一步不通过即停：

1. **解析落点**：依据 Mode（mode-decision）与上面的 landing-rule，结合 git 检测，算出确切目标路径。先解析 `{kb_root}`（第 1 节）；未配置则停下来问。
2. **存在性检查**：目标目录是否存在？
   - 存在 → 继续。
   - 不存在 → **停下来问用户**："目标目录 `<路径>` 未找到，是路径变了，还是要我在此创建？" 由用户拍板，**绝不静默新建、绝不退而写到当前目录**（铁律一）。
3. **可写性检查**：当前 agent 是否具备文件写入工具 / 权限？
   - 有 → 继续。
   - 无 → 不假装成功，告知用户"此环境无法写文件"，把完整笔记内容**直接贴出来**让其手动保存。
4. **路径归一**：按第 4 节对路径做跨系统适配后再写。
5. **并发安全**：写 jsonl 等追加型文件时，按第 5 节方式追加，避免损坏。

校验全过 → 执行写入。任何一步触发"停下来问"，都不要在未确认前写盘。

---

<a id="norm"></a>
## 4. path-normalize：跨系统路径归一

本 skill 跨多 agent、多系统运行（同一用户可能在 Windows 本机用 Claude、在 WSL / Linux / macOS 用 Codex）。`{kb_root}` 在不同系统下形态不同，写盘前必须归一：

- **识别运行环境**：先判断当前是 Windows 原生、WSL、还是 POSIX（Linux/macOS）。
- **分隔符**：内部统一用 `/` 处理，最终写盘时按目标系统转换（Windows 原生可用 `\` 或 `/`，POSIX 用 `/`）。
- **盘符与挂载**：Windows 的 `D:\my-kbase` 在 WSL 下通常是 `/mnt/d/my-kbase`。若 `kb_root` 配置值与当前运行环境不匹配（如配置是 `D:\...` 但当前在 WSL），按已知映射换算；无法确定映射时，停下来问用户，不擅自猜测。
- **不在路径里放敏感信息**，不把路径塞进 URL 参数。

原则与铁律一一致：路径只要有不确定，就停下来问，不赌。

---

<a id="conc"></a>
## 5. concurrency-safe：并发写安全

`capture-log.jsonl` 可能被多个 agent（Claude、Codex…）先后甚至并发写入。避免损坏的做法：

- **只追加，不读改写**：每次写一条新行用追加模式（`O_APPEND` 语义），不要"读出整个文件→改→整体写回"——后者在并发下会互相覆盖。
- **一次一行、原子写**：把一条日志序列化成单行 JSON，一次写入并以换行结尾。小行追加在多数系统上接近原子，能显著降低交错风险。
- **失败重试**：若写入因占用/锁失败，短暂退避后重试一两次；仍失败则告知用户而非静默丢弃。
- **不依赖第三方锁库**：用文件系统追加语义即可，保持零依赖、可移植。
