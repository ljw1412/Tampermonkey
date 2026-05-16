// ==UserScript==
// @name         漫画助手 by:100-A
// @namespace    http://tampermonkey.net/
// @version      0.2.0
// @description  漫画助手
// @author       You
// @match        *://*.manhuagui.com/*
// @match        *://www.mangabox.me/reader/*/episodes/
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

const USE_ARIA2_KEY = 'use-aria2'
function updateMenu() {
  const isEnabled = GM_getValue(USE_ARIA2_KEY, false)
  const menuText = isEnabled ? '✅ 已启用aria2下载' : '❌ 已禁用aria2下载'
  GM_registerMenuCommand(
    menuText,
    () => {
      const currentState = GM_getValue(USE_ARIA2_KEY, false)
      GM_setValue(USE_ARIA2_KEY, !currentState)
      show_dialog(!currentState ? '✅ 已启用aria2下载' : '❌ 已禁用aria2下载')
    },
    { id: 'use-aria2' }
  )
}
updateMenu()
GM_addValueChangeListener(
  USE_ARIA2_KEY,
  function (key, oldValue, newValue, remote) {
    console.log(
      '[漫画助手]',
      `配置 "${key}" 已从 ${oldValue} 变更为 ${newValue}`
    )
    // 同时更新菜单文本，保持状态同步
    updateMenu()
  }
)

//***************************manhuagui的下载解析******************************

const iconMoon =
  '<svg data-v-2bc6460e="" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" class="arco-icon arco-icon-moon-fill" stroke-width="4" stroke-linecap="butt" stroke-linejoin="miter" filter="" style="font-size: 32px;"><path d="M42.108 29.769c.124-.387-.258-.736-.645-.613A17.99 17.99 0 0 1 36 30c-9.941 0-18-8.059-18-18 0-1.904.296-3.74.844-5.463.123-.387-.226-.768-.613-.645C10.558 8.334 5 15.518 5 24c0 10.493 8.507 19 19 19 8.482 0 15.666-5.558 18.108-13.231Z" fill="currentColor" stroke="none"></path></svg>'
const iconSun =
  '<svg data-v-2bc6460e="" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" class="arco-icon arco-icon-sun" stroke-width="4" stroke-linecap="butt" stroke-linejoin="miter" filter="" style="font-size: 32px;"><circle cx="24" cy="24" r="7"></circle><path d="M23 7h2v2h-2zM23 39h2v2h-2zM41 23v2h-2v-2zM9 23v2H7v-2zM36.73 35.313l-1.415 1.415-1.414-1.415 1.414-1.414zM14.099 12.686l-1.414 1.415-1.414-1.415 1.414-1.414zM12.687 36.728l-1.414-1.415 1.414-1.414 1.414 1.414zM35.314 14.1 33.9 12.686l1.414-1.414 1.415 1.414z"></path><path fill="currentColor" stroke="none" d="M23 7h2v2h-2zM23 39h2v2h-2zM41 23v2h-2v-2zM9 23v2H7v-2zM36.73 35.313l-1.415 1.415-1.414-1.415 1.414-1.414zM14.099 12.686l-1.414 1.415-1.414-1.415 1.414-1.414zM12.687 36.728l-1.414-1.415 1.414-1.414 1.414 1.414zM35.314 14.1 33.9 12.686l1.414-1.414 1.415 1.414z"></path></svg>'

function addDarkMode() {
  const btnDarkSwitch = $('<div class="btn-theme-switch"></div>')

  function updateTheme() {
    const theme = GM_getValue('manhuagui_theme', 'light')
    if (theme === 'dark') {
      $('html').attr('data-theme', 'dark')
      btnDarkSwitch.empty().append(iconMoon)
    } else {
      $('html').removeAttr('data-theme')
      btnDarkSwitch.empty().append(iconSun)
    }
  }

  updateTheme()

  btnDarkSwitch.click(() => {
    const theme = GM_getValue('manhuagui_theme', 'light')
    GM_setValue('manhuagui_theme', theme !== 'dark' ? 'dark' : 'light')
    updateTheme()
  })

  $('body').append(btnDarkSwitch)
  GM_addStyle(`
  .btn-theme-switch {
    position: fixed;
    bottom: 80px;
    right: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    font-size: 30px;
    line-height: 1;
    color: #fff;
    background-color: var(--theme-switch-bg, rgba(0, 0, 0, 0.15)) ;
    cursor: pointer;
    z-index: 10001;
  }
  .btn-theme-switch:hover {
    background-color: #e32727;
  }
  .btn-theme-switch > svg {
    width: 1em;
    height: 1em;
    opacity: var(--theme-switch-opacity, 0.8);
  }
  .btn-theme-switch:hover > svg {
    opacity: 1;
  }

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

  html[data-theme='dark'] a {
    color: var(--color-text-1);
  }

  html[data-theme='dark'] .topper,
  html[data-theme='dark'] .footer,
  html[data-theme='dark'] .footer-wrap {
    color: var(--color-text-1);
    background-color: var(--color-bg-2);
  }

  html[data-theme='dark'] .topper{
    border-color: var(--color-border-2);
    box-shadow: 0 1px 3px var(--color-border-2);
  }

  html[data-theme='dark'] .footer {
    border-color: var(--color-border-2);
  }

  html[data-theme='dark'] .footer-wrap {
    border-color: var(--color-border-1);
  }

  html[data-theme='dark'] .footer-cont {
    color: var(--color-text-3);
  }
    
  html[data-theme='dark'] .user-area .over .handle {
    background-color: var(--color-fill-4);
  }

  html[data-theme='dark'] .user-view .panel {
    background-color: var(--color-bg-3);
  }

  html[data-theme='dark'] .hlist li:hover {
    background-color: var(--color-fill-2);
  }

  html[data-theme='dark'] .hlist a:hover {
    color: var(--color-primary);
  }

  html[data-theme='dark'] .hlist-remove {
    background-color: var(--color-fill-3);
  }

  html[data-theme='dark'] .nav-less {
    color: var(--color-text-1);
    background-color: #df8f27;
    border-color: var(--color-border-4);
  }

  html[data-theme='dark'] .box-gray {
    border: 1px solid var(--color-border-2);
  }

  html[data-theme='dark'] .bar-title {
    background: var(--color-bg-2);
    border-color: 1px solid var(--color-border-2);
  }

  html[data-theme='dark'] .filter-title h2 {
    background-color: var(--color-bg-4);
  }

  html[data-theme='dark'] .filter-click {
    border-color: var(--color-border-2);
  }
    
  html[data-theme='dark'] .filter-click a {
    background-color: var(--color-bg-3);
  }

  html[data-theme='dark'] .filter-nav {
    background-color: var(--color-bg-3);
  }

  html[data-theme='dark'] .filter-nav .filter {
    border-color: var(--color-border-2);
  }

  html[data-theme='dark'] .filter:hover {
    background-color: var(--color-fill-2);
  }

  html[data-theme='dark'] .bar-tab {
    background: var(--color-bg-2);
    border-color: var(--color-border-2);
  }

  html[data-theme='dark'] .book-sort h5 {
    color: var(--color-text-1);
    border-color: var(--color-border-2);
  }

  html[data-theme='dark'] .book-sort li {
    border-color: var(--color-border-2);
  }

  html[data-theme='dark'] .book-sort li.current {
    background-color: var(--color-fill-3);
  }

  
  html[data-theme='dark'] .chapter-list *,
  html[data-theme='dark'] .score *,
  html[data-theme='dark'] .comment *,
  html[data-theme='dark'] .recent-cont * {
    border-color: var(--color-border-2);
  }

  html[data-theme='dark'] .bar-tab,
  html[data-theme='dark'] .book-intro,
  html[data-theme='dark'] .intro-act,
  html[data-theme='dark'] .score-vote,
  html[data-theme='dark'] .score-per p,
  html[data-theme='dark'] .commentBox h2 .t_c,
  html[data-theme='dark'] .comment_tab,
  html[data-theme='dark'] .content_r .text,
  html[data-theme='dark'] .content_r .info_bar .userName {
    color: var(--color-text-2);
  }

  html[data-theme='dark'] .score,
  html[data-theme='dark'] .stitle,
  html[data-theme='dark'] .recent-cont,
  html[data-theme='dark'] .book-similar,
  html[data-theme='dark'] .chapter-bar,
  html[data-theme='dark'] .chapter-bar h3,
  html[data-theme='dark'] .chapter-list li a,
  html[data-theme='dark'] .comment
  {
    background-color: var(--color-bg-3);
    border-color: var(--color-border-2);
    box-shadow: none;
  }
  

  html[data-theme='dark'] .chapter-list li a {
    color: var(--color-text-2);
    box-shadow: none;
  }

  html[data-theme='dark'] .chapter-list li a:hover {
    color: var(--color-text-1);
    background: var(--color-primary);
  }

  html[data-theme='dark'] .chapter-list li a:hover span{
    border-color: var(--color-white);
  }
  `)
}

function printAriaText(doc = document) {
  const { filePath } = pVars.manga
  const script = $('script:contains("window[")', doc).html()
  if (script) {
    const text = new Function(
      'return ' + script.replace(`window["\\x65\\x76\\x61\\x6c"]`, '')
    )()
    const subText = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1)
    const info = JSON.parse(subText)
    const { bname = '漫画', cname = '0' } = info
    const slList = Object.keys(info.sl).map((key) => `${key}=${info.sl[key]}`)
    const slStr = slList.length > 0 ? '?' + slList.join('&') : ''
    const imageUrlList = info.files.map((path) => filePath + path + slStr)
    console.log(info)
    const ariaText = imageUrlList.map(
      (url) =>
        `aria2c "${url}" --referer="https://www.manhuagui.com/" --header="User-Agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0" --all-proxy="http://127.0.0.1:1086" --dir="./${bname}/${cname}/"`
    )
    console.log(`chcp 65001\n${ariaText.join('\n')}\npause`)
    addDownloadBtn(imageUrlList, {
      dir: `./output/${bname}/${cname}/`,
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0',
      referer: 'https://www.manhuagui.com/',
      'all-proxy': 'http://127.0.0.1:1086',
      'max-tries': 5,
      'retry-wait': 3
    })
  } else {
    console.log('script 不存在,无法解析')
  }
}

function addDownloadBtn(data, config = {}) {
  $('body').prepend(
    '<div id="downloadbox" style="position: fixed;right: 20px;bottom: 0px;z-index:999999">' +
      '<div align="right"><div style="width: 150px;margin-bottom: 20px;">' +
      '<input type="button" value="下载" id="download-btn" style="margin-left: 5px;border: 1px solid gray;background-color: rgba(75, 156, 226, 0.6);"></div></div></div>'
  )
  console.log('[漫画助手] 添加下载按钮成功')
  $('#download-btn').click(function () {
    downloadEp(data, config)
  })
}

function downloadEp(data, config = {}) {
  if (!GM_getValue(USE_ARIA2_KEY, false)) return
  data.forEach((url, i) => {
    fetch('http://localhost:6800/jsonrpc', {
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

var host = 'http://i.hamreus.com:8080'
function downloadikanman() {
  var a = $('.status0')
  var html = ''
  $('.status0').each(function () {
    $(this).after(
      $(this)
        .clone()
        .attr('class', 'downloadmode')
        .attr('url', $(this).attr('href'))
        .attr('href', 'javascript:void(0);')
        .attr('target', null)
        .css('display', 'none')
        .css('background', 'rgb(0, 119, 209)')
        .css('color', 'white')
    )
  })
  $('body').append(
    '<div id="dialog" style="position: fixed;right: 50%;bottom: 50%;z-index: 999999;color: black;background-color: white;padding: 5px;display:none;border: 2px solid #F00;transform: translate(50%,50%);"><span id="dialog_text"></span><span id="dialog_time"></span></div>'
  )
  $('.chapter').after(
    '<div id="showCommand" style="height: 240px;margin-top: 10px;display: none;" class="comment"><textarea id="Tdownload" style="width: 100%;height: 100%;" disabled="disabled"></textarea></div>'
  )
  $('.chapter-bar').after(
    '<div style="height: 20px; line-height: 20px; margin-bottom: 10px; font-size: 14px; position: relative;" id="changeModeDiv"></div>'
  )
  $('#changeModeDiv').append(
    '<div style="display: inline-flex; align-items: center; height: 20px;">' +
      '<span style="padding: 0 5px; margin-right: 5px; font-weight: bold;">解析模式</span>' +
      '<span id="modeTip" style="display:none; margin-right: 5px; font-weight: bold; color: #f00;">关</span>' +
      '<div id="modeBtn" mode="0" style="box-sizing: border-box; width: 40px; height: 100%; background-color: white; transition:1s; border: 1px solid #ccc; border-radius: 25px; cursor: pointer;">' +
      '<div id="roundBtn" style="box-sizing: border-box; height: 19px; width: 19px; margin-left: 0px; background-color: white; border: 1px solid #ccc; border-radius: 25px; transition:0.5s;"></div></div>' +
      '<div id="mybtns" style="display:none;position: absolute; right: 0px; top: 0px; font-size: 13px;">' +
      '<button id="alldownload" style="box-sizing: border-box; margin-right: 5px; padding: 0 4px; background-color: #65D265; border: 1px solid #666;height: 20px; font-weight: bold;">全部解析</button>' +
      '<button id="copy" style="box-sizing: border-box; padding: 0 4px; background-color: #65D265; border: 1px solid #666; height: 20px; font-weight: bold;">复制结果</button></div></div>'
  )
  $('#modeBtn').click(function () {
    changemode()
  })
  $('#copy').click(function () {
    copyText($('#Tdownload').text())
    show_dialog('复制成功')
  })
  $('.downloadmode').click(function () {
    $('#Tdownload').text('')
    var url = $(this).attr('url')
    getDownloadUrls(url)
  })
  $('#alldownload').click(function () {
    $('#Tdownload').text('')
    alldown(a)
  })
  console.log('[漫画助手] 添加解析条控件成功')
}

function changemode() {
  var mode = $('#modeBtn').attr('mode')
  if (mode == 0) {
    $('#roundBtn').css('margin-left', '20px')
    $('#modeBtn').css('background-color', '#65D265')
    $('#modeTip').text('开')
    $('#modeTip').css('color', '#1b9004')
    $('#modeBtn').attr('mode', '1')
    $('#mybtns').show()
    $('#showCommand').slideDown()
    downloadMode()
  } else {
    $('#roundBtn').css('margin-left', '0px')
    $('#modeBtn').css('background-color', 'white')
    $('#modeTip').text('关')
    $('#modeTip').css('color', '#f00')
    $('#modeBtn').attr('mode', '0')
    $('#mybtns').hide()
    $('#showCommand').slideUp()
    readMode()
  }
}

function downloadMode() {
  $('.status0').hide()
  $('.downloadmode').show()
}

function readMode() {
  $('.status0').show()
  $('.downloadmode').hide()
}

function alldown(a) {
  for (let i = 0; i < a.size(); i++) {
    setTimeout(async () => {
      await getDownloadUrls(a.eq(i).attr('href'), true)
      if (i < a.size() - 1) {
        console.log('【3秒后启动下一章解析】')
      } else {
        $('#Tdownload').append(`\npause`)
        show_dialog('全部解析完成！')
      }
    }, 3000 * i)
  }
}
var index = 0
async function getDownloadUrls(url, append = false) {
  var idName = 'myform' + index
  index++
  const html = await fetch(url).then((resp) => resp.text())
  console.log(html)
  const parser = new DOMParser()
  // 使用DOMParser的parseFromString方法来转换XML字符串到Document对象
  const xmlDoc = parser.parseFromString(html, 'text/html')
  // 检查是否有错误
  if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
    throw new Error('Parsing error')
  }
  // console.log(xmlDoc)
  const script = $('script:contains("window[")', xmlDoc).html()
  const imgBase = 'https://us.hamreus.com'
  if (script) {
    const text = new Function(
      'return ' + script.replace(`window["\\x65\\x76\\x61\\x6c"]`, '')
    )()
    const subText = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1)
    const info = JSON.parse(subText)
    const { bname = '漫画', cname = '0', path } = info
    const filePath = imgBase + path
    console.log(info)
    const slList = Object.keys(info.sl).map((key) => `${key}=${info.sl[key]}`)
    const slStr = slList.length > 0 ? '?' + slList.join('&') : ''
    const imageUrlList = info.files.map((path) => filePath + path + slStr)
    const ariaText = imageUrlList.map(
      (url) =>
        `aria2c "${url}" --max-tries=5 --retry-wait=3 --referer="https://www.manhuagui.com/" --header="User-Agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0" --all-proxy="http://127.0.0.1:1086" --dir="./${bname}/${cname}/"`
    )
    console.log(`chcp 65001\n${ariaText.join('\n')}\npause`)
    if (append) {
      $('#Tdownload').append(
        `${$('#Tdownload').text() ? '\n\n' : ''}chcp 65001\n${ariaText.join('\n')}`
      )
    } else {
      $('#Tdownload').text(`chcp 65001\n${ariaText.join('\n')}\npause`)
    }
    console.log(`解析完成：${bname}/${cname}`)
    downloadEp(imageUrlList, {
      dir: `./output/${bname}/${cname}/`,
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0',
      referer: 'https://www.manhuagui.com/',
      'all-proxy': 'http://127.0.0.1:1086',
      'max-tries': 5,
      'retry-wait': 3
    })
  }
  //$('body').append('<iframe id="'+idName+'" name="'+idName+'" src="'+url+'" height="0" width="0"></iframe>');
  //$('#'+idName).load(function(){
  //         var mywindow=$('#'+idName)[0].contentWindow;
  //         var cInfo = mywindow.cInfo;
  //         console.log(cInfo);
  //         var baseUrl = host+cInfo.path;
  //         var objs = cInfo.files;
  //         var others = '--referer="http://www.manhuagui.com"';
  //         var outText = printResults(cInfo.bname,cInfo.cname,objs,baseUrl,others);
  //         $('#Tdownload').append(outText);
  //         $(this).remove();
  //     });
}
//----------------------manhuagui的下载解析END-------------------------------

//*******************************漫画王mangabox********************************
function mangabox() {
  if (navigator.userAgent.indexOf('Android') > -1) {
    var title = $('.episodes_title').text()
    var author = '['
    var temp = $('.episodes_author')
    for (var z = 0; z < temp.length; z++) {
      author += temp.eq(z).text() + (z !== temp.length - 1 ? '_' : '')
    }
    author += ']'
    var bname = title + author
    var css =
      '<style>.forDownload{position: absolute;top: 11px;right: 11px;cursor: pointer;border: 1px solid #D2D2D2;background-color: #75B3C8;color: white;padding: 4px;}' +
      '.forDownload:hover{background-color: green;color: white;}' +
      '</style>'
    $('body').prepend(
      css +
        '<div id="myShadow" style="display:none;position: fixed; left: 0px; top: 0px; z-index: 89999; opacity: 0.5; width: 100%; height: 100%; background: none 0% 0% repeat scroll rgb(0, 0, 0);"></div>'
    )
    var $download_btn = $('<a class="forDownload downloadThis">解析本话</a>')
    var $download_all_btn = $(
      '<a class="forDownload" id="downloadAll">解析全部</a>'
    )
    $('.episodes_main').css('position', 'relative').append($download_all_btn)
    var episodes_item = $('.episodes_item a').parent()
    episodes_item.css('position', 'relative')
    episodes_item.append($download_btn)
    $('.downloadThis').click(function () {
      $('#Tdownload').empty()
      $('#printdialog').show()
      $('#myShadow').show()
      var cname = $(this).prev('a').find('.episodes_strong_text').text()
      request($(this).prev('a').attr('href'), bname, cname)
    })
    $('#downloadAll').click(function () {
      $('#Tdownload').empty()
      $('#printdialog').show()
      $('#myShadow').show()
      getAll(bname)
    })
    var PrintDialog =
      '<div id="printdialog" style="position: fixed;left: 50%;top: 50%;z-index: 99998;transform: translate(-50%,-50%);width: 70%;height: 70%;background-color: white;border: 1px solid #75B3C8;border-radius: 20px;display:none;text-align:center">' +
      '<div style="text-align: center;padding: 5px;">解析结果</div>' +
      '<textarea id="Tdownload" style="width: 95%;height: 85%;border: 1px solid green;font-family: 微软雅黑" disabled="disabled"></textarea>' +
      '<div style="text-align: center;padding: 5px;">' +
      '<button style="border: 0;background-color: rgb(255, 0, 0);font-size: 16px;font-weight: bold;color:white;font-family: 微软雅黑;padding: 3px 10px;margin-right: 10px;" id="copy">复制</button>' +
      '<button style="border: 0;background-color: rgb(0, 255, 0);font-size: 16px;font-weight: bold;color:black;font-family: 微软雅黑;padding: 3px 10px;margin-left: 10px;" id="close">关闭</button>' +
      '</div></div>'
    $('body').append(PrintDialog)
    $('body').append('<div id="AjaxTemp"></div>')
    //添加提示框
    $('body').append(
      '<div id="dialog" style="position: fixed;right: 50%;bottom: 50%;z-index: 999999;color: black;background-color: white;padding: 5px;display:none;border: 2px solid #F00;transform: translate(50%,50%);"><span id="dialog_text"></span><span id="dialog_time"></span></div>'
    )

    $('#copy').click(function () {
      copyText($('#Tdownload').text())
      show_dialog('复制成功')
      $('#printdialog').hide()
      $('#myShadow').hide()
    })
    $('#close').click(function () {
      $('#printdialog').hide()
      $('#myShadow').hide()
    })
    $('#myShadow').click(function () {
      $('#printdialog').hide()
      $('#myShadow').hide()
    })
  }
}

function request(url, bname, cname) {
  $.ajax({
    url: url,
    success: function (res) {
      $('#AjaxTemp').html($(res).filter('script:contains("portrait_img")'))
      //console.log(portrait_img);
      $('#Tdownload').append(
        printResults(bname, cname, portrait_img, '', '--no-check-certificate')
      )
    }
  })
}

function getAll(bname) {
  var urls = $('.episodes_item a:not(.forDownload)')
  for (var i = 0; i < urls.length; i++) {
    var cname = urls.eq(i).find('.episodes_strong_text').text()
    request(urls.eq(i).attr('href'), bname, cname)
  }
}

//---------------------------漫画王mangaboxEND---------------------------------

//*********************************通用********************************
//输出结果
function printResults(bname, cname, objs, baseUrl, others) {
  //objs为对象数组，bname漫画名，cname章节名，[baseurl为基础下载地址用于拼接，others是额外参数]没有输入'';
  var output = ('.\\download\\' + bname + '\\' + cname + '\\').replace(
    /[・]/g,
    '.'
  )
  var outText = 'mkdir "' + output + '"\r\n'
  for (var i = 0; i < objs.length; i++) {
    var outName = i + 1
    if (i < 99) outName = '0' + (i + 1)
    if (i < 9) outName = '00' + (i + 1)
    var ext = ''
    var temp = objs[i].split('.')
    if (temp.length > 1) {
      ext = '.' + temp[temp.length - 1]
    }
    if (ext.indexOf('?') != -1) {
      ext = ext.substring(0, ext.indexOf('?'))
    }
    var inputUrl = baseUrl + objs[i]
    var outputPath = output + outName + ext
    outText +=
      'wget "' + inputUrl + '" -O "' + outputPath + '" ' + others + '\n'
  }
  console.log(bname + cname + '解析完毕！')
  return outText
}
//添加简单按钮 显示，置顶，复制
function addbutton(total, html) {
  $('body').prepend(
    '<div id="downloadbox" style="position: fixed;right: 20px;bottom: 0px;z-index:999999">' +
      '<div id="mytotal" style="width: 136px;background-color:rgba(16, 160, 28, 0.60);padding: 2px;margin-left: 14px;text-align: center;">共' +
      total +
      '张</div>' +
      '<textarea id="Tdownload" style="width: 400px;height: 190px;display:none"  disabled="disabled">' +
      html +
      '</textarea>' +
      '<div align="right"><div style="width: 150px;margin-bottom: 20px;">' +
      '<input type="button" value="显示" id="hidden" style="margin-top: 5px;border: 1px solid gray;background-color: rgba(255, 0, 0, 0.6);">' +
      '<input type="button" value="置顶" id="backhand" style="margin-left: 5px;border: 1px solid gray;background-color: rgba(203, 214, 37, 0.6);" onclick="JavaScript:scroll(0,0)">' +
      '<input type="button" value="复制" id="copy" style="margin-left: 5px;border: 1px solid gray;background-color: rgba(75, 156, 226, 0.6);"></div></div></div>'
  )
  //添加提示框
  $('body').append(
    '<div id="dialog" style="position: fixed;right: 50%;bottom: 50%;z-index: 999999;color: black;background-color: white;padding: 5px;display:none;border: 2px solid #F00;transform: translate(50%,50%);"><span id="dialog_text"></span><span id="dialog_time"></span></div>'
  )
  //绑定事件
  $('#hidden').click(function () {
    if ($('#hidden').val() == '隐藏') {
      $('#Tdownload').hide()
      $('#mytotal').css('width', '136px').css('margin-left', '14px')
      $('#hidden').val('显示')
    } else {
      $('#Tdownload').show()
      $('#mytotal').css('width', '100%').css('margin-left', '0')
      $('#hidden').val('隐藏')
    }
  })

  $('#copy').click(function () {
    copyText(html)
    show_dialog('图片地址复制成功')
  })
}
//复制到剪贴板
function copyText(d) {
  var text = $(
    '<textarea style="width: 0;height: 0;" id="copy_tmp">' + d + '</textarea>'
  )
  $('body').append(text)
  text.select()
  document.execCommand('Copy')
  $('#copy_tmp').remove()
}
//显示提示框
var time
function show_dialog(text) {
  time = 2
  $('#dialog_text').text(text)
  $('#dialog').show()
  $('#dialog_time').text('.' + time)
  var timeset = setInterval(function () {
    if (time > 0) {
      time--
      $('#dialog_time').text('.' + time)
    } else {
      $('#dialog').hide()
      clearInterval(timeset)
    }
  }, 1000)
}

//***************************执行体******************************
//看漫画破解屏蔽
if (location.host.includes('manhuagui.com')) {
  //console.log($.cookie('country'));
  if (
    $.cookie('country') == 'CN' ||
    typeof $.cookie('country') === 'undefined'
  ) {
    $.cookie('country', 'HK', { domain: 'manhuagui.com', path: '/' })
    location.reload()
  }
  addDarkMode()
}

$(document).ready(function () {
  //console.log(location.host);
  if (location.host.includes('manhuagui.com')) {
    if (location.pathname.startsWith('/comic/')) {
      if (/\/comic\/\d+\/\d+.html/.test(location.pathname)) {
        printAriaText()
      } else if (/\/comic\/\d+/.test(location.pathname)) {
        downloadikanman()
      }
    }
  }

  if (location.host.indexOf('mangabox') >= 0) {
    mangabox()
  }
})
