const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 360;
canvas.height = 640;

let player = {
  x: 160,
  y: 500,
  width: 40,
  height: 40,
  color: "#ff5722",
  velocityY: 0,
  gravity: 0.6,
  jumpPower: -12,
  superJumpPower: -18, // mola
  speed: 5
};

let platforms = [];
let rocks = [];
let score = 0;
let gameOver = false;
let keys = { left: false, right: false, jump: false };
let phase = 0;

// Cores do cenário para cada fase
const backgrounds = [
  "#e0f7fa", // Fase 0
  "#ffe0b2", // Fase 1
  "#d1c4e9", // Fase 2
  "#c8e6c9", // Fase 3
  "#ffccbc"  // Fase 4
];

// Configuração de dificuldade por fase
const difficulties = [
  { rockSpeed: 4, platformSpeed: 2, gravity: 0.6 },
  { rockSpeed: 5, platformSpeed: 3, gravity: 0.7 },
  { rockSpeed: 6, platformSpeed: 3.5, gravity: 0.75 },
  { rockSpeed: 7, platformSpeed: 4, gravity: 0.8 },
  { rockSpeed: 8, platformSpeed: 5, gravity: 0.9 }
];

// Criar plataformas iniciais
function initPlatforms() {
  platforms = [];
  for (let i = 0; i < 8; i++) {
    let x = Math.random() * (canvas.width - 60);
    let y = i * 80;
    platforms.push({
      x,
      y,
      width: 60,
      height: 15,
      type: "normal", // normal, moving, temporary, spring
      disappearTimer: 0,
      direction: Math.random() < 0.5 ? 1 : -1
    });
  }
}
initPlatforms();

// Teclado
document.addEventListener("keydown", e => {
  if (e.key === "ArrowLeft" || e.key === "a") keys.left = true;
  if (e.key === "ArrowRight" || e.key === "d") keys.right = true;
  if (e.key === "ArrowUp" || e.key === "w" || e.key === " ") keys.jump = true;
});
document.addEventListener("keyup", e => {
  if (e.key === "ArrowLeft" || e.key === "a") keys.left = false;
  if (e.key === "ArrowRight" || e.key === "d") keys.right = false;
  if (e.key === "ArrowUp" || e.key === "w" || e.key === " ") keys.jump = false;
});

// Botões mobile
document.getElementById("leftBtn").addEventListener("touchstart", () => keys.left = true);
document.getElementById("leftBtn").addEventListener("touchend", () => keys.left = false);
document.getElementById("rightBtn").addEventListener("touchstart", () => keys.right = true);
document.getElementById("rightBtn").addEventListener("touchend", () => keys.right = false);
document.getElementById("jumpBtn").addEventListener("touchstart", () => keys.jump = true);
document.getElementById("jumpBtn").addEventListener("touchend", () => keys.jump = false);

// Resetar jogo
function resetGame() {
  player.x = 160;
  player.y = 500;
  player.velocityY = 0;
  score = 0;
  gameOver = false;
  rocks = [];
  phase = 0;
  player.gravity = difficulties[0].gravity;
  initPlatforms();
}

// Desenhar jogador
function drawPlayer() {
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.width, player.height);
}

// Desenhar plataformas
function drawPlatforms() {
  platforms.forEach(p => {
    if (p.type === "normal") ctx.fillStyle = "#4caf50";
    else if (p.type === "moving") ctx.fillStyle = "#2196f3";
    else if (p.type === "temporary") ctx.fillStyle = "#ff9800";
    else if (p.type === "spring") ctx.fillStyle = "#9c27b0";

    if (!(p.type === "temporary" && p.disappearTimer > 0)) {
      ctx.fillRect(p.x, p.y, p.width, p.height);
      if (p.type === "spring") {
        ctx.fillStyle = "#fff";
        ctx.fillRect(p.x + 20, p.y - 10, 20, 10); // mola
      }
    }
  });
}

// Desenhar pedras
function drawRocks() {
  ctx.fillStyle = "#555";
  rocks.forEach(r => {
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.size, 0, Math.PI * 2);
    ctx.fill();
  });
}

// Atualizar jogador
function updatePlayer() {
  if (keys.left) player.x -= player.speed;
  if (keys.right) player.x += player.speed;

  player.velocityY += player.gravity;
  player.y += player.velocityY;

  // Colisão com plataformas
  platforms.forEach(p => {
    if (
      player.x < p.x + p.width &&
      player.x + player.width > p.x &&
      player.y + player.height > p.y &&
      player.y + player.height < p.y + 20 &&
      player.velocityY > 0
    ) {
      if (!(p.type === "temporary" && p.disappearTimer > 0)) {
        player.y = p.y - player.height;
        player.velocityY = 0;

        if (keys.jump) {
          if (p.type === "spring") {
            player.velocityY = player.superJumpPower; // mola
          } else {
            player.velocityY = player.jumpPower;
          }
          keys.jump = false;
        }

        if (p.type === "temporary") {
          p.disappearTimer = 300; // 5s (60fps)
        }
      }
    }
  });

  // Limites
  if (player.x < 0) player.x = 0;
  if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
  if (player.y > canvas.height) gameOver = true;
}

// Atualizar plataformas
function updatePlatforms() {
  if (player.y < canvas.height / 2) {
    let diff = canvas.height / 2 - player.y;
    player.y = canvas.height / 2;

    platforms.forEach(p => p.y += diff);
    rocks.forEach(r => r.y += diff);

    score += Math.floor(diff);
  }

  // Atualizar plataformas
  platforms.forEach(p => {
    if (p.type === "moving") {
      p.x += p.direction * difficulties[phase].platformSpeed;
      if (p.x <= 0 || p.x + p.width >= canvas.width) p.direction *= -1;
    }
    if (p.type === "temporary" && p.disappearTimer > 0) {
      p.disappearTimer--;
    }
  });

  // Remover plataformas fora da tela
  platforms = platforms.filter(p => p.y < canvas.height);

  // Criar novas
  while (platforms.length < 8) {
    let x = Math.random() * (canvas.width - 60);
    let y = platforms[0].y - 80;

    let type = "normal";
    let rand = Math.random();
    if (rand < 0.1) type = "moving";
    else if (rand < 0.2) type = "temporary";
    else if (rand < 0.25) type = "spring";

    platforms.unshift({
      x,
      y,
      width: 60,
      height: 15,
      type,
      disappearTimer: 0,
      direction: Math.random() < 0.5 ? 1 : -1
    });
  }
}

// Atualizar pedras
function updateRocks() {
  if (score > 350 && Math.random() < 0.02) {
    let x = Math.random() * canvas.width;
    rocks.push({ x, y: -20, size: 15, speed: difficulties[phase].rockSpeed });
  }

  rocks.forEach(r => {
    r.y += r.speed;
    // colisão com jogador
    if (
      player.x < r.x + r.size &&
      player.x + player.width > r.x - r.size &&
      player.y < r.y + r.size &&
      player.y + player.height > r.y - r.size
    ) {
      gameOver = true;
    }
  });

  rocks = rocks.filter(r => r.y < canvas.height);
}

// Checar fase
function updatePhase() {
  let newPhase = Math.floor(score / 500);
  if (newPhase !== phase && newPhase < difficulties.length) {
    phase = newPhase;
    player.gravity = difficulties[phase].gravity;
  }
}

// Score
function drawScore() {
  ctx.fillStyle = "#000";
  ctx.font = "20px Arial";
  ctx.fillText("Altura: " + score, 10, 30);
  ctx.fillText("Fase: " + (phase + 1), 260, 30);
}

// Loop principal
function gameLoop() {
  ctx.fillStyle = backgrounds[phase];
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (!gameOver) {
    updatePlayer();
    updatePlatforms();
    updateRocks();
    updatePhase();

    drawPlayer();
    drawPlatforms();
    drawRocks();
    drawScore();

    requestAnimationFrame(gameLoop);
  } else {
    ctx.fillStyle = "#000";
    ctx.font = "30px Arial";
    ctx.fillText("Game Over", 100, canvas.height / 2);
    ctx.font = "20px Arial";
    ctx.fillText("Toque ou pressione para reiniciar", 40, canvas.height / 2 + 40);
  }
}

// Reinício
canvas.addEventListener("click", () => { if (gameOver) { resetGame(); gameLoop(); }});
canvas.addEventListener("touchstart", () => { if (gameOver) { resetGame(); gameLoop(); }});
document.addEventListener("keydown", () => { if (gameOver) { resetGame(); gameLoop(); }});

gameLoop();
