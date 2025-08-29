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
  gravity: 0.4,
  jumpPower: -10,
  onPlatform: null
};

let platforms = [];
let springs = [];
let score = 0;
let gameOver = false;

// Controles
let keys = { left: false, right: false };

// Teclado PC
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft" || e.key === "a") keys.left = true;
  if (e.key === "ArrowRight" || e.key === "d") keys.right = true;
});
document.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft" || e.key === "a") keys.left = false;
  if (e.key === "ArrowRight" || e.key === "d") keys.right = false;
});

// Mobile - giroscópio
if (window.DeviceOrientationEvent) {
  window.addEventListener("deviceorientation", (e) => {
    if (e.gamma !== null) {
      if (e.gamma > 10) {
        keys.right = true;
        keys.left = false;
      } else if (e.gamma < -10) {
        keys.left = true;
        keys.right = false;
      } else {
        keys.left = false;
        keys.right = false;
      }
    }
  });
}

// Criar plataforma
function createPlatform(y) {
  const width = 80;
  const x = Math.random() * (canvas.width - width);
  let newPlat = { x, y, width, height: 15, used: false };
  
  // Evitar choque com a última plataforma
  if (platforms.length > 0) {
    let lastPlat = platforms[platforms.length - 1];
    if (Math.abs(newPlat.x - lastPlat.x) < 50 && Math.abs(newPlat.y - lastPlat.y) < 40) {
      newPlat.x = (newPlat.x + 100) % (canvas.width - width);
    }
  }
  
  platforms.push(newPlat);

  // Chance de ter uma mola em cima
  if (Math.random() < 0.2) {
    springs.push({
      x: newPlat.x + newPlat.width / 2 - 10,
      y: newPlat.y - 15,
      width: 20,
      height: 15
    });
  }
}

function resetGame() {
  player.x = 160;
  player.y = 500;
  player.velocityY = 0;
  score = 0;
  gameOver = false;
  platforms = [];
  springs = [];

  // Criar uma plataforma inicial embaixo do jogador
  createPlatform(player.y + player.height);
  for (let i = 1; i < 8; i++) {
    createPlatform(player.y - i * 80);
  }
}

function drawPlayer() {
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.width, player.height);
}

function drawPlatforms() {
  ctx.fillStyle = "#4caf50";
  platforms.forEach(p => {
    ctx.fillRect(p.x, p.y, p.width, p.height);
  });
}

function drawSprings() {
  ctx.fillStyle = "#0000ff";
  springs.forEach(s => {
    ctx.fillRect(s.x, s.y, s.width, s.height);
  });
}

function updatePlayer() {
  // Movimento
  if (keys.left) player.x -= 5;
  if (keys.right) player.x += 5;

  // Gravidade
  player.velocityY += player.gravity;
  player.y += player.velocityY;

  // Colisão com plataformas
  player.onPlatform = null;
  for (let plat of platforms) {
    if (
      player.x + player.width > plat.x &&
      player.x < plat.x + plat.width &&
      player.y + player.height > plat.y &&
      player.y + player.height < plat.y + plat.height &&
      player.velocityY >= 0
    ) {
      if (plat.used) {
        gameOver = true; // se for plataforma já usada
      } else {
        player.velocityY = player.jumpPower;
        plat.used = true;
        player.onPlatform = plat;
      }
    }
  }

  // Colisão com molas
  for (let spring of springs) {
    if (
      player.x + player.width > spring.x &&
      player.x < spring.x + spring.width &&
      player.y + player.height > spring.y &&
      player.y + player.height < spring.y + spring.height &&
      player.velocityY >= 0
    ) {
      player.velocityY = player.jumpPower * 1.8; // Pulo mais forte
    }
  }

  // Limites
  if (player.x < 0) player.x = 0;
  if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
  if (player.y > canvas.height) gameOver = true;
}

function updatePlatforms() {
  platforms.forEach(p => p.y += 2);
  springs.forEach(s => s.y += 2);

  // Remover plataformas fora da tela
  platforms = platforms.filter(p => p.y < canvas.height);
  springs = springs.filter(s => s.y < canvas.height);

  // Criar novas
  if (platforms.length < 8) {
    createPlatform(-20);
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
    updatePlayer();
    updatePlatforms();

    drawPlayer();
    drawPlatforms();
    drawSprings();
    drawScore();

    score++;
    requestAnimationFrame(gameLoop);
  } else {
    ctx.fillStyle = "#000";
    ctx.font = "30px Arial";
    ctx.fillText("Game Over", 100, canvas.height / 2);
    ctx.font = "20px Arial";
    ctx.fillText("Clique ou toque para reiniciar", 50, canvas.height / 2 + 40);
  }
}

canvas.addEventListener("click", () => {
  if (gameOver) {
    resetGame();
    gameLoop();
  }
});
canvas.addEventListener("touchstart", () => {
  if (gameOver) {
    resetGame();
    gameLoop();
  }
});

resetGame();
gameLoop();
