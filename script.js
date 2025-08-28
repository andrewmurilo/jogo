const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Carregar sprites
const playerImg = new Image();
playerImg.src = "personagem.png";

const enemyImg = new Image();
enemyImg.src = "inimigo.png";

// Jogador
let player = {
  x: 100,
  y: 100,
  width: 32,
  height: 32,
  speed: 4
};

// Inimigo
let enemy = {
  x: 400,
  y: 300,
  width: 32,
  height: 32,
  speed: 2,
  visionRange: 200,
  chasing: false
};

// Controles
let keys = {};
let gameOver = false;

window.addEventListener("keydown", (e) => {
  keys[e.key] = true;
});

window.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

// Função distância
function getDistance(a, b) {
  let dx = a.x - b.x;
  let dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Verificar colisão (AABB)
function checkCollision(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

// Update do jogo
function update() {
  if (gameOver) return;

  // Movimentação do player
  if (keys["w"]) player.y -= player.speed;
  if (keys["s"]) player.y += player.speed;
  if (keys["a"]) player.x -= player.speed;
  if (keys["d"]) player.x += player.speed;

  // Inimigo vê o jogador
  let distance = getDistance(player, enemy);
  if (distance < enemy.visionRange) {
    enemy.chasing = true;
  } else {
    enemy.chasing = false;
  }

  // Movimento do inimigo
  if (enemy.chasing) {
    if (player.x > enemy.x) enemy.x += enemy.speed;
    if (player.x < enemy.x) enemy.x -= enemy.speed;
    if (player.y > enemy.y) enemy.y += enemy.speed;
    if (player.y < enemy.y) enemy.y -= enemy.speed;
  } else {
    // Anda aleatoriamente
    if (Math.random() < 0.02) {
      enemy.x += (Math.random() - 0.5) * 20;
      enemy.y += (Math.random() - 0.5) * 20;
    }
  }

  // Colisão jogador x inimigo
  if (checkCollision(player, enemy)) {
    gameOver = true;
  }
}

// Desenhar
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Jogador
  ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);

  // Inimigo
  ctx.drawImage(enemyImg, enemy.x, enemy.y, enemy.width, enemy.height);

  // Se perder
  if (gameOver) {
    ctx.fillStyle = "red";
    ctx.font = "48px Arial";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
  }
}

// Loop do jogo
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();
