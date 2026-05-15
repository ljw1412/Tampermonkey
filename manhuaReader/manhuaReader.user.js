// ==UserScript==
// @name         Vue漫画阅读器
// @namespace    http://tampermonkey.net/
// @version      1.2.0
// @description  基于Vue的漫画阅读器，提供统一的阅读界面和数据接口
// @author       huomangrandian、Lingma
// @match        https://manhua.zaimanhua.com/view/*
// @match        https://www.manhuagui.com/comic/*/*.html
// @require      https://unpkg.com/vue@3/dist/vue.global.prod.js
// @grant        unsafeWindow
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

/* global Vue */

/**
 * 格式化时间戳
 * @param {number} timestamp - Unix时间戳（秒）
 * @returns {string} 格式化后的日期字符串 (YYYY-MM-DD)
 */
function formatTimestamp(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp * 1000)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// ============================================
// UI相关函数
// ============================================

/**
 * 注入CSS样式
 */
function injectStyles() {
  const styles = `
    #vue-manga-reader {
      font-size: 12px;
      line-height: 1;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }

    /* 主题变量 - 亮色主题（默认） */
    .manga-reader-container {
      --vmr-bg-primary: #f5f5f5;
      --vmr-bg-secondary: #fff;
      --vmr-bg-overlay: rgba(255, 255, 255, 0.85);
      --vmr-text-primary: #333;
      --vmr-text-secondary: #666;
      --vmr-text-muted: #999;
      --vmr-border-color: #e0e0e0;
      --vmr-hover-bg: #f0f0f0;
      --vmr-active-bg: #667eea;
      --vmr-active-text: #fff;
      --vmr-shadow: 0 2px 8px rgba(0,0,0,0.1);
      --vmr-gradient-start: #667eea;
      --vmr-gradient-end: #764ba2;
      --vmr-button-bg: #fff;
      --vmr-button-border: #ddd;
      --vmr-button-hover-bg: #f5f5f5;
      --vmr-button-hover-border: #667eea;
      --vmr-button-hover-text: #667eea;
      --vmr-disabled-color: #999;
      --vmr-disabled-bg: #ccc;
      --vmr-toast-bg: rgba(0, 0, 0, 0.8);
      --vmr-dialog-overlay: rgba(0, 0, 0, 0.5);
      --vmr-dialog-bg: white;
      --vmr-dialog-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
      --vmr-cancel-btn-bg: #f5f5f5;
      --vmr-cancel-btn-text: #666;
      --vmr-cancel-btn-hover: #e0e0e0;
      --vmr-confirm-btn-bg: #667eea;
      --vmr-confirm-btn-text: white;
      --vmr-confirm-btn-hover: #5568d3;
      --vmr-close-btn-bg: rgba(0,0,0,0.5);
      --vmr-close-btn-hover: rgba(0,0,0,0.7);
      --vmr-scrollbar-track: #f1f1f1;
      --vmr-scrollbar-thumb: #888;
      --vmr-scrollbar-thumb-hover: #555;
    }

    /* 暗色主题 */
    .manga-reader-container[data-theme="dark"] {
      --vmr-bg-primary: #1a1a1a;
      --vmr-bg-secondary: #2d2d2d;
      --vmr-bg-overlay: rgba(45, 45, 45, 0.9);
      --vmr-text-primary: #e0e0e0;
      --vmr-text-secondary: #b0b0b0;
      --vmr-text-muted: #888;
      --vmr-border-color: #404040;
      --vmr-hover-bg: #3d3d3d;
      --vmr-active-bg: #5568d3;
      --vmr-active-text: #fff;
      --vmr-shadow: 0 2px 8px rgba(0,0,0,0.3);
      --vmr-gradient-start: #5568d3;
      --vmr-gradient-end: #6a4c93;
      --vmr-button-bg: #2d2d2d;
      --vmr-button-border: #404040;
      --vmr-button-hover-bg: #3d3d3d;
      --vmr-button-hover-border: #5568d3;
      --vmr-button-hover-text: #7c8ff5;
      --vmr-disabled-color: #999;
      --vmr-disabled-bg: #555;
      --vmr-toast-bg: rgba(255, 255, 255, 0.9);
      --vmr-dialog-overlay: rgba(0, 0, 0, 0.7);
      --vmr-dialog-bg: #2d2d2d;
      --vmr-dialog-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
      --vmr-cancel-btn-bg: #3d3d3d;
      --vmr-cancel-btn-text: #b0b0b0;
      --vmr-cancel-btn-hover: #4d4d4d;
      --vmr-confirm-btn-bg: #5568d3;
      --vmr-confirm-btn-text: white;
      --vmr-confirm-btn-hover: #4a5bc4;
      --vmr-close-btn-bg: rgba(255,255,255,0.2);
      --vmr-close-btn-hover: rgba(255,255,255,0.3);
      --vmr-scrollbar-track: #2d2d2d;
      --vmr-scrollbar-thumb: #555;
      --vmr-scrollbar-thumb-hover: #777;
    }

    .manga-reader-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 999999;
      display: flex;
      overflow: hidden;
      background: var(--vmr-bg-primary);
      transition: background 0.3s;
    }

    /* 侧边栏 - 悬浮左侧滑入滑出 */
    .vmr-sidebar {
      position: fixed;
      top: 0;
      left: 0;
      width: 300px;
      height: 100%;
      background: var(--vmr-bg-secondary);
      border-right: 1px solid var(--vmr-border-color);
      display: flex;
      flex-direction: column;
      box-shadow: 2px 0 8px rgba(0,0,0,0.1);
      z-index: 1000;
      transform: translateX(-100%);
      transition: transform 0.2s ease-in-out;
      opacity: 1;
    }

    .vmr-sidebar.show {
      transform: translateX(0);
      opacity: 1;
    }

    .vmr-sidebar-header {
      padding: 20px;
      background: linear-gradient(135deg, var(--vmr-gradient-start) 0%, var(--vmr-gradient-end) 100%);
      color: white;
    }

    .vmr-manga-title {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 8px;
    }

    .vmr-manga-author {
      font-size: 14px;
      opacity: 0.9;
    }

    .vmr-chapter-info {
      padding: 15px 20px;
      border-bottom: 1px solid var(--vmr-border-color);
      background: var(--vmr-bg-primary);
    }

    .vmr-current-chapter {
      font-size: 14px;
      color: var(--vmr-text-primary);
      margin-bottom: 5px;
    }

    .vmr-chapter-nav {
      display: flex;
      gap: 10px;
      margin-top: 10px;
    }

    .vmr-chapter-nav button {
      flex: 1;
      padding: 8px 12px;
      border: none;
      border-radius: 4px;
      background: var(--vmr-active-bg);
      color: white;
      cursor: pointer;
      font-size: 13px;
      transition: all 0.3s;
    }

    .vmr-chapter-nav button:hover {
      background: var(--vmr-confirm-btn-hover);
      transform: translateY(-1px);
    }

    .vmr-chapter-nav button:disabled {
      color: var(--vmr-disabled-color);
      background: var(--vmr-disabled-bg);
      cursor: not-allowed;
      transform: none;
    }

    /* 章节列表 */
    .vmr-chapter-list {
      display: grid;
      grid-template-columns: 1fr 1fr;
      column-gap: 6px;
      row-gap: 6px;
      padding: 10px;
      color: var(--vmr-text-primary);
      overflow-y: auto;
    }

    .vmr-chapter-item {
      padding: 12px 15px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
      background: var(--vmr-bg-secondary);
      border: 1px solid var(--vmr-border-color);
    }

    .vmr-chapter-item:hover {
      background: var(--vmr-hover-bg);
      border-color: var(--vmr-active-bg);
    }

    .vmr-chapter-item.active {
      background: var(--vmr-active-bg);
      color: var(--vmr-active-text);
      border-color: var(--vmr-active-bg);
    }

    .vmr-chapter-name {
      font-size: 14px;
      font-weight: 500;
    }

    .vmr-chapter-pagecount {
      font-size: 12px;
      opacity: 0.75;
    }

    .vmr-chapter-update-time {
      font-size: 12px;
      color: var(--vmr-text-muted);
      margin-top: 4px;
    }

    .vmr-chapter-item.active .vmr-chapter-update-time {
      color: rgba(255,255,255,0.8);
    }

    /* 工具栏 - 悬浮顶部滑入滑出 */
    .vmr-toolbar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 64px;
      padding: 0 20px;
      background: var(--vmr-bg-overlay);
      border-bottom: 1px solid var(--vmr-border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 999;
      transform: translateY(-100%);
      transition: transform 0.2s ease-in-out, padding-left 0.2s ease-in-out;
      backdrop-filter: blur(4px);
      opacity: 1;
    }

    .vmr-toolbar.show {
      transform: translateY(0);
      opacity: 1;
    }

    .vmr-toolbar.has-sidebar {
      padding-left: 315px;
    }

    .vmr-toolbar-left {
      display: flex;
      gap: 10px;
      align-items: center;
    }

    .vmr-toolbar button {
      padding: 8px;
      border: 1px solid var(--vmr-button-border);
      border-radius: 4px;
      background: var(--vmr-button-bg);
      cursor: pointer;
      font-size: 13px;
      line-height: 1;
      transition: all 0.2s;
      color: var(--vmr-text-primary);
    }

    .vmr-toolbar button:hover {
      background: var(--vmr-button-hover-bg);
      border-color: var(--vmr-button-hover-border);
      color: var(--vmr-button-hover-text);
    }

    .vmr-breadcrumb {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: var(--vmr-text-primary);
    }

    .vmr-breadcrumb-separator {
      color: var(--vmr-text-muted);
    }

    .page-in-total {
      padding: 4px 12px;
      font-size: 13px;
      line-height: 1;
      color: var(--vmr-text-primary);
      border: 1px solid var(--vmr-button-border);
      border-radius: 24px;
      user-select: none;
    }

    .vmr-toolbar-right {
      display: flex;
      gap: 10px;
      align-items: center;
    }

    .vmr-toolbar-right .btn-theme-toggle {
      display:inline-flex;
      align-items: center;
      justify-content: center;
      width: 30px;
      height: 30px;
      padding: 0;
      margin-right: 36px;
      border-radius: 50%;
    }

    /* 主内容区 - 三等分点击区域 */
    .vmr-main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      position: relative;
    }

    .vmr-click-zones {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      z-index: 1;
    }

    .vmr-click-zone {
      flex: 1;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .vmr-click-zone:hover {
      background-color: rgba(0, 0, 0, 0.02);
    }

    .vmr-click-zone.left {
      cursor: url("data:image/svg+xml;base64,PHN2ZyB0PSIxNzc4NzgxOTQ0Njk4IiBjbGFzcz0iaWNvbiIgdmlld0JveD0iMCAwIDEwMjQgMTAyNCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHAtaWQ9IjU3MjAiIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCI+PHBhdGggZD0iTTE2MS4xIDUxMS4ybDM3My42LTM3My42YzI2LjQtMjYuNCA2MS0zOS41IDk1LjYtMzkuNSAzNC42IDAgNjkuMiAxMy4yIDk1LjYgMzkuNSA1Mi43IDUyLjcgNTIuNyAxMzguNSAwIDE5MS4yTDQwMC40IDY1NC4zYy0xMC4zIDEwLjMtMjcgMTAuMy0zNy4zIDAtMTAuMy0xMC4zLTEwLjMtMjcgMC0zNy4zbDMyNS40LTMyNS40YzMyLjItMzIuMiAzMi4yLTg0LjUgMC0xMTYuNi0zMi4yLTMyLjItODQuNS0zMi4yLTExNi42IDBMMTk4LjQgNTQ4LjVNNjMwLjMgOTguMSIgZmlsbD0iIzIxOTdFRiIgcC1pZD0iNTcyMSI+PC9wYXRoPjxwYXRoIGQ9Ik0zNzEgMzc1LjlsMzQxLjIgMzQxLjJjNDIuNSA0Mi41IDQyLjUgMTExLjQgMCAxNTMuOXMtMTExLjQgNDIuNS0xNTMuOSAwTDIxNyA1MjkuOSIgZmlsbD0iI0NFRThGQSIgcC1pZD0iNTcyMiI+PC9wYXRoPjxwYXRoIGQ9Ik0xOTguNCA1NDguNWwzMzYuMyAzMzYuM2MyNS41IDI1LjUgNTkuNSAzOS42IDk1LjYgMzkuNiAzNi4xIDAgNzAuMS0xNC4xIDk1LjYtMzkuNiA1Mi43LTUyLjcgNTIuNy0xMzguNSAwLTE5MS4yTDM4OS42IDM1Ny4zbS03NC42IDBsMTcuNCAxNy40IDE5LjggMTkuOCAzMzYuMyAzMzYuM2MzMi4yIDMyLjIgMzIuMiA4NC41IDAgMTE2LjYtMTUuNiAxNS42LTM2LjMgMjQuMi01OC4zIDI0LjJzLTQyLjctOC42LTU4LjMtMjQuMkwyMzUuNyA1MTEuMmwtMjAuNS0yMC41LTE2LjctMTYuNyIgZmlsbD0iIzIxOTdFRiIgcC1pZD0iNTcyMyI+PC9wYXRoPjwvc3ZnPg=="), auto;
    }

    .vmr-click-zone.center {
      cursor: pointer;
    }

    .vmr-click-zone.right {
      cursor: url("data:image/svg+xml;base64,PHN2ZyB0PSIxNzc4NzgxOTY5MDEwIiBjbGFzcz0iaWNvbiIgdmlld0JveD0iMCAwIDEwMjQgMTAyNCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHAtaWQ9IjEyMjgiIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCI+PHBhdGggZD0iTTgzNi44IDU1MS4yTDQ2MiAxNzYuNGMtMzIuMy0zMi4zLTg0LjgtMzIuMy0xMTcgMC0zMi4zIDMyLTMzLjMgODQuOCAwIDExN0w2NzEuNSA2MjBjMTAuMyAxMC4zIDEwLjMgMjcxIDAgMzcuNC0xMC4zIDEwLjMtMjcuMSAxMC4zLTM3LjQgMEwzMDcuNiAzMzAuOGMtNTIuOS01Mi45LTUyLjktMTM5IDAtMTkxLjggMjYuNC0yNi40IDYxLjItMzkuNyA5NS45LTM5LjdzNjkuNSAxMy4yIDk1LjkgMzkuN2wzNzQuOCAzNzQuOE00MDMuNSA5OS4zIiBmaWxsPSIjMjE5N0VGIiBwLWlkPSIxMjI5Ij48L3BhdGg+PHBhdGggZD0iTTgxOC4xIDUzMi41TDQ3NS44IDg3NC45Yy00Mi42IDQyLjYtMTExLjggNDIuNi0xNTQuNCAwLTQyLjctNDIuNi00Mi43LTExMS44IDAtMTU0LjRsMzQyLjQtMzQyLjQiIGZpbGw9IiNDRUU4RkEiIHAtaWQ9IjEyMzAiPjwvcGF0aD48cGF0aCBkPSJNNjQ1IDM1OS40TDMwNy42IDY5Ni44Yy01Mi45IDUyLjktNTIuOSAxMzkgMCAxOTEuOCAyNS42IDI1LjYgNTkuNyAzOS43IDk1LjkgMzkuN3M3MC4zLTE0LjEgOTUuOS0zOS43bDMzNy40LTMzNy40bTAtNzQuOEw4MjAgNDkzLjJsLTIwLjYgMjAuNkw0NjIgODUxLjJjLTE1LjYgMTUuNi0zNi40IDI0LjItNTguNSAyNC4ycy00Mi45LTguNi01OC41LTI0LjJjLTMyLjMtMzIuMy0zMi4zLTg0LjggMC0xMTdsMzM3LjQtMzM3LjQgMTkuOS0xOS45IDE3LjUtMTcuNSIgZmlsbD0iIzIxOTdFRiIgcC1pZD0iMTIzMSI+PC9wYXRoPjwvc3ZnPg=="), auto;
    }

    /* 图片容器 */
    .vmr-image-container {
      flex: 1;
      display: flex;
      padding: 0;
      height: 0;
      background: var(--vmr-bg-primary);
      position: relative;
      z-index: 0;
    }

    .vmr-manga-page {
      height: 100%;
      max-width: 100%;
      margin: 0 auto;
      background: var(--vmr-bg-secondary);
      box-shadow: var(--vmr-shadow);
      border-radius: 4px;
      overflow: hidden;
    }

    .vmr-manga-page img {
      width: auto;
      height: 100%;
      display: block;
    }

    /* 空状态 */
    .vmr-empty-state {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: var(--vmr-text-muted);
    }

    .vmr-empty-state-icon {
      font-size: 64px;
      margin-bottom: 20px;
    }

    .vmr-empty-state-text {
      font-size: 16px;
    }

    /* 提示框 */
    .vmr-toast {
      position: fixed;
      top: 80px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 10000;
      background-color: var(--vmr-toast-bg);
      color: var(--vmr-bg-secondary);
      padding: 10px 20px;
      border-radius: 4px;
      font-size: 14px;
      transition: opacity 0.3s;
      pointer-events: none;
      opacity: 0;
    }

    .vmr-toast.show {
      opacity: 1;
    }

    /* 确认对话框 */
    .vmr-confirm-dialog {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: var(--vmr-dialog-overlay);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10002;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s;
    }

    .vmr-confirm-dialog.show {
      opacity: 1;
      visibility: visible;
    }

    .vmr-confirm-box {
      background: var(--vmr-dialog-bg);
      border-radius: 8px;
      padding: 24px;
      min-width: 320px;
      max-width: 400px;
      box-shadow: var(--vmr-dialog-shadow);
      transform: scale(0.9);
      transition: transform 0.3s;
    }

    .vmr-confirm-dialog.show .vmr-confirm-box {
      transform: scale(1);
    }

    .vmr-confirm-title {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 12px;
      color: var(--vmr-text-primary);
    }

    .vmr-confirm-message {
      font-size: 14px;
      color: var(--vmr-text-secondary);
      margin-bottom: 24px;
      line-height: 1.6;
    }

    .vmr-confirm-buttons {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    .vmr-confirm-buttons button {
      padding: 8px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s;
    }

    .vmr-btn-cancel {
      background: var(--vmr-cancel-btn-bg);
      color: var(--vmr-cancel-btn-text);
    }

    .vmr-btn-cancel:hover {
      background: var(--vmr-cancel-btn-hover);
    }

    .vmr-btn-confirm {
      background: var(--vmr-confirm-btn-bg);
      color: var(--vmr-confirm-btn-text);
    }

    .vmr-btn-confirm:hover {
      background: var(--vmr-confirm-btn-hover);
    }

    /* 关闭按钮 */
    .vmr-close-btn {
      position: fixed;
      top: 14px;
      right: 14px;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--vmr-close-btn-bg);
      color: white;
      border: none;
      cursor: pointer;
      font-size: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      z-index: 10001;
    }

    .vmr-close-btn:hover {
      background: var(--vmr-close-btn-hover);
      transform: rotate(90deg);
    }

    /* 滚动条样式 */
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }

    ::-webkit-scrollbar-track {
      background: var(--vmr-scrollbar-track);
    }

    ::-webkit-scrollbar-thumb {
      background: var(--vmr-scrollbar-thumb);
      border-radius: 4px;
    }

    ::-webkit-scrollbar-thumb:hover {
      background: var(--vmr-scrollbar-thumb-hover);
    }
  `

  GM_addStyle(styles)
}

/**
 * 创建应用容器
 */
function createAppContainer() {
  // 如果已存在则先移除，避免重复挂载
  const existing = document.getElementById('vue-manga-reader')
  if (existing) {
    existing.remove()
  }
  const container = document.createElement('div')
  container.id = 'vue-manga-reader'
  document.body.appendChild(container)
  return container
}

/**
 * 初始化Vue应用
 */
function initVueApp() {
  const { createApp, ref, computed, reactive, watch } = Vue

  const app = createApp({
    setup() {
      // 响应式数据 - 优化后的结构
      const manga = ref(null)
      const chapter = reactive({
        current: null, // 当前章节
        previous: null, // 上一章
        next: null, // 下一章
        list: [] // 章节列表
      })
      const currentPageIndex = ref(0)
      const isVisible = ref(false)
      const isUIVisible = ref(false)
      const isSidebarVisible = ref(false)
      const isClickZoneLocked = ref(false)

      // Toast 提示框状态
      const toast = reactive({
        isVisible: false,
        message: '',
        timer: null
      })

      // 确认对话框状态
      const confirmDialog = reactive({
        isVisible: false,
        title: '',
        message: '',
        callback: null
      })

      // 主题状态 - 从持久化存储加载
      const theme = ref(GM_getValue('vmr-theme', 'light'))

      // 切换主题
      const toggleTheme = () => {
        theme.value = theme.value === 'light' ? 'dark' : 'light'
        GM_setValue('vmr-theme', theme.value)
      }

      // 计算属性
      const totalPages = computed(() => {
        return chapter.current?.images?.length || 0
      })

      const currentPage = computed(() => {
        if (!chapter.current?.images) return null
        return chapter.current.images[currentPageIndex.value]
      })

      const hasNextChapter = computed(() => {
        return !!chapter.next
      })

      const hasPrevChapter = computed(() => {
        return !!chapter.previous
      })

      const isFirstPage = computed(() => {
        return currentPageIndex.value === 0
      })

      const isLastPage = computed(() => {
        return currentPageIndex.value >= totalPages.value - 1
      })

      // 方法
      const setData = (data) => {
        console.log('[Vue漫画阅读器] 接收到数据:', data)

        // 设置漫画信息（简化为manga）
        if (data.manga) {
          manga.value = data.manga
        }

        // 设置章节信息（整合为chapter对象）
        if (data.chapter) {
          if (data.chapter.current) {
            chapter.current = data.chapter.current
            currentPageIndex.value = 0
          }
          if (data.chapter.previous !== undefined) {
            chapter.previous = data.chapter.previous
          }
          if (data.chapter.next !== undefined) {
            chapter.next = data.chapter.next
          }
          if (data.chapter.list) {
            chapter.list = data.chapter.list
          }
        }

        isVisible.value = true

        isClickZoneLocked.value = true
        // 首次进入时显示侧边栏和工具栏3秒后自动隐藏
        setTimeout(() => {
          isUIVisible.value = true
          isSidebarVisible.value = true

          setTimeout(() => {
            isUIVisible.value = false
            isSidebarVisible.value = false
            isClickZoneLocked.value = false
          }, 1000)
        }, 100)
      }

      const goToPage = (index) => {
        if (index >= 0 && index < totalPages.value) {
          currentPageIndex.value = index
        }
      }

      const nextPage = () => {
        if (currentPageIndex.value < totalPages.value - 1) {
          currentPageIndex.value++
        } else if (hasNextChapter.value) {
          // 显示确认对话框
          showConfirmDialog(
            '跳转到下一章',
            `是否跳转到下一章《${chapter.next?.name || ''}》？`,
            () => {
              loadChapter(chapter.next)
            }
          )
        } else {
          showToast('已经是最后一章了')
        }
      }

      const prevPage = () => {
        if (currentPageIndex.value > 0) {
          currentPageIndex.value--
        } else if (hasPrevChapter.value) {
          // 显示确认对话框
          showConfirmDialog(
            '跳转到上一章',
            `是否跳转到上一章《${chapter.previous?.name || ''}》？`,
            () => {
              loadChapter(chapter.previous)
            }
          )
        } else {
          showToast('已经是第一章了')
        }
      }

      const loadChapter = (chapterData) => {
        if (!chapterData || !chapterData.url) return

        // 直接跳转到新章节的URL
        window.location.href = chapterData.url
      }

      // 显示确认对话框
      const showConfirmDialog = (title, message, callback) => {
        confirmDialog.title = title
        confirmDialog.message = message
        confirmDialog.callback = callback
        confirmDialog.isVisible = true
      }

      // 确认操作
      const handleConfirm = () => {
        confirmDialog.isVisible = false
        if (confirmDialog.callback) {
          confirmDialog.callback()
        }
      }

      // 取消操作
      const handleCancel = () => {
        confirmDialog.isVisible = false
        confirmDialog.callback = null
      }

      const toggleSidebar = () => {
        isSidebarVisible.value = !isSidebarVisible.value
      }

      const toggleToolbar = () => {
        isUIVisible.value = !isUIVisible.value
      }

      const closeReader = () => {
        isVisible.value = false
      }

      const handleLeftClick = () => {
        if (isClickZoneLocked.value) return
        prevPage()
      }

      const handleCenterClick = () => {
        if (isClickZoneLocked.value) return
        toggleToolbar()
      }

      const handleRightClick = () => {
        if (isClickZoneLocked.value) return
        nextPage()
      }

      // 显示提示框
      const showToast = (message, duration = 2000) => {
        toast.message = message
        toast.isVisible = true

        if (toast.timer) {
          clearTimeout(toast.timer)
        }

        toast.timer = setTimeout(() => {
          toast.isVisible = false
        }, duration)
      }

      const originKeydownListener = []

      // 键盘事件
      const handleKeydown = (event) => {
        if (!isVisible.value) return

        switch (event.key) {
          case 'ArrowRight':
            event.preventDefault()
            nextPage()
            break
          case 'ArrowLeft':
            event.preventDefault()
            prevPage()
            break
          case 'Escape':
            // 如果确认对话框显示，先关闭它
            if (confirmDialog.isVisible) {
              handleCancel()
            } else if (isSidebarVisible.value) {
              isSidebarVisible.value = false
            } else {
              isUIVisible.value = false
            }
            break
        }
      }

      // 监听键盘事件
      watch(
        () => isVisible.value,
        (v) => {
          if (v) {
            document.addEventListener('keydown', handleKeydown)
          } else {
            document.removeEventListener('keydown', handleKeydown)
          }
        }
      )

      return {
        manga,
        chapter,
        currentPageIndex,
        currentPage,
        totalPages,
        isVisible,
        isUIVisible,
        isSidebarVisible,
        isClickZoneLocked,
        toast,
        confirmDialog,
        theme,
        hasNextChapter,
        hasPrevChapter,
        isFirstPage,
        isLastPage,
        setData,
        goToPage,
        nextPage,
        prevPage,
        loadChapter,
        toggleSidebar,
        toggleToolbar,
        toggleTheme,
        closeReader,
        handleLeftClick,
        handleCenterClick,
        handleRightClick,
        showToast,
        showConfirmDialog,
        handleConfirm,
        handleCancel
      }
    },

    template: `
      <div v-if="isVisible" class="manga-reader-container" :data-theme="theme">
        <!-- 关闭按钮 -->
        <div class="vmr-close-btn" @click="closeReader" title="关闭">×</div>

        <!-- 提示框 -->
        <div class="vmr-toast" :class="{ show: toast.isVisible }">
          {{ toast.message }}
        </div>

        <!-- 确认对话框 -->
        <div class="vmr-confirm-dialog" :class="{ show: confirmDialog.isVisible }" @click.self="handleCancel">
          <div class="vmr-confirm-box">
            <div class="vmr-confirm-title">{{ confirmDialog.title }}</div>
            <div class="vmr-confirm-message">{{ confirmDialog.message }}</div>
            <div class="vmr-confirm-buttons">
              <button class="vmr-btn-cancel" @click="handleCancel">取消</button>
              <button class="vmr-btn-confirm" @click="handleConfirm">确认</button>
            </div>
          </div>
        </div>

        <!-- 侧边栏 -->
        <div class="vmr-sidebar" :class="{ show: isUIVisible && isSidebarVisible }">
          <div class="vmr-sidebar-header">
            <div class="vmr-manga-title">{{ manga?.title || '未加载漫画' }}</div>
            <div class="vmr-manga-author">{{ manga?.author || '未知作者' }}</div>
          </div>

          <div class="vmr-chapter-info">
            <div class="vmr-current-chapter">
              当前: {{ chapter.current?.name || '未选择' }}
              <span v-if="chapter.current?.pageCount" class="vmr-chapter-pagecount">
                {{ chapter.current.pageCount }}P
              </span>
            </div>
            <div class="vmr-chapter-nav">
              <button
                :disabled="!hasPrevChapter"
                @click="loadChapter(chapter.previous)"
              >
                ← 上一章
              </button>
              <button
                :disabled="!hasNextChapter"
                @click="loadChapter(chapter.next)"
              >
                下一章 →
              </button>
            </div>
          </div>

          <div class="vmr-chapter-list">
            <div
              v-for="(ch, index) in chapter.list"
              :key="ch.id"
              class="vmr-chapter-item"
              :class="{ active: chapter.current?.id === ch.id }"
              @click="loadChapter(ch)"
            >
              <div class="vmr-chapter-name">
              {{ ch.name }}
              <span v-if="ch.pageCount" class="vmr-chapter-pagecount">
                {{ ch.pageCount }}P
              </span>
               </div>
              <div class="vmr-chapter-update-time" v-if="ch.updateTime">
                {{ ch.updateTime }}
              </div>
            </div>
          </div>
        </div>

        <!-- 工具栏 -->
        <div class="vmr-toolbar" :class="{ show: isUIVisible, 'has-sidebar': isSidebarVisible }">
          <div class="vmr-toolbar-left">
            <button @click="toggleSidebar" :title="isSidebarVisible ? '隐藏侧边栏' : '显示侧边栏'">
              {{ isSidebarVisible ? '◀' : '▶' }}
            </button>
            <div v-if="!isSidebarVisible" class="vmr-breadcrumb">
              <span>{{ manga?.title || '未加载漫画' }}</span>
              <span class="vmr-breadcrumb-separator">/</span>
              <span>{{ chapter.current?.name || '未选择章节' }}</span>
            </div>
            <div class="page-in-total">
              {{ currentPageIndex + 1 }} / {{ totalPages }}
            </div>
          </div>

          <div class="vmr-toolbar-right">
            <button class="btn-theme-toggle" @click="toggleTheme" :title="theme === 'light' ? '切换到暗色主题' : '切换到亮色主题'">
              {{ theme === 'light' ? '🌙' : '☀️' }}
            </button>
          </div>
        </div>

        <!-- 主内容区 -->
        <div class="vmr-main-content">
          <!-- 三等分点击区域 -->
          <div class="vmr-click-zones">
            <div class="vmr-click-zone left" @click="handleLeftClick"></div>
            <div class="vmr-click-zone center" @click="handleCenterClick"></div>
            <div class="vmr-click-zone right" @click="handleRightClick"></div>
          </div>

          <div class="vmr-image-container">
            <div v-if="currentPage" class="vmr-manga-page">
              <img :src="currentPage" :alt="'第' + (currentPageIndex + 1) + '页'" />
            </div>

            <div v-else class="vmr-empty-state">
              <div class="vmr-empty-state-icon">📖</div>
              <div class="vmr-empty-state-text">暂无内容，请使用 $setMangaData 加载漫画数据</div>
            </div>
          </div>
        </div>
      </div>
    `
  })

  // 将Vue实例保存到window，方便外部调用
  window.$app = app
  return app
}

function setMangaData(data) {
  if (window.$vm) {
    window.$vm.setData(data)
    console.log('[Vue漫画阅读器] 数据已设置')
  } else {
    console.error('[Vue漫画阅读器] Vue应用未初始化')
  }
}

/**
 * 暴露全局API
 */
function exposeGlobalAPI() {
  const win = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window
  win.$setMangaData = setMangaData
  console.log('[Vue漫画阅读器] 全局API已暴露: $setMangaData')
}

// ============================================
// 网站适配器函数
// ============================================

/**
 * 从再漫画网站提取数据
 * @returns {Object|null} 转换后的漫画数据，失败返回null
 */
function extractDataFromZaimanhua() {
  try {
    // 使用 unsafeWindow 访问原网站的 window 对象
    const win = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window

    // 检查是否有必要的数据
    if (!win.__NUXT__ || !win.__NUXT__.data) {
      console.error('[再漫画适配器] 未找到 __NUXT__ 数据')
      return null
    }

    const nuxtData = win.__NUXT__.data

    // 提取漫画基本信息
    const comicInfo = nuxtData.getCationDetails?.data?.comicInfo
    if (!comicInfo) {
      console.error('[再漫画适配器] 未找到漫画信息')
      return null
    }

    const manga = {
      title: comicInfo.title || '未知标题',
      author: comicInfo.authorsTagList
        ?.map((author) => author.tagName)
        .join('、'),
      cover: comicInfo.cover,
      description: comicInfo.description
    }

    // 提取当前章节信息
    const chapterInfo = nuxtData.getChapters?.data?.chapterInfo
    if (!chapterInfo) {
      console.error('[再漫画适配器] 未找到章节信息')
      return null
    }

    const currentChapterId = chapterInfo.chapter_id
    const currentChapterTitle = chapterInfo.title

    // 构建当前章节对象
    const current = {
      id: currentChapterId,
      name: currentChapterTitle,
      url: win.location.href,
      images: chapterInfo.page_url || []
    }
    current.pageCount = current.images.length

    // 提取章节列表
    const chapterListData = comicInfo.chapterList?.[0]?.data || []

    // 转换章节列表格式
    const list = chapterListData.map((ch) => ({
      id: ch.chapter_id,
      name: ch.chapter_title,
      url: `./${ch.chapter_id}`,
      updateTime: formatTimestamp(ch.updatetime)
    }))

    // 按章节顺序排序（chapter_order 从小到大）
    list.sort((a, b) => {
      const orderA =
        chapterListData.find((ch) => ch.chapter_id === a.id)?.chapter_order || 0
      const orderB =
        chapterListData.find((ch) => ch.chapter_id === b.id)?.chapter_order || 0
      return orderA - orderB
    })

    // 找到当前章节在列表中的索引
    const currentIndex = list.findIndex((ch) => ch.id === currentChapterId)

    // 确定上一章和下一章
    const previous = currentIndex > 0 ? list[currentIndex - 1] : null
    const next = currentIndex < list.length - 1 ? list[currentIndex + 1] : null

    // 构建完整的数据结构
    const data = {
      manga,
      chapter: { current, previous, next, list }
    }

    console.log('[再漫画适配器] 数据提取成功:', {
      manga: manga.title,
      currentChapter: current.name,
      totalChapters: list.length,
      totalPages: current.images.length,
      hasPrevious: !!previous,
      hasNext: !!next
    })

    return data
  } catch (error) {
    console.error('[再漫画适配器] 提取数据失败:', error)
    return null
  }
}

/**
 * 从漫画柜网站提取数据
 * @returns {Object|null} 转换后的漫画数据，失败返回null
 */
async function extractDataFromManhuagui() {
  const evalKeyword = 'window["\\x65\\x76\\x61\\x6c"]'

  try {
    // 查找包含漫画信息的脚本
    const scriptElements = Array.from(document.querySelectorAll('script'))
    const infoScriptElement = scriptElements.find((script) =>
      script.innerText.includes(evalKeyword)
    )

    if (!infoScriptElement) {
      console.error('[漫画柜适配器] 没有找到漫画信息脚本')
      return null
    }

    // 执行脚本获取原始数据
    const scriptContent = infoScriptElement.innerText.replace(evalKeyword, '')
    const rawData = new Function('return ' + scriptContent)()

    // 提取JSON部分
    const jsonStart = rawData.indexOf('{')
    const jsonEnd = rawData.lastIndexOf('}') + 1
    const jsonString = rawData.substring(jsonStart, jsonEnd)
    const chapterInfo = JSON.parse(jsonString)

    // 获取页面变量
    const pageVariables = unsafeWindow.pVars

    if (!chapterInfo || !pageVariables) {
      console.error('[漫画柜适配器] 缺少必要的数据')
      return null
    }

    // 构建漫画基本信息
    const manga = {
      title: chapterInfo.bname || '未知标题',
      author: '未知作者', // 漫画柜可能需要从其他位置获取作者信息
      cover: chapterInfo.bpic
        ? `https://cf.mhgui.com/cpic/h/${chapterInfo.bpic}`
        : '',
      description: ''
    }

    // 构建当前章节对象
    const { cid, cname, len } = chapterInfo

    const current = {
      id: cid + '',
      name: cname,
      url: window.location.href,
      images: chapterInfo.files.map((filename) => {
        return `${pageVariables.manga.filePath}${filename}?e=${chapterInfo.sl.e}&m=${chapterInfo.sl.m}`
      }),
      pageCount: len
    }

    // 根据 prevId 和 nextId 确定上一章和下一章（直接组装，不依赖章节列表）
    let previous = chapterInfo.prevId
      ? {
          id: chapterInfo.prevId,
          name: '上一章',
          url: `./${chapterInfo.prevId}.html`
        }
      : null

    let next = chapterInfo.nextId
      ? {
          id: chapterInfo.nextId,
          name: '下一章',
          url: `./${chapterInfo.nextId}.html`
        }
      : null

    // 构建章节列表（需要从页面中获取所有章节信息）
    // 默认创建一个只包含当前章节的列表
    const list = [current]

    // 尝试从详情页DOM中提取章节列表
    try {
      console.log('[漫画柜适配器] 尝试从详情页中提取章节列表')
      const resp = await fetch('.')
      const htmlText = await resp.text()
      const doc = new DOMParser().parseFromString(htmlText, 'text/html')
      console.log('[漫画柜适配器] 详情页请求成功：', doc)
      const authorLabelEl = Array.from(
        doc.querySelectorAll('.book-detail .detail-list li span strong')
      ).find((item) => item.innerText.includes('作者'))
      if (authorLabelEl) {
        const author = Array.from(authorLabelEl.parentElement.childNodes)
          .filter((el) => el !== authorLabelEl)
          .map((item) => item.textContent)
          .join('、')
        if (author) {
          manga.author = author
          console.log('[漫画柜适配器] 获取到作者', author)
        }
      }
      const chapterListEls = Array.from(
        doc.querySelectorAll('.chapter .chapter-list')
      ).reverse()
      const extractedChapters = chapterListEls
        .map((clist) => Array.from(clist.querySelectorAll('ul')))
        .flat()
        .map((ul) => Array.from(ul.querySelectorAll('li a')).reverse())
        .flat()
        .map((item) => {
          const url = item.href
          const pageCount = parseInt(item.querySelector('i')?.innerText) || null
          const idMatched = url.match(/\/comic\/\d+\/(\d+).html/)
          const id = idMatched ? idMatched[1] : url
          return { id, name: item.title, url, pageCount }
        })
      if (extractedChapters.length > 0) {
        list.length = 0
        list.push(...extractedChapters)
        console.log('[漫画柜适配器] 章节信息获取成功', list)
        // 找到当前章节在列表中的索引
        const currentIndex = list.findIndex((ch) => ch.id === current.id)
        // 更新上一章和下一章
        const previous = currentIndex > 0 ? list[currentIndex - 1] : null
        const next =
          currentIndex < list.length - 1 ? list[currentIndex + 1] : null
      }
    } catch (error) {
      console.warn('[漫画柜适配器] 提取章节列表失败:', error)
    }

    // 构建完整的数据结构
    const mangaData = {
      manga: manga,
      chapter: { current, previous, next, list }
    }

    console.log('[漫画柜适配器] 数据提取成功:', {
      manga: manga.title,
      currentChapter: current.name,
      totalChapters: list.length,
      totalPages: current.images.length,
      hasPrevious: !!previous,
      hasNext: !!next
    })

    return mangaData
  } catch (error) {
    console.error('[漫画柜适配器] 提取数据失败:', error)
    return null
  }
}
// ============================================
// 网站配置列表（模式化适配器）
// ============================================

const WEBSITE_LIST = [
  {
    name: '再漫画',
    host: 'zaimanhua.com',
    pathnameRegEx: /^\/view\//,
    extract: extractDataFromZaimanhua
  },
  {
    name: '漫画柜',
    host: 'manhuagui.com',
    pathnameRegEx: /^\/comic\/\d+\/\d+.html/,
    extract: extractDataFromManhuagui
  }
  // 未来添加新网站示例：
  // {
  //   name: 'XXX漫画',
  //   host: 'xxx.com',
  //   pathnameRegEx: /^\/manga\/\d+/,  // 或者 null（不限制路径）
  //   extract: extractDataFromXXXSite
  // }
]

/**
 * 从当前网站加载漫画数据
 */
async function loadMangaData() {
  const host = location.host
  const pathname = location.pathname

  console.log('[Vue漫画阅读器] 检测网站:', host)

  // 查找匹配的网站配置
  const website = WEBSITE_LIST.find((site) => {
    // 检查域名是否匹配
    const hostMatch = host.includes(site.host)
    if (!hostMatch) return false

    // 检查路径是否匹配（如果配置了路径正则）
    if (site.pathnameRegEx) {
      return site.pathnameRegEx.test(pathname)
    }

    // 如果没有配置路径正则，只要域名匹配即可
    return true
  })

  if (!website) {
    console.log('[Vue漫画阅读器] 未找到匹配的网站配置')
    return
  }

  console.log(`[Vue漫画阅读器] 检测到${website.name}，开始提取数据...`)

  try {
    // 调用对应的提取函数
    const data = await website.extract()

    if (data) {
      setMangaData(data)
      console.log('[Vue漫画阅读器] 数据加载成功')
    } else {
      console.warn('[Vue漫画阅读器] 未能提取到数据')
    }
  } catch (error) {
    console.error(`[Vue漫画阅读器] ${website.name}数据提取失败:`, error)
  }
}

// ============================================
// 主脚本执行体
// ============================================

;(function () {
  'use strict'

  console.log('[Vue漫画阅读器] 初始化...')

  if (!unsafeWindow.Vue) unsafeWindow.Vue = Vue

  // 注入样式
  injectStyles()

  const appContainer = createAppContainer()
  // 初始化Vue应用
  const app = initVueApp()
  const $vm = app.mount(appContainer)

  window.$vm = $vm

  // 暴露全局API
  exposeGlobalAPI()

  // 延迟加载数据（确保Vue应用已完全初始化）
  setTimeout(() => {
    loadMangaData()
  }, 1000)
})()
