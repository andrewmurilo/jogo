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
  lastPlatform: null
};

let platforms = [];
let score = 0;
let gameOver = false;
let cameraY = 0;
let gameStarted = false;
let paused = false;
let difficulty = "normal";
let sensitivity = 1;

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
  if (e.key === "Escape") paused = !paused;
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
    hasSpring: Math.random() < 0.2 && type !== "temporary", // mola não spawna na temporária
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
  let moveSpeed = 4;
  if (difficulty === "easy") moveSpeed = 2;
  else if (difficulty === "hard") moveSpeed = 6;

  if (keys.left) player.x -= sensitivity * moveSpeed;
  if (keys.right) player.x += sensitivity * moveSpeed;

  if (player.x + player.width < 0) player.x = canvas.width;
  if (player.x > canvas.width) player.x = -player.width;

  player.velocityY += player.gravity;
  player.y += player.velocityY;

  platforms.forEach((p) => {
    if (
      player.x < p.x + p.width &&
      player.x + player.width > p.x &&
      player.y + player.height > p.y &&
      player.y + player.height < p.y + p.height + 10 &&
      player.velocityY > 0
    ) {
      if (p.hasSpring) {
        player.velocityY = -18;
      } else {
        player.velocityY = player.jumpPower;
      }

      if (player.lastPlatform !== p) {
        score++;
        player.lastPlatform = p;

        // nuvem → desaparece por 3s
        if (p.type === "cloud") {
          let oldX = p.x,
            oldY = p.y;
          platforms = platforms.filter((pl) => pl !== p);
          setTimeout(() => {
            platforms.push(createPlatform(oldX, oldY, "cloud"));
          }, 3000);
        }
      }

      if (p.type === "temporary") {
        p.timer -= 1;
        if (p.timer <= 0) {
          platforms = platforms.filter((pl) => pl !== p);
        }
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

  let maxPlatforms = difficulty === "easy" ? 7 : difficulty === "hard" ? 12 : 10;
  while (platforms.length < maxPlatforms) {
    let px = Math.random() * (canvas.width - 70);
    let py = platforms[platforms.length - 1].y - 80;

    // nuvem só a partir de 150 pontos
    let types = score >= 150 ? ["normal", "moving", "temporary", "cloud"] : ["normal", "moving", "temporary"];
    let type = types[Math.floor(Math.random() * types.length)];
    platforms.push(createPlatform(px, py, type));
  }
}

// Dificuldade dinâmica
function updateDifficulty() {
  if (score > 2000) {
    player.gravity = 0.6;
  } else if (score > 1000) {
    player.gravity = 0.5;
  } else if (score > 500) {
    player.gravity = 0.45;
  } else {
    player.gravity = 0.4;
  }
}

// Fundo dinâmico
function drawBackground() {
  let gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  if (score < 500) {
    gradient.addColorStop(0, "#87ceeb");
    gradient.addColorStop(1, "#ffffff");
  } else if (score < 1000) {
    gradient.addColorStop(0, "#ffcc80");
    gradient.addColorStop(1, "#ffe0b2");
  } else if (score < 2000) {
    gradient.addColorStop(0, "#ba68c8");
    gradient.addColorStop(1, "#e1bee7");
  } else {
    gradient.addColorStop(0, "#212121");
    gradient.addColorStop(1, "#424242");
  }
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
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
    if (p.type === "cloud") ctx.fillStyle = "#b3e5fc";
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

  if (!gameOver) {
    drawBackground();
    updatePlayer();
    updatePlatforms();
    updateDifficulty();

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
}

resetGame();
gameLoop();
