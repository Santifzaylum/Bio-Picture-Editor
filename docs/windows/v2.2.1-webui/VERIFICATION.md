# v2.2.1-webui 验证记录

日期：2026-10-13。验证对象为独立源码 source/editions/v2.2.1-webui，不覆盖 v2.2-webui。

- TypeScript 检查与 Vite 生产构建通过。
- 56 项模型、交互、存储、渲染及数据校验测试通过，包括 17 项新长度测量测试。
- 13 项新测量浏览器流程通过，覆盖独立起点连续点取、名称/分组、统一表、参考更新与撤销、关联标定、直线与投影、共同起点编辑/拆分、显示控制、范围 CSV/剪贴板、实际端点拖动、缩放/2× PNG、参考删除、保存/刷新/便携包、原图只读、旧连续对象转换与撤销。
- 17 项原有功能浏览器回归通过，涵盖局部放大、颜色、留白、只读、控制点、样式、锁定、复制、保存和实际导出。
- 7 项基础交互浏览器回归通过，涵盖平移、绘图、Ctrl 多选、拖动与中键。
- 已人工检查当前测量界面与完整表格截图；右侧宽度稳定，表格横向滚动，展开表保留完整列。

浏览器记录：validation/v2.2.1-webui/measurement/browser-results.json；原有功能记录：validation/v2.2.1-webui/browser-results.json；基础交互：源码 tests/v1.1-results.json。新截图为人工测试图，不含用户项目。

发布包逐文件 SHA-256 与 ZIP 校验由 scripts/package-webui.mjs 执行，记录在 validation/v2.2.1-webui/package-result.json。完整解压、首次初始化、根目录启动/停止、重新启动、示例和指南检查由 validation/v2.2.1-webui/package-smoke.mjs 执行，结果见 package-smoke-result.json。只有该结果 passed=true 时才表示包内启动验证完成。

首次 npm 初始化依赖联网和 Node.js 22.12+；编辑器核心操作在本机执行。发布包不包含用户项目。GitHub 发布状态与下载入口见仓库 Releases 页；本文记录本地验收范围。


标签入口修正专项验收：6 项浏览器检查覆盖新建默认与既有对象区分、显示开关及恢复、Esc 保留选择、列表进入编辑、单对象修改、撤销重做、保存刷新、便携包和实际 PNG。证据位于 validation/v2.2.1-webui/labels/browser-results.json。
