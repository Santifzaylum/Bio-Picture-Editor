# 项目发展历史

当前并行提供 [v2.2.1-webui Windows 浏览器版](https://github.com/Santifzaylum/Bio-Picture-Editor/releases/tag/v2.2.1-webui)、[v2.1-p Windows EXE](https://github.com/Santifzaylum/Bio-Picture-Editor/releases/tag/v2.1-p) 和 [v2.1-macweb macOS 浏览器预发布](https://github.com/Santifzaylum/Bio-Picture-Editor/releases/tag/v2.1-macweb)。最新正式 Release 为 v2.2.1-webui，新增长度/比例测量；EXE 和 Mac 原版本继续提供。源码按版本独立保存。

| 时间 | 阶段 | 主要变化与历史入口 |
| --- | --- | --- |
| 2026-10-13 | v2.2.1-webui | 通用独立长度、比例参考复用、分组、尺度标定、全精度数据导出、标签显隐修正及发布包/指南整理；采用 v4 新测量格式 |
| 2026-09-30 | v1.0 | 本地图片标注、文字和图形、多图片标签页、项目保存、便携包、PNG 导出和本地 CLI |
| 2026-09-30 | v1.1 WebUI | 优化选择工具的自动抓手平移、Ctrl 多选和键鼠操作；界面原称“图注工坊”。[原始仓库快照](https://github.com/Santifzaylum/Bio-Picture-Editor/tree/c6182e6c0a5d5828c5f87a62c5aafef28225804a)内保留原始 ZIP 与操作指南；不再新增独立 v1.1-webui Release |
| 2026-10-02 | v1.1-p | 封装 Windows EXE，首次自动准备依赖，使用“生物图片编辑器”名称。[历史 Release](https://github.com/Santifzaylum/Bio-Picture-Editor/releases/tag/v1.1-p)继续保留 |
| 2026-10-02 | v1.1-macweb | 移植 Apple Silicon Mac WebUI，适配 Command 快捷键与启动脚本。[历史 Pre-release](https://github.com/Santifzaylum/Bio-Picture-Editor/releases/tag/v1.1-macweb)未进行运行或 Mac 实机测试 |
| 2026-10-02 | v2.0-webui | 保留 WebUI，更新名称、主题 SVG 与工具图标，修复颜色控件整行重复触发，新增圆形局部放大；作为 v2.1 的前一阶段保留在本地开发历史 |
| 2026-10-03 | v2.1-webui | 改善工具图标、只读原图查看、局部放大移动与四周留白，增加三个部位的独立线条样式；发布完整 WebUI 源码、轻量 ZIP 与 SHA-256 |

| 2026-10-03 | v2.1-p | 封装 v2.1-webui 为 Windows EXE，自动初始化依赖，保留同名图标和编辑功能；与 WebUI 并行发布 ZIP、SHA-256 和独立源码 |

旧版数据不自动迁移到新版草稿库。需要继续编辑时，先在旧版逐张保存并导出 .biozip，再在 v2.1 导入。新版独立样式需要 v2.1 或更新版本读取。

历史桌面版的操作与协作说明见 [旧版操作指南](docs/history/v1.1-p/USAGE.md)和[旧版 Codex 指南](docs/history/v1.1-p/CODEX_GUIDE.md)。Mac 开发版仍保留 [操作指南](MACWEB-USAGE.md)与[验证清单](MACWEB-TESTING.md)，其中未测试状态保持。


新版 v4 项目需要 v2.2.1 或更新版本，旧 EXE/Mac 不直接读取含新测量的项目；迁移请保留旧 .biozip。
