// app.js
const adUtil = require('./utils/ad.js');
const rankUtil = require('./utils/rank.js');
const themeUtil = require('./utils/theme.js');

App({
  globalData: {
    userInfo: null,
    theme: 'night',
    // 难度配置
    difficultyConfig: {
      easy: { name: '简单', baseRemove: 35, increment: 2, stepInterval: 5, color: '#4CAF50', stars: { three: 300, two: 600, one: 900 } },
      medium: { name: '中等', baseRemove: 44, increment: 2, stepInterval: 5, color: '#FF9800', stars: { three: 600, two: 900, one: 1200 } },
      hard: { name: '困难', baseRemove: 50, increment: 1, stepInterval: 5, color: '#f44336', stars: { three: 900, two: 1200, one: 1500 } },
      expert: { name: '专家', baseRemove: 55, increment: 1, stepInterval: 5, color: '#9C27B0', stars: { three: 1200, two: 1500, one: 1800 } }
    },
    // 各难度当前关卡进度（从localStorage恢复）
    progress: {}
  },

  onLaunch() {
    // 从本地存储恢复进度
    const progress = wx.getStorageSync('sudoku_progress') || {};
    this.globalData.progress = progress;

    const theme = themeUtil.getCurrentTheme();
    this.globalData.theme = theme;
    themeUtil.applyPageBackground(theme);

    adUtil.initRewardedVideoAd();
    rankUtil.uploadRankData();
  },

  // 保存进度
  saveProgress(difficulty, level) {
    if (!this.globalData.progress[difficulty]) {
      this.globalData.progress[difficulty] = { currentLevel: 1, bestStars: {} };
    }
    this.globalData.progress[difficulty].currentLevel = level;
    wx.setStorageSync('sudoku_progress', this.globalData.progress);
  },

  // 记录最佳星级
  saveBestStars(difficulty, level, stars) {
    if (!this.globalData.progress[difficulty]) {
      this.globalData.progress[difficulty] = { currentLevel: 1, bestStars: {} };
    }
    const key = 'level_' + level;
    const currentBest = this.globalData.progress[difficulty].bestStars[key] || 0;
    if (stars > currentBest) {
      this.globalData.progress[difficulty].bestStars[key] = stars;
      wx.setStorageSync('sudoku_progress', this.globalData.progress);
    }
  },

  // 获取进度
  getProgress(difficulty) {
    if (!this.globalData.progress[difficulty]) {
      return { currentLevel: 1, bestStars: {} };
    }
    return this.globalData.progress[difficulty];
  },

  // 获取成就
  getAchievements() {
    return wx.getStorageSync('sudoku_achievements') || [];
  },

  // 解锁成就
  unlockAchievement(id) {
    const achievements = this.getAchievements();
    if (!achievements.includes(id)) {
      achievements.push(id);
      wx.setStorageSync('sudoku_achievements', achievements);
      return true;
    }
    return false;
  }
});
