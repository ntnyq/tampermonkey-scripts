// ==UserScript==
// @name         pixiv image downloader
// @namespace    http://ntnyq.com
// @version      0.0.1
// @description  pixiv 图片下载器
// @author       ntnyq<ntnyq13@gmail.com>
// @match        https://www.pixiv.net/artworks/*
// @icon         https://avatars.githubusercontent.com/u/47700415?s=64&v=4
// @require      https://unpkg.com/xfetch-js
// @require      https://unpkg.com/@snackbar/core
// @require      https://unpkg.com/gmxhr-fetch
// @require      https://unpkg.com/jszip/dist/jszip.min.js
// @connect      pximg.net
// @grant        GM_xmlhttpRequest
// @copyright    https://github.com/maple3142/browser-extensions
// ==/UserScript==

;(() => {
  'use strict'

  const win = window
  const doc = document
  const body = doc.body
  const KEY_SAVE = `s`
  const USE_PIXIVCAT = true // much faster than pximg
  const FORMAT = {
    single: d => `${d.title}-${d.userName}-${d.id}`,
    multiple: (d, i) => `${d.title}-${d.userName}-${d.id}-p${i}`,
  }
  const {
    xf, // xfetch
    snackbar, // snackbar
    gmfetch, // gmxhr-fetch
    JSZip, // jszip
    // filenamify, // filenamify
  } = win
  const gxf = xf.extend({ fetch: gmfetch })
  const $ = s => doc.querySelector(s)
  const $$ = s => [...doc.querySelectorAll(s)]
  const elementMerge = (a, b) => {
    Object.keys(b).forEach(k => {
      if (typeof b[k] === `object`) elementMerge(a[k], b[k])
      else if (k in a) a[k] = b[k]
      else a.setAttribute(k, b[k])
    })
  }
  const $el = (s, o = {}) => {
    const el = doc.createElement(s)
    elementMerge(el, o)
    return el
  }

  const download = (url, name) => {
    const a = $el(`a`, { href: url, download: name || true })
    body.appendChild(a)
    a.click()
    body.removeChild(a)
  }
  const downloadBlob = (blob, name) => {
    const url = URL.createObjectURL(blob)
    download(url, name)
    URL.revokeObjectURL(url)
  }

  const getJSONBody = url => xf.get(url).json(r => r.body)
  const getIllustData = id => getJSONBody(`/ajax/illust/${id}`)
  const getUgoiraMeta = id => getJSONBody(`/ajax/illust/${id}/ugoira_meta`)
  const getCrossOriginBlob = (url, Referer = `https://www.pixiv.net/`) =>
    gxf.get(url, { headers: { Referer } }).blob()
  const getImageFromPximg = (url, pixivcat_multiple_syntax) => {
    if (USE_PIXIVCAT) {
      const [_, id, idx] = /\/(\d+)_p(\d+)/.exec(url)
      const newUrl = pixivcat_multiple_syntax
        ? `https://pixiv.cat/${id}-${parseInt(idx) + 1}.png`
        : `https://pixiv.cat/${id}.png`
      return xf.get(newUrl).blob()
    }
    return getCrossOriginBlob(url)
  }
  const saveImage = async ({ single, multiple }, id) => {
    const illustData = await getIllustData(id)
    if (snackbar) {
      snackbar.createSnackbar(`Downloading ${illustData.title}...`, {
        timeout: 1000,
      })
    }
    const { illustType } = illustData
    let results

    switch (illustType) {
      case 0:
      case 1:
        {
          // normal
          const url = illustData.urls.original
          const ext = url.split(`/`).pop().split(`.`).pop()

          if (illustData.pageCount === 1) {
            results = [
              [single(illustData) + '.' + ext, await getImageFromPximg(url)],
            ]
          } else {
            const len = illustData.pageCount
            const arr = []
            for (let i = 0; i < len; i++) {
              arr.push(
                Promise.all([
                  `${multiple(illustData, i)}.${ext}`,
                  getImageFromPximg(url.replace('p0', `p${i}`), true),
                ])
              )
            }
            results = await Promise.all(arr)
          }
        }
        break

      default:
        break
    }

    if (results.length === 1) {
      const [f, blob] = results[0]
      downloadBlob(blob, f)
    } else {
      const zip = new JSZip()
      for (const [f, blob] of results) {
        zip.file(f, blob)
      }
      const blob = await zip.generateAsync({ type: `blob` })
      const zipName = single(illustData)
      downloadBlob(blob, zipName)
    }
  }

  function getSelector() {
    const SELECTOR_MAP = {
      '/': ``,
      '/artworks/\\d+': `div[role=presentation]>a`,
    }

    for (const [key, val] of Object.entries(SELECTOR_MAP)) {
      const re = new RegExp(`^${key}$`)

      if (re.test(location.pathname)) {
        return val
      }
    }
  }

  win.addEventListener(`keydown`, evt => {
    if (evt.key !== KEY_SAVE) return
    evt.preventDefault()
    evt.stopPropagation()
    const selector = getSelector()
    let id = ``

    if (typeof selector === `string`) {
      const el = $(selector)
      if (el && el.href) id = /\d+/.exec(el.href.split('/').pop())[0]
      else if (location.pathname.startsWith('/artwork')) {
        id = location.pathname.split('/').pop()
      }
    }

    if (id) saveImage(FORMAT, id).catch(console.error)
  })

  body.appendChild(
    $el(`link`, {
      rel: `stylesheet`,
      href: `https://unpkg.com/@snackbar/core/dist/snackbar.min.css`,
    })
  )
})()
