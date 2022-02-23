;(() => {
  'use strict'

  new MutationObserver((mutations, observer) => {
    for (const mutation of mutations) {
      if (mutation.type === `childList`) {
      } else if (mutation.type === `subtree`) {
      }
    }
  }).observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
  })
})()
