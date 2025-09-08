const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 360;
canvas.height = 640;

let player, platforms = [], score = 0, bestScore = 0;
let gameOver = false, gameStarted = false, paused = false;
let cameraY = 0;
let sensitivity = 4;
let difficulty = "normal";

// Botões
const restartBtn = document.getElementById("restartBtn");
const startBtn = document.getElementById("startBtn");
const menuDiv = document.getElementById("menu");
const pauseMenu = document.getElementById("pauseMenu");
const resumeBtn = document.getElementById("resumeBtn");
const menuBtn = document.getElementById("menuBtn");
const sensInput = document.getElementById("sensitivity");
const diffSelect = document.getElementById("difficulty");

const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");
const pauseBtn = document.getElementById("pauseBtn");

// PC controles
let keys = { left: false, right: false };
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft" || e.key === "a") keys.left = true;
  if (e.key === "ArrowRight" || e.key === "d") keys.right = true;
  if (e.key === "Escape" && gameStarted && !gameOver) togglePause();
});
document.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft" || e.key === "a") keys.left = false;
  if (e.key === "ArrowRight" || e.key === "d") keys.right = false;
});

// Mobile controles
leftBtn.addEventListener("touchstart", () => keys.left = true);
leftBtn.addEventListener("touchend", () => keys.left = false);
rightBtn.addEventListener("touchstart", () => keys.right = true);
rightBtn.addEventListener("touchend", () => keys.right = false);
pauseBtn.addEventListener("touchstart", togglePause);

function isMobile() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

// Configs de dificuldade
function getDifficultySettings() {
  switch (difficulty) {
    case "easy": return { gravity: 0.3, jump: -11 };
    case "hard": return { gravity: 0.6, jump: -9 };
    default: return { gravity: 0.4, jump: -10 };
  }
}

// Criar player
function createPlayer(x, y) {
  let d = getDifficultySettings();
  return { x, y, width: 40, height: 40, color: "#ff5722", velocityY: 0, gravity: d.gravity, jumpPower: d.jump, lastPlatform: null };
}

// Criar plataforma
function createPlatform(x, y, type = "normal") {
  let hasSpring = Math.random() < 0.2; // 20% chance de mola
  return { x, y, width: 70, height: 15, type, dx: type === "moving" ? 2 : 0, hasSpring, visible: true, blinkTimer: 0 };
}

// Resetar jogo
function resetGame() {
  const baseY = canvas.height - 80;
  platforms = [];
  let p0 = createPlatform(canvas.width / 2 - 35, baseY, "normal");
  p0.hasSpring = false;
  platforms.push(p0);
  player = createPlayer(p0.x + (p0.width - 40) / 2, p0.y - 40);
  score = 0;
  cameraY = 0;
  gameOver = false;

  for (let i = 1; i < 10; i++) {
    let px = Math.random() * (canvas.width - 70);
    let py = baseY - i * 80;
    let types = ["normal", "moving"];
    if (score >= 2500) types.push("cloud");
    let type = types[Math.floor(Math.random() * types.length)];
    platforms.push(createPlatform(px, py, type));
  }
  restartBtn.classList.add("hidden");
}

// Player update
function updatePlayer() {
  if (keys.left) player.x -= sensitivity;
  if (keys.right) player.x += sensitivity;

  if (player.x + player.width < 0) player.x = canvas.width;
  if (player.x > canvas.width) player.x = -player.width;

  player.velocityY += player.gravity;
  player.y += player.velocityY;

  platforms.forEach((p) => {
    if (!p.visible) return;
    if ( player.x < p.x + p.width &&
         player.x + player.width > p.x &&
         player.y + player.height > p.y &&
         player.y + player.height < p.y + p.height + 10 &&
         player.velocityY > 0 ) {
      if (p.hasSpring) {
        player.velocityY = -18;
        score += 2; // bônus de mola
      } else {
        player.velocityY = player.jumpPower;
        score++;
      }
      player.lastPlatform = p;

      if (p.type === "cloud") {
        p.visible = false;
        setTimeout(() => p.visible = true, 1500);
      }
    }
  });

  if (player.y - cameraY > canvas.height) {
    gameOver = true;
    restartBtn.classList.remove("hidden");
  }

  if (player.y < canvas.height / 2 - cameraY) {
    cameraY = player.y - canvas.height / 2;
  }
}

// Plataformas update
function updatePlatforms() {
  platforms.forEach((p) => {
    if (p.type === "moving") {
      p.x += p.dx;
      if (p.x <= 0 || p.x + p.width >= canvas.width) p.dx *= -1;
    }
  });
  platforms = platforms.filter((p) => p.y - cameraY < canvas.height + 100);

  while (platforms.length < 12) {
    let px = Math.random() * (canvas.width - 70);
    let py = platforms[platforms.length - 1].y - 80;
    let types = ["normal", "moving"];
    if (score >= 2500) types.push("cloud");
    let type = types[Math.floor(Math.random() * types.length)];
    platforms.push(createPlatform(px, py, type));
  }
}

// Desenhar
function draw() {
  ctx.fillStyle = "#87ceeb";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y - cameraY, player.width, player.height);

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

  ctx.fillStyle = "#000";
  ctx.font = "20px Arial";
  ctx.fillText("Score: " + score, 10, 30);
}

// Loop principal
function gameLoop() {
  if (gameStarted && !paused && !gameOver) {
    updatePlayer();
    updatePlatforms();
  }
  draw();
  requestAnimationFrame(gameLoop);
}

// Funções de pause
function togglePause() {
  paused = !paused;
  pauseMenu.classList.toggle("hidden", !paused);
}

// Eventos
restartBtn.addEventListener("click", () => {
  resetGame();
});
startBtn.addEventListener("click", () => {
  menuDiv.style.display = "none";
  gameStarted = true;
  resetGame();
});
resumeBtn.addEventListener("click", togglePause);
menuBtn.addEventListener("click", () => location.reload());
sensInput.addEventListener("input", (e) => sensitivity = +e.target.value);
diffSelect.addEventListener("change", (e) => {
  difficulty = e.target.value;
  let d = getDifficultySettings();
  player.gravity = d.gravity;
  player.jumpPower = d.jump;
});

// Mostrar controles no celular
if (isMobile()) {
  document.getElementById("controls").style.display = "flex";
  document.getElementById("pauseBtn").style.display = "block";
  document.body.requestFullscreen?.();
}

gameLoop();
