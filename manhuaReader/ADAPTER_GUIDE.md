# 网站适配器开发指南

本文档详细说明如何为 manhuaReader 添加新的漫画网站支持。

## 📋 目录

- [适配器架构](#适配器架构)
- [数据结构规范](#数据结构规范)
- [开发步骤](#开发步骤)
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
│  Data Adapter Layer                 │
│  ┌──────────┐ ┌──────────┐         │
│  │ Zaiman   │ │ NewSite  │         │
│  │ Adapter  │ │ Adapter  │         │
│  └──────────┘ └──────────┘         │
├─────────────────────────────────────┤
│  Website Detection & Loading        │
└─────────────────────────────────────┘
```

### 核心组件

1. **网站配置列表** (`WEBSITE_LIST`)
   - 定义支持的网站
   - 包含域名、路径和提取函数

2. **数据提取函数** (`extract` function)
   - 从页面提取原始数据
   - 转换为标准数据结构
   - 返回统一格式的数据对象

3. **自动加载器** (`loadMangaData`)
   - 检测当前网站
   - 调用对应的提取函数
   - 设置数据到 Vue 应用

## 📊 数据结构规范

### 标准数据格式

所有适配器必须返回以下结构的数据：

```javascript
{
  manga: {
    title: string,           // 漫画标题（必填）
    author: string,          // 作者名称（可选）
    cover: string,           // 封面图片URL（可选）
    description: string      // 漫画简介（可选）
  },
  chapter: {
    current: {               // 当前章节（必填）
      id: string|number,     // 章节ID（必填）
      name: string,          // 章节名称（必填）
      url: string,           // 章节URL（必填）
      images: string[]       // 图片URL数组（必填）
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
      updateTime: string     // 更新时间 YYYY-MM-DD（可选）
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
- `chapter.list`：必须是数组

#### 可选字段
- 如果不存在上一章/下一章，设置为 `null`
- 其他可选字段可以省略或设为空字符串

### URL 格式建议

**推荐使用相对路径：**
```javascript
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
console.log(window.__NUXT__)      // Nuxt.js
console.log(window.__INITIAL_STATE__) // Vuex
console.log(window.COMIC_DATA)    // 自定义
console.log(window.chapterData)   // 自定义
```

#### 1.3 分析页面结构
检查 DOM 结构，找到：
- 漫画标题元素
- 章节标题元素
- 图片容器
- 章节列表

### 步骤 2：创建提取函数

#### 2.1 基本模板

```javascript
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

#### 3.1 添加到 WEBSITE_LIST

```javascript
const WEBSITE_LIST = [
  // ... 现有适配器
  {
    name: '网站中文名称',
    host: 'domain.com',           // 域名关键字
    pathnameRegEx: /^\/path\//,   // 路径正则（可选）
    extract: extractDataFrom[SiteName]
  }
]
```

#### 3.2 配置说明

**host**: 域名匹配关键字
- 使用 `includes` 匹配
- 例如：`'zaimanhua.com'` 会匹配 `manhua.zaimanhua.com`

**pathnameRegEx**: 路径匹配正则（可选）
- 如果不设置，只要域名匹配即可
- 如果设置，需要同时满足域名和路径
- 例如：`/^\/view\//` 匹配 `/view/xxx` 路径

### 步骤 4：添加 @match 规则

在脚本头部添加新的匹配规则：

```javascript
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

```javascript
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

## 💻 示例代码

### 示例 1：简单网站（静态 HTML）

```javascript
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
      .map(img => img.src || img.dataset.src)
      .filter(url => url)

    // 提取章节列表
    const chapterLinks = document.querySelectorAll('.chapter-list a')
    const list = Array.from(chapterLinks).map(link => ({
      id: link.dataset.chapterId,
      name: link.textContent.trim(),
      url: link.href
    }))

    // 构建数据
    const currentId = win.location.pathname.split('/').pop()
    const currentIndex = list.findIndex(ch => ch.id === currentId)

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

```javascript
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
      images: chapterData.pages.map(page => page.image_url)
    }

    // 构建列表
    const list = comicData.chapters.map(ch => ({
      id: ch.id,
      name: ch.title,
      url: `/comic/${comicData.id}/chapter/${ch.id}`,
      updateTime: formatDate(ch.created_at)
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

### 示例 3：API 驱动网站（异步加载）

```javascript
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
      images: data.chapter.images.map(img => img.url)
    }

    const list = data.comic.chapters.map(ch => ({
      id: ch.id,
      name: ch.title,
      url: `/comic/${comicId}/chapter/${ch.id}`
    }))

    const currentIndex = list.findIndex(ch => ch.id === current.id)
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

```javascript
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

## 🔍 调试技巧

### 技巧 1：控制台调试

```javascript
// 1. 查看页面所有全局变量
console.table(Object.keys(window).filter(k => 
  !k.startsWith('__') && typeof window[k] !== 'function'
))

// 2. 搜索可能包含数据的变量
Object.keys(window).forEach(key => {
  if (key.toLowerCase().includes('comic') || 
      key.toLowerCase().includes('manga') ||
      key.toLowerCase().includes('chapter')) {
    console.log(key, window[key])
  }
})

// 3. 查看特定元素的数据
const el = document.querySelector('.target-element')
console.log(el.dataset)
console.log(el.getAttribute('data-id'))
```

### 技巧 2：网络请求监控

1. 打开开发者工具
2. 切换到 Network 标签
3. 刷新页面
4. 查找 API 请求（通常是 XHR/Fetch 类型）
5. 查看请求响应数据

### 技巧 3：断点调试

```javascript
// 在提取函数开始处添加断点
function extractDataFromSite() {
  debugger; // 执行到这里会暂停
  
  // ... 其余代码
}
```

### 技巧 4：数据验证

```javascript
// 验证提取的数据
function validateData(data) {
  const errors = []
  
  if (!data.manga?.title) {
    errors.push('缺少漫画标题')
  }
  
  if (!data.chapter?.current?.images?.length) {
    errors.push('缺少图片列表')
  }
  
  if (!data.chapter?.list?.length) {
    errors.push('缺少章节列表')
  }
  
  if (errors.length > 0) {
    console.error('数据验证失败:', errors)
    return false
  }
  
  console.log('数据验证通过')
  return true
}
```

## ❓ 常见问题

### Q1: 如何获取动态加载的数据？

**方法一：等待数据加载**
```javascript
function extractDataFromSite() {
  return new Promise((resolve) => {
    const checkData = setInterval(() => {
      if (window.DYNAMIC_DATA) {
        clearInterval(checkData)
        resolve(processData(window.DYNAMIC_DATA))
      }
    }, 100)
    
    // 超时处理
    setTimeout(() => {
      clearInterval(checkData)
      resolve(null)
    }, 5000)
  })
}
```

**方法二：监听 DOM 变化**
```javascript
const observer = new MutationObserver((mutations) => {
  // 检测到数据加载后提取
  if (document.querySelector('.data-loaded')) {
    observer.disconnect()
    extractData()
  }
})

observer.observe(document.body, {
  childList: true,
  subtree: true
})
```

### Q2: 如何处理反爬虫机制？

**建议：**
1. 优先使用页面已渲染的数据
2. 避免频繁的请求
3. 模拟正常的用户行为
4. 遵守网站的 robots.txt 和服务条款

**注意：** 本脚本仅供学习交流，请合法使用。

### Q3: 图片 URL 是相对路径怎么办？

**解决方案：**
```javascript
// 将相对路径转换为绝对路径
const baseUrl = win.location.origin
const absoluteUrl = new URL(relativeUrl, baseUrl).href

// 或者
const absoluteUrl = baseUrl + relativeUrl
```

### Q4: 章节列表太多，性能有问题？

**优化方案：**
```javascript
// 1. 只提取必要的字段
const list = chapters.map(ch => ({
  id: ch.id,
  name: ch.name,
  url: ch.url
  // 不要提取不必要的字段
}))

// 2. 使用虚拟滚动（如果章节非常多）
// 在 Vue 模板中使用 v-infinite-scroll 等插件

// 3. 延迟加载章节列表
// 先显示当前章节，用户点击后再加载完整列表
```

### Q5: 如何处理加密或混淆的数据？

**方法一：查找解密函数**
```javascript
// 在控制台中搜索解密相关函数
Object.keys(window).forEach(key => {
  if (key.toLowerCase().includes('decrypt') ||
      key.toLowerCase().includes('decode')) {
    console.log(key, window[key])
  }
})
```

**方法二：逆向工程**
- 查看 JavaScript 源代码
- 理解加密逻辑
- 实现相应的解密函数

**注意：** 尊重知识产权，仅用于学习研究。

## 📚 参考资源

- [Vue 3 官方文档](https://cn.vuejs.org/)
- [Tampermonkey API](https://www.tampermonkey.net/documentation.php)
- [MDN Web Docs](https://developer.mozilla.org/)

## 🤝 贡献

欢迎提交新的网站适配器！

**提交前请确保：**
- [ ] 代码符合规范
- [ ] 经过充分测试
- [ ] 添加了必要的注释
- [ ] 更新了文档

---

**祝开发顺利！** 🎉