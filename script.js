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
  gravity: 0.6,
  jumpPower: -12,
  speed: 5
};

let platforms = [];
let score = 0;
let gameOver = false;
let keys = { left: false, right: false, jump: false };

// Criar plataformas iniciais
function initPlatforms() {
  platforms = [];
  for (let i = 0; i < 8; i++) {
    let x = Math.random() * (canvas.width - 60);
    let y = i * 80;
    platforms.push({ x, y, width: 60, height: 15 });
  }
}
initPlatforms();

// Teclado
document.addEventListener("keydown", e => {
  if (e.key === "ArrowLeft" || e.key === "a") keys.left = true;
  if (e.key === "ArrowRight" || e.key === "d") keys.right = true;
  if (e.key === "ArrowUp" || e.key === "w" || e.key === " ") keys.jump = true;
});
document.addEventListener("keyup", e => {
  if (e.key === "ArrowLeft" || e.key === "a") keys.left = false;
  if (e.key === "ArrowRight" || e.key === "d") keys.right = false;
  if (e.key === "ArrowUp" || e.key === "w" || e.key === " ") keys.jump = false;
});

// Botões mobile
document.getElementById("leftBtn").addEventListener("touchstart", () => keys.left = true);
document.getElementById("leftBtn").addEventListener("touchend", () => keys.left = false);
document.getElementById("rightBtn").addEventListener("touchstart", () => keys.right = true);
document.getElementById("rightBtn").addEventListener("touchend", () => keys.right = false);
document.getElementById("jumpBtn").addEventListener("touchstart", () => keys.jump = true);
document.getElementById("jumpBtn").addEventListener("touchend", () => keys.jump = false);

// Resetar jogo
function resetGame() {
  player.x = 160;
  player.y = 500;
  player.velocityY = 0;
  score = 0;
  gameOver = false;
  initPlatforms();
}

// Desenhar jogador
function drawPlayer() {
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.width, player.height);
}

// Desenhar plataformas
function drawPlatforms() {
  ctx.fillStyle = "#4caf50";
  platforms.forEach(p => ctx.fillRect(p.x, p.y, p.width, p.height));
}

// Atualizar jogador
function updatePlayer() {
  if (keys.left) player.x -= player.speed;
  if (keys.right) player.x += player.speed;

  player.velocityY += player.gravity;
  player.y += player.velocityY;

  // Colisão com plataformas
  platforms.forEach(p => {
    if (
      player.x < p.x + p.width &&
      player.x + player.width > p.x &&
      player.y + player.height > p.y &&
      player.y + player.height < p.y + 20 &&
      player.velocityY > 0
    ) {
      player.y = p.y - player.height;
      player.velocityY = 0;
    }
  });

  // Pulo
  if (keys.jump && player.velocityY === 0) {
    player.velocityY = player.jumpPower;
    keys.jump = false;
  }

  // Limites
  if (player.x < 0) player.x = 0;
  if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

  if (player.y > canvas.height) {
    gameOver = true;
  }
}

// Atualizar plataformas (descendo p/ simular subida)
function updatePlatforms() {
  if (player.y < canvas.height / 2) {
    let diff = canvas.height / 2 - player.y;
    player.y = canvas.height / 2;

    platforms.forEach(p => p.y += diff);
    score += Math.floor(diff);
  }

  // Remover plataformas fora da tela e criar novas
  platforms = platforms.filter(p => p.y < canvas.height);
  while (platforms.length < 8) {
    let x = Math.random() * (canvas.width - 60);
    let y = platforms[0].y - 80;
    platforms.unshift({ x, y, width: 60, height: 15 });
  }
}

// Score
function drawScore() {
  ctx.fillStyle = "#000";
  ctx.font = "20px Arial";
  ctx.fillText("Altura: " + score, 10, 30);
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

    requestAnimationFrame(gameLoop);
  } else {
    ctx.fillStyle = "#000";
    ctx.font = "30px Arial";
    ctx.fillText("Game Over", 100, canvas.height / 2);
    ctx.font = "20px Arial";
    ctx.fillText("Toque ou pressione para reiniciar", 40, canvas.height / 2 + 40);
  }
}

// Reinício
canvas.addEventListener("click", () => { if (gameOver) { resetGame(); gameLoop(); }});
canvas.addEventListener("touchstart", () => { if (gameOver) { resetGame(); gameLoop(); }});
document.addEventListener("keydown", () => { if (gameOver) { resetGame(); gameLoop(); }});

gameLoop();
