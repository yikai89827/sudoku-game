// pages/game/game.js
const sudoku = require('../../utils/sudoku.js');
const difficultyUtil = require('../../utils/difficulty.js');
const storage = require('../../utils/storage.js');
const adUtil = require('../../utils/ad.js');
const rankUtil = require('../../utils/rank.js');
const modes = require('../../utils/modes.js');
const achievementsUtil = require('../../utils/achievements.js');
const themeUtil = require('../../utils/theme.js');

Page({
  data: {
    theme: 'night',
    mode: 'classic', // classic | mission | daily | blitz
    modeTitle: '',
    difficulty: '',
    difficultyName: '',
    level: 1,
    puzzle: [],
    solution: [],
    board: [],
    notes: [],
    initialCells: [],

    selectedRow: -1,
    selectedCol: -1,
    selectedNumber: 0,

    noteMode: false,
    hintsUsed: 0,
    hintLimit: 3,
    hintLoading: false,

    timer: 0,
    timerDisplay: '00:00',
    remainSeconds: 0,
    mistakes: 0,
    maxMistakes: 5,

    chainEffect: null,
    chainScore: 0,
    chainCount: 0,
    comboLevel: 0,
    bestCombo: 0,
    burstCount: 0,
    lastChainTime: 0,
    timeFloat: null,

    // 任务关
    missionGoals: null,
    missionProgress: { chain: 0, burst: 0, combo: 0 },
    missionLines: [],

    // 闪电局
    blitzTime: 180,
    blitzExtendUsed: false,
    blitzReviveUsed: false,
    blitzAdLoading: false,

    errorCells: {},
    undoStack: [],
    paused: false,
    completed: false,
    highlightErrors: true,
    highlightSame: true,
    loading: true,
    diffColor: '#667eea',
    diffGradient: 'linear-gradient(135deg, #667eea, #764ba2)',
    statusBarHeight: 0,
    navHeight: 44,
    menuWidth: 87,
    dailyDateKey: ''
  },

  onLoad(options) {
    themeUtil.bindPage(this);
    const sysInfo = wx.getSystemInfoSync();
    const menuRect = wx.getMenuButtonBoundingClientRect();
    let mode = options.mode || 'classic';
    let diff = options.difficulty || 'easy';
    let level = 1;
    let blitzTime = parseInt(options.blitzTime, 10) || 180;
    let dailyDateKey = '';
    let modeTitle = '';

    if (mode === 'daily') {
      const daily = modes.getDailyChallenge();
      diff = daily.difficulty;
      level = 1;
      dailyDateKey = daily.dateKey;
      this._dailyRemoveOffset = daily.removeOffset;
      modeTitle = '每日一题';
    } else if (mode === 'mission') {
      const progress = storage.getMissionProgress(diff);
      level = progress.currentLevel || 1;
      modeTitle = '连锁任务';
    } else if (mode === 'blitz') {
      const progress = storage.getDifficultyProgress(diff);
      level = progress.currentLevel || 1;
      modeTitle = '闪电挑战';
    } else {
      const progress = storage.getDifficultyProgress(diff);
      level = progress.currentLevel || 1;
      modeTitle = '经典闯关';
    }

    const config = difficultyUtil.getDifficultyConfig(diff);
    const missionGoals = mode === 'mission' ? modes.getMissionGoals(level) : null;
    const maxMistakes = missionGoals ? missionGoals.maxMistakes : 5;

    this.setData({
      statusBarHeight: sysInfo.statusBarHeight,
      navHeight: (menuRect.top - sysInfo.statusBarHeight) * 2 + menuRect.height,
      menuWidth: menuRect.width,
      mode,
      modeTitle,
      difficulty: diff,
      difficultyName: config.name,
      level,
      hintLimit: config.hintLimit,
      hintsUsed: 0,
      hintLoading: false,
      diffColor: config.color,
      diffGradient: config.gradient,
      blitzTime,
      remainSeconds: mode === 'blitz' ? blitzTime : 0,
      maxMistakes,
      missionGoals,
      missionLines: missionGoals ? modes.formatMissionGoals(missionGoals) : [],
      missionProgress: { chain: 0, burst: 0, combo: 0 },
      dailyDateKey
    });

    this.generateNewPuzzle();
  },

  onShow() {
    themeUtil.bindPage(this);
  },

  onUnload() {
    if (this.timerInterval) clearInterval(this.timerInterval);
  },

  onHide() {
    this.pauseGame();
  },

  generateNewPuzzle() {
    wx.showLoading({ title: '生成关卡...' });

    setTimeout(() => {
      let removeCount = difficultyUtil.getRemoveCount(this.data.difficulty, this.data.level);
      if (this.data.mode === 'daily' && this._dailyRemoveOffset) {
        removeCount += this._dailyRemoveOffset;
      }
      // 任务关略少挖洞，便于完成连锁目标
      if (this.data.mode === 'mission') {
        removeCount = Math.max(30, removeCount - 4);
      }

      const { puzzle, solution } = sudoku.generatePuzzle(removeCount);
      const notes = [];
      const initialCells = [];
      for (let r = 0; r < 9; r++) {
        notes.push([]);
        initialCells.push([]);
        for (let c = 0; c < 9; c++) {
          notes[r].push(new Array(9).fill(false));
          initialCells[r].push(puzzle[r][c] !== 0);
        }
      }

      const missionGoals = this.data.mode === 'mission'
        ? modes.getMissionGoals(this.data.level)
        : null;

      this.setData({
        puzzle,
        solution,
        board: sudoku.cloneBoard(puzzle),
        notes,
        initialCells,
        loading: false,
        timer: 0,
        timerDisplay: '00:00',
        remainSeconds: this.data.mode === 'blitz' ? this.data.blitzTime : 0,
        mistakes: 0,
        hintsUsed: 0,
        hintLoading: false,
        chainScore: 0,
        chainCount: 0,
        comboLevel: 0,
        bestCombo: 0,
        burstCount: 0,
        lastChainTime: 0,
        undoStack: [],
        errorCells: {},
        completed: false,
        selectedRow: -1,
        selectedCol: -1,
        selectedNumber: 0,
        noteMode: false,
        paused: false,
        blitzExtendUsed: false,
        blitzReviveUsed: false,
        blitzAdLoading: false,
        timeFloat: null,
        missionGoals,
        missionLines: missionGoals ? modes.formatMissionGoals(missionGoals) : [],
        missionProgress: { chain: 0, burst: 0, combo: 0 },
        maxMistakes: missionGoals ? missionGoals.maxMistakes : 5
      });

      wx.hideLoading();
      this.startTimer();
    }, 100);
  },

  startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (this.data.paused || this.data.completed) return;

      if (this.data.mode === 'blitz') {
        let remain = this.data.remainSeconds - 1;
        const timer = this.data.timer + 1;
        if (remain <= 0) {
          this.setData({
            remainSeconds: 0,
            timer,
            timerDisplay: this.formatTime(0)
          });
          this.onBlitzTimeout();
          return;
        }
        this.setData({
          remainSeconds: remain,
          timer,
          timerDisplay: this.formatTime(remain)
        });
      } else {
        const timer = this.data.timer + 1;
        this.setData({
          timer,
          timerDisplay: this.formatTime(timer)
        });
      }
    }, 1000);
  },

  formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  },

  showTimeFloat(text) {
    this.setData({ timeFloat: text });
    setTimeout(() => {
      if (this.data.timeFloat === text) {
        this.setData({ timeFloat: null });
      }
    }, 900);
  },

  adjustBlitzTime(delta) {
    if (this.data.mode !== 'blitz' || this.data.completed) return;
    let remain = this.data.remainSeconds + delta;
    if (remain < 0) remain = 0;
    this.setData({
      remainSeconds: remain,
      timerDisplay: this.formatTime(remain)
    });
    if (delta !== 0) {
      this.showTimeFloat((delta > 0 ? '+' : '') + delta + 's');
    }
    if (remain <= 0) {
      this.onBlitzTimeout();
    }
  },

  pauseGame() {
    this.setData({ paused: true });
  },

  resumeGame() {
    this.setData({ paused: false });
  },

  onCellTap(e) {
    if (this.data.completed || this.data.paused) return;
    const row = parseInt(e.currentTarget.dataset.row);
    const col = parseInt(e.currentTarget.dataset.col);

    if (this.data.selectedRow === row && this.data.selectedCol === col) {
      this.setData({ selectedRow: -1, selectedCol: -1, selectedNumber: 0 });
      return;
    }

    this.setData({
      selectedRow: row,
      selectedCol: col,
      selectedNumber: this.data.board[row][col]
    });
  },

  onNumberInput(e) {
    if (this.data.completed || this.data.paused) return;
    const num = parseInt(e.currentTarget.dataset.num);
    const { selectedRow, selectedCol, noteMode, initialCells, board, notes, solution } = this.data;

    if (selectedRow < 0 || selectedCol < 0) {
      wx.showToast({ title: '请先选择格子', icon: 'none', duration: 1000 });
      return;
    }
    if (initialCells[selectedRow][selectedCol]) return;

    wx.vibrateShort({ type: 'light' });

    if (noteMode) {
      const newNotes = this.data.notes.map(row => row.map(arr => [...arr]));
      const cellNotes = newNotes[selectedRow][selectedCol];
      cellNotes[num - 1] = !cellNotes[num - 1];
      const newBoard = board.map(row => [...row]);
      newBoard[selectedRow][selectedCol] = 0;
      this.setData({
        notes: newNotes,
        board: newBoard,
        selectedNumber: 0
      });
      return;
    }

    const prevCellNotes = [...notes[selectedRow][selectedCol]];
    const prevBoard = board.map(row => [...row]);
    const newBoard = board.map(row => [...row]);
    newBoard[selectedRow][selectedCol] = num;

    const newNotes = notes.map(row => row.map(arr => [...arr]));
    newNotes[selectedRow][selectedCol] = new Array(9).fill(false);

    const isCorrect = solution[selectedRow][selectedCol] === num;
    let mistakes = this.data.mistakes;
    let errorCells = { ...this.data.errorCells };

    if (!isCorrect) {
      mistakes++;
      errorCells[selectedRow + '-' + selectedCol] = true;
    } else {
      delete errorCells[selectedRow + '-' + selectedCol];
    }

    const undoStack = [...this.data.undoStack];
    const mainUndo = {
      row: selectedRow,
      col: selectedCol,
      prevValue: prevBoard[selectedRow][selectedCol],
      prevNotes: prevCellNotes,
      prevErrorCells: { ...this.data.errorCells },
      prevMistakes: this.data.mistakes,
      relatedNoteRestores: []
    };
    undoStack.push(mainUndo);

    // 笔记双格互补：同行/列/宫内两格笔记相同且恰为两数，确定一格后另一格自动填剩余数
    let autoFill = null;
    if (isCorrect) {
      autoFill = this.resolveNakedPairAutoFill({
        board: prevBoard,
        notes,
        row: selectedRow,
        col: selectedCol,
        filledNum: num,
        prevCellNotes,
        solution
      });
      if (autoFill) {
        undoStack.push({
          row: autoFill.row,
          col: autoFill.col,
          prevValue: prevBoard[autoFill.row][autoFill.col],
          prevNotes: [...notes[autoFill.row][autoFill.col]],
          prevErrorCells: { ...errorCells },
          prevMistakes: mistakes,
          relatedNoteRestores: []
        });
        newBoard[autoFill.row][autoFill.col] = autoFill.num;
        newNotes[autoFill.row][autoFill.col] = new Array(9).fill(false);
        if (autoFill.correct) {
          delete errorCells[autoFill.row + '-' + autoFill.col];
        } else {
          mistakes++;
          errorCells[autoFill.row + '-' + autoFill.col] = true;
        }
      }
    }

    // 填入数字后，从同行/列/宫其他格子的笔记中去掉该数字
    mainUndo.relatedNoteRestores = this.clearDigitFromRelatedNotes(
      newNotes, newBoard, selectedRow, selectedCol, num
    );
    if (autoFill) {
      const autoUndo = undoStack[undoStack.length - 1];
      autoUndo.relatedNoteRestores = this.clearDigitFromRelatedNotes(
        newNotes, newBoard, autoFill.row, autoFill.col, autoFill.num
      );
    }

    this.setData({
      board: newBoard,
      notes: newNotes,
      selectedNumber: num,
      mistakes,
      errorCells,
      undoStack
    }, () => {
      if (isCorrect) {
        if (this.data.mode === 'blitz') this.adjustBlitzTime(2);
        this.checkChainElimination(prevBoard, newBoard, selectedRow, selectedCol);
        if (autoFill && autoFill.correct) {
          if (this.data.mode === 'blitz') this.adjustBlitzTime(2);
          this.checkChainElimination(
            this.cloneBoardWithCell(prevBoard, selectedRow, selectedCol, num),
            newBoard,
            autoFill.row,
            autoFill.col
          );
        }
        this.checkBoardComplete(newBoard);
        if (autoFill && autoFill.correct) {
          wx.showToast({ title: '笔记互补：已自动填入', icon: 'none', duration: 1200 });
        }
      } else {
        if (this.data.mode === 'blitz') this.adjustBlitzTime(-5);
        if (mistakes >= this.data.maxMistakes) {
          this.onGameOver();
        }
      }
      if (autoFill && !autoFill.correct && mistakes >= this.data.maxMistakes) {
        this.onGameOver();
      }
    });
  },

  /** 获取格子上已勾选的笔记数字 */
  getActiveNoteNums(cellNotes) {
    const nums = [];
    for (let i = 0; i < 9; i++) {
      if (cellNotes[i]) nums.push(i + 1);
    }
    return nums;
  },

  /** 浅拷贝棋盘并写入一格（用于连锁检测的中间盘面） */
  cloneBoardWithCell(board, row, col, num) {
    const next = board.map(r => [...r]);
    next[row][col] = num;
    return next;
  },

  /**
   * 若当前格与同区域另一空格笔记完全相同且恰为两个数字，
   * 填入其中一个数后返回另一格应填的剩余数字
   */
  resolveNakedPairAutoFill({ board, notes, row, col, filledNum, prevCellNotes, solution }) {
    const pairNums = this.getActiveNoteNums(prevCellNotes);
    if (pairNums.length !== 2) return null;
    if (pairNums.indexOf(filledNum) < 0) return null;

    const partner = this.findNakedPairPartner(board, notes, row, col, pairNums);
    if (!partner) return null;

    const remain = pairNums[0] === filledNum ? pairNums[1] : pairNums[0];
    return {
      row: partner.r,
      col: partner.c,
      num: remain,
      correct: solution[partner.r][partner.c] === remain
    };
  },

  /**
   * 在同行 / 同列 / 同宫中寻找唯一配对笔记格
   */
  findNakedPairPartner(board, notes, row, col, pairNums) {
    const units = [];
    units.push(Array.from({ length: 9 }, (_, c) => ({ r: row, c })));
    units.push(Array.from({ length: 9 }, (_, r) => ({ r, c: col })));
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    const boxCells = [];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        boxCells.push({ r: boxRow + i, c: boxCol + j });
      }
    }
    units.push(boxCells);

    for (let u = 0; u < units.length; u++) {
      const matches = [];
      const cells = units[u];
      for (let i = 0; i < cells.length; i++) {
        const r = cells[i].r;
        const c = cells[i].c;
        if (r === row && c === col) {
          matches.push({ r, c });
          continue;
        }
        if (board[r][c] !== 0) continue;
        const nums = this.getActiveNoteNums(notes[r][c]);
        if (nums.length === 2 && nums[0] === pairNums[0] && nums[1] === pairNums[1]) {
          matches.push({ r, c });
        }
      }
      if (matches.length === 2) {
        return matches.find(m => !(m.r === row && m.c === col)) || null;
      }
    }
    return null;
  },

  /**
   * 从同行/列/宫空格的笔记中移除已填入的数字，返回可撤销的笔记快照
   */
  clearDigitFromRelatedNotes(notesBoard, board, row, col, num) {
    const restores = [];
    const idx = num - 1;
    if (idx < 0 || idx > 8) return restores;

    const clearAt = (r, c) => {
      if (r === row && c === col) return;
      if (board[r][c] !== 0) return;
      if (!notesBoard[r][c][idx]) return;
      restores.push({
        row: r,
        col: c,
        prevNotes: [...notesBoard[r][c]]
      });
      notesBoard[r][c][idx] = false;
    };

    for (let i = 0; i < 9; i++) {
      clearAt(row, i);
      clearAt(i, col);
    }
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        clearAt(boxRow + i, boxCol + j);
      }
    }
    return restores;
  },

  checkChainElimination(prevBoard, currBoard, row, col) {
    const { solution } = this.data;
    const { completed } = sudoku.findNewCompletions(currBoard, prevBoard, solution, row, col);

    if (completed.length === 0) return;

    const regionScores = [];
    const highlightCells = {};

    completed.forEach(item => {
      const unsolvedCount = sudoku.countUnsolvedInRegion(
        prevBoard, solution, item.type, item.index
      );
      regionScores.push(unsolvedCount * 10);

      if (item.type === 'row') {
        for (let c = 0; c < 9; c++) highlightCells[item.index + '-' + c] = true;
      } else if (item.type === 'col') {
        for (let r = 0; r < 9; r++) highlightCells[r + '-' + item.index] = true;
      } else if (item.type === 'box') {
        const boxRow = Math.floor(item.index / 3) * 3;
        const boxCol = (item.index % 3) * 3;
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 3; j++) {
            highlightCells[(boxRow + i) + '-' + (boxCol + j)] = true;
          }
        }
      }
    });

    const now = this.data.mode === 'blitz'
      ? (this.data.blitzTime - this.data.remainSeconds)
      : this.data.timer;

    const result = modes.calcChainBonus({
      regionScores,
      regionCount: completed.length,
      lastChainTime: this.data.lastChainTime,
      now,
      currentComboLevel: this.data.comboLevel
    });

    const chainScore = this.data.chainScore + result.totalBonus;
    const chainCount = this.data.chainCount + completed.length;
    const bestCombo = Math.max(this.data.bestCombo, result.comboLevel);
    const burstCount = this.data.burstCount + (completed.length >= 2 ? 1 : 0);

    // 任务进度
    let missionProgress = { ...this.data.missionProgress };
    if (this.data.mode === 'mission') {
      missionProgress.chain = chainCount;
      missionProgress.burst = burstCount;
      if (result.comboLevel >= 3) {
        missionProgress.combo = Math.max(missionProgress.combo, 2);
      } else if (result.comboLevel >= 2) {
        missionProgress.combo = Math.max(missionProgress.combo, 2);
      } else if (result.isContinuous || result.comboLevel >= 1) {
        missionProgress.combo = Math.max(missionProgress.combo, 1);
      }
    }

    let multLabel = 'x1';
    if (result.multiplier === 1.5) multLabel = 'x1.5';
    else if (result.multiplier >= 2) multLabel = 'x2';

    this.setData({
      chainEffect: {
        completed,
        cells: highlightCells,
        bonus: result.totalBonus,
        continuous: result.isContinuous,
        multiplier: multLabel,
        burstBonus: result.burstBonus,
        comboLevel: result.comboLevel
      },
      chainScore,
      chainCount,
      comboLevel: result.comboLevel,
      bestCombo,
      burstCount,
      lastChainTime: now,
      missionProgress
    });

    if (this.data.mode === 'blitz') {
      let add = 5;
      if (result.isContinuous) add += 3;
      this.adjustBlitzTime(add);
    }

    wx.vibrateShort({ type: 'medium' });
    setTimeout(() => {
      this.setData({ chainEffect: null });
    }, 1500);
  },

  isMissionComplete() {
    const goals = this.data.missionGoals;
    const p = this.data.missionProgress;
    if (!goals) return true;
    if (p.chain < goals.chain) return false;
    if (p.burst < goals.burst) return false;
    if (p.combo < goals.combo) return false;
    if (this.data.mistakes > goals.maxMistakes) return false;
    return true;
  },

  checkBoardComplete(board) {
    if (!sudoku.isComplete(board, this.data.solution)) return;

    if (this.data.mode === 'mission' && !this.isMissionComplete()) {
      this.onMissionFail();
      return;
    }
    this.onGameWin();
  },

  onUseHint() {
    if (this.data.completed || this.data.paused || this.data.hintLoading) return;
    const target = this.findHintTarget();
    if (!target) {
      wx.showToast({ title: '没有需要提示的格子', icon: 'none' });
      return;
    }

    this.setData({ hintLoading: true });
    adUtil.showRewardedVideoAd()
      .then(() => this.applyHint(target.row, target.col))
      .catch((err) => {
        const msg = err && err.message;
        if (msg === 'AD_NOT_COMPLETED') {
          wx.showToast({ title: '请看完视频获取提示', icon: 'none' });
        } else if (msg === 'AD_NOT_CONFIGURED') {
          wx.showToast({ title: '广告未配置', icon: 'none' });
        } else {
          wx.showToast({ title: '广告加载失败，请稍后再试', icon: 'none' });
        }
      })
      .finally(() => this.setData({ hintLoading: false }));
  },

  findHintTarget() {
    const { selectedRow, selectedCol, board, solution, initialCells } = this.data;
    let targetRow = selectedRow;
    let targetCol = selectedCol;

    if (targetRow < 0 || targetCol < 0 ||
        initialCells[targetRow][targetCol] ||
        board[targetRow][targetCol] === solution[targetRow][targetCol]) {
      let found = false;
      for (let r = 0; r < 9 && !found; r++) {
        for (let c = 0; c < 9 && !found; c++) {
          if (!initialCells[r][c] && board[r][c] !== solution[r][c]) {
            targetRow = r;
            targetCol = c;
            found = true;
          }
        }
      }
      if (!found) return null;
    }
    return { row: targetRow, col: targetCol };
  },

  applyHint(targetRow, targetCol) {
    const { board, solution, notes } = this.data;
    const correctNum = solution[targetRow][targetCol];
    const prevCellNotes = [...notes[targetRow][targetCol]];
    const prevBoard = board.map(row => [...row]);
    const newBoard = board.map(row => [...row]);
    newBoard[targetRow][targetCol] = correctNum;

    const newNotes = notes.map(row => row.map(arr => [...arr]));
    newNotes[targetRow][targetCol] = new Array(9).fill(false);
    const errorCells = { ...this.data.errorCells };
    delete errorCells[targetRow + '-' + targetCol];

    const undoStack = [...this.data.undoStack];
    const mainUndo = {
      row: targetRow,
      col: targetCol,
      prevValue: prevBoard[targetRow][targetCol],
      prevNotes: prevCellNotes,
      prevErrorCells: { ...this.data.errorCells },
      prevMistakes: this.data.mistakes,
      relatedNoteRestores: []
    };
    undoStack.push(mainUndo);

    const autoFill = this.resolveNakedPairAutoFill({
      board: prevBoard,
      notes,
      row: targetRow,
      col: targetCol,
      filledNum: correctNum,
      prevCellNotes,
      solution
    });

    let mistakes = this.data.mistakes;
    if (autoFill) {
      undoStack.push({
        row: autoFill.row,
        col: autoFill.col,
        prevValue: prevBoard[autoFill.row][autoFill.col],
        prevNotes: [...notes[autoFill.row][autoFill.col]],
        prevErrorCells: { ...errorCells },
        prevMistakes: mistakes,
        relatedNoteRestores: []
      });
      newBoard[autoFill.row][autoFill.col] = autoFill.num;
      newNotes[autoFill.row][autoFill.col] = new Array(9).fill(false);
      if (autoFill.correct) {
        delete errorCells[autoFill.row + '-' + autoFill.col];
      } else {
        mistakes++;
        errorCells[autoFill.row + '-' + autoFill.col] = true;
      }
    }

    mainUndo.relatedNoteRestores = this.clearDigitFromRelatedNotes(
      newNotes, newBoard, targetRow, targetCol, correctNum
    );
    if (autoFill) {
      const autoUndo = undoStack[undoStack.length - 1];
      autoUndo.relatedNoteRestores = this.clearDigitFromRelatedNotes(
        newNotes, newBoard, autoFill.row, autoFill.col, autoFill.num
      );
    }

    this.setData({
      board: newBoard,
      notes: newNotes,
      errorCells,
      mistakes,
      hintsUsed: this.data.hintsUsed + 1,
      selectedRow: targetRow,
      selectedCol: targetCol,
      selectedNumber: correctNum,
      undoStack
    }, () => {
      if (this.data.mode === 'blitz') this.adjustBlitzTime(2);
      this.checkChainElimination(prevBoard, newBoard, targetRow, targetCol);
      if (autoFill && autoFill.correct) {
        if (this.data.mode === 'blitz') this.adjustBlitzTime(2);
        this.checkChainElimination(
          this.cloneBoardWithCell(prevBoard, targetRow, targetCol, correctNum),
          newBoard,
          autoFill.row,
          autoFill.col
        );
      }
      this.checkBoardComplete(newBoard);
      if (autoFill && !autoFill.correct && mistakes >= this.data.maxMistakes) {
        this.onGameOver();
      }
    });

    wx.vibrateShort({ type: 'light' });
  },

  onBlitzExtend() {
    if (this.data.mode !== 'blitz' || this.data.completed || this.data.blitzExtendUsed || this.data.blitzAdLoading) {
      if (this.data.blitzExtendUsed) {
        wx.showToast({ title: '本局延时已用完', icon: 'none' });
      }
      return;
    }

    this.setData({ blitzAdLoading: true });
    adUtil.showRewardedVideoAd()
      .then(() => {
        this.setData({ blitzExtendUsed: true });
        this.adjustBlitzTime(modes.BLITZ_EXTEND_SECONDS);
        wx.showToast({ title: '时间 +' + modes.BLITZ_EXTEND_SECONDS + ' 秒', icon: 'none' });
      })
      .catch((err) => {
        const msg = err && err.message;
        if (msg === 'AD_NOT_COMPLETED') {
          wx.showToast({ title: '请看完视频延长时间', icon: 'none' });
        } else {
          wx.showToast({ title: '广告加载失败', icon: 'none' });
        }
      })
      .finally(() => this.setData({ blitzAdLoading: false }));
  },

  onBlitzTimeout() {
    if (this.data.completed) return;
    if (this.timerInterval) clearInterval(this.timerInterval);

    if (!this.data.blitzReviveUsed) {
      wx.showModal({
        title: '时间到',
        content: '观看视频可复活并增加 ' + modes.BLITZ_REVIVE_SECONDS + ' 秒（本局限 1 次）',
        confirmText: '看视频复活',
        cancelText: '放弃',
        success: (res) => {
          if (res.confirm) {
            this.doBlitzRevive();
          } else {
            this.onGameOver(true);
          }
        }
      });
    } else {
      this.onGameOver(true);
    }
  },

  doBlitzRevive() {
    adUtil.showRewardedVideoAd()
      .then(() => {
        this.setData({
          blitzReviveUsed: true,
          completed: false,
          remainSeconds: modes.BLITZ_REVIVE_SECONDS,
          timerDisplay: this.formatTime(modes.BLITZ_REVIVE_SECONDS)
        });
        this.showTimeFloat('+' + modes.BLITZ_REVIVE_SECONDS + 's');
        this.startTimer();
        wx.showToast({ title: '复活成功', icon: 'none' });
      })
      .catch(() => {
        wx.showToast({ title: '复活失败', icon: 'none' });
        this.onGameOver(true);
      });
  },

  onUndo() {
    if (this.data.undoStack.length === 0 || this.data.completed) return;
    const undoStack = [...this.data.undoStack];
    const lastAction = undoStack.pop();
    const newBoard = this.data.board.map(row => [...row]);
    newBoard[lastAction.row][lastAction.col] = lastAction.prevValue;
    const newNotes = this.data.notes.map(row => row.map(arr => [...arr]));
    newNotes[lastAction.row][lastAction.col] = [...lastAction.prevNotes];

    // 还原因填数而清除的关联笔记
    if (lastAction.relatedNoteRestores && lastAction.relatedNoteRestores.length) {
      for (let i = 0; i < lastAction.relatedNoteRestores.length; i++) {
        const item = lastAction.relatedNoteRestores[i];
        newNotes[item.row][item.col] = [...item.prevNotes];
      }
    }

    this.setData({
      board: newBoard,
      notes: newNotes,
      errorCells: lastAction.prevErrorCells,
      mistakes: lastAction.prevMistakes,
      undoStack,
      selectedRow: lastAction.row,
      selectedCol: lastAction.col,
      selectedNumber: lastAction.prevValue
    });
    wx.vibrateShort({ type: 'light' });
  },

  onToggleNote() {
    this.setData({ noteMode: !this.data.noteMode });
    wx.vibrateShort({ type: 'light' });
  },

  onTogglePause() {
    this.setData({ paused: !this.data.paused });
  },

  onErase() {
    const { selectedRow, selectedCol, initialCells, board, notes } = this.data;
    if (selectedRow < 0 || selectedCol < 0) return;
    if (initialCells[selectedRow][selectedCol]) return;

    const undoStack = [...this.data.undoStack];
    undoStack.push({
      row: selectedRow,
      col: selectedCol,
      prevValue: board[selectedRow][selectedCol],
      prevNotes: [...notes[selectedRow][selectedCol]],
      prevErrorCells: { ...this.data.errorCells },
      prevMistakes: this.data.mistakes
    });

    const newBoard = board.map(row => [...row]);
    newBoard[selectedRow][selectedCol] = 0;
    const newNotes = notes.map(row => row.map(arr => [...arr]));
    newNotes[selectedRow][selectedCol] = new Array(9).fill(false);
    const errorCells = { ...this.data.errorCells };
    delete errorCells[selectedRow + '-' + selectedCol];

    this.setData({
      board: newBoard,
      notes: newNotes,
      selectedNumber: 0,
      errorCells,
      undoStack
    });
    wx.vibrateShort({ type: 'light' });
  },

  onMissionFail() {
    this.setData({ completed: true });
    if (this.timerInterval) clearInterval(this.timerInterval);

    wx.showModal({
      title: '任务未完成',
      content: '盘面已填完，但连锁任务目标未达成。',
      showCancel: true,
      cancelText: '返回',
      confirmText: '再试一次',
      success: (res) => {
        if (res.confirm) {
          this.generateNewPuzzle();
        } else {
          wx.navigateBack({ fail: () => wx.reLaunch({ url: '/pages/index/index' }) });
        }
      }
    });
  },

  onGameWin() {
    this.setData({ completed: true });
    if (this.timerInterval) clearInterval(this.timerInterval);

    const {
      mode, difficulty, level, timer, mistakes, hintsUsed, hintLimit,
      chainScore, chainCount, bestCombo, burstCount, remainSeconds,
      dailyDateKey, blitzTime, blitzExtendUsed, blitzReviveUsed, missionGoals
    } = this.data;

    let stars = difficultyUtil.calculateStars(difficulty, timer, mistakes, hintsUsed, hintLimit);
    let blitzScore = 0;
    let dailyScore = 0;
    let isNewDailyDay = false;

    if (mode === 'blitz') {
      blitzScore = modes.calcBlitzScore(remainSeconds, chainScore, mistakes);
      stars = remainSeconds > 60 ? 3 : (remainSeconds > 20 ? 2 : 1);
    } else if (mode === 'daily') {
      dailyScore = modes.calcDailyScore(chainScore, timer, mistakes, hintsUsed);
    } else if (mode === 'mission') {
      if (mistakes === 0 && hintsUsed === 0) stars = 3;
      else if (mistakes <= 1 && hintsUsed <= 1) stars = Math.min(stars, 2);
      else stars = Math.min(stars, 1);
    }

    // 进度保存
    if (mode === 'classic') {
      storage.updateDifficultyProgress(difficulty, { currentLevel: level + 1 });
      storage.saveBestStars(difficulty, level, stars);
      storage.incrementCompleted(difficulty);
    } else if (mode === 'mission') {
      storage.updateMissionProgress(difficulty, { currentLevel: level + 1 });
      storage.saveMissionBestStars(difficulty, level, stars);
      storage.incrementMissionCompleted(difficulty);
    } else if (mode === 'daily') {
      const prevDaily = storage.getDailyData();
      isNewDailyDay = !prevDaily || prevDaily.dateKey !== dailyDateKey;
      storage.saveDailyBest(dailyDateKey, {
        score: dailyScore,
        time: timer,
        chainScore,
        mistakes,
        hintsUsed,
        difficulty
      });
    } else if (mode === 'blitz') {
      const stats0 = storage.getStats();
      if (blitzScore > (stats0.bestBlitzScore || 0)) {
        storage.updateStats({ bestBlitzScore: blitzScore });
      }
    }

    const stats = storage.getStats();
    const patch = {
      totalGames: (stats.totalGames || 0) + 1,
      totalWins: (stats.totalWins || 0) + 1,
      totalTime: (stats.totalTime || 0) + timer,
      totalMistakes: (stats.totalMistakes || 0) + mistakes,
      chainCount: (stats.chainCount || 0) + chainCount,
      winStreak: (stats.winStreak || 0) + 1
    };
    if (bestCombo > (stats.bestCombo || 0)) patch.bestCombo = bestCombo;
    if (mode === 'mission') patch.missionWins = (stats.missionWins || 0) + 1;
    if (mode === 'blitz') patch.blitzWins = (stats.blitzWins || 0) + 1;
    if (mode === 'daily' && isNewDailyDay) {
      patch.dailyWins = (stats.dailyWins || 0) + 1;
    }
    storage.updateStats(patch);

    // 统一解锁成就称号
    achievementsUtil.evaluateOnWin({
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
    });

    rankUtil.uploadRankData();

    setTimeout(() => {
      wx.redirectTo({
        url: '/pages/result/result?difficulty=' + difficulty +
          '&level=' + level +
          '&stars=' + stars +
          '&time=' + timer +
          '&mistakes=' + mistakes +
          '&hints=' + hintsUsed +
          '&chainScore=' + chainScore +
          '&chainCount=' + chainCount +
          '&bestCombo=' + bestCombo +
          '&mode=' + mode +
          '&blitzScore=' + blitzScore +
          '&dailyScore=' + dailyScore +
          '&remain=' + remainSeconds +
          '&win=1'
      });
    }, 800);
  },

  onGameOver(fromBlitz) {
    this.setData({ completed: true });
    if (this.timerInterval) clearInterval(this.timerInterval);

    const stats = storage.getStats();
    storage.updateStats({
      totalGames: (stats.totalGames || 0) + 1,
      winStreak: 0
    });

    const content = fromBlitz
      ? '倒计时结束，再接再厉！'
      : '错误次数已达上限，再接再厉！';

    wx.showModal({
      title: '游戏失败',
      content,
      showCancel: true,
      cancelText: '返回首页',
      confirmText: '重新开始',
      success: (res) => {
        if (res.confirm) {
          this.generateNewPuzzle();
        } else {
          wx.navigateBack({ fail: () => wx.reLaunch({ url: '/pages/index/index' }) });
        }
      }
    });
  },

  onExit() {
    wx.showModal({
      title: '退出游戏',
      content: '确定要退出当前游戏吗？进度不会保存。',
      success: (res) => {
        if (res.confirm) {
          if (this.timerInterval) clearInterval(this.timerInterval);
          wx.navigateBack({
            fail: () => wx.reLaunch({ url: '/pages/index/index' })
          });
        }
      }
    });
  }
});
