// pages/result/result.js
const difficultyUtil = require('../../utils/difficulty.js');
const storage = require('../../utils/storage.js');
const themeUtil = require('../../utils/theme.js');

Page({
  data: {
    theme: 'night',
    mode: 'classic',
    difficulty: '',
    difficultyName: '',
    level: 1,
    stars: 0,
    time: 0,
    timeDisplay: '',
    mistakes: 0,
    hintsUsed: 0,
    chainScore: 0,
    chainCount: 0,
    bestCombo: 0,
    blitzScore: 0,
    dailyScore: 0,
    remain: 0,
    win: true,
    nextLevel: 1,
    modeLabel: '经典闯关',
    primaryText: '下一关',
    showStars: true
  },

  onLoad(options) {
    themeUtil.bindPage(this);
    const diff = options.difficulty || 'easy';
    const config = difficultyUtil.getDifficultyConfig(diff);
    const mode = options.mode || 'classic';

    const stars = parseInt(options.stars) || 0;
    const time = parseInt(options.time) || 0;
    const mistakes = parseInt(options.mistakes) || 0;
    const hintsUsed = parseInt(options.hints) || 0;
    const chainScore = parseInt(options.chainScore) || 0;
    const chainCount = parseInt(options.chainCount) || 0;
    const bestCombo = parseInt(options.bestCombo) || 0;
    const blitzScore = parseInt(options.blitzScore) || 0;
    const dailyScore = parseInt(options.dailyScore) || 0;
    const remain = parseInt(options.remain) || 0;
    const win = options.win === '1';
    const level = parseInt(options.level) || 1;

    let modeLabel = '经典闯关';
    let primaryText = '下一关 (第' + (level + 1) + '关)';
    let showStars = true;

    if (mode === 'mission') {
      modeLabel = '连锁任务';
      primaryText = '下一任务 (第' + (level + 1) + '关)';
    } else if (mode === 'daily') {
      modeLabel = '每日一题';
      primaryText = '回首页';
      showStars = true;
    } else if (mode === 'blitz') {
      modeLabel = '闪电挑战';
      primaryText = '再来一局';
    }

    this.setData({
      mode,
      difficulty: diff,
      difficultyName: config.name,
      level,
      stars,
      time,
      timeDisplay: this.formatTime(time),
      mistakes,
      hintsUsed,
      chainScore,
      chainCount,
      bestCombo,
      blitzScore,
      dailyScore,
      remain,
      win,
      nextLevel: level + 1,
      modeLabel,
      primaryText,
      showStars,
      diffColor: config.color,
      diffGradient: config.gradient
    });
  },

  formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  },

  onPrimary() {
    wx.vibrateShort({ type: 'light' });
    const { mode, difficulty } = this.data;

    if (mode === 'daily') {
      wx.reLaunch({ url: '/pages/index/index' });
      return;
    }
    if (mode === 'blitz') {
      wx.redirectTo({ url: '/pages/blitz/blitz' });
      return;
    }
    if (mode === 'mission') {
      wx.redirectTo({ url: '/pages/game/game?difficulty=' + difficulty + '&mode=mission' });
      return;
    }
    wx.redirectTo({
      url: '/pages/game/game?difficulty=' + difficulty + '&mode=classic'
    });
  },

  onChangeDifficulty() {
    const { mode } = this.data;
    if (mode === 'blitz') {
      wx.redirectTo({ url: '/pages/blitz/blitz' });
      return;
    }
    wx.redirectTo({
      url: '/pages/difficulty/difficulty?mode=' + (mode === 'mission' ? 'mission' : 'classic')
    });
  },

  onHome() {
    wx.reLaunch({
      url: '/pages/index/index'
    });
  },

  onShow() {
    themeUtil.bindPage(this);
  }
});
