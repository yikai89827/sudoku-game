// pages/index/index.js
const storage = require('../../utils/storage.js');
const modes = require('../../utils/modes.js');
const themeUtil = require('../../utils/theme.js');

Page({
  data: {
    theme: 'night',
    themeList: [],
    themeSwitching: false,
    totalGames: 0,
    totalWins: 0,
    achievementsCount: 0,
    chainCount: 0,
    winStreak: 0,
    dailyDone: false
  },

  onLoad() {
    this.refreshTheme();
    this.loadStats();
  },

  onShow() {
    this.refreshTheme();
    this.loadStats();
  },

  refreshTheme() {
    themeUtil.bindPage(this);
    this.setData({ themeList: themeUtil.getThemeList() });
    const app = getApp();
    if (app && app.globalData) {
      app.globalData.theme = themeUtil.getCurrentTheme();
    }
  },

  loadStats() {
    const stats = storage.getStats();
    const achievements = storage.getAchievements();
    const daily = storage.getDailyData();
    const today = modes.getTodayKey();
    this.setData({
      totalGames: stats.totalGames || 0,
      totalWins: stats.totalWins || 0,
      achievementsCount: achievements.length,
      chainCount: stats.chainCount || 0,
      winStreak: stats.winStreak || 0,
      dailyDone: !!(daily && daily.dateKey === today && daily.completed)
    });
  },

  onSelectTheme(e) {
    const id = e.currentTarget.dataset.id;
    if (!id || this.data.themeSwitching) return;
    if (id === this.data.theme && themeUtil.isThemeUnlocked(id)) return;

    this.setData({ themeSwitching: true });
    wx.vibrateShort({ type: 'light' });

    themeUtil.selectTheme(id)
      .then(() => {
        this.refreshTheme();
        wx.showToast({
          title: themeUtil.THEME_META[id].name + '主题已启用',
          icon: 'none',
          duration: 1400
        });
      })
      .catch((err) => {
        const msg = (err && err.message) || '';
        if (msg === 'USER_CANCEL') return;
        if (msg === 'AD_NOT_COMPLETED') {
          wx.showToast({ title: '需完整观看视频才能解锁', icon: 'none' });
          return;
        }
        if (msg === 'AD_NOT_CONFIGURED' || msg === 'AD_NOT_AVAILABLE') {
          wx.showToast({ title: '广告暂不可用，请稍后重试', icon: 'none' });
          return;
        }
        wx.showToast({ title: '解锁失败，请稍后重试', icon: 'none' });
      })
      .then(() => {
        this.setData({ themeSwitching: false });
      });
  },

  onStart() {
    wx.vibrateShort({ type: 'light' });
    wx.navigateTo({ url: '/pages/difficulty/difficulty?mode=classic' });
  },

  onMission() {
    wx.vibrateShort({ type: 'light' });
    wx.navigateTo({ url: '/pages/difficulty/difficulty?mode=mission' });
  },

  onDaily() {
    wx.vibrateShort({ type: 'light' });
    wx.navigateTo({ url: '/pages/game/game?mode=daily' });
  },

  onBlitz() {
    wx.vibrateShort({ type: 'light' });
    wx.navigateTo({ url: '/pages/blitz/blitz' });
  },

  onAchievements() {
    wx.vibrateShort({ type: 'light' });
    wx.navigateTo({ url: '/pages/achievements/achievements' });
  },

  onRank() {
    wx.vibrateShort({ type: 'light' });
    wx.navigateTo({ url: '/pages/rank/rank' });
  },

  onRules() {
    wx.vibrateShort({ type: 'light' });
    wx.navigateTo({ url: '/pages/rules/rules' });
  }
});
