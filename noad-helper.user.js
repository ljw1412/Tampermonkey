// ==UserScript==
// @name         视频网站去广告+VIP解析
// @namespace    http://tampermonkey.net/
// @version      2.1.5
// @description  跳过视频网站前置广告
// @author       huomangrandian
// @match        https://*.youku.com/v_show/id_*
// @match        https://*.youku.com/video*
// @match        https://www.iqiyi.com/v_*
// @match        https://www.iqiyi.com/w_*
// @match        https://www.mgtv.com/b/*/*.html*
// @match        https://www.mgtv.com/s/*/*.html*
// @match        https://v.qq.com/x/cover/*/*.html*
// @match        https://v.qq.com/x/page/*.html*
// @match        https://www.le.com/ptv/vplay/*
// @match        https://tv.sohu.com/v/*
// @match        https://film.sohu.com/album/*
// @match        https://www.1905.com/vod/play/*
// @match        https://vip.1905.com/play/*
// @icon         https://www.iqiyipic.com/common/fix/128-128-logo.png
// @require      https://scriptcat.org/lib/637/1.4.5/ajaxHooker.js
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// ==/UserScript==

/* global ajaxHooker mgtvPlayer adPlayer txv videoPlayer QiyiPlayerLoader QyLoginInst QySdk _player */
/* ajaxHooker文档 https://bbs.tampermonkey.net.cn/thread-3284-1-1.html */
const APP_NAME = 'NOAD_HELPER'
const _CONFIG_ = {
  debug: true,
  playerDebug: false,
  showVipBtn: true,
  position: 'br', // 可选项'tl','tr','bl','br'
  offsetY: 120
}
_CONFIG_.position = GM_getValue(`${APP_NAME}:position`, 'tl')
_CONFIG_.offsetY = GM_getValue(`${APP_NAME}:offsetY`, 120)
/*=====================================*/
/*<<<<<<<<<<<< 核心数据 >>>>>>>>>>>>*/
const _DATA_ = {
  // 站点
  Sites: {
    'iqiyi.com': {
      name: 'iqiyi',
      mode: 'handler',
      container: '#video',
      beforeEach() {
        if (!$store.engine) {
          const players = QiyiPlayerLoader._manager._players
          const key = Object.keys(players)[0]
          if (key) {
            const player = players[key]
            if (typeof player === 'object') {
              $store.player = player
              const engine = player._engine
              if (engine) {
                $store.engine = engine
                $logger.info('beforeEach', '找到播放器引擎', engine)
                return
              }
            }
          }
          $logger.info('beforeEach', '未找到播放器引擎')
        }
      },
      bindEvent() {
        const engine = $store.engine
        // 登录弹窗相关
        QySdk.Event.on('LoginDialogShown', (e) => {
          if (QyLoginInst.enabled && QyLoginInst.params.s3 !== 'mainframe') {
            $logger.info('LoginDialogShown', e, '弹出登录界面尝试关闭')
            QyLoginInst.openLoginByJs({ type: 'normal', disable: true })
          }
        })
        const NTF_StatusChanged = 'statusChanged'
        const NTF_AD_BLOCK = 'adblock'
        const NTF_Recharge = 'recharge'
        engine.on(NTF_StatusChanged, (e) => {
          $logger.info(`Player[${NTF_StatusChanged}]`, e.state, e)
          if (['adstartplay', 'adplaying', 'adpaused'].includes(e.state)) {
            $logger.info(
              `Player[${NTF_StatusChanged}]`,
              e.state,
              '自动监听执行跳过广告方法！'
            )
            this.skipAD()
            this.autoVipFn()
          }
        })
        engine.on(NTF_AD_BLOCK, (e) => {
          $logger.info(`Player[${NTF_AD_BLOCK}]`, '广告拦截倒计时空屏', e)
          if (typeof e === 'number') {
            engine.adproxy._engineFire('adblock', '0')
            this.autoVipFn()
          }
          // if(e > 1){
          //     engine.adproxy.adLoad({"blackScreen": true, "blackScreenDuration": 0.1, "videoEventId": ""})
          // }
        })
        engine.on(NTF_Recharge, (e) => {
          $logger.info(`Player[${NTF_Recharge}]`, '提示会员充值弹窗', e)
          this.autoVipFn()
        })

        const vipCoversBox = Utils.DOM.createElement('div', {
          id: 'vipCoversBox'
        })
        vipCoversBox.style.cssText = 'display: none;'
        document.body.appendChild(vipCoversBox)
      },
      skipAD: () => {
        const engine = $store.engine
        if (!engine) {
          $logger.info('skipAD', '未找到播放器引擎！')
          return
        }
        const e = engine.adproxy.getAdInfo()
        engine.adproxy.adSDKFire('ad-click', {
          id: e.id,
          area: 'ad-skip'
        })
        engine.playproxy.abortAllAres(e.rollType)
        engine.adproxy.rollEnd({
          rollType: e.rollType,
          videoEventId: e.videoEventId
        })
      },
      webFullscreen: () => {
        const player = $store.player
        if (player) player._view.webfullscreen.toggle({ isManual: true })
      },
      beforeReplacePlayer(href) {
        const player = $store.player
        if (player) player.pause()
        return href
      }
    },
    'mgtv.com': {
      name: 'mgtv',
      mode: 'handler',
      container: '#mgtv-player-wrap .mango-player',
      bindEvent() {
        mgtvPlayer.on('CHANGE_PLAYER_STATE', (e) => {
          $logger.info('CHANGE_PLAYER_STATE', e.name, e)
          if (['initialState'].includes(e.name)) {
            this.autoVipFn()
          }
        })
        // const t = {
        //   AD_WILL_SHOW: 'AD_WILL_SHOW',
        //   AD_WILL_END: 'AD_WILL_END',
        //   AD_END: 'AD_END'
        // }
        // Object.keys(t).forEach((key) => {
        //   adPlayer
        //     .getPlugin('MgAdPlugin')
        //     .adSDK.eventBus.addListener(t[key], (e) => {
        //       $logger.info(t[key], e)
        //     })
        // })
        adPlayer
          .getPlugin('MgAdPlugin')
          .adSDK.eventBus.addListener('AD_WILL_SHOW', (e) => {
            $logger.info('AD_WILL_SHOW', e)
            this.skipAD()
          })
      },
      skipAD() {
        const adPlugin = adPlayer.getPlugin('MgAdPlugin')
        if (adPlugin) {
          // adPlugin.adSDK.eventBus.dispatch({ type: 'SKIP' })
          adPlugin.adSDK.reset()
          adPlugin.adSDK.eventBus.dispatch({ type: 'FRONT_AD_END' })
        }
      },
      webFullscreen: () => {
        mgtvPlayer.webFullscreen()
      }
    },
    'youku.com': {
      name: 'youku',
      mode: 'handler',
      container: '#ykPlayer',
      beforeEach() {},
      bindEvent() {
        const onAdPlay = 'onadplay'
        videoPlayer.context.ad.on(onAdPlay, (e) => {
          $logger.info(`Player[${onAdPlay}]`, '自动监听，执行跳过广告方法！')
          this.skipAD()
          this.autoVipFn()
        })
      },
      skipAD() {
        videoPlayer.context.ad.stop()
        // videoPlayer.context.ui.setQuality('720p');
      },
      webFullscreen() {
        if (videoPlayer.context.status.webFullscreen) {
          videoPlayer._player.exitWebFullScreen()
        } else {
          videoPlayer._player.webFullScreen()
        }
      },
      beforeReplace(href) {
        videoPlayer.pause()
        $logger.info('beforeReplace', '暂停官方播放器视频')
        // 转换为旧地址以兼容
        if (href.includes('youku.com/video?')) {
          const UrlObj = new URL(href)
          const vid = UrlObj.searchParams.get('vid')
          $logger.info('beforeReplace', `获取到的vid为${vid}`, UrlObj)
          if (vid) {
            const oldHref = href
            href = `https://v.youku.com/v_show/id_${vid}.html`
            $logger.info('beforeReplace', '转换为旧地址：', oldHref, '=>', href)
          }
        }
        return href
      }
    },
    'v.qq.com': {
      name: 'qqVideo',
      mode: 'element',
      container: '#mod_player,#player,#player-container',
      requestHooker: {
        filter: [{ url: '/proxyhttp' }],
        hooker(request) {
          const { url, data } = request
          let params = {}
          if (data) {
            try {
              params = JSON.parse(data)
            } catch (error) {}
          }
          if (url.includes('/proxyhttp')) {
            let adparam = params.adparam || ''
            const buid = params.buid || ''
            if (buid === 'onlyad') {
              request.abort = true
              return
            }
            adparam = adparam.split('&').reduce((obj, param) => {
              const [key, value] = param.split('=')
              obj[key] = value
              return obj
            }, {})
            const { sspKey } = adparam
            request.response = (res) => {
              if (res.status !== 200) return
              $logger.info('res', url, res)
              const json = JSON.parse(res.responseText || res.response)
              const bakJson = JSON.parse(res.responseText || res.response)
              try {
                if (sspKey && json[sspKey]) {
                  const sspData = JSON.parse(json[sspKey])
                  if (sspData.auth) sspData.auth.is_vip = true
                  sspData.ads = []
                  json[sspKey] = JSON.stringify(sspData)
                }
              } catch (error) {
                $logger.info('requestHooker', error)
              }
              res.responseText = JSON.stringify(json)
              res.response = JSON.stringify(json)
              $logger.info(
                'requestHooker\n请求地址:',
                url,
                '\n原始回复:',
                bakJson,
                '\n修改回复:',
                json
              )
            }
          }
        }
      },
      webFullscreen: () => {
        const btnFakeFullscreen = document.querySelector('.txp_btn_fake')
        if (btnFakeFullscreen) btnFakeFullscreen.click()
      },
      beforeReplace(href) {
        const payTipsEl = document.querySelector('.panel-tip-pay')
        if (payTipsEl) {
          payTipsEl.style.display = 'none'
        }
        return href
      }
    },
    'sohu.com': {
      name: 'sohu',
      mode: 'element',
      container: '#player .x-player,#playerWrap .x-player',
      webFullscreen: () => {
        _player.ui.pageFsBtn.pageFsBtn.click()
      }
    },
    'le.com': {
      name: 'letv',
      mode: 'element',
      container: '#le_playbox>#video'
    },
    '1905.com': {
      name: '1905',
      mode: 'element',
      container: '#player,#vodPlayer'
    }
  },
  // 视频VIP解析器
  VideoParser: {
    list: [
      {
        name: '虾米',
        type: [1, 2],
        url: 'https://jx.xmflv.com/?url='
      },
      {
        name: 'yparse',
        type: [1, 2],
        url: 'https://jx.yparse.com/index.php?url='
      },
      {
        name: 'Player-JY',
        type: [1, 2],
        url: 'https://jx.playerjy.com/?url='
      },
      {
        name: 'm1907',
        type: [1, 2],
        url: 'https://im1907.top/?jx='
      },
      {
        name: '剖元',
        type: [1, 2],
        url: 'https://www.pouyun.com/?url='
      },
      {
        name: 'M3U8TV',
        type: [1, 2],
        url: 'https://jx.m3u8.tv/jiexi/?url='
      },
      {
        name: '虾米2',
        type: [1, 2],
        url: 'https://jx.xmflv.cc/?url='
      },
      {
        name: '夜幕',
        type: [1, 2],
        url: 'https://www.yemu.xyz/?url='
      },
      {
        name: 'qianqi',
        type: [1, 2],
        url: 'https://api.qianqi.net/vip/?url='
      },
      {
        name: 'CK',
        type: [1, 2],
        url: 'https://www.ckplayer.vip/jiexi/?url='
      },
      {
        name: '七哥',
        type: [1, 2],
        url: 'https://jx.nnxv.cn/tv.php?url='
      },
      {
        name: 'IK9',
        type: [1, 2],
        url: 'https://yparse.ik9.cc/index.php?url='
      },
      {
        name: 'PM',
        type: [1, 2],
        url: 'https://www.playm3u8.cn/jiexi.php?url='
      },
      {
        name: '盘古',
        type: [1, 2],
        url: 'https://www.pangujiexi.com/jiexi/?url='
      },
      {
        name: '77云',
        type: [1, 2],
        url: 'https://jx.77flv.cc/?url='
      },
      {
        name: '咸鱼云',
        type: [1, 2],
        url: 'https://jx.xymp4.cc/?url='
      },
      {
        name: '大米云',
        type: [1, 2],
        url: 'https://jx.dmflv.cc/?url='
      },
      {
        name: '极速2',
        type: [1, 2],
        url: 'https://jx.2s0.cn/player/?url='
      },
      {
        name: '冰豆解析',
        type: [1, 2],
        url: 'https://bd.jx.cn/?url='
      },
      {
        name: '8090',
        type: [1, 2],
        url: 'https://www.8090g.cn/?url='
      },
      {
        name: 'hls解析',
        type: [1, 2],
        url: 'https://jx.hls.one/?url='
      },
      {
        name: '973播放',
        type: [1, 2],
        url: 'https://jx.973973.xyz/?url='
      },
      {
        name: '红狐解析',
        type: [2],
        url: 'https://rdfplayer.mrgaocloud.com/player/?url='
      }
    ],
    findByName(name) {
      return _DATA_.VideoParser.list.find((item) => item.name === name)
    },
    filterByType(type) {
      return _DATA_.VideoParser.list.filter((item) => item.type.includes(type))
    }
  }
}
/*=====================================*/
/*<<<<<<<<<<<< 通用类 >>>>>>>>>>>>*/
class Emitter {
  constructor() {
    this.events = {}
  }

  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = []
    }
    this.events[event].push(callback)
    return () => this.off(event, callback)
  }

  once(event, callback) {
    const onceCallback = (...args) => {
      callback(...args)
      this.off(event, onceCallback) // 调用后自动移除监听器
    }
    this.on(event, onceCallback)
  }

  emit(event, ...args) {
    if (this.events[event]) {
      this.events[event].forEach((callback) => callback(...args))
    }
  }

  off(event, callback) {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter((cb) => cb !== callback)
    }
  }
}

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
      warning: this.#buildTitle('警告', '#f5a623')
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
}

class Timer {
  constructor(name, fn, delay = 0, cycles = 0) {
    this.timer = null
    this.name = name
    this.fn = fn
    this.delay = delay
    this.cycles = cycles
    this.running = false
    this.logger = new Logger(name)
  }

  setName(name) {
    this.name = name
    this.logger.setName(name)
  }

  setFn(fn) {
    this.fn = fn
    if (this.running) this.start()
  }

  setDelay(delay = 0) {
    this.delay = delay
    if (this.running) this.start()
  }

  setCycles(cycles = 0) {
    this.cycles = cycles
    if (this.running) this.start()
  }

  start(immediate = false) {
    if (this.delay <= 0) {
      throw new Error(`启动失败：无效延迟值[delay=${this.delay}]`)
      return
    }
    const isRestart = this.running
    if (this.running) this.stop()
    if (immediate) this.fn()
    let count = 1
    this.timer = window.setInterval(() => {
      if (this.cycles) {
        this.logger.info(`[${count}/${this.cycles}]`, '循环中……')
        if (count >= this.cycles) this.stop()
      }
      this.fn()
      count++
    }, this.delay)
    this.running = true
    this.logger.success('计时器成功' + (isRestart ? '重启' : '启动'))
  }

  stop() {
    if (this.running && this.timer) {
      window.clearInterval(this.timer)
      this.timer = null
      this.running = false
      this.logger.success('计时器成功停止')
    }
  }
}
/*=====================================*/
/*<<<<<<<<<<<< 通用工具方法 >>>>>>>>>>>>*/
const ObjectUtil = {
  only(obj, keys) {
    obj = obj || {}
    if ('string' == typeof keys) keys = keys.split(/ +/)
    return keys.reduce(function (ret, key) {
      if (null == obj[key]) return ret
      ret[key] = obj[key]
      return ret
    }, {})
  },
  nin(obj, keys) {
    obj = obj || {}
    if ('string' == typeof keys) keys = keys.split(/ +/)
    return Object.keys(obj).reduce(function (ret, key) {
      if (keys.includes(key)) return ret
      ret[key] = obj[key]
      return ret
    }, {})
  },
  isElement(el) {
    return el instanceof Element
  }
}

const DOMUtils = {
  createElement(tagName = 'div', options = {}) {
    const el = document.createElement(tagName)
    DOMUtils.updateElement(el, options)
    return el
  },
  updateElement(el, options = {}) {
    if (!el || !ObjectUtil.isElement(el)) return
    if (options.class) {
      options.className = options.class
    }
    const dataset = options.dataset
    const style = options.style
    options = ObjectUtil.nin(options, 'class dataset style')
    Object.entries(options).forEach(([key, value]) => {
      el[key] = value
    })
    if (typeof dataset === 'object') {
      Object.entries(dataset).forEach(([key, value]) => {
        el.dataset[key] = value
      })
    }
    if (style && typeof style === 'string') {
      el.style.cssText = style
    } else if (style && typeof style === 'object') {
      Object.entries(style).forEach(([key, value]) => {
        el.style[key] = value
      })
    }
  }
}

const Utils = {
  DOM: DOMUtils,
  Object: ObjectUtil
}
/*=====================================*/
/*<<<<<<<<<<<< 主程序 Main >>>>>>>>>>>>*/
const BASE_NAME = 'noad-helper'
Logger._NAME_ = APP_NAME
const $logger = new Logger('main')
const $emitter = new Emitter()
const $store = {
  selectedVip: ''
}
const noop = () => {}
// 存储DOM元素，方便全局使用
const panes = { inner: [], outter: [] }
const btnRestore = Utils.DOM.createElement('span', {
  id: `${BASE_NAME}_btn-vip-restore`,
  innerHTML: '还原',
  style: { display: 'none' }
})

class Core {
  _view = null
  logger = new Logger('core')
  bakPlayerId = `${BASE_NAME}_original-player`
  menuIds = []
  constructor(site) {
    this._site = site
    this.btns = {
      skipAD: typeof site.skipAD === 'function',
      webFullscreen: typeof site.webFullscreen === 'function'
    }
    this.name = site.name
    this.mode = site.mode ?? 'element'
    this.container = site.container
    this.checkContainer = (site.checkContainer ?? ((el) => !!el)).bind(this)
    this.beforeEach = (site.beforeEach ?? noop).bind(this)
    this.bindEvent = (site.bindEvent ?? noop).bind(this)
    this.skipAD = (site.skipAD ?? noop).bind(this)
    this.webFullscreen = (site.webFullscreen ?? noop).bind(this)
    this.beforeReplace = (site.beforeReplace ?? ((href) => href)).bind(this)
    this.requestHooker = site.requestHooker ?? {}
    this.autoVipFn = noop
    this.urlWatchTimer = this.#createUrlWatchTimer()
    this.controlVideoTimer = this.#createControlVideoTimer()
    this.watchContainerTimer = this.#createWatchContainerTimer()
    window.addEventListener('unload', () => {
      this.controlVideoTimer.stop()
      this.watchContainerTimer.stop()
    })
    this.urlWatchTimer.start()
    this.#initHooker()
    this.#bindEvent()
    this.#registerMenuCommand()
    this.init()
  }

  get isAuto() {
    return GM_getValue(`${this.name}:vip-auto`, false)
  }

  set isAuto(v) {
    GM_setValue(`${this.name}:vip-auto`, v)
  }

  get position() {
    const { position = 'tl' } = _CONFIG_
    const py = position.includes('b') ? 'bottom' : 'top'
    const px = position.includes('r') ? 'right' : 'left'
    return [py, px, py[0] + px[0]]
  }

  get selectedVip() {
    let name = GM_getValue(`${this.name}:selected-vip`, '')
    if (!name && _DATA_.VideoParser.list.length) {
      name = _DATA_.VideoParser.list[0].name
    }
    return name
  }

  set selectedVip(v) {
    $store.selectedVip = v
    GM_setValue(`${this.name}:selected-vip`, v)
  }

  #createUrlWatchTimer() {
    let oldHref = window.location.href
    return new Timer(
      '路由地址监听计时器',
      () => {
        let newHref = window.location.href
        if (oldHref !== newHref) {
          oldHref = newHref
          $emitter.emit('url-change', oldHref, newHref)
        }
      },
      1000
    )
  }

  #createWatchContainerTimer() {
    return new Timer(
      '容器元素寻找计时器',
      () => {
        const containerEl = document.querySelector(this.container)
        this.logger.info(`查找元素"${this.container}":`, containerEl)
        if (this.checkContainer(containerEl)) {
          this.skipAD()
          this.autoVipFn()
          this.watchContainerTimer.stop()
        }
      },
      1000,
      20
    )
  }

  #createControlVideoTimer() {
    return new Timer(
      'video节点控制计时器',
      () => {
        // 暂停并静音所有Video节点
        document.querySelectorAll('video').forEach((videoEl) => {
          videoEl.autoplay = false
          videoEl.pause()
          if (!videoEl.beforeVolume) {
            videoEl.beforeVolume = videoEl.volume || 0.2
          }
          videoEl.volume = 0
        })
      },
      100
    )
  }

  #initHooker() {
    const { filter, hooker } = this.requestHooker
    if (!hooker) return
    if (typeof hooker !== 'function') {
      this.logger.error('initHooker', '"hooker"必须是一个Function')
      return
    }
    if (Array.isArray(filter)) ajaxHooker.filter(filter)
    ajaxHooker.hook(hooker.bind(this))
    this.logger.success('initHooker', '请求劫持Hooker绑定成功！')
  }

  #bindEvent() {
    $emitter.on('url-change', (oldHref, newHref) => {
      this.logger.info('Emitter[url-change]', oldHref, '=>', newHref)
      // this.restorePlayer()
      this.init()
    })

    $emitter.on('replace-player', ({ name, url, href }) => {
      this.logger.info('Emitter[replace-player]', name, url, href)
      this.replacePlayer(url, href)
      this.selectedVip = name
    })

    $emitter.on('position-change', (position, offsetY) => {
      if (!this._view) {
        this.logger.error('Emitter[position-change]', '未找到"_view"')
        return
      }
      if (position && position !== _CONFIG_.position) {
        _CONFIG_.position = position
        GM_setValue(`${APP_NAME}:position`, position)
        this.logger.info('Emitter[position-change]', 'position:', position)
      }
      if (typeof offsetY === 'number' && offsetY !== _CONFIG_.offsetY) {
        _CONFIG_.offsetY = offsetY
        GM_setValue(`${APP_NAME}:offsetY`, offsetY)
        this.logger.info('Emitter[position-change]', 'offsetY:', offsetY)
      }
      this._view.updateViewPosition()
    })
  }

  #unregisterMenuCommand() {
    for (let i = 0; i < this.menuIds.length; i++) {
      const menuId = this.menuIds[i]
      GM_unregisterMenuCommand(menuId)
    }
    this.menuIds = []
  }
  #registerMenuCommand() {
    const that = this
    const positionMap = { lt: '↖左上', lb: '↙左下', rt: '↗右上', rb: '↘右下' }
    const menuList = [
      {
        name: `设置顶部或底部的距离`,
        fn() {
          const v = window.prompt(
            `设置距离${that.position[0] === 'top' ? '顶部' : '底部'}的间距：`,
            _CONFIG_.offsetY
          )
          if (v !== null && Number(v) >= 0) {
            $emitter.emit('position-change', null, Number(v))
          }
        },
        options: { id: 'offsetY' }
      },
      ...Object.keys(positionMap).map((position) => {
        return {
          name: `调整浮窗位置：${positionMap[position]}`,
          fn: () => {
            $emitter.emit('position-change', position)
          },
          options: { id: `position-${position}` }
        }
      })
    ]
    this.menuIds = menuList.map((menu) =>
      GM_registerMenuCommand(menu.name, menu.fn, menu.options || {})
    )
  }

  init() {
    this.logger.info(
      'init',
      `当前模式：${this.mode}`,
      `自动VIP: ${this.isAuto ? '开' : '关'}`
    )

    this.beforeEach()

    if (this.isAuto) {
      $store.selectedVip = this.selectedVip
      this.logger.info(
        'init',
        `当前选中解析站点名称：${$store.selectedVip || '无'}`
      )

      if ($store.selectedVip) {
        let vipParser = _DATA_.VideoParser.findByName($store.selectedVip)
        if (!vipParser) {
          vipParser = _DATA_.VideoParser.list[0]
          this.logger.warning('init', '未找到对应站点：', $store.selectedVip)
          this.logger.info('init', '默认使用第一个站点解析器：', vipParser)
        } else {
          this.logger.success('init', '找到对应站点解析器：', vipParser)
        }
        this.autoVipFn = () => {
          $emitter.emit('replace-player', {
            name: vipParser.name,
            url: vipParser.url,
            href: window.location.href
          })
        }
      }
    } else {
      this.restorePlayer()
    }

    if (this.mode === 'element') {
      this.watchContainerTimer.start()
    }
    if (this.mode === 'handler' && !this.listening) {
      this.bindEvent()
      this.listening = true
      this.logger.info('init', '绑定播放器事件监听')
    }
  }

  controlAllVideo(disabled = true) {
    this.logger.info(
      'controlAllVideo',
      disabled ? '暂停并静音所有Video节点' : '还原所有Video节点的音量'
    )
    if (disabled) {
      this.controlVideoTimer.start(true)
    } else {
      this.controlVideoTimer.stop()
      document.querySelectorAll('video').forEach((videoEl) => {
        // 还原所有Video节点的音量
        if (videoEl.beforeVolume) videoEl.volume = videoEl.beforeVolume || 0.2
        delete videoEl.beforeVolume
      })
    }
  }

  createPlayerEl(url, href) {
    const createElement = Utils.DOM.createElement
    const playerEl = createElement('div', {
      id: `${BASE_NAME}_player`,
      dataset: { site: this.name }
    })
    const iframe = createElement('iframe', {
      id: `${BASE_NAME}_iframe`,
      allowfullscreen: true,
      src: url + href
    })
    playerEl.appendChild(iframe)
    return playerEl
  }

  createBakPlayerEl() {
    let bakPlayerEl = document.querySelector(`#${this.bakPlayerId}`)
    if (!bakPlayerEl) {
      const createElement = Utils.DOM.createElement
      bakPlayerEl = createElement('div', {
        id: this.bakPlayerId,
        style: 'display: none;',
        dataset: { restorable: 'false' }
      })
      document.body.appendChild(bakPlayerEl)
    }
    return bakPlayerEl
  }

  replacePlayer(url, href) {
    if (!this.container || !url || !href) return
    href = this.beforeReplace(href)
    const containerEl = document.querySelector(this.container)
    if (!containerEl) {
      return this.logger.error(
        'replacePlayer',
        `未找到播放容器"${this.container}"`
      )
    }
    this.controlAllVideo(true)
    const playerEl = this.createPlayerEl(url, href)
    const bakPlayerEl = this.createBakPlayerEl()
    if (_CONFIG_.playerDebug) {
      bakPlayerEl.style.cssText =
        'display:block;position:fixed;top:0;left:0;width:480px;height:270px;z-index:88888; opacity:0.5; overflow:hidden;'
    }
    if (bakPlayerEl.dataset.restorable === 'false') {
      bakPlayerEl.append(...containerEl.childNodes)
      bakPlayerEl.dataset.restorable = 'true'
    } else {
      containerEl.innerHTML = ''
    }
    containerEl.appendChild(playerEl)
    btnRestore.style.display = 'inline-block'
    this.logger.success('replacePlayer', '替换播放器')
  }

  restorePlayer() {
    const containerEl = document.querySelector(this.container)
    if (!containerEl) {
      return this.logger.error(
        'restorePlayer',
        `未找到播放容器"${this.container}"`
      )
    }
    const bakPlayerEl = document.querySelector(
      `#${this.bakPlayerId}[data-restorable='true']`
    )
    if (bakPlayerEl) {
      containerEl.innerHTML = ''
      containerEl.append(...bakPlayerEl.childNodes)
      bakPlayerEl.dataset.restorable = 'false'
      btnRestore.style.display = 'none'
      panes.inner.forEach((el) => {
        if (el && el.dataset) el.dataset.active = false
      })
      this.controlAllVideo(false)
      this.autoVipFn = noop
      this.logger.success('restorePlayer', '还原播放器')
    }
  }
}

const BUTTON_CLASS = 'noad-helper-btn'
const btnVipId = BASE_NAME + '_vip'
const paneVipId = BASE_NAME + '_vip-pane'
const paneGridClass = BASE_NAME + '_grid'
const paneItemClass = BASE_NAME + '_grid-item'
const btnSkipId = BASE_NAME + '_btn-skip'
const btnWebfullscreenId = BASE_NAME + '_btn-webfullscreen'
class View {
  root = null
  paneVip = null

  constructor(core) {
    this._core = core
    core._view = this
    this.#generateStyle()
    this.#generate()
    this.updateViewPosition()
    btnRestore.addEventListener('click', () => {
      core.restorePlayer()
    })
  }

  get position() {
    return this._core.position
  }

  get tab() {
    return GM_getValue(`${this._core.name}:vip-tab`, 'inner')
  }

  set tab(v) {
    GM_setValue(`${this._core.name}:vip-tab`, v)
  }

  updateViewPosition() {
    const updateElement = Utils.DOM.updateElement
    if (this.root) {
      updateElement(this.root, {
        dataset: { position: this.position[2] },
        style: `${this.position[0]}: ${_CONFIG_.offsetY}px; ${this.position[1]}: 0;`
      })
    }
    if (this.paneVip) {
      const translateX = this.position[1] === 'left' ? '100%' : '-100%'
      updateElement(this.paneVip, {
        style: `${this.position[0]}: 0; ${this.position[1]}: 0;`
      })
    }
  }

  #generate() {
    const createElement = Utils.DOM.createElement
    this.root = document.getElementById(BASE_NAME)
    if (!this.root) {
      this.root = createElement('div', { id: BASE_NAME })
      document.body.appendChild(this.root)
      if (_CONFIG_.showVipBtn) this.#generateVipBtn()
      setTimeout(() => {
        this.root.dataset.inited = 'true'
      }, 1000)
    }

    if (this._core.btns.skipAD && !document.getElementById(btnSkipId)) {
      const btn = createElement('div', {
        id: btnSkipId,
        className: BUTTON_CLASS,
        innerHTML: '跳过<br/>广告',
        onclick: this._core.skipAD
      })
      this.root.appendChild(btn)
    }

    if (
      this._core.btns.webFullscreen &&
      !document.getElementById(btnWebfullscreenId)
    ) {
      const btn = createElement('div', {
        id: btnWebfullscreenId,
        className: BUTTON_CLASS,
        innerHTML: '网页<br/>全屏',
        onclick: this._core.webFullscreen
      })
      this.root.appendChild(btn)
    }
  }

  #generateVipBtn() {
    const createElement = Utils.DOM.createElement
    const that = this
    const paneVip = createElement('div', {
      id: paneVipId,
      dataset: { tab: this.tab }
    })
    this.paneVip = paneVip
    this.root.appendChild(paneVip)

    const paneTabs = createElement('div', { id: `${BASE_NAME}_vip-tabs` })
    const paneTabList = []
    function onTabClick() {
      paneTabList.forEach((tab) => {
        tab.dataset.active = tab === this
      })
      paneVip.dataset.tab = this.value
      that.tab = this.value
    }
    const paneTab1 = createElement('div', {
      className: `${BASE_NAME}_vip-tab`,
      innerHTML: '内嵌播放',
      onclick: onTabClick,
      value: 'inner'
    })
    const paneTab2 = createElement('div', {
      className: `${BASE_NAME}_vip-tab`,
      innerHTML: '新窗播放',
      onclick: onTabClick,
      value: 'outer'
    })
    paneTabList.push(paneTab1, paneTab2)
    paneTabList.forEach((tab) => {
      tab.dataset.active = tab.value === this.tab
      paneTabs.appendChild(tab)
    })
    paneVip.appendChild(paneTabs)

    const paneContent = createElement('div', {
      id: `${BASE_NAME}_vip-container`
    })
    const paneInner = createElement('div', {
      className: `${BASE_NAME}_vip-content`,
      dataset: { type: 'inner' }
    })
    const paneOuter = createElement('div', {
      className: `${BASE_NAME}_vip-content`,
      dataset: { type: 'outer' }
    })
    const paneInnerTip = createElement('div', { className: 'top-tips' })
    const paneOuterTip = createElement('div', {
      className: 'top-tips',
      innerHTML: '<div>新窗播放：打开新窗口</div>'
    })
    const paneInnerTipContent = createElement('div', {
      innerHTML: '<span>内嵌播放：替换播放器</span>'
    })
    // 添加提示内容，并在内容中添加还原按钮
    paneInnerTip.appendChild(paneInnerTipContent).appendChild(btnRestore)
    // 添加自动按钮
    function getAutoContent(auto = false) {
      return `<div id="${BASE_NAME}_btn-vip-auto" style="color: ${
        auto ? 'green' : 'red'
      }">自动模式 ${auto ? '开启' : '关闭'}</div>`
    }
    const btnAuto = createElement('div', {
      id: `${BASE_NAME}_vip-auto`,
      innerHTML: getAutoContent(this._core.isAuto)
    })
    btnAuto.addEventListener('click', () => {
      btnAuto.innerHTML = getAutoContent(!this._core.isAuto)
      this._core.isAuto = !this._core.isAuto
      window.location.reload()
    })
    paneInnerTip.appendChild(btnAuto)

    paneInner.appendChild(paneInnerTip)
    paneOuter.appendChild(paneOuterTip)
    panes.inner = this.#generateVipPaneGrid(
      paneInner,
      _DATA_.VideoParser.filterByType(1)
    )
    this.#generateVipPaneGrid(
      paneOuter,
      _DATA_.VideoParser.filterByType(2),
      true
    )
    paneContent.appendChild(paneInner)
    paneContent.appendChild(paneOuter)
    paneVip.appendChild(paneContent)

    const btnVip = createElement('div', {
      id: btnVipId,
      className: BUTTON_CLASS,
      innerHTML: 'VIP',
      dataset: { auto: this._core.isAuto }
    })
    btnVip.addEventListener('mouseenter', () => {
      this.paneVip.style.display = 'flex'
    })
    btnVip.addEventListener('mouseleave', () => {
      this.paneVip.style.display = ''
    })
    this.root.appendChild(btnVip)
  }

  #generateVipPaneGrid(parentEl, list = [], isLink = false) {
    const createElement = Utils.DOM.createElement
    const gridEl = createElement('div', { className: paneGridClass })

    list.forEach((item) => {
      let itemEl
      if (isLink) {
        itemEl = createElement('a', {
          className: paneItemClass,
          innerHTML: item.name,
          target: '_blank',
          href: item.url + window.location.href
        })
      } else {
        itemEl = createElement('div', {
          className: paneItemClass,
          innerHTML: item.name,
          dataset: {
            url: item.url,
            active: $store.selectedVip === item.name
          }
        })
        itemEl.vipData = item
        itemEl.addEventListener('click', () => {
          $emitter.emit('replace-player', {
            name: item.name,
            url: item.url,
            href: window.location.href
          })
          panes.inner.forEach((el) => {
            el.dataset.active = el.vipData === item
          })
        })
      }
      panes.inner.push(itemEl)
      gridEl.appendChild(itemEl)
    })
    parentEl.appendChild(gridEl)
    return panes.inner
  }

  #generateStyle() {
    GM_addStyle(`
#${BASE_NAME}{
  position: fixed;
  z-index: 999999;
  user-select: none;
}
#${BASE_NAME}[data-inited='true'] {
  transition: transform 0.1s, left 0.3s, top 0.3s, right 0.3s, bottom 0.3s;
}
#${BASE_NAME}[data-inited='true'][data-position$='l']{
  transform: translateX(-80%);
}
#${BASE_NAME}[data-inited='true'][data-position$='r']{
  transform: translateX(80%);
}
#${BASE_NAME}:hover{
  transform: translateX(0) !important;
}
.${BUTTON_CLASS}{
  position: relative;
  display: block;
  width: 38px;
  height: 38px;
  padding: 6px;
  font-size: 13px;
  line-height: 1;
  text-align: center;
  box-sizing: border-box;
  cursor: pointer;
  color: #fff;
  border: none;
  outline-style: none;
}
#${btnVipId}{
  background: #86909c;
  color: #e4a329;
  font-size: 16px;
  line-height:29px;
  font-weight: bold;
  white-space: nowrap;
}
#${btnVipId}[data-auto='true']{ background: #00b42a;}
#${btnSkipId}{background: #ff7d00;}
#${btnWebfullscreenId}{background: #168cff;}
#${paneVipId}{
  position: absolute;
  display: none;
  flex-direction: column;
  width: 320px;
  height: 324px;
  cursor: initial;
  color: #fff;
  font-weight: initial;
  text-align: left;
  border: 1px solid #333;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(3px);
}
#${BASE_NAME}[data-position$='l'] #${paneVipId}{
  padding-left: 38px;
}
#${BASE_NAME}[data-position$='r'] #${paneVipId}{
  padding-right: 38px;
}
#${paneVipId}:hover{ display: flex; }
#${BASE_NAME}_vip-tabs{ display: flex; border-bottom: 1px solid #333; background-color: rgba(255, 255, 255, 0.1);}
.${BASE_NAME}_vip-tab{ flex-shrink: 0; margin:6px 8px; font-size: 16px; font-weight: bold; cursor: pointer;}
.${BASE_NAME}_vip-tab[data-active="true"]{ color: #e4a329; }
#${BASE_NAME}_vip-container{ flex-grow: 1; height: 0; overflow-y: auto; background-color: rgba(255, 255, 255, 0.1);}
#${BASE_NAME}_vip-container::-webkit-scrollbar { width: 6px; height: 6px; }
#${BASE_NAME}_vip-container::-webkit-scrollbar-thumb { box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.2); background: #a8a8a8; border-radius: 4px;}
#${BASE_NAME}_vip-container::-webkit-scrollbar-track { box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.2); background: #000000; }
.${BASE_NAME}_vip-content{ display:none; }
.${BASE_NAME}_vip-content .top-tips{ display: flex ; justify-content: space-between; align-items: center; font-size: 12px; line-height: 18px; margin-top:4px; padding: 4px 8px; color: #999; }
#${BASE_NAME}_btn-vip-restore{ cursor: pointer; display: inline-block; border-radius: 4px; border: 1px solid currentColor; padding: 2px; font-size: 12px; line-height: 1; color: #ccc; margin-left: 4px; }
#${BASE_NAME}_vip-auto{ font-size: 12px; line-height: 1;}
#${BASE_NAME}_btn-vip-auto{ cursor: pointer; display: inline-block; border-radius: 4px; border: 1px solid currentColor; padding: 2px;}
#${paneVipId}[data-tab='inner'] .${BASE_NAME}_vip-content[data-type='inner']{ display: block; }
#${paneVipId}[data-tab='outer'] .${BASE_NAME}_vip-content[data-type='outer']{ display: block; }
.${paneGridClass}{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; padding: 8px;}
.${paneItemClass}{ cursor: pointer; display: block; color: #f2f2f2; font-size: 13px; line-height: 24px; text-align: center; border-radius: 4px; border: 1px solid #cccccc;}
.${paneItemClass}[data-active="true"]{ color: #e4a329; font-weight: bold; border-color: currentColor;}
.${paneItemClass}:not([data-active="true"]):hover { color: #e1b86a; border-color: currentColor; }
.${paneItemClass}:not([data-active="true"]):active { color: #e3ad4a; border-color: currentColor; }
#${BASE_NAME}_player{ width: 100%; height: 100%; z-index: 999999; }
#${BASE_NAME}_player[data-site='mgtv']{ position: absolute; top: 0; }
#${BASE_NAME}_iframe{ border:none; width:100%; height:100%; }
    `)
  }
}

;(function () {
  'use strict'
  const { origin } = location
  const siteKey = Object.keys(_DATA_.Sites).find((key) => origin.includes(key))
  if (!siteKey) {
    $logger.error('未找到对应的站点配置……', origin)
    return
  }
  const site = _DATA_.Sites[siteKey]
  $logger.info(`当前站点：${siteKey}`, '站点策略：', site)
  try {
    const core = new Core(site)
    const view = new View(core)
  } catch (error) {
    $logger.error(error)
  }
})()
