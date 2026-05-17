# 更新日志 (CHANGELOG)

所有重要更改都将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [2.0.0] - 2026-05-17

### ✨ 重大重构
- **代码结构优化**：全面重构代码架构，提升可维护性和可读性
- **常量集中管理**：提取所有魔法数字和配置到 CONFIG 对象
- **模块化设计**：清晰的模块划分（工具类、数据提取器、Vue应用）
- **代码精简**：减少约 24% 的代码量（从 ~1500行 到 1146行）

### 🔧 技术改进
- **响应式状态管理优化**：使用独立的 ref 和 reactive 变量，确保模板响应性
  - manga: `ref(null)` - 漫画信息
  - chapter: `reactive({ current, previous, next, list })` - 章节信息
  - currentPageIndex: `ref(0)` - 当前页索引
  - isVisible, isUIVisible, isSidebarVisible, isSettingsVisible: `ref(false)` - UI状态
  - theme: `ref('light')` - 主题设置
- **CSS样式提取**：将所有CSS样式提取为 STYLES 常量，便于维护
- **缓存管理器简化**：优化 CacheManager 类，移除冗余代码和注释
- **数据提取器重构**：
  - 简化 `extractFromZaimanhua()` 函数逻辑
  - 优化 `extractFromManhuagui()` 缓存策略
  - 统一错误处理和日志输出
- **网站适配器配置化**：使用 WEBSITE_ADAPTERS 数组管理多网站支持，便于扩展
- **SVG图标系统**：实现统一的 SVG 图标管理，支持动态属性和样式控制

### 🎨 新功能
- **阅读器设置弹窗**：新增设置功能，统一管理阅读器配置
  - 采用 Grid 布局，左侧标签右侧内容，间隔 8px
  - 主题选择改为按钮样式，选中状态高亮显示
  - 点击遮罩层或关闭按钮可关闭弹窗
- **漫画描述展示**：侧边栏新增漫画简介显示区域
  - 最多显示4行，超出可滚动
  - 自动适配内容高度，flex布局防坍塌
  - 无描述时自动隐藏
- **统一对话框样式**：整合确认对话框和设置弹窗的基础样式
  - `.vmr-dialog` - 统一的遮罩层和布局
  - `.vmr-dialog-box` - 统一的对话框盒子样式
  - 保留各自特有的内容和交互

### 🎨 UI/UX 优化
- **统一导航按钮样式**：创建 `.vmr-navbar-btn` 统一上一页、下一页、设置按钮样式
  - 36x36px 圆形按钮
  - 悬停效果统一
  - 禁用状态支持
- **优化漫画描述布局**：解决 flex 布局下的高度坍塌问题
  - 使用 `box-sizing: content-box` 精确计算高度
  - 添加 `flex-shrink: 0` 防止压缩
  - 自定义滚动条样式，透明轨道

### 🎨 代码质量提升
- 移除大量冗余注释和未使用的代码
- 使用现代 JavaScript 语法（可选链 `?.`、空值合并 `??`）
- 统一命名规范和代码风格
- 优化方法命名，提高可读性
- 精简 Vue 模板代码，移除冗余条件判断

### 🐛 Bug 修复
- ✅ 修复 Vue 模板变量响应性问题（使用独立 ref/reactive 而非单一 state 对象）
- ✅ 优化章节切换时的状态同步
- ✅ 修复滑块位置更新延迟问题
- ✅ 确保计算属性正确依赖响应式变量

### 📚 文档完善
- 更新 README.md，添加详细的功能说明和使用指南
- 完善 QUICKSTART.md 快速开始指南
- 优化 ADAPTER_GUIDE.md 适配器开发文档
- 新增项目总览文档（根目录 README.md）

### 🔄 向后兼容性
- ⚠️ 全局 API 保持不变：`$setMangaData(data)`
- ⚠️ 数据结构保持不变：`{ manga, chapter }`
- ⚠️ 所有现有功能完全保留

---

## [Unreleased]

### ✨ 新增功能
- **智能滑块导航**：支持拖动滑块快速定位页码
- **纯 CSS Tooltip 系统**：使用 `:hover` 控制的 tooltip，性能优异无闪烁
  - 按钮 tooltip：根据状态动态显示"上一页/下一页/上一章/下一章/到头了"
  - 滑块 tooltip：实时跟随滑块位置显示当前页码
- **边界视觉反馈**：到达章节边界时，前进/后退按钮图标旋转90度提示可跳转章节

### 🔧 技术改进
- **滑块双向绑定优化**：使用独立变量 `sliderValue` + watch 同步机制，彻底解决闪烁问题
- **CSS 变量动态定位**：滑块 tooltip 使用 CSS 变量实时更新位置，完全跟手无延迟
- **移除 transition 延迟**：tooltip 位置变化立即响应，仅保留 opacity 和 transform 过渡
- **自动化初始化**：通过 watch 监听数据变化自动更新滑块位置
- **精简 JavaScript 逻辑**：tooltip 显示/隐藏完全由 CSS 控制，JS 仅负责更新位置变量

### 🎨 样式优化
- 统一 tooltip 设计风格：毛玻璃背景、圆角、阴影、小箭头装饰
- 平滑动画效果：淡入淡出 + 轻微位移（translateY）
- 主题自适应：使用 CSS 变量，自动适配亮色/暗色主题
- 图标旋转过渡：0.3s ease 动画，自然流畅

### 🐛 Bug 修复
- 修复滑块首次悬停时位置默认在中间的问题
- 修复滑块拖动时 tooltip 不跟手的延迟感
- 消除 Vue 响应式更新导致的滑块闪烁现象
- 确保 tooltip 在所有场景下都能正确显示

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
- **键盘事件拦截优化**：采用捕获阶段事件拦截技术 + 智能放行机制
  - 在 document 上使用捕获阶段注册 keydown 监听器
  - **智能放行功能键（F1-F12）和修饰键组合（Shift/Ctrl/Alt/Meta）**
  - 统一阻止其他按键的默认行为和事件传播
  - 防止原网站键盘事件干扰阅读器操作，同时不影响浏览器快捷键
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