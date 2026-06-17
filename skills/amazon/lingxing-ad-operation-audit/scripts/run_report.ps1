param(
  [switch]$SkipInstall,
  [switch]$SkipExport,
  [switch]$SkipPerformance
)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Resolve-Path (Join-Path $scriptDir "..")
Set-Location $root

function Set-DotEnv {
  param([string]$Path)
  if (-not (Test-Path -LiteralPath $Path)) {
    return
  }

  Get-Content -LiteralPath $Path | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith("#")) {
      return
    }
    $index = $line.IndexOf("=")
    if ($index -le 0) {
      return
    }
    $name = $line.Substring(0, $index).Trim()
    $value = $line.Substring($index + 1).Trim()
    if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
      $value = $value.Substring(1, $value.Length - 2)
    }
    [Environment]::SetEnvironmentVariable($name, $value, "Process")
  }
}

function Require-Env {
  param(
    [string]$Name,
    [string]$Hint
  )
  $value = [Environment]::GetEnvironmentVariable($Name, "Process")
  if (-not $value -or $value -eq "YOUR_X_MCP_KEY_HERE") {
    throw "$Name 未配置。$Hint"
  }
}

function Env-OrDefault {
  param(
    [string]$Name,
    [string]$Default
  )
  $value = [Environment]::GetEnvironmentVariable($Name, "Process")
  if ($value) { return $value }
  return $Default
}

function Invoke-Checked {
  param(
    [string]$Command,
    [string[]]$Arguments
  )
  & $Command @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "命令执行失败，退出码 $LASTEXITCODE：$Command $($Arguments -join ' ')"
  }
}

$envPath = Join-Path $root ".env"
if (-not (Test-Path -LiteralPath $envPath) -and -not ($SkipExport -and $SkipPerformance)) {
  throw "未找到 .env。请先执行 Copy-Item .env.example .env，然后按 README 填写 LINGXING_REMOTE_MCP_KEY、SID、国家和日期。"
}

Set-DotEnv $envPath
$pythonCommand = Env-OrDefault "LINGXING_AD_PYTHON" "python"

Require-Env "LINGXING_AD_AUDIT_SID" "例如：7481。这个值由管理员在管理后台或授权说明里提供。"
Require-Env "LINGXING_AD_AUDIT_COUNTRY" "例如：US、CA、UK。"
Require-Env "LINGXING_AD_AUDIT_START_DATE" "格式必须是 YYYY-MM-DD，例如 2026-03-19。"
Require-Env "LINGXING_AD_AUDIT_END_DATE" "格式必须是 YYYY-MM-DD，例如 2026-06-16。"
if (-not ($SkipExport -and $SkipPerformance)) {
  Require-Env "LINGXING_REMOTE_MCP_KEY" "请填写管理员分配的完整 X-Mcp-Key。"
}

if (-not $SkipInstall) {
  if (-not (Test-Path -LiteralPath (Join-Path $root "node_modules"))) {
    Write-Host "正在安装 Node 依赖..."
    Invoke-Checked "npm" @("install")
  }

  $pandasOk = $false
  try {
    & $pythonCommand -c "import pandas" | Out-Null
    $pandasOk = $true
  } catch {
    $pandasOk = $false
  }
  if (-not $pandasOk) {
    Write-Host "正在安装 Python 依赖..."
    Invoke-Checked $pythonCommand @("-m", "pip", "install", "-r", "requirements.txt")
  }
}

if (-not $SkipExport) {
  Write-Host "正在导出广告操作日志..."
  Invoke-Checked "npm" @("run", "export:logs")
}

if (-not $SkipPerformance) {
  Write-Host "正在导出效果层日报..."
  Invoke-Checked "npm" @("run", "export:performance")
}

$inputPath = Env-OrDefault "LINGXING_AD_IMPACT_INPUT" "artifacts/lingxing-ad-operation-audit/data/export.json"
$performancePath = Env-OrDefault "LINGXING_AD_IMPACT_OUTPUT" "artifacts/lingxing-ad-operation-audit/data/performance-context.json"
$reportPath = Env-OrDefault "LINGXING_AD_REPORT_OUTPUT" "artifacts/lingxing-ad-operation-audit/report.html"
$reportTitle = Env-OrDefault "LINGXING_AD_REPORT_TITLE" "领星广告操作日志监控"
$storeLabel = Env-OrDefault "LINGXING_AD_REPORT_STORE_LABEL" ("SID " + [Environment]::GetEnvironmentVariable("LINGXING_AD_AUDIT_SID", "Process") + " - " + [Environment]::GetEnvironmentVariable("LINGXING_AD_AUDIT_COUNTRY", "Process"))

if (-not (Test-Path -LiteralPath $inputPath)) {
  throw "找不到操作日志 JSON：$inputPath。请先导出日志，或检查 LINGXING_AD_IMPACT_INPUT。"
}
if (-not (Test-Path -LiteralPath $performancePath)) {
  throw "找不到效果层 JSON：$performancePath。请先导出效果层日报，或检查 LINGXING_AD_IMPACT_OUTPUT。"
}

Write-Host "正在生成 HTML 报告..."
Invoke-Checked $pythonCommand @(
  "scripts/build_ad_operation_report.py",
  "--input", $inputPath,
  "--performance-input", $performancePath,
  "--output", $reportPath,
  "--title", $reportTitle,
  "--store-label", $storeLabel
)

Write-Host ""
Write-Host "完成。HTML 报告位置：$reportPath"
