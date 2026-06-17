$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
node (Join-Path $Root "tools/skills/skill-cli.mjs") @args
exit $LASTEXITCODE

