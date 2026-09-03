// utils/modes.js - 玩法模式：连锁连击 / 任务关 / 每日一题 / 闪电局

const DIFF_KEYS = ['easy', 'medium', 'hard', 'expert'];

const BLITZ_TIME_OPTIONS = [
  { minutes: 1, seconds: 60, label: '1分钟' },
  { minutes: 2, seconds: 120, label: '2分钟' },
  { minutes: 3, seconds: 180, label: '3分钟' },
  { minutes: 5, seconds: 300, label: '5分钟' }
];

const BLITZ_EXTEND_SECONDS = 60;
const BLITZ_REVIVE_SECONDS = 60;
const COMBO_WINDOW = 10;

/**
 * 今日日期 key YYYYMMDD
 */
function getTodayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = (d.getMonth() + 1 < 10 ? '0' : '') + (d.getMonth() + 1);
  const day = (d.getDate() < 10 ? '0' : '') + d.getDate();
  return '' + y + m + day;
}

/**
 * 简单字符串哈希 → 正整数种子
 */
function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * 每日一题：按日期随机难度（全服同一天同一难度）
 */
function getDailyChallenge(dateKey) {
  const key = dateKey || getTodayKey();
  const seed = hashSeed('daily_' + key);
  const difficulty = DIFF_KEYS[seed % DIFF_KEYS.length];
  // 挖洞数在该难度基础值附近小幅浮动
  const removeOffset = (seed % 5);
  return {
    dateKey: key,
    difficulty,
    seed,
    removeOffset,
    level: 1
  };
}

/**
 * 根据任务关卡号生成目标（独立关卡线）
 * 随关卡推进逐步变难
 */
function getMissionGoals(level) {
  const lv = Math.max(1, level || 1);
  const chainNeed = Math.min(3 + Math.floor((lv - 1) / 2), 10);
  const burstNeed = lv >= 3 ? 1 : 0;
  const comboNeed = lv >= 5 ? 2 : (lv >= 2 ? 1 : 0);
  const maxMistakes = Math.max(2, 5 - Math.floor((lv - 1) / 4));

  return {
    chain: chainNeed,      // 连锁次数（按完成区域数累计）
    burst: burstNeed,      // 同屏完成 ≥2 区域
    combo: comboNeed,      // 达到的最高连击档位（1=首次连续，2=x2）
    maxMistakes
  };
}

/**
 * 任务目标文案
 */
function formatMissionGoals(goals) {
  const lines = [];
  lines.push('连锁 ' + goals.chain + ' 次');
  if (goals.burst > 0) lines.push('爆发 ' + goals.burst + ' 次');
  if (goals.combo > 0) lines.push('连击达 x' + (goals.combo === 1 ? '1.5' : '2'));
  lines.push('错误 ≤ ' + goals.maxMistakes);
  return lines;
}

/**
 * 计算连锁得分（含连击倍数与爆发）
 * @returns {{ totalBonus, comboLevel, multiplier, isContinuous, burstBonus, baseScore }}
 */
function calcChainBonus(params) {
  const {
    regionScores,      // 各区域基础分数组
    regionCount,
    lastChainTime,
    now,
    currentComboLevel  // 当前已达到的连击档（0=无）
  } = params;

  let baseScore = 0;
  regionScores.forEach((s) => { baseScore += s; });

  const isContinuous = lastChainTime > 0 && (now - lastChainTime) <= COMBO_WINDOW;
  let comboLevel = isContinuous ? (currentComboLevel + 1) : 1;
  if (comboLevel < 1) comboLevel = 1;

  // 倍数：1 → 1；2 → 1.5；≥3 → 2
  let multiplier = 1;
  if (comboLevel >= 3) multiplier = 2;
  else if (comboLevel >= 2) multiplier = 1.5;

  let totalBonus = Math.floor(baseScore * multiplier);
  if (isContinuous) totalBonus += 10;

  // 同屏爆发：多区域额外奖励
  let burstBonus = 0;
  if (regionCount >= 2) {
    burstBonus = 20 * (regionCount - 1);
    totalBonus += burstBonus;
  }

  return {
    totalBonus,
    comboLevel,
    multiplier,
    isContinuous,
    burstBonus,
    baseScore
  };
}

/**
 * 每日综合分
 */
function calcDailyScore(chainScore, time, mistakes, hintsUsed) {
  return Math.max(0, chainScore + Math.max(0, 600 - time) - mistakes * 20 - hintsUsed * 30);
}

/**
 * 闪电局得分
 */
function calcBlitzScore(remainSeconds, chainScore, mistakes) {
  return Math.max(0, remainSeconds * 2 + chainScore - mistakes * 15);
}

function getBlitzOptions() {
  return BLITZ_TIME_OPTIONS;
}

module.exports = {
  DIFF_KEYS,
  BLITZ_TIME_OPTIONS,
  BLITZ_EXTEND_SECONDS,
  BLITZ_REVIVE_SECONDS,
  COMBO_WINDOW,
  getTodayKey,
  hashSeed,
  getDailyChallenge,
  getMissionGoals,
  formatMissionGoals,
  calcChainBonus,
  calcDailyScore,
  calcBlitzScore,
  getBlitzOptions
};
