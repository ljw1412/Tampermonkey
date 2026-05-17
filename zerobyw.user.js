// ==UserScript==
// @name         zero搬运网 随便看
// @namespace    zerobyw
// @version      1.0.0
// @description  zero搬运网漫画阅读增强 - 自动解析需要登录的章节
// @author       huomangrandian
// @match        https://www.zerobywai.com/pc/manga_read_pc.php*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=zerobywai.com
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// ==/UserScript==

// ==================== 常量定义 ====================
const CONFIG = {
  DEBUG: false,
  CACHE_NAMESPACE: 'cache_',
  CACHE_TTL: 3 * 60 * 60, // 3小时
  ALERT_DURATION: {
    SHORT: 3000,
    MEDIUM: 5000,
    LONG: 10000
  }
}

// ==================== Logger类 ====================
class Logger {
  static _NAME_ = ''
  #titles

  constructor(name) {
    if (typeof name !== 'string' || !name) {
      throw new Error('请必须传入Logger的name！')
    }
    this.name = name
    this.updateTitles()
  }

  setName(name) {
    this.name = name
    this.updateTitles()
  }

  updateTitles() {
    this.#titles = {
      log: this.#buildTitle('信息', '#409EFF'),
      success: this.#buildTitle('成功', '#00b42a'),
      error: this.#buildTitle('错误', '#F56C6C'),
      warning: this.#buildTitle('警告', '#f5a623'),
      debug: this.#buildTitle('调试', '#ff5722')
    }
  }

  #buildTitle(status, bg = '#409EFF') {
    let str = `%c[${status}] ${this.name}`
    const baseStyles = 'font-size: 12px; padding: 2px 6px; font-weight: 700;'
    const styles = [`${baseStyles};background-color: ${bg}; color: #fff;`]

    if (Logger._NAME_) {
      str = `%c${Logger._NAME_}` + str
      styles[0] += 'border-radius: 0 4px 4px 0;'
      styles.unshift(
        baseStyles +
          'background-color: #666; color: #fff; border-radius: 4px 0 0 4px;'
      )
    } else {
      styles[0] += 'border-radius: 4px;'
    }
    return [str, ...styles]
  }

  log(...args) {
    console.log(...this.#titles.log, ...args)
  }

  info(...args) {
    this.log(...args)
  }

  success(...args) {
    console.log(...this.#titles.success, ...args)
  }

  error(...args) {
    console.log(...this.#titles.error, ...args)
  }

  warning(...args) {
    console.log(...this.#titles.warning, ...args)
  }

  debug(...args) {
    CONFIG.DEBUG && console.log(...this.#titles.debug, ...args)
  }
}

// ==================== Alert类 ====================
class Alert {
  #el = null
  #timer = null

  constructor() {
    this.#initDOM()
  }

  #initDOM() {
    if (this.#el) return

    const el = document.createElement('div')
    el.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 9999;
      background-color: rgba(0, 0, 0, 0.8);
      color: #fff;
      padding: 10px 20px;
      border-radius: 4px;
      font-size: 14px;
      transition: opacity 0.3s;
      pointer-events: none;
    `
    el.style.display = 'none'
    document.body.appendChild(el)
    this.#el = el
  }

  #clearTimer() {
    if (this.#timer) {
      clearTimeout(this.#timer)
      this.#timer = null
    }
  }

  show(text, duration = CONFIG.ALERT_DURATION.SHORT) {
    if (!this.#el) this.#initDOM()
    this.#clearTimer()

    this.#el.textContent = text
    this.#el.style.display = 'block'
    this.#el.style.opacity = '1'

    this.#timer = setTimeout(() => this.hide(), duration)
  }

  hide() {
    if (this.#el) {
      this.#el.style.display = 'none'
    }
    this.#clearTimer()
  }
}

// ==================== CacheManager类 ====================
class CacheManager {
  constructor(namespacePrefix = CONFIG.CACHE_NAMESPACE) {
    this.namespacePrefix = namespacePrefix
  }

  set(key, data, ttlSeconds) {
    const cacheKey = this.namespacePrefix + key
    const expireAt = Date.now() + ttlSeconds * 1000
    GM_setValue(cacheKey, { data, expireAt })
  }

  get(key) {
    const cacheKey = this.namespacePrefix + key
    const cacheData = GM_getValue(cacheKey, null)

    if (cacheData === null) return null

    if (cacheData.expireAt && Date.now() > cacheData.expireAt) {
      this.delete(key)
      return null
    }

    return cacheData.data
  }

  delete(key) {
    GM_deleteValue(this.namespacePrefix + key)
  }

  clearExpired() {
    const allKeys = GM_listValues()
    const now = Date.now()
    let count = 0

    allKeys.forEach((key) => {
      if (key.startsWith(this.namespacePrefix)) {
        const cacheData = GM_getValue(key, null)
        if (cacheData?.expireAt && now > cacheData.expireAt) {
          GM_deleteValue(key)
          count++
        }
      }
    })

    if (count) console.log(`[zero搬运网] 删除${count}条过期缓存`)
  }
}

// ==================== 工具函数 ====================
/**
 * 查找包含指定文本的元素
 */
function findElWithText(selector, text) {
  return (
    Array.from(document.querySelectorAll(selector)).find((el) =>
      el.textContent.includes(text)
    ) || null
  )
}

/**
 * 从URL获取zjid参数
 */
function getZjid() {
  return new URL(location.href).searchParams.get('zjid')
}

/**
 * 从页面链接获取kuid参数
 */
function getKuid() {
  const aEl = document.querySelector('a[href*=kuid]')
  if (!aEl) return null
  return new URL(aEl.href).searchParams.get('kuid')
}

/**
 * 获取阅读器数据
 */
function getReaderData() {
  return Array.isArray(document.body._x_dataStack) &&
    document.body._x_dataStack.length
    ? document.body._x_dataStack[0]
    : null
}

/**
 * 创建图片包装器HTML
 */
function createImageWarpper(index, total, imgUrl) {
  return `<div class="image-wrapper relative group flex flex-col items-center" :class="{ 'force-hidden': !isPageVisible(${index}, pageMode),'w-full': readingMode === 'vertical'}" :style="getWrapperStyle(${index})" style="height: 100%; width: auto; max-height: 100vh; object-fit: contain; flex-shrink: 0; max-width: 100vw !important">
    <div class="relative flex justify-center items-center" :class="{ 'w-full': readingMode === 'vertical' }">
        <img src="${imgUrl}" fetchpriority="high" class="manga-image" :style="getImageStyle()" alt="Page ${index + 1}" style="border: 1px solid #000 !important; max-height: 100vh; width: auto; max-width: 100%">
        <div x-show="showPageNum && readingMode !== 'vertical'" class="absolute right-2 bottom-2 z-10 bg-black/60 text-white text-[11px] px-2 py-0.5 rounded backdrop-blur-sm pointer-events-none font-bold font-mono shadow-sm border border-white/10">
            <span x-text="${index + 1}">${index + 1}</span> / <span x-text="totalPages">${total}</span>
        </div>
    </div>
    <div x-show="showPageNum && readingMode === 'vertical'" :style="{ marginTop: borderWidth }" class="w-full py-1 text-center font-bold font-mono text-black dark:text-white text-[12px]" style="margin-top: 1px; display: none;">
        <span x-text="${index + 1}">${index + 1}</span> / <span x-text="totalPages">${total}</span>
    </div>
  </div>`
}

// ==================== 页面修复 ====================
function fixPageLayout() {
  // 修复header样式
  const headerEl = document.querySelector('body>div.pl-0')
  headerEl?.classList.remove('pl-0')

  // 修复页面点击区域层级
  document
    .querySelectorAll('body > div[class*="z-[90]"][class*="fixed"]')
    .forEach((el) => {
      el.classList.replace('z-[90]', 'z-[89]')
    })

  // 修复图片容器
  const imageContainerEl = document.querySelector('#image-container')
  if (imageContainerEl) {
    const xclass = imageContainerEl.getAttribute(':class')
    imageContainerEl.setAttribute(
      ':class',
      xclass.replace(
        '}',
        ",'pointer-events-none z-[89]': currentPage >= totalPages }"
      )
    )

    const lastEl = imageContainerEl.lastElementChild
    if (lastEl?.classList.contains('z-[100]')) {
      lastEl.firstElementChild?.classList.add('pointer-events-auto')
    }
  }
}

// ==================== 核心业务逻辑 ====================
class MangaReader {
  constructor() {
    this.$logger = new Logger('zero搬运网-随便看')
    this.$alert = new Alert()
    this.$cache = new CacheManager()
  }

  async init() {
    fixPageLayout()
    this.$cache.clearExpired()

    const zjid = getZjid()
    if (!zjid) {
      return this.$logger.error('获取zjid失败，请检查当前页面地址是否正确！')
    }

    const kuid = getKuid()
    if (!kuid) {
      return this.$logger.error('获取kuid失败！')
    }

    this.$logger.info(`kuid=${kuid} zjid=${zjid}`)

    const readerData = getReaderData()
    if (!readerData) {
      return this.$logger.error('获取阅读器数据失败！')
    }
    this.$logger.info('阅读器数据', readerData)

    const imageContainerEl = document.querySelector('#image-container')
    if (!imageContainerEl) {
      return this.$logger.error('获取阅读器图片容器失败！')
    }
    this.$logger.info('阅读器图片容器', [imageContainerEl])

    const loginH3El = findElWithText('#image-container h3', '需要登录')
    const needLogin = !!loginH3El

    if (needLogin) {
      await this.handleNeedLogin(
        zjid,
        kuid,
        imageContainerEl,
        loginH3El,
        readerData
      )
    } else {
      this.$logger.success('当前章节可以正常观看！')
    }
  }

  async handleNeedLogin(zjid, kuid, imageContainerEl, loginH3El, readerData) {
    this.$alert.show('发现需要鉴权章节，尝试解析！', CONFIG.ALERT_DURATION.LONG)
    this.$logger.warning('发现当前章节需要登录才能查看！')

    const cacheName = `kuid-${kuid}`
    let comic = this.$cache.get(cacheName)

    if (comic) {
      this.$logger.success(`漫画数据缓存有效(${cacheName})`, comic)
    } else {
      comic = await this.fetchComicData(kuid, cacheName)
      if (!comic) return
    }

    const manhuadir = comic.info?.manhuadir
    if (!manhuadir) {
      return this.$logger.error('没有找到对应的manhuadir！')
    }
    this.$logger.info(`manhuadir=${manhuadir}`)

    const currentChapter = comic.zj.find((item) => item.zjid === Number(zjid))
    if (!currentChapter) {
      return this.$logger.error(`未找到当前章节(zjid=${zjid})`, comic.zj)
    }
    this.$logger.info('找到当前章节数据', currentChapter)
    this.$alert.show('找到当前章节数据', CONFIG.ALERT_DURATION.SHORT)

    const imgList = this.generateImageUrls(currentChapter.images, manhuadir)
    this.$logger.success('处理后的图片地址列表', imgList)

    this.renderImages(imgList, imageContainerEl, loginH3El, readerData)
    this.$logger.success('当前章节可以随便看咯！')
    this.$alert.show('当前章节可以随便看咯！', CONFIG.ALERT_DURATION.SHORT)
  }

  async fetchComicData(kuid, cacheName) {
    this.$logger.warning(`未找到对应缓存(${cacheName})，尝试接口请求！`)

    try {
      const resp = await fetch(
        `/app/manhua.php?action=getmanhuabykuid&version=2&kuid=${kuid}`
      )
      const respJson = await resp.json()
      this.$logger.success('请求的漫画数据结果', respJson)

      if (respJson.code) {
        throw new Error(`请求失败(${respJson.code})`)
      }

      const comic = respJson.data
      this.$cache.set(cacheName, comic, CONFIG.CACHE_TTL)
      this.$logger.info(
        `缓存漫画数据(${cacheName} | ${CONFIG.CACHE_TTL}s)`,
        comic
      )
      this.$alert.show('获取漫画数据成功！', CONFIG.ALERT_DURATION.SHORT)

      return comic
    } catch (error) {
      this.$logger.error('请求漫画数据失败！', error)
      this.$alert.show('获取漫画数据失败！', CONFIG.ALERT_DURATION.MEDIUM)
      return null
    }
  }

  generateImageUrls(images, manhuadir) {
    const imgOrigin = location.origin.replace('www', 'tupa')
    return images.map((path) => `${imgOrigin}/manhua/${manhuadir}/${path}`)
  }

  renderImages(imgList, imageContainerEl, loginH3El, readerData) {
    const total = imgList.length
    const imagesHTML = imgList
      .map((imgUrl, index) => createImageWarpper(index, total, imgUrl))
      .join('\n')

    imageContainerEl.insertAdjacentHTML('afterbegin', imagesHTML)

    // 更新阅读器数据
    readerData.totalPages = total + 1
    readerData.currentPage = 1

    // 隐藏登录提示
    loginH3El.parentElement.parentElement.style.display = 'none'

    // 修复最后一页的类和样式
    this.fixLastPage(imageContainerEl, total)
  }

  fixLastPage(imageContainerEl, total) {
    const lastEl = imageContainerEl.lastElementChild
    if (!lastEl) return

    lastEl.setAttribute(
      ':class',
      lastEl.getAttribute(':class').replace('0', total)
    )
    lastEl.setAttribute(
      ':style',
      lastEl
        .getAttribute(':style')
        .replace('getWrapperStyle(0)', `getWrapperStyle(${total})`)
    )
  }
}

// ==================== 执行入口 ====================
;(async function () {
  const reader = new MangaReader()
  await reader.init()
})()
