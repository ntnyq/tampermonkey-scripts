// ==UserScript==
// @name         pixiv image downloader
// @namespace    http://ntnyq.com
// @version      0.0.1
// @description  pixiv 图片下载器
// @author       ntnyq<ntnyq13@gmail.com>
// @match        https://www.pixiv.net/artworks/*
// @icon         https://avatars.githubusercontent.com/u/47700415?s=64&v=4
// @require      https://unpkg.com/xfetch-js
// @require      https://unpkg.com/gif.js
// @require      https://github.com/antimatter15/whammy/blob/master/whammy.js
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
  const SAVE_UGOIRA_AS_WEBM = false // faster than gif
  const FORMAT = {
    single: d => `${d.title}-${d.userName}-${d.id}`,
    multiple: (d, i) => `${d.title}-${d.userName}-${d.id}-p${i}`,
  }
  const {
    xf, // xfetch
    snackbar, // snackbar
    gmfetch, // gmxhr-fetch
    JSZip, // jszip
    filenamify, // filenamify
    GIF, // gif.js
    Whammy, // whammy.js
  } = win
  const gxf = xf.extend({ fetch: gmfetch })
  const $ = s => doc.querySelector(s)
  // const $$ = s => [...doc.querySelectorAll(s)]
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
    body.append(a)
    a.click()
    a.remove()
  }
  const downloadBlob = (blob, name) => {
    const url = URL.createObjectURL(blob)
    download(url, name)
    URL.revokeObjectURL(url)
  }
  const blobToCanvas = blob =>
    new Promise((resolve, reject) => {
      const src = URL.createObjectURL(blob)
      const img = $el(`img`, { src })
      const cvs = $el(`canvas`)
      const ctx = cvs.getContext(`2d`)
      img.addEventListener('load', () => {
        URL.revokeObjectURL(src)
        cvs.width = img.naturalWidth
        cvs.height = img.naturalHeight
        ctx.drawImage(img, 0, 0)
        resolve(cvs)
      })
      img.addEventListener('error', err => {
        URL.revokeObjectURL(src)
        reject(err)
      })
    })

  const getJSONBody = url => xf.get(url).json(r => r.body)
  const getIllustData = id => getJSONBody(`/ajax/illust/${id}`)
  const getUgoiraMeta = id => getJSONBody(`/ajax/illust/${id}/ugoira_meta`)
  const getCrossOriginBlob = (url, Referer = `https://www.pixiv.net/`) =>
    gxf.get(url, { headers: { Referer } }).blob()
  // eslint-disable-next-line camelcase
  const getImageFromPximg = (url, pixivcat_multiple_syntax) => {
    if (USE_PIXIVCAT) {
      const [, id, idx] = /\/(\d+)_p(\d+)/.exec(url)
      // eslint-disable-next-line camelcase
      const newUrl = pixivcat_multiple_syntax
        ? `https://pixiv.cat/${id}-${Number.parseInt(idx) + 1}.png`
        : `https://pixiv.cat/${id}.png`
      return xf.get(newUrl).blob()
    }
    return getCrossOriginBlob(url)
  }
  const saveImage = async ({ single, multiple }, id) => {
    const illustData = await getIllustData(id)
    if (snackbar) {
      snackbar.createSnackbar(`Downloading ${illustData.title}...`, { timeout: 1000 })
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
            results = [[`${single(illustData)}.${ext}`, await getImageFromPximg(url)]]
          } else {
            const len = illustData.pageCount
            const arr = []
            for (let i = 0; i < len; i++) {
              arr.push(
                Promise.all([
                  `${multiple(illustData, i)}.${ext}`,
                  getImageFromPximg(url.replace(`p0`, `p${i}`), true),
                ]),
              )
            }
            results = await Promise.all(arr)
          }
        }
        break

      case 2:
        {
          // ugoira
          const fname = single(illustData)
          const ugoiraMeta = await getUgoiraMeta(id)
          const ugoiraZip = await xf.get(ugoiraMeta.originalSrc).blob()
          const { files } = await JSZip.loadAsync(ugoiraZip)
          const frames = await Promise.all(
            Object.values(files).map(f => f.async(`blob`).then(blobToCanvas)),
          )
          if (SAVE_UGOIRA_AS_WEBM) {
            const getWebm = (data, frames) =>
              new Promise(resolve => {
                const encoder = new Whammy.Video()
                for (const [i, frame] of frames.entries()) {
                  encoder.add(frame, data.frames[i].delay)
                }
                encoder.compile(false, resolve)
              })
            results = [[`${fname}.webm`, await getWebm(ugoiraMeta, frames)]]
          } else {
            const numCpu = navigator.hardwareConcurrency || 4
            const getGif = (data, frames) =>
              new Promise((resolve, reject) => {
                const gif = new GIF({ workers: numCpu * 4, quality: 10 })
                for (const [i, frame] of frames.entries()) {
                  gif.addFrame(frame, { delay: data.frames[i].delay })
                }
                gif.on(`finished`, x => {
                  resolve(x)
                })
                gif.on(`error`, reject)
                gif.render()
              })
            results = [[`${fname}.gif`, await getGif(ugoiraMeta, frames)]]
          }
        }
        break
      default:
        break
    }

    if (results.length === 1) {
      const [f, blob] = results[0]
      downloadBlob(blob, filenamify(f))
    } else {
      const zip = new JSZip()
      for (const [f, blob] of results) {
        zip.file(filenamify(f), blob)
      }
      const blob = await zip.generateAsync({ type: `blob` })
      const zipName = single(illustData)
      downloadBlob(blob, filenamify(zipName))
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
      if (el && el.href) id = /\d+/.exec(el.href.split(`/`).pop())[0]
      else if (location.pathname.startsWith(`/artwork`)) {
        id = location.pathname.split(`/`).pop()
      }
    }

    if (id) saveImage(FORMAT, id).catch(console.error)
  })

  body.append(
    $el(`link`, {
      rel: `stylesheet`,
      href: `https://unpkg.com/@snackbar/core/dist/snackbar.min.css`,
    }),
  )
})()
