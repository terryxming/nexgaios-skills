# Apple HIG 前端视觉改造

`apple-hig-web-design` 是一个 Codex skill，用于把 Apple Human Interface Guidelines 转译成可执行的 Web UI/UX 诊断、改造方案和前端实现约束。

## 当前版本

```text
1.1.0
```

## 来源

本次迁移来源：

```text
仓库：https://github.com/terryxming/apple-hig-web-design
Tag：v1.1
Commit：4115b523cb0649b7a595d478abb4dfeffec5162f
```

在 monorepo 中的位置：

```text
skills/product-design/apple-hig-web-design
```

## 能力

- 基于 Apple HIG 进行前端视觉诊断。
- 先输出带版本号的改造方案，等待用户确认后再动代码。
- 支持桌面端优先、电脑端 only、移动端等不同视口范围。
- 覆盖视觉层级、布局、组件状态、颜色、字体、间距、材质、响应式和可访问性。
- 提供 Apple HIG 风格 token、组件片段、参考资料和静态检查脚本。

## 开发命令

验证技能：

```powershell
pnpm skill:validate apple-hig-web-design
```

安装到本地 Codex 运行目录：

```powershell
pnpm skill:install apple-hig-web-design
```

打包：

```powershell
pnpm skill:package apple-hig-web-design --print-path
```

## 使用边界

- 这个 skill 不是复制 Apple 品牌视觉，而是借鉴 HIG 的清晰度、层级、状态、材质和可访问性原则。
- 不要使用 Apple logo、产品截图、专有资产或暗示从属关系。
- 未获得用户对具体方案版本的确认前，不应修改目标项目文件。

