# v2.1-webui 与 Codex 协作

先启动服务并保存项目，在程序目录运行命令。CLI 与界面必须使用同一 data 目录。

```powershell
npm run cli -- list
npm run cli -- summary PROJECT_ID
npm run cli -- preview PROJECT_ID preview.png
npm run cli -- patch PROJECT_ID ANNOTATION_ID REVISION patch.json
npm run cli -- export PROJECT_ID final.png 1
npm run cli -- crop PROJECT_ID local.png 900 100 200 200
```

默认服务端口为 4321，CLI 从 data/runtime.json 获取实际端口与令牌。请勿分享 runtime.json。标注定位使用 display.png，对应 EXIF 方向校正后的原图像素坐标。

summary 返回对象 ID、类型、几何、状态及局部放大的 detail 参数。patch 支持原有 label、description、geometry、style、visible、locked、status，也支持放大对象的 detail 局部修改。例如 {"detail":{"magnification":3}} 会以当前展示圆中心为基准同步重算直径。取样圆越界或输出尺寸不一致时拒绝保存；CLI 修改局部放大时也按对象边界补足四周留白，避免展示圆被裁切。

修订号过期返回 409。界面约每 1.5 秒检查外部修订；已有未保存编辑时保留内容并提示冲突。模型建议使用 status=suggested，医学名称与区域仍需用户复核。

界面使用 V 选择、M 局部放大、Ctrl+点击多选，放大后无标注处左键平移。旧版可导入，新放大项目 version=2 不能交回旧版编辑。程序不内置模型调用，不自动上传图片。

独立线条保存在 detail.styles.source / connector / inset，每项必须完整提供 color、strokeWidth、dash、contrast。例如 patch 可传 {"detail":{"styles":{"source":{"color":"#ff8800","strokeWidth":3,"dash":false,"contrast":true},"connector":{"color":"#2563eb","strokeWidth":2,"dash":true,"contrast":false},"inset":{"color":"#ef4444","strokeWidth":6,"dash":false,"contrast":true}}}}。未提供 styles 的 v2.0 对象沿用统一 style；新增独立样式后须用 v2.1 或更新编辑器继续编辑。
