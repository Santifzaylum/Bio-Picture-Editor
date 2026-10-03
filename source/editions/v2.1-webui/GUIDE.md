# v2.1-webui 开发与数据说明

React、TypeScript、Vite 构建界面，Konva 提供画布交互。Node/Express 在 127.0.0.1 监听，校验 Host/Origin 和会话令牌。Sharp 保留原始文件并生成 EXIF 自动方向校正、8 位 sRGB 显示资源；Canvas 与随附 Noto 中文字体导出完整像素 PNG。

旧标注类型、像素坐标和 view 平移/缩放规则保持不变。圆形局部放大使用 type=magnifier，geometry 的 x/y 是展示圆左上角，width/height 是相同直径。detail 包含 sourceX、sourceY、sourceRadius 和 magnification，均对应方向校正后的原图像素；直径必须等于 2 × sourceRadius × magnification。取样圆完整位于原图内，倍率范围 1.25–8。

src/render.ts 的 drawDetail 在同一 Canvas 绘制路径中裁切原图、绘制轮廓与关联线，界面和服务端使用同一函数。放大图不叠加原图中的其他标注；隐藏对象不参与 PNG 导出。控制点、选框和网页 UI 不参与导出。尺寸限制仍是单边 16384 px、总计 6400 万像素。

ProjectSchema 接受 version=1 和 version=2。version=1 不能包含 magnifier；添加此对象时升级为 version=2。旧项目直接打开、保存不自动升级。浏览器草稿结构仍为 version=1 的工作区容器，每个项目有独立版本；新草稿库名为 bio-picture-editor-v2.1-webui，不覆盖旧库。

data/projects/ID/ 保存 project.json、original.png/.jpg、display.png、history/ 与 exports/。目录 JSON 中图片字节为空字符串，读取时从资源文件重建。.biozip 为包含 project.json、original.png/.jpg、display.png 的 ZIP。原图资源校验、原子保存、修订冲突和单服务锁沿用 v1.1。

本次实现与验证结果见 RELEASE-v2.1-webui.md、VERIFICATION.md。使用步骤见 USAGE.md；CLI 见 CODEX_GUIDE.md。同目录的 V1.1-REPORT.md 和 tests/v1.1-* 为旧版基线或回归记录，不作为新功能验收依据。

## v2.1 交互与样式

detail.styles 可选，含 source、connector、inset 三个完整线条样式（color、strokeWidth、dash、contrast）。缺失时退回 annotation.style，以兼容旧 v2.0 项目。首次编辑独立样式时同时固化三个部位的当前样式。局部放大的命中形状与可见形状分离：取样圆与放大圆使用完整圆盘命中，连接线仅使用两圆边界之间的可见线段。

includeDetail 对全部四侧补足包含描边的留白，不自动缩小；界面移动、参数变更、复制和 CLI patch 均复用此规则。左/上留白变化时补偿视口位置，避免取样原图跳动。查看原图时隐藏标注、清除选择并禁止编辑入口，保留缩放平移与项目读取。
