param([string]$ProfileFolder = (Join-Path $env:LOCALAPPDATA 'Bio-Picture-Editor\v2.1-p'), [Parameter(ValueFromRemainingArguments=$true)][string[]]$CliArguments)
$ErrorActionPreference = 'Stop'
try {
  $install = Get-Content -LiteralPath (Join-Path $ProfileFolder 'active-install.json') -Raw -Encoding UTF8 | ConvertFrom-Json
  if (!(Test-Path -LiteralPath $install.nodePath) -or !(Test-Path -LiteralPath (Join-Path $install.appPath 'cli.mjs'))) { throw '请先双击生物图片编辑器.exe，完成初始化并保持窗口打开。' }
  $env:BIO_DATA_DIR = $install.dataPath
  & $install.nodePath (Join-Path $install.appPath 'cli.mjs') @CliArguments
  exit $LASTEXITCODE
} catch { Write-Error $_.Exception.Message; exit 1 }
