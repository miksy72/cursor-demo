// 보드 크기 (표준 테트리스: 10열 × 20행)
const COLS = 10;
const ROWS = 20;
const DROP_INTERVAL_MS = 800;
const LINE_SCORES = [0, 100, 300, 500, 800];

// 테트로미노 정의 (회전 0 상태)
const PIECES = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    className: "piece-i",
  },
  O: {
    shape: [
      [1, 1],
      [1, 1],
    ],
    className: "piece-o",
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
    ],
    className: "piece-t",
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
    ],
    className: "piece-s",
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
    ],
    className: "piece-z",
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
    ],
    className: "piece-j",
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
    ],
    className: "piece-l",
  },
};

const PIECE_TYPES = Object.keys(PIECES);

// DOM 요소
const boardElement = document.getElementById("board");
const scoreElement = document.getElementById("score");
const gameStatusElement = document.getElementById("game-status");
const startButton = document.getElementById("start-btn");
const restartButton = document.getElementById("restart-btn");

// 2차원 배열: 0 = 빈 칸, 문자열 = 블록 종류 (I, O, T, S, Z, J, L)
let board = createEmptyBoard();
let currentPiece = null;
let score = 0;
let dropTimerId = null;
let isPlaying = false;
let isGameOver = false;

function createEmptyBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

function createPiece(type) {
  const pieceType = type ?? PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
  const { shape, className } = PIECES[pieceType];

  return {
    type: pieceType,
    shape: shape.map((row) => [...row]),
    className,
    x: Math.floor((COLS - shape[0].length) / 2),
    y: 0,
  };
}

function rotateShape(shape) {
  const rows = shape.length;
  const cols = shape[0].length;
  const rotated = Array.from({ length: cols }, () => Array(rows).fill(0));

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      rotated[col][rows - 1 - row] = shape[row][col];
    }
  }

  return rotated;
}

function canMove(piece, dx, dy, matrix, shape = piece.shape) {
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (!shape[row][col]) {
        continue;
      }

      const boardRow = piece.y + dy + row;
      const boardCol = piece.x + dx + col;

      if (boardCol < 0 || boardCol >= COLS) {
        return false;
      }

      if (boardRow >= ROWS) {
        return false;
      }

      if (boardRow >= 0 && matrix[boardRow][boardCol] !== 0) {
        return false;
      }
    }
  }

  return true;
}

function tryMove(dx, dy) {
  if (!currentPiece || !isPlaying || isGameOver) {
    return false;
  }

  if (!canMove(currentPiece, dx, dy, board)) {
    return false;
  }

  currentPiece.x += dx;
  currentPiece.y += dy;
  renderBoard();
  return true;
}

function tryRotate() {
  if (!currentPiece || !isPlaying || isGameOver) {
    return false;
  }

  const rotatedShape = rotateShape(currentPiece.shape);

  if (!canMove(currentPiece, 0, 0, board, rotatedShape)) {
    return false;
  }

  currentPiece.shape = rotatedShape;
  renderBoard();
  return true;
}

function hardDrop() {
  if (!currentPiece || !isPlaying || isGameOver) {
    return;
  }

  while (canMove(currentPiece, 0, 1, board)) {
    currentPiece.y += 1;
  }

  settlePiece();
  renderBoard();
}

function lockPiece(piece) {
  for (let row = 0; row < piece.shape.length; row++) {
    for (let col = 0; col < piece.shape[row].length; col++) {
      if (!piece.shape[row][col]) {
        continue;
      }

      const boardRow = piece.y + row;
      const boardCol = piece.x + col;

      if (
        boardRow >= 0 &&
        boardRow < ROWS &&
        boardCol >= 0 &&
        boardCol < COLS
      ) {
        board[boardRow][boardCol] = piece.type;
      }
    }
  }
}

function clearLines() {
  let linesCleared = 0;

  for (let row = ROWS - 1; row >= 0; row--) {
    if (!board[row].every((cell) => cell !== 0)) {
      continue;
    }

    board.splice(row, 1);
    board.unshift(Array(COLS).fill(0));
    linesCleared += 1;
    row += 1;
  }

  return linesCleared;
}

function addScore(linesCleared) {
  score += LINE_SCORES[linesCleared] ?? linesCleared * 100;
}

function settlePiece() {
  if (!currentPiece) {
    return;
  }

  lockPiece(currentPiece);

  const linesCleared = clearLines();
  if (linesCleared > 0) {
    addScore(linesCleared);
    renderScore();
  }

  spawnPiece();
  renderGameStatus();
}

function spawnPiece() {
  currentPiece = createPiece();

  if (!canMove(currentPiece, 0, 0, board)) {
    triggerGameOver();
  }
}

function triggerGameOver() {
  isGameOver = true;
  currentPiece = null;
  stopGame();
  renderGameStatus();
}

function tick() {
  if (!currentPiece || isGameOver) {
    return;
  }

  if (canMove(currentPiece, 0, 1, board)) {
    currentPiece.y += 1;
  } else {
    settlePiece();
  }

  renderBoard();
}

function drawPiece(baseBoard, piece) {
  const display = baseBoard.map((row) => [...row]);

  for (let row = 0; row < piece.shape.length; row++) {
    for (let col = 0; col < piece.shape[row].length; col++) {
      if (!piece.shape[row][col]) {
        continue;
      }

      const boardRow = piece.y + row;
      const boardCol = piece.x + col;

      if (
        boardRow >= 0 &&
        boardRow < ROWS &&
        boardCol >= 0 &&
        boardCol < COLS
      ) {
        display[boardRow][boardCol] = piece.type;
      }
    }
  }

  return display;
}

function renderBoard() {
  boardElement.innerHTML = "";

  const display = currentPiece ? drawPiece(board, currentPiece) : board;

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const cell = document.createElement("div");
      cell.className = "cell";

      const value = display[row][col];
      if (value !== 0) {
        cell.classList.add("filled", PIECES[value].className);
      }

      boardElement.appendChild(cell);
    }
  }
}

function renderScore() {
  scoreElement.textContent = String(score);
}

function renderGameStatus() {
  if (isGameOver) {
    gameStatusElement.textContent = "게임 오버";
    gameStatusElement.hidden = false;
    boardElement.classList.add("board--game-over");
    return;
  }

  gameStatusElement.textContent = "";
  gameStatusElement.hidden = true;
  boardElement.classList.remove("board--game-over");
}

function stopDropTimer() {
  if (dropTimerId !== null) {
    clearInterval(dropTimerId);
    dropTimerId = null;
  }
}

function startDropTimer() {
  stopDropTimer();
  dropTimerId = setInterval(tick, DROP_INTERVAL_MS);
}

function stopGame() {
  isPlaying = false;
  stopDropTimer();
}

function resetGame() {
  stopGame();
  isGameOver = false;
  board = createEmptyBoard();
  currentPiece = createPiece();
  score = 0;
  renderBoard();
  renderScore();
  renderGameStatus();
}

function startGame() {
  if (isPlaying) {
    return;
  }

  if (isGameOver || !currentPiece) {
    resetGame();
  }

  isPlaying = true;
  startDropTimer();
  blurControls();
  focusBoard();
}

function restartGame() {
  resetGame();
  startGame();
}

function focusBoard() {
  boardElement.focus({ preventScroll: true });
}

function blurControls() {
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
}

function isGameKey(event) {
  return (
    event.code === "ArrowLeft" ||
    event.code === "ArrowRight" ||
    event.code === "ArrowDown" ||
    event.code === "ArrowUp" ||
    event.code === "Space" ||
    event.key === "ArrowLeft" ||
    event.key === "ArrowRight" ||
    event.key === "ArrowDown" ||
    event.key === "ArrowUp" ||
    event.key === " "
  );
}

function handleKeyDown(event) {
  if (!isGameKey(event)) {
    return;
  }

  if (!isPlaying || !currentPiece || isGameOver) {
    return;
  }

  event.preventDefault();

  switch (event.code) {
    case "ArrowLeft":
      tryMove(-1, 0);
      break;
    case "ArrowRight":
      tryMove(1, 0);
      break;
    case "ArrowDown":
      tryMove(0, 1);
      break;
    case "ArrowUp":
      tryRotate();
      break;
    case "Space":
      hardDrop();
      break;
    default:
      switch (event.key) {
        case "ArrowLeft":
          tryMove(-1, 0);
          break;
        case "ArrowRight":
          tryMove(1, 0);
          break;
        case "ArrowDown":
          tryMove(0, 1);
          break;
        case "ArrowUp":
          tryRotate();
          break;
        case " ":
          hardDrop();
          break;
        default:
          break;
      }
      break;
  }
}

function bindKeyboard() {
  window.removeEventListener("keydown", handleKeyDown, true);
  window.addEventListener("keydown", handleKeyDown, true);
}

startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", restartGame);
boardElement.addEventListener("pointerdown", focusBoard);
bindKeyboard();

// 초기 화면: 보드 위쪽에 블록 하나 표시 (낙하는 시작 버튼 후)
resetGame();
