# Web 里的 Liquid Glass

用户明确要求 Liquid Glass，或你准备加入半透明 Apple-like 材质时读取本文件。把 Liquid Glass 当成深度和交互工具，不要当成装饰滤镜。

## 适合用于

- 覆在内容上的导航栏。
- 悬浮标签栏或工具栏。
- 导航语境里的搜索框。
- 上下文面板、inspector、popover、command surface 和 sheet。
- 少量需要“离用户更近”的前景控制。

## 避免用于

- 长文本阅读容器。
- 数据表格和密集仪表盘。
- 页面上每一张卡片。
- 没有交互目的的背景装饰。
- 噪声图片上方且缺少强遮罩或 fallback 的表面。

## CSS 构成

- `backdrop-filter: blur(...) saturate(...)`
- 透明或半透明背景色。
- 使用低透明度高光的细边框。
- 轻微内高光或顶部边缘。
- 柔和阴影用于分离层级。
- 不支持 `backdrop-filter` 时的实色 fallback。

## 实现规则

- 玻璃上的文本必须高对比。
- 除非交互层级非常明确，不要玻璃叠玻璃。
- 提供 `@supports not (backdrop-filter: blur(1px))` fallback。
- 可行时尊重 `prefers-reduced-transparency`；否则提供 class 或 token 路径让表面变不透明。
- 暗色模式下降低饱和度，增强边框清晰度。
- 用真实内容测试，不要只在空渐变上看效果。

## 实用 token 范围

- Blur：导航和面板 18-36px；密集 UI 更低。
- Alpha：浅色表面 0.58-0.82，暗色表面 0.48-0.72。
- Border：1px，按模式使用低透明白或黑。
- Shadow：柔和、宽散，不要戏剧化。

## Web 注意事项

Apple 平台材质行为不等于 CSS blur。Web 上应做尊重原理的近似实现，可用性优先于光学模仿。
