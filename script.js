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
let cameraY = 0;
let gameStarted = false;
let falling = false;

// Botões
const restartBtn = document.getElementById("restartBtn");
const startBtn = document.getElementById("startBtn");
restartBtn.addEventListener("click", () => {
  resetGame();
  gameLoop();
});
startBtn.addEventListener("click", () => {
  startGame();
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
    used: false,
  };
}

// Resetar jogo
function resetGame() {
  player.x = canvas.width / 2 - 20;
  player.y = canvas.height - 80;
  player.velocityY = 0;
  score = 0;
  gameOver = false;
  cameraY = 0;
  falling = false;

  platforms = [];
  platforms.push(createPlatform(canvas.width / 2 - 35, canvas.height - 40, "normal")); // inicial fixa

  for (let i = 1; i < 7; i++) {
    let px = Math.random() * (canvas.width - 70);
    let py = canvas.height - i * 100;
    let types = ["normal", "moving", "temporary", "cloud"];
    let type = types[Math.floor(Math.random() * types.length)];
    platforms.push(createPlatform(px, py, type));
  }

  restartBtn.style.display = "none";
}

// Iniciar jogo
function startGame() {
  gameStarted = true;
  startBtn.style.display = "none";
  resetGame();
  gameLoop();
}

// Atualizar jogador
function updatePlayer() {
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
      if (p.type === "cloud" && !p.used) {
        p.used = true;
        setTimeout(() => {
          platforms = platforms.filter((pl) => pl !== p);
        }, 200); // some rápido após uso
      }
      player.velocityY = player.jumpPower;
    }
  });

  // Se cair
  if (player.y - cameraY > canvas.height) {
    gameOver = true;
  }

  // Limite superior da câmera
  if (player.y < canvas.height / 2 - cameraY) {
    cameraY = player.y - canvas.height / 2;
  }

  // Detecta se está caindo
  falling = player.velocityY > 5;
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
    let types = ["normal", "moving", "temporary", "cloud"];
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
    if (p.type === "cloud") ctx.fillStyle = "#ddd"; // nuvem cinza clara
    ctx.fillRect(p.x, p.y - cameraY, p.width, p.height);
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

  if (!gameOver) {
    updatePlayer();
    updatePlatforms();

    drawPlayer();
    drawPlatforms();
    drawScore();

    // Score sobe com o jogo
    score++;

    // Se cair, a pontuação vai caindo rápido
    if (falling && score > 0) {
      score -= 3;
      if (score < 0) score = 0;
    }

    requestAnimationFrame(gameLoop);
  } else {
    ctx.fillStyle = "#000";
    ctx.font = "30px Arial";
    ctx.fillText("Game Over", canvas.width / 2 - 80, canvas.height / 2);
    restartBtn.style.display = "block";
  }
}

// Tela inicial
function drawStartScreen() {
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#fff";
  ctx.font = "28px Arial";
  ctx.fillText("Jump Game", canvas.width / 2 - 70, canvas.height / 2 - 40);
  startBtn.style.display = "block";
}

drawStartScreen();
