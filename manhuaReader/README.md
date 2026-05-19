# Vue 漫画阅读器 (manhuaReader)

基于 Vue 3 的 Tampermonkey 漫画阅读器，提供统一的阅读界面和数据接口。

**最新版本**: v2.1.1 (2026-05-19)  
**核心特性**: SPA 路由监听、智能站点适配、完善的日志系统、阅读器设置面板

## 📋 目录

- [功能特性](#功能特性)
- [快速开始](#快速开始)
- [使用方法](#使用方法)
- [数据结构](#数据结构)
- [全局 API](#全局-api)
- [主题系统](#主题系统)
- [键盘快捷键](#键盘快捷键)
- [网站适配器](#网站适配器)
- [开发指南](#开发指南)
- [更新日志](#更新日志)

## ✨ 功能特性

### 🎯 核心功能
- **统一阅读界面**：基于 Vue 3 构建的现代化漫画阅读器
- **三等分点击导航**：左侧上一页、中间显隐工具栏、右侧下一页
- **智能章节跳转**：边界跳转时显示确认对话框，防止误操作
- **悬浮式 UI 设计**：侧边栏和工具栏采用悬浮设计，最大化阅读空间
- **网站适配器模式**：支持通过适配器快速接入不同漫画网站
- **智能缓存系统**：自动缓存章节列表数据，减少网络请求，提升加载速度
- **智能滑块导航**：支持拖动滑块快速定位页码，实时显示当前页提示
- **动态 Tooltip 系统**：所有交互元素都有智能提示，悬停即显示
- **SPA 路由监听**：完美支持单页应用，自动检测路由变化并加载数据

### 🎨 用户体验
- **主题切换**：支持亮色/暗色主题，用户偏好持久化保存
- **平滑动画**：所有 UI 元素带有流畅的滑入滑出动画（0.2s）
- **防误触机制**：首次加载时锁定点击区域，避免误操作
- **Toast 提示**：轻量级消息提示，自动消失
- **确认对话框**：重要操作需要用户确认，支持取消
- **右下角功能区**：悬浮式页码显示和主题切换按钮，跟随UI显隐
- **边界视觉反馈**：到达章节边界时，前进/后退按钮图标旋转90度提示可跳转章节
- **纯 CSS Tooltip 系统**：使用 :hover 控制的 tooltip，性能优异无闪烁
- **阅读器设置面板**：支持自定义主题风格和预载数量设置

### ⌨️ 便捷操作
- **键盘快捷键**：左右箭头翻页、ESC 关闭 UI
- **自动隐藏**：首次进入显示 1 秒后自动隐藏 UI
- **一键切换**：工具栏按钮快速控制侧边栏和主题
- **SPA 无缝切换**：单页应用中章节切换无需刷新页面，自动加载新数据

### 🔧 v2.1.1 更新 (2026-05-19)
- 🎨 **新增阅读器设置面板**：点击工具栏设置按钮（⚙️）打开设置面板
  - 支持自定义主题风格（亮色/暗色）
  - 支持自定义预载数量（0-5张图片）
  - 设置自动保存，立即生效
- ✨ **优化预载策略**：用户可灵活控制图片预加载数量，平衡性能和流量
- 📝 **完善UI交互**：设置面板采用优雅的对话框设计，支持点击遮罩关闭

### 🔧 v2.1.0 新特性
- ✨ **SPA 路由监听**：支持非 Hash 模式的单页应用，自动检测 pathname 变化
- 📝 **增强日志系统**：完善的日志输出，便于调试和问题排查
- 🎯 **配置化轮询间隔**：每个 SPA 站点可自定义路由检测频率
- 🔄 **智能加载策略**：统一的 `loadData()` 函数，初始化和路由变化共用逻辑
- 🐛 **Bug修复**：优化全局 API 访问方式，确保响应式正常工作

## 🚀 快速开始

### 安装步骤

1. **安装 Tampermonkey**
   - Chrome: [Tampermonkey Chrome 扩展](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
   - Firefox: [Tampermonkey Firefox 扩展](https://addons.mozilla.org/firefox/addon/tampermonkey/)

2. **安装脚本**
   - 点击 [manhuaReader.user.js](manhuaReader.user.js) 直接安装
   - 或复制脚本内容到 Tampermonkey 编辑器

3. **访问支持的网站**
   - 目前支持：再漫画 (zaimanhua.com)
   - 脚本会自动检测并加载漫画数据

## 📖 使用方法

### 基本操作

#### 鼠标操作
- **点击左侧区域**：上一页
- **点击中间区域**：显示/隐藏工具栏（如果侧边栏显示也会同时隐藏）
- **点击右侧区域**：下一页
- **点击工具栏 ▶/◀ 按钮**：显示/隐藏侧边栏
- **点击工具栏 🌙/☀️ 按钮**：切换亮色/暗色主题
- **点击右上角 × 按钮**：关闭阅读器
- **拖动进度条滑块**：快速定位到指定页码，实时显示当前页提示
- **悬停前进/后退按钮**：显示智能提示（上一页/下一页/上一章/下一章/到头了）

#### 键盘快捷键
- `←` 或 `ArrowLeft`：上一页
- `→` 或 `ArrowRight`：下一页
- `Space`：下一页
- `Esc`：关闭侧边栏/工具栏/确认对话框

### 侧边栏功能
- 显示漫画标题和作者
- 显示当前章节信息
- 上一章/下一章快速跳转
- 完整章节列表，点击即可跳转

### 工具栏功能
- **左侧**：侧边栏控制按钮（▶/◀）
- **中间**：面包屑导航（漫画标题 / 当前章节）
- **右侧**：设置按钮（⚙️），点击打开阅读器设置面板
- **底部进度条**：
  - 显示当前页码和总页数
  - 支持拖动滑块快速跳转
  - 悬停时显示当前页提示框
  - 到达边界时图标旋转90度提示可跳转章节

### 阅读器设置面板
点击工具栏的设置按钮（⚙️）可以打开阅读器设置面板，包含以下设置：

#### 主题风格
- **亮色**：浅色背景，适合白天使用
- **暗色**：深色背景，适合夜间使用
- 用户选择会自动保存，下次打开时自动应用

#### 预载数量
- **范围**：0-5 张图片
- **功能**：设置当前页前后各预加载的图片数量
- **选项说明**：
  - 0：不进行预载，仅加载当前页
  - 1-5：预载对应数量的图片，提升翻页流畅度
- **提示文本**：根据选择的值动态显示预载策略
- 用户选择会自动保存，立即生效

### 主题切换方式

#### 方式一：通过设置面板
1. 点击工具栏的设置按钮（⚙️）
2. 在"主题风格"选项中选择"亮色"或"暗色"
3. 选择后立即生效并自动保存

#### 方式二：编程方式
```
// 在控制台执行
$vmr.$vm.setupState.toggleTheme()  // 切换主题
```

### 持久化存储
- 使用 `GM_setValue` 保存用户偏好
- 下次打开时自动应用上次选择的主题
- 默认主题为亮色（light）

### CSS 变量
主题通过 `.manga-reader-container` 元素的 `data-theme` 属性控制：

```
/* 亮色主题（默认） */
.manga-reader-container {
  --vmr-bg-primary: #f5f5f5;
  --vmr-text-primary: #333;
  /* ... 更多变量 */
}

/* 暗色主题 */
.manga-reader-container[data-theme="dark"] {
  --vmr-bg-primary: #1a1a1a;
  --vmr-text-primary: #e0e0e0;
  /* ... 更多变量 */
}
```

### 自定义主题

可以通过修改 CSS 变量来创建自定义主题：

```
// 在控制台执行
const container = document.querySelector('.manga-reader-container')
container.style.setProperty('--vmr-bg-primary', '#your-color')
```

## ⌨️ 键盘快捷键

### 快捷键列表

| 按键 | 功能 | 说明 |
|------|------|------|
| `←` / `ArrowLeft` | 上一页 | 第一页时显示确认对话框跳转到上一章 |
| `→` / `ArrowRight` | 下一页 | 最后一页时显示确认对话框跳转到下一章 |
| `↑` / `ArrowUp` | 上一章 | 直接跳转到上一章（需确认） |
| `↓` / `ArrowDown` | 下一章 | 直接跳转到下一章（需确认） |
| `Space` | 显示/隐藏 UI | 切换工具栏和侧边栏显示状态 |
| `Enter` | 确认/切换 UI | 对话框中确认操作，否则切换 UI |
| `Esc` | 关闭 UI | 优先级：确认对话框 > 设置面板 > 侧边栏 > 工具栏 |

### 事件拦截机制

阅读器采用**捕获阶段事件拦截**技术，确保键盘操作不会被原网站干扰：

**实现原理：**
``javascript
// 在 document 上使用捕获阶段注册
document.addEventListener('keydown', handleKeydown, true)

// 处理函数中智能放行和拦截
const isFunctionKey = event.key.startsWith('F') && event.key.length >= 2 && event.key.length <= 3
const hasModifier = event.shiftKey || event.ctrlKey || event.altKey || event.metaKey

if (isFunctionKey || hasModifier) return // 放行功能键和组合键

// 拦截阅读器专用快捷键
event.preventDefault()
event.stopPropagation()
event.stopImmediatePropagation()
```

**放行的按键：**
- ✅ **功能键 F1-F12**：如 F5 刷新、F12 开发者工具等
- ✅ **修饰键组合**：如 Ctrl+C（复制）、Ctrl+F（查找）、Alt+Tab（切换窗口）等
- ✅ **Meta 键组合**：如 Win+D（显示桌面）等

**拦截的按键：**
- 🔒 `ArrowLeft` / `ArrowRight` - 翻页操作
- 🔒 `ArrowUp` / `ArrowDown` - 章节跳转
- 🔒 `Escape` - 关闭 UI/设置面板/侧边栏/对话框
- 🔒 `Space` / `Enter` - UI 控制和确认操作

**优势：**
- ✅ **优先级最高**：捕获阶段从外到内传播（window → document → body），在 document 层面即可拦截
- ✅ **智能放行**：不影响浏览器快捷键和开发调试功能
- ✅ **完全隔离**：阻止原网站的其他键盘事件监听器
- ✅ **防止冲突**：避免 Space 键滚动页面、Enter 键触发表单等意外行为
- ✅ **简洁高效**：只需在 document 上注册一次，无需在 body 或 window 重复注册

**注意：** 键盘快捷键仅在阅读器可见时生效，关闭后原网站的键盘功能恢复正常。

## 🌐 网站适配器

### 适配器架构

阅读器采用适配器模式，可以轻松支持不同的漫画网站。

#### 适配器结构

```
const WEBSITE_ADAPTERS = [
  {
    name: '网站名称',
    host: 'domain.com',              // 域名关键字（必填）
    pathnameRegEx: /^\/path\//,      // 阅读页路径匹配正则（可选）
    spa: true,                       // 是否为单页应用（可选，默认false）
    loadDelay: 1000,                 // 数据加载延迟毫秒数（可选，默认0）
    pathnamePollingDelay: 500,       // SPA路由轮询间隔毫秒数（可选，默认500）
    extract: extractDataFunction     // 数据提取函数（必填）
  }
]
```

#### 配置字段说明

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `name` | string | ✅ | - | 网站中文名称，用于日志输出 |
| `host` | string | ✅ | - | 域名关键字，使用 `includes` 匹配 |
| `pathnameRegEx` | RegExp | ❌ | - | 阅读页路径正则，不设置则域名匹配即可 |
| `spa` | boolean | ❌ | false | 是否为单页应用，启用路由监听 |
| `loadDelay` | number | ❌ | 0 | 检测到阅读页后的数据加载延迟（毫秒） |
| `pathnamePollingDelay` | number | ❌ | 500 | SPA 路由变化检测间隔（毫秒） |
| `extract` | function | ✅ | - | 数据提取函数，返回标准数据结构或 null |

#### 数据提取函数

```
function extractDataFromSite() {
  try {
    // 1. 从页面提取原始数据
    const rawData = extractFromPage()
    
    // 2. 转换为标准数据结构
    const data = {
      manga: { ... },
      chapter: { ... }
    }
    
    return data
  } catch (error) {
    console.error('数据提取失败:', error)
    return null
  }
}
```

### SPA 支持详解

#### 什么是 SPA？

单页应用（Single Page Application）在章节切换时不会刷新整个页面，而是通过 JavaScript 动态更新内容。传统的 Tampermonkey 脚本只在页面加载时执行一次，无法感知后续的路由变化。

#### 工作原理

```
// 1. 启动路由监听器（仅在标记为 spa: true 的站点）
if (website.spa) {
  startPathnameTimer(() => {
    const isReadPage = loadData()
    if (!isReadPage) setReaderVisible(false)
  }, website.pathnamePollingDelay)
}

// 2. 定时检测 pathname 变化
function startPathnameTimer(fn, delay) {
  pathnameTimer = setInterval(() => {
    const currentPathname = window.location.pathname
    if (currentPathname !== lastPathname) {
      // 检测到路由变化，执行回调
      fn()
      lastPathname = currentPathname
    }
  }, delay)
}

// 3. 统一的加载逻辑
function loadData() {
  const isReadPage = checkReadPage(website)
  if (isReadPage) {
    setTimeout(() => {
      loadMangaData(website, true)
    }, website.loadDelay || 0)
  }
  setEntryVisible(isReadPage)
  return isReadPage
}
```

#### SPA 场景示例

**再漫画 (zaimanhua.com)** 是一个典型的 SPA 站点：

```
{
  name: '再漫画',
  spa: true,                        // 标记为 SPA
  host: 'zaimanhua.com',
  pathnameRegEx: /^\/view\//,       // 阅读页路径
  pathnamePollingDelay: 500,        // 每 500ms 检测一次路由
  loadDelay: 1000,                  // 检测到阅读页后延迟 1s 加载数据
  extract: extractFromZaimanhua
}
```

**工作流程：**
1. 用户访问 `/view/123` → 脚本初始化，检测到阅读页，加载数据
2. 用户点击下一章 → URL 变为 `/view/456`（页面无刷新）
3. 路由监听器检测到 pathname 变化
4. 自动调用 `loadData()` 重新提取数据
5. 阅读器自动更新为新章节内容

#### 非 SPA 站点

对于传统多页应用，不需要启用路由监听：

```
{
  name: '漫画柜',
  host: 'manhuagui.com',
  pathnameRegEx: /^\/comic\/\d+\/\d+.html/,
  // 没有 spa: true，不会启动路由监听
  extract: extractFromManhuagui
}
```

### 添加新网站适配器

#### 步骤 1：创建提取函数

```
function extractDataFromNewSite() {
  try {
    const win = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window
    
    // 从页面提取数据
    const comicInfo = win.someGlobalData.comic
    const chapterInfo = win.someGlobalData.chapter
    
    // 构建标准数据
    const manga = {
      title: comicInfo.title,
      author: comicInfo.author,
      cover: comicInfo.cover,
      description: comicInfo.description
    }
    
    const current = {
      id: chapterInfo.id,
      name: chapterInfo.name,
      url: win.location.href,
      images: chapterInfo.images
    }
    
    // 构建章节列表
    const list = comicInfo.chapters.map(ch => ({
      id: ch.id,
      name: ch.name,
      url: ch.url,
      updateTime: formatDate(ch.updateTime)
    }))
    
    // 找到上一章和下一章
    const currentIndex = list.findIndex(ch => ch.id === current.id)
    const previous = currentIndex > 0 ? list[currentIndex - 1] : null
    const next = currentIndex < list.length - 1 ? list[currentIndex + 1] : null
    
    return {
      manga,
      chapter: { current, previous, next, list }
    }
  } catch (error) {
    console.error('[新网站适配器] 提取数据失败:', error)
    return null
  }
}
```

#### 步骤 2：注册适配器

```
const WEBSITE_ADAPTERS = [
  // ... 现有适配器
  {
    name: '新网站名称',
    host: 'newsite.com',
    pathnameRegEx: /^\/manga\//,  // 可选
    spa: false,                    // 是否为 SPA
    loadDelay: 0,                  // 加载延迟
    pathnamePollingDelay: 500,     // SPA 轮询间隔（仅 spa=true 时生效）
    extract: extractDataFromNewSite
  }
]
```

#### 步骤 3：添加 @match 规则

在脚本头部添加新的匹配规则：

```
// ==UserScript==
// ... 其他配置
// @match        https://newsite.com/manga/*
// ==/UserScript==
```

### 现有适配器

#### 再漫画 (zaimanhua.com)
- **域名**：manhua.zaimanhua.com
- **路径**：/view/*
- **SPA**：✅ 是
- **数据来源**：`window.__NUXT__.data`
- **特点**：
  - 使用 Nuxt.js SSR，数据在服务端渲染
  - 启用路由监听，每 500ms 检测一次 pathname 变化
  - 检测到阅读页后延迟 1s 加载数据（等待 Nuxt  hydration）
  - 章节切换无需刷新页面，自动加载新数据

#### 漫画柜 (manhuagui.com)
- **域名**：www.manhuagui.com
- **路径**：/comic/{漫画ID}/{章节ID}.html
- **SPA**：❌ 否
- **数据来源**：页面脚本中的 `info` 对象和 `pVars` 变量
- **特点**：
  - 从加密脚本中提取章节信息（使用 eval 解密）
  - 自动获取作者信息（从详情页 DOM 解析）
  - 支持通过 prevId/nextId 直接导航上下章
  - 异步加载完整章节列表（从详情页 HTML 解析）
  - **智能缓存机制**：首次访问时缓存章节列表，1小时内再次访问直接使用缓存，避免重复请求
  - 图片 URL 带有时效性认证参数（e 和 m）
- **缓存策略**：
  - 缓存内容：作者信息和完整章节列表
  - 缓存时长：1小时（3600秒）
  - 缓存键：`manhuagui-{漫画ID}`
  - 自动清理：脚本启动时自动清理过期缓存
  - 容错处理：仅在成功提取完整章节列表时才保存缓存
- **数据结构**：
  ```javascript
  // info 对象包含：
  {
    bid: 漫画ID,
    bname: 漫画名称,
    bpic: 封面图片,
    cid: 当前章节ID,
    cname: 当前章节名称,
    files: [图片文件名数组],
    path: 图片路径,
    prevId: 上一章ID (0表示没有),
    nextId: 下一章ID (0表示没有),
    sl: { e: 时间戳, m: 签名 }
  }
  
  // pVars 对象包含：
  {
    manga: {
      filePath: 图片基础URL
    }
  }
  ```

## 💻 开发指南

### 项目结构

```
manhuaReader/
├── manhuaReader.user.js      # 主脚本文件
├── README.md                  # 本文档
├── QUICKSTART.md              # 快速开始指南
├── ADAPTER_GUIDE.md           # 适配器开发指南
└── CHANGELOG.md               # 更新日志
```

### 代码架构

#### 主要模块

1. **常量配置模块** (`CONFIG`)
   - 集中管理所有配置项
   - 包括缓存前缀、主题键、默认值等

2. **工具类模块**
   - `CacheManager`：缓存管理器，支持 TTL 和自动清理
   - `formatTimestamp`：时间戳格式化工具

3. **网站适配器模块**
   - `extractFromZaimanhua()`：再漫画数据提取
   - `extractFromManhuagui()`：漫画柜数据提取
   - `WEBSITE_ADAPTERS`：网站配置列表
   - `getWebsite()`：检测当前网站
   - `checkReadPage()`：检查是否为阅读页
   - `loadMangaData()`：加载漫画数据

4. **SPA 路由监听模块**
   - `startPathnameTimer()`：启动路由监听
   - `stopPathnameTimer()`：停止路由监听
   - 定时检测 pathname 变化
   - 自动触发数据重新加载

5. **UI 模块**
   - `injectStyles()`：注入 CSS 样式
   - `createAppContainer()`：创建应用容器
   - `initVueApp()`：初始化 Vue 应用

6. **Vue 应用**
   - 响应式数据管理
   - 模板渲染
   - 事件处理

7. **全局 API**
   - `setMangaData()`：设置漫画数据
   - `setEntryVisible()`：控制入口按钮显示
   - `setReaderVisible()`：控制阅读器显示
   - `exposeGlobalAPI()`：暴露全局接口

### 开发流程

#### 1. 克隆项目
```
git clone <repository-url>
cd manhuaReader
```

#### 2. 修改代码
编辑 `manhuaReader.user.js` 文件

#### 3. 测试
- 在 Tampermonkey 中创建新脚本
- 复制修改后的代码
- 刷新目标网页测试

#### 4. 调试技巧

**浏览器控制台：**
```
// 查看 Vue 实例
console.log(window.$vm)

// 查看当前数据
console.log($vmr.$vm.setupState.manga)
console.log($vmr.$vm.setupState.chapter)

// 手动设置数据
$vmr.setMangaData(yourData)

// 控制入口按钮
$vmr.setEntryVisible(true)

// 控制阅读器显示
$vmr.setReaderVisible(true)

// 切换主题
$vmr.$vm.setupState.toggleTheme()

// 查看当前主题
console.log($vmr.$vm.setupState.theme.value)

// 查看预载数量设置
console.log($vmr.$vm.setupState.preloadCount.value)
```

**Tampermonkey 日志：**
- 打开浏览器开发者工具
- 查看 Console 标签
- 搜索 `[漫画阅读器]` 相关日志

**日志示例：**
```
[漫画阅读器] 查找站点配置: manhua.zaimanhua.com
[漫画阅读器] 当前站点配置: {name: "再漫画", spa: true, ...}
[漫画阅读器] 阅读器初始化...
[漫画阅读器] 阅读页匹配: /view/123 ✓
[漫画阅读器] 检测到再漫画，开始提取数据...
[漫画阅读器>再漫画适配器] 数据提取成功: {manga: "xxx", currentChapter: "xxx"}
[漫画阅读器] 数据加载成功
```

### 最佳实践

#### 1. 数据提取
- 始终使用 `try-catch` 包裹提取逻辑
- 返回 `null` 表示提取失败
- 记录详细的错误日志

#### 2. URL 处理
- 优先使用相对路径
- 让浏览器自动解析完整 URL
- 避免硬编码域名

#### 3. 样式隔离
- 所有 CSS 类名使用 `vmr-` 前缀
- 使用 CSS 变量实现主题
- 避免影响原页面样式

#### 4. 性能优化
- 使用 `v-if` 而非 `v-show` 控制显隐
- 合理使用计算属性（computed）
- 避免不必要的重渲染

#### 5. SPA 适配
- 如果网站是单页应用，务必设置 `spa: true`
- 根据网站性能调整 `pathnamePollingDelay`
- 如果需要等待数据加载，设置合适的 `loadDelay`
- 测试章节切换是否能正确触发数据重新加载

## 📝 更新日志

### v2.1.1 (2026-05-19)
- ✨ 新增阅读器设置面板，支持自定义主题风格和预载数量
- ✨ 实现设置对话框 UI，采用优雅的毛玻璃效果设计
- ✨ 添加预载数量配置（0-5张），用户可灵活控制性能与流量平衡
- ✨ 设置项自动保存到 GM_storage，下次打开自动应用
- 🎨 优化设置面板交互体验，支持点击遮罩关闭
- 🎨 单选按钮样式优化，选中状态带有边框高亮和阴影效果
- 📝 动态提示文本，根据预载数量显示不同的说明信息
- 🔧 改进全局 API 访问方式，统一使用 `$vmr.$vm.setupState`
- 📝 更新脚本版本号为 2.1.1

### v2.1.0 (2026-05-18)
- ✨ **SPA 路由监听**：完美支持单页应用（SPA），自动检测 pathname 变化并重新加载数据
  - 使用 `setInterval` 定时检测路由变化
  - 仅在标记为 `spa: true` 的站点启用
  - 可配置的轮询间隔（`pathnamePollingDelay`）
  - 离开阅读页时自动隐藏阅读器
- 📝 **增强日志系统**：完善的日志输出，便于调试和问题排查
  - 网站检测日志：显示查找过程和匹配结果
  - 页面类型检查日志：显示路径匹配状态
  - 数据加载日志：显示提取进度和结果
  - 路由变化日志：显示 pathname 变化详情
- 🎯 **配置化适配器**：每个站点可独立配置行为参数
  - `spa`: 是否启用路由监听
  - `loadDelay`: 数据加载延迟时间
  - `pathnamePollingDelay`: SPA 路由检测间隔
- 🔄 **统一加载策略**：`loadData()` 函数统一管理初始化和路由变化的数据加载
  - 自动检测页面类型
  - 根据配置延迟加载数据
  - 控制入口按钮显示状态
- 🔧 **技术改进**：
  - 数据加载器重构：职责分离，配置驱动
  - SPA 路由监听模块：智能防抖，定时器清理
  - 全局 API 优化：修复 Vue 3 CDN 版本实例访问
  - 错误处理增强：明确的错误信息和详细日志
- 🎨 **UI/UX 优化**：
  - SPA 无缝体验：章节切换无需刷新页面
  - 智能显示控制：自动显示/隐藏阅读器
  - 日志可视化：清晰的日志前缀和结构化输出
- 🐛 **Bug 修复**：
  - 修复 Vue 3 CDN 版本实例访问问题
  - 修复 SPA 场景下路由变化无法感知的问题
  - 修复非阅读页时仍然尝试加载数据的问题
  - 修复日志输出不完整的问题
- 📚 **文档更新**：
  - 添加 SPA 支持详解
  - 更新适配器配置字段说明
  - 添加路由监听工作原理
  - 更新现有适配器说明

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

### 提交 Bug
1. 描述问题现象
2. 提供复现步骤
3. 附上浏览器控制台错误信息
4. 说明使用的浏览器和 Tampermonkey 版本

### 功能建议
1. 清晰描述功能需求
2. 说明使用场景
3. 提供可能的实现方案

### 代码贡献
1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

## 👥 作者

- huomangrandian - 原始作者
- Lingma - 重构和优化

## 🏗️ 技术架构 (v2.1.1)

### 代码结构
```
manhuaReader.user.js
├── 常量配置 (CONFIG)
│   ├── APP_NAME, CACHE_PREFIX
│   ├── THEME_KEY, DEFAULT_THEME
│   └── AUTO_HIDE_DELAY, PRELOAD_OFFSET, TOAST_DURATION
├── 工具类
│   ├── CacheManager - 缓存管理器
│   └── formatTimestamp - 时间戳格式化
├── CSS样式 (STYLES)
│   ├── 亮色主题变量
│   ├── 暗色主题变量
│   └── 组件样式（含设置面板样式）
├── 数据提取器
│   ├── extractFromZaimanhua() - 再漫画适配器
│   └── extractFromManhuagui() - 漫画柜适配器
├── 网站适配器配置 (WEBSITE_ADAPTERS)
├── 数据加载器
│   ├── getWebsite() - 检测当前网站
│   ├── checkReadPage() - 检查是否为阅读页
│   └── loadMangaData() - 加载漫画数据
├── SPA 路由监听
│   ├── startPathnameTimer() - 启动路由监听
│   └── stopPathnameTimer() - 停止路由监听
├── Vue应用 (createVueApp)
│   ├── 响应式状态 (ref/reactive)
│   │   ├── manga, chapter, currentPageIndex
│   │   ├── theme, preloadCount (新增)
│   │   ├── isSettingsVisible (新增)
│   │   └── UI状态管理
│   ├── 计算属性 (computed)
│   ├── 方法 (methods)
│   │   ├── toggleSettings, closeSettings (新增)
│   │   ├── handleThemeChange, handlePreloadCountChange (新增)
│   │   └── 其他业务方法
│   └── 监听器 (watch)
├── 设置面板 (新增)
│   ├── 主题风格选择
│   ├── 预载数量配置
│   └── 动态提示文本
└── 全局API
    ├── setMangaData() - 设置漫画数据
    ├── setEntryVisible() - 控制入口按钮
    ├── setReaderVisible() - 控制阅读器显示
    └── exposeGlobalAPI() - 暴露到window.$vmr
```

### 响应式设计
- **简单值**: 使用 `ref()` - manga, currentPageIndex, theme, preloadCount等
- **复杂对象**: 使用 `reactive()` - chapter, toast, confirmDialog
- **计算属性**: 使用 `computed()` - totalPages, currentImage等
- **副作用**: 使用 `watch()` - 同步滑块、更新CSS变量

### 性能优化
- ✅ 图片预加载（可配置前后各0-5张）
- ✅ 章节列表缓存（1小时TTL）
- ✅ 纯CSS Tooltip（无JS开销）
- ✅ 事件捕获阶段拦截（优先级最高）
- ✅ SPA 路由监听（按需启用，可配置间隔）
- ✅ 智能加载策略（统一的 loadData 函数）
- ✅ 设置持久化（GM_setValue/GM_getValue）

---

**⭐ 如果这个项目对你有帮助，请给个 Star！**