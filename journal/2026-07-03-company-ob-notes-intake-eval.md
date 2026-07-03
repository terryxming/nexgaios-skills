# 交接:2026-07-03 公司机(下) · ob-notes 收编三连修 + F 评测双轮全胜

> 本日第二份 handoff(上半场见 `2026-07-03-company-skill-creator-pivot.md`)。续工先 `git pull`,读两份 handoff + ADR-0004/0005/0006,再动手。

## 已完成(本次会话下半场)

1. **纪律 H 节(外部 skill 迁入)** + lint 增至**八门禁**(新增杂物拦截、`metadata.version`,fixture 实测 red/green)。
2. **ob-notes 迁入 + 三连修**(唯一事实源已转移,源仓库待用户删除;基线 tag `ob-notes/v0.7.0`):
   - v0.7.0 迁入:清杂物/字符串化 frontmatter 过桶一/evals 补课(触发 20 + 执行 3,用例经用户过目)。
   - v0.7.1 全文件审查:修我引入的 depmap 解析回归、孤儿规则(有家)升 error、maintenance 语境对齐。
   - v0.8.0 内容质量审查(执行模拟镜头):**写入侧监控指令拿走**(监控暂缓但指令层仍无条件命令记 jsonl 的脱节)、收尾触发收窄为"确有留存价值时问一次"、description 补"何时不用"。
3. **ADR-0006**:源域/分发物分层——dev-log/CHANGELOG 是域内开发文件,随源入库、构建分发时排除;可移植门禁范围=会被分发的文件。
4. **F 触发评测第 1 轮(k=1)满分 20/20**:正例 10/10、负例 10/10、误触发 0(G 底线达标)。机制=隔离子代理收 query 原文 + 转录 `Skill` tool_use 客观判定 + config 挪移写盘隔离。
5. **F 执行评测第 1 轮:with-skill 两组全胜**(独立盲评 grader,A/B 反向排位排除位置偏差):E1 白纸笔记 20:14、E2 dev-log 更新 20:18、E3 铁律一双侧零写盘。差分证据:baseline 无 frontmatter/可信度标注/删除线留痕。
6. 评测卫生:config 已恢复、F6 记忆污染已回滚、仓库零脏文件、v0.8.0 已重新暂存 `.claude/skills`(日常可用)。

## ob-notes 发布状态(G 门禁盘点)

- ① lint 全绿 ✓ ② 触发+执行评测**初步达标(k=1)** ✓ ③ version 0.8.0 + 基线 tag ✓ ⑤ ADR 齐 ✓
- **④ dist 构建:未建(dist 专题未启动)——正式发布唯一卡点**。
- 可选加强:pass^3 加采样(触发 40-60 子代理)。

## 评测方法论(可复用,来自实战教训)

- spawn **分批 ≤5**(20 并发打满限流,10 个被掐)。
- **负例的"正确行为"也有副作用**:跑完须巡检(F6 把评测用例当真实偏好写进宿主记忆;F3 顺手改了 README——本次两处均已核验/回滚妥当)。
- **环境泄漏两态**:触发评测在仓库 cwd 可跑(激活在先,T1 识破不影响信号);**执行评测的干净 baseline 需完全无 skill 源的环境**(unstage 不够,E3b 从 `skills/` 读源照做)。
- 执行评测框架:双沙箱 w/b 防交叉、config 挪移防写真库、两波串行防互见、盲评反向排位。
- 判定链:机械断言(grep 产物)为主、grader 盲评为辅、自报仅作参考。

## 下一步(建议顺序)

1. **dist/build 专题**(发布唯一卡点):build 脚本(分发排除 dev-log/CHANGELOG/evals,见 ADR-0006)、dist 入库与否 ADR、dist 一致性门禁、marketplace/Codex 分发。
2. ob-notes 发布决策:是否补 pass^3;G⑤ 人在环后打 tag 发布。
3. 用户的"皱眉日志"习惯启动(ob-notes 真实使用样本收集,反哺 evals)。
4. Codex 侧实机复核(路径终审 `~/.codex/skills`、平台段接管、skill-creator 适配)。

## 未决

- run_loop.py(description 优化)依赖 `claude -p`,本机嵌套鉴权失败,待有 API key 环境再试。
- E2 类 fixture 混杂:预置模板会抬高 baseline,未来执行用例宜含"无预置格式"场景。
- 家用机工具链复核 + `python` PATH 验证(pre-flight hook 依赖)。

## 环境备忘

- 公司机 CHINAMI-5T8IKFA;`skills-ref` 0.1.1;`~/.config/ob-notes/config.json` 指向真实库(评测时挪走、已复原);ob-notes v0.8.0 已暂存 `.claude/skills`。
