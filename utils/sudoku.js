// utils/sudoku.js - 数独生成与验证核心算法

/**
 * 数独核心算法引擎
 * 包含: 完整棋盘生成、回溯求解器、唯一解验证、挖洞生成谜题
 */

// 棋盘大小
const SIZE = 9;
const BOX_SIZE = 3;

/**
 * 创建空棋盘 (9x9 全0)
 */
function createEmptyBoard() {
  return Array.from({ length: SIZE }, () => new Array(SIZE).fill(0));
}

/**
 * 深拷贝棋盘
 */
function cloneBoard(board) {
  return board.map(row => [...row]);
}

/**
 * 洗牌数组 (Fisher-Yates)
 */
function shuffle(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * 检查在指定位置放置数字是否合法
 * @param {number[][]} board - 棋盘
 * @param {number} row - 行
 * @param {number} col - 列
 * @param {number} num - 要放置的数字
 * @returns {boolean}
 */
function isValid(board, row, col, num) {
  // 检查行
  for (let i = 0; i < SIZE; i++) {
    if (board[row][i] === num) return false;
  }
  // 检查列
  for (let i = 0; i < SIZE; i++) {
    if (board[i][col] === num) return false;
  }
  // 检查3x3宫
  const boxRow = Math.floor(row / BOX_SIZE) * BOX_SIZE;
  const boxCol = Math.floor(col / BOX_SIZE) * BOX_SIZE;
  for (let i = 0; i < BOX_SIZE; i++) {
    for (let j = 0; j < BOX_SIZE; j++) {
      if (board[boxRow + i][boxCol + j] === num) return false;
    }
  }
  return true;
}

/**
 * 生成一个完整的合法数独棋盘 (回溯+随机化)
 * @returns {number[][]} 9x9 完整数独棋盘
 */
function generateFullBoard() {
  const board = createEmptyBoard();

  function fillRecursive(pos) {
    if (pos === SIZE * SIZE) return true;
    const row = Math.floor(pos / SIZE);
    const col = pos % SIZE;
    const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    for (const num of nums) {
      if (isValid(board, row, col, num)) {
        board[row][col] = num;
        if (fillRecursive(pos + 1)) return true;
        board[row][col] = 0;
      }
    }
    return false;
  }

  fillRecursive(0);
  return board;
}

/**
 * 回溯求解器 - 计算解的数量 (最多到limit个就停止)
 * @param {number[][]} board - 棋盘
 * @param {number} limit - 最多找到几个解就停止
 * @returns {number} 找到的解数量
 */
function countSolutions(board, limit = 2) {
  let count = 0;
  const workBoard = cloneBoard(board);

  function solve(pos) {
    if (count >= limit) return;
    if (pos === SIZE * SIZE) {
      count++;
      return;
    }
    const row = Math.floor(pos / SIZE);
    const col = pos % SIZE;
    if (workBoard[row][col] !== 0) {
      solve(pos + 1);
      return;
    }
    for (let num = 1; num <= 9; num++) {
      if (isValid(workBoard, row, col, num)) {
        workBoard[row][col] = num;
        solve(pos + 1);
        workBoard[row][col] = 0;
        if (count >= limit) return;
      }
    }
  }

  solve(0);
  return count;
}

/**
 * 求解数独，返回第一个找到的解
 * @param {number[][]} board - 棋盘
 * @returns {number[][]|null} 解出的完整棋盘，或null
 */
function solve(board) {
  const workBoard = cloneBoard(board);

  function solveRecursive(pos) {
    if (pos === SIZE * SIZE) return true;
    const row = Math.floor(pos / SIZE);
    const col = pos % SIZE;
    if (workBoard[row][col] !== 0) {
      return solveRecursive(pos + 1);
    }
    for (let num = 1; num <= 9; num++) {
      if (isValid(workBoard, row, col, num)) {
        workBoard[row][col] = num;
        if (solveRecursive(pos + 1)) return true;
        workBoard[row][col] = 0;
      }
    }
    return false;
  }

  if (solveRecursive(0)) return workBoard;
  return null;
}

/**
 * 对称挖洞法生成谜题，确保唯一解
 * @param {number[][]} fullBoard - 完整棋盘
 * @param {number} targetRemove - 目标挖洞数量
 * @returns {{puzzle: number[][], solution: number[][]}}
 */
function digHoles(fullBoard, targetRemove) {
  const puzzle = cloneBoard(fullBoard);
  // 生成所有81个位置的随机排列
  const positions = [];
  for (let i = 0; i < SIZE * SIZE; i++) {
    positions.push(i);
  }
  const shuffledPositions = shuffle(positions);

  let removed = 0;
  // 对称挖洞：从位置列表中取，每挖一个先备份再验证唯一解
  for (const pos of shuffledPositions) {
    if (removed >= targetRemove) break;
    const row = Math.floor(pos / SIZE);
    const col = pos % SIZE;
    if (puzzle[row][col] === 0) continue;

    // 备份
    const backup = puzzle[row][col];
    puzzle[row][col] = 0;

    // 验证唯一解
    const solutionCount = countSolutions(puzzle, 2);
    if (solutionCount === 1) {
      removed++;
    } else {
      // 不唯一，恢复
      puzzle[row][col] = backup;
    }
  }

  return { puzzle, solution: cloneBoard(fullBoard) };
}

/**
 * 生成数独谜题 (完整流程)
 * @param {number} removeCount - 要挖掉的数量
 * @returns {{puzzle: number[][], solution: number[][]}}
 */
function generatePuzzle(removeCount) {
  const fullBoard = generateFullBoard();
  const { puzzle, solution } = digHoles(fullBoard, removeCount);
  return { puzzle, solution };
}

/**
 * 检查某个位置填入的数字是否与解一致
 * @param {number[][]} solution - 完整解
 * @param {number} row - 行
 * @param {number} col - 列
 * @param {number} num - 填入的数字
 * @returns {boolean}
 */
function checkCell(solution, row, col, num) {
  return solution[row][col] === num;
}

/**
 * 判断行/列/宫是否与答案一致（正确完成）
 */
function isRowComplete(board, solution, row) {
  for (let c = 0; c < SIZE; c++) {
    if (board[row][c] !== solution[row][c]) return false;
  }
  return true;
}

function isColComplete(board, solution, col) {
  for (let r = 0; r < SIZE; r++) {
    if (board[r][col] !== solution[r][col]) return false;
  }
  return true;
}

function isBoxComplete(board, solution, boxIndex) {
  const boxRow = Math.floor(boxIndex / BOX_SIZE) * BOX_SIZE;
  const boxCol = (boxIndex % BOX_SIZE) * BOX_SIZE;
  for (let i = 0; i < BOX_SIZE; i++) {
    for (let j = 0; j < BOX_SIZE; j++) {
      const r = boxRow + i;
      const c = boxCol + j;
      if (board[r][c] !== solution[r][c]) return false;
    }
  }
  return true;
}

/**
 * 获取指定行、列、宫相对答案的完成状态
 * @param {number[][]} board - 当前棋盘
 * @param {number[][]} solution - 完整解
 * @returns {{rows: boolean[], cols: boolean[], boxes: boolean[]}}
 */
function getSolutionCompletionStatus(board, solution) {
  const rows = new Array(SIZE).fill(false);
  const cols = new Array(SIZE).fill(false);
  const boxes = new Array(SIZE).fill(false);

  for (let r = 0; r < SIZE; r++) {
    rows[r] = isRowComplete(board, solution, r);
  }
  for (let c = 0; c < SIZE; c++) {
    cols[c] = isColComplete(board, solution, c);
  }
  for (let b = 0; b < SIZE; b++) {
    boxes[b] = isBoxComplete(board, solution, b);
  }

  return { rows, cols, boxes };
}

/**
 * 统计某行/列/宫中尚未填对的格子数（含空格与错填）
 * @param {number[][]} board - 当前棋盘
 * @param {number[][]} solution - 完整解
 * @param {string} type - 'row' | 'col' | 'box'
 * @param {number} index - 行号/列号/宫号
 * @returns {number}
 */
function countUnsolvedInRegion(board, solution, type, index) {
  let count = 0;

  if (type === 'row') {
    for (let c = 0; c < SIZE; c++) {
      if (board[index][c] !== solution[index][c]) count++;
    }
  } else if (type === 'col') {
    for (let r = 0; r < SIZE; r++) {
      if (board[r][index] !== solution[r][index]) count++;
    }
  } else if (type === 'box') {
    const boxRow = Math.floor(index / BOX_SIZE) * BOX_SIZE;
    const boxCol = (index % BOX_SIZE) * BOX_SIZE;
    for (let i = 0; i < BOX_SIZE; i++) {
      for (let j = 0; j < BOX_SIZE; j++) {
        const r = boxRow + i;
        const c = boxCol + j;
        if (board[r][c] !== solution[r][c]) count++;
      }
    }
  }

  return count;
}

/**
 * 找出指定行列宫中刚刚完成的区域 (连锁消除判定)
 * @param {number[][]} board - 当前棋盘
 * @param {number[][]} prevBoard - 之前的棋盘状态
 * @param {number[][]} solution - 完整解
 * @param {number} row - 刚填入的行
 * @param {number} col - 刚填入的列
 * @returns {{completed: Array, boxIndex: number}} 刚完成的行列宫列表
 */
function findNewCompletions(board, prevBoard, solution, row, col) {
  const completed = [];
  const prev = getSolutionCompletionStatus(prevBoard, solution);
  const curr = getSolutionCompletionStatus(board, solution);

  if (!prev.rows[row] && curr.rows[row]) {
    completed.push({ type: 'row', index: row });
  }
  if (!prev.cols[col] && curr.cols[col]) {
    completed.push({ type: 'col', index: col });
  }
  const boxIndex = Math.floor(row / BOX_SIZE) * BOX_SIZE + Math.floor(col / BOX_SIZE);
  if (!prev.boxes[boxIndex] && curr.boxes[boxIndex]) {
    completed.push({ type: 'box', index: boxIndex });
  }

  return { completed, boxIndex };
}

/**
 * 检查棋盘是否完成
 * @param {number[][]} board - 棋盘
 * @param {number[][]} solution - 完整解
 * @returns {boolean}
 */
function isComplete(board, solution) {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] !== solution[r][c]) return false;
    }
  }
  return true;
}

module.exports = {
  SIZE,
  BOX_SIZE,
  createEmptyBoard,
  cloneBoard,
  isValid,
  generateFullBoard,
  countSolutions,
  solve,
  generatePuzzle,
  checkCell,
  getSolutionCompletionStatus,
  countUnsolvedInRegion,
  findNewCompletions,
  isComplete
};
