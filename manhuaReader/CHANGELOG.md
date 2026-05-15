# 更新日志 (CHANGELOG)

所有重要更改都将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [1.3.0] - 2026-05-15

### ✨ 新增功能
- **智能缓存系统**：新增 CacheManager 类，统一管理缓存数据
- **漫画柜缓存支持**：章节列表和作者信息自动缓存（1小时TTL）
- **自动清理机制**：脚本启动时自动清理过期缓存，节省存储空间
- 新增漫画柜网站适配器支持（manhuagui.com）
- 实现从加密脚本中提取章节数据
- 自动解析作者信息（从详情页 DOM 提取）
- 支持通过 prevId/nextId 直接导航上下章
- 异步加载完整章节列表（从详情页 HTML 解析）
- manga 对象新增 url 属性，支持点击标题跳转到漫画详情页

### 🔧 技术改进
- **键盘事件拦截优化**：采用捕获阶段事件拦截技术
  - 在 document 上使用捕获阶段注册 keydown 监听器
  - 统一阻止所有按键的默认行为和事件传播
  - 防止原网站键盘事件干扰阅读器操作
  - 只需在 document 上注册，无需在 body 重复注册
- 实现 CacheManager 缓存管理器
  - 支持带过期时间的数据存储
  - 自动清理过期数据
  - 命名空间隔离，避免键冲突
- 优化 extractDataFromManhuagui 函数变量命名
  - `keyword` → `evalKeyword`
  - `scripts` → `scriptElements`
  - `infoScript` → `infoScriptElement`
  - `text` → `rawData`
  - `infoText` → `jsonString`
  - `info` → `chapterInfo`
  - `pVars` → `pageVariables`
- 完善图片 URL 构建逻辑，支持时效性认证参数（e 和 m）
- 使用 async/await 异步加载章节列表
- 添加详细的日志输出便于调试
- 侧边栏标题支持超链接显示（当 manga.url 存在时）
- 优化缓存策略：仅在成功提取完整数据时才保存缓存

### 📊 数据结构支持
- 支持漫画柜特有的 info 对象结构
  - bid, bname, bpic（漫画基本信息）
  - cid, cname（章节信息）
  - files（图片文件名数组）
  - prevId, nextId（上下章ID，0表示边界）
  - sl（认证参数：e时间戳, m签名）
- 支持 pVars 对象中的图片基础路径
- manga 对象新增可选的 url 字段

### 🎨 样式优化
- 侧边栏标题链接样式优化
- 工具栏面包屑链接样式优化
- 链接悬停效果（下划线和颜色变化）
- 保持与渐变背景的颜色对比度

### 🐛 Bug 修复
- 修复上下章导航依赖章节列表的问题
- 修复图片 URL 拼接错误
- 优化错误处理机制
- 确保缓存数据的完整性和一致性

## [1.2.0] - 2026-05-15

### ✨ 新增功能
- 添加暗色主题支持
- 使用 CSS 变量实现完整的主题系统
- 工具栏右侧添加主题切换按钮（🌙/☀️）
- 用户主题偏好持久化保存（GM_getValue/GM_setValue）
- 所有 UI 元素支持亮色/暗色主题切换

### 🎨 样式改进
- 定义完整的 CSS 变量体系（30+ 个变量）
- 优化暗色主题的配色方案
- 主题切换时带有平滑过渡动画（0.3s）
- 滚动条样式跟随主题变化

### 🔧 技术改进
- 在脚本头部添加 GM_getValue 和 GM_setValue 权限
- 实现 updateTheme() 方法动态应用主题
- 在 setData 时自动加载并应用用户主题偏好
- 默认主题为亮色（light）

### 📝 文档更新
- 创建完整的 README.md 文档
- 创建 QUICKSTART.md 快速开始指南
- 创建 CHANGELOG.md 更新日志
- 添加主题系统详细说明

## [1.1.0] - 2026-05-15

### ✨ 重大重构
- 完全重构 UI 布局为悬浮式设计
- 侧边栏改为左侧滑入滑出动画
- 工具栏改为顶部滑入滑出动画
- 主体内容分为左中右三个点击区域

### 🎯 新功能
- 添加章节边界跳转确认对话框
  - 最后一页点击下一页显示确认
  - 第一页点击上一页显示确认
  - 支持点击遮罩层或按 Esc 取消
- 添加 Toast 提示框
  - 自动消失（默认 2 秒）
  - 用于提示信息（如"已经是最后一章了"）
- 恢复右上角关闭按钮（×）
- 首次进入时 UI 自动显示 1.5 秒后隐藏
- 新增右下角功能区
  - 整合页码状态显示和主题切换按钮
  - 悬浮式设计，跟随工具栏显隐
  - 圆角卡片样式，带阴影和毛玻璃效果

### 🎨 样式优化
- 所有 CSS 类名添加 `vmr-` 前缀防止与原页面冲突
- 优化三等分点击区域的鼠标指针样式
- 添加点击区域悬停效果
- 优化侧边栏和工具栏的阴影和透明度
- 改进面包屑导航样式

### 🔧 代码优化
- 封装 toast 相关属性为 reactive 对象
  - `toast.isVisible`
  - `toast.message`
  - `toast.timer`
- 封装 confirmDialog 相关属性为 reactive 对象
  - `confirmDialog.isVisible`
  - `confirmDialog.title`
  - `confirmDialog.message`
  - `confirmDialog.callback`
- 简化属性命名，提高代码可读性
- 优化键盘事件处理逻辑
- 添加点击区域锁定机制（isClickZoneLocked）

### 🐛 Bug 修复
- 修复侧边栏和工具栏同时显示时的布局问题
- 修复确认对话框 z-index 层级问题
- 修复 ESC 键关闭顺序问题

## [1.0.0] - 2026-05-15

### 🎉 初始版本发布

#### ✨ 核心功能
- 基于 Vue 3 (CDN) 构建漫画阅读器
- 提供统一的阅读界面和数据接口
- 全局 API: `$setMangaData(data)`
- 支持再漫画网站（zaimanhua.com）

#### 🎨 UI 特性
- 侧边栏显示漫画信息和章节列表
- 主内容区显示漫画图片
- 工具栏显示页码和导航按钮
- 支持键盘快捷键操作

#### 📊 数据结构
- manga: { title, author, cover, description }
- chapter: { current, previous, next, list }
- 所有章节项包含 url 字段
- previous/next 为 null 表示边界

#### 🔧 技术特点
- 使用 reactive 管理 chapter 对象
- 使用 ref 管理其他简单类型
- v-if 控制显示/隐藏
- 定位样式在 .manga-reader-container 上

#### 📝 适配器
- 实现再漫画网站适配器
- 从 window.__NUXT__.data 提取数据
- 自动检测并加载漫画数据
- 支持章节列表排序和导航

---

## 版本说明

### 版本号规则

采用语义化版本 2.0.0 格式：**主版本号.次版本号.修订号**

- **主版本号**：不兼容的 API 修改
- **次版本号**：向下兼容的功能性新增
- **修订号**：向下兼容的问题修正

### 类型说明

- **✨ 新增功能 (Added)**：新功能
- **🔄 变更 (Changed)**：现有功能的变更
- **🐛 修复 (Fixed)**：Bug 修复
- **⚠️ 废弃 (Deprecated)**：即将移除的功能
- **❌ 删除 (Removed)**：已移除的功能
- **🔒 安全 (Security)**：安全相关的修复

---

## 相关链接

- [GitHub Releases](https://github.com/)
- [Keep a Changelog](https://keepachangelog.com/)
- [Semantic Versioning](https://semver.org/)

---

**注意**：此更新日志从 v1.0.0 开始记录。