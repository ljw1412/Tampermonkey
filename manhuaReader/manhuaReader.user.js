// ==UserScript==
// @name         漫画阅读器
// @namespace    http://tampermonkey.net/
// @version      2.5.2
// @description  基于Vue的漫画阅读器，提供统一的阅读界面和数据接口
// @author       huomangrandian、Lingma
// @match        https://manhua.zaimanhua.com/*
// @match        https://www.manhuagui.com/comic/*/*.html
// @match        https://m.happymh.com/mangaread/*
// @match        https://www.2026copy.com/comic/*/chapter/*
// @require      https://unpkg.com/vue@3/dist/vue.global.prod.js
// @require      https://unpkg.com/@vueuse/shared
// @require      https://unpkg.com/@vueuse/core
// @require      https://scriptcat.org/lib/637/1.4.5/ajaxHooker.js
// @require      https://cdn.bootcdn.net/ajax/libs/crypto-js/4.2.0/crypto-js.min.js
// @grant        unsafeWindow
// @grant        GM_addStyle
// @grant        GM_deleteValue
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_listValues
// ==/UserScript==

/* global Vue ajaxHooker */
// TODO 是否在切换上下页时隐藏UI
// ==================== 常量配置 ====================
const CONFIG = {
  APP_NAME: '漫画阅读器',
  CACHE_PREFIX: 'cache_',
  AUTO_HIDE_DELAY: 1000,
  HIGHLIGHT_ACTIVE_CHAPTER_DELAY: 1000,
  TOAST_DURATION: 2000
}

const SETTINGS = {
  theme: {
    key: 'vmr-theme',
    options: [
      { label: '亮色', value: 'light' },
      { label: '暗色', value: 'dark' }
    ],
    default: 'light'
  },
  layout: {
    key: 'vmr-layout-mode',
    options: [
      { label: '左右翻页', value: 'paged' },
      { label: '垂直滚动', value: 'vertical' },
      { label: '水平滚动', value: 'horizontal' }
    ],
    default: 'paged'
  },
  vPageWidth: {
    key: 'vmr-page-width-on-vertical',
    options: [
      { label: '自动', value: 'auto' },
      { label: '600x', value: '600px' },
      { label: '800x', value: '800px' },
      { label: '1000x', value: '1000px' },
      { label: '1200x', value: '1200px' },
      { label: '100%', value: '100%' }
    ],
    default: 'auto'
  },
  preload: {
    key: 'vmr-preload-count',
    options: [
      { label: '关', value: 0 },
      ...Array.from({ length: 5 }, (_, i) => ({
        label: `${i + 1}组`,
        value: i + 1
      }))
    ],
    default: 2
  },
  statusBar: {
    key: 'vmr-status-bar-mode',
    options: [
      { label: '不显示', value: 'none' },
      { label: '导航条', value: 'slider' },
      { label: '底部条', value: 'bottom' },
      { label: '都显示', value: 'both' }
    ],
    default: 'none'
  },
  paginationBar: {
    key: 'vmr-pagination-bar-mode',
    options: [
      // { label: '不显示', value: 'none' },
      { label: '占位', value: 'block' },
      { label: '悬浮', value: 'fixed' }
    ],
    default: 'block'
  }
}

// ==================== 工具类 ====================

/**
 * 缓存管理器
 */
class CacheManager {
  constructor(prefix = CONFIG.CACHE_PREFIX) {
    this.prefix = prefix
  }

  set(key, data, ttlSeconds = 600) {
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

  list() {
    return GM_listValues().reduce((obj, key) => {
      obj[key] = GM_getValue(key, null)
      return obj
    }, {})
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
  const date = new Date(timestamp)
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

#vue-manga-reader a:hover { text-decoration: underline !important; }

/* 主题变量 - 亮色主题（默认） */
#vue-manga-reader {
  --vmr-bg-primary: #f5f5f5;
  --vmr-bg-secondary: #fff;
  --vmr-bg-overlay: rgba(255, 255, 255, 0.8);
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

  --vmr-toolbar-height: 64px;
  --vmr-slider-status-bg: rgba(0, 0, 0, 0.1);
  --vmr-pagination-bar-height: 12px;
  --vmr-pagination-bar-gap-color: rgba(0, 0, 0, 0.3);
}

/* 暗色主题 */
.manga-reader-container[data-theme="dark"] {
  --vmr-bg-primary: #1a1a1a;
  --vmr-bg-secondary: #2d2d2d;
  --vmr-bg-overlay: rgba(45, 45, 45, 0.8);
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
  --vmr-slider-status-bg: rgba(255, 255, 255, 0.1);
  --vmr-pagination-bar-gap-color: rgba(255, 255, 255, 0.3);
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
  padding-top: 20px; color: white;
  background: linear-gradient(135deg, var(--vmr-gradient-start) 0%, var(--vmr-gradient-end) 100%);
}
.vmr-sidebar-header.no-desc { padding-bottom: 14px; }
.vmr-manga-title {
  margin-bottom: 8px; padding: 0 18px; font-size: 18px; line-height: 22px;font-weight: bold; word-break: break-all;
}
.vmr-manga-title a { color: inherit; }
.vmr-manga-author {
  margin: 6px 0; padding: 0 18px; font-size: 14px; opacity: 0.9; }
.vmr-manga-status-and-tags {
  display: flex; align-items: center; flex-wrap: wrap;
  margin: 6px 0; padding: 0 18px; opacity: 0.9; }
.vmr-manga-status-and-tags > * {
  flex-shrink: 0; display: inline-block; box-sizing: content-box;
  margin-bottom: 4px; padding: 4px; height: 10px; font-size: 10px;
  border: 1px solid currentColor; border-radius: 4px; }
.vmr-manga-status-and-tags > *:not(:last-child) { margin-right: 4px; }

.vmr-manga-desc {
  margin: 6px 0; padding: 0 18px;  color: white; opacity: 0.85;
  font-size: 13px; line-height: 1.4; min-height: 1.4em; max-height: 5.6em;
  overflow-y: auto; word-break: break-all; box-sizing: content-box; flex-shrink: 0;
}
.vmr-manga-desc::-webkit-scrollbar-track { background: transparent; }

.vmr-chapter-group-list { flex-grow: 1; user-select: none; overflow-y: auto; overflow-x: hidden; }
.vmr-chapter-group{ padding: 0 10px 10px; }
.vmr-chapter-group-title { position: sticky; top: 0; z-index: 1; 
  padding: 10px 0; text-align: center; color: var(--vmr-text-primary); 
  font-size: 16px; font-weight: bold; background: var(--vmr-bg-secondary);}
.vmr-chapter-list {
  display: grid; grid-template-columns: repeat(3, minmax(0, 1fr));
  column-gap: 6px; row-gap: 6px; color: var(--vmr-text-primary);
}
.vmr-chapter-item {
  position: relative; padding: 16px 12px; border-radius: 6px; cursor: pointer;
  text-align: center; transition: all 0.2s; background: var(--vmr-bg-secondary);
  border: 1px solid var(--vmr-border-color); outline: 1px solid transparent;
}
.vmr-chapter-item:hover { background: var(--vmr-hover-bg); border-color: var(--vmr-active-bg); }
.vmr-chapter-item.active {
  background: var(--vmr-active-bg); color: var(--vmr-active-text);
  border-color: var(--vmr-active-bg);
}
.vmr-chapter-item.active.highlight {
  outline-color: var(--vmr-active-text); 
  box-shadow: 0 0 24px var(--vmr-active-bg);
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


.vmr-chapter-info {
  flex-shrink: 0; padding: 16px 18px; background: var(--vmr-bg-primary);
  border-top: 1px solid var(--vmr-border-color);
}
.vmr-current-chapter { font-size: 14px; color: var(--vmr-text-primary); margin-bottom: 5px; }
.vmr-current-chapter-pagecount { font-size: 12px; opacity: 0.75; }
.vmr-chapter-nav { display: flex; gap: 10px; margin-top: 10px; }
.vmr-chapter-nav button {
  flex: 1; display: flex; justify-content: center; align-items: center;
  border: none; border-radius: 4px; padding: 0 12px; height: 30px;
  background: var(--vmr-confirm-btn-bg); color: white; cursor: pointer;
  font-size: 13px; outline: 1px solid transparent; transition: all 0.3s;
}
.vmr-chapter-nav button.vmr-auto-btn { flex: 0 1 auto; }
.vmr-chapter-nav button:not(:disabled):hover { 
  background: var(--vmr-confirm-btn-hover); 
  outline-color: var(--vmr-confirm-btn-bg); 
  box-shadow: 0 0 12px var(--vmr-confirm-btn-bg); }
.vmr-chapter-nav button:disabled {
  color: var(--vmr-disabled-color); background: var(--vmr-disabled-bg);
  cursor: not-allowed; transform: none;
}
.vmr-chapter-nav button > span { margin: 0 0.5em; }

.vmr-toolbar {
  position: absolute; top: 0; left: 0; height: var(--vmr-toolbar-height); display: flex; justify-content: space-between; align-items: center; padding-left: 20px; z-index: 999; transform: translateY(-100%); transition: all 0.3s ease-in-out; opacity: 0;
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
.vmr-slider-stataus-bar {
  position: absolute; top: 50%; left: 0; width: 100%; height: 16px;
  transform: translateY(-50%); background: var(--vmr-slider-status-bg);
  border-radius: 9999px; overflow: hidden; z-index: -1;
}
.vmr-slider-status-progress { display: flex; width: 100%; height: 100%; }
.vmr-slider-status-block { flex: 1 1 0; }
.vmr-slider-status-block[data-status="-1"] { background: #f53f3f; }
.vmr-slider-status-block[data-status="0"] { background: #86909c; }
.vmr-slider-status-block[data-status="1"] { background: #00b42a; }
.vmr-slider-status-block[data-status="99"] { background: #ff7d00; }
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
  transform: translate(100%, 100%); transition: all 0.3s ease-in-out; opacity: 0; z-index: 980; pointer-events: none;
}
.vmr-pagination-status.has-pagination-bar {
  bottom: calc( 4px + var(--vmr-pagination-bar-height));
}
.vmr-pagination-status.vmr-show { transform: translate(0, 0); opacity: 1; }

.vmr-main-content {
  flex: 1; display: flex; flex-direction: column;
  overflow: hidden; position: relative; user-select: none;
}
.vmr-click-zones {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  display: flex; z-index: 1;
}
.vmr-click-zone { flex: 1; transition: background-color 0.2s; }
.vmr-click-zone:hover { background-color: rgba(0, 0, 0, 0.02); }
.vmr-click-zone.zone-left {
  cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="white" stroke="black" stroke-width="2"><path d="M15 19l-7-7 7-7"/></svg>') 16 16, w-resize;
}
.vmr-click-zone.zone-center { cursor: pointer; }
.vmr-click-zone.zone-right {
  cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="white" stroke="black" stroke-width="2"><path d="M9 5l7 7-7 7"/></svg>') 16 16, e-resize;
}

.vmr-manga-container {
  flex: 1; display: flex; padding: 0; height: 0;
  background: var(--vmr-bg-primary); position: relative; z-index: 0;
}
.vmr-manga-preload {
  position: absolute; top: 0; left: 0; width: 0; height: 0; overflow: hidden;
}
.vmr-manga-preload img { width: 0; height: 0; }
.vmr-manga-page { position: relative; margin: 0 auto; background: var(--vmr-bg-secondary); }
.vmr-manga-page img { width: auto; max-width: 100%; height: 100%; display: block; object-fit: contain; }

.vmr-manga-page-num { position: absolute; bottom: 4px; right: 4px; pointer-events: none; z-index: 10; }
.vmr-manga-page-num > span { 
  display: inline-block; padding: 2px 6px;
  font-size: 12px; line-height: 1; color: var(--vmr-text-primary);
  background: var(--vmr-bg-overlay); backdrop-filter: blur(4px);
  border: 1px solid var(--vmr-button-border); border-radius: 9999px;
  user-select: none; white-space: nowrap;
}

.vmr-chapter-comments {
  height: 100%; width: 100%; max-width: 680px; margin: 0 auto; padding: 16px;
  background: var(--vmr-bg-secondary); box-shadow: var(--vmr-shadow);
  transition: all 0.3s ease-in-out;
}
.vmr-chapter-comments.vmr-safe-ui {
  padding-top: calc(16px + var(--vmr-toolbar-height));
}
.vmr-chapter-comments-title {
  font-size: 24px; color: var(--vmr-text-primary); font-weight: bold;
}
.vmr-chapter-comments-title > span { font-size: 16px; }
.vmr-chapter-comments-list {
  display: flex; flex-wrap: wrap; margin-top: 12px; color: var(--vmr-text-secondary);
}
.vmr-chapter-comment, .vmr-chapter-comment > * { font-size: 16px; }
.vmr-chapter-comment {
  padding: 6px 10px; margin: 0 6px 6px 0;
  border: 1px solid var(--vmr-border-color); border-radius: 9999px;
}

.vmr-main-content[data-mode="paged"] .vmr-manga-page {
  height: 100%; max-width: 100%; box-shadow: var(--vmr-shadow);
}
.vmr-main-content[data-mode="vertical"] { cursor: pointer; }
.vmr-main-content[data-mode="vertical"] .vmr-click-zones { 
  flex-direction: column;
}
.vmr-main-content[data-mode="vertical"] .vmr-click-zone { 
  width: 100%;
}
.vmr-main-content[data-mode="vertical"] .vmr-manga-container {
  flex-direction: column; overflow-y: scroll;
}
.vmr-main-content[data-mode="vertical"] .vmr-manga-page { 
  flex-shrink: 0; width: var(--vmr-vertical-page-width);
}
.vmr-main-content[data-mode="vertical"] .vmr-manga-page img {
  width: 100%; object-fit: initial;
}
.vmr-main-content[data-mode="vertical"] .vmr-manga-page-num {
  display: flex; align-items: flex-end; top: 4px; 
}
.vmr-main-content[data-mode="vertical"] .vmr-manga-page-num > span {
  position: sticky; bottom: 12px;
}
.vmr-main-content[data-mode="vertical"] .vmr-chapter-comments {
  min-height: 100vh;
}
.vmr-main-content[data-mode="horizontal"] .vmr-manga-container { 
  overflow-x: scroll;
}
.vmr-main-content[data-mode="horizontal"] .vmr-manga-page { 
  flex-shrink: 0; height: 100%; margin: 0 var(--vmr-horizontal-page-gap, 1px);
}
.vmr-main-content[data-mode="horizontal"] .vmr-chapter-comments {
  flex-shrink: 0; width: 100vw; max-width: 100vw;
}

.vmr-pagination-bar {
  flex-shrink: 0; display: flex; height: 0; z-index: 5;
  font-size: 12px; text-align: center; color: #ffffff;
  background: var(--vmr-slider-status-bg); opacity: 0;
  transform: translateY(100%); transition: all 0.3s ease-in-out; 
}
.vmr-pagination-bar.vmr-show { transform: translateY(0); opacity: 1;
  height: var(--vmr-pagination-bar-height); }
.vmr-pagination-bar.vmr-fixed {
  position: fixed; bottom: 0; left: 0; right: 0; z-index: 985;
}
.vmr-pagination-bar .vmr-slider-status-block {
  position: relative; cursor: pointer;
}
.vmr-pagination-bar .vmr-slider-status-block:hover::before {
  content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  z-index: 10; background: rgba(0, 0, 0, 0.2);
}
.vmr-pagination-bar .vmr-slider-status-block:hover .vmr-button-tooltip {
  opacity: 1; visibility: visible; transform: translateX(-50%);
  pointer-events: none;
}
.vmr-pagination-bar .vmr-slider-status-block:not(:last-child) {
  border-right: 1px solid var(--vmr-pagination-bar-gap-color);
}
.vmr-pagination-bar .vmr-slider-status-block.is-comment{
  background: rgba(22, 93, 255, 0.5); }
.vmr-pagination-bar .vmr-slider-status-block[data-status="-1"] {
  background: rgba(245, 63, 63, 0.5); }
.vmr-pagination-bar .vmr-slider-status-block[data-status="0"] {
  background: rgba(134, 144, 156, 0.5); }
.vmr-pagination-bar .vmr-slider-status-block[data-status="1"] {
  background: rgba(0, 180, 42, 0.5); }
.vmr-pagination-bar .vmr-slider-status-block[data-status="99"] {
  background: rgba(255, 125, 0, 0.5); }

.vmr-empty-state {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center; color: var(--vmr-text-muted);
}
.vmr-empty-state-icon { font-size: 64px; margin-bottom: 20px; }
.vmr-empty-state-text { font-size: 16px; }

.vmr-toast {
  position: absolute; top: 80px; left: 50%; transform: translateX(-50%); z-index: 10000; box-shadow: var(--vmr-shadow); background-color: var(--vmr-toast-bg); backdrop-filter: blur(4px); color: var(--vmr-bg-secondary);  padding: 10px 20px; border-radius: 4px; font-size: 14px; transition: opacity 0.3s; pointer-events: none; opacity: 0;
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
.vmr-settings-content { max-height: calc(100vh - 84px); padding: 24px; overflow-y: auto; user-select: none; }

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
  padding: 8px 18px; border-radius: 9999px; cursor: pointer;
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
async function extractFromZaimanhua() {
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
      author:
        comicInfo.authorsTagList?.map((a) => a.tagName).join('、') ||
        '未知作者',
      cover: comicInfo.cover,
      description: comicInfo.description,
      status: comicInfo.statusTagList?.[0]?.tagName || '未知状态',
      tags: [...comicInfo.cateTagList, ...comicInfo.themeTagList].map(
        (tag) => tag.tagName
      ),
      url: `${location.origin}/details/${chapterInfo.comic_id}`
    }

    const current = {
      id: chapterInfo.chapter_id,
      name: chapterInfo.title,
      url: win.location.href,
      images: chapterInfo.page_url || [],
      pageCount: chapterInfo.page_url?.length || 0,
      comments: []
    }

    // 构建章节列表
    const groups = comicInfo.chapterList.map((group) => ({
      title: group.title,
      data: group.data
        .map((ch) => ({
          id: ch.chapter_id,
          name: ch.chapter_title,
          url: `./${ch.chapter_id}`,
          updatedAt: formatTimestamp(ch.updatetime * 1000),
          order: ch.chapter_order
        }))
        .sort((a, b) => a.order - b.order)
    }))
    const list = groups
      .flatMap((group) => group.data)
      .sort((a, b) => a.order - b.order)

    const currentIndex = list.findIndex((ch) => ch.id === current.id)
    const previous = currentIndex > 0 ? list[currentIndex - 1] : null
    const next = currentIndex < list.length - 1 ? list[currentIndex + 1] : null

    console.log('[漫画阅读器>再漫画适配器] 数据提取成功:', {
      manga: manga.title,
      currentChapter: current.name,
      totalChapters: list.length,
      totalPages: current.images.length
    })

    return { manga, chapter: { current, previous, next, list, groups } }
  } catch (error) {
    console.error('[漫画阅读器>再漫画适配器] 提取失败:', error)
    return null
  }
}

/**
 * 从再漫画加载章节评论
 */
async function loadCommentsFromZaimanhua(data) {
  try {
    const { manga, chapter } = data
    const mangaId = manga.id
    const chapterId = chapter.current.id
    if (!mangaId || !chapterId) {
      console.error('[漫画阅读器>再漫画适配器] 缺少必要数据mangaId或chapterId')
      return null
    }
    const cacheKey = `zaimanhua-${mangaId}-${chapterId}-comments`
    const cache = $cache.get(cacheKey)
    if (cache) {
      console.log(`[漫画阅读器>再漫画适配器] 使用评论缓存<${cacheKey}>`)
      return cache
    }
    const url = `https://v4api.zaimanhua.com/app/v1/viewpoint/list?type=0&comicId=${mangaId}&chapterId=${chapterId}&page=0&channel=pc`
    const resp = await fetch(url)
    const json = await resp.json()
    console.log('[漫画阅读器>再漫画适配器] 获取评论数据:', json)
    const { list, total } = json.data
    const comments = (list || [])
      .map((item) => {
        if (!Array.isArray(item)) return null
        const [chId, , , , , like, uid, content] = item
        return { uid, like, content }
      })
      .filter(Boolean)
    $cache.set(cacheKey, comments, 3600)
    console.log(`[漫画阅读器>漫画柜适配器] 缓存评论<${cacheKey}>`, comments)
    return comments
  } catch (error) {
    console.error('[漫画阅读器>再漫画适配器] 评论加载失败:', error)
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

    const { bid, bname, bpic, finished } = chapterInfo

    const manga = {
      id: bid,
      title: bname || '未知标题',
      author: '未知作者',
      cover: bpic ? `https://cf.mhgui.com/cpic/h/${bpic}` : '',
      description: '',
      status: finished ? '已完结' : '连载中',
      tags: [],
      url: '.'
    }

    const { cid, cname, len, files, sl, prevId, nextId } = chapterInfo

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
    window.cacheKey = cacheKey
    const cache = $cache.get(cacheKey)
    let author = cache?.author || ''
    let description = cache?.description || ''
    let tags = cache?.tags || []
    let groups = cache?.groups || []
    let list = []

    if (cache) {
      console.log(`[漫画阅读器>漫画柜适配器] 使用缓存<${cacheKey}>`, cache)
    } else {
      try {
        console.log('[漫画阅读器>漫画柜适配器] 提取详情页基础信息和章节列表')
        const resp = await fetch(manga.url, { credentials: 'same-origin' })
        const html = await resp.text()
        const doc = new DOMParser().parseFromString(html, 'text/html')
        console.log('[漫画阅读器>漫画柜适配器] 详情页的文档', doc)
        // 修复高风险漫画隐藏的章节列表
        const hiddenViewStateEl = doc.querySelector('#__VIEWSTATE')
        if (hiddenViewStateEl) {
          const viewState = hiddenViewStateEl.value
          console.groupCollapsed('[漫画阅读器>漫画柜适配器] 发现章节被隐藏')
          console.log('加密的隐藏章节数据', viewState)
          if (viewState) {
            const chHTML = unsafeWindow.LZString.decompressFromBase64(viewState)
            console.log('隐藏章节解析结果', chHTML)
            const replacedEl = doc.querySelector('#erroraudit_show')
            replacedEl.outerHTML = chHTML
            hiddenViewStateEl.remove()
            console.groupEnd()
            console.log('[漫画阅读器>漫画柜适配器] 成功将章节插入指定位置')
          } else {
            console.groupEnd()
            console.error('[漫画阅读器>漫画柜适配器] 未找到隐藏章节的解密信息')
          }
        }
        // 提取作者
        const authorEl = Array.from(
          doc.querySelectorAll('.book-detail .detail-list li span strong')
        ).find((el) => el.innerText.includes('作者'))
        if (authorEl) {
          author = Array.from(authorEl.parentElement.childNodes)
            .filter((n) => n !== authorEl)
            .map((n) => n.textContent.trim().replace(/^,$/, '、'))
            .join('')
        }

        // 提取标签
        const tagLabelEl = Array.from(
          doc.querySelectorAll('.book-detail .detail-list li span strong')
        ).find((el) => ['剧情', '劇情'].some((t) => el.innerText.includes(t)))
        if (tagLabelEl) {
          tags = Array.from(tagLabelEl.parentElement.querySelectorAll('a')).map(
            (n) => n.textContent.trim()
          )
        }

        // 提取简介
        const introAllEl = doc.querySelector('.book-detail #intro-all')
        if (introAllEl) {
          description = Array.from(introAllEl.childNodes)
            .map((item) => item.textContent)
            .join('\n')
        }

        // 提取章节组列表
        const chapterGroups = Array.from(
          doc.querySelectorAll('.chapter .chapter-list')
        ).map((cl) => {
          let title = '章节'
          let prevEl = cl.previousElementSibling
          if (prevEl.classList.contains('chapter-page')) {
            prevEl = prevEl.previousElementSibling
          }
          if (prevEl.nodeName === 'H4') title = prevEl.innerText.trim()

          const data = Array.from(cl.querySelectorAll('ul'))
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

          return { title, data }
        })
        groups.push(...chapterGroups)
      } catch (error) {
        console.warn('[漫画阅读器>漫画柜适配器] 提取漫画信息失败:', error)
      }
    }

    if (author) manga.author = author
    if (description) manga.description = description
    if (tags.length) manga.tags = tags
    if (groups.length) list = groups.flatMap((group) => group.data)

    if (list.length > 0) {
      const currentIndex = list.findIndex((ch) => ch.id === current.id)
      if (currentIndex > 0) previous = list[currentIndex - 1]
      if (currentIndex < list.length - 1) next = list[currentIndex + 1]

      if (!cache) {
        const cacheData = { author, description, tags, groups }
        $cache.set(cacheKey, cacheData, 3600)
        console.log(`[漫画阅读器>漫画柜适配器] 缓存<${cacheKey}>`, cacheData)
      }
    } else {
      groups = [{ title: '章节', data: [current] }]
      list.push(current)
    }

    console.log('[漫画阅读器>漫画柜适配器] 数据提取成功:', {
      manga: manga.title,
      currentChapter: current.name,
      totalChapters: list.length,
      totalPages: current.images.length
    })

    return { manga, chapter: { current, previous, next, list, groups } }
  } catch (error) {
    console.error('[漫画阅读器>漫画柜适配器] 提取失败:', error)
    return null
  }
}

/**
 * 从拷贝漫画网站提取数据
 */
async function extractFromCopyManhua() {
  // 拷贝漫画AES解密函数
  const decryptData = (cct, contentKey) => {
    // 分割密钥：前16位作为AES IV，其余部分为加密数据
    const iv = contentKey.substring(0, 16)
    const contentData = contentKey.substring(16)
    const encryptedData = CryptoJS.enc.Base64.stringify(
      CryptoJS.enc.Hex.parse(contentData)
    )
    // 执行AES解密
    const decryptedBytes = CryptoJS.AES.decrypt(
      encryptedData,
      CryptoJS.enc.Utf8.parse(cct),
      {
        iv: CryptoJS.enc.Utf8.parse(iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      }
    )
    // 转换为字符串并解析JSON
    const decryptedText = CryptoJS.enc.Utf8.stringify(decryptedBytes).toString()
    // 解析JSON数据
    return JSON.parse(decryptedText)
  }

  try {
    const [, mangaId, chapterId] =
      location.pathname.match(this.pathnameRegEx) || []
    if (!mangaId || !chapterId) throw new Error('未找到漫画id或章节id')
    console.log(
      `[漫画阅读器>拷贝漫画适配器] 漫画id=${mangaId} 章节id=${chapterId}`
    )
    const { cct, contentKey } = unsafeWindow
    if (!cct || !contentKey) throw new Error('未找到漫画加密数据或密钥')
    console.groupCollapsed('[漫画阅读器>拷贝漫画适配器] 章节加密数据与密钥')
    console.log(`cct=${cct}\ncontentKey=${contentKey}`)
    console.groupEnd()
    const images = decryptData(cct, contentKey)
    console.log('[漫画阅读器>拷贝漫画适配器] 解密结果', images)

    const fullTitle = document.querySelector('h4.header')?.textContent || ''
    const [mangaTitle, ...chapterTitle] = fullTitle.split('/')

    const manga = {
      id: mangaId,
      title: mangaTitle || '未知标题',
      author: '未知作者',
      cover: '',
      description: '',
      status: '',
      tags: [],
      url: location.href.substring(0, location.href.indexOf('/chapter/'))
    }

    const current = {
      id: chapterId,
      name: chapterTitle.join('/'),
      url: window.location.href,
      images: images.map((img) => img.url),
      pageCount: images.length
    }

    let previous = null
    let next = null
    const preEl = document.querySelector('.comicContent-prev:not(.index) > a')
    const nextEl = document.querySelector('.comicContent-next > a')
    const preHref = preEl?.getAttribute('href')
    const nextHref = nextEl?.getAttribute('href')
    if (preHref) {
      previous = {
        id: preEl.href.match(this.pathnameRegEx)?.[2],
        name: '上一章',
        url: preHref
      }
    }
    if (nextHref) {
      next = {
        id: nextEl.href.match(this.pathnameRegEx)?.[2],
        name: '下一章',
        url: nextHref
      }
    }

    const cacheKey = `copymanhua-${mangaId}`
    window.cacheKey = cacheKey
    const cache = $cache.get(cacheKey)
    let author = cache?.author || ''
    let status = cache?.status || ''
    let description = cache?.description || ''
    let tags = cache?.tags || []
    let groups = cache?.groups || []
    let list = []

    if (cache) {
      console.log(`[漫画阅读器>拷贝漫画适配器] 使用缓存<${cacheKey}>`, cache)
    } else {
      try {
        console.log('[漫画阅读器>拷贝漫画适配器] 提取详情页基础信息')
        const resp = await fetch(manga.url, { credentials: 'same-origin' })
        const html = await resp.text()
        const doc = new DOMParser().parseFromString(html, 'text/html')
        console.log('[漫画阅读器>拷贝漫画适配器] 详情页的文档', doc)
        // 提取作者
        const authorEl = Array.from(
          doc.querySelectorAll('.comicParticulars-title-right li span')
        ).find((el) => el.innerText.includes('作者'))
        if (authorEl && authorEl.nextElementSibling) {
          author = Array.from(authorEl.nextElementSibling.children)
            .map((n) => n.textContent.trim())
            .join('、')
        }
        // 提取状态
        const statusEl = Array.from(
          doc.querySelectorAll('.comicParticulars-title-right li span')
        ).find((el) => ['状态', '狀態'].some((t) => el.innerText.includes(t)))
        if (statusEl && statusEl.nextElementSibling) {
          status = statusEl.nextElementSibling.textContent.trim()
        }
        // 提取描述
        const descriptionEl = doc.querySelector('.intro')
        if (descriptionEl) {
          description = descriptionEl.textContent.trim()
        }
        // 提取标签
        const tagsEl = doc.querySelector('.comicParticulars-tag')
        if (tagsEl) {
          tags = Array.from(tagsEl.children)
            .map((a) => a.textContent.trim().replace(/^#/, ''))
            .filter((n) => n)
        }
      } catch (error) {
        console.warn('[漫画阅读器>拷贝漫画适配器] 提取漫画信息失败:', error)
      }
      try {
        console.log('[漫画阅读器>拷贝漫画适配器] 获取章节列表信息')
        const resp = await fetch(`/comicdetail/${manga.id}/chapters`, {
          credentials: 'same-origin'
        })
        const json = await resp.json()
        // 目前详情页的ccz与阅读页的cct是一样的
        const ccz = cct
        const data = decryptData(ccz, json.results)
        console.log('[漫画阅读器>拷贝漫画适配器] 解密章节列表结果', data)
        const { build, groups: theGroups } = data
        const chapterGroups = Object.values(theGroups).map((group) => {
          const title = group.name
          const data = group.chapters.map((item) => {
            return { ...item, url: `./${item.id}` }
          })
          return { title, data }
        })
        groups.push(...chapterGroups)
      } catch (error) {
        console.warn('[漫画阅读器>拷贝漫画适配器] 获取章节列表失败:', error)
      }
    }

    if (author) manga.author = author
    if (status) manga.status = status
    if (description) manga.description = description
    if (tags.length) manga.tags = tags
    if (groups.length) list = groups.flatMap((group) => group.data)

    if (list.length > 0) {
      const currentIndex = list.findIndex((ch) => ch.id === current.id)
      if (currentIndex > 0) previous = list[currentIndex - 1]
      if (currentIndex < list.length - 1) next = list[currentIndex + 1]

      if (!cache) {
        const cacheData = { author, status, description, tags, groups }
        $cache.set(cacheKey, cacheData, 3600)
        console.log(`[漫画阅读器>拷贝漫画适配器] 缓存<${cacheKey}>`, cacheData)
      }
    } else {
      groups = [{ title: '章节', data: [current] }]
      list.push(current)
    }

    return { manga, chapter: { current, previous, next, list, groups } }
  } catch (error) {
    console.error('[漫画阅读器>拷贝漫画适配器] 提取失败:', error)
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
    extract: extractFromZaimanhua,
    loadComments: loadCommentsFromZaimanhua
  },
  {
    name: '漫画柜',
    host: 'manhuagui.com',
    pathnameRegEx: /^\/comic\/\d+\/\d+.html/,
    extract: extractFromManhuagui
  },
  {
    name: '嗨皮漫画',
    host: 'm.happymh.com',
    pathnameRegEx: /^\/mangaread\//,
    requestHooker: {
      filter: [
        { url: '/apis/manga/reading' },
        { url: '/apis/manga/chapterByPage' }
      ],
      hooker(request) {
        const { url, data } = request
        request.response = (res) => {
          if (res.status !== 200) return
          console.log('[漫画阅读器>requestHooker]', url, res)
          try {
            const json = JSON.parse(res.responseText || res.response)
            const { status, data, msg = '请求错误' } = json
            if (status !== 0) console.warn('[漫画阅读器>requestHooker]', msg)
            console.log(status, data)
            if (url.includes('/apis/manga/reading')) {
              const manga = {
                id: data.manga_id,
                title: data.manga_name,
                author: '',
                cover: data.manga_cover,
                status: data.isEn ? '已完结' : '连载中',
                url: `/manga/${data.manga_code}`
              }

              const current = {
                id: data.id,
                name: data.chapter_name,
                url: location.href,
                images: data.scans.map((item) =>
                  item.url.replace('q=50', 'q=99')
                ),
                pageCount: data.scans.length
              }
              const previous = data.pre_cid
                ? {
                    id: data.pre_cid,
                    name: '上一章',
                    url: `./${data.pre_cid}`
                  }
                : null
              const next = data.next_cid
                ? {
                    id: data.next_cid,
                    name: '下一章',
                    url: `./${data.next_cid}`
                  }
                : null
              const list = []
              const groups = [{ title: '章节', data: list }]

              setMangaData({
                manga,
                chapter: { current, previous, next, list, groups }
              })
            } else if (url.includes('/apis/manga/chapterByPage')) {
              const readerChapter = getReaderChapter() || {}
              const { items } = data
              const list = [
                ...items
                  .map((item) => ({
                    id: item.id,
                    name: item.chapterName,
                    url: `./${item.id}`,
                    order: item.order
                  }))
                  .reverse(),
                ...readerChapter.list
              ]
              const urlObj = new URL(res.finalUrl)
              const cid = parseInt(urlObj.searchParams.get('cid'))
              const currentIndex = list.findIndex((ch) => ch.id === cid)
              let previous = currentIndex > 0 ? list[currentIndex - 1] : null
              if (!previous && readerChapter.previous) {
                previous = readerChapter.previous
                if (~currentIndex) list.splice(currentIndex, 0, previous)
              }
              let next =
                currentIndex < list.length - 1 ? list[currentIndex + 1] : null
              if (!next && readerChapter.next) {
                next = readerChapter.next
                if (~currentIndex) list.splice(currentIndex + 1, 0, next)
              }
              const groups = [{ title: '章节', data: list }]
              setMangaData({ chapter: { previous, next, list, groups } })
            }
          } catch (error) {
            console.error('[漫画阅读器>requestHooker]', error)
          }
        }
      }
    }
  },
  {
    name: '拷贝漫画',
    host: '2026copy.com',
    pathnameRegEx: /\/comic\/(.+)\/chapter\/([0-9a-z-]+)/,
    extract: extractFromCopyManhua
  }
]

// ==================== Vue应用 ====================
const ICON = {
  close: `<path d="M9.857 9.858 24 24m0 0 14.142 14.142M24 24 38.142 9.858M24 24 9.857 38.142"></path>`,
  fold: `<path d="M42 11H6M42 24H22M42 37H6M13.66 26.912l-4.82-3.118 4.82-3.118v6.236Z"></path>`,
  unfold: `<path d="M6 11h36M22 24h20M6 37h36M8 20.882 12.819 24 8 27.118v-6.236Z"></path>`,
  settings: `<path d="M18.797 6.732A1 1 0 0 1 19.76 6h8.48a1 1 0 0 1 .964.732l1.285 4.628a1 1 0 0 0 1.213.7l4.651-1.2a1 1 0 0 1 1.116.468l4.24 7.344a1 1 0 0 1-.153 1.2L38.193 23.3a1 1 0 0 0 0 1.402l3.364 3.427a1 1 0 0 1 .153 1.2l-4.24 7.344a1 1 0 0 1-1.116.468l-4.65-1.2a1 1 0 0 0-1.214.7l-1.285 4.628a1 1 0 0 1-.964.732h-8.48a1 1 0 0 1-.963-.732L17.51 36.64a1 1 0 0 0-1.213-.7l-4.65 1.2a1 1 0 0 1-1.116-.468l-4.24-7.344a1 1 0 0 1 .153-1.2L9.809 24.7a1 1 0 0 0 0-1.402l-3.364-3.427a1 1 0 0 1-.153-1.2l4.24-7.344a1 1 0 0 1 1.116-.468l4.65 1.2a1 1 0 0 0 1.213-.7l1.286-4.628Z"></path><path d="M30 24a6 6 0 1 1-12 0 6 6 0 0 1 12 0Z"></path>`,
  location: `<circle cx="24" cy="19" r="5"></circle><path d="M39 20.405C39 28.914 24 43 24 43S9 28.914 9 20.405C9 11.897 15.716 5 24 5c8.284 0 15 6.897 15 15.405Z"></path>`,
  up: `<path d="M39.6 30.557 24.043 15 8.487 30.557"></path>`,
  down: `<path d="M39.6 17.443 24.043 33 8.487 17.443"></path>`,
  left: `<path d="M32 8.4 16.444 23.956 32 39.513"></path>`,
  right: `<path d="m16 39.513 15.556-15.557L16 8.4"></path>`,
  doubleUp: `<path d="M38.1 36.858 23.957 22.716 9.816 36.858M38.1 25.544 23.957 11.402 9.816 25.544"></path>`,
  doubleDown: `<path d="m9.9 11.142 14.143 14.142 14.142-14.142M9.9 22.456l14.143 14.142 14.142-14.142"></path>`,
  doubleLeft: `<path d="M36.857 9.9 22.715 24.042l14.142 14.142M25.544 9.9 11.402 24.042l14.142 14.142"></path>`,
  doubleRight: `<path d="m11.143 38.1 14.142-14.142L11.143 9.816M22.456 38.1l14.142-14.142L22.456 9.816"></path>`,
  caretUp: `<path d="M23.063 13.171a1.2 1.2 0 0 1 1.875 0l13.503 16.88c.628.785.069 1.949-.937 1.949H10.497c-1.006 0-1.565-1.164-.937-1.95l13.503-16.879Z" fill="currentColor" stroke="none"></path>`,
  caretDown: `<path d="M24.938 34.829a1.2 1.2 0 0 1-1.875 0L9.56 17.949c-.628-.785-.069-1.949.937-1.949h27.007c1.006 0 1.565 1.164.937 1.95L24.937 34.829Z" fill="currentColor" stroke="none"></path>`,
  caretLeft: `<path d="M13.171 24.937a1.2 1.2 0 0 1 0-1.874L30.051 9.56c.785-.629 1.949-.07 1.949.937v27.006c0 1.006-1.164 1.566-1.95.937L13.171 24.937Z" fill="currentColor" stroke="none"></path>`,
  caretRight: `<path d="M34.829 23.063c.6.48.6 1.394 0 1.874L17.949 38.44c-.785.629-1.949.07-1.949-.937V10.497c0-1.007 1.164-1.566 1.95-.937l16.879 13.503Z" fill="currentColor" stroke="none"></path>`
}

function getIcon(name, props = '') {
  if (!ICON[name]) return ''
  return `<svg ${props} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" class="vmr-icon vmr-icon-${name}" stroke-width="4" stroke-linecap="butt" stroke-linejoin="miter">${ICON[name]}</svg>`
}

const { ref, reactive, computed, watch } = Vue

function useConfigItem(key, defaultValue) {
  const value = ref(GM_getValue(key, defaultValue))
  watch(value, (val) => {
    GM_setValue(key, val)
    console.log(`[漫画阅读器>设置] 修改${key}为${val}`)
  })
  return value
}

function createVueApp() {
  const { createApp, useTemplateRef } = Vue
  const { useIntersectionObserver } = VueUse

  return createApp({
    setup() {
      // DOM Ref
      const readerContainerEl = useTemplateRef('readerContainerEl')
      const mangaContainerEl = useTemplateRef('mangaContainerEl')
      const mangaPageEls = useTemplateRef('mangaPageEls')
      const chapterCommentEl = useTemplateRef('chapterCommentEl')

      // 漫画信息
      const manga = ref({})

      // 章节信息
      const chapter = reactive({
        current: null,
        previous: null,
        next: null,
        groups: [],
        list: []
      })

      // 页面状态
      const pageIndex = ref(0)

      // UI状态
      const isEntryVisible = ref(false)
      const isReaderVisible = ref(false)
      const isUIVisible = ref(false)
      const isSidebarVisible = ref(false)
      const isClickZoneLocked = ref(false)
      const isSettingsVisible = ref(false)
      // 让当前章节高亮
      const isActiveChapterHighlight = ref(false)

      // 主题
      const theme = useConfigItem(SETTINGS.theme.key, SETTINGS.theme.default)

      // 布局模式
      const layoutMode = useConfigItem(
        SETTINGS.layout.key,
        SETTINGS.layout.default
      )

      // 垂直模式下的页面宽度
      const vPageWidth = useConfigItem(
        SETTINGS.vPageWidth.key,
        SETTINGS.vPageWidth.default
      )

      // 预载数量
      const preloadOffset = useConfigItem(
        SETTINGS.preload.key,
        SETTINGS.preload.default
      )

      // 加载状态栏模式
      const statusBarMode = useConfigItem(
        SETTINGS.statusBar.key,
        SETTINGS.statusBar.default
      )

      // 分页条显示的模式
      const paginationBarMode = useConfigItem(
        SETTINGS.paginationBar.key,
        SETTINGS.paginationBar.default
      )

      // Toast和对话框
      const toast = reactive({ isVisible: false, message: '', timer: null })
      const confirmDialog = reactive({
        isVisible: false,
        title: '',
        message: '',
        callback: null
      })

      // 导航进度条
      const sliderValue = ref(pageIndex.value + 1)
      const slider = computed(() => {
        const min = 1
        const max = totalPages.value || 1
        const percentage = ((sliderValue.value - min) / (max - min)) * 100
        const tooltipStyles = { '--slider-position': `${percentage}%` }
        const gapWidth = max > 1 ? 100 / (max - 1) : 0
        const statusBarStyles = {
          transform: `scaleX(${(100 + gapWidth / 2) / 100}) translateY(-50%)`
        }
        return { min, max, statusBarStyles, tooltipStyles }
      })
      // 当前章节的图片加载状况
      // -1: 加载失败  0/undefined: 未加载  1: 加载完成  99: 加载中
      const imgStatusList = ref([])

      // 计算属性
      const hasComments = computed(() =>
        Array.isArray(chapter.current?.comments)
      )
      const comments = computed(() => chapter.current?.comments || [])
      const currentPage = computed(() => pageIndex.value + 1)
      const totalPages = computed(() => chapter.current?.images?.length || 0)
      const currentImage = computed(
        () => chapter.current?.images?.[pageIndex.value]
      )

      const preloadImages = computed(() => {
        if (!preloadOffset.value || !chapter.current?.images) return []
        const offset = preloadOffset.value
        return Array.from({ length: offset * 2 }, (_, i) => {
          const idx =
            i < offset
              ? pageIndex.value + i - offset
              : pageIndex.value + i - offset + 1
          return { url: chapter.current.images[idx], index: idx }
        }).filter((item) => item.url)
      })

      const hasNextChapter = computed(() => !!chapter.next)
      const hasPrevChapter = computed(() => !!chapter.previous)
      const isFirstPage = computed(() => pageIndex.value <= 0)
      const isLastPage = computed(
        () => pageIndex.value >= totalPages.value - (hasComments.value ? 0 : 1)
      )
      const isCommentPage = computed(
        () => hasComments.value && pageIndex.value === totalPages.value
      )

      const pageStatusText = computed(() => {
        if (isCommentPage.value) return '评论'
        return `${currentPage.value} / ${totalPages.value}`
      })

      const prevButtonTooltip = computed(() => {
        if (isFirstPage.value) return hasPrevChapter.value ? '上一章' : '到头了'
        return '上一页'
      })

      const nextButtonTooltip = computed(() => {
        if (isLastPage.value) return hasNextChapter.value ? '下一章' : '到头了'
        if (hasComments.value && pageIndex.value + 1 === totalPages.value)
          return '评论'
        return '下一页'
      })

      // 方法
      const setData = (data, visible = true) => {
        console.log('[漫画阅读器] 接收到数据:', data)

        if (data.manga) manga.value = data.manga
        if (data.chapter) {
          if (data.chapter.current) {
            chapter.current = data.chapter.current
            pageIndex.value = 0
          }
          if (data.chapter.previous !== undefined)
            chapter.previous = data.chapter.previous
          if (data.chapter.next !== undefined) chapter.next = data.chapter.next
          if (data.chapter.list) chapter.list = data.chapter.list
          if (data.chapter.groups) {
            chapter.groups = data.chapter.groups
            scrollToActiveChapter()
          }
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

      const setComments = (comments) => {
        console.log('[漫画阅读器] 接收到评论数据:', comments)
        if (Array.isArray(comments) && chapter.current) {
          chapter.current.comments = comments
          console.log('[漫画阅读器] 当前章节的评论数据已更新！')
        } else {
          console.log('[漫画阅读器] 评论数据无效或当前章节数据不存在！')
        }
      }

      const highlightActiveChapterTimer = null
      const highlightActiveChapter = () => {
        if (highlightActiveChapterTimer) {
          clearTimeout(highlightActiveChapterTimer)
          highlightActiveChapterTimer = null
        }
        isActiveChapterHighlight.value = true
        highlightActiveChapterTimer = setTimeout(() => {
          isActiveChapterHighlight.value = false
        }, CONFIG.HIGHLIGHT_ACTIVE_CHAPTER_DELAY)
      }

      const nextChapter = () => {
        if (!hasNextChapter.value) return showToast('已经是最后一章了')
        showConfirmDialog(
          '跳转到下一章',
          `是否跳转到下一章《${chapter.next?.name || ''}》？`,
          () => {
            loadChapter(chapter.next)
          }
        )
      }

      const prevChapter = () => {
        if (!hasPrevChapter.value) return showToast('已经是第一章了')
        showConfirmDialog(
          '跳转到上一章',
          `是否跳转到上一章《${chapter.previous?.name || ''}》？`,
          () => {
            loadChapter(chapter.previous)
          }
        )
      }

      const scrollToPage = (index, behavior = 'instant') => {
        if (layoutMode.value === 'paged') return
        const pageEl = document.querySelector(
          hasComments.value && index === totalPages.value
            ? '.vmr-chapter-comments'
            : `.vmr-manga-page[data-page="${index + 1}"]`
        )
        if (pageEl) {
          pageEl.scrollIntoView({
            behavior,
            block: 'start',
            inline: 'center',
            container: 'nearest'
          })
        }
      }

      const goToPage = (index) => {
        const limit = totalPages.value - (hasComments.value ? 0 : 1)
        index = Math.max(Math.min(index, limit), 0)
        pageIndex.value = index
        scrollToPage(index, 'smooth')
      }

      const nextPage = () => {
        if (isUIVisible.value) isUIVisible.value = false
        if (
          pageIndex.value < totalPages.value - 1 ||
          (hasComments.value && pageIndex.value === totalPages.value - 1)
        ) {
          goToPage(pageIndex.value + 1)
        } else {
          nextChapter()
        }
      }

      const prevPage = () => {
        if (isUIVisible.value) isUIVisible.value = false
        if (pageIndex.value > 0) {
          goToPage(pageIndex.value - 1)
        } else {
          prevChapter()
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
      const toggleUI = () => {
        isUIVisible.value = !isUIVisible.value
      }

      const toggleTheme = () => {
        theme.value = theme.value === 'light' ? 'dark' : 'light'
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

      const handleMainContentClick = () => {
        if (layoutMode.value === 'vertical') toggleUI()
      }

      const handleLeftClick = () => {
        if (isClickZoneLocked.value) return
        prevPage()
      }
      const handleCenterClick = () => {
        if (isClickZoneLocked.value) return
        toggleUI()
      }
      const handleRightClick = () => {
        if (isClickZoneLocked.value) return
        nextPage()
      }

      const handleSliderChange = (event) => {
        goToPage(sliderValue.value - 1)
      }

      const showToast = (message, duration = CONFIG.TOAST_DURATION) => {
        toast.message = message
        toast.isVisible = true
        if (toast.timer) clearTimeout(toast.timer)
        toast.timer = setTimeout(() => {
          toast.isVisible = false
        }, duration)
      }

      // 侧边栏章节列表滚动到当前章节
      const scrollToActiveChapter = (highlight = false) => {
        setTimeout(() => {
          const el = document.querySelector('.vmr-chapter-item.active')
          if (el) {
            el.scrollIntoView({ block: 'center' })
            if (readerContainerEl.value) readerContainerEl.value.scrollTo(0, 0)
          }
          if (highlight) highlightActiveChapter()
        }, 0)
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
        // console.log(event)

        switch (event.key) {
          case 'ArrowUp':
            prevChapter()
            break
          case 'ArrowDown':
            nextChapter()
            break
          case 'ArrowRight':
            if (confirmDialog.isVisible) handleCancel()
            nextPage()
            break
          case 'ArrowLeft':
            if (confirmDialog.isVisible) handleCancel()
            prevPage()
            break
          case 'Escape':
            if (confirmDialog.isVisible) handleCancel()
            else if (isSettingsVisible.value) isSettingsVisible.value = false
            else if (isSidebarVisible.value) isSidebarVisible.value = false
            else isUIVisible.value = false
            break
          case ' ':
            if (!confirmDialog.isVisible) toggleUI()
            break
          case 'Enter':
            if (confirmDialog.isVisible) handleConfirm()
            else toggleUI()
            break
        }
      }

      document.addEventListener('keydown', handleKeydown, true)

      let mangaPageObserver = null
      function stopMangaPageObserver() {
        if (mangaPageObserver) {
          mangaPageObserver.stop()
          mangaPageObserver = null
          console.log('[漫画阅读器>漫画页监听器] 停止监听')
        }
      }
      function initMangaPageObserver() {
        stopMangaPageObserver()
        mangaPageObserver = useIntersectionObserver(
          () =>
            [mangaPageEls.value, chapterCommentEl.value].filter(Boolean).flat(),
          (entries, observerElement) => {
            entries = entries.filter((entry) => entry.isIntersecting)
            if (entries.length) {
              console.log('[漫画阅读器>漫画页监听器] 进场', entries[0].target)
              const page = entries[0].target.dataset.page
              if (page) pageIndex.value = Number(page) - 1
            }
          },
          { threshold: layoutMode.value === 'vertical' ? 0 : 1 }
        )
        console.log('[漫画阅读器>漫画页监听器] 启动监听')
      }

      // 监听器
      watch(isReaderVisible, (v) => {
        document.documentElement.classList.toggle('vmr-overflow-hidden', v)
        if (v) {
          scrollToActiveChapter()
          if (layoutMode.value === 'vertical') initMangaPageObserver()
        } else {
          stopMangaPageObserver()
        }
      })

      watch(pageIndex, (newIndex) => {
        sliderValue.value = newIndex + 1
      })

      watch(
        () => chapter.current?.images,
        () => {
          imgStatusList.value = []
        }
      )

      watch(layoutMode, (mode) => {
        stopMangaPageObserver()
        setTimeout(() => {
          if (mode !== 'paged') scrollToPage(pageIndex.value)
          if (mode === 'vertical') initMangaPageObserver()
        }, 300)
      })

      return {
        SETTINGS,
        readerContainerEl,
        mangaContainerEl,
        mangaPageEls,
        chapterCommentEl,
        manga,
        chapter,
        pageIndex,
        isEntryVisible,
        isReaderVisible,
        isUIVisible,
        isSidebarVisible,
        isClickZoneLocked,
        isSettingsVisible,
        isActiveChapterHighlight,
        theme,
        layoutMode,
        vPageWidth,
        preloadOffset,
        statusBarMode,
        paginationBarMode,
        toast,
        confirmDialog,
        currentPage,
        totalPages,
        currentImage,
        hasComments,
        comments,
        sliderValue,
        slider,
        imgStatusList,
        preloadImages,
        hasNextChapter,
        hasPrevChapter,
        isFirstPage,
        isLastPage,
        isCommentPage,
        pageStatusText,
        prevButtonTooltip,
        nextButtonTooltip,
        setData,
        setComments,
        highlightActiveChapter,
        scrollToPage,
        goToPage,
        nextPage,
        prevPage,
        loadChapter,
        toggleSidebar,
        toggleUI,
        toggleTheme,
        toggleSettings,
        closeSettings,
        closeReader,
        openReader,
        handleMainContentClick,
        handleLeftClick,
        handleCenterClick,
        handleRightClick,
        handleSliderChange,
        showToast,
        showConfirmDialog,
        handleConfirm,
        handleCancel,
        scrollToActiveChapter
      }
    },

    template: `
      <div v-if="isEntryVisible && !isReaderVisible" class="vmr-open-btn" @click="openReader" title="打开阅读器">📖</div>

      <div v-if="isReaderVisible" ref="readerContainerEl" class="manga-reader-container" :data-theme="theme">
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
                  <label v-for="item of SETTINGS.theme.options" class="vmr-radio">
                    <input type="radio" name="theme" :value="item.value" v-model="theme" />
                    <span class="vmr-radio-label">{{ item.label }}</span>
                  </label>
                </div>
              </div>

              <div class="vmr-setting-item">
                <label class="vmr-setting-label">阅读模式</label>
                <div class="vmr-setting-options">
                  <label v-for="item of SETTINGS.layout.options" class="vmr-radio">
                    <input type="radio" name="layoutMode" :value="item.value" v-model="layoutMode"/>
                    <span class="vmr-radio-label">{{ item.label }}</span>
                  </label>
                </div>
              </div>

              <div v-if="layoutMode === 'vertical'" class="vmr-setting-item"> 
                <label class="vmr-setting-label">显示宽度</label>
                <div class="vmr-setting-options">
                  <label v-for="item of SETTINGS.vPageWidth.options" class="vmr-radio">
                    <input type="radio" name="vPageWidth" :value="item.value" v-model="vPageWidth"/>
                    <span class="vmr-radio-label">{{ item.label }}</span>
                  </label>
                </div>
              </div>

              <div class="vmr-setting-item">
                <label class="vmr-setting-label">预载数量</label>
                <div class="vmr-setting-options">
                  <label v-for="item of SETTINGS.preload.options" class="vmr-radio">
                    <input type="radio" name="preloadOffset" :value="item.value" v-model.number="preloadOffset" />
                    <span class="vmr-radio-label">
                      {{ item.label || item.value }}
                    </span>
                  </label>
                </div>
                <div class="vmr-setting-hint">{{ preloadOffset === 0 ? '当前页前后不进行预载' : '当前页的前后各预载' + preloadOffset + '页' }}</div>
              </div>

              <div class="vmr-setting-item">
                <label class="vmr-setting-label">预载状况</label>
                <div class="vmr-setting-options">
                  <label v-for="item of SETTINGS.statusBar.options" class="vmr-radio">
                    <input type="radio" name="statusBarMode" :value="item.value" v-model="statusBarMode" />
                    <span class="vmr-radio-label">{{ item.label }}</span>
                  </label>
                </div>
              </div>

              <div v-if="['bottom', 'both'].includes(statusBarMode)" class="vmr-setting-item">
                <label class="vmr-setting-label">分页底条</label>
                <div class="vmr-setting-options">
                  <label v-for="item of SETTINGS.paginationBar.options" class="vmr-radio">
                    <input type="radio" name="paginationBarMode" :value="item.value" v-model="paginationBarMode" />
                    <span class="vmr-radio-label">{{ item.label }}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="vmr-sidebar" :class="{ 'vmr-show': isUIVisible && isSidebarVisible }">
          <div class="vmr-sidebar-header" :class="{'no-desc': !manga?.description }">
            <div class="vmr-manga-title">
              <a v-if="manga?.url" :href="manga.url" target="_blank" rel="noopener noreferrer">{{ manga?.title || '未加载漫画' }}</a>
              <span v-else>{{ manga?.title || '未加载漫画' }}</span>
            </div>
            <div class="vmr-manga-author">{{ manga?.author || '未知作者' }}</div>
            <div v-if="manga.status || ( Array.isArray(manga.tags) && manga.tags.length )" class="vmr-manga-status-and-tags">
              <span class="vmr-manga-status" :style="{ color: manga.status?.includes('完结') || manga.status?.includes('完結') ? '#f53f3f' : '#00b42a' }">
                {{ manga.status }}
              </span>
              <span v-for="tag of manga.tags || []" class="vmr-manga-tag">
                {{ tag }}
              </span>
            </div>
            <div v-if="manga?.description" class="vmr-manga-desc">{{ manga.description }}</div>
          </div>

          <div class="vmr-chapter-group-list">
            <div v-for="group in chapter.groups" :key="group.title" class="vmr-chapter-group">
              <div class="vmr-chapter-group-title">{{ group.title }}</div>
              <div class="vmr-chapter-list">
                <div v-for="ch in group.data" :key="ch.id" class="vmr-chapter-item" :class="{ active: chapter.current?.id === ch.id, highlight: isActiveChapterHighlight }" :title="ch.name" @click="loadChapter(ch)">
                  <div v-if="ch.pageCount" class="vmr-chapter-pagecount">
                    {{ ch.pageCount }}P</div>
                  <div class="vmr-chapter-name">
                    {{ ch.name }}</div>
                  <div class="vmr-chapter-update-time" v-if="ch.updatedAt">{{ ch.updatedAt }}</div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="vmr-chapter-info">
            <div class="vmr-current-chapter">
              当前: {{ chapter.current?.name || '未选择' }}
              <span v-if="chapter.current?.pageCount" class="vmr-current-chapter-pagecount">{{ chapter.current.pageCount }}P</span>
            </div>
            <div class="vmr-chapter-nav">
              <button :disabled="!hasPrevChapter" @click="loadChapter(chapter.previous)">${getIcon('up')}<span>上一章</span></button>
              <button class="vmr-auto-btn" @click="scrollToActiveChapter(true)">${getIcon('location')}<span>当前</span></button>
              <button :disabled="!hasNextChapter" @click="loadChapter(chapter.next)"><span>下一章</span>${getIcon('down')}</button>
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
            <div class="vmr-navbar-btn vmr-progress-perv" :class="{
              disabled: isFirstPage && !hasPrevChapter,
              'child-icon-rotate-90': isFirstPage
            }" @click="prevPage">
              ${getIcon('left')}
              <div class="vmr-button-tooltip">{{ prevButtonTooltip }}</div>
            </div>

            <div class="vmr-progress-status">{{ pageStatusText }}</div>

            <div class="vmr-page-slider">
              <div  v-if="['slider', 'both'].includes(statusBarMode)"  class="vmr-slider-stataus-bar" :style="slider.statusBarStyles">
                <div class="vmr-slider-status-progress">
                  <div v-for="i of slider.max" class="vmr-slider-status-block" :data-page="i" :data-status="imgStatusList[i - 1]"></div>
                </div>
              </div>

              <input type="range" :min="slider.min" :max="slider.max" v-model.number="sliderValue" @input="handleSliderInput" @change="handleSliderChange"/>

              <div class="vmr-slider-tooltip" :style="slider.tooltipStyles">
                {{ sliderValue }}
              </div>
            </div>
            <div class="vmr-navbar-btn vmr-setting-btn" @click="toggleSettings">
              ${getIcon('settings')}
              <div class="vmr-button-tooltip">设置</div>
            </div>
            <div class="vmr-navbar-btn vmr-progress-next" :class="{
              disabled: isLastPage && !hasNextChapter,
              'child-icon-rotate-90': isLastPage
            }" @click="nextPage">
              ${getIcon('right')}
              <div class="vmr-button-tooltip">{{ nextButtonTooltip }}</div>
            </div>
          </div>
        </div>

        <div v-if="layoutMode === 'paged'" class="vmr-pagination-status" :class="{
          'vmr-show': !isUIVisible,
          'has-pagination-bar': ['bottom', 'both'].includes(statusBarMode)
        }">{{ pageStatusText }}</div>

        <div class="vmr-main-content" :data-mode="layoutMode" :style="{ '--vmr-vertical-page-width': vPageWidth }" @click="handleMainContentClick">
          <div v-if="layoutMode !== 'vertical'" class="vmr-click-zones">
            <div class="vmr-click-zone zone-left" 
              @click.stop="handleLeftClick"></div>
            <div class="vmr-click-zone zone-center" 
              @click.stop="handleCenterClick"></div>
            <div class="vmr-click-zone zone-right" 
              @click.stop="handleRightClick"></div>
          </div>

          <div v-if="totalPages > 0" ref="mangaContainerEl" class="vmr-manga-container">
            <template v-if="layoutMode === 'paged'">
              <div v-if="currentImage" class="vmr-manga-page">
                <img :src="currentImage" :alt="'第' + (pageIndex + 1) + '页'" @load="imgStatusList[pageIndex] = 1" @error="imgStatusList[pageIndex] = -1"/>
              </div>
            </template>
            <template v-else-if="['vertical','horizontal'].includes(layoutMode)"> 
              <div v-for="(item,index) of chapter.current.images" ref="mangaPageEls" class="vmr-manga-page" :data-page="index + 1">
                <img :src="item" :alt="'第' + (index + 1) + '页'" @load="imgStatusList[index] = 1" @error="imgStatusList[index] = -1"/>
                <div class="vmr-manga-page-num">
                  <span>P{{ index + 1 }}</span>
                </div>
              </div>
            </template>

            <div v-if="hasComments && (layoutMode !== 'paged' || isCommentPage)" ref="chapterCommentEl" class="vmr-chapter-comments" :class="{'vmr-safe-ui': isUIVisible }" :data-page="totalPages + 1">
              <div class="vmr-chapter-comments-title">
                评论 <span>{{ comments.length }}</span>
              </div>
              <div class="vmr-chapter-comments-list">
                <div v-for="comment in comments" class="vmr-chapter-comment">
                  <div class="vmr-chapter-comment-content">
                    {{ comment.content }}
                  </div>
                </div>
              </div>
            </div>

            <div class="vmr-manga-preload">
              <img v-for="item of preloadImages" :src="item.url" alt="预加载" @load="imgStatusList[item.index] = 1" @error="imgStatusList[item.index] = -1"/>
            </div>
          </div>
          
          <div v-else class="vmr-empty-state">
            <div class="vmr-empty-state-icon">📖</div>
            <div class="vmr-empty-state-text">暂无内容，请使用 $vmr.setMangaData 加载漫画数据</div>
          </div>

          <div v-if="totalPages && ['bottom', 'both'].includes(statusBarMode)" class="vmr-pagination-bar" :class="{
            'vmr-show': !isUIVisible,
            'vmr-fixed': paginationBarMode === 'fixed'
          }">
            <div v-for="i of slider.max" class="vmr-slider-status-block" :data-page="i" :data-status="imgStatusList[i - 1]" @click.stop="goToPage(i - 1)">
              <span v-if="i - 1 === pageIndex">▼</span>
              <div class="vmr-button-tooltip">{{ i }}</div>
            </div>
            <div v-if="hasComments" class="vmr-slider-status-block is-comment"  @click="goToPage(slider.max)">
              <span v-if="isCommentPage">▼</span>
              <div class="vmr-button-tooltip">评论</div>
            </div>
          </div>
        </div>
      </div>
    `
  })
}

// ==================== 全局API ====================
function getReaderManga() {
  if (!window.$vm) return console.error('[漫画阅读器] Vue应用未初始化')
  return window.$vm.setupState.manga
}

function getReaderChapter() {
  if (!window.$vm) return console.error('[漫画阅读器] Vue应用未初始化')
  return window.$vm.setupState.chapter
}

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

function setComments(comments) {
  if (!window.$vm) return console.error('[漫画阅读器] Vue应用未初始化')
  window.$vm.setupState.setComments(comments)
  console.log('[漫画阅读器] 章节评论已设置')
}

function clearCurrentCache() {
  if (!window.cacheKey)
    return console.error('[漫画阅读器] 删除缓存失败: 未设置缓存KEY')
  $cache.delete(window.cacheKey)
  console.log(`[漫画阅读器] 已删除当前章节对应漫画的缓存<${window.cacheKey}>`)
}

function exposeGlobalAPI() {
  const win = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window
  win.$vmr = {
    $vm: window.$vm,
    $cache,
    getReaderManga,
    getReaderChapter,
    setMangaData,
    setEntryVisible,
    setReaderVisible,
    clearCurrentCache
  }
  console.log('[漫画阅读器] 全局API已暴露: $vmr', win.$vmr)
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
    if (typeof website.extract !== 'function') {
      throw new Error('extract不是一个Function')
    }
    const data = await website.extract()
    if (!data) throw new Error('未能提取到数据！')
    setMangaData(data)
    console.log('[漫画阅读器] 数据加载成功')
    if (typeof website.loadComments === 'function') {
      const comments = await website.loadComments(data)
      if (comments) setComments(comments)
      else console.error('未能获取本章节评论！')
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
const website = getWebsite()
if (typeof website.requestHooker === 'function') {
  website.requestHooker()
  console.log('[漫画阅读器>请求劫持器] 开始劫持！')
} else if (typeof website.requestHooker === 'object') {
  const { filter, hooker } = website.requestHooker
  if (!hooker) return console.warn('[漫画阅读器>请求劫持器] 未设置hooker')
  if (typeof hooker !== 'function') {
    return console.warn('[漫画阅读器>请求劫持器] hooker必须是一个Function')
  }
  if (Array.isArray(filter)) ajaxHooker.filter(filter)
  ajaxHooker.hook(hooker.bind(website))
  console.log('[漫画阅读器>请求劫持器] 开始劫持！')
}

;(function () {
  'use strict'
  // 清理过期缓存
  $cache.clearExpired()
  // 未匹配站点，跳过初始化
  if (!website) {
    console.log('[漫画阅读器] 未找到站点配置，不进行初始化')
    return
  }

  console.log('[漫画阅读器] 阅读器初始化...')
  // Vue注入
  if (!unsafeWindow.Vue) unsafeWindow.Vue = Vue
  // if (!unsafeWindow.VueUse) unsafeWindow.Vue = VueUse
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
    // 设置入口显隐
    setEntryVisible(isReadPage)
    // 劫持模式则跳过解析阶段
    if (website.requestHooker) return isReadPage
    // 延迟加载数据
    if (isReadPage) {
      setTimeout(() => {
        loadMangaData(website, true)
      }, website.loadDelay || 0)
    }
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
