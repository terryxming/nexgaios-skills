# {{title}}

## 用途

说明这个 skill 帮助 Codex 完成什么事情。这里应该写给维护者看，要求具体、可判断，不使用泛泛表述。

## 使用方式

```text
当需要……时，让 Codex 使用 {{skill_id}}。
```

## 目录说明

```text
SKILL.md          skill 入口说明
skill.yaml        monorepo 管理协议
references/       任务相关参考资料
scripts/          可执行脚本
assets/           可复用资产
tests/            测试样例和夹具
CHANGELOG.md      版本变更记录
```

## 开发命令

```powershell
pnpm skill:validate {{skill_id}}
pnpm skill:install {{skill_id}}
pnpm skill:package {{skill_id}} --print-path
```
