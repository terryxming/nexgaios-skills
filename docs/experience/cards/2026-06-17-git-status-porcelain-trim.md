---
title: "解析 git status --porcelain 时不能先 trim"
date: 2026-06-17
domain: repo
tags: "git, porcelain, status, changedFiles, path parsing"
status: active
---

# 解析 git status --porcelain 时不能先 trim

## 触发场景

在 CLI 中用 `git status --porcelain` 计算工作区变更文件，然后按路径判断变更范围。

## 症状

路径第一个字符被截断，例如：

```text
.github/workflows/pr-validate.yml -> github/workflows/pr-validate.yml
README.md -> EADME.md
docs/skill-protocol.md -> ocs/skill-protocol.md
```

## 根因

`git status --porcelain` 的前两列是状态位，第三列开始才是路径。

如果先对整行执行 `trim()`，以空格开头的状态行会丢失前导空格，随后再 `slice(3)` 就会误删路径首字符。

## 解法

解析 porcelain 输出时保留原始行：

```js
const statusFiles = run("git", ["status", "--porcelain=v1"], { cwd: repoRoot, capture: true })
  .split(/\r?\n/)
  .filter((line) => line.trim())
  .map(parsePorcelainPath)
  .filter(Boolean);

function parsePorcelainPath(line) {
  let file = line.slice(3).trim();
  if (file.includes(" -> ")) {
    file = file.split(" -> ").pop().trim();
  }
  return file;
}
```

## 适用边界

适用于解析 `git status --porcelain=v1` 的工作区状态。

不适用于 `git diff --name-only`，后者本身直接输出路径，不需要状态位解析。

## 验证记录

- 日期：2026-06-17
- 验证命令：`node tools\skills\skill-cli.mjs pr-summary`
- 结果：`.github`、`README.md`、`docs/` 路径不再被截断。
