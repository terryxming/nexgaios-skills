# 脚本

本目录存放 `skill-doctor` 的确定性辅助工具。

- `inspect_skill.py <skill-dir>`：检查 skill 基础结构、frontmatter、版本号、release tag 和 CHANGELOG。
- `compare_versions.py <old-dir> <new-dir>`：对比两个 skill 版本目录的文件新增、删除、修改和未变化数量。

新增脚本后必须：

- 在 `SKILL.md` 的可用脚本中说明何时使用。
- 在 `CHANGELOG.md` 记录脚本能力变化。
- 至少运行一次代表性命令。
