# Vue 漫画阅读器 (manhuaReader)

基于 Vue 3 的 Tampermonkey 漫画阅读器，提供统一的阅读界面和数据接口。

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

### 🎨 用户体验
- **主题切换**：支持亮色/暗色主题，用户偏好持久化保存
- **平滑动画**：所有 UI 元素带有流畅的滑入滑出动画（0.2s）
- **防误触机制**：首次加载时锁定点击区域，避免误操作
- **Toast 提示**：轻量级消息提示，自动消失
- **确认对话框**：重要操作需要用户确认，支持取消
- **右下角功能区**：悬浮式页码显示和主题切换按钮，跟随UI显隐

### ⌨️ 便捷操作
- **键盘快捷键**：左右箭头翻页、ESC 关闭 UI
- **自动隐藏**：首次进入显示 1.5 秒后自动隐藏 UI
- **一键切换**：工具栏按钮快速控制侧边栏和主题

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
- 左侧：侧边栏控制按钮
- 中间：面包屑导航（漫画标题 / 当前章节）
- 右侧：主题切换按钮

## 📊 数据结构

### 完整数据结构

``javascript
{
  manga: {
    title: "漫画标题",
    author: "作者名称",
    cover: "封面图片URL",
    description: "漫画简介"
  },
  chapter: {
    current: {
      id: "章节ID",
      name: "章节名称",
      url: "章节URL",
      images: ["图片URL1", "图片URL2", ...]
    },
    previous: {
      id: "上一章ID",
      name: "上一章名称",
      url: "上一章URL"
    } | null,
    next: {
      id: "下一章ID",
      name: "下一章名称",
      url: "下一章URL"
    } | null,
    list: [
      {
        id: "章节ID",
        name: "章节名称",
        url: "章节URL",
        updateTime: "更新时间 (YYYY-MM-DD)"
      },
      // ... 更多章节
    ]
  }
}
```

### 字段说明

#### manga 对象
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 是 | 漫画标题 |
| author | string | 否 | 作者名称 |
| cover | string | 否 | 封面图片 URL |
| description | string | 否 | 漫画简介 |
| url | string | 否 | 漫画详情页 URL，如果提供则侧边栏标题和工具栏面包屑中的标题显示为可点击链接 |

#### chapter.current 对象
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string/number | 是 | 章节唯一标识 |
| name | string | 是 | 章节名称 |
| url | string | 是 | 章节页面 URL |
| images | array | 是 | 图片 URL 数组 |

#### chapter.previous / chapter.next 对象
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string/number | 是 | 章节唯一标识 |
| name | string | 是 | 章节名称 |
| url | string | 是 | 章节页面 URL |
| 值 | null | - | 如果没有上一章/下一章，设为 null |

#### chapter.list 数组元素
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string/number | 是 | 章节唯一标识 |
| name | string | 是 | 章节名称 |
| url | string | 是 | 章节页面 URL |
| updateTime | string | 否 | 更新时间，格式 YYYY-MM-DD |

## 🔧 全局 API

### $setMangaData(data)

设置漫画数据到阅读器。

**参数：**
- `data` (Object): 符合上述数据结构的漫画数据对象

**示例：**
``javascript
// 在浏览器控制台执行
$setMangaData({
  manga: {
    title: "测试漫画",
    author: "测试作者",
    url: "https://example.com/comic/123"  // 可选，提供后标题变为可点击链接
  },
  chapter: {
    current: {
      id: "1",
      name: "第1话",
      url: "/chapter/1",
      images: ["image1.jpg", "image2.jpg"]
    },
    previous: null,
    next: {
      id: "2",
      name: "第2话",
      url: "/chapter/2"
    },
    list: [
      { id: "1", name: "第1话", url: "/chapter/1" },
      { id: "2", name: "第2话", url: "/chapter/2" }
    ]
  }
})
```

### window.$vm

Vue 实例引用，可以访问所有响应式数据和方法。

**示例：**
```javascript
// 访问当前页码
console.log($vm.currentPageIndex)

// 访问漫画标题
console.log($vm.manga.title)

// 手动调用方法
$vm.toggleSidebar()
$vm.toggleTheme()
```

## 🎨 主题系统

### 主题切换

阅读器支持亮色和暗色两种主题，使用 CSS 变量实现。

#### 切换方式
1. **点击工具栏按钮**：点击工具栏右侧的 🌙/☀️ 图标
2. **编程方式**：
   ```javascript
   $vm.toggleTheme()
   ```

#### 持久化存储
- 使用 `GM_setValue` 保存用户偏好
- 下次打开时自动应用上次选择的主题
- 默认主题为亮色（light）

#### CSS 变量
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

| 按键 | 功能 | 说明 |
|------|------|------|
| `←` / `ArrowLeft` | 上一页 | 第一页时显示确认对话框跳转到上一章 |
| `→` / `ArrowRight` | 下一页 | 最后一页时显示确认对话框跳转到下一章 |
| `Space` | 下一页 | 同右箭头 |
| `Esc` | 关闭 UI | 优先级：确认对话框 > 侧边栏 > 工具栏 |

## 🌐 网站适配器

### 适配器架构

阅读器采用适配器模式，可以轻松支持不同的漫画网站。

#### 适配器结构

```
const WEBSITE_LIST = [
  {
    name: '网站名称',
    host: 'domain.com',
    pathnameRegEx: /^\/path\//,  // 可选，路径匹配正则
    extract: extractDataFunction   // 数据提取函数
  }
]
```

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
const WEBSITE_LIST = [
  // ... 现有适配器
  {
    name: '新网站名称',
    host: 'newsite.com',
    pathnameRegEx: /^\/manga\//,  // 可选
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
- **数据来源**：`window.__NUXT__.data`
- **特点**：使用 Nuxt.js SSR，数据在服务端渲染

#### 漫画柜 (manhuagui.com)
- **域名**：manhuagui.com
- **路径**：/comic/{漫画ID}/{章节ID}.html
- **数据来源**：页面脚本中的 `info` 对象和 `pVars` 变量
- **特点**：
  - 从加密脚本中提取章节信息（使用 eval 解密）
  - 自动获取作者信息（从详情页 DOM 解析）
  - 支持通过 prevId/nextId 直接导航上下章
  - 异步加载完整章节列表（从详情页 HTML 解析）
  - 图片 URL 带有时效性认证参数（e 和 m）
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
└── CHANGELOG.md               # 更新日志
```

### 代码架构

#### 主要模块

1. **网站适配器模块**
   - `extractDataFromZaimanhua()`：再漫画数据提取
   - `WEBSITE_LIST`：网站配置列表
   - `loadMangaData()`：自动检测并加载数据

2. **UI 模块**
   - `injectStyles()`：注入 CSS 样式
   - `createAppContainer()`：创建应用容器
   - `initVueApp()`：初始化 Vue 应用

3. **Vue 应用**
   - 响应式数据管理
   - 模板渲染
   - 事件处理

4. **全局 API**
   - `setMangaData()`：设置数据
   - `exposeGlobalAPI()`：暴露全局接口

### 开发流程

#### 1. 克隆项目
```bash
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
```javascript
// 查看 Vue 实例
console.log($vm)

// 查看当前数据
console.log($vm.manga)
console.log($vm.chapter)

// 手动设置数据
$setMangaData(yourData)

// 切换主题
$vm.toggleTheme()
```

**Tampermonkey 日志：**
- 打开浏览器开发者工具
- 查看 Console 标签
- 搜索 `[Vue漫画阅读器]` 相关日志

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

## 📝 更新日志

### v1.2.0 (2026-05-15)
- ✨ 新增暗色主题支持
- ✨ 使用 CSS 变量实现主题系统
- ✨ 主题偏好持久化保存（GM_getValue/GM_setValue）
- ✨ 工具栏添加主题切换按钮
- 🎨 优化所有 UI 元素支持主题切换
- 📝 更新脚本版本号为 1.2.0

### v1.1.1 (2026-05-15)
- ✨ 新增漫画柜网站适配器支持
- ✨ 实现从加密脚本中提取章节数据
- ✨ 自动解析作者信息（从详情页 DOM）
- ✨ 支持通过 prevId/nextId 直接导航上下章
- ✨ 异步加载完整章节列表
- 🔧 优化变量命名，提高代码可读性
- 🐛 修复图片 URL 构建逻辑，支持时效性认证参数

### v1.1.0 (2026-05-15)
- ✨ 重构 UI 布局为悬浮式设计
- ✨ 侧边栏改为左侧滑入滑出
- ✨ 工具栏改为顶部滑入滑出
- ✨ 主体内容分为左中右三个点击区域
- ✨ 添加章节边界跳转确认对话框
- ✨ 添加 Toast 提示框
- ✨ 恢复右上角关闭按钮
- 🎨 所有 CSS 类名添加 vmr- 前缀防止冲突
- 🎨 优化首次进入自动显示 1.5 秒后隐藏
- 🔧 封装 toast 和 confirmDialog 为 reactive 对象

### v1.0.0 (2026-05-15)
- 🎉 初始版本发布
- ✨ 基于 Vue 3 构建漫画阅读器
- ✨ 支持再漫画网站
- ✨ 提供统一的数据接口
- ✨ 侧边栏显示章节列表
- ✨ 支持键盘快捷键操作

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

- huomangrandian
- Lingma

## 🙏 致谢

感谢以下开源项目：
- [Vue.js](https://vuejs.org/)
- [Tampermonkey](https://www.tampermonkey.net/)

---

**注意**：本脚本仅供学习交流使用，请遵守相关法律法规和网站服务条款。