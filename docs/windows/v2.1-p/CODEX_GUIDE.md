# v2.1-p 与 Codex 协作

先双击 EXE 完成初始化，保持窗口打开并保存目标项目。随包 desktop-cli.ps1 从 active-install.json 定位独立 Node.js、应用组件和数据，无需系统 npm。CLI 与窗口必须使用同一 data 目录。

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\desktop-cli.ps1 list
powershell -NoProfile -ExecutionPolicy Bypass -File .\desktop-cli.ps1 summary PROJECT_ID
powershell -NoProfile -ExecutionPolicy Bypass -File .\desktop-cli.ps1 preview PROJECT_ID preview.png
powershell -NoProfile -ExecutionPolicy Bypass -File .\desktop-cli.ps1 patch PROJECT_ID ANNOTATION_ID REVISION patch.json
powershell -NoProfile -ExecutionPolicy Bypass -File .\desktop-cli.ps1 export PROJECT_ID final.png 1
powershell -NoProfile -ExecutionPolicy Bypass -File .\desktop-cli.ps1 crop PROJECT_ID local.png 900 100 200 200
```

默认服务端口为 4322，CLI 从 %LOCALAPPDATA%\Bio-Picture-Editor\v2.1-p\data\runtime.json 获取实际端口与令牌。请勿分享 runtime.json。标注定位使用 display.png，对应 EXIF 方向校正后的原图像素坐标。

summary 返回对象 ID、类型、几何、状态及局部放大的 detail 参数。patch 支持原有 label、description、geometry、style、visible、locked、status，也支持放大对象的 detail 局部修改。例如 {"detail":{"magnification":3}} 会以当前展示圆中心为基准同步重算直径。取样圆越界或输出尺寸不一致时拒绝保存；CLI 修改局部放大时也按对象边界补足四周留白，避免展示圆被裁切。

修订号过期返回 409。界面约每 1.5 秒检查外部修订；已有未保存编辑时保留内容并提示冲突。模型建议使用 status=suggested，医学名称与区域仍需用户复核。

界面使用 V 选择、M 局部放大、Ctrl+点击多选，放大后无标注处左键平移。旧版可导入，新放大项目 version=2 不能交回旧版编辑。程序不内置模型调用，不自动上传图片。

独立线条保存在 detail.styles.source / connector / inset，每项必须完整提供 color、strokeWidth、dash、contrast。例如 patch 可传 {"detail":{"styles":{"source":{"color":"#ff8800","strokeWidth":3,"dash":false,"contrast":true},"connector":{"color":"#2563eb","strokeWidth":2,"dash":true,"contrast":false},"inset":{"color":"#ef4444","strokeWidth":6,"dash":false,"contrast":true}}}}。未提供 styles 的 v2.0 对象沿用统一 style；新增独立样式后须用 v2.1 或更新编辑器继续编辑。

## 与 ChatGPT 持续协作

在 ChatGPT 中讨论标注名称、图注、位置与样式，再授权本地 Codex 读取项目摘要及预览并执行 CLI 修改，最后在桌面窗口复核。建议明确目标项目 ID、标注 ID、像素坐标和期望样式；修改前读取最新 revision，避免覆盖未保存编辑。程序不内置聊天面板，也不会自动发送图片；云端对话不能直接读取本机文件或 localhost。

项目可用 .biozip 交接和备份，v2.1-webui 与 v2.1-p 使用相同模型及独立线条属性。所有桌面项目默认位于 %LOCALAPPDATA%\Bio-Picture-Editor\v2.1-p\data\projects\。使用自定义验收目录时在 desktop-cli.ps1 后加 -ProfileFolder 路径。
