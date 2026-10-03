# 生物图片编辑器 · v2.1-webui

基于 v2.0-webui 的 Windows 本地浏览器版。此次改进工具图标、原图只读模式，以及局部放大的移动、留白和独立线条样式，仍使用 WebUI。

首次安装 Node.js 22.12+（含 npm），双击 Setup.cmd。日常双击 启动.vbs / Start.vbs，默认 http://127.0.0.1:4321/；保存后运行 停止.vbs / Stop.vbs。首次初始化需要联网，核心编辑可离线使用。

“查看原图”显示只读提示并暂停编辑，可缩放和平移；点击“返回标注编辑”继续。局部放大（M）在取样区附近创建放大圆；拖取样圆内部移动取样、拖放大圆移动展示、拖连接线或 Alt 拖动整组。右侧可分别设置取样圆、连接线、放大圆的颜色、线宽、虚线与对比描边。对象移出原图的四个方向时按完整边界补足留白，保留已有留白，不自动缩小版面。

可导入 v1.1 与 v2.0 的 .biozip。新独立线条属性需要 v2.1 或更新编辑器读取；保留升级前备份。新版使用独立程序目录、数据目录和浏览器草稿库，不自动导入旧版未保存草稿。请先在旧版导出便携包，再在新版打开。

操作指南见 USAGE.md 或 先看这里-操作指南.html；版本说明见 RELEASE-v2.1-webui.md；程序化协作见 CODEX_GUIDE.md；数据说明见 GUIDE.md。源码位于 src/ 和 server/，字体许可位于 public/fonts/LICENSE.txt。

开发命令：npm ci；npm run build；npm start；npm test；npm run verify；npm run verify:v1。测试使用人工数据和临时浏览器。npm run package 为本工作区打包命令，输出在 releases/windows/v2.1-webui/。
