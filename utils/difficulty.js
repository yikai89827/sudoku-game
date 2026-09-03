// utils/difficulty.js - 难度系统与关卡递增机制

/**
 * 难度配置
 * baseRemove: 基础挖洞数
 * increment: 每stepInterval关增加的挖洞数
 * stepInterval: 每隔多少关增加一次
 * maxRemove: 最大挖洞数 (9x9棋盘最多64个洞，保留17个最少)
 */
const DIFFICULTY_CONFIG = {
  easy: {
    name: '简单',
    nameEn: 'Easy',
    baseRemove: 35,
    increment: 2,
    stepInterval: 5,
    maxRemove: 50,
    color: '#4CAF50',
    gradient: 'linear-gradient(135deg, #43e97b, #38f9d7)',
    icon: 'E',
    desc: '适合新手入门，轻松愉快',
    stars: { three: 300, two: 600, one: 900 },
    hintLimit: 5
  },
  medium: {
    name: '中等',
    nameEn: 'Medium',
    baseRemove: 44,
    increment: 2,
    stepInterval: 5,
    maxRemove: 56,
    color: '#FF9800',
    gradient: 'linear-gradient(135deg, #fa709a, #fee140)',
    icon: 'M',
    desc: '需要一定的逻辑推理',
    stars: { three: 600, two: 900, one: 1200 },
    hintLimit: 3
  },
  hard: {
    name: '困难',
    nameEn: 'Hard',
    baseRemove: 50,
    increment: 1,
    stepInterval: 5,
    maxRemove: 60,
    color: '#f44336',
    gradient: 'linear-gradient(135deg, #f5576c, #f093fb)',
    icon: 'H',
    desc: '考验高级数独技巧',
    stars: { three: 900, two: 1200, one: 1500 },
    hintLimit: 2
  },
  expert: {
    name: '专家',
    nameEn: 'Expert',
    baseRemove: 55,
    increment: 1,
    stepInterval: 5,
    maxRemove: 62,
    color: '#9C27B0',
    gradient: 'linear-gradient(135deg, #667eea, #764ba2)',
    icon: 'X',
    desc: '极限挑战，高手专属',
    stars: { three: 1200, two: 1500, one: 1800 },
    hintLimit: 1
  }
};

/**
 * 根据难度和关卡数计算实际挖洞数量
 * 在基础挖洞数上，随关卡推进循序增加
 * @param {string} difficulty - 难度级别
 * @param {number} level - 关卡数 (从1开始)
 * @returns {number} 挖洞数量
 */
function getRemoveCount(difficulty, level) {
  const config = DIFFICULTY_CONFIG[difficulty];
  if (!config) return 40;

  // 每经过stepInterval关，增加increment个洞
  const steps = Math.floor((level - 1) / config.stepInterval);
  let removeCount = config.baseRemove + steps * config.increment;

  // 不超过最大值
  removeCount = Math.min(removeCount, config.maxRemove);

  return removeCount;
}

/**
 * 获取难度配置
 * @param {string} difficulty
 * @returns {object}
 */
function getDifficultyConfig(difficulty) {
  return DIFFICULTY_CONFIG[difficulty];
}

/**
 * 获取所有难度配置
 * @returns {object}
 */
function getAllDifficulties() {
  return DIFFICULTY_CONFIG;
}

/**
 * 计算星级评分
 * @param {string} difficulty - 难度
 * @param {number} time - 完成用时(秒)
 * @param {number} mistakes - 错误次数
 * @param {number} hintsUsed - 使用提示次数
 * @param {number} hintLimit - 提示上限
 * @returns {number} 星级 0-3
 */
function calculateStars(difficulty, time, mistakes, hintsUsed, hintLimit) {
  const config = DIFFICULTY_CONFIG[difficulty];
  if (!config) return 0;

  let stars = 3;

  // 错误次数扣星
  if (mistakes > 3) stars--;
  if (mistakes > 6) stars--;

  // 提示使用扣星
  if (hintsUsed > 0) stars--;
  if (hintsUsed > hintLimit / 2) stars--;

  // 时间扣星
  if (time > config.stars.one) stars = Math.min(stars, 1);
  else if (time > config.stars.two) stars = Math.min(stars, 2);

  return Math.max(0, stars);
}

/**
 * 获取成就定义
 */
const achievementsUtil = require('./achievements.js');
const ACHIEVEMENTS = achievementsUtil.ACHIEVEMENTS;

function getAchievements() {
  return ACHIEVEMENTS;
}

module.exports = {
  DIFFICULTY_CONFIG,
  getRemoveCount,
  getDifficultyConfig,
  getAllDifficulties,
  calculateStars,
  getAchievements,
  ACHIEVEMENTS
};
