# v2.2.1-webui 开发与数据格式

程序入口 server/index.ts；默认端口 4323。浏览器草稿库 bio-picture-editor-v2.2.1-webui。构建 npm run build，模型测试 npm test，测量浏览器验证 npm run verify:measurement，基础功能回归 npm run verify 与 npm run verify:v1。

长度对象沿用 type="ratio" 工具类型，使用独立 measurement 字段，与旧 ratio 字段互斥。measurement 保存 start/end、method（straight/projection）、axisId、referenceId、group、originId、labelMode、precision、showLine、showNumber 和 ratioName。几何 x/y 是结果文字位置。新测量要求项目 version=4；旧比例对象仍按 ratio 的原公式读取，可与 v4 共存。投影轴方向取 axisId 对象的 start→end 原始几何；比例分母取 referenceId 对象的 measuredPixels，引用不递归使用别的比例结果。

calibration.referenceId 引用标定线；使用其两点直线长度动态换算。缺失或零长度时回到 px 并报告标定失效。referenceId/axisId 缺失可保存，界面报告失效，不静默删除或替换。common originId 修改可批量更新，也能解除单条关联；锁定对象拒绝共同修改。CSV 保留全精度坐标、测量方式、引用和状态，图片标签精度独立。

打包脚本 scripts/package-webui.mjs 将源文件放入发布包“程序”，使用指南和中文启动入口放在根目录，技术说明放入“文档”。发布输出 releases/windows/v2.2.1-webui；包含 SHA-256 文件清单和 ZIP 校验。不收集 data/projects、运行缓存或个人图片。
