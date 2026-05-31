// ==UserScript==
// @name         漫画助手 by:100-A
// @namespace    http://tampermonkey.net/
// @version      1.0.1
// @description  漫画助手 - 支持漫画柜等网站的下载和阅读功能
// @author       You
// @match        *://*.manhuagui.com/*
// @require      http://code.jquery.com/jquery-1.11.0.min.js
// @require      https://cdn.bootcss.com/jquery-cookie/1.4.1/jquery.cookie.min.js
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addValueChangeListener
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// ==/UserScript==

/*global $ pVars */

// ==================== 常量定义 ====================
const CONFIG = {
  USE_ARIA2_KEY: 'use-aria2',
  THEME_KEY: 'manhuagui_theme',
  WIDE_MODE_KEY: 'manhuagui_wide',
  ARIA2_RPC_URL: 'http://localhost:6800/jsonrpc',
  IMG_BASE_URL: 'https://us.hamreus.com',
  DEFAULT_USER_AGENT:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0',
  DEFAULT_REFERER: 'https://www.manhuagui.com/',
  DEFAULT_PROXY: 'http://127.0.0.1:1086',
  MAX_TRIES: 5,
  RETRY_WAIT: 3
}

// ==================== SVG图标 ====================
const ICON = {
  MOON: '<path d="M42.108 29.769c.124-.387-.258-.736-.645-.613A17.99 17.99 0 0 1 36 30c-9.941 0-18-8.059-18-18 0-1.904.296-3.74.844-5.463.123-.387-.226-.768-.613-.645C10.558 8.334 5 15.518 5 24c0 10.493 8.507 19 19 19 8.482 0 15.666-5.558 18.108-13.231Z" fill="currentColor" stroke="none"></path>',
  SUN: '<circle cx="24" cy="24" r="7"></circle><path d="M23 7h2v2h-2zM23 39h2v2h-2zM41 23v2h-2v-2zM9 23v2H7v-2zM36.73 35.313l-1.415 1.415-1.414-1.415 1.414-1.414zM14.099 12.686l-1.414 1.415-1.414-1.415 1.414-1.414zM12.687 36.728l-1.414-1.415 1.414-1.414 1.414 1.414zM35.314 14.1 33.9 12.686l1.414-1.414 1.415 1.414z"></path><path fill="currentColor" stroke="none" d="M23 7h2v2h-2zM23 39h2v2h-2zM41 23v2h-2v-2zM9 23v2H7v-2zM36.73 35.313l-1.415 1.415-1.414-1.415 1.414-1.414zM14.099 12.686l-1.414 1.415-1.414-1.415 1.414-1.414zM12.687 36.728l-1.414-1.415 1.414-1.414 1.414 1.414zM35.314 14.1 33.9 12.686l1.414-1.414 1.415 1.414z"></path>',
  SHRINK: `<path d="M20 44V29c0-.552-.444-1-.996-1H4M28 4v15c0 .552.444 1 .996 1H44"></path>`,
  EXPAND: `<path d="M7 26v14c0 .552.444 1 .996 1H22m19-19V8c0-.552-.444-1-.996-1H26"></path>`
}

function getIcon(name, props = '') {
  if (!name) return ''
  const upperName = name.toUpperCase()
  const lowerName = name.toLowerCase()
  if (!ICON[upperName]) return ''
  return `<svg ${props} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" class="mhh-icon mhh-icon-${lowerName}" stroke-width="4" stroke-linecap="butt" stroke-linejoin="miter">${ICON[upperName]}</svg>`
}
// ==================== 深色模式CSS样式 ====================

/* prettier-ignore */
const darkThemeConfig = {
  // --- color ---
  'color: var(--color-primary)': [
    '.hlist a:hover', '.book-sort li a:hover', '.support li.pfunc a.current', '.book-detail dt a:hover'
  ],
  'color: var(--color-text-1)': [
    'a', '.topper', '.footer', '.footer-wrap', '.footer-main', 
    '.category-list h3', '.nav-less', '.book-sort h5', 
    '.chapter-list li a:hover'
  ],
  'color: var(--color-text-2)': [
    '#Tdownload', '.bar-tab', '.book-intro', '.intro-act', '.score-vote', 
    '.score-per p', '.commentBox h2 .t_c', '.comment_tab', '.rank', 
    '.content_r .text', '.content_r .info_bar .userName', '.book-detail dd strong', '.chapter-list li a', '.chapter-cont a.title', '.update-info', '.latest-cont strong'
  ],
  'color: var(--color-text-3)': ['.footer-cont', '.book-detail dd'],
  // --- background / background-color ---
  'background: none !important': ['.intro_l > .title','.intro_l + div > .title'],
  'background: var(--color-primary)': ['.chapter-list li a:hover'],
  'background: var(--color-bg-1)': ['.category-list h3'], 
  'background: var(--color-bg-2)': ['.bar-title', '.bar-tab'], 
  'background-color: var(--color-bg-2)': [
    '.topper', '.footer', '.footer-wrap', '.footer-main', '.bar-title', '.latest-cont h5', '.reply_content', '.chapter-page li:not(.on) a'
  ],
  'background: var(--color-bg-3)': ['.pager a', '.pager span'],
  'background-color: var(--color-bg-3)': [
    '.user-view .panel', '.filter-click a', '.filter-nav', '.reminder-cont',
    '.index-cont', '.score', '.stitle', '.recent-cont', '.book-similar',
    '.update-title h2', '.chapter-bar', '.chapter-bar h3', '.chapter-list li a',
    '.comment', '.sub-btn', '.support li a', '.book-result', '.category-list', 
    '.top-cont', '.rank-detail th', '.pager a', '.pager span', '.idx-mc-cont',
    '.idx-rank-cont', '.idx-rank-more a', '.idx-sc-cont'
  ],
  'background-color: var(--color-bg-4)': ['.filter-title h2', '.idx-sc-cont h4', '.idx-sc-bar li'],
  'background-color: var(--color-fill-2)': ['.hlist li:hover', '.filter:hover'],
  'background-color: var(--color-fill-3)': [
    '.hlist-remove', '.book-sort li.current', '.top-tab ul li.selected',
    '.support li.pfunc a.current', '.idx-mc-title li.on', '.idx-rank-tab a.on',
    '.idx-sc-bar li.on', '.latest-tab ul li.selected', '.book-sort li.selected',
    '.rank-detail tr:hover', '.category-list li:hover','.reminder-cont li:hover'
  ],
  'background-color: var(--color-fill-4)': ['.user-area .over .handle'],
  'background-color: #df8f27': ['.nav-less'],
  // --- border / border-color ---
  'border-color: var(--color-border-1)': ['.footer-wrap', '.footer-main'],
  'border-color: var(--color-border-2)': [
    '.topper', '.footer', '.hlist li', '.user-feedback', '.user-view .handle', '.user-view .panel', '.box-gray', '.bar-title', '.bar-tab', '.book-sort h5', '.filter-click', '.filter-nav .filter', '.book-result li', '.score', '.stitle', '.recent-cont', '.book-similar', '.chapter-bar', '.chapter-bar h3', '.chapter-list li a', '.comment', '.sub-btn', '.support li a', '.book-result', '.category-list', '.top-cont', '.rank-detail th', '.pager a', '.pager span', '.chapter-list li a:hover span', '.idx-mc-cont', '.idx-sc', 
    '.update-title h2', '.latest-cont h5', '.intro_l', '.intro_l + div *',
    '.chapter-list *', '.score *', '.comment *', '.recent-cont *', '.rank-detail *', '.category-list *', '.bar-tab *', '.idx-sc-list *','.idx-sc *', '.intro_l *'
  ],
  'border-color: var(--color-border-4)': ['.nav-less'],
  // --- box-shadow ---
  'box-shadow: 1px 1px 3px var(--color-border-2)': ['.shadow'],
  'box-shadow: 0 1px 3px var(--color-border-2)': ['.topper'],
  'box-shadow: none': [
    '.score', '.stitle', '.recent-cont', '.book-similar', '.chapter-bar', 
    '.chapter-bar h3', '.chapter-list li a', '.comment', '.sub-btn', 
    '.support li a', '.book-result', '.category-list', '.top-cont', '.rank-detail th'
  ]
};

function generateCssString(config, prefix = '') {
  const selectorMap = new Map()
  // 1. 遍历配置，按“完整选择器”归类所有的样式规则
  for (const [styleRule, selectors] of Object.entries(config)) {
    selectors.forEach((selector) => {
      const fullSelector = `${prefix} ${selector.trim()}`
      if (selectorMap.has(fullSelector)) {
        selectorMap.get(fullSelector).push(styleRule)
      } else {
        selectorMap.set(fullSelector, [styleRule])
      }
    })
  }
  // 2. 将 Map 中的结果拼接成最终的 CSS 字符串
  let cssText = ''
  selectorMap.forEach((rules, selector) => {
    // 将该选择器的所有样式规则用分号连接
    cssText += `${selector} {\n  ${rules.join(';\n  ')};\n}\n\n`
  })
  return cssText.trim()
}

const BASE_STYLES = `
.mhh-icon {
  display: inline-block; width: 1em; height: 1em; color: inherit;
  font-style: normal; vertical-align: -2px; outline: none; stroke: currentColor;
}

.mhh-action-btn {
  position: fixed;
  right: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  font-size: 30px;
  line-height: 1;
  color: #fff;
  background-color: var(--theme-switch-bg, rgba(0, 0, 0, 0.15));
  cursor: pointer;
  z-index: 10001;
}
.mhh-action-btn:hover {
  background-color: #e32727;
}
.mhh-action-btn > svg {
  width: 1em;
  height: 1em;
  opacity: var(--theme-switch-opacity, 0.8);
}
.mhh-action-btn:hover > svg {
  opacity: 1;
}

.btn-theme-switch { bottom: 175px; }

.btn-wide-switch { bottom: 220px; }
`

const DARK_MODE_STYLES = `
html[data-theme='dark'] {
  --color-primary: #fe4800;
  --color-white: rgba(255, 255, 255, .9);
  --color-black: #000000;
  --color-bg-1: #17171a;
  --color-bg-2: #232324;
  --color-bg-3: #2a2a2b;
  --color-bg-4: #313132;
  --color-bg-5: #373739;
  --color-bg-white: #f6f6f6;
  --color-text-1: rgba(255, 255, 255, .9);
  --color-text-2: rgba(255, 255, 255, .7);
  --color-text-3: rgba(255, 255, 255, .5);
  --color-text-4: rgba(255, 255, 255, .3);
  --color-fill-1: rgba(255, 255, 255, .04);
  --color-fill-2: rgba(255, 255, 255, .08);
  --color-fill-3: rgba(255, 255, 255, .12);
  --color-fill-4: rgba(255, 255, 255, .16);
  --color-border: #333335;
  --color-border-1: #2e2e30;
  --color-border-2: #484849;
  --color-border-3: #5f5f60;
  --color-border-4: #929293;
  --theme-switch-bg: rgba(255, 255, 255, 0.35);
  --theme-switch-opacity: 0.3;

  color: var(--color-text-2);
  background-color: var(--color-bg-1);
}

html[data-theme='dark'] * {
  text-shadow: none !important;
}

${generateCssString(darkThemeConfig, 'html[data-theme="dark"]')}
`

const widefyConfig = {
  'width: 1386px': ['.book-list ul'],
  'width: 1280px': ['.w998'],
  'width: 1200px': ['.filter-nav .filter'],
  'width: 1134px': ['.filter-nav .filter ul'],
  'width: 160px': ['.nav-sub'],
  'width: 140px': [
    '.nav-main li',
    '.nav-main li.first',
    '.bcover .mk',
    '.bcover .tt'
  ],
  'width: 139px': ['.nav-less'],
  'width: 156px': ['.book-list li', '.bcover', '.bcover .bg'],
  'height: 275px': ['.book-list li'],
  'height: 206px': ['.bcover', '.bcover .bg'],
  'background-position: -145px 0': ['.bcover .bg'],
  'background-size: 343%': ['.bcover .bg'],
  'width: 148px': ['.bcover img'],
  'height: 197px': ['.bcover img']
}

const WIDEFY_STYLES = `
${generateCssString(widefyConfig, 'html[data-widefy="true"]')}
`

// ==================== Aria2菜单管理 ====================
class MenuManager {
  static update() {
    const isEnabled = GM_getValue(CONFIG.USE_ARIA2_KEY, false)
    const menuText = isEnabled ? '✅ 已启用aria2下载' : '❌ 已禁用aria2下载'
    GM_registerMenuCommand(
      menuText,
      () => {
        const currentState = GM_getValue(CONFIG.USE_ARIA2_KEY, false)
        GM_setValue(CONFIG.USE_ARIA2_KEY, !currentState)
        UI.showDialog(
          !currentState ? '✅ 已启用aria2下载' : '❌ 已禁用aria2下载'
        )
      },
      { id: 'use-aria2' }
    )
  }
}

// 初始化菜单并监听变化
MenuManager.update()
GM_addValueChangeListener(CONFIG.USE_ARIA2_KEY, (key, oldValue, newValue) => {
  console.log('[漫画助手]', `配置 "${key}" 已从 ${oldValue} 变更为 ${newValue}`)
  MenuManager.update()
})

// ==================== UI工具类 ====================
class UI {
  /**
   * 显示提示对话框
   */
  static showDialog(text, duration = 2000) {
    let dialog = $('#dialog')
    if (dialog.length === 0) {
      dialog = $(
        '<div id="dialog" style="position: fixed;right: 50%;bottom: 50%;z-index: 999999;color: black;background-color: white;padding: 5px;display:none;border: 2px solid #F00;transform: translate(50%,50%);"><span id="dialog_text"></span><span id="dialog_time"></span></div>'
      )
      $('body').append(dialog)
    }

    let timeLeft = duration / 1000
    $('#dialog_text').text(text)
    dialog.show()
    $('#dialog_time').text('.' + timeLeft)

    const timer = setInterval(() => {
      timeLeft--
      if (timeLeft > 0) {
        $('#dialog_time').text('.' + timeLeft)
      } else {
        dialog.hide()
        clearInterval(timer)
      }
    }, 1000)
  }

  /**
   * 复制文本到剪贴板
   */
  static copyText(text) {
    const textarea = $(
      '<textarea style="width: 0;height: 0;" id="copy_tmp">' +
        text +
        '</textarea>'
    )
    $('body').append(textarea)
    textarea.select()
    document.execCommand('Copy')
    $('#copy_tmp').remove()
  }

  /**
   * 添加下载按钮
   */
  static addDownloadBtn(onClick) {
    if ($('#downloadbox').length > 0) return

    const btnHtml =
      '<div id="downloadbox" style="position: fixed;right: 20px;bottom: 0px;z-index:999999">' +
      '<div align="right"><div style="width: 150px;margin-bottom: 20px;">' +
      '<input type="button" value="下载" id="download-btn" style="margin-left: 5px;border: 1px solid gray;background-color: rgba(75, 156, 226, 0.6);"></div></div></div>'

    $('body').prepend(btnHtml)
    console.log('[漫画助手] 添加下载按钮成功')
    $('#download-btn').click(onClick)
  }
}

// ==================== 深色模式 ====================
function addDarkMode() {
  const btnDarkSwitch = $('<div class="mhh-action-btn btn-theme-switch"></div>')

  function updateTheme() {
    const theme = GM_getValue(CONFIG.THEME_KEY, 'light')
    const isDark = theme === 'dark'
    $('html').attr('data-theme', isDark ? 'dark' : null)
    const icon = getIcon(isDark ? 'MOON' : 'SUN')
    btnDarkSwitch.empty().append(icon)
  }

  updateTheme()

  btnDarkSwitch.click(() => {
    const theme = GM_getValue(CONFIG.THEME_KEY, 'light')
    GM_setValue(CONFIG.THEME_KEY, theme !== 'dark' ? 'dark' : 'light')
    updateTheme()
  })

  GM_addStyle(DARK_MODE_STYLES)
  $('body').append(btnDarkSwitch)
}

// ==================== 宽窄模式 ====================
function addWideMode() {
  const btnWideSwitch = $('<div class="mhh-action-btn btn-wide-switch"></div>')

  function updateWideMode() {
    const isWide = GM_getValue(CONFIG.WIDE_MODE_KEY, false)
    $('html').attr('data-widefy', isWide ? 'true' : null)
    const icon = getIcon(
      isWide ? 'SHRINK' : 'EXPAND',
      'style="transform: rotate(45deg);"'
    )
    btnWideSwitch.empty().append(icon)
  }

  updateWideMode()

  btnWideSwitch.click(() => {
    const isWide = GM_getValue(CONFIG.WIDE_MODE_KEY, false)
    GM_setValue(CONFIG.WIDE_MODE_KEY, !isWide)
    updateWideMode()
  })

  GM_addStyle(WIDEFY_STYLES)
  $('body').append(btnWideSwitch)
}

// ==================== 解析工具函数 ====================
class ParserUtils {
  /**
   * 从HTML中提取漫画信息
   */
  static extractComicInfo(doc) {
    const script = $('script:contains("window[")', doc).html()
    if (!script) {
      console.log('script 不存在,无法解析')
      return null
    }

    const text = new Function(
      'return ' + script.replace(`window["\\x65\\x76\\x61\\x6c"]`, '')
    )()
    const subText = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1)
    return JSON.parse(subText)
  }

  /**
   * 生成图片URL列表
   */
  static generateImageUrls(info, basePath) {
    const slList = Object.keys(info.sl).map((key) => `${key}=${info.sl[key]}`)
    const slStr = slList.length > 0 ? '?' + slList.join('&') : ''
    return info.files.map((path) => basePath + path + slStr)
  }

  /**
   * 生成Aria2下载配置
   */
  static createAria2Config(bname, cname) {
    return {
      dir: `./output/${bname}/${cname}/`,
      'User-Agent': CONFIG.DEFAULT_USER_AGENT,
      referer: CONFIG.DEFAULT_REFERER,
      'all-proxy': CONFIG.DEFAULT_PROXY,
      'max-tries': CONFIG.MAX_TRIES,
      'retry-wait': CONFIG.RETRY_WAIT
    }
  }
}

// ==================== 下载管理器 ====================
class DownloadManager {
  /**
   * 通过Aria2下载图片
   */
  static downloadViaAria2(imageUrlList, config = {}) {
    if (!GM_getValue(CONFIG.USE_ARIA2_KEY, false)) {
      console.log('[漫画助手] Aria2下载未启用')
      return
    }

    imageUrlList.forEach((url, i) => {
      fetch(CONFIG.ARIA2_RPC_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Aria2c-Dash-Frontend/1.0'
        },
        body: JSON.stringify({
          id: 'id-' + Date.now() + '-' + i,
          jsonrpc: '2.0',
          method: 'aria2.addUri',
          params: [[url], config]
        })
      })
    })
  }

  /**
   * 打印Aria2文本并添加下载按钮
   */
  static printAriaText(doc = document) {
    const { filePath } = pVars.manga
    const info = ParserUtils.extractComicInfo(doc)

    if (!info) return

    const { bname = '漫画', cname = '0' } = info
    const imageUrlList = ParserUtils.generateImageUrls(info, filePath)
    const config = ParserUtils.createAria2Config(bname, cname)

    console.log(info)
    UI.addDownloadBtn(() =>
      DownloadManager.downloadViaAria2(imageUrlList, config)
    )
  }
}

// ==================== 漫画柜网站功能 ====================
class ManhuaGuiHandler {
  constructor() {
    this.index = 0
  }

  /**
   * 初始化下载模式界面
   */
  initDownloadMode() {
    const chapters = $('.status0')

    // 为每个章节添加下载按钮
    chapters.each(function () {
      const $this = $(this)
      const clone = $this
        .clone()
        .attr('class', 'downloadmode')
        .attr('url', $this.attr('href'))
        .attr('href', 'javascript:void(0);')
        .attr('target', null)
        .css({
          display: 'none',
          background: 'rgb(0, 119, 209)',
          color: 'white'
        })
      $this.after(clone)
    })

    // 添加对话框
    this.createDialog()

    // 添加命令显示区域
    $('.chapter').after(
      '<div id="showCommand" style="height: 240px;margin-top: 10px;display: none;" class="comment">' +
        '<textarea id="Tdownload" style="width: 100%;height: 100%;" disabled="disabled"></textarea></div>'
    )

    // 添加模式切换按钮
    this.createModeSwitch()

    // 绑定事件
    this.bindEvents(chapters)

    console.log('[漫画助手] 添加解析条控件成功')
  }

  /**
   * 创建对话框
   */
  createDialog() {
    $('body').append(
      '<div id="dialog" style="position: fixed;right: 50%;bottom: 50%;z-index: 999999;color: black;background-color: white;padding: 5px;display:none;border: 2px solid #F00;transform: translate(50%,50%);">' +
        '<span id="dialog_text"></span><span id="dialog_time"></span></div>'
    )
  }

  /**
   * 创建模式切换按钮
   */
  createModeSwitch() {
    $('.chapter-bar').after(
      '<div style="height: 20px; line-height: 20px; margin-bottom: 10px; font-size: 14px; position: relative;" id="changeModeDiv">' +
        '<div style="display: inline-flex; align-items: center; height: 20px;">' +
        '<span style="padding: 0 5px; margin-right: 5px; font-weight: bold;">解析模式</span>' +
        '<span id="modeTip" style="display:none; margin-right: 5px; font-weight: bold; color: #f00;">关</span>' +
        '<div id="modeBtn" mode="0" style="box-sizing: border-box; width: 40px; height: 100%; background-color: white; transition:1s; border: 1px solid #ccc; border-radius: 25px; cursor: pointer;">' +
        '<div id="roundBtn" style="box-sizing: border-box; height: 19px; width: 19px; margin-left: 0px; background-color: white; border: 1px solid #ccc; border-radius: 25px; transition:0.5s;"></div></div>' +
        '<div id="mybtns" style="display:none;position: absolute; right: 0px; top: 0px; font-size: 13px;">' +
        '<button id="alldownload" style="box-sizing: border-box; margin-right: 5px; padding: 0 4px; background-color: #65D265; border: 1px solid #666;height: 20px; font-weight: bold;">全部解析</button>' +
        '<button id="copy" style="box-sizing: border-box; padding: 0 4px; background-color: #65D265; border: 1px solid #666; height: 20px; font-weight: bold;">复制结果</button></div></div>'
    )
  }

  /**
   * 绑定事件
   */
  bindEvents(chapters) {
    $('#modeBtn').click(() => this.toggleMode())
    $('#copy').click(() => {
      UI.copyText($('#Tdownload').text())
      UI.showDialog('复制成功')
    })

    $('.downloadmode').click((e) => {
      $('#Tdownload').text('')
      const url = $(e.currentTarget).attr('url')
      this.getDownloadUrls(url)
    })

    $('#alldownload').click(() => {
      $('#Tdownload').text('')
      this.downloadAll(chapters)
    })
  }

  /**
   * 切换模式
   */
  toggleMode() {
    const modeBtn = $('#modeBtn')
    const mode = modeBtn.attr('mode')
    const isDownloadMode = mode === '0'

    $('#roundBtn').css('margin-left', isDownloadMode ? '20px' : '0px')
    $('#modeBtn').css('background-color', isDownloadMode ? '#65D265' : 'white')
    $('#modeTip')
      .text(isDownloadMode ? '开' : '关')
      .css('color', isDownloadMode ? '#1b9004' : '#f00')
    modeBtn.attr('mode', isDownloadMode ? '1' : '0')
    $('#mybtns')[isDownloadMode ? 'show' : 'hide']()
    $('#showCommand')[isDownloadMode ? 'slideDown' : 'slideUp']()

    if (isDownloadMode) {
      $('.status0').hide()
      $('.downloadmode').show()
    } else {
      $('.status0').show()
      $('.downloadmode').hide()
    }
  }

  /**
   * 批量下载所有章节
   */
  async downloadAll(chapters) {
    for (let i = 0; i < chapters.length; i++) {
      setTimeout(async () => {
        await this.getDownloadUrls($(chapters[i]).attr('href'), true)
        if (i < chapters.length - 1) {
          console.log('【3秒后启动下一章解析】')
        } else {
          $('#Tdownload').append('\npause')
          UI.showDialog('全部解析完成！')
        }
      }, 3000 * i)
    }
  }

  /**
   * 获取单个章节的下载地址
   */
  async getDownloadUrls(url, append = false) {
    try {
      const html = await fetch(url).then((resp) => resp.text())
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(html, 'text/html')

      if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
        throw new Error('Parsing error')
      }

      const info = ParserUtils.extractComicInfo(xmlDoc)
      if (!info) return

      const { bname = '漫画', cname = '0', path } = info
      const filePath = CONFIG.IMG_BASE_URL + path
      const imageUrlList = ParserUtils.generateImageUrls(info, filePath)
      const config = ParserUtils.createAria2Config(bname, cname)

      // 生成aria2命令文本
      const ariaText = imageUrlList.map(
        (url) =>
          `aria2c "${url}" --max-tries=${CONFIG.MAX_TRIES} --retry-wait=${CONFIG.RETRY_WAIT} --referer="${CONFIG.DEFAULT_REFERER}" --header="User-Agent:${CONFIG.DEFAULT_USER_AGENT}" --all-proxy="${CONFIG.DEFAULT_PROXY}" --dir="./${bname}/${cname}/"`
      )

      const resultText = `chcp 65001\n${ariaText.join('\n')}${!append ? '\npause' : ''}`

      if (append) {
        const currentText = $('#Tdownload').text()
        $('#Tdownload').text(
          currentText ? `${currentText}\n\n${resultText}` : resultText
        )
      } else {
        $('#Tdownload').text(resultText)
      }

      console.log(`解析完成：${bname}/${cname}`)
      DownloadManager.downloadViaAria2(imageUrlList, config)
    } catch (error) {
      console.error('[漫画助手] 解析失败:', error)
    }
  }
}

// ==================== 执行体 ====================
// 看漫画破解屏蔽
if (location.host.includes('manhuagui.com')) {
  if (
    $.cookie('country') === 'CN' ||
    typeof $.cookie('country') === 'undefined'
  ) {
    $.cookie('country', 'HK', { domain: 'manhuagui.com', path: '/' })
    location.reload()
  }
  GM_addStyle(BASE_STYLES)
  addDarkMode()
  if (location.pathname.startsWith('/list')) addWideMode()
}

$(document).ready(function () {
  if (location.host.includes('manhuagui.com')) {
    if (location.pathname.startsWith('/comic/')) {
      if (/\/comic\/\d+\/\d+.html/.test(location.pathname)) {
        DownloadManager.printAriaText()
      } else if (/\/comic\/\d+/.test(location.pathname)) {
        new ManhuaGuiHandler().initDownloadMode()
      }
    }
  }
})
