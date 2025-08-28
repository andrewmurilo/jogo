const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let enemies = [];
let towers = [];
let coins = 100;
let lives = 10;
let score = 0;

const pathY = 250;

class Enemy {
  constructor() {
    this.x = 0;
    this.y = pathY;
    this.radius = 10;
    this.speed = 1;
    this.hp = 100;
  }

  update() {
    this.x += this.speed;
  }

  draw() {
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // HP bar
    ctx.fillStyle = "green";
    ctx.fillRect(this.x - 10, this.y - 20, (this.hp / 100) * 20, 4);
  }
}

class Tower {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.range = 80;
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
        enemy.hp -= 20;
        this.cooldown = 30;
        break;
      }
    }
  }

  draw() {
    ctx.fillStyle = "blue";
    ctx.beginPath();
    ctx.arc(this.x, this.y, 15, 0, Math.PI * 2);
    ctx.fill();
  }
}

canvas.addEventListener("click", (e) => {
  if (coins >= 50) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    towers.push(new Tower(x, y));
    coins -= 50;
  }
});

function spawnEnemy() {
  enemies.push(new Enemy());
}

setInterval(spawnEnemy, 2000);

function drawHUD() {
  ctx.fillStyle = "#fff";
  ctx.font = "16px Arial";
  ctx.fillText(`Moedas: ${coins}`, 10, 20);
  ctx.fillText(`Vidas: ${lives}`, 10, 40);
  ctx.fillText(`Pontuação: ${score}`, 10, 60);
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawHUD();

  for (let tower of towers) {
    tower.update();
    tower.draw();
  }

  enemies = enemies.filter(e => e.hp > 0 && e.x < canvas.width);
  for (let enemy of enemies) {
    enemy.update();
    enemy.draw();

    if (enemy.hp <= 0) {
      coins += 10;
      score += 1;
    }

    if (enemy.x >= canvas.width) {
      lives -= 1;
    }
  }

  if (lives <= 0) {
    ctx.fillStyle = "white";
    ctx.font = "40px Arial";
    ctx.fillText("Game Over", canvas.width / 2 - 100, canvas.height / 2);
    return;
  }

  requestAnimationFrame(gameLoop);
}

gameLoop();
