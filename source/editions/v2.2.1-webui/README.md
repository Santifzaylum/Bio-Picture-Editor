# 生物图片编辑器 v2.2.1-webui

Windows WebUI 最新版本。保留箭头、文字、关联引线、形状、局部放大、多图片与可编辑项目；新增独立长度测量、连续两点点取、同起点快捷点取、投影距离、比例参考复用、分组、尺度标定及完整精度 CSV。没有回归拟合。

发布包根目录仅保留启动.vbs、停止.vbs、首次初始化.cmd、使用指南.html 和 README.txt；运行文件在“程序”，技术资料和备用命令在“文档”。首次安装 Node.js 22.12+（含 npm），运行首次初始化.cmd；日常启动.vbs，默认端口 4323。完整步骤见 [操作指南](USAGE.md)。

开发源码位于 source/editions/v2.2.1-webui。该源码目录仍直接使用 Setup.cmd、Start.vbs；源码 data/ 与发布包 程序/data/ 分别保存本地数据。开发命令：npm ci；npm run build；npm test；npm run verify:measurement；npm run verify；npm run verify:v1；npm run package。

旧 v1/v2/v3 项目可读取；新长度测量使用 v4 项目，需要 v2.2.1 或更新版打开。旧对象不自动转换，投影与长度比保持原计算。新旧版本目录及草稿库隔离，请先导出 .biozip 迁移。
