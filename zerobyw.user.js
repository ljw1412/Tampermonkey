// ==UserScript==
// @name         zero搬运网 随便看
// @namespace    zerobyw
// @version      0.0.0
// @description  try to take over the world!
// @author       huomangrandian
// @match        https://www.zerobywai.com/pc/manga_read_pc.php*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=zerobywai.com
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// ==/UserScript==

const isDebug = false
const CACHE_NAMESPACE_PREFIX = 'cache_'
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
    isDebug && console.log(...this.#titles.debug, ...args)
  }
}
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

  /**
   * 显示提示框
   * @param {string} text - 提示文本
   * @param {number} [duration=3000] - 持续时间（毫秒），默认3秒
   */
  show(text, duration = 3000) {
    if (!this.#el) this.#initDOM()

    // 清除之前的定时器
    this.#clearTimer()

    this.#el.textContent = text
    this.#el.style.display = 'block'
    this.#el.style.opacity = '1'

    // 设置新的定时器
    this.#timer = setTimeout(() => {
      this.hide()
    }, duration)
  }

  /**
   * 隐藏提示框
   */
  hide() {
    if (this.#el) {
      this.#el.style.display = 'none'
    }
    this.#clearTimer()
  }
}
class CacheManager {
  /**
   * 构造器
   * @param {string} [namespacePrefix='cache_'] - 存储的命名空间前缀
   */
  constructor(namespacePrefix = 'cache_') {
    this.namespacePrefix = namespacePrefix
  }

  /**
   * 设置带过期时间的缓存数据
   * @param {string} key - 存储的键名
   * @param {any} data - 要存储的实际数据
   * @param {number} ttlSeconds - 持续有效的时间（单位：秒）
   */
  set(key, data, ttlSeconds) {
    const cacheKey = this.namespacePrefix + key
    // 内部计算过期时间戳：当前时间 + 持续秒数 * 1000
    const expireAt = Date.now() + ttlSeconds * 1000

    const cacheData = {
      data: data,
      expireAt: expireAt
    }
    GM_setValue(cacheKey, cacheData)
  }

  /**
   * 获取缓存数据
   * @param {string} key - 存储的键名
   * @returns {any|null} - 返回实际数据，若不存在或已过期则返回 null
   */
  get(key) {
    const cacheKey = this.namespacePrefix + key
    const cacheData = GM_getValue(cacheKey, null)

    // 数据不存在
    if (cacheData === null) {
      return null
    }

    // 检查是否过期
    const now = Date.now()
    if (cacheData.expireAt && now > cacheData.expireAt) {
      this.delete(key) // 已过期，自动删除
      return null
    }

    return cacheData.data
  }

  /**
   * 删除指定缓存
   * @param {string} key - 存储的键名
   */
  delete(key) {
    const cacheKey = this.namespacePrefix + key
    GM_deleteValue(cacheKey)
  }

  /**
   * 清除所有已过期的数据
   */
  clearExpired() {
    const allKeys = GM_listValues()
    const now = Date.now()

    allKeys.forEach((key) => {
      // 只处理带有当前实例命名空间前缀的键
      if (key.startsWith(this.namespacePrefix)) {
        const cacheData = GM_getValue(key, null)
        if (cacheData && cacheData.expireAt && now > cacheData.expireAt) {
          GM_deleteValue(key)
        }
      }
    })
  }
}

const $logger = new Logger('zero搬运网-随便看')
const $alert = new Alert()
const $cache = new CacheManager()

$cache.clearExpired()
;(async function () {
  fix()

  const zjid = getZjid()
  if (!zjid) return $logger.error('获取zjid失败，请检查当前页面地址是否正确！')
  const kuid = getKuid()
  if (!kuid) return $logger.error('获取kuid失败！')
  $logger.info(`kuid=${kuid} zjid=${zjid}`)
  const readerData = getReaderData()
  if (!readerData) return $logger.error('获取阅读器数据失败！')
  $logger.info('阅读器数据', readerData)
  const imageContainerEl = document.querySelector('#image-container')
  if (!imageContainerEl) return $logger.error('获取阅读器图片容器失败！')
  $logger.info('阅读器图片容器', [imageContainerEl])
  const loginH3El = findElWithText('#image-container h3', '需要登录')
  const needLogin = !!loginH3El
  if (needLogin) {
    $alert.show('发现需要鉴权章节，尝试解析！', 10 * 1000)
    $logger.warning('发现当前章节需要登录才能查看！')
    const cacheName = `kuid-${kuid}`
    let comic = $cache.get(cacheName)
    if (comic) {
      $logger.success(`漫画数据缓存有效(${cacheName})`, comic)
    } else {
      $logger.warning(`未找到对应缓存(${cacheName})，尝试接口请求！`)
      try {
        const resp = await fetch(
          `/app/manhua.php?action=getmanhuabykuid&version=2&kuid=${kuid}`
        )
        const respJson = await resp.json()
        $logger.success('请求的漫画数据结果', respJson)
        if (respJson.code) throw new Error(`请求失败(${respJson.code})`)
        comic = respJson.data
        $cache.set(cacheName, comic, 3 * 60 * 60)
        $logger.info(`缓存漫画数据(${cacheName} | ${3 * 60 * 60}s)`, comic)
        $alert.show('获取漫画数据成功！', 3 * 1000)
      } catch (error) {
        $logger.error('请求漫画数据失败！', error)
        $alert.show('获取漫画数据失败！', 5 * 1000)
      }
    }
    if (!comic) return
    const manhuadir = comic.info.manhuadir
    if (!manhuadir) return $logger.error('没有找到对应的manhuadir！')
    $logger.info(`manhuadir=${manhuadir}`)
    const currentChapter = comic.zj.find((item) => item.zjid === Number(zjid))
    if (!currentChapter)
      return $logger.error(`未找到当前章节(zjid=${zjid})`, comic.zj)
    $logger.info('找到当前章节数据', currentChapter)
    $alert.show('找到当前章节数据', 3 * 1000)
    const imgOrigin = location.origin.replace('www', 'tupa')
    const imgList = currentChapter.images.map(
      (path) => `${imgOrigin}/manhua/${manhuadir}/${path}`
    )
    $logger.success('处理后的图片地址列表', imgList)
    const total = imgList.length
    ;[...imgList].reverse().forEach((imgUrl, index) => {
      imageContainerEl.insertAdjacentHTML(
        'afterbegin',
        createImageWarpper(total - index - 1, total, imgUrl)
      )
    })
    readerData.totalPages = total + 1
    readerData.currentPage = 1
    // 隐藏登录提示框
    loginH3El.parentElement.parentElement.style.display = 'none'
    // 修复最后一页类和样式
    const lastEl = imageContainerEl.lastElementChild
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
    $logger.success('当前章节可以随便看咯！')
    $alert.show('当前章节可以随便看咯！', 3 * 1000)
  } else {
    $logger.success('当前章节可以正常观看！')
  }
})()

function findElWithTextAll(selectors, text) {
  return Array.from(document.querySelectorAll(selectors)).filter((el) =>
    el.textContent.includes(text)
  )
}

function findElWithText(selectors, text) {
  const elList = findElWithTextAll(selectors, text)
  if (!elList.length) return null
  return elList[0]
}

function getZjid() {
  const chapterURL = new URL(location.href)
  return chapterURL.searchParams.get('zjid')
}

function getKuid() {
  const aEl = document.querySelector('a[href*=kuid]')
  if (aEl) {
    const detailsURL = new URL(new URL(aEl.href))
    return detailsURL.searchParams.get('kuid')
  }
  return null
}

function getReaderData() {
  return Array.isArray(document.body._x_dataStack) &&
    document.body._x_dataStack.length
    ? document.body._x_dataStack[0]
    : null
}

function createImageWarpper(index, total, imgUrl) {
  return `<div class="image-wrapper relative group flex flex-col items-center" :class="{ 'force-hidden': !isPageVisible(${index}, pageMode),'w-full': readingMode === 'vertical'}" :style="getWrapperStyle(${index})" style="height: 100%; width: auto; max-height: 100vh; object-fit: contain; flex-shrink: 0; max-width: 100vw !important">
    <div class="relative flex justify-center items-center" :class="{ 'w-full': readingMode === 'vertical' }">
        <img src="${imgUrl}" fetchpriority="high" class="manga-image" :style="getImageStyle()" alt="Page ${index + 1}" style="border: 1px solid #000 !important; max-height: 100vh; width: auto; max-width: 100%">

            <!-- 非垂直模式下的页码 (右下角) -->
            <div x-show="showPageNum && readingMode !== 'vertical'" class="absolute right-2 bottom-2 z-10 bg-black/60 text-white text-[11px] px-2 py-0.5 rounded backdrop-blur-sm pointer-events-none font-bold font-mono shadow-sm border border-white/10">
                <span x-text="${index + 1}">${index + 1}</span> / <span x-text="totalPages">${total}</span>
    </div>
    </div>
    <div x-show="showPageNum && readingMode === 'vertical'" :style="{ marginTop: borderWidth }" class="w-full py-1 text-center font-bold font-mono text-black dark:text-white text-[12px]" style="margin-top: 1px; display: none;">
        <span x-text="${index + 1}">${index + 1}</span> / <span x-text="totalPages">${total}</span>
    </div>
    </div>`
}

function fix() {
  const headerEl = document.querySelector('body>div.pl-0')
  headerEl.classList.remove('pl-0')

  const pageClickAreaElList = document.querySelectorAll(
    'body > div[class*="z-[90]"][class*="fixed"]'
  )
  pageClickAreaElList.forEach((el) => {
    el.classList.replace('z-[90]', 'z-[89]')
  })

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
    if (lastEl.classList.contains('z-[100]')) {
      lastEl.firstElementChild.classList.add('pointer-events-auto')
    }
  }
}
