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

  const startObserver = () => {
    new MutationObserver(() => {
      $$('.SponsorPrompt__sponsored').forEach(el => {
        const closestEl = closest(el, `div.entry.unread`)
        if (closestEl) {
          counter++
          closestEl.remove()
          console.log(
            `[Feedly Ad Blocker]: ${counter} ${
              counter > 1 ? `ads` : `ad`
            } had been removed.`
          )
        }
      })
    }).observe($(SELECTOR), {
      childList: true,
      subtree: true,
    })
  }

  const timer = setInterval(() => {
    if ($(SELECTOR)) {
      clearInterval(timer)
      startObserver()
    }
  }, 1e3)
})()
