# 视觉系统

当需要改字体、颜色、布局间距、圆角、阴影、表面材质或暗色模式时读取本文件。

## 字体

- 使用系统字体栈：`-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif`。
- 先保证可读性，再追求戏剧性。
- 建立清楚的文字角色：display、page title、section heading、panel heading、body、caption、label、code。
- 不要用视口单位缩放正文或界面文字。
- 除非品牌系统明确要求 tracking，否则 `letter-spacing` 保持 `0`。
- 用字号和字重建立层级，避免同时使用过多字重。

建议 Web 字阶：

- Display：48-72px，仅用于真正 hero。
- Page title：32-44px。
- Section heading：22-28px。
- Panel heading：16-20px。
- Body：15-17px。
- Caption/label：12-14px。

## 颜色

- 用语义 token 构建，不要在组件里散落原始 hex。
- 中性背景要能区分 base、elevated 和 foreground 层。
- 饱和色留给主动作、选中、状态和数据强调。
- 如果应用已有暗色模式，要支持它；否则避免写死浅色。
- 状态不要只靠颜色表达，要搭配文字、图标、形状或位置。

## 间距与布局

- 使用偏 8px 的间距节奏，密集控件可用 4px 调整。
- 内容对齐到明确网格列。
- 页面区块要有呼吸感，但不要把每个区块都变成卡片。
- 棋盘、网格、工具栏、计数器、tile 等固定格式 UI 要有稳定尺寸、比例或 grid tracks。
- hover、动态标签或 loading 文案不能改变控件尺寸。

## 圆角

- 密集生产力 UI 用较小圆角，悬浮控制或 sheet 可用更大圆角。
- 建议基线：卡片 8px，输入框/按钮 10-14px，sheet 或玻璃面板 16-24px。
- 不要把所有元素都做成 pill。

## 层级与材质

- 优先使用边框和轻阴影，再考虑重模糊。
- 玻璃材质留给前景层、导航、悬浮工具栏和 sheet。
- 半透明表面必须搭配可读文本和 fallback。
- 内容表面要安静，不要玻璃卡片层层嵌套。

## 动效

- 动效应短而有目的：UI 状态 120-240ms，布局/sheet 240-420ms。
- 谨慎动画化 opacity、transform 和 blur；避免触发布局抖动。
- 提供 reduced-motion fallback。

## 暗色模式

- 提高 elevated surface 与 base background 的对比，不要把所有东西做成纯黑。
- 暗色模式少依赖阴影，多用边框、高光和色调层级。
- 重新检查玻璃效果，因为暗色透明可能吞掉内容。
