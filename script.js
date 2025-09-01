const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 360;
canvas.height = 640;

let player = {
  x: canvas.width / 2 - 20,
  y: canvas.height - 80,
  width: 40,
  height: 40,
  color: "#ff5722",
  velocityY: 0,
  gravity: 0.4,
  jumpPower: -10,
  lastPlatform: null, // última plataforma usada para evitar score infinito
};

let platforms = [];
let score = 0;
let gameOver = false;
let gameStarted = false;
let cameraY = 0;

// Botões
const restartBtn = document.getElementById("restartBtn");
const startBtn = document.getElementById("startBtn");

restartBtn.addEventListener("click", () => {
  resetGame();
  gameLoop();
});

startBtn.addEventListener("click", () => {
  gameStarted = true;
  startBtn.style.display = "none";
  resetGame();
  gameLoop();
});

// Controles no PC
let keys = { left: false, right: false };
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft" || e.key === "a") keys.left = true;
  if (e.key === "ArrowRight" || e.key === "d") keys.right = true;
});
document.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft" || e.key === "a") keys.left = false;
  if (e.key === "ArrowRight" || e.key === "d") keys.right = false;
});

// Controles no celular (giroscópio)
window.addEventListener("deviceorientation", (e) => {
  if (!gameStarted) return;
  if (e.gamma > 5) {
    keys.right = true;
    keys.left = false;
  } else if (e.gamma < -5) {
    keys.left = true;
    keys.right = false;
  } else {
    keys.left = false;
    keys.right = false;
  }
});

// Criar plataforma
function createPlatform(x, y, type = "normal") {
  return {
    x,
    y,
    width: 70,
    height: 15,
    type,
    dx: type === "moving" ? 2 : 0,
    timer: type === "cloud" ? 1 : null, // nuvem some depois do primeiro pulo
    hasSpring: Math.random() < 0.25, // 25% de chance de ter mola
  };
}

// Resetar jogo
function resetGame() {
  player.x = canvas.width / 2 - 20;
  player.y = canvas.height - 80;
  player.velocityY = 0;
  player.lastPlatform = null;
  score = 0;
  gameOver = false;
  cameraY = 0;

  platforms = [];
  platforms.push(createPlatform(canvas.width / 2 - 35, canvas.height - 40, "normal"));

  for (let i = 1; i < 7; i++) {
    let px = Math.random() * (canvas.width - 70);
    let py = canvas.height - i * 100;
    let types = ["normal", "moving", "cloud"];
    let type = types[Math.floor(Math.random() * types.length)];
    platforms.push(createPlatform(px, py, type));
  }

  restartBtn.style.display = "none";
}

// Atualizar jogador
function updatePlayer() {
  if (keys.left) player.x -= 4;
  if (keys.right) player.x += 4;

  if (player.x + player.width < 0) player.x = canvas.width;
  if (player.x > canvas.width) player.x = -player.width;

  player.velocityY += player.gravity;
  player.y += player.velocityY;

  // Colisão com plataformas
  platforms.forEach((p) => {
    if (
      player.x < p.x + p.width &&
      player.x + player.width > p.x &&
      player.y + player.height > p.y &&
      player.y + player.height < p.y + p.height + 10 &&
      player.velocityY > 0
    ) {
      player.velocityY = player.jumpPower;
      if (p.hasSpring) player.velocityY = -18; // mola mais forte

      if (player.lastPlatform !== p) {
        score++; // só ganha ponto quando usa plataforma nova
        player.lastPlatform = p;
      }

      if (p.type === "cloud") {
        platforms = platforms.filter((pl) => pl !== p);
      }
    }
  });

  if (player.y - cameraY > canvas.height) {
    gameOver = true;
  }

  if (player.y < canvas.height / 2 - cameraY) {
    cameraY = player.y - canvas.height / 2;
  }
}

// Atualizar plataformas
function updatePlatforms() {
  platforms.forEach((p) => {
    if (p.type === "moving") {
      p.x += p.dx;
      if (p.x <= 0 || p.x + p.width >= canvas.width) {
        p.dx *= -1;
      }
    }
  });

  platforms = platforms.filter((p) => p.y - cameraY < canvas.height + 100);

  while (platforms.length < 10) {
    let px = Math.random() * (canvas.width - 70);
    let py = platforms[platforms.length - 1].y - 80;
    let types = ["normal", "moving", "cloud"];
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
    if (p.type === "normal") ctx.fillStyle = "#4caf50";
    if (p.type === "moving") ctx.fillStyle = "#2196f3";
    if (p.type === "cloud") ctx.fillStyle = "#ccc";

    ctx.fillRect(p.x, p.y - cameraY, p.width, p.height);

    if (p.hasSpring) {
      ctx.fillStyle = "#000";
      ctx.fillRect(p.x + p.width / 2 - 5, p.y - 10 - cameraY, 10, 10);
    }
  });
}

// Desenhar pontuação
function drawScore() {
  ctx.fillStyle = "#000";
  ctx.font = "20px Arial";
  ctx.fillText("Score: " + score, 10, 30);
}

// Loop principal
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (gameStarted) {
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
      restartBtn.style.display = "block";
    }
  } else {
    ctx.fillStyle = "#000";
    ctx.font = "28px Arial";
    ctx.fillText("Pressione Start", canvas.width / 2 - 90, canvas.height / 2);
  }
}
