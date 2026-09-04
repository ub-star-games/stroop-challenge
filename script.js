const COLORS = [
  { name: "RED", value: "#ff1744" },
  { name: "BLUE", value: "#1683ff" },
  { name: "GREEN", value: "#16c96b" },
  { name: "YELLOW", value: "#ffd600" },
  { name: "PURPLE", value: "#8a2be2" },
  { name: "ORANGE", value: "#ff8c00" },
  { name: "PINK", value: "#ff2d8d" }
];

const LEVEL_TIMES = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
const TILE_COUNTS = [4, 5, 6, 7, 8, 9, 10, 11, 12, 12];

let currentLevel = 1;
let score = 0;
let timer = LEVEL_TIMES[0];
let gameActive = false;
let answered = false;
let timerId = null;
let transitionId = null;
let currentTarget = null;

const startScreen = document.querySelector("#start-screen");
const gameScreen = document.querySelector("#game-screen");
const resultsScreen = document.querySelector("#results-screen");
const tileGrid = document.querySelector("#tile-grid");
const answerGrid = document.querySelector("#answer-grid");
const feedback = document.querySelector("#feedback");
const timerBlock = document.querySelector("#timer-block");
const timerElement = document.querySelector("#timer");
const scoreElement = document.querySelector("#score");
const levelElement = document.querySelector("#level-number");
const progressBar = document.querySelector("#progress-bar");
const finalScore = document.querySelector("#final-score");
const resultMessage = document.querySelector("#result-message");
const targetInstruction = document.querySelector("#target-instruction");

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function randomColorName(inkColor) {
  const availableNames = COLORS.filter((color) => color.name !== inkColor.name);
  return availableNames[Math.floor(Math.random() * availableNames.length)];
}

function generateTile(isTarget) {
  const inkColor = COLORS[Math.floor(Math.random() * COLORS.length)];
  return {
    colorName: randomColorName(inkColor),
    inkColor,
    isTarget
  };
}

function generateLevel() {
  const tiles = Array.from({ length: TILE_COUNTS[currentLevel - 1] }, (_, index) => generateTile(index === 0));
  const randomizedTiles = shuffle(tiles);
  currentTarget = randomizedTiles.find((tile) => tile.isTarget);
  return randomizedTiles;
}

function renderTiles(tiles) {
  tileGrid.innerHTML = "";
  tiles.forEach((tile, index) => {
    const tileElement = document.createElement("div");
    tileElement.className = `tile${tile.isTarget ? " target" : ""}`;
    tileElement.style.color = tile.inkColor.value;
    tileElement.style.animationDelay = `${index * 35}ms`;
    tileElement.textContent = tile.colorName.name;
    tileElement.setAttribute("aria-label", `${tile.colorName.name} written in ${tile.inkColor.name} ink${tile.isTarget ? ", target tile" : ""}`);
    tileGrid.appendChild(tileElement);
  });
}

function renderAnswers() {
  answerGrid.innerHTML = "";
  shuffle(COLORS).forEach((color) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "answer-button";
    button.dataset.color = color.name;
    button.textContent = color.name;
    button.setAttribute("aria-label", `Choose ${color.name} ink`);
    button.addEventListener("click", () => handleAnswer(color.name, button));
    answerGrid.appendChild(button);
  });
}

function updateUI() {
  levelElement.textContent = currentLevel;
  scoreElement.textContent = String(score).padStart(2, "0");
  timerElement.textContent = timer.toFixed(1);
  progressBar.style.width = `${(currentLevel / LEVEL_TIMES.length) * 100}%`;
}

function enterFullscreen() {
  if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen().catch(() => {});
  }
}

function startGame() {
  stopTimer();
  clearTimeout(transitionId);
  currentLevel = 1;
  score = 0;
  timer = LEVEL_TIMES[0];
  gameActive = true;
  startScreen.classList.add("hidden");
  resultsScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");
  enterFullscreen();
  startLevel();
}

function startLevel() {
  stopTimer();
  answered = false;
  timer = LEVEL_TIMES[currentLevel - 1];
  feedback.textContent = "";
  feedback.className = "feedback";
  timerBlock.classList.remove("warning");
  const tiles = generateLevel();
  targetInstruction.textContent = `What color is the ink of the ${currentTarget.colorName.name} tile?`;
  renderTiles(tiles);
  renderAnswers();
  updateUI();
  startTimer();
}

function startTimer() {
  const startTime = performance.now();
  const duration = LEVEL_TIMES[currentLevel - 1] * 1000;
  timerId = window.setInterval(() => {
    if (!gameActive || answered) return;
    const elapsed = performance.now() - startTime;
    const remaining = Math.max(0, duration - elapsed);
    timer = remaining / 1000;
    timerElement.textContent = timer.toFixed(1);
    timerBlock.classList.toggle("warning", timer <= 1);
    if (remaining <= 0) handleTimeout();
  }, 50);
}

function stopTimer() {
  if (timerId !== null) {
    window.clearInterval(timerId);
    timerId = null;
  }
}

function lockAnswers() {
  answerGrid.querySelectorAll("button").forEach((button) => {
    button.disabled = true;
  });
}

function handleAnswer(selectedColor, selectedButton) {
  if (!gameActive || answered) return;
  answered = true;
  stopTimer();
  lockAnswers();
  const isCorrect = selectedColor === currentTarget.inkColor.name;
  if (isCorrect) {
    score += 10;
    selectedButton.classList.add("correct-answer");
    feedback.textContent = "Correct ink. +10 points";
    feedback.className = "feedback correct";
  } else {
    selectedButton.classList.add("wrong-answer");
    markCorrectAnswer();
    feedback.textContent = `Not quite. The ink was ${currentTarget.inkColor.name}.`;
    feedback.className = "feedback incorrect";
  }
  updateUI();
  queueNextLevel();
}

function markCorrectAnswer() {
  const correctButton = answerGrid.querySelector(`[data-color="${currentTarget.inkColor.name}"]`);
  if (correctButton) correctButton.classList.add("correct-answer");
}

function handleTimeout() {
  if (!gameActive || answered) return;
  answered = true;
  timer = 0;
  stopTimer();
  lockAnswers();
  markCorrectAnswer();
  timerElement.textContent = "0.0";
  feedback.textContent = `Time. The ink was ${currentTarget.inkColor.name}.`;
  feedback.className = "feedback timeout";
  queueNextLevel();
}

function queueNextLevel() {
  transitionId = window.setTimeout(() => {
    if (currentLevel === LEVEL_TIMES.length) {
      endGame();
      return;
    }
    currentLevel += 1;
    startLevel();
  }, 650);
}

function endGame() {
  stopTimer();
  clearTimeout(transitionId);
  gameActive = false;
  finalScore.textContent = score;
  resultMessage.textContent = getResultMessage();
  gameScreen.classList.add("hidden");
  resultsScreen.classList.remove("hidden");
}

function getResultMessage() {
  const messages = {
    100: "Perfect! Your focus is razor sharp.",
    90: "Excellent! You resisted the distraction.",
    80: "Great job! Your color sense is strong.",
    70: "Good work! Your speed is building.",
    60: "Nice effort! Keep trusting your focus.",
    50: "Halfway there! Keep practicing.",
    40: "Keep practicing! Stay with the ink.",
    30: "The words were distracting this time.",
    20: "Slow down and focus on the ink.",
    10: "Keep practicing! You can do it.",
    0: "Try again! The words are sneaky."
  };
  return messages[score];
}

document.querySelector("#start-button").addEventListener("click", startGame);
