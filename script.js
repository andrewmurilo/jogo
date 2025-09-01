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
};

let platforms = [];
let score = 0;
let gameOver = false;
let falling = false; // se está em queda
let cameraY = 0;
let level = 1;

// Botão de restart
const restartBtn = document.getElementById("restartBtn");
restartBtn.addEventListener("click", () => {
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
    timer: type === "temporary" ? 300 : null,
    hasSpring: Math.random() < 0.2 && type !== "temporary",
  };
}

// Resetar jogo
function resetGame() {
  player.x = canvas.width / 2 - 20;
  player.y = canvas.height - 80;
  player.velocityY = 0;
  score = 0;
  gameOver = false;
  falling = false;
  cameraY = 0;
  level = 1;

  platforms = [];
  platforms.push(createPlatform(canvas.width / 2 - 35, canvas.height - 40, "normal")); // inicial fixa

  for (let i = 1; i < 7; i++) {
    let px = Math.random() * (canvas.width - 70);
    let py = canvas.height - i * 100;
    let types = ["normal", "moving", "temporary"];
    let type = types[Math.floor(Math.random() * types.length)];
    platforms.push(createPlatform(px, py, type));
  }

  restartBtn.style.display = "none";
}

// Atualizar jogador
function updatePlayer() {
  if (falling) return; // se já caiu, não controla mais o player

  // Movimento horizontal
  if (keys.left) player.x -= 4;
  if (keys.right) player.x += 4;

  // Wrap lateral
  if (player.x + player.width < 0) player.x = canvas.width;
  if (player.x > canvas.width) player.x = -player.width;

  // Gravidade
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
      if (p.type === "temporary") {
        p.timer -= 1;
        if (p.timer <= 0) {
          platforms = platforms.filter((pl) => pl !== p);
        }
      }
      player.velocityY = player.jumpPower;
      if (p.hasSpring) player.velocityY = -18;
    }
  });

  // Se cair da tela
  if (player.y - cameraY > canvas.height) {
    falling = true;
  }

  // Limite superior da câmera
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

  // Remover plataformas muito abaixo
  platforms = platforms.filter((p) => p.y - cameraY < canvas.height + 100);

  // Gerar novas
  while (platforms.length < 10) {
    let px = Math.random() * (canvas.width - 70);
    let py = platforms[platforms.length - 1].y - 80;

    // Probabilidade muda conforme level
    let types;
    if (level === 1) {
      types = ["normal", "normal", "moving"];
    } else if (level === 2) {
      types = ["normal", "moving", "temporary"];
    } else if (level >= 3) {
      types = ["moving", "temporary", "temporary"];
    }

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
    if (p.type === "temporary") ctx.fillStyle = "#ff9800";
    ctx.fillRect(p.x, p.y - cameraY, p.width, p.height);

    if (p.hasSpring) {
      ctx.fillStyle = "#000";
      ctx.fillRect(p.x + p.width / 2 - 5, p.y - 10 - cameraY, 10, 10);
    }
  });
}

// Desenhar pontuação e level
function drawHUD() {
  ctx.fillStyle = "#000";
  ctx.font = "20px Arial";
  ctx.fillText("Score: " + score, 10, 30);
  ctx.fillText("Level: " + level, 10, 55);
}

// Fundo dinâmico
function drawBackground() {
  if (level === 1) {
    ctx.fillStyle = "#e0f7fa"; // azul claro
  } else if (level === 2) {
    ctx.fillStyle = "#ffe0b2"; // laranja claro
  } else if (level >= 3) {
    ctx.fillStyle = "#d1c4e9"; // roxo claro
  }
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Loop principal
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!gameOver) {
    // Mudança de fase a cada 500 pontos
    if (score >= 500 && level === 1) level = 2;
    if (score >= 1000 && level === 2) level = 3;

    drawBackground();

    if (!falling) {
      updatePlayer();
      updatePlatforms();
      score++;
    } else {
      // Quando cair → score começa a cair
      score -= 5;
      if (score <= 0) {
        score = 0;
        gameOver = true;
      }
    }

    drawPlayer();
    drawPlatforms();
    drawHUD();

    requestAnimationFrame(gameLoop);
  } else {
    ctx.fillStyle = "#000";
    ctx.font = "30px Arial";
    ctx.fillText("Game Over", canvas.width / 2 - 80, canvas.height / 2);
    restartBtn.style.display = "block";
  }
}

resetGame();
gameLoop();
