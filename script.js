const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 400;
canvas.height = 600;

let gameStarted = false;
let gameOver = false;
let score = 0;
let cameraY = 0;

const player = {
  x: canvas.width / 2 - 15,
  y: canvas.height - 60,
  width: 30,
  height: 30,
  velocityY: 0,
  gravity: 0.4,
  jumpPower: -10,
};

let keys = {};
let platforms = [];

// Criação das plataformas
function createPlatform(x, y, type = "normal") {
  if (Math.random() < 0.2) {
    type = "cloud";
  }

  let dx = 0;
  if (type === "moving" || (type === "cloud" && Math.random() < 0.5)) {
    dx = 2;
  }

  return {
    x,
    y,
    width: 70,
    height: 15,
    type,
    dx,
    timer: type === "temporary" ? 300 : null,
    hasSpring: Math.random() < 0.25 && type !== "temporary",
    scored: false, // controla pontuação
  };
}

// Inicializar plataformas
function initPlatforms() {
  platforms = [];
  let y = canvas.height - 50;
  for (let i = 0; i < 10; i++) {
    platforms.push(createPlatform(Math.random() * (canvas.width - 70), y));
    y -= 60;
  }
}

// Atualizar jogador
function updatePlayer() {
  if (keys.left) player.x -= 4;
  if (keys.right) player.x += 4;

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
      player.velocityY = player.jumpPower;

      if (p.hasSpring) {
        player.velocityY = -18;
      }

      if (!p.scored) {
        score += 100;
        p.scored = true;
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
    if (p.dx !== 0) {
      p.x += p.dx;
      if (p.x <= 0 || p.x + p.width >= canvas.width) {
        p.dx *= -1;
      }
    }

    if (p.timer !== null) {
      p.timer--;
      if (p.timer <= 0) {
        platforms = platforms.filter((pl) => pl !== p);
      }
    }
  });

  while (platforms.length < 10) {
    let highestY = Math.min(...platforms.map((p) => p.y));
    let newPlatform = createPlatform(
      Math.random() * (canvas.width - 70),
      highestY - 60
    );
    platforms.push(newPlatform);
  }
}

// Desenhar jogador
function drawPlayer() {
  ctx.fillStyle = "red";
  ctx.fillRect(player.x, player.y - cameraY, player.width, player.height);
}

// Desenhar plataformas
function drawPlatforms() {
  platforms.forEach((p) => {
    if (p.type === "normal") ctx.fillStyle = "#4caf50";
    if (p.type === "moving") ctx.fillStyle = "#2196f3";
    if (p.type === "temporary") ctx.fillStyle = "#ff9800";
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
  ctx.fillStyle = "black";
  ctx.font = "20px Arial";
  ctx.fillText("Pontos: " + score, 10, 30);
}

// Loop do jogo
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!gameStarted) {
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "30px Arial";
    ctx.fillText("Meu Jogo", canvas.width / 2 - 70, canvas.height / 2 - 40);

    ctx.fillStyle = "green";
    ctx.fillRect(canvas.width / 2 - 60, canvas.height / 2, 120, 50);
    ctx.fillStyle = "white";
    ctx.fillText("Iniciar", canvas.width / 2 - 35, canvas.height / 2 + 35);
    requestAnimationFrame(gameLoop);
    return;
  }

  if (gameOver) {
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "30px Arial";
    ctx.fillText("Game Over", canvas.width / 2 - 80, canvas.height / 2 - 40);
    ctx.fillText("Pontos: " + score, canvas.width / 2 - 70, canvas.height / 2);

    ctx.fillStyle = "red";
    ctx.fillRect(canvas.width / 2 - 60, canvas.height / 2 + 50, 120, 50);
    ctx.fillStyle = "white";
    ctx.fillText("Reiniciar", canvas.width / 2 - 50, canvas.height / 2 + 85);

    ctx.fillStyle = "blue";
    ctx.fillRect(canvas.width / 2 - 60, canvas.height / 2 + 120, 120, 50);
    ctx.fillStyle = "white";
    ctx.fillText("Menu", canvas.width / 2 - 35, canvas.height / 2 + 155);

    score -= 5; // pontos diminuem rápido
    if (score < 0) score = 0;

    requestAnimationFrame(gameLoop);
    return;
  }

  updatePlayer();
  updatePlatforms();
  drawPlayer();
  drawPlatforms();
  drawScore();

  requestAnimationFrame(gameLoop);
}

// Controles
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft" || e.key === "a") keys.left = true;
  if (e.key === "ArrowRight" || e.key === "d") keys.right = true;
});
document.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft" || e.key === "a") keys.left = false;
  if (e.key === "ArrowRight" || e.key === "d") keys.right = false;
});

// Clique nos botões da tela
canvas.addEventListener("click", (e) => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  if (!gameStarted) {
    if (
      mx >= canvas.width / 2 - 60 &&
      mx <= canvas.width / 2 + 60 &&
      my >= canvas.height / 2 &&
      my <= canvas.height / 2 + 50
    ) {
      startGame();
    }
  }

  if (gameOver) {
    if (
      mx >= canvas.width / 2 - 60 &&
      mx <= canvas.width / 2 + 60 &&
      my >= canvas.height / 2 + 50 &&
      my <= canvas.height / 2 + 100
    ) {
      startGame();
    }
    if (
      mx >= canvas.width / 2 - 60 &&
      mx <= canvas.width / 2 + 60 &&
      my >= canvas.height / 2 + 120 &&
      my <= canvas.height / 2 + 170
    ) {
      resetMenu();
    }
  }
});

function startGame() {
  gameStarted = true;
  gameOver = false;
  score = 0;
  cameraY = 0;
  player.x = canvas.width / 2 - 15;
  player.y = canvas.height - 60;
  player.velocityY = 0;
  initPlatforms();
}

function resetMenu() {
  gameStarted = false;
  gameOver = false;
  score = 0;
  cameraY = 0;
}

initPlatforms();
gameLoop();
