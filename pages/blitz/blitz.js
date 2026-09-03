// pages/blitz/blitz.js
const modes = require('../../utils/modes.js');
const themeUtil = require('../../utils/theme.js');

Page({
  data: {
    theme: 'night',
    statusBarHeight: 0,
    navHeight: 44,
    menuWidth: 87,
    options: []
  },

  onLoad() {
    themeUtil.bindPage(this);
    const sysInfo = wx.getSystemInfoSync();
    const menuRect = wx.getMenuButtonBoundingClientRect();
    this.setData({
      statusBarHeight: sysInfo.statusBarHeight,
      navHeight: (menuRect.top - sysInfo.statusBarHeight) * 2 + menuRect.height,
      menuWidth: menuRect.width + 11,
      options: modes.getBlitzOptions()
    });
  },

  onShow() {
    themeUtil.bindPage(this);
  },

  onSelect(e) {
    const seconds = parseInt(e.currentTarget.dataset.seconds, 10);
    wx.vibrateShort({ type: 'light' });
    wx.navigateTo({
      url: '/pages/difficulty/difficulty?mode=blitz&blitzTime=' + seconds
    });
  },

  onBack() {
    wx.navigateBack({
      fail: () => wx.reLaunch({ url: '/pages/index/index' })
    });
  }
});
