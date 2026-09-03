// 开放数据域 - 好友排行榜渲染（不可引用主包模块）

var RANK_KEY = 'sudoku_totalWins';
var ITEM_HEIGHT = 72;
var HEADER_HEIGHT = 44;

var currentTheme = {
  bg: '#1a1a2e',
  text: '#ffffff',
  textMuted: 'rgba(255,255,255,0.45)',
  accent: '#a8a8ff',
  accentSoft: 'rgba(102,126,234,0.5)',
  line: 'rgba(255,255,255,0.08)'
};

wx.onMessage(function (data) {
  if (data.type === 'renderFriendRank') {
    if (data.theme) {
      currentTheme = {
        bg: data.theme.bg || currentTheme.bg,
        text: data.theme.text || currentTheme.text,
        textMuted: data.theme.textMuted || currentTheme.textMuted,
        accent: data.theme.accent || currentTheme.accent,
        accentSoft: data.theme.accentSoft || currentTheme.accentSoft,
        line: data.theme.line || currentTheme.line
      };
    }
    renderFriendRank(data.width || 375, data.height || 500, data.rankKey || RANK_KEY);
  }
});

function getScore(user, rankKey) {
  var kv = user.KVDataList || [];
  for (var i = 0; i < kv.length; i++) {
    if (kv[i].key === rankKey) {
      return parseInt(kv[i].value, 10) || 0;
    }
  }
  return 0;
}

function renderFriendRank(width, height, rankKey) {
  var sharedCanvas = wx.getSharedCanvas();
  var ctx = sharedCanvas.getContext('2d');
  sharedCanvas.width = width;
  sharedCanvas.height = height;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = currentTheme.bg;
  ctx.fillRect(0, 0, width, height);

  wx.getFriendCloudStorage({
    keyList: [rankKey],
    success: function (res) {
      var list = res.data || [];
      list.sort(function (a, b) {
        return getScore(b, rankKey) - getScore(a, rankKey);
      });
      drawList(ctx, list, width, height, rankKey);
    },
    fail: function () {
      drawMessage(ctx, width, height, '暂无好友排行数据', '邀请好友一起玩吧');
    }
  });
}

function drawMessage(ctx, width, height, title, subtitle) {
  ctx.fillStyle = currentTheme.text;
  ctx.globalAlpha = 0.9;
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, width / 2, height / 2 - 10);
  ctx.globalAlpha = 1;
  ctx.fillStyle = currentTheme.textMuted;
  ctx.font = '13px sans-serif';
  ctx.fillText(subtitle, width / 2, height / 2 + 18);
  ctx.textAlign = 'left';
}

function drawList(ctx, list, width, height, rankKey) {
  ctx.fillStyle = currentTheme.text;
  ctx.font = 'bold 17px sans-serif';
  ctx.fillText('好友通关榜', 20, 28);

  ctx.fillStyle = currentTheme.textMuted;
  ctx.font = '12px sans-serif';
  ctx.fillText('按累计通关数排名', 20, 46);

  if (list.length === 0) {
    drawMessage(ctx, width, height, '暂无好友数据', '通关后会自动上榜');
    return;
  }

  var startY = HEADER_HEIGHT + 8;
  var maxItems = Math.min(list.length, Math.floor((height - startY - 10) / ITEM_HEIGHT));

  for (var i = 0; i < maxItems; i++) {
    drawItem(ctx, list[i], i, width, startY, rankKey);
  }
}

function drawItem(ctx, user, index, width, startY, rankKey) {
  var y = startY + index * ITEM_HEIGHT;
  var score = getScore(user, rankKey);
  var rankColors = ['#ffd700', '#c0c0c0', '#cd7f32'];

  ctx.fillStyle = index < 3 ? rankColors[index] : currentTheme.textMuted;
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText(String(index + 1), 22, y + 42);

  drawAvatar(ctx, user.avatarUrl, 52, y + 12);

  ctx.fillStyle = currentTheme.text;
  ctx.font = '14px sans-serif';
  var name = user.nickname || '微信好友';
  if (name.length > 10) name = name.slice(0, 10) + '…';
  ctx.fillText(name, 96, y + 32);

  ctx.fillStyle = currentTheme.accent;
  ctx.font = 'bold 15px sans-serif';
  var scoreText = score + ' 关';
  var scoreWidth = ctx.measureText(scoreText).width;
  ctx.fillText(scoreText, width - scoreWidth - 20, y + 34);

  ctx.strokeStyle = currentTheme.line;
  ctx.beginPath();
  ctx.moveTo(20, y + ITEM_HEIGHT - 6);
  ctx.lineTo(width - 20, y + ITEM_HEIGHT - 6);
  ctx.stroke();
}

function drawAvatar(ctx, url, x, y) {
  if (!url) {
    ctx.fillStyle = currentTheme.accentSoft;
    ctx.beginPath();
    ctx.arc(x + 18, y + 18, 18, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  var img = wx.createImage();
  img.onload = function () {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x + 18, y + 18, 18, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, x, y, 36, 36);
    ctx.restore();
  };
  img.src = url;
}
