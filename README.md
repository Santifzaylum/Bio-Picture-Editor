# 生物图片编辑器 · v2.1-webui

在 Windows 本机运行的生物医学图片标注编辑器。保留浏览器 WebUI，支持中文文字、箭头、关联引线、直线、矩形、椭圆、圆形局部放大、多图片标签页、可继续编辑的项目与 PNG 导出。图片在本机处理，编辑器不会自动上传图片。

**当前主版本为 v2.1-webui。** 下载 [Windows WebUI 程序包](https://github.com/Santifzaylum/Bio-Picture-Editor/releases/download/v2.1-webui/Bio-Picture-Editor-v2.1-webui.zip)，查看 [Release 发布说明](https://github.com/Santifzaylum/Bio-Picture-Editor/releases/tag/v2.1-webui) 或 [SHA-256 校验文件](https://github.com/Santifzaylum/Bio-Picture-Editor/releases/download/v2.1-webui/Bio-Picture-Editor-v2.1-webui.zip.sha256)。本包约 16.28 MiB，采用网页方式运行，不包含 EXE、Node.js 或预装依赖。

## 安装、启动与退出

1. 使用 Windows 10/11 x64，从 [Node.js 官网](https://nodejs.org/)安装 Node.js 22.12 或更新版本，保留附带的 npm。完整解压 Bio-Picture-Editor-v2.1-webui.zip，保留整个程序文件夹。
2. 首次双击 Setup.cmd，等待依赖安装与构建完成。首次初始化需要联网，完成后核心编辑功能可离线使用。
3. 日常双击 启动.vbs / Start.vbs，打开浏览器中的编辑器。默认地址为 `http://127.0.0.1:4321/`；端口被占用时启动器选择后续空闲端口并更新 config.json。
4. 使用结束前逐张保存或导出便携项目包，再运行 停止.vbs / Stop.vbs。仅关闭网页不会停止后台服务。

系统禁用 VBS 时使用 Start.cmd / Stop.cmd。建议将程序解压到普通可写目录。详细操作和常见问题见 [操作指南](USAGE.md)。

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

已保存项目位于程序目录 `data/projects/<项目ID>/`，包含原图、标注、图注和修订。浏览器自动草稿依赖浏览器、网址和端口，不能替代显式保存。**保存、导出 PNG 和导出 .biozip 都作用于当前图片标签页，请逐张执行。**

可导入 v1.1/v2.0 的 .biozip。升级前在旧版逐张保存并导出备份，再在新版打开并保存。v2.1 使用独立程序目录、默认端口和浏览器草稿库，不自动迁移旧版未保存草稿；新独立线条属性需要 v2.1 或更新版本读取，不建议把新版项目交回旧版覆盖保存。

## 源码与构建

完整源码与发布包逐文件对应，位于 [source/editions/v2.1-webui/](source/editions/v2.1-webui/)，包含前端、服务端、CLI、测试、SVG、字体、示例和启动脚本。Git clone 或“Code → Download ZIP”后，在此子目录执行：

```powershell
cd source/editions/v2.1-webui
npm ci
npm run build
npm start
```

验证命令为 `npm test`、`npm run verify` 和 `npm run verify:v1`。首次构建会生成 node_modules 与 dist，仓库和轻量发布包不包含这些本机生成内容。普通使用建议直接下载 Release 的 Assets 程序 ZIP；GitHub 自动附带的 Source code ZIP/TAR 是仓库快照，启动文件位于上述子目录。

程序 ZIP 为 17,065,077 字节，SHA-256：

```text
707aadcefcbc91dda79a1da3706dcdb418b668b171a74df3b7ccfeafe641c2de
```

可通过 `Get-FileHash .\Bio-Picture-Editor-v2.1-webui.zip -Algorithm SHA256` 校验。

## 与 ChatGPT / Codex 协作

支持“ChatGPT 对话规划 → Codex 本地执行 → 编辑器复核”：讨论标注名称、文字、位置和样式后，由可访问本地项目的 Codex 读取摘要、标注 ID 与像素坐标，通过 CLI 修改项目、生成预览，再在编辑器中检查。外部修改使用修订号校验，避免覆盖未保存内容。

程序没有内置聊天面板或自动调用模型。图片是否发送给模型由你选择的对话与工具操作决定；云端对话不能直接读取本地文件或 localhost。命令和项目交接方法见 [Codex 协作指南](CODEX_GUIDE.md)。

## 验证与支持范围

2026-10-03 在本机 Windows/Edge 完成 TypeScript/Vite 构建、24 项逻辑与 PNG 测试、17 组新版交互和 7 组旧键鼠回归，页面脚本错误为 0；发布包首次 Setup、后台启动、保存导出及停止脚本通过。详细范围与尚未覆盖环境见 [验证记录](source/editions/v2.1-webui/VERIFICATION.md)。

当前支持普通 8 位 PNG/JPEG。暂不支持 TIFF、DICOM、全切片、多通道、高位深、比例尺测量、自动识别、多图拼版或批量导出。图片和导出最多 6400 万像素、单边最多 16384 px，实际能力取决于内存。

## 文档与项目历史

- [操作指南](USAGE.md)：安装、标注、局部放大、保存与导出。
- [Codex 协作指南](CODEX_GUIDE.md)：CLI、项目坐标与修订冲突。
- [v2.1 发布说明](V2.1-WEBUI-RELEASE.md)与[版本记录](CHANGELOG.md)：本次改进和发布过程。
- [项目发展历史](HISTORY.md)：v1.1 键鼠优化、桌面版、Mac 开发版以及 v2.0/v2.1 WebUI 的演进与历史入口。

v1.1 WebUI 不再作为首页并行主版本展示，其代码和原始程序包可从 Git 提交历史获取。已发布的 v1.1-p Windows EXE 仍可在历史 Releases 下载；Mac v1.1-macweb 仍为未测试 Pre-release，Windows 验证结果不代表 Mac 验证结果。

第三方组件、字体与示例保留各自许可，见 [第三方说明](THIRD-PARTY-NOTICES.txt)及源码内许可文件。本项目整体软件许可证尚未指定。
