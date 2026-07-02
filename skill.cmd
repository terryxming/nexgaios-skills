@echo off
where node >nul 2>nul
if errorlevel 1 (
  echo 环境检查失败：运行本仓库 CLI 前需要 Node.js ^>= 20。
  echo 请先向用户报告缺失项；只有用户明确批准后，才安装或修复环境。
  echo 批准后的建议操作：安装 Node.js 20+，然后重新运行 .\skill.cmd env-check
  exit /b 1
)
node "%~dp0tools\skills\skill-cli.mjs" %*

