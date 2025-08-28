const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Imagens
const towerImg = new Image();
towerImg.src = "assets/images/tower.png";

const enemyImg = new Image();
enemyImg.src = "assets/images/enemy.png";

const bgImg = new Image();
bgImg.src = "assets/images/background.png";

// Sons
const shootSound = new Audio("assets/sounds/shoot.wav");
const hitSound = new Audio("assets/sounds/hit.wav");
const gameOverSound = new Audio("assets/sounds/gameover.wav");

// Variáveis
let enemies = [];
let towers = [];
let coins = 100;
let lives = 5;
let score = 0;
let currentTowerType = 1;
let phase = 1;
let spawnRate = 2000;

// Classes e lógica do jogo aqui...
// Inclui: movimentação, colisão, fases, upgrades, HUD

// Eventos
document.addEventListener("keydown", (e) => {
  if (["1", "2", "3"].includes(e.key)) {
    currentTowerType = parseInt(e.key);
  }
});

canvas.addEventListener("click", (e) => {
  if (coins >= 50) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    towers.push(new Tower(x, y, currentTowerType));
    coins -= 50;
  }
});

// Fases
function nextPhase() {
  phase++;
  spawnRate = Math.max(500, spawnRate - 300);
  setInterval(spawnEnemy, spawnRate);
}

// Loop principal
function gameLoop() {
  ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
  // Atualiza torres, inimigos, HUD, fases
  requestAnimationFrame(gameLoop);
}

gameLoop();
