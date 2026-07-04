# 经验台账（lessons learned）

> 流水线/平台层的坑与可复用经验，**追加式**，每条必须填"已固化到哪"。这一列使本文件成为**机械化队列**：每条坑最终要么毕业成门禁/hook/eval 用例/纪律条款，要么显式决定"暂留为知识"（条件成熟时再毕业）。
>
> **MECE 边界**（谁记哪）：难逆转决策 → `docs/decisions/`（ADR）；skill 域内的决策与坑 → 该 skill 的 dev-log；易变状态 → `handoff.md`。坑引出的决策记 ADR，本表只记"现象 → 根因 → 规避"，两边互链不复述。

| 日期 | 坑/经验 | 现象与根因 | 规避/解法 | 已固化到哪 |
|---|---|---|---|---|
| 2026-07-03 | 子代理并发限流 | 一次 spawn 20 个评测子代理，10 个被限流掐死 | spawn 分批 ≤5 | 暂留为知识（评测委托 skill-creator，无自建 runner 可载） |
| 2026-07-03 | 评测负例的"正确行为"也有副作用 | 负例用例被子代理当真实偏好写进宿主记忆（F6）、顺手改了 README（F3） | 评测跑完必须巡检宿主记忆与工作区并回滚 | 暂留为知识（随 F 纪律在跑评测时执行） |
| 2026-07-03 | 执行评测 baseline 环境泄漏 | unstage 不够——baseline 子代理从 `skills/` 直接读到 skill 源照做 | 干净 baseline 需完全无 skill 源的环境（config 挪移 + 双沙箱 + 两波串行） | 暂留为知识（同上） |
| 2026-07-03 | 嵌套 `claude -p` 鉴权失败 | 会话内起 `claude -p` 子进程报鉴权错误；skill-creator 的 run_loop.py 依赖它 | 主评测改用会话内子代理；run_loop 待 API key 环境 | handoff.md 未决问题在跟 |
| 2026-07-03 | 纪律常驻 ≠ 执行器 | Codex 三次失守：push 前漏 handoff、补写前不读同类正文、误把常驻文本当自动门禁——规则可见不等于进入执行状态机 | 纪律必须进入计划 / checklist / 硬门禁 | CI handoff 联动检查（ADR-0009）；全程复盘见知识库《Codex 执行仓库纪律三次失守：问答实录》 |
| 2026-07-04 | Windows GBK 控制台打印中文/emoji 即崩 | Python 默认跟随本地代码页，`print("✅")` 抛 UnicodeEncodeError；同根四处（lint 早修，drift/install/build_depmap 后补） | 脚本自配 `sys.stdout.reconfigure(encoding="utf-8")`（stderr 同理），不依赖环境变量 | 已修：tools/ 全部脚本 + ob-notes scripts |
| 2026-07-04 | 跨 agent 幻觉："没见过" ≠ "不存在" | Codex 依据 `claude plugin --help` 与本机无 `~/.claude/skills` 目录，误判该机制不存在，删了 install.py 的 Claude 目标并改掉 ADR 决策 | 平台机制断言必须查官方文档（A4·6）；目录不存在只说明尚未使用 | ADR-0008 证据 5 纠错留痕；行为已回滚（`d3bb020`） |
| 2026-07-04 | Codex 会镜像 `.claude/settings.json` 生成 `.codex/hooks.json` | 生成物照抄 Claude schema；Codex hooks 实验性、默认关闭、Windows 不可用——文件完全不生效 | 见到来源不明的配置先查官方文档与用户确认，再决定入库/删除；该文件已删 | 暂留为知识 |
| 2026-07-04 | Glob 对含全角字符的文件名可能假阴性 | 按 `*问答实录*` 搜索未命中实际存在的含全角冒号文件 | 关键的存在性判断用目录 listing 复核，不单信 Glob | 暂留为知识 |
| 2026-07-04 | WebFetch 特定站点长挂 | 抓 developers.openai.com 挂 12 分钟无响应，阻塞整轮 | 先 WebSearch 拿摘要，必要再 fetch；久挂即弃、换信息路径 | 暂留为知识 |
| 2026-07-04 | 交接散乱即 B 条违例 | 6 份 journal 互相搬运未决项/环境备忘（可避免的重复）；"该读哪份"歧义直接导致格式漂移 | 单文件覆盖重写，历史交给 `git log` | handoff.md + C1-C3 修订 + CI 门禁（ADR-0009） |
| 2026-07-04 | 流水线文件提交落错分支 | 上一批收尾停在 feature 分支未切回，下一批开工未复核当前分支就动手——纪律/README 改动被提交到 candidate 分支而非 main（后 cherry-pick 修复，内容一致故发布合并无冲突） | 任何 commit 前先看 `git branch --show-current`；跨批次收尾时显式切回 main | 暂留为知识（若复发，考虑进 pre-flight 提醒清单） |
| 2026-07-04 | Edit 的 old_string 凭记忆写、中文标点半/全角不符即匹配失败 | 替换中文文档行时用半角冒号/逗号，与仓库全角标点对不上；工具 \uXXXX 兜底也救不了标点差异（本轮 README 索引、dev-log 各栽一次） | 构造 old_string 前先 Read 目标行、精确复制、不凭记忆；改中文文档尤其核对全/半角 | 暂留为知识（若复发考虑进 pre-flight 清单） |
