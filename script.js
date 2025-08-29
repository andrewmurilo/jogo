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
  jumpPower: -10,
  onGround: false
};

let platforms = [];
let springs = [];
let score = 0;
let gameOver = false;

// CONTROLES
let keys = { left: false, right: false };

// Eventos teclado (PC)
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft" || e.key === "a") keys.left = true;
  if (e.key === "ArrowRight" || e.key === "d") keys.right = true;
});
document.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft" || e.key === "a") keys.left = false;
  if (e.key === "ArrowRight" || e.key === "d") keys.right = false;
});

// Controle celular (acelerômetro)
window.addEventListener("deviceorientation", (e) => {
  if (e.gamma < -5) { // inclinado para esquerda
    keys.left = true;
    keys.right = false;
  } else if (e.gamma > 5) { // inclinado para direita
    keys.right = true;
    keys.left = false;
  } else {
    keys.left = false;
    keys.right = false;
  }
});

// Função para resetar o jogo
function resetGame() {
  player.x = 160;
  player.y = 500;
  player.velocityY = 0;
  score = 0;
  gameOver = false;
  platforms = [];
  springs = [];
  for (let i = 0; i < 6; i++) {
    createPlatform(canvas.height - i * 100);
  }
}

// Criar plataformas
function createPlatform(y) {
  const width = 60;
  const x = Math.random() * (canvas.width - width);
  let type = "normal";

  if (score > 350) {
    let chance = Math.random();
    if (chance < 0.2) type = "moving";
    else if (chance < 0.4) type = "disappearing";
  }

  platforms.push({ x, y, width, height: 15, type, used: false, dx: type === "moving" ? 2 : 0, timer: 0 });
}

// Criar mola
function createSpring(x, y) {
  springs.push({ x, y, width: 20, height: 10 });
}

// Atualizar jogador
function updatePlayer() {
  if (keys.left) player.x -= 4;
  if (keys.right) player.x += 4;

  player.velocityY += player.gravity;
  player.y += player.velocityY;

  if (player.x < 0) player.x = 0;
  if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

  // Colisão com plataformas
  player.onGround = false;
  platforms.forEach((plat) => {
    if (
      player.x < plat.x + plat.width &&
      player.x + player.width > plat.x &&
      player.y + player.height > plat.y &&
      player.y + player.height < plat.y + plat.height + 10 &&
      player.velocityY > 0
    ) {
      if (plat.used) {
        gameOver = true; // morreu se tentar usar plataforma já usada
      } else {
        player.velocityY = player.jumpPower;
        plat.used = true; // marca como usada
        player.onGround = true;

        if (plat.type === "disappearing") {
          plat.timer = 300; // desaparece depois de um tempo
        }
      }
    }
  });

  // Colisão com molas
  springs.forEach((spring) => {
    if (
      player.x < spring.x + spring.width &&
      player.x + player.width > spring.x &&
      player.y + player.height > spring.y &&
      player.y + player.height < spring.y + spring.height + 10 &&
      player.velocityY > 0
    ) {
      player.velocityY = player.jumpPower * 1.5; // pulo mais alto
    }
  });

  if (player.y > canvas.height) gameOver = true;
}

// Atualizar plataformas
function updatePlatforms() {
  platforms.forEach((plat) => {
    plat.y += 2;

    if (plat.type === "moving") {
      plat.x += plat.dx;
      if (plat.x <= 0 || plat.x + plat.width >= canvas.width) plat.dx *= -1;
    }

    if (plat.type === "disappearing" && plat.used) {
      plat.timer--;
      if (plat.timer <= 0) plat.y = canvas.height + 100; // remove
    }
  });

  platforms = platforms.filter((p) => p.y < canvas.height);

  if (platforms.length < 6) {
    createPlatform(-20);
    if (Math.random() < 0.1) createSpring(Math.random() * (canvas.width - 20), -30);
  }
}

// Desenhar jogador
function drawPlayer() {
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.width, player.height);
}

// Desenhar plataformas
function drawPlatforms() {
  platforms.forEach((plat) => {
    if (plat.type === "normal") ctx.fillStyle = "#4caf50";
    if (plat.type === "moving") ctx.fillStyle = "#2196f3";
    if (plat.type === "disappearing") ctx.fillStyle = "#f44336";
    ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
  });
}

// Desenhar molas
function drawSprings() {
  ctx.fillStyle = "#ffeb3b";
  springs.forEach((spring) => {
    ctx.fillRect(spring.x, spring.y, spring.width, spring.height);
  });
}

// Desenhar score
function drawScore() {
  ctx.fillStyle = "#000";
  ctx.font = "20px Arial";
  ctx.fillText("Score: " + score, 10, 30);
}

// Loop principal
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!gameOver) {
    score++;
    if (score > 500) {
      canvas.style.background = "linear-gradient(#000428, #004e92)"; // fundo mais difícil
      player.gravity = 0.7; // aumenta dificuldade
    } else {
      canvas.style.background = "linear-gradient(#87ceeb, #ffffff)";
      player.gravity = 0.5;
    }

    updatePlayer();
    updatePlatforms();

    drawPlayer();
    drawPlatforms();
    drawSprings();
    drawScore();

    requestAnimationFrame(gameLoop);
  } else {
    ctx.fillStyle = "#000";
    ctx.font = "30px Arial";
    ctx.fillText("Game Over", 100, canvas.height / 2);
    ctx.font = "20px Arial";
    ctx.fillText("Clique ou toque para reiniciar", 50, canvas.height / 2 + 40);
  }
}

// Reiniciar
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

// Start
resetGame();
gameLoop();
