# 快速开始指南 (QUICKSTART)

## 🚀 5 分钟快速上手

### 第一步：安装 Tampermonkey

1. **Chrome/Edge 用户**
   - 访问 [Chrome 网上应用店](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
   - 点击"添加至 Chrome"
   - 确认安装

2. **Firefox 用户**
   - 访问 [Firefox 附加组件](https://addons.mozilla.org/firefox/addon/tampermonkey/)
   - 点击"添加到 Firefox"
   - 确认安装

### 第二步：安装漫画阅读器脚本

**方法一：直接安装（推荐）**
1. 点击链接：[manhuaReader.user.js](manhuaReader.user.js)
2. Tampermonkey 会自动打开并显示安装界面
3. 点击"安装"按钮

**方法二：手动安装**
1. 打开 Tampermonkey 管理面板
2. 点击"+"创建新脚本
3. 复制 `manhuaReader.user.js` 的全部内容
4. 粘贴到编辑器
5. 按 `Ctrl+S` 保存

### 第三步：访问漫画网站

目前支持的网站：
- **再漫画**：https://manhua.zaimanhua.com/view/*

访问任意漫画章节页面，脚本会自动加载阅读器。

## 📖 基本使用

### 阅读漫画

#### 翻页操作
```
┌─────────────┬──────────────┬─────────────┐
│             │              │             │
│   点击左侧   │  点击中间     │  点击右侧    │
│   上一页     │  显隐工具栏   │  下一页      │
│             │              │             │
└─────────────┴──────────────┴─────────────┘
```

#### 键盘快捷键
- `←` 左箭头：上一页
- `→` 右箭头：下一页
- `Space` 空格：下一页
- `Esc`：关闭 UI 元素

### 使用侧边栏

1. **打开侧边栏**
   - 点击工具栏左侧的 ▶ 按钮
   - 或首次进入时自动显示

2. **侧边栏功能**
   - 查看漫画标题和作者
   - 查看当前章节信息
   - 点击"上一章"/"下一章"按钮跳转
   - 浏览完整章节列表，点击任意章节跳转

3. **关闭侧边栏**
   - 再次点击 ◀ 按钮
   - 或按 `Esc` 键
   - 或点击中间区域隐藏工具栏

### 切换主题

1. **亮色 ↔ 暗色**
   - 点击工具栏右侧的 🌙/☀️ 按钮
   - 主题选择会自动保存

2. **主题效果**
   - 亮色：白色背景，深色文字
   - 暗色：深色背景，浅色文字
   - 所有 UI 元素都会跟随主题变化

## 💡 实用技巧

### 技巧 1：快速跳转章节

**方法一：使用侧边栏**
1. 打开侧边栏（点击 ▶）
2. 在章节列表中找到目标章节
3. 点击该章节即可跳转

**方法二：键盘操作**
- 在最后一页按 `→`：跳转到下一章（需确认）
- 在第一页按 `←`：跳转到上一章（需确认）

### 技巧 2：最大化阅读空间

1. 按 `Esc` 隐藏所有 UI
2. 只保留漫画图片
3. 需要时再点击中间区域显示工具栏

### 技巧 3：防止误操作

- 首次进入时，点击区域会被锁定 1.5 秒
- 章节边界跳转会显示确认对话框
- 可以点击"取消"放弃跳转

### 技巧 4：自定义主题

在浏览器控制台执行：

```javascript
// 修改背景色为深蓝色
const container = document.querySelector('.manga-reader-container')
container.style.setProperty('--vmr-bg-primary', '#1a237e')
container.style.setProperty('--vmr-bg-secondary', '#283593')

// 恢复默认
location.reload()
```

## 🔧 常见问题

### Q1: 脚本没有自动加载？

**解决方法：**
1. 检查 Tampermonkey 是否启用
2. 检查脚本是否启用（绿色开关）
3. 刷新页面重试
4. 查看浏览器控制台是否有错误信息

### Q2: 如何手动加载数据？

在浏览器控制台执行：

```javascript
$setMangaData({
  manga: {
    title: "测试漫画",
    author: "测试作者"
  },
  chapter: {
    current: {
      id: "1",
      name: "第1话",
      url: "/chapter/1",
      images: ["image1.jpg", "image2.jpg"]
    },
    previous: null,
    next: null,
    list: []
  }
})
```

### Q3: 如何恢复到默认状态？

**方法一：刷新页面**
- 直接按 `F5` 或 `Ctrl+R`

**方法二：清除主题设置**
```javascript
GM_setValue('vmr-theme', 'light')
location.reload()
```

### Q4: 支持哪些网站？

目前仅支持：
- 再漫画 (zaimanhua.com)

如需支持其他网站，请参考 [README.md](README.md) 中的"添加新网站适配器"章节。

### Q5: 如何反馈问题或建议？

1. 打开浏览器开发者工具（F12）
2. 切换到 Console 标签
3. 截图错误信息
4. 描述问题和复现步骤
5. 提交 Issue 或联系作者

## 📚 下一步

- 📖 阅读完整的 [README.md](README.md) 了解所有功能
- 🔧 查看 [数据结构](README.md#数据结构) 学习如何适配新网站
- 💻 参考 [开发指南](README.md#开发指南) 参与贡献

---

**祝你阅读愉快！** 🎉