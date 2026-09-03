// utils/config.js - 全局配置（广告位等需在公众平台申请后替换）

module.exports = {
  // 激励视频广告位 ID，在 mp.weixin.qq.com → 流量主 → 广告管理 中创建
  // 未填写或仍为占位符时，看视频相关功能会直接通过（视为已观看）
  REWARDED_VIDEO_AD_UNIT_ID: '',

  // 开放数据域排行榜 key（与 openDataContext 保持一致）
  RANK_KEY_TOTAL_WINS: 'sudoku_totalWins',
  RANK_KEY_CHAIN_COUNT: 'sudoku_chainCount',
  RANK_KEY_BEST_COMBO: 'sudoku_bestCombo',
  RANK_KEY_DAILY_SCORE: 'sudoku_dailyScore',
  RANK_KEY_DAILY_DATE: 'sudoku_dailyDate',
  RANK_KEY_BLITZ_SCORE: 'sudoku_blitzScore'
};
