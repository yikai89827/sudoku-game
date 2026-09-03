// pages/achievements/achievements.js
const storage = require('../../utils/storage.js');
const achievementsUtil = require('../../utils/achievements.js');
const themeUtil = require('../../utils/theme.js');

Page({
  data: {
    theme: 'night',
    groups: [],
    unlockedCount: 0,
    totalCount: 0,
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
    this.loadAchievements();
  },

  onShow() {
    themeUtil.bindPage(this);
    this.loadAchievements();
  },

  loadAchievements() {
    achievementsUtil.migrateLegacyAchievements();
    const unlocked = storage.getAchievements();
    const all = achievementsUtil.getAchievements();
    const total = Object.keys(all).length;
    const unlockedCount = unlocked.filter((id) => all[id]).length;

    const groupMap = {};
    const groupOrder = [];

    Object.entries(all).forEach(([key, val]) => {
      const group = val.group || '其他';
      if (!groupMap[group]) {
        groupMap[group] = [];
        groupOrder.push(group);
      }
      groupMap[group].push({
        key,
        icon: val.icon,
        name: val.name,
        desc: val.desc,
        unlocked: unlocked.includes(key)
      });
    });

    const groups = groupOrder.map((name) => ({
      name,
      items: groupMap[name],
      unlocked: groupMap[name].filter((i) => i.unlocked).length,
      total: groupMap[name].length
    }));

    this.setData({
      groups,
      unlockedCount,
      totalCount: total
    });
  },

  onBack() {
    wx.navigateBack();
  }
});
