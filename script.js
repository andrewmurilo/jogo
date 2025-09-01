const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 400;
canvas.height = 600;

// Player
let player = {
  x: canvas.width / 2 - 15,
  y: canvas.height - 60,
  width: 30,
  height: 30,
  velocityY: 0,
  gravity: 0.4,
  jumpPower: -10,
  onGround: false,
};

let platforms = [];
let springs = [];
let cameraY = 0;
let score = 0;
let gameOver = false;
let highestPlatformY = canvas.height;
let usedPlatforms = new Set();

// Controles
let keys = { left: false, right: false };

// Eventos teclado
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
  window.addEventListener("deviceorientation", (event) => {
    let tilt = event.gamma;
    if (tilt < -5) {
      keys.left = true;
      keys.right = false;
    } else if (tilt > 5) {
      keys.right = true;
      keys.left = false;
    } else {
      keys.left = false;
      keys.right = false;
    }
  });
}

// Criar plataformas
function createPlatform(x, y, type = "normal") {
  let platform = {
    x,
    y,
    width: 80,
    height: 15,
    type,
    dx: type === "moving" ? 2 : 0,
    timer: 0,
    hasSpring: false,
  };

  // Chance de spawnar mola (menos na temporária)
  if (type !== "temporary" && Math.random() < 0.2) {
    platform.hasSpring = true;
    springs.push({
      platform,
      offsetX: platform.width / 2 - 10,
      width: 20,
      height: 20,
    });
  }

  platforms.push(platform);
}

// Inicial
function initPlatforms() {
  platforms = [];
  springs = [];
  usedPlatforms.clear();

  // Plataforma inicial fixa
  createPlatform(canvas.width / 2 - 40, canvas.height - 20, "normal");

  for (let i = 0; i < 6; i++) {
    let x = Math.random() * (canvas.width - 80);
    let y = canvas.height - 100 - i * 100;
    let type = Math.random() < 0.2 ? "moving" : "normal";
    if (Math.random() < 0.1) type = "temporary";
    createPlatform(x, y, type);
  }
}

// Atualizar jogador
function updatePlayer() {
  if (keys.left) player.x -= 4;
  if (keys.right) player.x += 4;

  player.velocityY += player.gravity;
  player.y += player.velocityY;

  if (player.x < 0) player.x = 0;
  if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

  // Limite superior
  const topLimit = cameraY + 60;
  if (player.y < topLimit) {
    player.y = topLimit;
    cameraY += player.velocityY;
  }

  player.onGround = false;

  platforms.forEach((p, idx) => {
    if (
      player.x + player.width > p.x &&
      player.x < p.x + p.width &&
      player.y + player.height > p.y &&
      player.y + player.height < p.y + p.height + 10 &&
      player.velocityY > 0
    ) {
      if (usedPlatforms.has(idx) && p.y > player.y) {
        gameOver = true;
      } else {
        player.velocityY = player.jumpPower;
        player.onGround = true;
        highestPlatformY = p.y;
        usedPlatforms.add(idx);

        if (p.type === "temporary") {
          p.timer = 60;
        }
      }
    }
  });

  // Molas
  springs.forEach((s) => {
    if (
      player.x + player.width > s.platform.x + s.offsetX &&
      player.x < s.platform.x + s.offsetX + s.width &&
      player.y + player.height > s.platform.y - s.height &&
      player.y + player.height < s.platform.y + 10 &&
      player.velocityY > 0
    ) {
      player.velocityY = player.jumpPower * 1.8;
    }
  });

  if (player.y > canvas.height) gameOver = true;
}

// Atualizar plataformas
function updatePlatforms() {
  platforms.forEach((p) => {
    if (p.type === "moving") {
      p.x += p.dx;
      if (p.x < 0 || p.x + p.width > canvas.width) p.dx *= -1;
    }
    if (p.type === "temporary" && p.timer > 0) {
      p.timer--;
      if (p.timer === 0) {
        p.y = -1000;
      }
    }
  });

  platforms = platforms.filter((p) => p.y < player.y + canvas.height);
  springs = springs.filter((s) => s.platform.y < player.y + canvas.height);

  while (platforms.length < 8) {
    let lastY = Math.min(...platforms.map((p) => p.y));
    let x = Math.random() * (canvas.width - 80);
    let y = lastY - 100;
    let type = "normal";
    let rand = Math.random();
    if (rand < 0.15) type = "moving";
    else if (rand < 0.25) type = "temporary";
    createPlatform(x, y, type);
  }
}

// Câmera
function updateCamera() {
  const targetY = player.y - 200;
  if (targetY < cameraY) {
    cameraY -= (cameraY - targetY) * 0.1;
  }
  if (cameraY > player.y - 100) {
    cameraY = player.y - 100;
  }
}

// Desenhar
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "green";
  platforms.forEach((p) => {
    ctx.fillRect(p.x, p.y - cameraY, p.width, p.height);
    if (p.hasSpring) {
      ctx.fillStyle = "red";
      ctx.fillRect(p.x + p.width / 2 - 10, p.y - 20 - cameraY, 20, 20);
      ctx.fillStyle = "green";
    }
  });

  ctx.fillStyle = "blue";
  ctx.fillRect(player.x, player.y - cameraY, player.width, player.height);

  ctx.fillStyle = "black";
  ctx.font = "20px Arial";
  ctx.fillText("Score: " + score, 10, 30);
}

// Loop
function gameLoop() {
  if (gameOver) {
    ctx.fillStyle = "black";
    ctx.font = "30px Arial";
    ctx.fillText("Game Over", canvas.width / 2 - 70, canvas.height / 2);
    return;
  }

  updatePlayer();
  updatePlatforms();
  updateCamera();

  score = Math.max(score, Math.floor(canvas.height - player.y + cameraY));

  draw();
  requestAnimationFrame(gameLoop);
}

// Start
initPlatforms();
gameLoop();
