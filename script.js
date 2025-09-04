// --- Canvas e contexto ---
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// --- Variáveis globais ---
let player, platforms, springs;
let gameStarted = false;
let gameOver = false;
let isPaused = false;
let score = 0;
let sensitivity = 4;
let difficulty = "normal";

const keys = { left: false, right: false };

// --- Eventos teclado ---
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft" || e.key === "a") keys.left = true;
  if (e.key === "ArrowRight" || e.key === "d") keys.right = true;
  if (e.key === "Escape") togglePause();
});
document.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft" || e.key === "a") keys.left = false;
  if (e.key === "ArrowRight" || e.key === "d") keys.right = false;
});

// --- Controles mobile ---
document.getElementById("leftBtn").addEventListener("touchstart", () => keys.left = true);
document.getElementById("leftBtn").addEventListener("touchend", () => keys.left = false);
document.getElementById("rightBtn").addEventListener("touchstart", () => keys.right = true);
document.getElementById("rightBtn").addEventListener("touchend", () => keys.right = false);

// --- Pause ---
document.getElementById("pauseBtn").addEventListener("click", togglePause);
function togglePause() {
  if (!isPaused) {
    isPaused = true;
    document.getElementById("pauseMenu").style.display = "flex";
  } else {
    resumeGame();
  }
}
function resumeGame() {
  isPaused = false;
  document.getElementById("pauseMenu").style.display = "none";
  gameLoop();
}

// --- Fullscreen ---
document.getElementById("fullscreenBtn").addEventListener("click", () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
});

// --- Sensibilidade e dificuldade ---
document.getElementById("sensitivity").addEventListener("input", (e) => {
  sensitivity = parseInt(e.target.value);
});
document.getElementById("difficulty").addEventListener("change", (e) => {
  difficulty = e.target.value;
});

// --- Jogador ---
function createPlayer() {
  return {
    x: canvas.width / 2 - 20,
    y: canvas.height - 60,
    width: 40,
    height: 40,
    dy: 0,
    gravity: 0.3,
    jumpPower: -10,
    color: "red"
  };
}

// --- Plataformas ---
function createPlatforms() {
  const arr = [];
  const platformCount = 8;
  const spacing = canvas.height / platformCount;

  for (let i = 0; i < platformCount; i++) {
    let x = Math.random() * (canvas.width - 70);
    let y = canvas.height - i * spacing - 20;
    let hasSpring = Math.random() < 0.3; // 30% chance de ter mola
    arr.push({ x, y, width: 70, height: 15, hasSpring });
  }

  // Garante que a primeira plataforma está embaixo do player
  arr[0] = {
    x: canvas.width / 2 - 35,
    y: canvas.height - 30,
    width: 70,
    height: 15,
    hasSpring: false
  };

  return arr;
}

// --- Molas ---
function createSpring(x, y) {
  return { x, y: y - 10, width: 20, height: 20 };
}

// --- Inicialização ---
function init() {
  player = createPlayer();
  platforms = createPlatforms();
  springs = platforms.filter(p => p.hasSpring).map(p =>
    createSpring(p.x + p.width / 2 - 10, p.y)
  );
  score = 0;
  gameOver = false;
}

// --- Desenho ---
function drawPlayer() {
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.width, player.height);
}

function drawPlatforms() {
  ctx.fillStyle = "green";
  platforms.forEach(p => {
    ctx.fillRect(p.x, p.y, p.width, p.height);
  });
}

function drawSprings() {
  ctx.fillStyle = "blue";
  springs.forEach(s => {
    ctx.fillRect(s.x, s.y, s.width, s.height);
  });
}

function drawScore() {
  document.getElementById("ui").innerText = `Score: ${score}`;
}

// --- Update jogador ---
function updatePlayer() {
  if (keys.left) player.x -= sensitivity;
  if (keys.right) player.x += sensitivity;

  player.dy += player.gravity;
  player.y += player.dy;

  if (player.x < 0) player.x = 0;
  if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

  // Colisão com plataformas
  platforms.forEach(p => {
    if (
      player.x + player.width > p.x &&
      player.x < p.x + p.width &&
      player.y + player.height >= p.y &&
      player.y + player.height <= p.y + p.height &&
      player.dy >= 0
    ) {
      player.dy = player.jumpPower;
    }
  });

  // Colisão com molas (pulo mais alto)
  springs.forEach(s => {
    if (
      player.x + player.width > s.x &&
      player.x < s.x + s.width &&
      player.y + player.height >= s.y &&
      player.y + player.height <= s.y + s.height &&
      player.dy >= 0
    ) {
      player.dy = player.jumpPower * 1.5;
    }
  });

  if (player.y > canvas.height) {
    gameOver = true;
  }
}

// --- Update plataformas ---
function updatePlatforms() {
  platforms.forEach(p => {
    p.y += 2;
    if (p.y > canvas.height) {
      p.y = -20;
      p.x = Math.random() * (canvas.width - p.width);
      p.hasSpring = Math.random() < 0.3;
      if (p.hasSpring) {
        springs.push(createSpring(p.x + p.width / 2 - 10, p.y));
      }
      score++;
    }
  });
  springs = springs.filter(s => s.y <= canvas.height);
  springs.forEach(s => (s.y += 2));
}

// --- Loop principal ---
function gameLoop() {
  if (isPaused) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (gameStarted) {
    if (!gameOver) {
      updatePlayer();
      updatePlatforms();
      drawPlayer();
      drawPlatforms();
      drawSprings();
      drawScore();
      requestAnimationFrame(gameLoop);
    } else {
      ctx.fillStyle = "#000";
      ctx.font = "30px Arial";
      ctx.fillText("Game Over", canvas.width / 2 - 80, canvas.height / 2);
    }
  }
}

// --- Start ---
function startGame() {
  document.getElementById("menu").style.display = "none";
  init();
  gameStarted = true;
  gameLoop();
}
