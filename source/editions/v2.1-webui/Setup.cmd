@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 goto no_node
where npm.cmd >nul 2>nul
if errorlevel 1 goto no_node
node -e "const [a,b]=process.versions.node.split('.').map(Number);process.exit(a>22||(a===22&&b>=12)?0:1)"
if errorlevel 1 goto old_node
call npm.cmd ci
if errorlevel 1 goto fail
call npm.cmd run build
if errorlevel 1 goto fail
echo Setup complete. Double-click Start.vbs to launch; Stop.vbs to stop.
pause
exit /b 0
:no_node
echo Install Node.js with npm from https://nodejs.org/ then run Setup.cmd again.
echo Required: Node.js 22.12 or newer.
pause
exit /b 1
:old_node
echo Node.js is too old. Install Node.js 22.12 or newer, then retry.
pause
exit /b 1
:fail
echo Setup failed. Check your network and the error above. No saved projects were removed.
pause
exit /b 1
