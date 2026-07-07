# 交接（唯一交接文档）

> 本文件每次收工**覆盖重写**（纪律 C2），历史见 `git log -- handoff.md`，不另存副本。续工（C3）：先 `git pull`，读本文件 + `docs/decisions/`；切机器先跑 C1 巡检。坑与经验的沉淀见 [docs/lessons-learned.md](docs/lessons-learned.md)（追加式，本文件不复述）。

## 当前状态

**两条线并行，都未收尾（分支 `ob-notes`）：**

### A 线 · 工程纪律大重构（本会话 2026-07-07，活跃线）

对照 Karpathy 原文 + 用户逐条把关，把整套工程纪律重写、普适化、去推演。

- **markdown 写作纪律**（新增伞节）：排版（留白/文字/元素）+ 语气（指令祈使 / 描述第三人称 / 说明陈述），对照官方 skill-creator 核实；§9 旧「排版」款转指针。**已 commit `1d802a2`**。
- **私有纪律拆两层**：`本仓工程约束`（A 行为闸门 / B 单一事实源 / C 跨设备协作）+ `Skill 开发纪律`。A4（防幻觉七条）、A5（门禁二值化）**移除**；C 按真实场景重构（C1「起点巡检」+ C3「续工」合并为「开工」、C4→决策留痕、难逆转判据并入 C4）；skill 段 E–H **删除**、收敛为「用 skill-creator + 其余从实践长出、不预先编造」（用户核心原则）。**已 commit `1d802a2`**。
- **通用纪律 §1–§10**：逐条译原文 → 推向任何工作场景（代码/文件/数据治理与分析）→ 深化。名字：§1 动手之前先读 / §2 想清楚再动手 / §3 只做必须的（加「越界多做」硬禁令）/ §4 外科手术式修改（深普适三域）/ §5 验证 / §6 目标驱动执行（深化 TDD/BDD/SDD 骨架）/ §7 调试 / §8 依赖 / §9 交代清楚（原「沟通」改名）/ §10 常见失败模式（扩 14 条、分「做法上的」+「作风上的」两组）。**§1–§3 已 commit `2edc0c3`；§4–§10 本次收工提交。**
- 全程双份（`CLAUDE.md`/`AGENTS.md`）逐字节同步，`check-discipline-drift` + `lint` 全绿。

### B 线 · ob-notes v2.0.0（上一会话，代码已 commit `27403c9`，发布链未走完）

逐字正文统一 + 全文档祈使化 + 显式工作流 + dev-log 重排，均已入库、**未 dogfood（`[试行待验证]`）**。完整细节见 `git log`／`dev-log/`。待办摘要见下「下一步 B」。

## 下一步

**A 线（优先，本会话在这）：**

1. **本次收工**：commit §4–§10 + 本 handoff，push。（正在做）
2. **最后的重叠归并**（按单一事实源收口）：
   - §3「越界多做」/ §4「不碰无关」/ §10「厨房水槽·失控重构」三处咬合。
   - §5「验证」/ §6「TDD 先写测试」两处。
   - §1 / §6「成功标准」。
   - §10「作风八条」↔ §1–9 + A2（症状目录 vs 纪律本体，大概率 §10 保目录 + 各条「详见 §X」）。
3. **悬空引用清理**：
   - `本仓工程约束` 开头「编号约定」那句已全失效（例子 `A4·3 / C1·5 / G·2` 指向的都已删/改）。
   - `tools/lint.py`、`README.md`、`check-discipline-drift.py` 注释里的旧编号（`私有纪律 A3/A1/B`、`E 桶一二`、`G·3`、`F` 等）。
   - `.py` 命名统一 snake_case（现 `tools/*.py` 是 kebab、skill scripts 是 snake；改 tools 连带 `ci.yml`、`lint.py` subprocess 路径）。
   - ADR（0004–0014）引 E/F/G/H、桶一二三 = 历史记录，**不动**。

**B 线（ob-notes v2.0.0，parked）：** evals 用户过目 → 委托 skill-creator 跑（G·2，依赖 `claude -p`）→ 补 dogfood（主题网/解法卡逐字 n=0）→ source-fidelity `[待定]` 拍板 → 发布链：合 main → tag `ob-notes/v2.0.0`（中文 message）→ 更 `marketplace.json` path 为 `skills/first-party/ob-notes`，过 `lint --release`。

## 未决问题

- **纪律**：§10 作风八条与各纪律的单一事实源边界未定；`.py` 改名 ripple 面（ci.yml / lint.py 路径 / docs）；"背着用户做决定"在 §10 与 A2 两处，归并方式待定。
- **ob-notes**：逐字正文正向效果未 dogfood；source-fidelity 逐字处理 `[待定]`；`run_loop.py` 依赖 `claude -p` 嵌套鉴权坑；Codex 侧逐字全链路待实机。
- pass^k 阈值、多 skill 触发互斥、ADR-0010 third-party 安装路径 —— 待首个第三方 skill。

## 环境备忘

- 公司机 CHINAMI-5T8IKFA：Windows 11；git 2.53.0 / Python 3.13.5（另装 3.14）/ Node 24.14.1 / pwsh 7.6.3；Codex `project_doc_max_bytes=131072` 已设；skills-ref 桶一通过。
- 家用机 TerryXming：git 2.53.0 / Python 3.14.2 / Node 24.14.1 / pwsh 7.6.3；Codex 128 KiB。
- 两机各配 `~/.config/ob-notes/config.json` 指向自己 kbase（公司机 `D:\nexgaios-kbase`；读取顺序见 preflight.md）。
- **共享段协作坑**：`CLAUDE.md`/`AGENTS.md` 的 `DISCIPLINE:SHARED` 段须逐字节一致。若在编辑器里直接改其一（本会话发生过：改 §写作纪律 intro 致 drift），另一份要同步，且 agent 编辑前须重读——否则 drift 校验红 + agent 编辑撞「文件已被修改」。

## 上次会话摘要（2026-07-07 · 本会话 · A 线）

工程纪律全面重构。① 立 markdown 写作纪律伞节（排版 + 语气；对照官方核实、用户多轮打磨版式）。② 私有纪律拆 `本仓工程约束`(A/B/C) + `Skill 开发纪律`：A4/A5 移除、C 真实场景重构、E–H 删除（用户原则「纪律从实践长、不预先编造」）。③ 通用 §1–10 逐条对照 Karpathy 原文转译 + 推向任何工作场景 + 深化（§3 越界多做、§6 TDD/BDD/SDD、§10 扩 14 条分做法/作风）。双份逐字节同步、drift+lint 全绿。commit：`1d802a2`（伞节+私有重构）、`2edc0c3`（§1–3）、本次（§4–10）。**过程教训**：修 C 时曾未 preview 就 landing → 用户指出违 A 纪律 → 重申 preview→confirm→land（已固化为 §10「背着用户做决定」+ A「禁止悄悄决定」）；用户在编辑器改共享段致 drift → 补同步（已记环境备忘）。全程 A2 声明、超出原文的增补（如 §6 TDD/BDD/SDD）如实标注。
