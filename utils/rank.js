// utils/rank.js - 好友排行榜云端数据上传

const config = require('./config.js');
const storage = require('./storage.js');
const modes = require('./modes.js');

/**
 * 上传当前玩家成绩到微信关系链云端存储
 */
function uploadRankData() {
  if (!wx.setUserCloudStorage) {
    console.warn('当前环境不支持 setUserCloudStorage');
    return;
  }

  const stats = storage.getStats();
  const daily = storage.getDailyData();
  const today = modes.getTodayKey();

  const kv = [
    { key: config.RANK_KEY_TOTAL_WINS, value: String(stats.totalWins || 0) },
    { key: config.RANK_KEY_CHAIN_COUNT, value: String(stats.chainCount || 0) },
    { key: config.RANK_KEY_BEST_COMBO, value: String(stats.bestCombo || 0) },
    { key: config.RANK_KEY_BLITZ_SCORE, value: String(stats.bestBlitzScore || 0) }
  ];

  if (daily && daily.dateKey === today) {
    kv.push({ key: config.RANK_KEY_DAILY_SCORE, value: String(daily.score || 0) });
    kv.push({ key: config.RANK_KEY_DAILY_DATE, value: String(daily.dateKey) });
  }

  wx.setUserCloudStorage({
    KVDataList: kv,
    fail: (err) => {
      console.warn('上传排行榜数据失败', err);
    }
  });
}

module.exports = {
  uploadRankData
};
