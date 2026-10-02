# 生物图片编辑器与 Codex 协作

桌面版保留本地网页和命令行接口。Codex 可以在授权范围内查看项目图片、读取结构化标注、修改内容并生成预览；编辑器不会自动发送图片到模型。

## 获取桌面版

从[发布页面](https://github.com/Santifzaylum/Bio-Picture-Editor/releases/tag/v1.1-p)下载并解压 Bio-Picture-Editor-v1.1-p.zip，使用其中的 EXE 和 Codex-CLI.cmd。CLI 包装脚本与当前安装目录配合使用，旧版源码脚本不适用于桌面版独立运行环境。

## 准备与命令

双击生物图片编辑器.exe 完成初始化，打开图片并保存项目，保持窗口运行。发布包内 Codex-CLI.cmd 会读取当前安装信息，不要求系统安装 Node.js，也无需使用源码目录。

```powershell
.\Codex-CLI.cmd list
.\Codex-CLI.cmd summary PROJECT_ID
.\Codex-CLI.cmd patch PROJECT_ID ANNOTATION_ID REVISION PATCH.json
.\Codex-CLI.cmd preview PROJECT_ID OUTPUT.png 1
.\Codex-CLI.cmd export PROJECT_ID OUTPUT.png 1
.\Codex-CLI.cmd crop PROJECT_ID OUTPUT.png x y width height
```

patch 使用 UTF-8 JSON，提交时提供当前项目修订号，避免覆盖其他编辑。预览和导出支持 1、2、4 倍；crop 使用经方向校正后原图的整数像素坐标。用户未保存的编辑发生冲突时，界面会保留当前内容并提示处理。

默认安装与数据在 %LOCALAPPDATA%\Bio-Picture-Editor\。active-install.json 记录当前运行文件和数据目录，data/runtime.json 记录本地端口与会话令牌。不要对外分享会话令牌文件。服务只绑定 127.0.0.1；云端 localhost 指向云端环境自身，不能代表用户的 Windows 电脑。

若需用本地浏览器访问编辑器，打开 data/runtime.json 中端口对应的 http://127.0.0.1:端口/。浏览器草稿和桌面草稿分开，但已保存项目使用同一个本地服务。

## 源码与测试

v1.1-p 桌面发布包不包含完整开发源码；当前仓库中的历史 ZIP 对应此前版本。完整桌面构建源码尚未同步至 GitHub。发布包内 DESKTOP-BUILD.md 记录开发环境和构建流程，普通使用和本地 CLI 无需源码构建。

独立测试目录可使用发布包 desktop-cli.ps1 的 -ProfileFolder 参数指定：

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\desktop-cli.ps1 -ProfileFolder 'D:\isolated-test-profile' list
```

多图片保存与导出仍需逐张执行。升级前优先导出 .biozip 或备份已保存项目；v1.0 / v1.1 项目格式保持兼容。