const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 360;
canvas.height = 640;

let jogador, plataformas, pontuacao, jogoAtivo, dificuldade, sensibilidade;
let nuvens = [];
let pausado = false;

// Elementos DOM
const menuInicial = document.getElementById("menuInicial");
const menuOpcoes = document.getElementById("menuOpcoes");
const menuPause = document.getElementById("menuPause");
const hud = document.getElementById("hud");
const hudMobile = document.getElementById("hudMobile");
const gameOver = document.getElementById("gameOver");
const pontuacaoText = document.getElementById("pontuacao");

document.getElementById("btnIniciar").onclick = iniciarJogo;
document.getElementById("btnOpcoes").onclick = () => mostrarMenu(menuOpcoes);
document.getElementById("btnVoltarMenu").onclick = () => mostrarMenu(menuInicial);
document.getElementById("btnPause").onclick = pausarJogo;
document.getElementById("btnContinuar").onclick = () => { pausado = false; esconderMenus(); };
document.getElementById("btnMenuInicial").onclick = () => mostrarMenu(menuInicial);
document.getElementById("btnRestart").onclick = iniciarJogo;
document.getElementById("btnVoltarInicio").onclick = () => mostrarMenu(menuInicial);

function mostrarMenu(menu) {
  esconderMenus();
  menu.classList.remove("hidden");
  canvas.style.display = "none";
  hud.classList.add("hidden");
}

function esconderMenus() {
  menuInicial.classList.add("hidden");
  menuOpcoes.classList.add("hidden");
  menuPause.classList.add("hidden");
  gameOver.classList.add("hidden");
}

function iniciarJogo() {
  esconderMenus();
  hud.classList.remove("hidden");
  canvas.style.display = "block";

  jogador = { x: 150, y: 500, w: 40, h: 40, vy: 0 };
  plataformas = [{ x: 150, y: 550, w: 80, h: 15, tipo: "normal" }];
  nuvens = [];
  pontuacao = 0;
  jogoAtivo = true;
  dificuldade = document.getElementById("dificuldade").value;
  sensibilidade = parseInt(document.getElementById("sensibilidade").value);

  loop();
}

function pausarJogo() {
  pausado = true;
  mostrarMenu(menuPause);
}

// Loop
function loop() {
  if (!jogoAtivo) return;
  if (!pausado) atualizar();
  desenhar();
  requestAnimationFrame(loop);
}

function atualizar() {
  jogador.vy += 0.5;
  jogador.y += jogador.vy;

  // Movimento no PC
  if (keys["ArrowLeft"]) jogador.x -= sensibilidade;
  if (keys["ArrowRight"]) jogador.x += sensibilidade;

  // Movimento mobile
  if (mobile.left) jogador.x -= sensibilidade;
  if (mobile.right) jogador.x += sensibilidade;

  if (jogador.y > canvas.height) fimDeJogo();

  // Plataformas
  for (let p of plataformas) {
    if (
      jogador.vy > 0 &&
      jogador.x < p.x + p.w &&
      jogador.x + jogador.w > p.x &&
      jogador.y + jogador.h > p.y &&
      jogador.y + jogador.h < p.y + p.h + 10
    ) {
      jogador.vy = -10;
      pontuacao++;
      if (p.tipo === "nuvem") {
        desaparecerNuvem(p);
      }
    }
  }

  if (Math.random() < 0.02) {
    let tipo = Math.random() < 0.2 ? "nuvem" : "normal";
    plataformas.push({
      x: Math.random() * (canvas.width - 80),
      y: -20,
      w: 80,
      h: 15,
      tipo
    });
  }

  plataformas = plataformas.filter(p => p.y < canvas.height + 20);
  for (let p of plataformas) p.y += 1;
}

function desenhar() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Jogador
  ctx.fillStyle = "red";
  ctx.fillRect(jogador.x, jogador.y, jogador.w, jogador.h);

  // Plataformas
  for (let p of plataformas) {
    if (p.tipo === "nuvem") {
      ctx.fillStyle = "rgba(255,255,255,0.8)";
    } else {
      ctx.fillStyle = "green";
    }
    ctx.fillRect(p.x, p.y, p.w, p.h);
  }

  pontuacaoText.innerText = "Pontuação: " + pontuacao;
}

function fimDeJogo() {
  jogoAtivo = false;
  mostrarMenu(gameOver);
}

function desaparecerNuvem(p) {
  let opacidade = 1;
  let fadeOut = setInterval(() => {
    opacidade -= 0.1;
    if (opacidade <= 0) {
      clearInterval(fadeOut);
      setTimeout(() => {
        let fadeIn = setInterval(() => {
          opacidade += 0.1;
          if (opacidade >= 1) clearInterval(fadeIn);
        }, 100);
      }, 3000);
    }
  }, 100);
}

// Controles
let keys = {};
document.addEventListener("keydown", e => {
  keys[e.key] = true;
  if (e.key === "Escape") pausarJogo();
});
document.addEventListener("keyup", e => (keys[e.key] = false));

let mobile = { left: false, right: false };
document.getElementById("btnEsquerda").onmousedown = () => (mobile.left = true);
document.getElementById("btnEsquerda").onmouseup = () => (mobile.left = false);
document.getElementById("btnDireita").onmousedown = () => (mobile.right = true);
document.getElementById("btnDireita").onmouseup = () => (mobile.right = false);
