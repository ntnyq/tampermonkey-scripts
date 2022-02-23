/**
 * @file VitePress config
 */

import { defineConfig } from 'vitepress'

export default defineConfig({
  title: `Tampermonkey Scripts`,

  description: `Tampermonkey Scripts`,

  themeConfig: {
    docsRepo: `ntnyq/tampermonkey-scripts`,
    docsBranch: `main`,
    nav: [
      { link: `/`, text: `首页` },
      { link: `/api/basic`, text: `API` },
      { link: `/package/dev`, text: `常用包` },
    ],
    sidebar: {
      '/api/': [{ text: `基础API`, link: `/api/basic` }],
      '/package/': [{ text: `常用包`, link: `/package/dev` }],
    },
  },
})
