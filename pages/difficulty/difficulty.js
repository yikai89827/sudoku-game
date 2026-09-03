// pages/difficulty/difficulty.js
const difficulty = require('../../utils/difficulty.js');
const storage = require('../../utils/storage.js');
const modes = require('../../utils/modes.js');
const themeUtil = require('../../utils/theme.js');

Page({
  data: {
    theme: 'night',
    difficulties: [],
    mode: 'classic', // classic | mission | blitz | daily
    blitzTime: 180,
    pageTitle: '选择难度',
    statusBarHeight: 0,
    navHeight: 44,
    menuWidth: 87
  },

  onLoad(options) {
    themeUtil.bindPage(this);
    const sysInfo = wx.getSystemInfoSync();
    const menuRect = wx.getMenuButtonBoundingClientRect();
    const mode = options.mode || 'classic';
    const blitzTime = parseInt(options.blitzTime, 10) || 180;

    let pageTitle = '选择难度';
    if (mode === 'mission') pageTitle = '连锁任务';
    else if (mode === 'blitz') pageTitle = '闪电挑战';
    else if (mode === 'daily') pageTitle = '每日一题';

    this.setData({
      statusBarHeight: sysInfo.statusBarHeight,
      navHeight: (menuRect.top - sysInfo.statusBarHeight) * 2 + menuRect.height,
      menuWidth: menuRect.width + 11,
      mode,
      blitzTime,
      pageTitle
    });
    this.loadData();
  },

  onShow() {
    themeUtil.bindPage(this);
    this.loadData();
  },

  loadData() {
    const { mode } = this.data;
    const allDiff = difficulty.getAllDifficulties();
    const diffArray = Object.entries(allDiff).map(([key, val]) => {
      let currentLevel = 1;
      let totalCompleted = 0;
      let missionPreview = '';

      if (mode === 'mission') {
        const progress = storage.getMissionProgress(key);
        currentLevel = progress.currentLevel || 1;
        totalCompleted = progress.totalCompleted || 0;
        const goals = modes.getMissionGoals(currentLevel);
        missionPreview = modes.formatMissionGoals(goals).join(' · ');
      } else {
        const progress = storage.getDifficultyProgress(key);
        currentLevel = progress.currentLevel || 1;
        totalCompleted = progress.totalCompleted || 0;
      }

      const removeCount = difficulty.getRemoveCount(key, currentLevel);
      return {
        key,
        name: val.name,
        nameEn: val.nameEn,
        desc: mode === 'mission' ? missionPreview : val.desc,
        color: val.color,
        gradient: val.gradient,
        icon: val.icon,
        currentLevel,
        totalCompleted,
        removeCount,
        hintLimit: val.hintLimit
      };
    });
    this.setData({ difficulties: diffArray });
  },

  onSelectDifficulty(e) {
    const diff = e.currentTarget.dataset.difficulty;
    const { mode, blitzTime } = this.data;
    wx.vibrateShort({ type: 'light' });

    let url = '/pages/game/game?difficulty=' + diff + '&mode=' + mode;
    if (mode === 'blitz') {
      url += '&blitzTime=' + blitzTime;
    }
    wx.navigateTo({ url });
  },

  onBack() {
    wx.navigateBack({
      fail: () => {
        wx.reLaunch({ url: '/pages/index/index' });
      }
    });
  }
});
