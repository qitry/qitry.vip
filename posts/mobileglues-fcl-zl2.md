---
title: 关于 FoldCraftLauncher 和 ZalithLauncher2 使用 MobileGlues 渲染器
date: 2026-04-05
column: 技术随笔
---

> [!IMPORTANT]
MobileGlues（常简称为 MG 渲染器）是目前 Android 平台上性能表现最优、设备兼容性最佳的 OpenGL 转 OpenGL ES 兼容层方案。需要特别注意的是，该渲染器仅支持 Minecraft 1.17 及以上版本，低版本游戏无法正常运行。

## 准备工作：下载并安装 MobileGlues

首先，使用浏览器（推荐使用 Chrome 或 Edge 以获得最佳兼容性）访问下载镜像站：[https://mirror.lemwood.icu](https://mirror.lemwood.icu)

进入页面后，向下滚动浏览资源列表，找到 MobileGlues 项目条目，点击"下载最新版"按钮获取安装包。下载完成后，在系统提示时完成安装授权。具体操作流程可参考下图指引：

![MobileGlues 下载页面示意](https://fastly.jsdelivr.net/gh/MornZe/Blog-Static-Resource@main/images/e3ec6c3b38127fb6.jpg)

---

## ZalithLauncher 2 配置教程

> ZalithLauncher 2 在玩家社区中也被称为 Zalith Launcher 或简称 ZL2，下文统一使用 ZL2 指代。

完成 MobileGlues 的安装后，务必完全退出 ZL2 后台进程（即所谓"大退"，确保应用不在多任务列表中留存），然后重新启动应用。

进入主界面后，点击页面右上角的设置图标（齿轮形状）进入系统设置。在设置菜单中找到"全局渲染器"选项，点击展开下拉列表，继续向下滚动浏览可用渲染器，直至找到 MobileGlues 并点击选中。配置完成后的界面状态如下图所示：

![ZL2 渲染器设置界面](https://fastly.jsdelivr.net/gh/MornZe/Blog-Static-Resource@main/images/d295ee43784912b8.jpg)

至此，ZL2 的渲染器配置已全部完成。

---

## FoldCraftLauncher 配置教程

> FoldCraftLauncher 在玩家社区中常简称为 FCL，下文统一使用该简称。

同样地，在安装好 MobileGlues 后，请先彻底关闭 FCL 后台进程，再重新打开应用以确保渲染器列表正确刷新。

启动应用后，点击界面左下角的齿轮图标进入"全局游戏设置"页面。在设置列表中向下滚动，定位到"渲染器"配置项，点击该项右侧的齿轮按钮进入详细选择界面：

![FCL 设置入口位置](https://fastly.jsdelivr.net/gh/MornZe/Blog-Static-Resource@main/images/94df78d76b436a51.jpg)

此时会弹出渲染器选择菜单，在列表中向下滚动查找 MobileGlues 选项，点击即可完成切换。系统会自动保存设置，无需额外确认操作。

![cf06c5fe5ef92300.jpg](https://fastly.jsdelivr.net/gh/MornZe/Blog-Static-Resource@main/images/cf06c5fe5ef92300.jpg)
