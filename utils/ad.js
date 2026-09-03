// utils/ad.js - 激励视频广告

const config = require('./config.js');

let rewardedVideoAd = null;
let adInitialized = false;

function isPlaceholderAdUnit() {
  return !config.REWARDED_VIDEO_AD_UNIT_ID ||
    config.REWARDED_VIDEO_AD_UNIT_ID.indexOf('xxxxxxxx') !== -1;
}

/**
 * 初始化激励视频广告（在 app.onLaunch 调用）
 */
function initRewardedVideoAd() {
  if (adInitialized || !wx.createRewardedVideoAd) return;
  if (isPlaceholderAdUnit()) return;

  adInitialized = true;
  rewardedVideoAd = wx.createRewardedVideoAd({
    adUnitId: config.REWARDED_VIDEO_AD_UNIT_ID
  });

  rewardedVideoAd.onError((err) => {
    console.warn('激励视频广告错误', err);
  });
}

/**
 * 展示激励视频，完整观看后 resolve
 * 未填写有效广告位 ID 时直接视为看完并通过
 * @returns {Promise<void>}
 */
function showRewardedVideoAd() {
  return new Promise((resolve, reject) => {
    // 未配置广告位：直接通过，按已观看处理
    if (isPlaceholderAdUnit()) {
      resolve();
      return;
    }

    if (!rewardedVideoAd) {
      initRewardedVideoAd();
    }

    if (!rewardedVideoAd) {
      reject(new Error('AD_NOT_AVAILABLE'));
      return;
    }

    const onClose = (res) => {
      rewardedVideoAd.offClose(onClose);
      if (res && res.isEnded) {
        resolve();
      } else {
        reject(new Error('AD_NOT_COMPLETED'));
      }
    };

    rewardedVideoAd.onClose(onClose);

    rewardedVideoAd.show().catch(() => {
      rewardedVideoAd.load()
        .then(() => rewardedVideoAd.show())
        .catch((err) => {
          rewardedVideoAd.offClose(onClose);
          reject(err);
        });
    });
  });
}

module.exports = {
  initRewardedVideoAd,
  showRewardedVideoAd,
  isPlaceholderAdUnit
};
