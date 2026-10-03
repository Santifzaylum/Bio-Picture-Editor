# Bio-Picture-Editor v1.1 WebUI 与 Codex 协作

Bio-Picture-Editor 提供本地网页和命令行接口。Codex 可以在你授权的范围内读取项目图片、查看结构化标注、调整内容并生成预览。编辑器本身不会自动发送图片到模型。

## 准备项目

按 [历史 README](https://github.com/Santifzaylum/Bio-Picture-Editor/blob/c6182e6c0a5d5828c5f87a62c5aafef28225804a/README.md) 完成首次安装，启动编辑器并保存目标图片。程序与 CLI 应使用同一个程序目录和数据目录。

如果 Codex 的浏览器和本地编辑器运行在同一台电脑上，可让它打开 `http://127.0.0.1:4317/`；若启动器使用了其他端口，以 `config.json` 为准。云端环境中的 `localhost` 指向云端环境自身，不能直接代表你的 Windows 电脑。

## v1.1 的目录与界面操作

本指南适用于 v1.1，项目格式、像素坐标及 CLI 接口沿用 v1.0。升级时请先备份项目，并让 CLI 与网页服务指向同一个新版程序目录，避免修改到另一版本的数据。

通过浏览器辅助操作时，按 `V` 切换选择工具。在图片或含留白的版面超出可见范围时，空白处左键拖动用于平移；已有标注和控制点优先用于选择、移动或编辑。画布及右侧列表使用 `Ctrl+点击` 多选，空格加拖动不再作为平移方式。创建新标注时，应先明确选择对应的绘图工具。

## 常用命令

在解压后的程序根目录打开 PowerShell，并保持本地服务运行。以下命令中的 `PROJECT_ID`、`ANNOTATION_ID` 和 `REVISION` 都需要替换为实际值。

```powershell
npm run cli -- list
npm run cli -- summary PROJECT_ID
npm run cli -- preview PROJECT_ID preview.png
npm run cli -- crop PROJECT_ID local.png 900 100 200 200
npm run cli -- patch PROJECT_ID ANNOTATION_ID REVISION examples/patch.json
npm run cli -- export PROJECT_ID final.png 1
```

| 命令 | 用途 |
| --- | --- |
| `list` | 列出已保存项目 |
| `summary` | 查看当前修订号、标注 ID、几何、标签和项目目录 |
| `preview` | 生成包含可见标注和留白的完整预览 |
| `crop` | 获取指定像素范围的原图局部及坐标说明，局部图不含标注 |
| `patch` | 按修订号提交某个标注的局部修改 |
| `export` | 导出 PNG，末尾的 `1` 表示原分辨率 |

也可以使用程序自带的 `Codex-CLI.cmd`，例如：

```powershell
.\Codex-CLI.cmd list
.\Codex-CLI.cmd summary PROJECT_ID
```

## 坐标与修改

标注几何使用 EXIF 方向校正后的原图像素坐标：左上角为 `(0, 0)`，x 向右，y 向下。页面缩放和平移不会改变几何坐标。图旁文字可位于原图范围外，版面留白与原图坐标分开记录。

定位图片时建议读取项目中的 `display.png`，它与编辑器所显示的方向一致。原始导入文件完整保留在项目中。

`patch` 支持修改 `label`、`description`、`geometry`、`style`、`visible`、`locked` 和 `status`。补丁文件示例：

```json
{
  "label": "位置说明",
  "geometry": { "x": 1230, "y": 180 },
  "style": { "fontSize": 28, "color": "#2563eb" },
  "status": "suggested"
}
```

各标注类型的几何字段不同，请先读取 `summary` 再修改。关联引线的 `x/y` 对应文字框，`x2/y2` 对应箭头尖端。`status` 中的 `user`、`suggested`、`confirmed` 用于记录用户内容、待确认建议和人工确认状态。

## 修订号与冲突

每次成功保存都会递增修订号。提交补丁前应读取最新 `summary`，使用其中的当前修订号；过期修订会被拒绝，返回冲突，而不会覆盖文件。

界面会查询外部修订。没有未保存修改时可以同步；已有未保存编辑时会显示冲突提示，并保留当前编辑。此时可先导出便携包备份，再选择载入外部版本，或基于新修订显式保存当前内容。

CLI 通过本地服务提交修改。日常协作优先使用 CLI，保留修订校验；备份完整数据目录时先停止服务。

## 适合给 Codex 的任务描述

> 请先读取这个项目的 summary 和 display.png，确认标注 ID 与像素坐标，再按我的要求修改文字和样式。修改前使用最新修订号，完成后生成预览供我查看。

涉及组织位置或医学名称时，应明确目标区域和期望文字，再查看预览确认。编辑器不验证医学内容的正确性。

更完整的数据结构、尺寸限制和本地接口说明见程序 ZIP 内的 `GUIDE.md`。

