// utils/theme.js - 全局主题（黑夜 / 白天 / 护眼）

const storage = require('./storage.js');
const adUtil = require('./ad.js');

const THEME_IDS = ['night', 'day', 'eyecare'];

const THEME_META = {
  night: { id: 'night', name: '黑夜', icon: '🌙', free: true },
  day: { id: 'day', name: '白天', icon: '☀️', free: false },
  eyecare: { id: 'eyecare', name: '护眼', icon: '🌿', free: false }
};

/** 开放数据域 / 系统背景色等 JS 侧色板 */
const THEME_PALETTE = {
  night: {
    bgTop: '#0f0c29',
    bgBottom: '#24243e',
    canvasBg: '#1a1a2e',
    text: '#ffffff',
    textMuted: 'rgba(255,255,255,0.45)',
    accent: '#a8a8ff',
    accentSoft: 'rgba(102,126,234,0.5)',
    line: 'rgba(255,255,255,0.08)'
  },
  day: {
    bgTop: '#e8f0fe',
    bgBottom: '#dfe9f3',
    canvasBg: '#f4f7fc',
    text: '#1a1a2e',
    textMuted: 'rgba(26,26,46,0.45)',
    accent: '#5b6fe8',
    accentSoft: 'rgba(91,111,232,0.45)',
    line: 'rgba(26,26,46,0.08)'
  },
  eyecare: {
    bgTop: '#d5e5c8',
    bgBottom: '#c5d9b5',
    canvasBg: '#e4efd8',
    text: '#2d3a28',
    textMuted: 'rgba(45,58,40,0.5)',
    accent: '#5a7d4e',
    accentSoft: 'rgba(90,125,78,0.5)',
    line: 'rgba(45,58,40,0.1)'
  }
};

function normalizeThemeId(id) {
  return THEME_IDS.indexOf(id) >= 0 ? id : 'night';
}

function getCurrentTheme() {
  const settings = storage.getSettings();
  return normalizeThemeId(settings.theme);
}

function getUnlockedThemes() {
  const settings = storage.getSettings();
  const unlocked = settings.unlockedThemes || ['night'];
  if (unlocked.indexOf('night') < 0) unlocked.unshift('night');
  return unlocked;
}

function isThemeUnlocked(themeId) {
  const id = normalizeThemeId(themeId);
  if (THEME_META[id].free) return true;
  // 未配置激励视频时，主题无需解锁
  if (adUtil.isPlaceholderAdUnit()) return true;
  return getUnlockedThemes().indexOf(id) >= 0;
}

function getThemeList() {
  const current = getCurrentTheme();
  const unlocked = getUnlockedThemes();
  const adFree = adUtil.isPlaceholderAdUnit();
  return THEME_IDS.map((id) => ({
    id,
    name: THEME_META[id].name,
    icon: THEME_META[id].icon,
    free: THEME_META[id].free || adFree,
    unlocked: THEME_META[id].free || adFree || unlocked.indexOf(id) >= 0,
    active: current === id
  }));
}

function getPalette(themeId) {
  return THEME_PALETTE[normalizeThemeId(themeId)] || THEME_PALETTE.night;
}

/**
 * 应用系统窗口背景色（状态栏下拉区域等）
 */
function applyPageBackground(themeId) {
  const palette = getPalette(themeId);
  if (wx.setBackgroundColor) {
    try {
      wx.setBackgroundColor({
        backgroundColor: palette.bgTop,
        backgroundColorTop: palette.bgTop,
        backgroundColorBottom: palette.bgBottom
      });
    } catch (e) {
      // ignore
    }
  }
}

/**
 * 绑定到页面实例：写入 theme class 并同步系统背景
 */
function bindPage(page) {
  if (!page || !page.setData) return getCurrentTheme();
  const theme = getCurrentTheme();
  page.setData({ theme });
  applyPageBackground(theme);
  try {
    const app = getApp();
    if (app && app.globalData) app.globalData.theme = theme;
  } catch (e) {
    // ignore
  }
  return theme;
}

/**
 * 切换主题（已解锁）
 */
function setTheme(themeId) {
  const id = normalizeThemeId(themeId);
  if (!isThemeUnlocked(id)) {
    return Promise.reject(new Error('THEME_LOCKED'));
  }
  const settings = storage.getSettings();
  settings.theme = id;
  storage.saveSettings(settings);
  applyPageBackground(id);
  try {
    const app = getApp();
    if (app && app.globalData) app.globalData.theme = id;
  } catch (e) {
    // ignore
  }
  return Promise.resolve(id);
}

/**
 * 解锁主题（持久化）
 */
function unlockTheme(themeId) {
  const id = normalizeThemeId(themeId);
  const settings = storage.getSettings();
  const unlocked = settings.unlockedThemes || ['night'];
  if (unlocked.indexOf(id) < 0) {
    unlocked.push(id);
    settings.unlockedThemes = unlocked;
    storage.saveSettings(settings);
  }
  return id;
}

/**
 * 看视频解锁并切换到该主题
 */
function unlockThemeByAd(themeId) {
  const id = normalizeThemeId(themeId);
  if (isThemeUnlocked(id)) {
    return setTheme(id);
  }
  return adUtil.showRewardedVideoAd().then(() => {
    unlockTheme(id);
    return setTheme(id);
  });
}

/**
 * 选择主题：已解锁直接切换；未解锁则看视频解锁
 * 未配置广告位时跳过弹窗，直接解锁并切换
 */
function selectTheme(themeId) {
  const id = normalizeThemeId(themeId);
  if (isThemeUnlocked(id)) {
    return setTheme(id);
  }
  // 无广告位：直接解锁，视为已看过视频
  if (adUtil.isPlaceholderAdUnit()) {
    unlockTheme(id);
    return setTheme(id);
  }
  return new Promise((resolve, reject) => {
    wx.showModal({
      title: '解锁主题',
      content: '观看完整视频即可永久解锁「' + THEME_META[id].name + '」主题',
      confirmText: '看视频解锁',
      cancelText: '取消',
      success(res) {
        if (!res.confirm) {
          reject(new Error('USER_CANCEL'));
          return;
        }
        unlockThemeByAd(id).then(resolve).catch(reject);
      },
      fail: reject
    });
  });
}

module.exports = {
  THEME_IDS,
  THEME_META,
  THEME_PALETTE,
  getCurrentTheme,
  getUnlockedThemes,
  isThemeUnlocked,
  getThemeList,
  getPalette,
  applyPageBackground,
  bindPage,
  setTheme,
  unlockTheme,
  unlockThemeByAd,
  selectTheme
};
