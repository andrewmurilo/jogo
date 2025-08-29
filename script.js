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
  gravity: 0.5,
  jumpPower: -10
};

let obstacles = [];
let gameOver = false;
let score = 0;

function createObstacle() {
  const width = 60;
  const x = Math.random() * (canvas.width - width);
  obstacles.push({ x, y: -40, width, height: 20 });
}

function resetGame() {
  player.y = 500;
  player.velocityY = 0;
  obstacles = [];
  score = 0;
  gameOver = false;
}

function drawPlayer() {
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.width, player.height);
}

function drawObstacles() {
  ctx.fillStyle = "#4caf50";
  obstacles.forEach(obs => {
    ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
  });
}

function updateObstacles() {
  obstacles.forEach(obs => {
    obs.y += 4;
    if (
      player.x < obs.x + obs.width &&
      player.x + player.width > obs.x &&
      player.y < obs.y + obs.height &&
      player.y + player.height > obs.y
    ) {
      gameOver = true;
    }
  });

  obstacles = obstacles.filter(obs => obs.y < canvas.height);
}

function updatePlayer() {
  player.velocityY += player.gravity;
  player.y += player.velocityY;

  if (player.y + player.height > canvas.height) {
    gameOver = true;
  }
}

function drawScore() {
  ctx.fillStyle = "#000";
  ctx.font = "20px Arial";
  ctx.fillText("Score: " + score, 10, 30);
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!gameOver) {
    if (Math.random() < 0.02) createObstacle();

    updatePlayer();
    updateObstacles();

    drawPlayer();
    drawObstacles();
    drawScore();

    score++;
    requestAnimationFrame(gameLoop);
  } else {
    ctx.fillStyle = "#000";
    ctx.font = "30px Arial";
    ctx.fillText("Game Over", 100, canvas.height / 2);
    ctx.font = "20px Arial";
    ctx.fillText("Toque ou clique para reiniciar", 60, canvas.height / 2 + 40);
  }
}

function jump() {
  if (gameOver) {
    resetGame();
    gameLoop();
  } else {
    player.velocityY = player.jumpPower;
  }
}

canvas.addEventListener("click", jump);
canvas.addEventListener("touchstart", jump);

gameLoop();
let keys = {
  left: false,
  right: false,
  jump: false
};

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft" || e.key === "a") keys.left = true;
  if (e.key === "ArrowRight" || e.key === "d") keys.right = true;
  if (e.key === "ArrowUp" || e.key === "w") keys.jump = true;
});

document.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft" || e.key === "a") keys.left = false;
  if (e.key === "ArrowRight" || e.key === "d") keys.right = false;
  if (e.key === "ArrowUp" || e.key === "w") keys.jump = false;
});

// Botões mobile
document.getElementById("leftBtn").addEventListener("touchstart", () => keys.left = true);
document.getElementById("leftBtn").addEventListener("touchend", () => keys.left = false);

document.getElementById("rightBtn").addEventListener("touchstart", () => keys.right = true);
document.getElementById("rightBtn").addEventListener("touchend", () => keys.right = false);

document.getElementById("jumpBtn").addEventListener("touchstart", () => keys.jump = true);
document.getElementById("jumpBtn").addEventListener("touchend", () => keys.jump = false);
function updatePlayer() {
  // Movimento horizontal
  if (keys.left) player.x -= 5;
  if (keys.right) player.x += 5;

  // Pulo
  if (keys.jump && player.velocityY === 0) {
    player.velocityY = player.jumpPower;
    keys.jump = false; // evita pulo contínuo
  }

  // Gravidade
  player.velocityY += player.gravity;
  player.y += player.velocityY;

  // Limites da tela
  if (player.x < 0) player.x = 0;
  if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

  if (player.y + player.height > canvas.height) {
    gameOver = true;
  }
}
