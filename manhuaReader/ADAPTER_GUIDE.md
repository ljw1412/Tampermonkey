# 网站适配器开发指南

本文档详细说明如何为 manhuaReader 添加新的漫画网站支持。

**最新版本**: v2.1.1 (2026-05-19)  
**新增特性**: SPA 路由监听、配置化轮询间隔、增强日志系统、阅读器设置面板

## 📋 目录

- [适配器架构](#适配器架构)
- [数据结构规范](#数据结构规范)
- [开发步骤](#开发步骤)
- [SPA 支持详解](#spa-支持详解)
- [示例代码](#示例代码)
- [调试技巧](#调试技巧)
- [常见问题](#常见问题)

## 🏗️ 适配器架构

### 整体架构

```
┌─────────────────────────────────────┐
│       manhuaReader.user.js          │
├─────────────────────────────────────┤
│  Vue Application (UI Layer)         │
├─────────────────────────────────────┤
│  Cache Manager (缓存管理层)          │
│  - 自动缓存章节列表                  │
│  - TTL过期控制                       │
│  - 自动清理过期数据                  │
├─────────────────────────────────────┤
│  Data Adapter Layer                 │
│  ┌──────────┐ ┌──────────┐         │
│  │ Zaiman   │ │ NewSite  │         │
│  │ Adapter  │ │ Adapter  │         │
│  └──────────┘ └──────────┘         │
├─────────────────────────────────────┤
│  SPA Route Monitor (路由监听层)      │
│  - pathname 变化检测                │
│  - 自动重新加载数据                  │
│  - 可配置轮询间隔                    │
├─────────────────────────────────────┤
│  Website Detection & Loading        │
└─────────────────────────────────────┘
```

### 核心组件

1. **缓存管理器** (`CacheManager`)
   - 统一管理缓存数据
   - 支持带过期时间的存储
   - 自动清理过期缓存
   - 命名空间隔离，避免键冲突

2. **网站配置列表** (`WEBSITE_ADAPTERS`)
   - 定义支持的网站
   - 包含域名、路径、SPA 标记和提取函数
   - 支持配置化的轮询间隔和加载延迟

3. **数据提取函数** (`extract` function)
   - 从页面提取原始数据
   - 转换为标准数据结构
   - 可选择使用缓存优化性能
   - 返回统一格式的数据对象

4. **数据加载器**
   - `getWebsite()`: 检测当前网站
   - `checkReadPage()`: 检查是否为阅读页
   - `loadMangaData()`: 加载漫画数据
   - `loadData()`: 统一的加载入口（初始化 + 路由变化）

5. **SPA 路由监听器**
   - `startPathnameTimer()`: 启动路由监听
   - `stopPathnameTimer()`: 停止路由监听
   - 定时检测 pathname 变化
   - 自动触发数据重新加载

6. **阅读器设置管理** (v2.1.1+)
   - 主题风格设置（亮色/暗色）
   - 预载数量配置（0-5张）
   - 自动持久化保存（GM_setValue/GM_getValue）
   - 设置面板 UI 交互

## 📊 数据结构规范

### 标准数据格式

所有适配器必须返回以下结构的数据：

```
{
  manga: {
    id: string|number,       // 漫画id（可选）
    title: string,           // 漫画标题（必填）
    author: string,          // 作者名称（可选）
    cover: string,           // 封面图片URL（可选）
    description: string,     // 漫画简介（可选）
    status: string,          // 连载状态（可选，如"连载中"、"已完结"）
    tags: string[],          // 标签数组（可选）
    url: string              // 漫画详情页URL（可选）
  },
  chapter: {
    current: {               // 当前章节（必填）
      id: string|number,     // 章节ID（必填）
      name: string,          // 章节名称（必填）
      url: string,           // 章节URL（必填）
      images: string[],      // 图片URL数组（必填）
      pageCount: number      // 当前章节总页数（可选）
    },
    previous: {              // 上一章（可选，无则为null）
      id: string|number,
      name: string,
      url: string
    } | null,
    next: {                  // 下一章（可选，无则为null）
      id: string|number,
      name: string,
      url: string
    } | null,
    list: [{                 // 章节列表（必填）
      id: string|number,     // 章节ID（必填）
      name: string,          // 章节名称（必填）
      url: string,           // 章节URL（必填）
      updatedAt: string,     // 更新时间 YYYY-MM-DD（可选）
      pageCount: number      // 章节页数（可选）
    }],
    groups: [{               // 章节分组列表（必填）
      title: string,         // 分组标题（必填，如"正篇"、"番外"）
      data: [{               // 该分组的章节列表（必填）
        id: string|number,   // 章节ID（必填）
        name: string,        // 章节名称（必填）
        url: string,         // 章节URL（必填）
        updatedAt: string,   // 更新时间（可选）
        pageCount: number    // 章节页数（可选）
      }]
    }]
  }
}
```

### 字段验证规则

#### 必填字段

- `manga.title`：不能为空字符串
- `chapter.current.id`：必须是唯一标识
- `chapter.current.name`：不能为空字符串
- `chapter.current.url`：必须是有效的 URL
- `chapter.current.images`：必须是数组，至少包含一个元素
- `chapter.list`：必须是数组，至少包含一个元素
- **`chapter.groups`：必须是数组，至少包含一个分组**（用于UI展示章节列表）
- `chapter.groups[].title`：分组标题，不能为空
- `chapter.groups[].data`：该分组的章节列表，必须是数组

#### 可选字段

- `manga.id`：漫画ID
- `manga.author`：作者名称
- `manga.cover`：封面图片URL
- `manga.description`：漫画简介
- `manga.status`：连载状态（如"连载中"、"已完结"）
- `manga.tags`：标签数组
- `manga.url`：漫画详情页URL
- `chapter.current.pageCount`：当前章节总页数
- `chapter.previous` / `chapter.next`：上一章/下一章信息（为 null 表示没有）
- `chapter.list[].updatedAt`：章节更新时间（格式：YYYY-MM-DD）
- `chapter.list[].pageCount`：章节页数
- `chapter.groups[].data[].updatedAt`：章节更新时间
- `chapter.groups[].data[].pageCount`：章节页数

#### 重要说明

**`chapter.groups` 是必填字段**，原因：
1. Vue 模板中使用 `v-for="group in chapter.groups"` 遍历显示章节列表
2. 如果缺少该字段，侧边栏的章节列表将无法显示
3. 即使只有一个分组，也必须提供该字段

**示例：单分组情况**
```javascript
groups: [
  {
    title: '章节',
    data: [
      { id: '1', name: '第1话', url: '/chapter/1' },
      { id: '2', name: '第2话', url: '/chapter/2' }
    ]
  }
]
```

**示例：多分组情况**
```javascript
groups: [
  {
    title: '正篇',
    data: [
      { id: '1', name: '第1话', url: '/chapter/1' },
      { id: '2', name: '第2话', url: '/chapter/2' }
    ]
  },
  {
    title: '番外',
    data: [
      { id: 'sp1', name: '特别篇1', url: '/chapter/sp1' }
    ]
  }
]
```

### URL 格式建议

**推荐使用相对路径：**

```
// ✅ 推荐：相对路径
url: `./${chapter_id}`

// ❌ 不推荐：硬编码绝对路径
url: `https://example.com/chapter/${chapter_id}`
```

**优势：**

- 代码更简洁
- 不依赖硬编码域名
- 浏览器自动解析
- 更易维护

## 🛠️ 开发步骤

### 步骤 1：分析目标网站

#### 1.1 访问目标网站

打开要适配的漫画网站，选择一个章节页面。

#### 1.2 查找数据来源

在浏览器控制台执行：

```javascript
// 查看全局变量
console.log(window)

// 常见的数据存储位置
console.log(window.__NUXT__) // Nuxt.js
console.log(window.__INITIAL_STATE__) // Vuex
console.log(window.COMIC_DATA) // 自定义
console.log(window.chapterData) // 自定义
```

#### 1.3 分析页面结构

检查 DOM 结构，找到：

- 漫画标题元素
- 章节标题元素
- 图片容器
- 章节列表

#### 1.4 判断是否为 SPA

**SPA 特征：**
- 章节切换时页面不刷新
- URL 变化但无网络请求（或使用 Fetch/XHR）
- 使用 Vue Router、React Router 等前端路由
- 查看 Network 面板，章节切换时无 HTML 文档请求

**非 SPA 特征：**
- 每次章节切换都刷新整个页面
- 有完整的 HTTP 请求和响应
- URL 变化伴随页面重载

### 步骤 2：创建提取函数

#### 2.1 基本模板

```
/**
 * 从 [网站名称] 提取漫画数据
 * @returns {Object|null} 转换后的漫画数据，失败返回null
 */
function extractDataFrom[SiteName]() {
  try {
    // 使用 unsafeWindow 访问原网站的 window 对象
    const win = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window

    // TODO: 从页面提取原始数据
    // const rawData = ...

    // TODO: 构建 manga 对象
    const manga = {
      title: '',
      author: '',
      cover: '',
      description: ''
    }

    // TODO: 构建 current 章节对象
    const current = {
      id: '',
      name: '',
      url: win.location.href,
      images: []
    }

    // TODO: 构建章节列表
    const list = []

    // TODO: 找到上一章和下一章
    const currentIndex = list.findIndex(ch => ch.id === current.id)
    const previous = currentIndex > 0 ? list[currentIndex - 1] : null
    const next = currentIndex < list.length - 1 ? list[currentIndex + 1] : null

    // 构建完整的数据结构
    const data = {
      manga,
      chapter: {
        current,
        previous,
        next,
        list
      }
    }

    console.log('[网站名适配器] 数据提取成功:', {
      manga: manga.title,
      currentChapter: current.name,
      totalChapters: list.length
    })

    return data
  } catch (error) {
    console.error('[网站名适配器] 提取数据失败:', error)
    return null
  }
}
```

#### 2.2 实现细节

根据实际网站情况填充 TODO 部分。

### 步骤 3：注册适配器

#### 3.1 添加到 WEBSITE_ADAPTERS

```
const WEBSITE_ADAPTERS = [
  // ... 现有适配器
  {
    name: '网站中文名称',
    host: 'domain.com',              // 域名关键字
    pathnameRegEx: /^\/path\//,      // 路径正则（可选）
    spa: false,                      // 是否为单页应用（可选，默认false）
    loadDelay: 0,                    // 数据加载延迟（可选，默认0）
    pathnamePollingDelay: 500,       // SPA轮询间隔（可选，默认500）
    extract: extractDataFrom[SiteName]
  }
]
```

#### 3.2 配置说明

**必填字段：**

- `name`: 网站中文名称，用于日志输出
- `host`: 域名匹配关键字，使用 `includes` 匹配
  - 例如：`'zaimanhua.com'` 会匹配 `manhua.zaimanhua.com`
- `extract`: 数据提取函数

**可选字段：**

- `pathnameRegEx`: 路径匹配正则
  - 如果不设置，只要域名匹配即可
  - 如果设置，需要同时满足域名和路径
  - 例如：`/^\/view\//` 匹配 `/view/xxx` 路径

- `spa`: 是否为单页应用
  - `true`: 启用路由监听，自动检测 pathname 变化
  - `false` 或不设置: 不启用路由监听
  - **重要**: 如果网站是 SPA，务必设置为 `true`

- `loadDelay`: 检测到阅读页后的数据加载延迟（毫秒）
  - 适用于需要等待页面数据初始化的场景
  - 例如：Nuxt.js hydration 需要时间
  - 默认值：0（立即加载）

- `pathnamePollingDelay`: SPA 路由变化检测间隔（毫秒）
  - 仅在 `spa: true` 时生效
  - 建议范围：300-1000ms
  - 默认值：500ms
  - 过小会影响性能，过大会降低响应速度

### 步骤 4：添加 @match 规则

在脚本头部添加新的匹配规则：

```
// ==UserScript==
// @name         Vue漫画阅读器
// ... 其他配置
// @match        https://domain.com/path/*
// ==/UserScript==
```

**注意：**

- 添加所有需要支持的 URL 模式
- 可以使用通配符 `*`
- 多个 `@match` 可以共存

### 步骤 5：测试适配器

#### 5.1 本地测试

1. 修改脚本文件
2. 在 Tampermonkey 中更新脚本
3. 访问目标网站
4. 查看控制台日志

#### 5.2 验证数据

在控制台执行：

```
// 查看提取的数据
console.log($vm.manga)
console.log($vm.chapter)

// 验证必填字段
console.assert($vm.manga.title, '标题不能为空')
console.assert($vm.chapter.current.images.length > 0, '必须有图片')
```

#### 5.3 功能测试

- [ ] 侧边栏显示正确
- [ ] 章节列表完整
- [ ] 上一章/下一章跳转正常
- [ ] 图片加载正常
- [ ] 键盘快捷键工作正常
- [ ] 主题切换正常

## 🚀 SPA 支持详解

### 什么是 SPA？

单页应用（Single Page Application）在章节切换时不会刷新整个页面，而是通过 JavaScript 动态更新内容。传统的 Tampermonkey 脚本只在页面加载时执行一次，无法感知后续的路由变化。

### 为什么需要 SPA 支持？

**问题场景：**
1. 用户访问漫画阅读页 A
2. 脚本正常加载，显示阅读器
3. 用户点击"下一章"按钮
4. URL 变为阅读页 B，但页面没有刷新
5. ❌ 传统脚本无法感知这次变化
6. ❌ 阅读器仍然显示旧章节数据

**解决方案：**
- 启用 SPA 路由监听
- 定时检测 `location.pathname` 变化
- 自动重新加载新章节数据
- ✅ 用户体验流畅，无需手动刷新

### 工作原理

#### 1. 启动路由监听器

```
// 主程序入口
if (website.spa) {
  startPathnameTimer(() => {
    const isReadPage = loadData()
    if (!isReadPage) setReaderVisible(false)
  }, website.pathnamePollingDelay)
}
```

#### 2. 路由检测机制

```
let lastPathname = ''
let pathnameTimer = null

function startPathnameTimer(fn = () => {}, delay = 500) {
  stopPathnameTimer()  // 先停止旧的定时器
  lastPathname = location.pathname
  
  pathnameTimer = setInterval(() => {
    const currentPathname = window.location.pathname
    if (currentPathname !== lastPathname) {
      console.log('[漫画阅读器] 检测到路由变化！新路径为:', currentPathname)
      fn()  // 执行回调
      lastPathname = currentPathname
    }
  }, delay)
}

function stopPathnameTimer() {
  if (!pathnameTimer) return
  clearInterval(pathnameTimer)
  pathnameTimer = null
}
```

#### 3. 统一的加载逻辑

```
function loadData() {
  const isReadPage = checkReadPage(website)
  
  // 如果是阅读页，加载数据
  if (isReadPage) {
    setTimeout(() => {
      loadMangaData(website, true)  // skipCheck=true，因为已经检查过
    }, website.loadDelay || 0)
  }
  
  // 根据页面类型控制入口按钮
  setEntryVisible(isReadPage)
  
  return isReadPage
}
```

### SPA 配置示例

#### 再漫画（SPA 站点）

```
{
  name: '再漫画',
  spa: true,                        // ✅ 标记为 SPA
  host: 'zaimanhua.com',
  pathnameRegEx: /^\/view\//,       // 阅读页路径
  pathnamePollingDelay: 500,        // 每 500ms 检测一次
  loadDelay: 1000,                  // 检测到阅读页后延迟 1s 加载
  extract: extractFromZaimanhua
}
```

**工作流程：**
1. 用户访问 `/view/123` → 脚本初始化，检测到阅读页，延迟 1s 后加载数据
2. 用户点击下一章 → URL 变为 `/view/456`（页面无刷新）
3. 路由监听器（每 500ms）检测到 pathname 变化
4. 自动调用 `loadData()` → 检测到是阅读页 → 延迟 1s 后加载新数据
5. 阅读器自动更新为新章节内容
6. 用户离开阅读页 → URL 变为 `/details/123` → 隐藏阅读器，显示入口按钮

#### 漫画柜（非 SPA 站点）

```
{
  name: '漫画柜',
  host: 'manhuagui.com',
  pathnameRegEx: /^\/comic\/\d+\/\d+.html/,
  // ❌ 没有 spa: true，不会启动路由监听
  extract: extractFromManhuagui
}
```

**工作流程：**
1. 用户访问 `/comic/123/456.html` → 脚本初始化，加载数据
2. 用户点击下一章 → 浏览器发起完整页面请求
3. 新页面加载完成 → 脚本重新执行
4. 检测到新章节，加载数据

### SPA 开发注意事项

#### 1. 正确设置 `pathnameRegEx`

确保正则表达式能准确匹配阅读页路径：

```
// ✅ 正确：精确匹配阅读页
pathnameRegEx: /^\/view\//

// ❌ 错误：可能匹配到非阅读页
pathnameRegEx: /\/view/  // 可能匹配 /api/view/stats
```

#### 2. 合理设置 `loadDelay`

如果网站需要时间初始化数据，设置合适的延迟：

```
// Nuxt.js 需要 hydration 时间
loadDelay: 1000

// React SSR 可能需要更长时间
loadDelay: 1500

// 普通 SPA 可以立即加载
loadDelay: 0
```

#### 3. 调整 `pathnamePollingDelay`

根据网站性能和用户体验需求调整：

```
// 高性能设备，追求快速响应
pathnamePollingDelay: 300

// 平衡性能和资源占用（推荐）
pathnamePollingDelay: 500

// 低性能设备，节省资源
pathnamePollingDelay: 1000
```

#### 4. 测试各种场景

- [ ] 首次访问阅读页
- [ ] 章节切换（上一章/下一章）
- [ ] 从阅读页跳转到详情页
- [ ] 从详情页跳转到阅读页
- [ ] 浏览器前进/后退按钮
- [ ] 手动修改 URL

## 💻 示例代码

### 示例 1：简单网站（静态 HTML）

```
function extractDataFromSimpleSite() {
  try {
    const win = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window

    // 从 DOM 提取数据
    const titleEl = document.querySelector('.comic-title')
    const authorEl = document.querySelector('.comic-author')
    const chapterTitleEl = document.querySelector('.chapter-title')
    const imageContainer = document.querySelector('.image-container')

    // 提取图片
    const images = Array.from(imageContainer.querySelectorAll('img'))
      .map((img) => img.src || img.dataset.src)
      .filter((url) => url)

    // 提取章节列表
    const chapterLinks = document.querySelectorAll('.chapter-list a')
    const list = Array.from(chapterLinks).map((link) => ({
      id: link.dataset.chapterId,
      name: link.textContent.trim(),
      url: link.href
    }))

    // 构建数据
    const currentId = win.location.pathname.split('/').pop()
    const currentIndex = list.findIndex((ch) => ch.id === currentId)

    const data = {
      manga: {
        title: titleEl?.textContent.trim() || '未知标题',
        author: authorEl?.textContent.trim() || '未知作者'
      },
      chapter: {
        current: {
          id: currentId,
          name: chapterTitleEl?.textContent.trim() || '未知章节',
          url: win.location.href,
          images: images
        },
        previous: currentIndex > 0 ? list[currentIndex - 1] : null,
        next: currentIndex < list.length - 1 ? list[currentIndex + 1] : null,
        list: list
      }
    }

    return data
  } catch (error) {
    console.error('[简单网站适配器] 提取数据失败:', error)
    return null
  }
}
```

### 示例 2：SPA 网站（JavaScript 数据）

```
function extractDataFromSPASite() {
  try {
    const win = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window

    // 从全局变量提取数据
    if (!win.APP_DATA || !win.APP_DATA.comic) {
      console.error('[SPA网站适配器] 未找到 APP_DATA')
      return null
    }

    const comicData = win.APP_DATA.comic
    const chapterData = win.APP_DATA.chapter

    // 构建 manga
    const manga = {
      title: comicData.title,
      author: comicData.author,
      cover: comicData.cover,
      description: comicData.summary
    }

    // 构建 current
    const current = {
      id: chapterData.id,
      name: chapterData.name,
      url: win.location.href,
      images: chapterData.pages.map((page) => page.image_url)
    }

    // 构建列表
    const list = comicData.chapters.map((ch) => ({
      id: ch.id,
      name: ch.title,
      url: `/comic/${comicData.id}/chapter/${ch.id}`,
      updateTime: formatDate(ch.created_at)
    }))

    // 找到上一章和下一章
    const currentIndex = list.findIndex((ch) => ch.id === current.id)
    const previous = currentIndex > 0 ? list[currentIndex - 1] : null
    const next = currentIndex < list.length - 1 ? list[currentIndex + 1] : null

    return {
      manga,
      chapter: { current, previous, next, list }
    }
  } catch (error) {
    console.error('[SPA网站适配器] 提取数据失败:', error)
    return null
  }
}

// 辅助函数：格式化日期
function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
```

### 示例 3：带缓存的网站适配器（推荐）

```
/**
 * 从网站提取漫画数据（带缓存优化）
 * @returns {Object|null} 转换后的漫画数据，失败返回null
 */
async function extractDataFromSiteWithCache() {
  try {
    const win = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window

    // 1. 提取漫画基本信息
    const manga = {
      id: 'comic_id',
      title: '漫画标题',
      author: '作者名称',
      cover: '封面URL',
      url: '.'  // 详情页URL
    }

    // 2. 提取当前章节信息
    const current = {
      id: 'chapter_id',
      name: '章节名称',
      url: win.location.href,
      images: ['image1.jpg', 'image2.jpg']
    }

    // 3. 检查缓存
    const cacheKey = `sitename-${manga.id}`
    const cache = $cache.get(cacheKey)

    let list = []
    
    if (cache && cache.chapters && cache.chapters.length > 0) {
      // 使用缓存数据
      console.log(`[网站适配器] 使用缓存<${cacheKey}>`)
      list = [...cache.chapters]  // 创建副本
    } else {
      // 4. 从详情页提取章节列表
      try {
        console.log('[网站适配器] 从详情页提取章节列表')
        const resp = await fetch(manga.url)
        const htmlText = await resp.text()
        const doc = new DOMParser().parseFromString(htmlText, 'text/html')
        
        // TODO: 根据实际DOM结构提取章节列表
        const chapterElements = doc.querySelectorAll('.chapter-list a')
        const chapters = Array.from(chapterElements).map((el) => ({
          id: el.dataset.id,
          name: el.textContent.trim(),
          url: el.href
        }))
        
        if (chapters.length > 0) {
          list = chapters
          
          // 5. 保存到缓存（1小时TTL）
          $cache.set(cacheKey, { chapters: list }, 3600)
          console.log('[网站适配器] 保存缓存成功')
        }
      } catch (error) {
        console.warn('[网站适配器] 提取章节列表失败:', error)
      }
    }

    // 6. 兜底处理
    if (list.length === 0) {
      list.push(current)
    }

    // 7. 找到上一章和下一章
    const currentIndex = list.findIndex((ch) => ch.id === current.id)
    const previous = currentIndex > 0 ? list[currentIndex - 1] : null
    const next = currentIndex < list.length - 1 ? list[currentIndex + 1] : null

    return {
      manga,
      chapter: { current, previous, next, list }
    }
  } catch (error) {
    console.error('[网站适配器] 提取数据失败:', error)
    return null
  }
}
```

**缓存优势：**
- ⚡ 首次访问后加载速度提升 80%+
- 🌐 减少网络请求，节省流量
- 💾 自动管理，无需手动清理
- 🔄 1小时后自动更新

**注意事项：**
- 仅在成功提取完整数据时才保存缓存
- 使用 `[...cache.chapters]` 创建副本，避免修改原数据
- 选择合适的 TTL（通常 1-24 小时）
- 缓存键应包含网站标识和漫画ID

### 示例 4：API 驱动网站（异步加载）

```
async function extractDataFromAPISite() {
  try {
    const win = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window

    // 从 URL 提取 ID
    const comicId = win.location.pathname.match(/\/comic\/(\d+)/)?.[1]
    const chapterId = win.location.pathname.match(/\/chapter\/(\d+)/)?.[1]

    if (!comicId || !chapterId) {
      console.error('[API网站适配器] 无法提取ID')
      return null
    }

    // 调用 API 获取数据
    const response = await fetch(`/api/comic/${comicId}/chapter/${chapterId}`)
    const data = await response.json()

    // 构建标准格式
    const manga = {
      title: data.comic.title,
      author: data.comic.author,
      cover: data.comic.cover
    }

    const current = {
      id: data.chapter.id,
      name: data.chapter.title,
      url: win.location.href,
      images: data.chapter.images.map((img) => img.url)
    }

    const list = data.comic.chapters.map((ch) => ({
      id: ch.id,
      name: ch.title,
      url: `/comic/${comicId}/chapter/${ch.id}`
    }))

    const currentIndex = list.findIndex((ch) => ch.id === current.id)
    const previous = currentIndex > 0 ? list[currentIndex - 1] : null
    const next = currentIndex < list.length - 1 ? list[currentIndex + 1] : null

    return {
      manga,
      chapter: { current, previous, next, list }
    }
  } catch (error) {
    console.error('[API网站适配器] 提取数据失败:', error)
    return null
  }
}
```

**注意：** 如果需要异步加载，需要在 `loadMangaData` 中特殊处理：

```
async function loadMangaData() {
  // ... 网站检测代码

  try {
    const data = await website.extract()
    if (data) {
      setMangaData(data)
    }
  } catch (error) {
    console.error('数据加载失败:', error)
  }
}
```

### 示例 5：完整功能网站（含状态、标签、分组）

```
/**
 * 从完整功能网站提取漫画数据
 * @returns {Object|null} 转换后的漫画数据，失败返回null
 */
async function extractDataFromFullFeaturedSite() {
  try {
    const win = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window

    // 1. 提取漫画基本信息
    const manga = {
      id: 'comic_id',
      title: '漫画标题',
      author: '作者名称',
      cover: '封面URL',
      description: '漫画简介',
      status: '连载中',  // 或 '已完结'
      tags: ['冒险', '热血', '少年'],
      url: '/comic/123'  // 详情页URL
    }

    // 2. 提取当前章节信息
    const current = {
      id: 'chapter_id',
      name: '第1话',
      url: win.location.href,
      images: ['image1.jpg', 'image2.jpg'],
      pageCount: 50  // 总页数
    }

    // 3. 构建章节分组列表
    const groups = [
      {
        title: '正篇',
        data: [
          { id: '1', name: '第1话', url: '/chapter/1', updatedAt: '2024-01-01', pageCount: 50 },
          { id: '2', name: '第2话', url: '/chapter/2', updatedAt: '2024-01-08', pageCount: 45 }
        ]
      },
      {
        title: '番外',
        data: [
          { id: 'sp1', name: '特别篇1', url: '/chapter/sp1', updatedAt: '2024-02-01', pageCount: 30 }
        ]
      }
    ]

    // 4. 扁平化章节列表（用于查找上下章）
    const list = groups.flatMap(group => group.data)

    // 5. 找到上一章和下一章
    const currentIndex = list.findIndex(ch => ch.id === current.id)
    const previous = currentIndex > 0 ? list[currentIndex - 1] : null
    const next = currentIndex < list.length - 1 ? list[currentIndex + 1] : null

    return {
      manga,
      chapter: { 
        current, 
        previous, 
        next, 
        list,
        groups  // 分组信息用于UI展示
      }
    }
  } catch (error) {
    console.error('[完整功能网站适配器] 提取数据失败:', error)
    return null
  }
}
```

**优势：**
- ✅ 支持章节分组显示（正篇、番外等）
- ✅ 显示章节更新时间和页数
- ✅ 提供完整的漫画元数据（状态、标签等）
- ✅ UI 展示更丰富，用户体验更好

## 🔍 调试技巧

### 控制台调试命令

```
// 查看 Vue 实例
console.log($vmr.$vm)

// 查看当前漫画数据
console.log($vmr.$vm.setupState.manga.value)

// 查看章节信息
console.log($vmr.$vm.setupState.chapter)

// 查看当前设置
console.log('主题:', $vmr.$vm.setupState.theme.value)
console.log('预载数量:', $vmr.$vm.setupState.preloadCount.value)

// 手动切换主题
$vmr.$vm.setupState.toggleTheme()

// 手动修改预载数量
$vmr.$vm.setupState.preloadCount.value = 3

// 打开/关闭设置面板
$vmr.$vm.setupState.toggleSettings()
$vmr.$vm.setupState.closeSettings()

// 手动设置数据
$vmr.setMangaData(yourData)

// 控制阅读器显示
$vmr.setReaderVisible(true)
$vmr.setReaderVisible(false)

// 控制入口按钮
$vmr.setEntryVisible(true)
$vmr.setEntryVisible(false)
```

### 日志级别

脚本使用以下日志前缀：

- `[漫画阅读器]` - 主日志（初始化、路由变化等）
- `[漫画阅读器>再漫画适配器]` - 站点特定日志
- `[漫画阅读器] 阅读页匹配: /view/123 ✓` - 状态指示

### 常见问题排查

**问题1：设置面板无法打开**
```
// 检查设置面板状态
console.log($vmr.$vm.setupState.isSettingsVisible.value)

// 手动打开
$vmr.$vm.setupState.toggleSettings()
```

**问题2：主题切换无效**
```
// 检查主题值
console.log($vmr.$vm.setupState.theme.value)

// 检查容器 data-theme 属性
console.log(document.querySelector('.manga-reader-container').dataset.theme)

// 手动切换
$vmr.$vm.setupState.toggleTheme()
```

**问题3：预载数量设置未保存**
```
// 检查 GM_setValue 是否成功
GM_setValue('vmr-preload-count', 3)
console.log(GM_getValue('vmr-preload-count'))  // 应该输出 3

// 检查响应式变量
console.log($vmr.$vm.setupState.preloadCount.value)
```

## ❓ 常见问题

### Q1: 如何判断网站是否为 SPA？

**方法一：观察行为**
- 章节切换时页面是否刷新
- URL 变化但无网络请求
- 使用前端路由库（Vue Router、React Router 等）

**方法二：检查代码**
```javascript
// 查看是否有路由库
console.log(window.VueRouter)  // Vue Router
console.log(window.ReactRouter)  // React Router

// 查看 History API 使用情况
const originalPushState = history.pushState
history.pushState = function() {
  console.log('pushState called:', arguments)
  return originalPushState.apply(this, arguments)
}
```

### Q2: 如何提取加密或混淆的数据？

有些网站会对数据进行加密或混淆，需要特殊处理：

```
// 示例：解密 eval 包裹的数据
const evalKeyword = 'window["\\x65\\x76\\x61\\x6c"]'
const scriptElement = document.querySelector('script')
const rawData = new Function(
  'return ' + scriptElement.innerText.replace(evalKeyword, '')
)()
const jsonData = JSON.parse(rawData)
```

### Q3: 如何处理分页加载的图片？

如果图片是分页加载的，需要等待所有图片加载完成：

```
async function extractImages() {
  const images = []
  let page = 1
  
  while (true) {
    const response = await fetch(`/api/images?page=${page}`)
    const data = await response.json()
    
    if (!data.images || data.images.length === 0) break
    
    images.push(...data.images)
    page++
  }
  
  return images
}
```

### Q4: 如何实现智能缓存策略？

根据数据更新频率选择合适的 TTL：

```
// 高频更新数据（章节列表）：1小时
$cache.set(cacheKey, data, 3600)

// 低频更新数据（漫画信息）：24小时
$cache.set(cacheKey, data, 86400)

// 几乎不变的数据（作者信息）：7天
$cache.set(cacheKey, data, 604800)
```

### Q5: 如何处理跨域请求？

Tampermonkey 脚本可以使用 `GM_xmlhttpRequest` 进行跨域请求：

```
// 在脚本头部添加
// @grant        GM_xmlhttpRequest

// 使用 GM_xmlhttpRequest
GM_xmlhttpRequest({
  method: 'GET',
  url: 'https://api.example.com/data',
  onload: function(response) {
    const data = JSON.parse(response.responseText)
    // 处理数据
  },
  onerror: function(error) {
    console.error('请求失败:', error)
  }
})
```

### Q6: 如何适配不同的章节分组方式？

有些网站按卷分组，有些按时间分组：

```
// 按卷分组
const groups = volumes.map(volume => ({
  title: `第${volume.number}卷`,
  data: volume.chapters
}))

// 按时间分组（年-月）
const groupedByMonth = {}
chapters.forEach(chapter => {
  const month = chapter.date.substring(0, 7)  // "2024-01"
  if (!groupedByMonth[month]) groupedByMonth[month] = []
  groupedByMonth[month].push(chapter)
})

const groups = Object.entries(groupedByMonth).map(([month, data]) => ({
  title: month,
  data
}))
```

---

**祝你开发顺利！** 🚀
