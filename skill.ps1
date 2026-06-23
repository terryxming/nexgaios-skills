$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "环境检查失败：运行本仓库 CLI 前需要 Node.js >= 20。"
  Write-Host "请先向用户报告缺失项；只有用户明确批准后，才安装或修复环境。"
  Write-Host "批准后的建议操作：安装 Node.js 20+，然后重新运行 .\skill.ps1 env-check"
  exit 1
}
node (Join-Path $Root "tools/skills/skill-cli.mjs") @args
exit $LASTEXITCODE

