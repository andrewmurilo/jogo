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
let platformSpeed = 2;
let backgroundColor = "#d0f0ff";

let keys = { left: false, right: false };

// Controles PC
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft" || e.key === "a") keys.left = true;
  if (e.key === "ArrowRight" || e.key === "d") keys.right = true;
});
document.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft" || e.key === "a") keys.left = false;
  if (e.key === "ArrowRight" || e.key === "d") keys.right = false;
});

// Controle giroscópio (celular)
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

  // Tipos de plataforma
  let type = "normal";
  if (Math.random() < 0.1) type = "vanish"; // some após 5s
  if (Math.random() < 0.15) type = "moving"; // plataforma móvel

  let newPlat = { 
    x, 
    y, 
    width, 
    height: 15, 
    used: false, 
    type, 
    vanishTime: null, 
    dir: Math.random() < 0.5 ? -1 : 1 
  };
  platforms.push(newPlat);

  // Chance de ter mola
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
  platformSpeed = 2;
  backgroundColor = "#d0f0ff";
  platforms = [];
  springs = [];

  // Plataforma inicial
  platforms.push({
    x: player.x - 20,
    y: player.y + player.height,
    width: 80,
    height: 15,
    used: false,
    type: "normal",
    vanishTime: null,
    dir: 0
  });

  // Criar plataformas iniciais
  let startY = player.y;
  for (let i = 1; i <= 8; i++) {
    createPlatform(startY - i * 80);
  }
}

function drawPlayer() {
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.width, player.height);
}

function drawPlatforms() {
  platforms.forEach(p => {
    if (p.type === "vanish") ctx.fillStyle = "#ff0000";
    else if (p.type === "moving") ctx.fillStyle = "#0000ff";
    else ctx.fillStyle = "#4caf50";
    ctx.fillRect(p.x, p.y, p.width, p.height);
  });
}

function drawSprings() {
  ctx.fillStyle = "#ff0";
  springs.forEach(s => {
    ctx.fillRect(s.x, s.y, s.width, s.height);
  });
}

function updatePlayer() {
  if (keys.left) player.x -= 5;
  if (keys.right) player.x += 5;

  player.velocityY += player.gravity;
  player.y += player.velocityY;

  player.onPlatform = null;

  for (let plat of platforms) {
    if (
      player.x + player.width > plat.x &&
      player.x < plat.x + plat.width &&
      player.y + player.height > plat.y &&
      player.y + player.height < plat.y + plat.height &&
      player.velocityY >= 0
    ) {
      if (plat.used && plat.y > player.y) {
        gameOver = true; // plataforma de baixo usada → morre
      } else {
        player.velocityY = player.jumpPower;
        plat.used = true;
        player.onPlatform = plat;

        // Se for vanish → some em 5s
        if (plat.type === "vanish" && plat.vanishTime === null) {
          plat.vanishTime = Date.now();
        }
      }
    }
  }

  // Colisão molas
  for (let spring of springs) {
    if (
      player.x + player.width > spring.x &&
      player.x < spring.x + spring.width &&
      player.y + player.height > spring.y &&
      player.y + player.height < spring.y + spring.height &&
      player.velocityY >= 0
    ) {
      player.velocityY = player.jumpPower * 1.8;
    }
  }

  if (player.x < 0) player.x = 0;
  if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
  if (player.y > canvas.height) gameOver = true;
}

function updatePlatforms() {
  platforms.forEach(p => {
    p.y += platformSpeed;

    if (p.type === "moving") {
      p.x += p.dir * 2;
      if (p.x <= 0 || p.x + p.width >= canvas.width) p.dir *= -1;
    }

    // Some após 5s se for vanish
    if (p.type === "vanish" && p.vanishTime !== null) {
      if (Date.now() - p.vanishTime > 5000) {
        p.y = canvas.height + 100; // manda pra fora
      }
    }
  });

  springs.forEach(s => s.y += platformSpeed);

  platforms = platforms.filter(p => p.y < canvas.height);
  springs = springs.filter(s => s.y < canvas.height);

  while (platforms.length < 8) {
    let lowestY = Math.min(...platforms.map(p => p.y));
    createPlatform(lowestY - 80);
  }
}

function drawScore() {
  ctx.fillStyle = "#000";
  ctx.font = "20px Arial";
  ctx.fillText("Score: " + score, 10, 30);
}

function gameLoop() {
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (!gameOver) {
    updatePlayer();
    updatePlatforms();

    drawPlayer();
    drawPlatforms();
    drawSprings();
    drawScore();

    score++;

    // Aumenta dificuldade em 500 pontos
    if (score % 500 === 0) {
      platformSpeed += 0.5;
      backgroundColor = backgroundColor === "#d0f0ff" ? "#ffe0d0" : "#d0f0ff";
    }

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
