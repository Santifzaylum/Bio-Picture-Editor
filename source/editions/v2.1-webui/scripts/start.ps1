param([switch]$NoBrowser, [switch]$Quiet)
$ErrorActionPreference = 'Stop'
if (!$Quiet) { Add-Type -AssemblyName System.Windows.Forms }
try {
  $base = Split-Path -Parent $PSScriptRoot
  Set-Location -LiteralPath $base
  $node = Join-Path $base 'runtime/node.exe'
  if (!(Test-Path -LiteralPath $node)) { $node = (Get-Command node.exe -ErrorAction Stop).Source }
  if (!(Test-Path -LiteralPath (Join-Path $base 'node_modules/tsx')) -or !(Test-Path -LiteralPath (Join-Path $base 'dist/index.html'))) { throw '程序文件不完整。请完整解压 ZIP；源码目录请先运行 Setup.cmd。' }
  $configPath = Join-Path $base 'config.json'
  $config = Get-Content -LiteralPath $configPath -Raw -Encoding UTF8 | ConvertFrom-Json
  $port = [int]$config.port
  if ($port -lt 1024 -or $port -gt 65535) { throw 'config.json 中 port 必须为 1024–65535。' }
  $dataPath = Join-Path $base 'data'
  $runtimePath = Join-Path $dataPath 'runtime.json'
  $address = "http://127.0.0.1:$port"
  $existing = $null
  try { $existing = Invoke-RestMethod -Uri "$address/api/session" -TimeoutSec 2 } catch {}
  if ($existing -and (Test-Path -LiteralPath $runtimePath)) {
    $known = Get-Content -LiteralPath $runtimePath -Raw -Encoding UTF8 | ConvertFrom-Json
    if ($existing.token -eq $known.token -and $existing.name -eq 'bio-annotation') {
      if (!$NoBrowser) { Start-Process $address }
      [PSCustomObject]@{ address=$address; port=$port; pid=$known.pid; reused=$true }
      exit 0
    }
  }
  $initialPort = $port
  $available = $false
  for ($offset=0; $offset -lt 32; $offset++) {
    $port = $initialPort + $offset
    if ($port -gt 65535) { break }
    $probe = New-Object System.Net.Sockets.TcpClient
    try { $probe.Connect('127.0.0.1', $port) }
    catch [System.Net.Sockets.SocketException] { $available = $true }
    finally { $probe.Dispose() }
    if ($available) { break }
  }
  if (!$available) { throw '未找到可用端口，请在 config.json 设置其他端口。' }
  if ($port -ne $initialPort) {
    $config.port = $port
    [System.IO.File]::WriteAllText($configPath, ($config | ConvertTo-Json), (New-Object System.Text.UTF8Encoding($false)))
  }
  $address = "http://127.0.0.1:$port"
  New-Item -ItemType Directory -Path $dataPath -Force | Out-Null
  $env:BIO_PORT = "$port"
  $env:BIO_DATA_DIR = $dataPath
  $job = Start-Process -FilePath $node -ArgumentList @('--import','tsx','server/index.ts') -WorkingDirectory $base -WindowStyle Hidden -RedirectStandardOutput (Join-Path $dataPath 'server.log') -RedirectStandardError (Join-Path $dataPath 'server-error.log') -PassThru
  $started = $false
  for ($attempt=0; $attempt -lt 40; $attempt++) {
    Start-Sleep -Milliseconds 300
    $job.Refresh()
    if ($job.HasExited) { break }
    try {
      $v = Invoke-RestMethod -Uri "$address/api/session" -TimeoutSec 1
      $known = Get-Content -LiteralPath $runtimePath -Raw -Encoding UTF8 | ConvertFrom-Json
      if ($v.name -eq 'bio-annotation' -and $v.token -eq $known.token -and $known.pid -eq $job.Id) { $started = $true; break }
    } catch {}
  }
  if (!$started) { $detail = Get-Content -LiteralPath (Join-Path $dataPath 'server-error.log') -Tail 8 -Encoding UTF8 -ErrorAction SilentlyContinue; throw ("启动失败。请查看 data/server-error.log。" + [Environment]::NewLine + ($detail -join [Environment]::NewLine)) }
  if (!$NoBrowser) { Start-Process $address }
  [PSCustomObject]@{ address=$address; port=$port; pid=$job.Id; reused=$false }
} catch {
  if ($Quiet) { Write-Error $_.Exception.Message; exit 1 }
  [System.Windows.Forms.MessageBox]::Show($_.Exception.Message, '生物图片编辑器：启动失败') | Out-Null
  exit 1
}
