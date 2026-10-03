# 生物图片编辑器 · v2.1-p 独立源码

本目录由完成的 v2.1-webui 独立复制，保留其编辑界面、项目模型、渲染和存储逻辑；增加 WebView2 就绪/关闭桥接、v2.1-p 标识及安装字体路径适配。Windows 启动器和构建脚本位于 [platforms/windows/v2.1-p](../../platforms/windows/v2.1-p/README.md)。

面向使用者的成品见 [v2.1-p Release](https://github.com/Santifzaylum/Bio-Picture-Editor/releases/tag/v2.1-p)，详细操作见 [操作指南](../../../docs/windows/v2.1-p/USAGE.md)，实测结果见 [验收报告](../../../validation/v2.1-p/V2.1-P-REPORT.md)。用户只需双击 EXE，不需要使用本目录的开发命令。

开发时执行 npm ci、npm run desktop:build、npm test、npm run desktop:package 和 npm run desktop:verify。受限账户中 tsx 无法读取系统用户信息时，可执行 npm run test:compiled，用同一测试源码经 esbuild 编译后运行。npm run verify 与 npm run verify:v1 验证编译服务的浏览器交互；tests/desktop-browser.mjs 和 tests/desktop-runtime.mjs 验证真实 EXE，使用工作区 validation/v2.1-p 下的独立测试目录。

默认安装根为 %LOCALAPPDATA%\Bio-Picture-Editor\v2.1-p\，项目位于 data/projects，草稿位于 webview-profile。运行 EXE 后，可通过随包 desktop-cli.ps1 使用已准备的独立 Node.js 与服务继续协作。
