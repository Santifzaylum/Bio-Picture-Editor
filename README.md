# 生物图片编辑器 · v2.3-webui / v2.2.1-p / v2.1-macweb

在本机运行的生物医学图片标注编辑器，支持中文文字、箭头、关联引线、直线、矩形、椭圆、圆形局部放大、多图片标签页、可继续编辑的项目与 PNG 导出。图片在本机处理，编辑器不会自动上传图片。

**Windows 浏览器版、Windows 桌面 EXE 与 macOS 浏览器版并行提供。** Windows 浏览器版更新为 **v2.3-webui**，作为最新正式 Release（Latest），修复箭头尖端绘制，调整属性栏分区，并加入标注搜索、筛选与分页。Windows 桌面 EXE 继续提供 **v2.2.1-p**，保留 v2.2.1 的长度测量、比例参考、分组、尺度标定、数据导出和标签显隐功能；v2.3 的界面改进目前仅在浏览器版提供。macOS 仍提供 **v2.1-macweb（未测试开发版，Pre-release）**，由于缺乏实际 Mac 测试，**目前暂停更新**。

## 选择版本与下载

| 版本 | 运行方式与适用场景 | 下载与说明 |
| --- | --- | --- |
| **v2.2.1-p · Windows 桌面 EXE** | 双击 EXE，首次自动准备依赖；完整保留 v2.2.1-webui 功能，在桌面窗口中编辑。约 39.16 MiB | [程序 ZIP](https://github.com/Santifzaylum/Bio-Picture-Editor/releases/download/v2.2.1-p/Bio-Picture-Editor-v2.2.1-p.zip) · [Release](https://github.com/Santifzaylum/Bio-Picture-Editor/releases/tag/v2.2.1-p) · [SHA-256](https://github.com/Santifzaylum/Bio-Picture-Editor/releases/download/v2.2.1-p/Bio-Picture-Editor-v2.2.1-p.zip.sha256) · [操作指南](docs/windows/v2.2.1-p/USAGE.md) |
| **v2.3-webui · Windows 浏览器版（最新正式 Release）** | 手动安装 Node.js，首次初始化；在 Edge/Chrome 中编辑，支持长度、比例、分组和尺度标定；属性分区与标注搜索、筛选、分页。约 16.69 MiB | [程序 ZIP](https://github.com/Santifzaylum/Bio-Picture-Editor/releases/download/v2.3-webui/Bio-Picture-Editor-v2.3-webui.zip) · [Release](https://github.com/Santifzaylum/Bio-Picture-Editor/releases/tag/v2.3-webui) · [SHA-256](https://github.com/Santifzaylum/Bio-Picture-Editor/releases/download/v2.3-webui/Bio-Picture-Editor-v2.3-webui.zip.sha256) · [操作指南](docs/windows/v2.3-webui/USAGE.md) |
| **v2.1-macweb · macOS 浏览器版（预发布，暂停更新）** | M 系列 Mac、macOS 14+；双击启动.command，首次自动下载并校验 Node；在默认浏览器中编辑，无需 npm、Xcode 或编译 .app。约 35.67 MiB；开发版，未测试；因缺乏实际 Mac 测试，目前暂停更新 | [程序 ZIP](https://github.com/Santifzaylum/Bio-Picture-Editor/releases/download/v2.1-macweb/Bio-Picture-Editor-v2.1-macweb-arm64.zip) · [Pre-release](https://github.com/Santifzaylum/Bio-Picture-Editor/releases/tag/v2.1-macweb) · [SHA-256](https://github.com/Santifzaylum/Bio-Picture-Editor/releases/download/v2.1-macweb/Bio-Picture-Editor-v2.1-macweb-arm64.zip.sha256)；操作指南和手动测试清单随包提供 |

请选择 Release 的 **Assets 程序 ZIP** 并完整解压。GitHub 自动生成的 Source code ZIP/TAR 是开发源码快照，不是打包好的 EXE 程序。

## v2.2.1-p：安装、启动与退出

1. 使用 Windows 10/11 x64，系统需保留 .NET Framework 4.6.2+。完整解压 **Bio-Picture-Editor-v2.2.1-p.zip**，双击 **生物图片编辑器.exe**；EXE 也可单独复制运行。
2. 首次显示初始化进度，自动解压并校验编辑页面、图片组件和字体。已有兼容 Node.js 时复用，缺失时从官网下载锁定的 Node.js 22.23.3 并校验 SHA-256；缺少 Microsoft WebView2 时从 Microsoft 下载、核对签名并安装。无需手动安装 Node、执行 npm 或运行 Setup。
3. 缺少依赖时首次需要联网；完成后进入同一桌面编辑窗口，核心编辑可离线使用。失败时可打开日志目录并点击“重试”，损坏组件会在下次启动时重新准备。
4. 结束前逐张保存或导出 .biozip，再关闭窗口。程序检查所有图片的未保存状态、写入草稿，并停止自己启动的本地服务。

根目录仅有 **EXE、使用指南.html、README.txt 和“文档”文件夹**；示例、许可和 CLI 在“文档”。数据独立保存在 `%LOCALAPPDATA%\Bio-Picture-Editor\v2.2.1-p\`，项目在 `data\projects\`，草稿与偏好在 `webview-profile\`。默认本地端口 4324，冲突时自动选择后续可用端口。移动 EXE 不会移动数据；迁移旧 v2.1-p 或 WebUI 时先导出 .biozip。完整操作见 [桌面使用指南](docs/windows/v2.2.1-p/USAGE.md)，也可离线打开随包 **使用指南.html**。

## v2.3-webui：安装、启动与退出

1. 使用 Windows 10/11 x64，从 [Node.js 官网](https://nodejs.org/)安装 Node.js 22.12 或更新版本，保留 npm。下载 Assets 中的 **Bio-Picture-Editor-v2.3-webui.zip** 并完整解压。
2. 首次双击根目录 **首次初始化.cmd**，等待安装依赖与构建完成。首次需要联网，完成后核心编辑可离线使用。
3. 日常双击 **启动.vbs**。默认地址为 `http://127.0.0.1:4324/`，端口占用时选择后续空闲端口；配置在“程序/config.json”。
4. 结束前逐张保存或导出 .biozip，再运行 **停止.vbs**。关闭网页不会停止后台服务。禁用 VBS 时使用“文档/命令行启动.cmd”和“文档/命令行停止.cmd”。

根目录只保留启动、停止、首次初始化、**使用指南.html** 和 README.txt；运行文件在“程序”，开发及验证资料在“文档”。项目保存于 `程序/data/projects/`。WebUI 包不附带 Node.js 或预装依赖，需保留完整目录结构。完整基础操作、属性栏和测量教程见 [新手使用指南](docs/windows/v2.3-webui/USAGE.md)。历史 [v2.2.1-webui Release](https://github.com/Santifzaylum/Bio-Picture-Editor/releases/tag/v2.2.1-webui)、[v2.1-webui Release](https://github.com/Santifzaylum/Bio-Picture-Editor/releases/tag/v2.1-webui) 与源码继续保留。

## v2.1-macweb：安装、启动与退出（预发布，暂停更新）

**目前暂停更新。** 由于缺乏实际 Mac 测试，现有 v2.1-macweb 保留为未测试开发版；下载入口、源码和已有使用方法继续保留，尚未同步 Windows v2.2.1 的新测量功能。

1. 使用 M 系列 Mac、macOS 14 或更新版本，完整解压 **Bio-Picture-Editor-v2.1-macweb-arm64.zip**，双击 **启动.command**。请保留整个目录中的 core、launcher 和 release-manifest.json。
2. 首次联网自动下载锁定的官方 Node.js 22.23.3 darwin-arm64 运行时，并校验压缩包及二进制。Mac 图片处理组件、编辑页面、中文字体和 v2.1 示例项目已经随包提供；无需手动安装系统 Node.js、npm、Xcode 或在 Mac 上编译。
3. 准备完成后自动打开默认浏览器，后续复用独立运行环境，核心编辑可离线使用。Command+点击多选，Command+S 保存，Command+Z / Command+Shift+Z 撤销与重做，Delete（Backspace）删除，Option+拖动关联标注或局部放大整组。保留原图只读、放大三处独立线条样式、统一四周留白和原分辨率 PNG 导出。
4. 结束前逐张保存或导出 .biozip，再点击网页 **退出程序**，保存当前窗口全部图片标签页草稿并停止服务。也可先在所有页面保存，再运行 **停止.command**。仅关闭网页不会停止后台服务；PNG 和便携包的保存位置由浏览器下载设置决定。

数据独立保存在 `~/Library/Application Support/Bio-Picture-Editor/v2.1-macweb/`，默认首次从 4322 起选择空闲端口，后续沿用固定端口。旧 v1/v2/v3 项目可通过 .biozip 迁移已保存内容，不自动共享草稿；旧版 Mac 数据目录继续保留。随包 **先看这里-操作指南.html / .md** 提供完整操作与排错说明，**Mac验证清单.md** 提供后续人工验证步骤，**Codex协作指南.md** 说明 CLI。

**本版只完成代码移植、编译和打包，未运行本地或 Mac 测试。** 下载后的脚本可能需要系统允许打开；权限异常时可在解压目录运行 `bash ./启动.command`。Mac 运行、浏览器和图片输出仍待后续验证，Windows 版既有验证记录不代表 Mac 验收结果。

## 三版通用的简要操作

打开或拖入 PNG/JPEG 图片，也可打开示例或 .biozip；多张图片以独立标签页编辑。选择文字、箭头、关联引线、直线、矩形、椭圆或局部放大工具，在画布上绘制，右侧修改文字、位置和样式。v2.3-webui 的右侧分为“属性 / 标注 / 版面”：属性页显示当前对象相关控件，标注页管理列表，版面页设置图名、图注与留白。选择工具支持抓手平移、Ctrl 多选、撤销重做。

局部放大（M）：拖取样圆内部移动取样，拖放大圆移动展示，拖连接线或按 Alt 拖动整组；右侧分别设置取样圆、连接线和放大圆的颜色、线宽、虚线与对比描边。“查看原图”进入只读状态，保留缩放和平移，点击“返回标注编辑”继续。

**Ctrl+S 保存当前图片的可编辑项目，导出 PNG 得到成图，导出 .biozip 用于备份和跨版本/电脑迁移。保存和导出均作用于当前标签页，请逐张执行。** 自动草稿不能替代显式保存或备份。

## v2.3-webui 的改进与沿用的测量功能

| 改进 | 当前行为 |
| --- | --- |
| 箭头绘制 | 修复箭头与关联引线的线条、对比描边越过尖端的问题；画布和 PNG 导出使用相同的修正逻辑 |
| 属性栏分区 | 分为“属性 / 标注 / 版面”，按选中对象类型显示相关控件；说明、预设和测量高级设置按需展开，卡片左右留白保持对称 |
| 标注管理 | 按名称、说明、分组或 ID 搜索，按类型与状态筛选；每页 40 条，列表独立滚动，支持定位、多选和进入属性编辑 |
| 控制点绘制 | 选择框和控制点使用独立画布层，保持白底蓝边、不透明度及屏幕尺寸；原始偶发黑色/透明现象未稳定复现，目前为隔离防护 |
| 选择与保存 | 列表选择对象后切回选择工具；绘图工具切换清理旧选择，锁定对象不受批量样式修改影响；图注修改及时标记未保存，拖动结束后重新安排草稿保存 |

以下长度测量功能沿用 v2.2.1，Windows 桌面 v2.2.1-p 也提供：

| 功能 | 使用方式与结果 |
| --- | --- |
| 独立长度测量 | Q 进入连续两点测量，各条记录独立保存起点和终点，可以测不同位置及方向 |
| 同起点快捷点取 | 设置一次起点后连续点取终点；可保留共同起点，也可将单条测量独立出来 |
| 直线与方向投影 | 默认两点直线长度；电泳、层析等场景可选择沿指定方向的距离，横向偏移不计入投影 |
| 比例参考复用 | 多条待测记录引用同一已有参考，修改参考后自动重算；参考删除或长度为零时明确提示，保留待测数据 |
| 尺度标定 | 选择已知尺度的测量线并输入实际长度和单位，把 px 换算为实际长度；标定与比例参考分别设置 |
| 分组与测量表 | 分组筛选、列表定位、展开完整表、按选中/筛选/全部范围批量设置与复制、导出全精度 CSV |
| 标签显隐 | 选中已有测量，直接取消“显示结果标签”隐藏长度等结果文字，线、编号和数据保留；新建标签默认值明确只影响后续测量 |
| 连续测量后的编辑 | Esc 结束后保留刚完成对象的选择；点击测量列表进入现有对象编辑，不再继续点取新线 |
| 包内与指南整理 | WebUI 根目录保留五个使用入口，EXE 根目录保留程序、指南、简短说明和文档文件夹；两版完整指南均包含基础操作及新测量教程 |

比值不限制在 0～1，数据导出精度不受标签小数位数影响。没有回归拟合或自动条带识别；名称、测量点与计算方式由使用者选择。

## v2.1 的改进

| 改进 | 当前行为 |
| --- | --- |
| 名称与图标 | 左上角使用“生物图片编辑器”和生物图像主题 SVG；工具文字右侧有 SVG。关联引线与局部放大图标已重绘，比例和边界统一 |
| 颜色选择 | 仅颜色控件触发颜色选择，不再由“颜色”文字及同行空白重复唤出 |
| 查看原图 | 显示醒目的只读提示，暂停绘制、拖动编辑、属性修改和编辑快捷键，避免隐藏误标注；仍可缩放和平移，点击“返回标注编辑”继续 |
| 局部放大布局 | 放大圆在取样区附近创建，初始连接线为 32 px。移动、控制点、复制、方向键及 CLI 统一按完整边界补足四周留白，保留原图位置与已有留白 |
| 局部放大移动 | 拖取样圆内部移动取样，拖放大圆移动展示，拖连接线或按 Alt 拖动整组；支持半径、倍率控制点和精确坐标输入 |
| 独立线条样式 | 取样圆、连接线、放大圆分别设置颜色、线宽、虚线和对比描边，项目保存、便携包和 PNG 导出保留样式 |

局部放大用于呈现已有像素，不会恢复照片原本没有的细节。文字、图形、多图片、抓手平移、Ctrl 多选、撤销重做和本地 CLI 等原有能力继续提供。

## 保存、备份与升级

v2.3-webui 使用独立目录、端口和草稿库，默认从 4324 选择可用端口；桌面版默认也使用 4324，同时运行时请检查各自实际地址。三种运行方式的程序、项目目录与草稿库分别保存，不自动共享未保存编辑。迁移前在原版逐张保存并导出 .biozip，再到目标版本导入。v2.3-webui 与 v2.2.1-p 可读取旧 v1/v2/v3 项目；旧比例对象按原来的投影或独立长度比公式继续计算，也可可撤销地转换为新的独立测量。

**v2.3-webui、v2.2.1-webui 与 v2.2.1-p 可以互换含新测量和标定的 v4 便携项目。旧 v2.1-p 和 v2.1-macweb 不能读取 v4 项目。** 仅打开旧项目不会自动转换其测量。若需继续在历史 v2.1-p 或 Mac 中编辑，请保留旧格式便携包；PNG 可用于分享最终配图。

## 源码与构建

新版完整源码与发布包程序文件逐字节对应，位于 [source/editions/v2.3-webui/](source/editions/v2.3-webui/)，包含前端、服务端、CLI、测试、字体、示例和启动脚本。Git clone 或下载 GitHub 源码快照后，在该子目录执行：

```powershell
cd source/editions/v2.3-webui
npm ci
npm run build
npm start
```

源码目录仍使用 Setup.cmd / Start.vbs；Release 程序 ZIP 使用整理后的中文根目录入口。验证命令为 `npm run verify`（顺序执行生产构建与 58 项测试），也可分别运行 `npm run build` 与 `npm test`。沿用的旧版浏览器脚本保留为 `verify:legacy:*`，其界面选择器不作为本版验收依据。node_modules、dist、运行缓存和用户项目不上传。历史 [v2.2.1-webui 源码](source/editions/v2.2.1-webui/)与 [v2.1-webui 源码](source/editions/v2.1-webui/) 保留。

v2.2.1-p 的独立编辑源码位于 [source/editions/v2.2.1-p/](source/editions/v2.2.1-p/)，Windows 启动器与构建脚本位于 [source/platforms/windows/v2.2.1-p/](source/platforms/windows/v2.2.1-p/README.md)。在 Windows x64 构建机的该编辑源码目录执行 `npm ci`、`npm run desktop:build`、`npm test`、`npm run desktop:package`、`npm run desktop:verify`；需系统 .NET Framework C# 编译器。详细说明见 [桌面构建指南](source/platforms/windows/v2.2.1-p/README.md)。普通使用直接下载 EXE 程序 ZIP。

v2.3-webui 程序 ZIP 为 17,499,111 字节，SHA-256：

```text
681aba519a8f86ac67266eb1c09fc44128291935717ef428643cae29331e8066
```

可通过 `Get-FileHash .\Bio-Picture-Editor-v2.3-webui.zip -Algorithm SHA256` 校验；其他平台按各自 Release 的校验文件检查。

v2.2.1-p 程序 ZIP 为 41,063,273 字节，SHA-256：

```text
3522a56773724c80f2f993159407322c421152ef53ad605812645db82397b5d3
```

历史 [v2.1-p Release](https://github.com/Santifzaylum/Bio-Picture-Editor/releases/tag/v2.1-p) 与源码继续保留。

## 与 ChatGPT / Codex 协作

支持“ChatGPT 对话规划 → Codex 本地执行 → 编辑器复核”：讨论标注名称、文字、位置和样式后，由可访问本地项目的 Codex 读取摘要、标注 ID 与像素坐标，通过 CLI 修改项目、生成预览，再在编辑器中检查。外部修改使用修订号校验，避免覆盖未保存内容。

程序没有内置聊天面板或自动调用模型。图片是否发送给模型由你选择的对话与工具操作决定；云端对话不能直接读取本地文件或 localhost。WebUI 命令与项目交接见 [Codex 协作指南](CODEX_GUIDE.md)，桌面版使用随包 desktop-cli.ps1 / Codex-CLI.cmd，具体见 [桌面协作指南](docs/windows/v2.2.1-p/CODEX_GUIDE.md)。

## 验证与支持范围

2026-10-22，v2.3-webui 通过 TypeScript/Vite 生产构建与 58 项回归测试，覆盖模型、存储、测量、标定、便携包和 PNG；新增箭头像素检查覆盖箭头、关联引线、描边、虚线、多种线宽与缩放。浏览器中验证了 85 个标注的搜索、筛选、40 / 40 / 5 分页、列表定位、1200×800 PNG 导出，以及属性卡片两侧 18 px 留白。ZIP 清单中 93 个文件的大小与 SHA-256 全部核对通过。详见 [新版验证记录](docs/windows/v2.3-webui/VERIFICATION.md)。原始控制点偶发异常未稳定复现；本次未重新执行整套旧 UI 自动化，也未在全新 Windows 系统重测首次安装流程。


2026-10-03 在本机 Windows/Edge 完成 TypeScript/Vite 构建、24 项逻辑与 PNG 测试、17 组新版交互和 7 组旧键鼠回归，页面脚本错误为 0；发布包首次 Setup、后台启动、保存导出及停止脚本通过。详细范围与尚未覆盖环境见 [验证记录](source/editions/v2.1-webui/VERIFICATION.md)。

v2.2.1-p 完成构建和 ZIP/EXE 哈希核对，56 项模型测试、43 项浏览器检查、8 组真实 EXE 基础功能、4 组 EXE 测量及 7 组运行时检查通过；包含草稿恢复、单实例、CLI、服务清理、损坏修复和官方 Node 首次下载。后续 Windows 原生“另存为”交互检查按用户决定跳过，尚未在缺少 WebView2 的全新 Windows 上端到端测试自动安装。具体范围见 [桌面验收报告](validation/v2.2.1-p/V2.2.1-P-REPORT.md)。

三版均面向普通 8 位 PNG/JPEG。v2.3-webui 与 v2.2.1-p 均支持长度、比例与尺度标定；Mac 版保留 v2.1 功能，因缺乏测试暂停更新。暂不支持 TIFF、DICOM、全切片、多通道、高位深、自动识别、多图拼版或批量导出。图片和导出最多 6400 万像素、单边最多 16384 px，实际能力取决于内存。

## 文档与项目历史

- [操作指南](USAGE.md)：安装、基础标注、局部放大、长度与比例、标定、保存及导出。
- [Codex 协作指南](CODEX_GUIDE.md)：CLI、项目坐标与修订冲突。
- [新版 WebUI 发布说明](V2.3-WEBUI-RELEASE.md)、[历史 WebUI 发布说明](V2.1-WEBUI-RELEASE.md)、[桌面发布说明](V2.2.1-P-RELEASE.md)与[版本记录](CHANGELOG.md)：各版本的改进和发布信息。
- [桌面操作指南](docs/windows/v2.2.1-p/USAGE.md)、[桌面协作指南](docs/windows/v2.2.1-p/CODEX_GUIDE.md)：EXE 初始化、导出和本地 CLI。
- [项目发展历史](HISTORY.md)：v1.1 键鼠优化、桌面版、Mac 开发版以及 v2.0/v2.1 WebUI 的演进与历史入口。

v1.1 WebUI 不再作为首页并行主版本展示，其代码和原始程序包可从 Git 提交历史获取。已发布的 v1.1-p Windows EXE 仍可在历史 Releases 下载；Mac v1.1-macweb 仍为未测试 Pre-release，Windows 验证结果不代表 Mac 验证结果。

第三方组件、字体与示例保留各自许可，见 [第三方说明](THIRD-PARTY-NOTICES.txt)及源码内许可文件。本项目整体软件许可证尚未指定。
