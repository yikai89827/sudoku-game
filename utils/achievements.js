// utils/achievements.js - 成就称号定义与解锁判定

const storage = require('./storage.js');

/**
 * 成就列表（按类别排列，成就页按此顺序展示）
 */
const ACHIEVEMENTS = {
  // —— 入门 ——
  first_win: { name: '初出茅庐', desc: '完成第一局数独', icon: '🏆', group: '通用' },
  no_hint: { name: '独立思考', desc: '不使用提示完成一局', icon: '🧠', group: '通用' },
  speed_demon: { name: '风驰电掣', desc: '5分钟内完成一局（非闪电）', icon: '💨', group: '通用' },

  // —— 连击称号 ——
  combo_2: { name: '小试牛刀', desc: '单局达成 2 连击', icon: '🔥', group: '连击' },
  combo_3: { name: '渐入佳境', desc: '单局达成 3 连击', icon: '🔥', group: '连击' },
  combo_4: { name: '行云流水', desc: '单局达成 4 连击', icon: '💥', group: '连击' },
  combo_5: { name: '火力全开', desc: '单局达成 5 连击', icon: '💥', group: '连击' },
  combo_10: { name: '连击传说', desc: '单局达成 10 连击', icon: '👑', group: '连击' },

  // —— 连锁 ——
  chain_5: { name: '连锁新锐', desc: '单局触发 5 次连锁', icon: '✨', group: '连锁' },
  chain_10: { name: '连锁大师', desc: '单局触发 10 次连锁', icon: '✨', group: '连锁' },
  chain_20: { name: '连锁宗师', desc: '单局触发 20 次连锁', icon: '🌌', group: '连锁' },
  burst_first: { name: '一箭双雕', desc: '单次填数完成至少 2 个区域', icon: '🎯', group: '连锁' },
  burst_3: { name: '三连爆', desc: '单局完成 3 次爆发连锁', icon: '🎆', group: '连锁' },

  // —— 连胜 ——
  streak_3: { name: '三连胜', desc: '连续完成 3 局', icon: '🔥', group: '连胜' },
  streak_5: { name: '五连胜', desc: '连续完成 5 局', icon: '🔥', group: '连胜' },
  streak_10: { name: '十连胜', desc: '连续完成 10 局', icon: '🔥', group: '连胜' },

  // —— 经典闯关 ——
  classic_first: { name: '经典启程', desc: '完成一局经典闯关', icon: '📘', group: '经典' },
  classic_5: { name: '初窥门径', desc: '经典模式累计通关 5 关', icon: '📗', group: '经典' },
  classic_10: { name: '坚持不懈', desc: '经典模式累计通关 10 关', icon: '📈', group: '经典' },
  classic_20: { name: '熟能生巧', desc: '经典模式累计通关 20 关', icon: '📘', group: '经典' },
  classic_50: { name: '百炼成钢', desc: '经典模式累计通关 50 关', icon: '🏅', group: '经典' },
  classic_100: { name: '数独行者', desc: '经典模式累计通关 100 关', icon: '🏆', group: '经典' },
  perfect_easy: { name: '完美新手', desc: '简单难度三星通关', icon: '⭐', group: '经典' },
  perfect_medium: { name: '中流砥柱', desc: '中等难度三星通关', icon: '🌟', group: '经典' },
  perfect_hard: { name: '硬核玩家', desc: '困难难度三星通关', icon: '💎', group: '经典' },
  perfect_expert: { name: '数独大师', desc: '专家难度三星通关', icon: '👑', group: '经典' },

  // —— 连锁任务 ——
  mission_first: { name: '任务猎人', desc: '完成一关连锁任务', icon: '🎯', group: '任务' },
  mission_5: { name: '任务达人', desc: '连锁任务累计通关 5 关', icon: '🎯', group: '任务' },
  mission_10: { name: '任务专家', desc: '连锁任务累计通关 10 关', icon: '🎖️', group: '任务' },
  mission_20: { name: '任务传奇', desc: '连锁任务累计通关 20 关', icon: '🏅', group: '任务' },
  mission_50: { name: '任务主宰', desc: '连锁任务累计通关 50 关', icon: '👑', group: '任务' },
  mission_perfect: { name: '完美执行', desc: '连锁任务三星通关（无错无提示）', icon: '💯', group: '任务' },
  mission_burst: { name: '爆破专家', desc: '任务关中完成爆发目标', icon: '💣', group: '任务' },

  // —— 每日一题 ——
  daily_first: { name: '日更达人', desc: '完成一次每日一题', icon: '📅', group: '每日' },
  daily_3: { name: '三日打卡', desc: '累计完成 3 次每日一题', icon: '📆', group: '每日' },
  daily_7: { name: '一周精进', desc: '累计完成 7 次每日一题', icon: '🗓️', group: '每日' },
  daily_15: { name: '半月坚持', desc: '累计完成 15 次每日一题', icon: '📚', group: '每日' },
  daily_30: { name: '月度冠军', desc: '累计完成 30 次每日一题', icon: '🏅', group: '每日' },
  daily_high: { name: '每日高分', desc: '每日综合分达到 500', icon: '🥇', group: '每日' },
  daily_perfect: { name: '每日无暇', desc: '每日一题零错误零提示通关', icon: '✨', group: '每日' },

  // —— 闪电挑战 ——
  blitz_first: { name: '闪电侠', desc: '完成一局闪电挑战', icon: '⚡', group: '闪电' },
  blitz_5: { name: '疾风手', desc: '闪电模式累计通关 5 局', icon: '⚡', group: '闪电' },
  blitz_10: { name: '闪电风暴', desc: '闪电模式累计通关 10 局', icon: '🌩️', group: '闪电' },
  blitz_20: { name: '光速传说', desc: '闪电模式累计通关 20 局', icon: '🚀', group: '闪电' },
  blitz_clutch: { name: '绝境翻盘', desc: '剩余时间 ≤10 秒通关闪电局', icon: '😰', group: '闪电' },
  blitz_rich: { name: '时间富翁', desc: '闪电通关时剩余超过一半时间', icon: '⏳', group: '闪电' },
  blitz_no_extend: { name: '自力更生', desc: '不使用延时与复活通关闪电局', icon: '💪', group: '闪电' },
  blitz_score_300: { name: '闪电高分', desc: '单局闪电得分达到 300', icon: '🥇', group: '闪电' }
};

function getAchievements() {
  return ACHIEVEMENTS;
}

/** 旧成就 id 迁移到新 id */
function migrateLegacyAchievements() {
  const map = {
    chain_master: 'chain_10',
    level_10: 'classic_10',
    combo_master: 'combo_2'
  };
  const list = storage.getAchievements();
  let changed = false;
  Object.keys(map).forEach((oldId) => {
    if (list.includes(oldId) && !list.includes(map[oldId])) {
      list.push(map[oldId]);
      changed = true;
    }
  });
  if (changed) {
    wx.setStorageSync(storage.STORAGE_KEYS.ACHIEVEMENTS, list);
  }
}

function sumCompleted(getter) {
  const keys = ['easy', 'medium', 'hard', 'expert'];
  let total = 0;
  keys.forEach((k) => {
    const p = getter(k);
    total += (p && p.totalCompleted) || 0;
  });
  return total;
}

/**
 * 通关后统一检测并解锁成就
 * @param {object} ctx 通关上下文
 * @returns {string[]} 本次新解锁的成就 id
 */
function evaluateOnWin(ctx) {
  const {
    mode,
    difficulty,
    stars,
    timer,
    mistakes,
    hintsUsed,
    chainCount,
    bestCombo,
    burstCount,
    remainSeconds,
    blitzTime,
    blitzScore,
    dailyScore,
    blitzExtendUsed,
    blitzReviveUsed,
    missionGoals
  } = ctx;

  const newly = [];
  const unlock = (id) => {
    if (storage.unlockAchievement(id)) newly.push(id);
  };

  // 通用
  unlock('first_win');
  if (hintsUsed === 0) unlock('no_hint');
  if (mode !== 'blitz' && timer < 300) unlock('speed_demon');

  // 连击 2/3/4/5/10
  if (bestCombo >= 2) unlock('combo_2');
  if (bestCombo >= 3) unlock('combo_3');
  if (bestCombo >= 4) unlock('combo_4');
  if (bestCombo >= 5) unlock('combo_5');
  if (bestCombo >= 10) unlock('combo_10');

  // 连锁
  if (chainCount >= 5) unlock('chain_5');
  if (chainCount >= 10) unlock('chain_10');
  if (chainCount >= 20) unlock('chain_20');
  if (burstCount >= 1) unlock('burst_first');
  if (burstCount >= 3) unlock('burst_3');

  // 连胜（读更新后的 stats）
  const stats = storage.getStats();
  const streak = stats.winStreak || 0;
  if (streak >= 3) unlock('streak_3');
  if (streak >= 5) unlock('streak_5');
  if (streak >= 10) unlock('streak_10');

  // —— 经典 ——
  if (mode === 'classic') {
    unlock('classic_first');
    const classicTotal = sumCompleted(storage.getDifficultyProgress);
    if (classicTotal >= 5) unlock('classic_5');
    if (classicTotal >= 10) unlock('classic_10');
    if (classicTotal >= 20) unlock('classic_20');
    if (classicTotal >= 50) unlock('classic_50');
    if (classicTotal >= 100) unlock('classic_100');
    if (stars === 3) {
      if (difficulty === 'easy') unlock('perfect_easy');
      if (difficulty === 'medium') unlock('perfect_medium');
      if (difficulty === 'hard') unlock('perfect_hard');
      if (difficulty === 'expert') unlock('perfect_expert');
    }
  }

  // —— 任务 ——
  if (mode === 'mission') {
    unlock('mission_first');
    const missionWins = (stats.missionWins || 0);
    if (missionWins >= 5) unlock('mission_5');
    if (missionWins >= 10) unlock('mission_10');
    if (missionWins >= 20) unlock('mission_20');
    if (missionWins >= 50) unlock('mission_50');
    if (stars === 3 && mistakes === 0 && hintsUsed === 0) unlock('mission_perfect');
    if (missionGoals && missionGoals.burst > 0 && burstCount >= missionGoals.burst) {
      unlock('mission_burst');
    }
  }

  // —— 每日 ——
  if (mode === 'daily') {
    unlock('daily_first');
    const dailyWins = stats.dailyWins || 0;
    if (dailyWins >= 3) unlock('daily_3');
    if (dailyWins >= 7) unlock('daily_7');
    if (dailyWins >= 15) unlock('daily_15');
    if (dailyWins >= 30) unlock('daily_30');
    if ((dailyScore || 0) >= 500) unlock('daily_high');
    if (mistakes === 0 && hintsUsed === 0) unlock('daily_perfect');
  }

  // —— 闪电 ——
  if (mode === 'blitz') {
    unlock('blitz_first');
    const blitzWins = stats.blitzWins || 0;
    if (blitzWins >= 5) unlock('blitz_5');
    if (blitzWins >= 10) unlock('blitz_10');
    if (blitzWins >= 20) unlock('blitz_20');
    if (remainSeconds <= 10) unlock('blitz_clutch');
    if (blitzTime > 0 && remainSeconds > blitzTime / 2) unlock('blitz_rich');
    if (!blitzExtendUsed && !blitzReviveUsed) unlock('blitz_no_extend');
    if ((blitzScore || 0) >= 300) unlock('blitz_score_300');
  }

  return newly;
}

module.exports = {
  ACHIEVEMENTS,
  getAchievements,
  migrateLegacyAchievements,
  evaluateOnWin
};
