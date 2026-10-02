# 生物图片编辑器 · Bio-Picture-Editor

生物图片编辑器是一个在 Windows 本机运行的生物医学图片编辑与标注工具，适合组织切片照片、医学大体照片和实验配图。支持文字、箭头、直线、矩形、椭圆、关联引线、多图片标签页、可编辑项目、便携项目包，以及原分辨率 PNG 导出。支持与 ChatGPT 深度联动，通过对话规划、Codex 本地 CLI 和可编辑项目持续协作。图片在本机处理，编辑器不会自动上传图片。

**同时提供两种使用方式：v1.1 浏览器 WebUI 版和 v1.1-p 桌面 EXE 版。** 熟悉原有网页方式的用户可以继续使用 v1.1；希望双击程序、自动初始化的用户可以选择 v1.1-p。两种方式的核心编辑界面、标注逻辑和项目格式保持兼容，安装入口、运行环境与数据位置有所不同。

## 选择版本与下载

| 项目 | v1.1 · 浏览器 WebUI 版 | v1.1-p · 桌面 EXE 版 |
| --- | --- | --- |
| 下载 | [Bio-Picture-Editor-v1.1.zip](https://github.com/Santifzaylum/Bio-Picture-Editor/raw/refs/heads/main/Bio-Picture-Editor-v1.1.zip) | [Bio-Picture-Editor-v1.1-p.zip](https://github.com/Santifzaylum/Bio-Picture-Editor/releases/download/v1.1-p/Bio-Picture-Editor-v1.1-p.zip) |
| 程序包 | 约 17 MB，含完整 v1.1 源码、脚本、字体、示例和文档 | 约 38.94 MiB（40.84 MB），含 EXE、示例、CLI 包装脚本、文档和许可 |
| 首次准备 | 安装 Node.js 22.12 或更新版本及 npm，再运行 Setup.cmd | 双击 EXE，自动检查并准备依赖，显示初始化进度 |
| 日常启动 | 双击 启动.vbs / Start.vbs，在浏览器中编辑 | 双击 生物图片编辑器.exe，在桌面窗口中编辑 |
| 界面环境 | 本地浏览器，推荐 Microsoft Edge | Microsoft WebView2；缺失时自动下载安装 |
| 运行环境 | 使用系统 Node.js 与程序目录内的 npm 依赖 | 独立 Node.js 环境；自动复制兼容的本地 Node，或下载锁定版本 |
| 结束使用 | 保存后运行 停止.vbs / Stop.vbs；关闭网页不会停止后台服务 | 保存后关闭窗口，停止本窗口启动的服务 |
| 已保存项目 | 解压目录内的 data/projects/ | %LOCALAPPDATA%\Bio-Picture-Editor\data\projects\ |
| 自动草稿 | 普通浏览器中的 IndexedDB，与浏览器和端口有关 | 桌面 WebView2 配置目录中的草稿，与普通浏览器分开 |

两种方式都面向 Windows 10 / 11 x64，首次安装缺失依赖需要联网，初始化后核心编辑可离线使用。桌面版另外要求 Windows 10 1607+ 和系统保留 .NET Framework 4.6.2+。v1.1 现有程序包的界面仍使用原名称“图注工坊”；v1.1-p 的软件名称为“生物图片编辑器”。

## v1.1：浏览器 WebUI 使用方式

[下载 v1.1 WebUI 程序包](https://github.com/Santifzaylum/Bio-Picture-Editor/raw/refs/heads/main/Bio-Picture-Editor-v1.1.zip) · [完整 WebUI 操作指南](USAGE-v1.1.md) · [WebUI Codex 协作指南](CODEX_GUIDE-v1.1.md)

1. 下载并完整解压 Bio-Picture-Editor-v1.1.zip，保留整个程序文件夹。
2. 从 [Node.js 官网](https://nodejs.org/)安装 Node.js 22.12 或更新版本，保留随附 npm；已有符合要求的环境可跳过。
3. 在解压后的程序文件夹双击 Setup.cmd，等待安装锁定依赖并构建，出现 Setup complete 后完成初始化。
4. 日常双击 启动.vbs 或 Start.vbs，浏览器会自动打开本地编辑页面。默认地址为 `http://127.0.0.1:4317/`；端口冲突时启动器选择后续端口并更新 config.json。
5. 使用结束前逐张保存或导出便携包，然后双击 停止.vbs 或 Stop.vbs，停止本地服务。仅关闭浏览器页面不会停止服务。

系统禁用 VBS 时使用 Start.cmd / Stop.cmd。网页没有自动打开时，根据 config.json 中的 port 手动访问本地地址。此版本继续保留原有网页使用方式，无需改用 EXE。通过“Code → Download ZIP”下载的是仓库副本，需要继续解压其中的 Bio-Picture-Editor-v1.1.zip 才能找到启动文件。

## v1.1-p：桌面 EXE 使用方式

[下载 v1.1-p 桌面程序包](https://github.com/Santifzaylum/Bio-Picture-Editor/releases/download/v1.1-p/Bio-Picture-Editor-v1.1-p.zip) · [Release 发布说明](https://github.com/Santifzaylum/Bio-Picture-Editor/releases/tag/v1.1-p) · [SHA-256 校验文件](https://github.com/Santifzaylum/Bio-Picture-Editor/releases/download/v1.1-p/Bio-Picture-Editor-v1.1-p.zip.sha256)

1. 完整解压 Bio-Picture-Editor-v1.1-p.zip，双击 生物图片编辑器.exe。
2. 首次打开检查依赖；缺失时显示安装进度，完成后自动进入原有编辑界面。已有兼容环境时复用，下载失败可点击“重试”。
3. 打开、拖入或粘贴图片，在左侧添加标注，在右侧调整文字与样式；按 Ctrl+S 保存项目，再导出 PNG 或 .biozip。
4. 结束前保存各张图片并关闭窗口；程序检查未保存内容、写入草稿，并停止本窗口启动的本地服务。

桌面版无需手动运行 Setup、npm、源码构建或启动脚本。所需编辑页面、图片处理组件、原生库与中文字体包含在 EXE 中；缺少 Node.js 或 WebView2 时从官方来源下载并校验。安装日志、草稿与项目默认保存在当前用户本地目录。详细操作见 [操作指南中的桌面版说明](USAGE.md#v11-p桌面-exe-版)。

请在 Releases 的 Assets 下载同名桌面程序包。GitHub 自动附带的 Source code ZIP/TAR 或“Code → Download ZIP”是仓库快照，不包含 v1.1-p 的 EXE 成品。

## 两种方式的共同功能

支持普通 8 位 PNG/JPEG 导入、中文和多行文字、箭头、关联引线、直线、矩形、椭圆、颜色和样式调整、图层与锁定、多图片标签页和原图四周留白。选择工具下，放大后在空白处左键抓手拖动平移，已有标注和控制点优先响应编辑；画布与右侧列表使用 Ctrl+点击多选。Shift 保留绘图约束和大步微调，中键平移可用。

项目保存保留原图、结构化标注和图注；PNG 可按原分辨率或 2× / 4× 导出；.biozip 便携包用于备份和迁移。各标签页分别保留视口、未保存状态和当前会话的撤销记录。**保存、导出 PNG 和导出便携包均作用于当前标签页，请逐张执行。** 当前不支持多图拼版或批量导出。

## 与 ChatGPT 深度联动

**两种版本都保留“ChatGPT 对话规划 → Codex 本地执行 → 编辑器复核”的协作流程。** 可以围绕同一张图片持续讨论标注名称、图注文字、箭头位置与样式，再通过项目文件和 CLI 将修改落实到可继续编辑的项目中，生成预览并反复调整。

| 协作环节 | 具体用法 |
| --- | --- |
| ChatGPT 讨论与规划 | 将你选择的原图、局部截图或标注预览提供给 ChatGPT，结合你的说明讨论区域命名、图注表达、标注位置和排版方案，形成明确的修改要求 |
| Codex 执行修改 | 在你授权的本地环境中，读取项目摘要、标注 ID 与像素坐标，通过 CLI 修改已有标注的文字、位置、颜色、字号等，并生成预览或导出 PNG |
| 编辑器复核与迭代 | 在 WebUI 或 EXE 界面检查修改结果，继续手动绘制或调整；外部修改使用修订号校验，避免直接覆盖未保存的编辑 |
| 项目交接与复用 | 导出 .biozip 保留原图与结构化标注，用于备份、跨电脑或两种运行方式之间交接；继续协作时可提供预览和修改要求，具备文件处理能力的工具也可读取项目包 |

建议先保存目标项目，再提出具体任务，例如：

> 请先读取这个项目的 summary 和 display.png，确认现有标注 ID 与像素坐标，将我指定的文字改为“目标区域”，统一字号和颜色；修改前读取最新修订号，完成后生成预览，让我在编辑器中复核。

这套联动通过对话、项目文件和本地 CLI 完成；程序目前没有内置 ChatGPT 聊天面板或自动调用模型。ChatGPT 云端对话不能直接访问你的本地文件或 localhost，实际执行需要可访问该项目的本地 Codex 或其他获授权工具。图片是否发送给模型由你选择的对话和工具操作决定，编辑器不会自动上传；医学名称与区域判断由用户复核。完整命令和两种版本的准备步骤见 [Codex 协作指南](CODEX_GUIDE.md)。

## 数据保存与两种方式间迁移

| 内容 | v1.1 WebUI | v1.1-p EXE |
| --- | --- | --- |
| 已保存项目、原图与修订 | 程序目录/data/projects/ | %LOCALAPPDATA%\Bio-Picture-Editor\data\projects\ |
| PNG 导出副本 | 对应项目 exports/ 目录，另通过浏览器下载 | 对应项目 exports/ 目录，另用 Windows 另存为对话框保存 |
| 草稿与偏好 | 原浏览器、网址及端口对应的浏览器数据 | %LOCALAPPDATA%\Bio-Picture-Editor\webview-profile\ |

两种方式不会自动共享数据目录或草稿。迁移时在原版本逐张保存并导出 .biozip，再在目标版本打开并保存。需要复制整批项目目录时，先停止两边的服务并备份，再复制 data/projects/ 中的项目，避免覆盖同名内容。浏览器或桌面自动草稿不能代替显式保存与备份。

WebUI 版可以继续独立使用；切换到桌面版由用户自行选择。桌面版替换 EXE 升级不会主动删除项目或草稿。

## 文档与源码

- [操作指南](USAGE.md)：并列说明两种方式的下载、安装、操作与迁移。
- [v1.1 WebUI 完整指南](USAGE-v1.1.md)：保留原网页版本的详细操作与常见问题。
- [Codex 协作指南](CODEX_GUIDE.md)：分别说明 WebUI 与桌面版 CLI 和数据目录。
- [v1.1 WebUI 完整协作指南](CODEX_GUIDE-v1.1.md)：源码 CLI、坐标与修订冲突说明。
- [版本记录](CHANGELOG.md)：v1.1 与 v1.1-p 的功能和交付方式。
- [v1.1-p 实现与验收记录](V1.1-P-REPORT.md)：桌面版实测结果及尚未覆盖的验证分支。

v1.1 完整源码包含在 WebUI 程序 ZIP 中，可按原脚本流程构建。v1.1-p 桌面包提供 EXE 与使用资源，完整桌面开发源码尚未同步至仓库；桌面构建流程见随包 DESKTOP-BUILD.md。仓库中的 Bio-Picture-Editor.zip 对应更早版本，仍作为历史文件保留。

## 支持范围与许可

暂不支持 TIFF、DICOM、全切片、多通道、高位深图片、比例尺测量或自动识别。图片和输出最多 6400 万像素、输出单边最多 16384 px，实际能力取决于内存；2× / 4× 放大不会增加照片本身的细节。

第三方组件、字体与示例保留各自许可，见程序包中的 THIRD-PARTY-NOTICES.txt 和随包许可文件。本项目整体软件许可证尚未指定。
