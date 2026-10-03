# v2.1-p 桌面构建

功能源码位于 `source/editions/v2.1-p/`，由完成的 v2.1-webui 独立复制；启动器位于 `source/platforms/windows/v2.1-p/`，基于 v1.1-p 的 WinForms / Microsoft WebView2 实现。两版的模型、渲染、存储与图片导出代码保持一致，桌面版加入窗口就绪和安全关闭桥接。

Windows x64 构建机需 Node.js 22.12+、npm 和系统 .NET Framework C# 编译器。在 `source/editions/v2.1-p/` 执行：

```powershell
npm ci
npm run desktop:build
npm test
npm run desktop:package
npm run desktop:verify
```

构建执行 TypeScript 检查、Vite 构建和 esbuild 服务/CLI 编译，再把生产依赖、原生库、字体、示例和逐文件安装校验清单作为 EXE 资源。依赖来自该版本 package-lock.json，沿用 v2.1-webui 的 Sharp 0.35.5。Windows ICO 从 v2.1-webui 的原 SVG 渲染成 16/24/32/48/64/128/256 px PNG 图层，未重新设计图标。

启动器使用锁定 WebView2 SDK 1.0.3537.50，Node.js 下载版本为 22.23.3，构建时核对官方 SHA-256 清单。缓存位于该版本 `.build/desktop/`，正式输出位于工作区 `releases/windows/v2.1-p/`，验证结果位于 `validation/v2.1-p/`。用户机器无需 npm、TypeScript 或开发依赖。

默认安装根为 `%LOCALAPPDATA%\Bio-Picture-Editor\v2.1-p\`。组件按版本与 payload 哈希保存，用户数据另存 data，WebView2 配置另存 webview-profile；启动器校验应用文件和 Node 文件，缺失或损坏时重新准备。服务只监听 127.0.0.1，默认 4322 端口，保留 Host、Origin、会话令牌与数据目录锁定检查。

开发验收参数沿用 v1.1-p，普通用户无需设置：

```powershell
.\生物图片编辑器.exe --profile "D:\temporary-tests\isolated-profile" --self-test
.\生物图片编辑器.exe --profile "D:\temporary-tests\fresh-download" --force-download --self-test
.\生物图片编辑器.exe --profile "D:\temporary-tests\ui-test" --diagnostic-port 9462
.\生物图片编辑器.exe --profile "D:\temporary-tests\preview" --installer-preview
```

`--profile` 指定独立验收目录；`--self-test` 完成依赖检查与服务启动后退出；`--force-download` 跳过系统 Node 复用并验证官方运行时；诊断端口只在显式指定时启用；初始化预览会写入 PNG 后退出。测试目录不进入成品。缺少 WebView2 的全新 Windows 安装验证情况见本版验收报告。
