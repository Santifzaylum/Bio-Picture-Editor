@echo off
setlocal
cd /d "%~dp0"
if exist "%~dp0runtime\node.exe" (
  "%~dp0runtime\node.exe" --import tsx server\cli.ts %*
) else (
  node --import tsx server\cli.ts %*
)
