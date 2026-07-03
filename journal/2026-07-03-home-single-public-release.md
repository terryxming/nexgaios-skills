# 交接:2026-07-03 家用机 · 单仓公开制扫描 + ob-notes v0.8.0 发布闭环

> 续工先 `git pull`,读本文件 + `docs/decisions/0008-single-public-repo.md`,再动手。当前机器 hostname: TerryXming。

## 本次起点巡检

- 分支: `main`;起点与 `origin/main` 同步。
- remote: `https://github.com/terryxming/nexgaios-skills.git`;GitHub 仓库核验为 PUBLIC,默认分支 `main`。
- 工具链: git 2.53.0.windows.2 / Python 3.14.2 / Node v24.14.1 / pwsh 7.6.3。
- Codex `project_doc_max_bytes = 131072` 已生效。
- 工作区仅有未跟踪 `.codex/hooks.json`(内容等同 `.claude/settings.json` 的 pre-flight hook),本次未纳入提交。

## 完整扫描结论

- 仓库定位: Claude Code + Codex 共用的 skill 生产流水线;`skills/` 是唯一事实源。
- 当前架构: ADR-0008 单仓公开制已生效,本仓即开发仓即分发仓;skill 是发布单元,发布 = G 门禁通过 + 合入 `main` + 打 `skill-name/vX.Y.Z` tag。
- 当前 skill: 仅 `skills/ob-notes`,版本 `0.8.0`;已有触发评测 20/20 与执行评测 with-skill 两组胜出证据。
- 门禁状态: `python tools/lint.py` 全绿;`python skills/ob-notes/scripts/build_depmap.py` 通过;Claude marketplace manifest 校验通过。

## 本次完成

1. **补 `tools/install.py`**:本机离线安装脚本,按 ADR-0008 纯复制完整 skill 目录,不构建、不净化、不排除。最初误写为同时安装到 Claude `~/.claude/skills`;后续经本机 `claude plugin --help` 与目录检查确认 Claude Code 无该固定 skills 目录,已修正为只安装到 Codex `$CODEX_HOME/skills`(无则 `~/.codex/skills`)或自定义 `--dest`。
2. **补 Claude marketplace 索引**:`.claude-plugin/marketplace.json`,首个发布项 `ob-notes`,source 使用 `git-subdir` 指向 `skills/ob-notes`,ref 为 `ob-notes/v0.8.0`。
3. **清理 0008 后残留措辞**:`tools/lint.py` 与 `skills/ob-notes/references/maintenance.md` 不再说 `dev-log.md`/`CHANGELOG.md` 构建分发时排除,改为随 skill 入库并分发。
4. **更新 README**:补 marketplace 路径与本地安装命令。
5. **更新 ADR-0008 状态**:标记 `ob-notes/v0.8.0` tag 与本地目录改名均已闭环。
6. **补发布 tag**:`ob-notes/v0.8.0` 已打在 commit `175ff28` 并推送远端。

## 验证记录

- `python tools/lint.py` → 全绿。
- `python skills/ob-notes/scripts/build_depmap.py` → 通过。
- `claude plugin validate .` → Validation passed。
- `python tools/install.py --list` → 列出 `ob-notes`。
- `python tools/install.py ob-notes --dest tmp/install-test-20260703` → 临时复制成功,`tmp/` 已被 gitignore。
- `claude plugin --help` / `claude plugin marketplace --help` → Claude Code 安装路径应走 plugin marketplace,不是 `~/.claude/skills`。
- GitHub Actions: commit `175ff28` 的 CI 已完成且 success。

## 已推送

- commit `175ff28` — `补齐单仓公开制安装与 marketplace`。
- tag `ob-notes/v0.8.0` — `Release ob-notes v0.8.0`。

## 未决 / 后续

- `.codex/hooks.json` 是否应入库仍未决定;它当前未跟踪,但内容与 `.claude/settings.json` 等价。
- Codex 用户级安装目录仍待最终产品层复核;本机官方 `skill-installer` 与实机均强烈指向 `~/.codex/skills`。
- 未来若新增内部不可公开 skill,按 ADR-0008 另立私有仓,当前不预先抽象。
