param([switch]$Quiet)
$ErrorActionPreference = 'Stop'
if (!$Quiet) { Add-Type -AssemblyName System.Windows.Forms }
try {
  $base = Split-Path -Parent $PSScriptRoot
  $runtimePath = Join-Path $base 'data/runtime.json'
  if (!(Test-Path -LiteralPath $runtimePath)) { throw '未找到运行信息，工具可能尚未启动。' }
  $v = Get-Content -LiteralPath $runtimePath -Raw -Encoding UTF8 | ConvertFrom-Json
  $address = "http://127.0.0.1:$($v.port)"
  $session = Invoke-RestMethod -Uri "$address/api/session" -TimeoutSec 3
  if ($session.name -ne 'bio-annotation' -or $session.token -ne $v.token) { throw '端口上的服务不属于本目录，未停止其他程序。' }
  Invoke-RestMethod -Method Post -Uri "$address/api/stop" -Headers @{'x-bio-token'=$v.token} -ContentType 'application/json' -Body '{}' -TimeoutSec 5 | Out-Null
  if (!$Quiet) { [System.Windows.Forms.MessageBox]::Show('本地服务已停止。下次双击 Start.vbs 即可启动。', '生物图片编辑器') | Out-Null }
} catch {
  if ($Quiet) { Write-Error $_.Exception.Message; exit 1 }
  [System.Windows.Forms.MessageBox]::Show('未能停止服务：' + $_.Exception.Message, '生物图片编辑器') | Out-Null
  exit 1
}
