/**
 * @file Override default theme
 */

import DefaultTheme from 'vitepress/theme'

/**
 * @type {import('vitepress').DefaultTheme}
 */
export default {
  ...DefaultTheme,
  enhanceApp({ app }) {},
}
