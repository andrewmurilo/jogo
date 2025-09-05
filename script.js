const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 360;
canvas.height = 640;

let player = {
  x: canvas.width / 2 - 20,
  y: canvas.height - 150,
  width: 40,
  height: 40,
  color: "#ff5722",
  velocityY: 0,
  gravity: 0.4,
  jumpPower: -10,
  lastPlatform: null,
};

let platforms = [];
let score = 0;
let gameOver = false;
let gameStarted = false;
let paused = false;
let cameraY = 0;

// Botões e menus
const startMenu = document.getElementById("startMenu");
const pauseMenu = document.getElementById("pauseMenu");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resumeBtn = document.getElementById("resumeBtn");
const restartBtn = document.getElementById("restartBtn");
const scoreBoard = document.getElementById("scoreBoard");

startBtn.addEventListener("click", () => {
  gameStarted = true;
  startMenu.style.display = "none";
  resetGame();
  gameLoop();
});

pauseBtn.addEventListener("click", togglePause);
resumeBtn.addEventListener("click", togglePause);
restartBtn.addEventListener("click", () => {
  pauseMenu.style.display = "none";
  resetGame();
  gameLoop();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") togglePause();
});

// Controles
let keys = { left: false, right: false };

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft" || e.key === "a") keys.left = true;
  if (e.key === "ArrowRight" || e.key === "d") keys.right = true;
});

document.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft" || e.key === "a") keys.left = false;
  if (e.key === "ArrowRight" || e.key === "d") keys.right = false;
});

// Mobile controls
document.getElementById("leftBtn").addEventListener("touchstart", () => keys.left = true);
document.getElementById("leftBtn").addEventListener("touchend", () => keys.left = false);
document.getElementById("rightBtn").addEventListener("touchstart", () => keys.right = true);
document.getElementById("rightBtn").addEventListener("touchend", () => keys.right = false);

// Criar plataforma
function createPlatform(x, y, type = "normal") {
  let hasSpring = Math.random() < 0.25;
  return { x, y, width: 70, height: 15, type, dx: type === "moving" ? 2 : 0, hasSpring, visible: true, blinkTimer: 0 };
}

// Resetar jogo
function resetGame() {
  player.x = canvas.width / 2 - 20;
  player.y = canvas.height - 150;
  player.velocityY = 0;
  player.lastPlatform = null;
  score = 0;
  gameOver = false;
  cameraY = 0;

  platforms = [];
  // Plataforma inicial fixa SEMPRE
  platforms.push({ x: canvas.width / 2 - 35, y: canvas.height - 40, width: 70, height: 15, type: "normal", dx: 0, hasSpring: false, visible: true });

  for (let i = 1; i < 7; i++) {
    let px = Math.random() * (canvas.width - 70);
    let py = canvas.height - i * 100;
    let types = ["normal", "moving"];
    let type = types[Math.floor(Math.random() * types.length)];
    platforms.push(createPlatform(px, py, type));
  }
  scoreBoard.innerText = "Score: 0";
}

// Atualizar jogador
function updatePlayer() {
  if (keys.left) player.x -= 5;
  if (keys.right) player.x += 5;

  if (player.x + player.width < 0) player.x = canvas.width;
  if (player.x > canvas.width) player.x = -player.width;

  player.velocityY += player.gravity;
  player.y += player.velocityY;

  platforms.forEach((p) => {
    if (p.visible &&
      player.x < p.x + p.width &&
      player.x + player.width > p.x &&
      player.y + player.height > p.y &&
      player.y + player.height < p.y + p.height + 10 &&
      player.velocityY > 0) {

      // Pulo normal
      player.velocityY = player.jumpPower;

      // Mola dá super pulo
      if (p.hasSpring) player.velocityY = -18;

      if (player.lastPlatform !== p) {
        score++;
        scoreBoard.innerText = "Score: " + score;
        player.lastPlatform = p;
      }
    }
  });

  if (player.y - cameraY > canvas.height) gameOver = true;

  if (player.y < canvas.height / 2 - cameraY) {
    cameraY = player.y - canvas.height / 2;
  }
}

// Atualizar plataformas
function updatePlatforms() {
  platforms.forEach((p) => {
    if (p.type === "moving") {
      p.x += p.dx;
      if (p.x <= 0 || p.x + p.width >= canvas.width) p.dx *= -1;
    }
    if (p.type === "cloud") {
      p.blinkTimer++;
      if (p.blinkTimer > 120) {
        p.visible = !p.visible;
        p.blinkTimer = 0;
      }
    }
  });

  platforms = platforms.filter((p) => p.y - cameraY < canvas.height + 100);

  while (platforms.length < 10) {
    let px = Math.random() * (canvas.width - 70);
    let py = platforms[platforms.length - 1].y - 80;
    let types = score >= 2500 ? ["normal", "moving", "cloud"] : ["normal", "moving"];
    let type = types[Math.floor(Math.random() * types.length)];
    platforms.push(createPlatform(px, py, type));
  }
}

// Desenhar jogador
function drawPlayer() {
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y - cameraY, player.width, player.height);
}

// Desenhar plataformas
function drawPlatforms() {
  platforms.forEach((p) => {
    if (!p.visible) return;

    if (p.type === "normal") ctx.fillStyle = "#4caf50";
    if (p.type === "moving") ctx.fillStyle = "#2196f3";
    if (p.type === "cloud") ctx.fillStyle = "#ccc";

    ctx.fillRect(p.x, p.y - cameraY, p.width, p.height);

    if (p.hasSpring) {
      ctx.fillStyle = "#000";
      ctx.fillRect(p.x + p.width / 2 - 10, p.y - 12 - cameraY, 20, 12);
    }
  });
}

// Loop principal
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (gameStarted && !paused) {
    if (!gameOver) {
      updatePlayer();
      updatePlatforms();
      drawPlayer();
      drawPlatforms();
      requestAnimationFrame(gameLoop);
    } else {
      ctx.fillStyle = "#000";
      ctx.font = "30px Arial";
      ctx.fillText("Game Over", canvas.width / 2 - 80, canvas.height / 2);
    }
  }
}

// Toggle pause
function togglePause() {
  if (!gameStarted || gameOver) return;
  paused = !paused;
  pauseMenu.style.display = paused ? "flex" : "none";
  if (!paused) gameLoop();
}
