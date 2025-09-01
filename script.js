const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 360;
canvas.height = 640;

// ===== VARIÁVEIS DO JOGADOR =====
let player = {
  x: 160,
  y: 500,
  width: 40,
  height: 40,
  color: "#ff5722",
  velocityY: 0,
  gravity: 0.4,
  jumpPower: -10,
  onGround: false,
};

// ===== PLATAFORMAS / MOLAS =====
let platforms = [];
let score = 0;
let gameOver = false;
let cameraY = 0;

// Tipos de plataformas
const PLATFORM_TYPES = {
  NORMAL: "normal",
  MOVING: "moving",
  TEMP: "temporary",
  NORMAL_SPRING: "normalSpring",
  MOVING_SPRING: "movingSpring"
};

// ===== FUNÇÃO CRIAR PLATAFORMAS =====
function createPlatform(x, y, type = PLATFORM_TYPES.NORMAL) {
  let platform = {
    x,
    y,
    width: 80,
    height: 15,
    type,
    dx: type.includes("moving") ? (Math.random() < 0.5 ? 1 : -1) * 2 : 0,
    timer: type === PLATFORM_TYPES.TEMP ? 300 : null,
    hasSpring: type.includes("Spring"),
  };
  return platform;
}

// ===== GERADOR DE PLATAFORMAS (GRUPOS DE 3) =====
function spawnPlatformBatch() {
  let batchY = platforms.length > 0 ? Math.min(...platforms.map(p => p.y)) - 100 : 550;

  for (let i = 0; i < 3; i++) {
    let x = Math.random() * (canvas.width - 80);
    let typeChance = Math.random();
    let type;

    if (typeChance < 0.2) type = PLATFORM_TYPES.TEMP; // 20%
    else if (typeChance < 0.4) type = PLATFORM_TYPES.MOVING; // 20%
    else if (typeChance < 0.55) type = PLATFORM_TYPES.NORMAL_SPRING; // 15%
    else if (typeChance < 0.7) type = PLATFORM_TYPES.MOVING_SPRING; // 15%
    else type = PLATFORM_TYPES.NORMAL; // 30%

    // TEMPORÁRIA nunca spawna mola
    if (type === PLATFORM_TYPES.TEMP) {
      platforms.push(createPlatform(x, batchY, PLATFORM_TYPES.TEMP));
    } else {
      platforms.push(createPlatform(x, batchY, type));
    }
    batchY -= 100;
  }
}

// ===== RESETAR JOGO =====
function resetGame() {
  player.x = 160;
  player.y = 500;
  player.velocityY = 0;
  score = 0;
  gameOver = false;
  cameraY = 0;

  platforms = [];
  // Plataforma inicial garantida
  platforms.push(createPlatform(140, 550, PLATFORM_TYPES.NORMAL));

  // Primeiro lote
  spawnPlatformBatch();
}

// ===== ATUALIZAR JOGADOR =====
function updatePlayer() {
  player.velocityY += player.gravity;
  player.y += player.velocityY;

  // Movimento horizontal (PC)
  if (keys.left) player.x -= 5;
  if (keys.right) player.x += 5;

  // Limites da tela
  if (player.x < 0) player.x = 0;
  if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

  // Colisão com plataformas
  player.onGround = false;
  for (let plat of platforms) {
    if (
      player.x < plat.x + plat.width &&
      player.x + player.width > plat.x &&
      player.y + player.height > plat.y &&
      player.y + player.height < plat.y + plat.height + 10 &&
      player.velocityY >= 0
    ) {
      // TEMPORÁRIA desaparece
      if (plat.type === PLATFORM_TYPES.TEMP) {
        plat.timer -= 1;
        if (plat.timer <= 0) {
          platforms = platforms.filter(p => p !== plat);
        }
      }

      // Normal e com mola
      player.onGround = true;
      player.velocityY = player.jumpPower;

      if (plat.hasSpring) {
        player.velocityY = plat.type.includes("moving") ? -18 : -15; // mola dá pulo maior
      }
    }
  }

  // Se cair abaixo da câmera = game over
  if (player.y - cameraY > canvas.height) {
    gameOver = true;
  }
}

// ===== ATUALIZAR PLATAFORMAS =====
function updatePlatforms() {
  for (let plat of platforms) {
    // Plataforma móvel
    if (plat.dx !== 0) {
      plat.x += plat.dx;
      if (plat.x < 0 || plat.x + plat.width > canvas.width) {
        plat.dx *= -1;
      }
    }
  }

  // Remover plataformas muito abaixo
  platforms = platforms.filter(p => p.y - cameraY < canvas.height);

  // Se menos de 6 plataformas → gerar novo lote
  if (platforms.length < 6) {
    spawnPlatformBatch();
  }
}

// ===== ATUALIZAR CÂMERA =====
function updateCamera() {
  if (player.y < cameraY + canvas.height / 3) {
    cameraY = player.y - canvas.height / 3;
  }
}

// ===== DESENHAR =====
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(0, -cameraY);

  // Jogador
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.width, player.height);

  // Plataformas
  for (let plat of platforms) {
    ctx.fillStyle =
      plat.type === PLATFORM_TYPES.TEMP ? "#f44336" :
      plat.type.includes("moving") ? "#2196f3" :
      "#4caf50";
    ctx.fillRect(plat.x, plat.y, plat.width, plat.height);

    // Mola
    if (plat.hasSpring) {
      ctx.fillStyle = "#ffeb3b";
      ctx.fillRect(plat.x + plat.width/3, plat.y - 10, 20, 10);
    }
  }

  ctx.restore();

  // HUD
  ctx.fillStyle = "#000";
  ctx.font = "20px Arial";
  ctx.fillText("Score: " + score, 10, 30);
}

// ===== GAME LOOP =====
function gameLoop() {
  if (!gameOver) {
    updatePlayer();
    updatePlatforms();
    updateCamera();
    draw();
    score++;
    requestAnimationFrame(gameLoop);
  } else {
    ctx.fillStyle = "#000";
    ctx.font = "30px Arial";
    ctx.fillText("Game Over", 100, canvas.height / 2);
  }
}

// ===== CONTROLES =====
let keys = { left: false, right: false };
document.addEventListener("keydown", e => {
  if (e.key === "ArrowLeft" || e.key === "a") keys.left = true;
  if (e.key === "ArrowRight" || e.key === "d") keys.right = true;
});
document.addEventListener("keyup", e => {
  if (e.key === "ArrowLeft" || e.key === "a") keys.left = false;
  if (e.key === "ArrowRight" || e.key === "d") keys.right = false;
});

// Controle por movimento no celular
window.addEventListener("deviceorientation", e => {
  if (e.gamma > 10) { keys.right = true; keys.left = false; }
  else if (e.gamma < -10) { keys.left = true; keys.right = false; }
  else { keys.left = false; keys.right = false; }
});

// Clique para reiniciar
canvas.addEventListener("click", () => {
  if (gameOver) {
    resetGame();
    gameLoop();
  }
});

// ===== INICIAR =====
resetGame();
gameLoop();
