# 组件 Recipes

这些片段只作为实现参考。使用前要适配目标项目的类名、token 和组件结构。

## 悬浮工具栏

```css
.toolbar {
  position: sticky;
  top: 12px;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border: 1px solid var(--hig-border);
  border-radius: 18px;
  background: var(--hig-surface);
  backdrop-filter: blur(28px) saturate(1.35);
  -webkit-backdrop-filter: blur(28px) saturate(1.35);
  box-shadow: var(--hig-shadow-md);
}
```

## 搜索框

```css
.search-field {
  min-height: 40px;
  display: grid;
  grid-template-columns: 20px 1fr auto;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  border: 1px solid var(--hig-border);
  border-radius: 999px;
  background: var(--hig-surface-elevated);
  color: var(--hig-text);
}

.search-field:focus-within {
  border-color: transparent;
  box-shadow: 0 0 0 3px var(--hig-focus);
}
```

## 侧边栏项目

```css
.sidebar-item {
  min-height: 36px;
  display: grid;
  grid-template-columns: 20px 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 0 10px;
  border-radius: 10px;
  color: var(--hig-text-secondary);
}

.sidebar-item[aria-current="page"],
.sidebar-item[data-active="true"] {
  background: color-mix(in srgb, var(--hig-accent) 14%, transparent);
  color: var(--hig-text);
}
```

## 分段控制

```css
.segmented {
  display: inline-grid;
  grid-auto-flow: column;
  gap: 2px;
  padding: 3px;
  border: 1px solid var(--hig-border);
  border-radius: 12px;
  background: color-mix(in srgb, var(--hig-text) 6%, transparent);
}

.segmented button {
  min-height: 30px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: var(--hig-text-secondary);
  padding: 0 12px;
}

.segmented button[aria-pressed="true"] {
  background: var(--hig-surface-solid);
  color: var(--hig-text);
  box-shadow: var(--hig-shadow-sm);
}
```

## 响应式 App Shell

```css
.app-shell {
  min-height: 100svh;
  display: grid;
  grid-template-columns: minmax(220px, 280px) minmax(0, 1fr);
  background: var(--hig-bg);
}

.app-main {
  min-width: 0;
  padding: clamp(16px, 3vw, 40px);
}

@media (max-width: 760px) {
  .app-shell {
    grid-template-columns: 1fr;
  }

  .app-sidebar {
    position: sticky;
    top: 0;
    z-index: 30;
  }
}
```
