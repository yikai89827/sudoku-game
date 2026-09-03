# 一起快乐玩数独呀

微信小程序数独游戏：经典闯关、连锁连击、每日一题、闪电限时，支持主题切换与好友排行。

## 功能特色

- **经典闯关**：简单 / 中等 / 困难 / 专家，关卡递进挖空
- **连锁消除**：填对后完成行 / 列 / 宫触发连锁特效与加分，支持连击与爆发
- **连锁任务**：独立关卡线，需达成连锁次数等目标
- **每日一题**：按日期固定一局，保留当日最佳成绩
- **闪电挑战**：1 / 2 / 3 / 5 分钟倒计时，填对加时、看视频延时 / 复活
- **笔记辅助**
  - 同行 / 列 / 宫内两格笔记完全相同且恰为两数时，确定一格后另一格自动填入剩余数
  - 填入数字后，自动从相关空格笔记中去掉该数字
- **主题切换**：黑夜（默认）/ 白天 / 护眼；未配置广告位时可直接使用，配置后可通过看视频解锁
- **成就 & 好友榜**：本地成就统计，开放数据域好友通关排行

## 技术栈

- 微信小程序原生（WXML / WXSS / JS）
- 本地存储 `wx.setStorageSync`
- 激励视频 `wx.createRewardedVideoAd`
- 好友榜开放数据域 `openDataContext`

## 目录结构

```
sudoku-game/
├── app.js / app.json / app.wxss
├── images/logo.png
├── openDataContext/          # 好友排行榜绘制
├── pages/
│   ├── index/                # 首页（主题切换入口）
│   ├── difficulty/           # 难度选择
│   ├── blitz/                # 闪电时长选择
│   ├── game/                 # 对局主界面
│   ├── result/               # 结算
│   ├── achievements/         # 成就
│   ├── rank/                 # 好友榜
│   └── rules/                # 玩法说明
└── utils/
    ├── sudoku.js             # 生成 / 求解 / 校验
    ├── difficulty.js         # 难度与星级
    ├── modes.js              # 各模式逻辑
    ├── theme.js              # 主题
    ├── ad.js                 # 激励视频
    ├── storage.js            # 本地存储
    ├── achievements.js
    ├── rank.js
    └── config.js             # 广告位等配置
```

## 本地运行

1. 安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 导入本项目目录
3. 在 `project.config.json` 中填写你的 `appid`（或使用测试号）
4. 编译预览即可

## 配置说明

编辑 `utils/config.js`：

```js
// 激励视频广告位 ID（公众平台 → 流量主 → 广告管理）
REWARDED_VIDEO_AD_UNIT_ID: ''
```

- **未填写**或仍为占位符：看视频相关能力（提示 / 延时 / 复活 / 主题解锁）直接视为已观看通过，方便开发调试
- **填写真实广告位**后：恢复正常激励视频流程

## 页面流程

```
首页
 ├─ 经典闯关 → 难度 → 对局 → 结算
 ├─ 连锁任务 → 难度 → 对局 → 结算
 ├─ 每日一题 → 对局 → 结算
 ├─ 闪电挑战 → 时长 → 难度 → 对局 → 结算
 ├─ 好友榜 / 成就 / 规则
 └─ 主题一键切换（全局同步）
```

## 仓库

- GitHub：https://github.com/yikai89827/sudoku-game
- Gitee：https://gitee.com/alex-yi/sudoku-game

## License

MIT
