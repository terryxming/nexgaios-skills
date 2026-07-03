# 变更记录

## 0.1.0
- 初始版本：脚手架 skill。`scripts/scaffold.py` 确定性生成新 skill 骨架
  （SKILL.md / CHANGELOG.md / evals），SKILL.md 指挥填充流程。
- 本仓库第一条真实 skill，同时作为 W2 门禁与 F 评测 runner 的实测对象。
- `scaffold.py` 自配 stdout=UTF-8，Windows 默认 GBK 控制台下也不再因输出 ✅/中文
  而崩（子代理实跑触发评测机制时暴露，已修）。
