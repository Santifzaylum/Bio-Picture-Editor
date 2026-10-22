# 生物图片编辑器 v2.3-webui

基于 v2.2.1-webui 的 Windows 浏览器版更新：修复箭头尖端多余线段，为选择控制点增加绘制隔离；属性栏拆分为属性、标注和版面，增加列表搜索、筛选与分页，并保持左右留白一致。

发布包默认端口 4324。第一次安装 Node.js 22.12+（含 npm），运行“首次初始化.cmd”；之后双击“启动.vbs”。结束前逐张保存，再双击“停止.vbs”。用户项目保存在 程序/data/，迁移请使用 .biozip。旧版本文件与数据独立保留。

开发源码：source/editions/v2.3-webui。安装依赖后运行 npm run build、npm test；npm run verify 顺序执行构建与测试，npm run package 生成 ZIP 及 SHA-256 校验文件。沿用的旧版浏览器脚本保留为 verify:legacy:*，其界面选择器不作为本版验收依据。本版浏览器验收记录见 VERIFICATION.md。

详见 [版本说明](RELEASE-v2.3-webui.md)、[使用指南](USAGE.md) 和 [验证记录](VERIFICATION.md)。
