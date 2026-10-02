# 生物图片编辑器 v1.1-macweb

> **开发版本（Pre-release），未进行测试。** 仅完成移植、编译和打包，Mac 首启、浏览器操作、保存与导出、CLI 等实际运行行为均待后续验证。下载与三个并行版本的比较见 [README](README.md)。

M 系列 Mac 的本地浏览器 WebUI 版，目标系统为 macOS 14 或更新版本。本发布包可在 Windows 构建，不含 `.app`，不要求用户安装 Xcode、开发者证书、系统 Node.js 或 npm。编辑界面、配色、图标、图片处理服务、项目格式和 CLI 沿用原版。

## 解压与启动

下载并完整解压 `Bio-Picture-Editor-v1.1-macweb-arm64.zip`，双击 **启动.command**。首次会打开终端准备窗口，自动从 Node.js 官方下载固定版本的 M 系列运行时，校验压缩包和二进制，再安装编辑组件、字体与图片处理依赖。完成后自动打开默认浏览器，进入编辑器。首次需要联网；初始化完成后核心编辑功能可离线使用。

请完整保留解压目录里的 `core/`、`launcher/` 和 `release-manifest.json`，不要只复制启动脚本。初始化不向系统目录安装软件，不要求管理员权限；即使你已经安装系统 Node，也使用独立运行时以固定版本。

初次运行下载的 `.command` 脚本时，macOS 可能要求允许打开。若系统阻止，可在尝试打开后按系统提示前往“系统设置 → 隐私与安全性 → 仍要打开”。只运行可信来源且已核对 SHA-256 的包；系统操作说明见 [Apple 官方文档](https://support.apple.com/en-us/102445)。若解压工具没有保留执行权限，可以在终端进入发布目录运行 `bash ./启动.command`，也可以对四个 `.command` 文件执行 `chmod +x` 后双击。此步骤只用于权限异常的排错。

## 编辑、保存与导出

保留普通 8 位 PNG/JPEG 导入与粘贴、多图片标签页、文字、箭头、直线、关联引线、矩形、椭圆、留白、图注、样式预设、标注显示与锁定、原图查看、控制点编辑、缩放与平移、复制/粘贴、撤销/重做、可编辑项目、修订冲突处理、便携包和原分辨率/2×/4× PNG 导出。

每张图片有独立标签页与编辑记录。保存项目、便携包和 PNG 导出只作用于当前标签页，请逐张执行。`.biozip` 包含原始图片与标注，可在 Windows 与 Mac 之间交换；迁移或可靠备份应使用已保存项目和便携包。

| 快捷键 | 操作 |
| --- | --- |
| Command+点击 | 多选；Ctrl 多选也保留兼容 |
| Command+O / Command+S | 打开图片或项目 / 保存当前项目 |
| Command+Z / Command+Shift+Z | 撤销 / 重做 |
| Command+C / Command+V / Command+D | 复制 / 粘贴 / 创建选中标注副本 |
| Delete（Backspace）/ Fn+Delete | 删除未锁定的选中标注，文字输入框正常编辑文字 |
| 方向键 / Shift+方向键 | 移动 1 / 10 原图像素 |
| Option（Alt）拖动 | 关联标注整体移动 |
| Shift / Esc | 绘制时约束方向或形状 / 取消操作 |

滚轮或触控板滚动可以缩放；放大后在空白处按住左键拖动平移，中键拖动也保留。内置思源黑体随包提供，适合跨平台显示与导出。Windows 项目若使用微软雅黑或宋体，Mac 须有对应合法字体，或在文字设置中显式改为内置思源黑体；不同字体的字宽与换行可能不同。

PNG、便携包和标注清单通过浏览器下载。保存位置和是否出现另存为由浏览器下载设置决定；“已发起下载”表示编辑器已交给浏览器，实际文件请在浏览器下载列表中确认。PNG 同时在本地项目的 `exports/` 目录保留一份。可在 Safari、Chrome 或 Edge 的下载设置里选择每次询问位置；具体浏览器兼容性待你在 Mac 上验证。

## 正常退出与草稿

推荐点击网页右上方 **退出程序**。它会确认退出、保存当前浏览器窗口全部图片标签页的草稿，再停止本地服务。未显式保存的项目会提示先做可靠备份；正在操作或草稿保存失败时不继续正常退出。退出后网页显示“编辑器已退出”，可以关闭标签页。

**直接关闭浏览器标签页不会停止本地服务。** 后台服务独立运行，关闭初始化的终端窗口也不会停止它。若需要通过脚本停止，请先在所有浏览器窗口保存项目，再双击 **停止.command**，输入 `y` 确认。此脚本不能替其他浏览器页面写入草稿，不要用它代替网页内的有序退出。

浏览器草稿和样式偏好与浏览器、用户配置、网址端口有关。请日常使用同一浏览器和普通浏览模式；私密浏览、清理网站数据或切换浏览器可能无法读取原草稿。同一数据配置保存固定端口，若该端口被其他程序占用，会提示先解决占用，避免悄悄换端口导致草稿隐藏。草稿不能代替项目或 `.biozip` 备份。

若同时打开多个浏览器窗口，它们连接同一个本地服务；网页退出会停止所有连接。退出前请在其他窗口保存。不同浏览器窗口并不会自动合并各自未保存的草稿；项目修订冲突处理仍保留。

## 本地目录与日志

默认用户目录：`~/Library/Application Support/Bio-Picture-Editor/macweb/`。它与先前 Mac 原生版目录分开，不使用 Windows 路径。

| 内容 | 位置 |
| --- | --- |
| 已保存项目、原图、历史、PNG 副本 | `data/projects/` |
| 编辑器与图片处理依赖 | `components/v1.1-macweb-资源哈希/` |
| 独立 Node 运行时 | `runtime/node-v22.23.3-arm64/` |
| 官方运行时下载缓存 | `downloads/` |
| 当前运行组件与固定端口 | `active-install.json`、`desktop-settings.json` |
| 初始化与服务日志 | `install.log`、`desktop.log`、`server.log`、`server-error.log` |

双击 **打开日志.command** 可打开此目录。初始化失败时，检查网络、磁盘空间、目录权限和日志，再重启启动脚本。运行时损坏会重新下载并校验；编辑组件缺失或损坏会从原发布包重新安装。发布包本身损坏则需要重新解压。修复不主动删除 `data/` 中的项目。

## CLI 与 Codex 协作

先启动编辑器、保存项目并保持服务运行。在发布包目录的终端中调用：

```bash
bash ./Codex-CLI.command list
bash ./Codex-CLI.command summary PROJECT_ID
bash ./Codex-CLI.command patch PROJECT_ID ANNOTATION_ID REVISION PATCH.json
bash ./Codex-CLI.command preview PROJECT_ID OUTPUT.png 1
bash ./Codex-CLI.command export PROJECT_ID OUTPUT.png 2
bash ./Codex-CLI.command crop PROJECT_ID OUTPUT.png x y width height
```

CLI 使用独立运行时，不依赖系统 Node。`patch` 提交 UTF-8 JSON 和当前修订号；`crop` 仍使用方向校正后原图的整数像素坐标。编辑器不会自动上传图片给模型。双击 CLI 脚本不带参数时列出已存项目。

可用独立目录进行后续验证：`bash ./启动.command --profile "$HOME/Desktop/BioMacWeb-Test"`；对应停止、CLI 与日志脚本也支持在前面加同样的 `--profile` 参数。首次在独立目录仍需准备运行时。独立测试配置不读写默认项目数据，但同一浏览器依然按各自端口区分草稿。

本版本沿用原有边界，不支持 TIFF、DICOM、全切片、多通道、高位深、多图拼版或批量导出。本次没有运行本地或 Mac 测试；发布包已经构建，但 Mac 首启、浏览器行为和图片输出仍需后续实际验证。
