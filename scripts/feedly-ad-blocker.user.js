// ==UserScript==
// @name         Feedly Ad Blocker
// @namespace    http://ntnyq.com
// @version      0.0.1
// @description  feedly ad blocker
// @author       ntnyq<ntnyq13@gmail.com>
// @match        https://feedly.com/i/subscription/*
// @icon         https://avatars.githubusercontent.com/u/47700415?s=64&v=4
// ==/UserScript==

;(() => {
  'use strict'

  const SELECTOR = `#feedlyFrame`
  const $ = s => document.querySelector(s)
  const $$ = s => [...document.querySelectorAll(s)]
  let counter = 0

  function closest(el, s) {
    while (el) {
      if (el.matches(s)) {
        return el
      }
      el = el.parentNode
    }
    return null
  }

  function debounce(func, wait, immediate) {
    let timeout
    let result

    function debouncedFn(...args) {
      const context = this

      const later = function () {
        timeout = null
        if (!immediate) {
          result = func.apply(context, args)
        }
      }

      const callNow = immediate && !timeout

      clearTimeout(timeout)
      timeout = setTimeout(later, wait)

      if (callNow) {
        result = func.apply(context, args)
      }

      return result
    }

    debouncedFn.cancel = () => {
      if (timeout) {
        clearTimeout(timeout)
        timeout = undefined
      }
    }

    return debouncedFn
  }

  function blockAds() {
    $$(`.SponsorPrompt__sponsored`).forEach(el => {
      const closestEl = closest(el, `div.entry.unread`)
      if (closestEl) {
        counter++
        closestEl.remove()
        console.log(
          `[Feedly Ad Blocker]: ${counter} ${counter > 1 ? `ads` : `ad`} had been removed.`,
        )
      }
    })
  }

  function observeDOM(observer) {
    observer.observe($(SELECTOR), {
      childList: true,
      subtree: true,
    })
  }

  const blockAdsDebounced = debounce(blockAds, 300)

  // run every time page dom changed
  const observer = new MutationObserver(() => {
    requestAnimationFrame(() => {
      blockAdsDebounced()
    })
  })

  // run once when script loaded
  blockAds()

  // start observe when dom ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      observeDOM(observer)
    })
  } else {
    observeDOM(observer)
  }
})()
