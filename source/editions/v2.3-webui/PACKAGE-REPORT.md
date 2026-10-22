# v2.3-webui 发布包

轻量源码式 Windows WebUI 包。根目录为启动.vbs、停止.vbs、首次初始化.cmd、使用指南.html 和 README.txt，另有程序与文档两个文件夹。程序目录包含源码、锁文件、字体、示例、配置和内部启动器；文档包含开发、验证和版本说明及禁用 VBS 时的备用命令。

首次安装 Node.js 22.12+ 和 npm，运行首次初始化.cmd 安装锁定依赖并构建网页；日常启动.vbs。默认端口 4324，用户数据保存于 程序/data/。个人项目、node_modules、dist、运行缓存和测试输出不进入 ZIP。

PACKAGE-MANIFEST.json 位于文档，保存所有打包文件的大小和 SHA-256；打包后逐文件核对 ZIP，并生成同名 .zip.sha256。解压启动与功能验收见验证记录。
