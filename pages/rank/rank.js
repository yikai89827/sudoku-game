// pages/rank/rank.js
const rankUtil = require('../../utils/rank.js');
const config = require('../../utils/config.js');
const themeUtil = require('../../utils/theme.js');

Page({
  data: {
    theme: 'night',
    statusBarHeight: 0,
    navHeight: 44,
    menuWidth: 87,
    canvasWidth: 375,
    canvasHeight: 500
  },

  onLoad() {
    themeUtil.bindPage(this);
    const sysInfo = wx.getSystemInfoSync();
    const menuRect = wx.getMenuButtonBoundingClientRect();
    this.setData({
      statusBarHeight: sysInfo.statusBarHeight,
      navHeight: (menuRect.top - sysInfo.statusBarHeight) * 2 + menuRect.height,
      menuWidth: menuRect.width + 11,
      canvasWidth: sysInfo.windowWidth - 30,
      canvasHeight: Math.floor(sysInfo.windowHeight * 0.58)
    });
  },

  onReady() {
    this.openDataContext = wx.getOpenDataContext ? wx.getOpenDataContext() : null;
    this.initMainCanvas();
  },

  onShow() {
    themeUtil.bindPage(this);
    rankUtil.uploadRankData();
    this.renderFriendRank();
  },

  initMainCanvas() {
    const query = wx.createSelectorQuery();
    query.select('#rankCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0] || !res[0].node) return;

        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        const dpr = wx.getSystemInfoSync().pixelRatio || 2;
        const width = res[0].width;
        const height = res[0].height;

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        this.mainCanvas = canvas;
        this.mainCtx = ctx;
        this.renderFriendRank();
      });
  },

  renderFriendRank() {
    if (!this.openDataContext) return;

    const palette = themeUtil.getPalette(this.data.theme || themeUtil.getCurrentTheme());

    this.openDataContext.postMessage({
      type: 'renderFriendRank',
      width: this.data.canvasWidth,
      height: this.data.canvasHeight,
      rankKey: config.RANK_KEY_TOTAL_WINS,
      theme: {
        bg: palette.canvasBg,
        text: palette.text,
        textMuted: palette.textMuted,
        accent: palette.accent,
        accentSoft: palette.accentSoft,
        line: palette.line
      }
    });

    [120, 350, 700].forEach((delay) => {
      setTimeout(() => this.syncSharedCanvas(), delay);
    });
  },

  syncSharedCanvas() {
    if (!this.mainCtx || !this.openDataContext || !this.openDataContext.canvas) return;

    const { canvasWidth, canvasHeight } = this.data;
    this.mainCtx.clearRect(0, 0, canvasWidth, canvasHeight);
    this.mainCtx.drawImage(
      this.openDataContext.canvas,
      0, 0, canvasWidth, canvasHeight
    );
  },

  onBack() {
    wx.navigateBack({
      fail: () => wx.reLaunch({ url: '/pages/index/index' })
    });
  }
});
