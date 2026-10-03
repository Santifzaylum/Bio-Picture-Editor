@echo off
setlocal
cd /d "%~dp0"
if exist "%~dp0runtime\node.exe" (
  set "PATH=%~dp0runtime;%PATH%"
  "%~dp0runtime\node.exe" "%~dp0runtime\node_modules\npm\bin\npm-cli.js" run build
) else (
  call npm run build
)
pause
