const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 360;
canvas.height = 640;

// 🎵 Sons com Web Audio API
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(freq, duration = 0.2) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.frequency.value = freq;
  osc.type = "square";
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

// Player
let player = {
  x: canvas.width / 2 - 20,
  y: canvas.height - 80,
  width: 40,
  height: 40,
  color: "#ff5722",
  velocityY: 0,
  gravity: 0.4,
  jumpPower: -10,
  sensitivity: 4,
};

let platforms = [];
let score = 0;
let highScore = 0;
let gameOver = false;
let cameraY = 0;
let paused = false;

// Estados de tela
let currentScreen = "menu"; // menu | game | pause | options | hud

// Controles
let keys = { left: false, right: false };

// --- EVENTOS ---
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft" || e.key === "a") keys.left = true;
  if (e.key === "ArrowRight" || e.key === "d") keys.right = true;

  if (e.key === "Escape" && currentScreen === "game") togglePause();
});

document.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft" || e.key === "a") keys.left = false;
  if (e.key === "ArrowRight" || e.key === "d") keys.right = false;
});

// Botões
const startBtn = document.getElementById("startBtn");
const optionsBtn = document.getElementById("optionsBtn");
const pauseBtn = document.getElementById("pauseBtn");
const pauseMenu = document.getElementById("pauseMenu");
const resumeBtn = document.getElementById("resumeBtn");
const settingsBtn = document.getElementById("settingsBtn");
const hudBtn = document.getElementById("hudBtn");
const menuBtn = document.getElementById("menuBtn");
const optionsMenu = document.getElementById("optionsMenu");
const backPause = document.getElementById("backPause");
const hudMenu = document.getElementById("hudMenu");
const backHud = document.getElementById("backHud");
const difficultySelect = document.getElementById("difficultySelect");
const sensitivityInput = document.getElementById("sensitivity");

// Mobile
const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");
const mobileControls = document.getElementById("mobileControls");
const btnSizeInput = document.getElementById("btnSize");
const btnOpacityInput = document.getElementById("btnOpacity");

// --- NAVEGAÇÃO ENTRE TELAS ---
startBtn.onclick = () => {
  document.getElementById("startScreen").style.display = "none";
  canvas.style.display = "block";
  pauseBtn.style.display = "block";
  currentScreen = "game";
  resetGame();
  gameLoop();
};
optionsBtn.onclick = () => {
  document.getElementById("startScreen").style.display = "none";
  optionsMenu.style.display = "block";
  currentScreen = "options";
};
resumeBtn.onclick = () => togglePause(false);
settingsBtn.onclick = () => {
  pauseMenu.style.display = "none";
  optionsMenu.style.display = "block";
  currentScreen = "options";
};
hudBtn.onclick = () => {
  pauseMenu.style.display = "none";
  hudMenu.style.display = "block";
  currentScreen = "hud";
};
menuBtn.onclick = () => {
  pauseMenu.style.display = "none";
  document.getElementById("startScreen").style.display = "flex";
  canvas.style.display = "none";
  pauseBtn.style.display = "none";
  currentScreen = "menu";
};
backPause.onclick = () => {
  optionsMenu.style.display = "none";
  pauseMenu.style.display = "block";
  currentScreen = "pause";
};
backHud.onclick = () => {
  hudMenu.style.display = "none";
  pauseMenu.style.display = "block";
  currentScreen = "pause";
};

// --- PAUSE ---
pauseBtn.onclick = () => togglePause();
function togglePause(force = null) {
  if (force !== null) paused = !force;
  paused = !paused;
  if (paused) {
    pauseMenu.style.display = "block";
    currentScreen = "pause";
  } else {
    pauseMenu.style.display = "none";
    currentScreen = "game";
    requestAnimationFrame(gameLoop);
  }
}

// --- HUD Ajustável ---
btnSizeInput.oninput = () => {
  document.querySelectorAll("#mobileControls button").forEach((btn) => {
    btn.style.width = btnSizeInput.value + "px";
    btn.style.height = btnSizeInput.value + "px";
    btn.style.fontSize = btnSizeInput.value / 2 + "px";
  });
};
btnOpacityInput.oninput = () => {
  document.querySelectorAll("#mobileControls button").forEach((btn) => {
    btn.style.opacity = btnOpacityInput.value;
  });
};

// --- CONTROLES MOBILE ---
leftBtn.addEventListener("touchstart", () => (keys.left = true));
leftBtn.addEventListener("touchend", () => (keys.left = false));
rightBtn.addEventListener("touchstart", () => (keys.right = true));
rightBtn.addEventListener("touchend", () => (keys.right = false));

// --- PLATAFORMAS ---
function createPlatform(x, y, type = "normal") {
  return {
    x,
    y,
    width: 70,
    height: 15,
    type,
    dx: type === "moving" ? 2 : 0,
    timer: type === "temporary" ? 100 : null,
    hasSpring: Math.random() < 0.2 && type !== "temporary",
    cloudTimer: type === "cloud" ? 0 : null,
    visible: true,
  };
}

function resetGame() {
  player.x = canvas.width / 2 - 20;
  player.y = canvas.height - 80;
  player.velocityY = 0;
  score = 0;
  gameOver = false;
  cameraY = 0;
  platforms = [];

  // Plataforma inicial
  platforms.push(createPlatform(canvas.width / 2 - 35, canvas.height - 40, "normal"));

  // Algumas iniciais
  for (let i = 1; i < 7; i++) {
    let px = Math.random() * (canvas.width - 70);
    let py = canvas.height - i * 100;
    let types = ["normal", "moving"];
    let type = types[Math.floor(Math.random() * types.length)];
    platforms.push(createPlatform(px, py, type));
  }
}

// --- UPDATE PLAYER ---
function updatePlayer() {
  if (keys.left) player.x -= player.sensitivity;
  if (keys.right) player.x += player.sensitivity;

  // Wrap
  if (player.x + player.width < 0) player.x = canvas.width;
  if (player.x > canvas.width) player.x = -player.width;

  player.velocityY += player.gravity;
  player.y += player.velocityY;

  // Colisão
  platforms.forEach((p) => {
    if (!p.visible) return;
    if (
      player.x < p.x + p.width &&
      player.x + player.width > p.x &&
      player.y + player.height > p.y &&
      player.y + player.height < p.y + p.height + 10 &&
      player.velocityY > 0
    ) {
      if (p.type === "temporary") {
        p.visible = false;
      }
      if (p.type === "cloud") {
        p.cloudTimer = 60; // ~1s animação antes de sumir
      }
      player.velocityY = player.jumpPower;
      playSound(400);
      score++;
      if (p.hasSpring) {
        player.velocityY = -18;
        playSound(700);
      }
    }
  });

  if (player.y - cameraY > canvas.height) {
    gameOver = true;
    playSound(100);
  }

  if (player.y < canvas.height / 2 - cameraY) {
    cameraY = player.y - canvas.height / 2;
  }
}

// --- UPDATE PLATFORMS ---
function updatePlatforms() {
  platforms.forEach((p) => {
    if (p.type === "moving") {
      p.x += p.dx;
      if (p.x <= 0 || p.x + p.width >= canvas.width) {
        p.dx *= -1;
      }
    }
    if (p.type === "cloud" && p.cloudTimer > 0) {
      p.cloudTimer--;
      if (p.cloudTimer === 0) {
        p.visible = false;
        setTimeout(() => {
          p.visible = true;
        }, 3000);
      }
    }
  });

  platforms = platforms.filter((p) => p.y - cameraY < canvas.height + 100);

  while (platforms.length < 10) {
    let px = Math.random() * (canvas.width - 70);
    let py = platforms[platforms.length - 1].y - 80;
    let types = ["normal", "moving", "temporary"];
    if (score > 150) types.push("cloud");
    let type = types[Math.floor(Math.random() * types.length)];
    platforms.push(createPlatform(px, py, type));
  }
}

// --- DRAW ---
function drawPlayer() {
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y - cameraY, player.width, player.height);
}
function drawPlatforms() {
  platforms.forEach((p) => {
    if (!p.visible) return;
    if (p.type === "normal") ctx.fillStyle = "#4caf50";
    if (p.type === "moving") ctx.fillStyle = "#2196f3";
    if (p.type === "temporary") ctx.fillStyle = "#ff9800";
    if (p.type === "cloud") ctx.fillStyle = "#fff";

    ctx.fillRect(p.x, p.y - cameraY, p.width, p.height);

    if (p.hasSpring) {
      ctx.fillStyle = "#000";
      ctx.fillRect(p.x + p.width / 2 - 5, p.y - 10 - cameraY, 10, 10);
    }
  });
}
function drawScore() {
  ctx.fillStyle = "#000";
  ctx.font = "20px Arial";
  ctx.fillText("Score: " + score, 10, 30);
}

// --- GAME LOOP ---
function gameLoop() {
  if (paused) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!gameOver) {
    updatePlayer();
    updatePlatforms();

    drawPlayer();
    drawPlatforms();
    drawScore();

    requestAnimationFrame(gameLoop);
  } else {
    ctx.fillStyle = "#000";
    ctx.font = "30px Arial";
    ctx.fillText("Game Over", canvas.width / 2 - 80, canvas.height / 2);
    pauseBtn.style.display = "none";
  }
}
