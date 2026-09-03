// utils/storage.js - 本地存储管理

const STORAGE_KEYS = {
  PROGRESS: 'sudoku_progress',
  MISSION_PROGRESS: 'sudoku_mission_progress',
  DAILY: 'sudoku_daily',
  ACHIEVEMENTS: 'sudoku_achievements',
  SETTINGS: 'sudoku_settings',
  STATS: 'sudoku_stats'
};

/**
 * 获取进度数据
 */
function getProgress() {
  return wx.getStorageSync(STORAGE_KEYS.PROGRESS) || {};
}

/**
 * 保存进度
 */
function saveProgress(progress) {
  wx.setStorageSync(STORAGE_KEYS.PROGRESS, progress);
}

/**
 * 获取某个难度的进度
 */
function getDifficultyProgress(difficulty) {
  const progress = getProgress();
  if (!progress[difficulty]) {
    return { currentLevel: 1, bestStars: {}, totalCompleted: 0 };
  }
  return progress[difficulty];
}

/**
 * 更新难度进度
 */
function updateDifficultyProgress(difficulty, data) {
  const progress = getProgress();
  if (!progress[difficulty]) {
    progress[difficulty] = { currentLevel: 1, bestStars: {}, totalCompleted: 0 };
  }
  Object.assign(progress[difficulty], data);
  saveProgress(progress);
}

/**
 * 记录最佳星级
 */
function saveBestStars(difficulty, level, stars) {
  const progress = getProgress();
  if (!progress[difficulty]) {
    progress[difficulty] = { currentLevel: 1, bestStars: {}, totalCompleted: 0 };
  }
  const key = 'level_' + level;
  const currentBest = progress[difficulty].bestStars[key] || 0;
  if (stars > currentBest) {
    progress[difficulty].bestStars[key] = stars;
    saveProgress(progress);
  }
}

/**
 * 增加已完成关卡数
 */
function incrementCompleted(difficulty) {
  const progress = getProgress();
  if (!progress[difficulty]) {
    progress[difficulty] = { currentLevel: 1, bestStars: {}, totalCompleted: 0 };
  }
  progress[difficulty].totalCompleted = (progress[difficulty].totalCompleted || 0) + 1;
  saveProgress(progress);
}

/**
 * 获取成就列表
 */
function getAchievements() {
  return wx.getStorageSync(STORAGE_KEYS.ACHIEVEMENTS) || [];
}

/**
 * 解锁成就
 * @returns {boolean} 是否新解锁
 */
function unlockAchievement(id) {
  const achievements = getAchievements();
  if (!achievements.includes(id)) {
    achievements.push(id);
    wx.setStorageSync(STORAGE_KEYS.ACHIEVEMENTS, achievements);
    return true;
  }
  return false;
}

/**
 * 获取设置
 */
function getSettings() {
  const defaults = {
    highlightErrors: true,
    highlightSame: true,
    autoCheckNotes: true,
    sound: true,
    vibration: true,
    theme: 'night',
    unlockedThemes: ['night']
  };
  const saved = wx.getStorageSync(STORAGE_KEYS.SETTINGS) || {};
  const merged = Object.assign({}, defaults, saved);
  if (!Array.isArray(merged.unlockedThemes) || merged.unlockedThemes.length === 0) {
    merged.unlockedThemes = ['night'];
  }
  if (merged.unlockedThemes.indexOf('night') < 0) {
    merged.unlockedThemes = ['night'].concat(merged.unlockedThemes);
  }
  return merged;
}

/**
 * 保存设置
 */
function saveSettings(settings) {
  wx.setStorageSync(STORAGE_KEYS.SETTINGS, settings);
}

/**
 * 获取统计数据
 */
function getStats() {
  return wx.getStorageSync(STORAGE_KEYS.STATS) || {
    totalGames: 0,
    totalWins: 0,
    totalTime: 0,
    totalMistakes: 0,
    chainCount: 0,
    winStreak: 0
  };
}

/**
 * 更新统计数据
 */
function updateStats(data) {
  const stats = getStats();
  Object.assign(stats, data);
  wx.setStorageSync(STORAGE_KEYS.STATS, stats);
}

/**
 * 任务关独立进度
 */
function getMissionProgress(difficulty) {
  const all = wx.getStorageSync(STORAGE_KEYS.MISSION_PROGRESS) || {};
  if (!all[difficulty]) {
    return { currentLevel: 1, bestStars: {}, totalCompleted: 0 };
  }
  return all[difficulty];
}

function updateMissionProgress(difficulty, data) {
  const all = wx.getStorageSync(STORAGE_KEYS.MISSION_PROGRESS) || {};
  if (!all[difficulty]) {
    all[difficulty] = { currentLevel: 1, bestStars: {}, totalCompleted: 0 };
  }
  Object.assign(all[difficulty], data);
  wx.setStorageSync(STORAGE_KEYS.MISSION_PROGRESS, all);
}

function saveMissionBestStars(difficulty, level, stars) {
  const all = wx.getStorageSync(STORAGE_KEYS.MISSION_PROGRESS) || {};
  if (!all[difficulty]) {
    all[difficulty] = { currentLevel: 1, bestStars: {}, totalCompleted: 0 };
  }
  const key = 'level_' + level;
  const currentBest = all[difficulty].bestStars[key] || 0;
  if (stars > currentBest) {
    all[difficulty].bestStars[key] = stars;
    wx.setStorageSync(STORAGE_KEYS.MISSION_PROGRESS, all);
  }
}

function incrementMissionCompleted(difficulty) {
  const all = wx.getStorageSync(STORAGE_KEYS.MISSION_PROGRESS) || {};
  if (!all[difficulty]) {
    all[difficulty] = { currentLevel: 1, bestStars: {}, totalCompleted: 0 };
  }
  all[difficulty].totalCompleted = (all[difficulty].totalCompleted || 0) + 1;
  wx.setStorageSync(STORAGE_KEYS.MISSION_PROGRESS, all);
}

/**
 * 每日一题数据
 */
function getDailyData() {
  return wx.getStorageSync(STORAGE_KEYS.DAILY) || null;
}

function saveDailyData(data) {
  wx.setStorageSync(STORAGE_KEYS.DAILY, data);
}

/**
 * 保存每日最佳（同日保留更高分）
 */
function saveDailyBest(dateKey, record) {
  const cur = getDailyData();
  if (!cur || cur.dateKey !== dateKey) {
    saveDailyData(Object.assign({ dateKey: dateKey, completed: true }, record));
    return true;
  }
  const better =
    (record.score || 0) > (cur.score || 0) ||
    ((record.score || 0) === (cur.score || 0) && (record.time || 99999) < (cur.time || 99999));
  if (better) {
    saveDailyData(Object.assign({}, cur, record, { dateKey: dateKey, completed: true }));
    return true;
  }
  return false;
}

module.exports = {
  STORAGE_KEYS,
  getProgress,
  saveProgress,
  getDifficultyProgress,
  updateDifficultyProgress,
  saveBestStars,
  incrementCompleted,
  getMissionProgress,
  updateMissionProgress,
  saveMissionBestStars,
  incrementMissionCompleted,
  getDailyData,
  saveDailyData,
  saveDailyBest,
  getAchievements,
  unlockAchievement,
  getSettings,
  saveSettings,
  getStats,
  updateStats
};
