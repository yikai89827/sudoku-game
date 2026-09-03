// pages/rules/rules.js
const themeUtil = require('../../utils/theme.js');

Page({
  data: {
    theme: 'night',
    statusBarHeight: 0,
    navHeight: 44,
    menuWidth: 87
  },

  onLoad() {
    themeUtil.bindPage(this);
    const sysInfo = wx.getSystemInfoSync();
    const menuRect = wx.getMenuButtonBoundingClientRect();
    this.setData({
      statusBarHeight: sysInfo.statusBarHeight,
      navHeight: (menuRect.top - sysInfo.statusBarHeight) * 2 + menuRect.height,
      menuWidth: menuRect.width + 11
    });
  },

  onShow() {
    themeUtil.bindPage(this);
  },

  onBack() {
    wx.navigateBack();
  }
});
