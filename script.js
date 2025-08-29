const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const startScreen = document.getElementById("startScreen");
const startButton = document.getElementById("startButton");

// Imagens
const bgImg = new Image(); bgImg.src = "assets/images/background.png";
const enemyImg = new Image(); enemyImg.src = "assets/images/enemy.png";
const towerImgs = [
  new Image(), new Image(), new Image()
];
towerImgs[0].src = "assets/images/tower1.png";
towerImgs[1].src = "assets/images/tower2.png";
towerImgs[2].src = "assets/images/tower3.png";

// Sons
const shootSound = new Audio("assets/sounds/shoot.wav");
const hitSound = new Audio("assets/sounds/hit.wav");
const gameOverSound = new Audio("assets/sounds/gameover.wav");

// Estado do jogo
let gameStarted = false;
let gameOver = false;

// Variáveis
let enemies = [];
let towers = [];
let coins = 0;
let lives = 5;
let score = 0;
let phase = 1;
let enemiesDefeated = 0;
let enemiesToDefeat = 10;
let phaseReward = 100;
let currentTowerType = 0;
let spawnInterval = 2000;
let phaseActive = true;

// Classes
class Enemy {
  constructor() {
    this.x = 0;
    this.y = 250;
    this.hp = 100 + phase * 20;
    this.speed = 1 + phase * 0.2;
    this.radius = 15;
  }

  update() {
    this.x += this.speed;
  }

  draw() {
    ctx.drawImage(enemyImg, this.x - 15, this.y - 15, 30, 30);
    ctx.fillStyle = "green";
    ctx.fillRect(this.x - 15, this.y - 25, (this.hp / 100) * 30, 4);
  }
}

class Tower {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.range = 80 + type * 20;
    this.cooldown = 0;
  }

  update() {
    if (this.cooldown > 0) {
      this.cooldown--;
      return;
    }

    for (let enemy of enemies) {
      const dx = enemy.x - this.x;
      const dy = enemy.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < this.range) {
        enemy.hp -= 20 + this.type * 10;
        shootSound.play();
        this.cooldown = 30;
        break;
      }
    }
  }

  draw() {
    ctx.drawImage(towerImgs[this.type], this.x - 15, this.y - 15, 30, 30);
  }
}

// Eventos
document.addEventListener("keydown", (e) => {
  if (["1", "2", "3"].includes(e.key)) {
    currentTowerType = parseInt(e.key) - 1;
  }
});

canvas.addEventListener("click", (e) => {
  if (!gameStarted) return;
  if (gameOver) {
    resetGame();
    return;
  }

  if (coins >= 50) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    towers.push(new Tower(x, y, currentTowerType));
    coins -= 50;
  }
});

startButton.addEventListener("click", () => {
  gameStarted = true;
  startScreen.style.display = "none";
});

// Fases
function spawnEnemy() {
  if (phaseActive && gameStarted && !gameOver) enemies.push(new Enemy());
}

setInterval(spawnEnemy, spawnInterval);

function checkPhaseProgress() {
  if (enemiesDefeated >= enemiesToDefeat) {
    coins += phaseReward;
    phase++;
    enemiesDefeated = 0;
    enemiesToDefeat += 5;
    phaseReward += 50;
    spawnInterval = Math.max(500, spawnInterval - 200);
    phaseActive = false;

    setTimeout(() => {
      phaseActive = true;
    }, 3000);
  }
}

function resetGame() {
  enemies = [];
  towers = [];
  coins = 0;
  lives = 5;
  score = 0;
  phase = 1;
  enemiesDefeated = 0;
  enemiesToDefeat = 10;
  phaseReward = 100;
  currentTowerType = 0;
  spawnInterval = 2000;
  phaseActive = true;
  gameOver = false;
  gameStarted = true;
}

// Loop principal
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

  if (!gameStarted) {
    requestAnimationFrame(gameLoop);
    return;
  }

  if (gameOver) {
    ctx.fillStyle = "white";
    ctx.font = "40px Arial";
    ctx.fillText("Game Over", canvas.width / 2 - 100, canvas.height / 2 - 40);
    ctx.font = "20px Arial";
    ctx.fillText("Clique para reiniciar", canvas.width / 2 - 100, canvas.height / 2);
    requestAnimationFrame(gameLoop);
    return;
  }

  // HUD
  ctx.fillStyle = "#fff";
  ctx.font = "16px Arial";
  ctx.fillText(`Fase: ${phase}`, 10, 20);
  ctx.fillText(`Moedas: ${coins}`, 10, 40);
  ctx.fillText(`Vidas: ${lives}`, 10, 60);
  ctx.fillText(`Meta: ${enemiesDefeated}/${enemiesToDefeat}`, 10, 80);
  ctx.fillText(`Torre: ${currentTowerType + 1}`, 10, 100);

  // Torres
  for (let tower of towers) {
    tower.update();
    tower.draw();
  }

  // Inimigos
  enemies = enemies.filter(e => e.hp > 0 && e.x < canvas.width);
  for (let enemy of enemies) {
    enemy.update();
    enemy.draw();

    if (enemy.hp <= 0) {
      enemiesDefeated++;
      hitSound.play();
    }

    if (enemy.x >= canvas.width) {
      lives--;
      if (lives <= 0) {
        gameOverSound.play();
        gameOver = true;
      }
    }
  }

  checkPhaseProgress();
  requestAnimationFrame(gameLoop);
}

gameLoop();
