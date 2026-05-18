// ==UserScript==
// @name         漫画阅读器
// @namespace    http://tampermonkey.net/
// @version      2.1.0
// @description  基于Vue的漫画阅读器，提供统一的阅读界面和数据接口
// @author       huomangrandian、Lingma
// @match        https://manhua.zaimanhua.com/*
// @match        https://www.manhuagui.com/comic/*/*.html
// @require      https://unpkg.com/vue@3/dist/vue.global.prod.js
// @grant        unsafeWindow
// @grant        GM_addStyle
// @grant        GM_deleteValue
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_listValues
// ==/UserScript==

/* global Vue */

// ==================== 常量配置 ====================
const CONFIG = {
  APP_NAME: '漫画阅读器',
  CACHE_PREFIX: 'cache_',
  THEME_KEY: 'vmr-theme',
  DEFAULT_THEME: 'light',
  AUTO_HIDE_DELAY: 1000,
  PRELOAD_OFFSET: 2,
  TOAST_DURATION: 2000
}

// ==================== 工具类 ====================

/**
 * 缓存管理器
 */
class CacheManager {
  constructor(prefix = CONFIG.CACHE_PREFIX) {
    this.prefix = prefix
  }

  set(key, data, ttlSeconds) {
    const cacheKey = this.prefix + key
    GM_setValue(cacheKey, {
      data,
      expireAt: Date.now() + ttlSeconds * 1000
    })
  }

  get(key) {
    const cacheData = GM_getValue(this.prefix + key, null)
    if (!cacheData) return null

    if (Date.now() > cacheData.expireAt) {
      this.delete(key)
      return null
    }

    return cacheData.data
  }

  delete(key) {
    GM_deleteValue(this.prefix + key)
  }

  clearExpired() {
    const now = Date.now()
    let count = 0

    GM_listValues().forEach((key) => {
      if (key.startsWith(this.prefix)) {
        const data = GM_getValue(key, null)
        if (data?.expireAt && now > data.expireAt) {
          GM_deleteValue(key)
          count++
        }
      }
    })

    if (count) console.log(`[${CONFIG.APP_NAME}] 清理${count}条过期缓存`)
  }
}

const $cache = new CacheManager()

/**
 * 格式化时间戳
 */
function formatTimestamp(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp * 1000)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// ==================== CSS样式 ====================
const STYLES = `
.vmr-overflow-hidden { overflow: hidden; }
.child-icon-rotate-90 .vmr-icon, .rotate-90 { transform: rotate(90deg); }
.vmr-icon {
  display: inline-block; width: 1em; height: 1em; color: inherit;
  font-style: normal; vertical-align: -2px; outline: none; stroke: currentColor;
}

#vue-manga-reader {
  font-size: 12px; line-height: 1;
  font-family: -apple-system, PingFang SC, HarmonyOS_Regular, Roboto, Microsoft YaHei, Helvetica Neue, Arial, sans-serif !important;
}

#vue-manga-reader * {
  font-family: -apple-system, PingFang SC, HarmonyOS_Regular, Roboto, Microsoft YaHei, Helvetica Neue, Arial, sans-serif !important;
}

/* 主题变量 - 亮色主题（默认） */
#vue-manga-reader {
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
  --vmr-action-btn-bg: rgba(0,0,0,0.5);
  --vmr-btn-hover: rgba(0,0,0,0.7);
  --vmr-scrollbar-track: #f1f1f1;
  --vmr-scrollbar-thumb: #888;
  --vmr-scrollbar-thumb-hover: #555;
}

/* 暗色主题 */
.manga-reader-container[data-theme="dark"] {
  --vmr-bg-primary: #1a1a1a;
  --vmr-bg-secondary: #2d2d2d;
  --vmr-bg-overlay: rgba(45, 45, 45, 0.85);
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
  --vmr-action-btn-bg: rgba(255,255,255,0.2);
  --vmr-btn-hover: rgba(255,255,255,0.3);
  --vmr-scrollbar-track: #2d2d2d;
  --vmr-scrollbar-thumb: #555;
  --vmr-scrollbar-thumb-hover: #777;
  --vmr-slider-accent-color: #fff;
}

.manga-reader-container {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  z-index: 999999; display: flex; overflow: hidden;
  background: var(--vmr-bg-primary); transition: background 0.3s;
}

.vmr-sidebar {
  position: absolute; top: 0; left: 0; width: 360px; height: 100%;
  background: var(--vmr-bg-secondary); border-right: 1px solid var(--vmr-border-color);
  display: flex; flex-direction: column; box-shadow: 2px 0 8px rgba(0,0,0,0.1);
  z-index: 1000; transform: translateX(-100%); transition: all 0.3s ease-in-out; opacity: 0;
}
.vmr-sidebar.vmr-show { transform: translateX(0); opacity: 1; }

.vmr-sidebar-header {
  padding: 20px 0;
  background: linear-gradient(135deg, var(--vmr-gradient-start) 0%, var(--vmr-gradient-end) 100%);
  color: white;
}
.vmr-manga-title {
  font-size: 18px; font-weight: bold; margin-bottom: 8px; padding: 0 18px;
  color: inherit; text-decoration: none;
}
a.vmr-manga-title:hover { text-decoration: underline; }
.vmr-manga-author { margin-top: 6px; font-size: 14px; opacity: 0.9; padding: 0 18px; }

.vmr-manga-desc {
  margin-top: 6px; padding: 0 18px;  color: white; opacity: 0.85;
  font-size: 13px; line-height: 1.6; min-height: 1.6em; max-height: 6.4em;
  overflow-y: auto; word-break: break-all; box-sizing: content-box; flex-shrink: 0;
}
.vmr-manga-desc::-webkit-scrollbar-track { background: transparent; }

.vmr-chapter-info {
  padding: 16px 18px; border-bottom: 1px solid var(--vmr-border-color);
  background: var(--vmr-bg-primary);
}
.vmr-current-chapter { font-size: 14px; color: var(--vmr-text-primary); margin-bottom: 5px; }
.vmr-current-chapter-pagecount { font-size: 12px; opacity: 0.75; }
.vmr-chapter-nav { display: flex; gap: 10px; margin-top: 10px; }
.vmr-chapter-nav button {
  flex: 1; padding: 8px 12px; border: none; border-radius: 4px;
  background: var(--vmr-active-bg); color: white; cursor: pointer;
  font-size: 13px; transition: all 0.3s;
}
.vmr-chapter-nav button:hover { background: var(--vmr-confirm-btn-hover); transform: translateY(-1px); }
.vmr-chapter-nav button:disabled {
  color: var(--vmr-disabled-color); background: var(--vmr-disabled-bg);
  cursor: not-allowed; transform: none;
}

.vmr-chapter-list {
  display: grid; grid-template-columns: repeat(3, minmax(0, 1fr));
  column-gap: 6px; row-gap: 6px; padding: 10px;
  color: var(--vmr-text-primary); overflow-y: auto; overflow-x: hidden;
}
.vmr-chapter-item {
  position: relative; padding: 16px 12px; border-radius: 6px; cursor: pointer;
  text-align: center; transition: all 0.2s; background: var(--vmr-bg-secondary);
  border: 1px solid var(--vmr-border-color);
}
.vmr-chapter-item:hover { background: var(--vmr-hover-bg); border-color: var(--vmr-active-bg); }
.vmr-chapter-item.active {
  background: var(--vmr-active-bg); color: var(--vmr-active-text);
  border-color: var(--vmr-active-bg);
}
.vmr-chapter-name {
  font-size: 14px; font-weight: 500; overflow: hidden;
  white-space: nowrap; text-overflow: ellipsis;
}
.vmr-chapter-pagecount {
  position: absolute; top: 0; right: 0; padding: 1px 3px;
  font-size: 12px; color: var(--vmr-active-text); opacity: 0.75;
  background-color: var(--vmr-active-bg);
  border-top-right-radius: 5px; border-bottom-left-radius: 5px;
}
.vmr-chapter-update-time { font-size: 12px; color: var(--vmr-text-muted); margin-top: 4px; }
.vmr-chapter-item.active .vmr-chapter-update-time { color: rgba(255,255,255,0.8); }

.vmr-toolbar {
  position: absolute; top: 0; left: 0; height: 64px; padding-left: 20px;
  display: flex; justify-content: space-between; align-items: center;
  z-index: 999; transform: translateY(-100%); transition: all 0.3s ease-in-out; opacity: 0;
}
.vmr-toolbar.vmr-show { transform: translateY(0); opacity: 1; }
.vmr-toolbar.has-sidebar { padding-left: 375px; }
.vmr-toolbar-left { display: flex; gap: 10px; align-items: center; }
.vmr-toolbar .vmr-sidebar-toogle-btn {
  display: flex; align-items: center; justify-content: center;
  padding: 5px; cursor: pointer; font-size: 19px; line-height: 1;
  color: var(--vmr-text-primary); background: var(--vmr-button-bg);
  border: 1px solid var(--vmr-button-border); border-radius: 9999px; transition: all 0.2s;
}
.vmr-toolbar .vmr-sidebar-toogle-btn:hover {
  background: var(--vmr-button-hover-bg); border-color: var(--vmr-button-hover-border);
  color: var(--vmr-button-hover-text); transform: scale(1.1);
}
.vmr-breadcrumb {
  flex: 1; display: flex; align-items: center; gap: 8px; font-size: 14px;
  color: var(--vmr-text-primary); backdrop-filter: blur(4px); padding: 8px 16px;
  background: var(--vmr-bg-overlay); border: 1px solid var(--vmr-border-color);
  border-radius: 9999px;
}
.vmr-breadcrumb a { color: var(--vmr-text-primary) !important; text-decoration: none; transition: color 0.2s; }
.vmr-breadcrumb a:hover { color: var(--vmr-active-bg); text-decoration: underline; }
.vmr-breadcrumb-separator { color: var(--vmr-text-muted); }

.vmr-navbar {
  position: absolute; bottom: 24px; left: 50%; transform: translateX(-50%);
  width: 90%; max-width: 680px; user-select: none; z-index: 990; pointer-events: none;
  }
.vmr-navbar.vmr-show { pointer-events: auto; }
.vmr-progress {
  display: flex; align-items: center; gap: 12px; width: 100%; height: 44px;
  padding: 4px; color: var(--vmr-text-primary); border-radius: 9999px;
  border: 1px solid var(--vmr-border-color); background: var(--vmr-bg-overlay);
  backdrop-filter: blur(4px); box-sizing: border-box;
  transform: translateY(100%); opacity: 0; transition: all 0.3s ease-in-out;
}
.vmr-navbar.vmr-show .vmr-progress { transform: translateY(0); opacity: 1; }

.vmr-navbar-btn {
  display: flex; align-items: center; justify-content: center;
  width: 36px; height: 36px; font-size: 20px; border-radius: 50%;
  position: relative; cursor: pointer; transition: all 0.3s ease;
}
.vmr-navbar-btn .vmr-icon { transition: transform 0.3s ease; }
.vmr-navbar-btn.disabled { cursor: not-allowed; }
.vmr-navbar-btn.disabled .vmr-icon { opacity: 0.6; }
.vmr-navbar-btn:not(.disabled):hover {
  color: white; background: var(--vmr-btn-hover);
}
.vmr-setting-btn:hover .vmr-icon{ transform: rotate(90deg); }

.vmr-button-tooltip {
  position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%);
  margin-bottom: 8px; padding: 6px 12px; background: var(--vmr-bg-overlay);
  backdrop-filter: blur(8px); color: var(--vmr-text-primary);
  border: 1px solid var(--vmr-border-color); border-radius: 6px;
  font-size: 12px; white-space: nowrap; pointer-events: none;
  opacity: 0; visibility: hidden; transition: all 0.2s ease;
  box-shadow: var(--vmr-shadow); z-index: 1000;
}
.vmr-button-tooltip::after {
  content: ''; position: absolute; top: 100%; left: 50%;
  transform: translateX(-50%); border: 6px solid transparent;
  border-top-color: var(--vmr-bg-overlay);
}
.vmr-navbar-btn:hover .vmr-button-tooltip {
  opacity: 1; visibility: visible; transform: translateX(-50%) translateY(-4px);
}

.vmr-progress-status { font-size: 14px; min-width: 64px; text-align: center; }
.vmr-page-slider { position: relative; flex: 1 1 0%; }
.vmr-page-slider input {
  width: 100%; cursor: pointer; height: 6px; accent-color: var(--vmr-slider-accent-color);
  background-color: rgba(255, 255, 255, 0.2); border-radius: 9999px;
}

.vmr-slider-tooltip {
  position: absolute; top: -46px; left: var(--slider-position, 0%);
  transform: translateX(-50%); padding: 6px 12px; background: var(--vmr-bg-overlay);
  backdrop-filter: blur(8px); color: var(--vmr-text-primary);
  border: 1px solid var(--vmr-border-color); border-radius: 6px;
  font-size: 13px; font-weight: 500; white-space: nowrap; pointer-events: none;
  opacity: 0; visibility: hidden; transition: opacity 0.2s ease, visibility 0.2s ease, transform 0.2s ease;
  z-index: 1000; box-shadow: var(--vmr-shadow);
}
.vmr-slider-tooltip::after {
  content: ''; position: absolute; top: 100%; left: 50%;
  transform: translateX(-50%); border: 6px solid transparent;
  border-top-color: var(--vmr-bg-overlay);
}
.vmr-page-slider:hover .vmr-slider-tooltip {
  opacity: 1; visibility: visible; transform: translateX(-50%) translateY(-4px);
}

.vmr-pagination-status {
  position: absolute; bottom: 4px; right: 4px; padding: 4px 12px;
  font-size: 13px; line-height: 1; color: var(--vmr-text-primary);
  background: var(--vmr-bg-overlay); backdrop-filter: blur(4px);
  border: 1px solid var(--vmr-button-border); border-radius: 24px;
  user-select: none; white-space: nowrap;
  transform: translate(100%, 100%); transition: all 0.3s ease-in-out; opacity: 0; z-index: 980;
}
.vmr-pagination-status.vmr-show { transform: translate(0, 0); opacity: 1; }

.vmr-main-content {
  flex: 1; display: flex; flex-direction: column;
  overflow: hidden; position: relative;
}
.vmr-click-zones {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  display: flex; z-index: 1;
}
.vmr-click-zone { flex: 1; cursor: pointer; transition: background-color 0.2s; }
.vmr-click-zone:hover { background-color: rgba(0, 0, 0, 0.02); }
.vmr-click-zone.left {
  cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="white" stroke="black" stroke-width="2"><path d="M15 19l-7-7 7-7"/></svg>') 16 16, w-resize;
}
.vmr-click-zone.center { cursor: pointer; }
.vmr-click-zone.right {
  cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="white" stroke="black" stroke-width="2"><path d="M9 5l7 7-7 7"/></svg>') 16 16, e-resize;
}

.vmr-image-container {
  flex: 1; display: flex; padding: 0; height: 0;
  background: var(--vmr-bg-primary); position: relative; z-index: 0;
}
.vmr-manga-preload {
  position: absolute; top: 0; left: 0; width: 0; height: 0; overflow: hidden;
}
.vmr-manga-preload img { width: 0; height: 0; }
.vmr-manga-page {
  height: 100%; max-width: 100%; margin: 0 auto;
  background: var(--vmr-bg-secondary); box-shadow: var(--vmr-shadow);
  border-radius: 4px; overflow: hidden;
}
.vmr-manga-page img {
  width: auto; max-width: 100%; height: 100%; display: block; object-fit: contain;
}

.vmr-empty-state {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center; color: var(--vmr-text-muted);
}
.vmr-empty-state-icon { font-size: 64px; margin-bottom: 20px; }
.vmr-empty-state-text { font-size: 16px; }

.vmr-toast {
  position: absolute; top: 80px; left: 50%; transform: translateX(-50%);
  z-index: 10000; background-color: var(--vmr-toast-bg); color: var(--vmr-bg-secondary);
  padding: 10px 20px; border-radius: 4px; font-size: 14px;
  transition: opacity 0.3s; pointer-events: none; opacity: 0;
}
.vmr-toast.vmr-show { opacity: 1; }

.vmr-dialog {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: var(--vmr-dialog-overlay); display: flex;
  align-items: center; justify-content: center; z-index: 10002;
  opacity: 0; visibility: hidden; transition: all 0.3s;
}
.vmr-dialog.vmr-show { opacity: 1; visibility: visible; }
.vmr-dialog-box {
  background: var(--vmr-dialog-bg); border-radius: 8px;
  box-shadow: var(--vmr-dialog-shadow);
  transform: scale(0.9); transition: transform 0.3s;
}
.vmr-dialog.vmr-show .vmr-dialog-box { transform: scale(1); }

.vmr-confirm-box {
  padding: 24px; min-width: 320px; max-width: 400px;
}
.vmr-confirm-title {
  font-size: 18px; font-weight: bold; margin-bottom: 12px; color: var(--vmr-text-primary);
}
.vmr-confirm-message {
  font-size: 14px; color: var(--vmr-text-secondary);
  margin-bottom: 24px; line-height: 1.6;
}
.vmr-confirm-buttons { display: flex; gap: 12px; justify-content: flex-end; }
.vmr-confirm-buttons button {
  padding: 8px 20px; border: none; border-radius: 4px;
  cursor: pointer; font-size: 14px; transition: all 0.2s;
}
.vmr-btn-cancel { background: var(--vmr-cancel-btn-bg); color: var(--vmr-cancel-btn-text); }
.vmr-btn-cancel:hover { background: var(--vmr-cancel-btn-hover); }
.vmr-btn-confirm { background: var(--vmr-confirm-btn-bg); color: var(--vmr-confirm-btn-text); }
.vmr-btn-confirm:hover { background: var(--vmr-confirm-btn-hover); }

.vmr-settings-box {
  width: calc(100% - 24px); max-width: 640px; overflow: hidden;
}
.vmr-settings-header {
  padding: 20px 24px; border-bottom: 1px solid var(--vmr-border-color);
  display: flex; align-items: center; justify-content: center; position: relative;
}
.vmr-settings-title {
  font-size: 18px; font-weight: bold; color: var(--vmr-text-primary);
}
.vmr-settings-close {
  position: absolute; right: 16px; top: 50%; transform: translateY(-50%);
  width: 32px; height: 32px; border-radius: 50%; background: transparent;
  border: none; cursor: pointer; font-size: 24px; color: var(--vmr-text-secondary);
  display: flex; align-items: center; justify-content: center; transition: all 0.2s;
}
.vmr-settings-close:hover {
  background: var(--vmr-hover-bg); color: var(--vmr-text-primary);
}
.vmr-settings-content {
  padding: 24px; max-height: 60vh; overflow-y: auto; user-select: none;
}

.vmr-setting-item {
  display: grid; grid-template-columns: auto 1fr; gap: 8px 24px;
  align-items: center; margin-bottom: 24px;
}
.vmr-setting-item:last-child {
  margin-bottom: 0;
}
.vmr-setting-label {
  font-size: 14px; font-weight: 500;
  color: var(--vmr-text-primary);
}
.vmr-setting-options {
  display: flex; gap: 12px;
}
.vmr-radio {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 8px 24px; border-radius: 9999px; cursor: pointer;
  background: var(--vmr-button-bg); border: 1px solid var(--vmr-button-border);
  transition: all 0.2s; user-select: none; position: relative;
}
.vmr-radio:hover {
  background: var(--vmr-button-hover-bg); border-color: var(--vmr-button-hover-border);
}
.vmr-radio input[type="radio"] {
  display: none;
}
.vmr-radio input[type="radio"]:checked + .vmr-radio-label {
  color: var(--vmr-button-hover-text); font-weight: bold;
}
.vmr-radio:has(input[type="radio"]:checked) {
  border-color: var(--vmr-active-bg);
  box-shadow: 0 0 0 1px var(--vmr-active-bg) inset;
}
.vmr-radio-label {
  font-size: 14px; color: var(--vmr-text-primary);
  cursor: pointer;
}
.vmr-setting-hint {
  grid-column: 2; font-size: 12px; line-height: 16px;
  color: var(--vmr-text-muted); padding-left: 0; 
}

.vmr-reader-close-btn {
  position: fixed; top: 14px; right: 14px; width: 36px; height: 36px;
  border-radius: 50%; background: var(--vmr-action-btn-bg); color: white;
  border: none; cursor: pointer; font-size: 20px; display: flex;
  align-items: center; justify-content: center; transition: all 0.2s; z-index: 10001;
}
.vmr-reader-close-btn:hover { background: var(--vmr-btn-hover); transform: rotate(90deg); }

.vmr-open-btn {
  position: fixed; top: 14px; right: 14px; width: 36px; height: 36px;
  border-radius: 50%; background: var(--vmr-action-btn-bg); color: white;
  border: none; cursor: pointer; font-size: 20px; display: flex;
  align-items: center; justify-content: center; transition: all 0.2s; z-index: 999998;
}
.vmr-open-btn:hover { background: var(--vmr-btn-hover); font-size: 30px; }

::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: var(--vmr-scrollbar-track); }
::-webkit-scrollbar-thumb { background: var(--vmr-scrollbar-thumb); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: var(--vmr-scrollbar-thumb-hover); }
`

// ==================== 数据提取器 ====================

/**
 * 从再漫画网站提取数据
 */
function extractFromZaimanhua() {
  try {
    const win = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window
    if (!win.__NUXT__?.data) {
      console.error('[漫画阅读器>再漫画适配器] 未找到 __NUXT__ 数据')
      return null
    }

    const { getCationDetails, getChapters } = win.__NUXT__.data
    const comicInfo = getCationDetails?.data?.comicInfo
    const chapterInfo = getChapters?.data?.chapterInfo

    if (!comicInfo || !chapterInfo) {
      console.error('[漫画阅读器>再漫画适配器] 缺少必要数据')
      return null
    }

    const manga = {
      id: comicInfo.id,
      title: comicInfo.title || '未知标题',
      author: comicInfo.authorsTagList?.map((a) => a.tagName).join('、'),
      cover: comicInfo.cover,
      description: comicInfo.description,
      url: `${location.origin}/details/${chapterInfo.comic_id}`
    }

    const current = {
      id: chapterInfo.chapter_id,
      name: chapterInfo.title,
      url: win.location.href,
      images: chapterInfo.page_url || []
    }
    current.pageCount = current.images.length

    // 构建章节列表
    const chapterListData = comicInfo.chapterList?.[0]?.data || []
    const list = chapterListData
      .map((ch) => ({
        id: ch.chapter_id,
        name: ch.chapter_title,
        url: `./${ch.chapter_id}`,
        updateTime: formatTimestamp(ch.updatetime)
      }))
      .sort((a, b) => {
        const orderA =
          chapterListData.find((c) => c.chapter_id === a.id)?.chapter_order || 0
        const orderB =
          chapterListData.find((c) => c.chapter_id === b.id)?.chapter_order || 0
        return orderA - orderB
      })

    const currentIndex = list.findIndex((ch) => ch.id === current.id)
    const previous = currentIndex > 0 ? list[currentIndex - 1] : null
    const next = currentIndex < list.length - 1 ? list[currentIndex + 1] : null

    console.log('[漫画阅读器>再漫画适配器] 数据提取成功:', {
      manga: manga.title,
      currentChapter: current.name,
      totalChapters: list.length,
      totalPages: current.images.length
    })

    return { manga, chapter: { current, previous, next, list } }
  } catch (error) {
    console.error('[漫画阅读器>再漫画适配器] 提取失败:', error)
    return null
  }
}

/**
 * 从漫画柜网站提取数据
 */
async function extractFromManhuagui() {
  const evalKeyword = 'window["\\x65\\x76\\x61\\x6c"]'

  try {
    const scriptElement = Array.from(document.querySelectorAll('script')).find(
      (s) => s.innerText.includes(evalKeyword)
    )

    if (!scriptElement) {
      console.error('[漫画阅读器>漫画柜适配器] 未找到漫画信息脚本')
      return null
    }

    const rawData = new Function(
      'return ' + scriptElement.innerText.replace(evalKeyword, '')
    )()
    const jsonStr = rawData.substring(
      rawData.indexOf('{'),
      rawData.lastIndexOf('}') + 1
    )
    const chapterInfo = JSON.parse(jsonStr)
    const pageVariables = unsafeWindow.pVars

    if (!chapterInfo || !pageVariables) {
      console.error('[漫画阅读器>漫画柜适配器] 缺少必要数据')
      return null
    }

    const { bid, bname, bpic, cid, cname, len, files, sl, prevId, nextId } =
      chapterInfo

    const manga = {
      id: bid,
      title: bname || '未知标题',
      author: '未知作者',
      cover: bpic ? `https://cf.mhgui.com/cpic/h/${bpic}` : '',
      description: '',
      url: '.'
    }

    const current = {
      id: cid + '',
      name: cname,
      url: window.location.href,
      images: files.map(
        (f) => `${pageVariables.manga.filePath}${f}?e=${sl.e}&m=${sl.m}`
      ),
      pageCount: len
    }

    let previous = prevId
      ? { id: prevId, name: '上一章', url: `./${prevId}.html` }
      : null
    let next = nextId
      ? { id: nextId, name: '下一章', url: `./${nextId}.html` }
      : null

    // 尝试从缓存或详情页获取章节列表
    const cacheKey = `manhuagui-${manga.id}`
    const cache = $cache.get(cacheKey)
    const list = cache?.chapters || []
    let author = cache?.author || ''
    let description = cache?.description || ''

    if (cache) {
      console.log(`[漫画阅读器>漫画柜适配器] 使用缓存<${cacheKey}>`)
    } else {
      try {
        console.log('[漫画阅读器>漫画柜适配器] 从详情页提取章节列表')
        const resp = await fetch(manga.url)
        const html = await resp.text()
        const doc = new DOMParser().parseFromString(html, 'text/html')

        // 提取作者
        const authorEl = Array.from(
          doc.querySelectorAll('.book-detail .detail-list li span strong')
        ).find((el) => el.innerText.includes('作者'))

        if (authorEl) {
          author = Array.from(authorEl.parentElement.childNodes)
            .filter((n) => n !== authorEl)
            .map((n) => n.textContent)
            .join('')
        }

        // 提取简介
        const introAllEl = doc.querySelector('.book-detail #intro-all')
        if (introAllEl) {
          description = Array.from(introAllEl.childNodes)
            .map((item) => item.textContent)
            .join('\n')
        }

        // 提取章节列表
        const chapters = Array.from(
          doc.querySelectorAll('.chapter .chapter-list')
        )
          .reverse()
          .flatMap((cl) => Array.from(cl.querySelectorAll('ul')))
          .flatMap((ul) => Array.from(ul.querySelectorAll('li a')).reverse())
          .map((item) => {
            const url = item.href
            const pageCount =
              parseInt(item.querySelector('i')?.innerText) || null
            const idMatched = url.match(/\/comic\/\d+\/(\d+).html/)
            return {
              id: idMatched ? idMatched[1] : url,
              name: item.title,
              url,
              pageCount
            }
          })

        list.push(...chapters)
      } catch (error) {
        console.warn('[漫画阅读器>漫画柜适配器] 提取章节列表失败:', error)
      }
    }

    if (author) manga.author = author
    if (description) manga.description = description

    if (list.length > 0) {
      const currentIndex = list.findIndex((ch) => ch.id === current.id)
      if (currentIndex > 0) previous = list[currentIndex - 1]
      if (currentIndex < list.length - 1) next = list[currentIndex + 1]

      if (!cache) {
        const cacheData = { author, description, chapters: list }
        $cache.set(cacheKey, cacheData, 3600)
        console.log(`[漫画阅读器>漫画柜适配器] 保存缓存`, cacheData)
      }
    } else {
      list.push(current)
    }

    console.log('[漫画阅读器>漫画柜适配器] 数据提取成功:', {
      manga: manga.title,
      currentChapter: current.name,
      totalChapters: list.length,
      totalPages: current.images.length
    })

    return { manga, chapter: { current, previous, next, list } }
  } catch (error) {
    console.error('[漫画阅读器>漫画柜适配器] 提取失败:', error)
    return null
  }
}

// ==================== 网站适配器配置 ====================
const WEBSITE_ADAPTERS = [
  {
    name: '再漫画',
    spa: true,
    host: 'zaimanhua.com',
    pathnameRegEx: /^\/view\//,
    pathnamePollingDelay: 500,
    loadDelay: 1000,
    extract: extractFromZaimanhua
  },
  {
    name: '漫画柜',
    host: 'manhuagui.com',
    pathnameRegEx: /^\/comic\/\d+\/\d+.html/,
    extract: extractFromManhuagui
  }
]

// ==================== Vue应用 ====================
const ICON = {
  close: `<path d="M9.857 9.858 24 24m0 0 14.142 14.142M24 24 38.142 9.858M24 24 9.857 38.142"></path>`,
  fold: `<path d="M42 11H6M42 24H22M42 37H6M13.66 26.912l-4.82-3.118 4.82-3.118v6.236Z"></path>`,
  unfold: `<path d="M6 11h36M22 24h20M6 37h36M8 20.882 12.819 24 8 27.118v-6.236Z"></path>`,
  settings: `<path d="M18.797 6.732A1 1 0 0 1 19.76 6h8.48a1 1 0 0 1 .964.732l1.285 4.628a1 1 0 0 0 1.213.7l4.651-1.2a1 1 0 0 1 1.116.468l4.24 7.344a1 1 0 0 1-.153 1.2L38.193 23.3a1 1 0 0 0 0 1.402l3.364 3.427a1 1 0 0 1 .153 1.2l-4.24 7.344a1 1 0 0 1-1.116.468l-4.65-1.2a1 1 0 0 0-1.214.7l-1.285 4.628a1 1 0 0 1-.964.732h-8.48a1 1 0 0 1-.963-.732L17.51 36.64a1 1 0 0 0-1.213-.7l-4.65 1.2a1 1 0 0 1-1.116-.468l-4.24-7.344a1 1 0 0 1 .153-1.2L9.809 24.7a1 1 0 0 0 0-1.402l-3.364-3.427a1 1 0 0 1-.153-1.2l4.24-7.344a1 1 0 0 1 1.116-.468l4.65 1.2a1 1 0 0 0 1.213-.7l1.286-4.628Z"></path><path d="M30 24a6 6 0 1 1-12 0 6 6 0 0 1 12 0Z"></path>`,
  left: `<path d="M32 8.4 16.444 23.956 32 39.513"></path>`,
  right: `<path d="m16 39.513 15.556-15.557L16 8.4"></path>`
}

function getIcon(name, props = '') {
  if (!ICON[name]) return ''
  return `<svg ${props} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" class="vmr-icon vmr-icon-${name}" stroke-width="4" stroke-linecap="butt" stroke-linejoin="miter">${ICON[name]}</svg>`
}

function createVueApp() {
  const { createApp, ref, computed, reactive, watch } = Vue

  return createApp({
    setup() {
      // 漫画信息
      const manga = ref(null)

      // 章节信息
      const chapter = reactive({
        current: null,
        previous: null,
        next: null,
        list: []
      })

      // 页面状态
      const currentPageIndex = ref(0)
      const sliderValue = ref(1)

      // UI状态
      const isEntryVisible = ref(false)
      const isReaderVisible = ref(false)
      const isUIVisible = ref(false)
      const isSidebarVisible = ref(false)
      const isClickZoneLocked = ref(false)
      const isSettingsVisible = ref(false)

      // 主题
      const theme = ref(GM_getValue(CONFIG.THEME_KEY, CONFIG.DEFAULT_THEME))

      // 预载数量
      const preloadCount = ref(
        GM_getValue('vmr-preload-count', CONFIG.PRELOAD_OFFSET)
      )

      // Toast和对话框
      const toast = reactive({ isVisible: false, message: '', timer: null })
      const confirmDialog = reactive({
        isVisible: false,
        title: '',
        message: '',
        callback: null
      })

      // 计算属性
      const totalPages = computed(() => chapter.current?.images?.length || 0)
      const currentImage = computed(
        () => chapter.current?.images?.[currentPageIndex.value]
      )

      const preloadImages = computed(() => {
        if (!preloadCount.value || !chapter.current?.images) return []
        const offset = preloadCount.value
        return Array.from({ length: offset * 2 }, (_, i) => {
          const idx =
            i < offset
              ? currentPageIndex.value + i - offset
              : currentPageIndex.value + i - offset + 1
          return chapter.current.images[idx]
        }).filter(Boolean)
      })

      const hasNextChapter = computed(() => !!chapter.next)
      const hasPrevChapter = computed(() => !!chapter.previous)
      const isFirstPage = computed(() => currentPageIndex.value === 0)
      const isLastPage = computed(
        () => currentPageIndex.value >= totalPages.value - 1
      )

      const prevButtonTooltip = computed(() => {
        if (isFirstPage.value) return hasPrevChapter.value ? '上一章' : '到头了'
        return '上一页'
      })

      const nextButtonTooltip = computed(() => {
        if (isLastPage.value) return hasNextChapter.value ? '下一章' : '到头了'
        return '下一页'
      })

      // 方法
      const setData = (data, visible = true) => {
        console.log('[漫画阅读器] 接收到数据:', data)

        if (data.manga) manga.value = data.manga
        if (data.chapter) {
          if (data.chapter.current) {
            chapter.current = data.chapter.current
            currentPageIndex.value = 0
          }
          if (data.chapter.previous !== undefined)
            chapter.previous = data.chapter.previous
          if (data.chapter.next !== undefined) chapter.next = data.chapter.next
          if (data.chapter.list) chapter.list = data.chapter.list
        }

        if (visible) {
          isReaderVisible.value = true
          isClickZoneLocked.value = true

          setTimeout(() => {
            isUIVisible.value = true
            isSidebarVisible.value = true

            setTimeout(() => {
              // isUIVisible.value = false
              isSidebarVisible.value = false
              isClickZoneLocked.value = false
            }, CONFIG.AUTO_HIDE_DELAY)
          }, 100)
        }
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
        if (chapterData?.url) window.location.href = chapterData.url
      }

      const showConfirmDialog = (title, message, callback) => {
        Object.assign(confirmDialog, {
          title,
          message,
          callback,
          isVisible: true
        })
      }

      const handleConfirm = () => {
        confirmDialog.isVisible = false
        confirmDialog.callback?.()
      }

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

      const toggleTheme = () => {
        theme.value = theme.value === 'light' ? 'dark' : 'light'
        GM_setValue(CONFIG.THEME_KEY, theme.value)
      }

      const handleThemeChange = () => {
        GM_setValue(CONFIG.THEME_KEY, theme.value)
      }

      const handlePreloadCountChange = () => {
        GM_setValue('vmr-preload-count', preloadCount.value)
      }

      const toggleSettings = () => {
        isSettingsVisible.value = !isSettingsVisible.value
      }

      const closeSettings = () => {
        isSettingsVisible.value = false
      }

      const closeReader = () => {
        isReaderVisible.value = false
      }
      const openReader = () => {
        isReaderVisible.value = true
      }

      const handleLeftClick = () => {
        if (!isClickZoneLocked.value) prevPage()
      }
      const handleCenterClick = () => {
        if (!isClickZoneLocked.value) toggleToolbar()
      }
      const handleRightClick = () => {
        if (!isClickZoneLocked.value) nextPage()
      }

      const handleSliderInput = (event) => {
        const value = parseInt(event.target.value, 10)
        const min = parseInt(event.target.min, 10)
        const max = parseInt(event.target.max, 10)
        const percentage = ((value - min) / (max - min)) * 100
        event.target.parentElement.style.setProperty(
          '--slider-position',
          `${percentage}%`
        )
      }

      const handleSliderChange = (event) => {
        goToPage(parseInt(event.target.value, 10) - 1)
      }

      const showToast = (message, duration = CONFIG.TOAST_DURATION) => {
        toast.message = message
        toast.isVisible = true
        if (toast.timer) clearTimeout(toast.timer)
        toast.timer = setTimeout(() => {
          toast.isVisible = false
        }, duration)
      }

      // 键盘事件处理
      const handleKeydown = (event) => {
        if (!isReaderVisible.value) return

        const isFunctionKey =
          event.key.startsWith('F') &&
          event.key.length >= 2 &&
          event.key.length <= 3
        const hasModifier =
          event.shiftKey || event.ctrlKey || event.altKey || event.metaKey
        if (isFunctionKey || hasModifier) return

        event.preventDefault()
        event.stopPropagation()
        event.stopImmediatePropagation()

        switch (event.key) {
          case 'ArrowRight':
            nextPage()
            break
          case 'ArrowLeft':
            prevPage()
            break
          case 'Escape':
            if (confirmDialog.isVisible) handleCancel()
            else if (isSidebarVisible.value) isSidebarVisible.value = false
            else isUIVisible.value = false
            break
          case 'Enter':
            if (confirmDialog.isVisible) handleConfirm()
            break
        }
      }

      document.addEventListener('keydown', handleKeydown, true)

      // 监听器
      watch(currentPageIndex, (newIndex) => {
        sliderValue.value = newIndex + 1
        updateSliderPosition(newIndex + 1)
      })

      watch(isReaderVisible, (v) => {
        document.documentElement.classList.toggle('vmr-overflow-hidden', v)
        if (v) {
          setTimeout(() => {
            // 章节列表滚到到当前章节
            const el = document.querySelector('.vmr-chapter-item.active')
            if (el)
              el.scrollIntoView({ block: 'nearest', container: 'nearest' })
          }, 0)
        }
      })

      watch(totalPages, (newTotal) => {
        if (newTotal > 0) {
          setTimeout(() => updateSliderPosition(currentPageIndex.value + 1), 0)
        }
      })

      const updateSliderPosition = (value) => {
        const slider = document.querySelector('.vmr-page-slider input')
        if (slider) {
          const min = parseInt(slider.min, 10) || 1
          const max = parseInt(slider.max, 10) || 1
          const percentage = ((value - min) / (max - min)) * 100
          slider.parentElement.style.setProperty(
            '--slider-position',
            `${percentage}%`
          )
        }
      }

      return {
        manga,
        chapter,
        currentPageIndex,
        sliderValue,
        isEntryVisible,
        isReaderVisible,
        isUIVisible,
        isSidebarVisible,
        isClickZoneLocked,
        isSettingsVisible,
        theme,
        preloadCount,
        toast,
        confirmDialog,
        totalPages,
        currentImage,
        preloadImages,
        hasNextChapter,
        hasPrevChapter,
        isFirstPage,
        isLastPage,
        prevButtonTooltip,
        nextButtonTooltip,
        setData,
        goToPage,
        nextPage,
        prevPage,
        loadChapter,
        toggleSidebar,
        toggleToolbar,
        toggleTheme,
        handleThemeChange,
        handlePreloadCountChange,
        toggleSettings,
        closeSettings,
        closeReader,
        openReader,
        handleLeftClick,
        handleCenterClick,
        handleRightClick,
        handleSliderInput,
        handleSliderChange,
        showToast,
        showConfirmDialog,
        handleConfirm,
        handleCancel
      }
    },

    template: `
      <div v-if="isEntryVisible && !isReaderVisible" class="vmr-open-btn" @click="openReader" title="打开阅读器">📖</div>

      <div v-if="isReaderVisible" class="manga-reader-container" :data-theme="theme">
        <div class="vmr-reader-close-btn" @click="closeReader" title="关闭">
          ${getIcon('close')}
        </div>

        <div class="vmr-toast" :class="{ 'vmr-show': toast.isVisible }">{{ toast.message }}</div>

        <div class="vmr-dialog vmr-confirm-dialog" :class="{ 'vmr-show': confirmDialog.isVisible }" @click.self="handleCancel">
          <div class="vmr-dialog-box vmr-confirm-box">
            <div class="vmr-confirm-title">{{ confirmDialog.title }}</div>
            <div class="vmr-confirm-message">{{ confirmDialog.message }}</div>
            <div class="vmr-confirm-buttons">
              <button class="vmr-btn-cancel" @click="handleCancel">取消</button>
              <button class="vmr-btn-confirm" @click="handleConfirm">确认</button>
            </div>
          </div>
        </div>

        <div class="vmr-dialog vmr-settings-dialog" :class="{ 'vmr-show': isSettingsVisible }" @click.self="closeSettings">
          <div class="vmr-dialog-box vmr-settings-box">
            <div class="vmr-settings-header">
              <div class="vmr-settings-title">阅读器设置</div>
              <button class="vmr-settings-close" @click="closeSettings" title="关闭">${getIcon('close')}</button>
            </div>
            <div class="vmr-settings-content">
              <div class="vmr-setting-item">
                <label class="vmr-setting-label">主题风格</label>
                <div class="vmr-setting-options">
                  <label class="vmr-radio">
                    <input type="radio" name="theme" value="light" v-model="theme" @change="handleThemeChange"/>
                    <span class="vmr-radio-label">亮色</span>
                  </label>
                  <label class="vmr-radio">
                    <input type="radio" name="theme" value="dark" v-model="theme" @change="handleThemeChange"/>
                    <span class="vmr-radio-label">暗色</span>
                  </label>
                </div>
              </div>
              <div class="vmr-setting-item">
                <label class="vmr-setting-label">预载数量</label>
                <div class="vmr-setting-options">
                  <label v-for="n in 6" :key="n - 1" class="vmr-radio">
                    <input type="radio" name="preloadCount" :value="n - 1" v-model.number="preloadCount" @change="handlePreloadCountChange"/>
                    <span class="vmr-radio-label">{{ n - 1 }}</span>
                  </label>
                </div>
                <div class="vmr-setting-hint">{{ preloadCount === 0 ? '当前页前后不进行预载' : '当前页前后各预载' + preloadCount + '页' }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="vmr-sidebar" :class="{ 'vmr-show': isUIVisible && isSidebarVisible }">
          <div class="vmr-sidebar-header">
            <a v-if="manga?.url" class="vmr-manga-title" :href="manga.url" target="_blank" rel="noopener noreferrer">{{ manga?.title || '未加载漫画' }}</a>
            <div v-else class="vmr-manga-title">{{ manga?.title || '未加载漫画' }}</div>
            <div class="vmr-manga-author">{{ manga?.author || '未知作者' }}</div>
            <div v-if="manga?.description" class="vmr-manga-desc">{{ manga.description }}</div>
          </div>

          <div class="vmr-chapter-info">
            <div class="vmr-current-chapter">
              当前: {{ chapter.current?.name || '未选择' }}
              <span v-if="chapter.current?.pageCount" class="vmr-current-chapter-pagecount">{{ chapter.current.pageCount }}P</span>
            </div>
            <div class="vmr-chapter-nav">
              <button :disabled="!hasPrevChapter" @click="loadChapter(chapter.previous)">← 上一章</button>
              <button :disabled="!hasNextChapter" @click="loadChapter(chapter.next)">下一章 →</button>
            </div>
          </div>

          <div class="vmr-chapter-list">
            <div v-for="ch in chapter.list" :key="ch.id" class="vmr-chapter-item" :class="{ active: chapter.current?.id === ch.id }" :title="ch.name" @click="loadChapter(ch)">
              <div v-if="ch.pageCount" class="vmr-chapter-pagecount">
                {{ ch.pageCount }}P</div>
              <div class="vmr-chapter-name">
                {{ ch.name }}</div>
              <div class="vmr-chapter-update-time" v-if="ch.updateTime">{{ ch.updateTime }}</div>
            </div>
          </div>
        </div>

        <div class="vmr-toolbar" :class="{ 'vmr-show': isUIVisible, 'has-sidebar': isSidebarVisible }">
          <div class="vmr-toolbar-left">
            <div class="vmr-sidebar-toogle-btn" @click="toggleSidebar" :title="isSidebarVisible ? '隐藏侧边栏' : '显示侧边栏'">
              ${getIcon('fold', 'v-if="isSidebarVisible"')}
              ${getIcon('unfold', 'v-else')}
            </div>
            <div v-if="!isSidebarVisible" class="vmr-breadcrumb">
              <a v-if="manga?.url" :href="manga.url" target="_blank" rel="noopener noreferrer">{{ manga?.title || '未加载漫画' }}</a>
              <span v-else>{{ manga?.title || '未加载漫画' }}</span>
              <span class="vmr-breadcrumb-separator">/</span>
              <span>{{ chapter.current?.name || '未选择章节' }}</span>
            </div>
          </div>
        </div>

        <div class="vmr-navbar" :class="{ 'vmr-show': isUIVisible }">
          <div class="vmr-progress">
            <div class="vmr-navbar-btn vmr-progress-perv" :class="{ disabled: currentPageIndex <= 0 && !hasPrevChapter, 'child-icon-rotate-90': currentPageIndex <= 0 }" @click="prevPage">
              ${getIcon('left')}
              <div class="vmr-button-tooltip">{{ prevButtonTooltip }}</div>
            </div>
            <div class="vmr-progress-status">{{ currentPageIndex + 1 }} / {{ totalPages }}</div>
            <div class="vmr-page-slider">
              <input type="range" min="1" :max="totalPages" v-model.number="sliderValue" @input="handleSliderInput" @change="handleSliderChange"/>
              <div class="vmr-slider-tooltip">{{ sliderValue }}</div>
            </div>
            <div class="vmr-navbar-btn vmr-setting-btn" @click="toggleSettings">
              ${getIcon('settings')}
              <div class="vmr-button-tooltip">设置</div>
            </div>
            <div class="vmr-navbar-btn vmr-progress-next" :class="{ disabled: currentPageIndex >= totalPages - 1 && !hasNextChapter, 'child-icon-rotate-90': currentPageIndex >= totalPages - 1 }" @click="nextPage">
              ${getIcon('right')}
              <div class="vmr-button-tooltip">{{ nextButtonTooltip }}</div>
            </div>
          </div>
        </div>

        <div class="vmr-pagination-status" :class="{ 'vmr-show': !isUIVisible }">
          {{ currentPageIndex + 1 }} / {{ totalPages }}
        </div>

        <div class="vmr-main-content">
          <div class="vmr-click-zones">
            <div class="vmr-click-zone left" @click="handleLeftClick"></div>
            <div class="vmr-click-zone center" @click="handleCenterClick"></div>
            <div class="vmr-click-zone right" @click="handleRightClick"></div>
          </div>

          <div class="vmr-image-container">
            <div v-if="currentImage" class="vmr-manga-page">
              <img :src="currentImage" :alt="'第' + (currentPageIndex + 1) + '页'" />
            </div>

            <div v-else class="vmr-empty-state">
              <div class="vmr-empty-state-icon">📖</div>
              <div class="vmr-empty-state-text">暂无内容，请使用 $vmr.setMangaData 加载漫画数据</div>
            </div>
            
            <div class="vmr-manga-preload">
              <img v-for="imgUrl of preloadImages" :src="imgUrl" alt="预加载" />
            </div>
          </div>
        </div>
      </div>
    `
  })
}

// ==================== 全局API ====================
function setEntryVisible(visible) {
  if (!window.$vm) return console.error('[漫画阅读器] Vue应用未初始化')
  window.$vm.setupState.isEntryVisible = visible
  console.log(`[漫画阅读器] ${visible ? '启用' : '禁用'}阅读器入口`)
}

function setReaderVisible(visible) {
  if (!window.$vm) console.error('[漫画阅读器] Vue应用未初始化')
  if (visible) {
    window.$vm.setupState.openReader()
  } else {
    window.$vm.setupState.closeReader()
  }
  console.log(`[漫画阅读器] ${visible ? '显示' : '隐藏'}阅读器界面`)
}

function setMangaData(data) {
  if (!window.$vm) console.error('[漫画阅读器] Vue应用未初始化')
  window.$vm.setupState.setData(data)
  console.log('[漫画阅读器] 数据已设置')
}

function exposeGlobalAPI() {
  const win = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window
  win.$vmr = {
    $vm: window.$vm,
    setMangaData,
    setEntryVisible,
    setReaderVisible
  }
  console.log('[漫画阅读器] 全局API已暴露: $vmr', $vmr)
}

// ==================== 数据加载器 ====================
function getWebsite() {
  const host = location.host
  console.log('[漫画阅读器] 查找站点配置:', host)
  const website = WEBSITE_ADAPTERS.find((site) => host.includes(site.host))
  if (website) {
    console.log('[漫画阅读器] 当前站点配置:', website)
    return website
  }
  console.log(`[漫画阅读器] 未找到${host}对应的站点配置`)
}

function checkReadPage(website) {
  const pathname = location.pathname
  if (!website.pathnameRegEx) {
    console.log(`[漫画阅读器] ${website.name} 未配置阅读页路径规则`)
    return false
  }
  const isMatch = website.pathnameRegEx.test(pathname)
  console.log(`[漫画阅读器] 阅读页匹配: ${pathname} ${isMatch ? '✓' : '✗'}`)
  return isMatch
}

async function loadMangaData(website, skipCheck = false) {
  try {
    if (!skipCheck && !checkReadPage(website)) throw new Error('非阅读页！')
    console.log(`[漫画阅读器] 检测到${website.name}，开始提取数据...`)
    const data = await website.extract()
    if (data) {
      setMangaData(data)
      console.log('[漫画阅读器] 数据加载成功')
    } else {
      console.warn('[漫画阅读器] 未能提取到数据')
    }
  } catch (error) {
    console.error(`[漫画阅读器] ${website.name}数据提取失败:`, error)
  }
}

// T 针对非Hash模式下的SPA的pathname变化监听
let lastPathname = ''
let pathnameTimer = null

function stopPathnameTimer() {
  if (!pathnameTimer) return
  clearInterval(pathnameTimer)
  pathnameTimer = null
}

function startPathnameTimer(fn = () => {}, delay = 500) {
  stopPathnameTimer()
  lastPathname = location.pathname
  pathnameTimer = setInterval(() => {
    const currentPathname = window.location.pathname
    if (currentPathname !== lastPathname) {
      console.log('[漫画阅读器] 检测到路由变化！新路径为:', currentPathname)
      if (typeof fn === 'function') fn()
      lastPathname = currentPathname
    }
  }, delay)
}

// ==================== 主程序入口 ====================
;(function () {
  'use strict'
  // 清理过期缓存
  $cache.clearExpired()
  // 站点匹配
  const website = getWebsite()
  if (!website) {
    console.log('[漫画阅读器] 未找到站点配置，不进行初始化')
    return
  }

  console.log('[漫画阅读器] 阅读器初始化...')
  // Vue注入
  if (!unsafeWindow.Vue) unsafeWindow.Vue = Vue
  // 注入样式
  GM_addStyle(STYLES)
  // 创建容器
  const container = document.createElement('div')
  container.id = 'vue-manga-reader'
  document.body.appendChild(container)
  // 创建Vue应用挂载容器并将实例暴露在window
  const app = createVueApp()
  const $vm = app.mount(container)
  window.$vm = $vm._
  // 暴露全局API
  exposeGlobalAPI()

  function loadData() {
    const isReadPage = checkReadPage(website)
    // 延迟加载数据
    if (isReadPage) {
      setTimeout(() => {
        loadMangaData(website, true)
      }, website.loadDelay || 0)
    }
    setEntryVisible(isReadPage)
    return isReadPage
  }

  loadData()

  if (website.spa) {
    startPathnameTimer(() => {
      const isReadPage = loadData()
      if (!isReadPage) setReaderVisible(false)
    }, website.pathnamePollingDelay)
  }
})()
