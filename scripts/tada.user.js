// ==UserScript==
// @name         测试脚本
// @namespace    http://ntnyq.com
// @version      0.0.1
// @description  测试脚本 油猴
// @author       ntnyq<ntnyq13@gmail.com>
// @match        https://juejin.cn/*
// @icon         https://avatars.githubusercontent.com/u/47700415?s=64&v=4
// @require      https://unpkg.com/petite-vue
// @require      https://cdn.jsdelivr.net/npm/sweetalert2@11
// ==/UserScript==

;(async () => {
  'use strict'

  const { createApp } = window.PetiteVue

  const root = document.createElement(`div`)
  root.classList.add(`ntnyq-wrap`)
  root.innerHTML = `
    <div v-show="!isPopupVisible" @click="showPopup" class="ntnyq-popup-trigger">测试脚本</div>
    <div v-if="isPopupVisible" class="ntnyq-popup-container" >
      <div @click="hidePopup" class="ntnyq-popup-mask"></div>
      <div class="ntnyq-popup-main">
        <div class="ntnyq-popup-header">
          <h3>测试脚本</h3>
        </div>
        <div class="ntnyq-popup-body">
          <div class="ntnyq-row">
            <p>Hello world</p>
          </div>
          <div class="ntnyq-row">
            <button class="ntnyq-btn" @click="showAlert">弹窗</button>
          </div>
        </div>
      </div>
    </div>
  `

  document.body.append(root)

  createApp({
    isPopupVisible: false,

    showPopup() {
      this.isPopupVisible = true
      document.body.classList.add(`ntnyq-lock`)
    },

    hidePopup() {
      this.isPopupVisible = false
      document.body.classList.remove(`ntnyq-lock`)
    },

    async greet() {
      console.log(`Hello world`)
    },

    showAlert() {
      // eslint-disable-next-line no-undef
      Swal.fire({
        icon: `success`,
        title: `Hello world`,
        text: `Hello world. This is text`,
      })
    },
  }).mount()

  const css = `
    .ntnyq-wrap {
      --width: 460px;
      --primary-color: rgb(30, 128, 255);
    }

    .ntnyq-wrap * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    .ntnyq-lock {
      position: relative;
      height: 100vh;
      overflow: hidden;
    }

    .ntnyq-popup-trigger {
      position: fixed;
      top: 50%;
      left: 0px;
      z-index: 888;
      width: 40px;
      height: 40px;
      line-height: 16px;
      font-size: 12px;
      padding: 4px;
      background-color: rgb(232, 243, 255);
      border: 1px solid rgb(232, 243, 255);
      color: var(--primary-color);
      text-align: center;
      overflow: hidden;
      cursor: pointer;
    }

    .ntnyq-popup-container {
      position: fixed;
      left: 0;
      top: 0;
      right: 0;
      bottom: 0;
      z-index: 999;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .ntnyq-popup-mask {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
    }

    .ntnyq-popup-main {
      position: relative;
      width: var(--width);
      background-color: #fff;
      border-radius: 4px;
    }

    .ntnyq-popup-header {
      position: relative;
      padding: 10px 20px;
    }

    .ntnyq-popup-body {
      position: relative;
      min-height: 200px;
      padding: 30px 20px;
    }

    .ntnyq-row + .ntnyq-row {
      margin-top: 15px;
    }

    .ntnyq-btn {
      padding: 8px 15px;
      background-color: #fff;
      border: 2px solid var(--primary-color);
      border-radius: 3px;
      line-height: 1;
      text-align: center;
      font-weight: 500;
      font-size: 14px;
      color: var(--primary-color);
    }
  `
  const style = document.createElement(`style`)
  style.textContent = css
  document.head.append(style)
})()
