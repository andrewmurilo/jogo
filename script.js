// ===== Setup base =====
const root = document.getElementById('gameRoot');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d', { alpha: false });

const ui = document.getElementById('ui');
const mainMenu = document.getElementById('mainMenu');
const pauseMenu = document.getElementById('pauseMenu');

const startBtn = document.getElementById('startBtn');
const resumeBtn = document.getElementById('resumeBtn');
const restartBtn = document.getElementById('restartBtn');
const pauseBtn = document.getElementById('pauseBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');

const difficultySel = document.getElementById('difficulty');
const sensitivitySlider = document.getElementById('sensitivity');

const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');

// ===== Estado do jogo =====
let gameStarted = false;
let paused = false;
let gameOver = false;

let score = 0;
let cameraY = 0;

const keys = { left: false, right: false };

let player;
let platforms = [];

let config = {
  moveSpeed: 6,          // ajustado por sensibilidade
  gravity: 0.42,         // ajustado por dificuldade
  jump: -11,
  superJump: -19,        // pulo da mola
  platformWidth: 78,
  platformHeight: 16,
  springChance: 0.28,    // chance de ter mola
  cloudChance: 0.18,     // chance de ser nuvem (quando altura alta)
  spawnGap: 92,          // distância vertical entre plataformas
  cloudsBeginAtY: -2400, // nuvens só acima desse Y do mundo
};

// ===== Util =====
const isMobile = matchMedia('(hover:none) and (pointer:coarse)').matches;

function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

function randPlatformType(y){
  // Antes de cloudsBeginAtY: sem nuvem
  if (y > config.cloudsBeginAtY) return Math.random() < 0.25 ? 'moving' : 'normal';
  // Depois: inclui nuvem
  const r = Math.random();
  if (r < 0.2) return 'moving';
  if (r < 0.45) return 'cloud';
  return 'normal';
}

// ===== Entrada =====
addEventListener('keydown', (e)=>{
  if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = true;
  if (e.key === 'ArrowRight' || e.key === 'd') keys.right = true;
  if (e.key === 'Escape') togglePause();
});
addEventListener('keyup', (e)=>{
  if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
  if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
});

// Mobile buttons (com preventDefault para não “subir” a tela)
['touchstart','touchend','touchcancel'].forEach(ev=>{
  leftBtn.addEventListener(ev, (e)=>{ e.preventDefault(); keys.left = ev==='touchstart'; }, {passive:false});
  rightBtn.addEventListener(ev, (e)=>{ e.preventDefault(); keys.right = ev==='touchstart'; }, {passive:false});
});

// Giroscópio opcional
addEventListener('deviceorientation', (e)=>{
  if (!gameStarted || paused) return;
  if (typeof e.gamma !== 'number') return;
  if (e.gamma > 12){ keys.right = true; keys.left = false; }
  else if (e.gamma < -12){ keys.left = true; keys.right = false; }
  else { keys.left = false; keys.right = false; }
});

// ===== UI handlers =====
startBtn.addEventListener('click', startGame);
resumeBtn.addEventListener('click', resumeGame);
restartBtn.addEventListener('click', ()=>{ startGame(true); });
pauseBtn.addEventListener('click', togglePause);

// Fullscreen somente mobile
fullscreenBtn.addEventListener('click', async ()=>{
  try{
    if (!document.fullscreenElement && isMobile){
      await root.requestFullscreen();
    } else if (document.fullscreenElement){
      await document.exitFullscreen();
    }
  }catch(e){ /* ignora falhas de fullscreen */ }
});

// Opções
difficultySel.addEventListener('change', applyDifficulty);
sensitivitySlider.addEventListener('input', applySensitivity);

function togglePause(){
  if (!gameStarted) return;
  paused = !paused;
  pauseMenu.classList.toggle('hidden', !paused);
  // não interrompe o loop — só congela atualizações
}

// ===== Mundo =====
function createPlayer(x, y){
  return {
    x, y, w: 32, h: 32,
    vy: 0,
    lastPlatform: null,
  };
}

function createPlatform(x, y, type = 'normal'){
  return {
    x, y,
    w: config.platformWidth,
    h: config.platformHeight,
    type, // 'normal' | 'moving' | 'cloud'
    dx: type === 'moving' ? (Math.random()<0.5?-1:1) * 1.8 : 0,
    hasSpring: Math.random() < config.springChance,
    // nuvem pisca
    visible: true,
    alpha: 1,
    fadingOut: false,
    fadingIn: false,
    timer: 0,
  };
}

function buildInitialWorld(){
  platforms = [];
  score = 0;
  cameraY = 0;

  // Plataforma segura inicial (sem mola)
  const baseY = canvas.height - 90;
  const p0 = createPlatform((canvas.width - config.platformWidth)/2, baseY, 'normal');
  p0.hasSpring = false;
  platforms.push(p0);

  // Player nasce sobre ela
  player = createPlayer(p0.x + (p0.w - 32)/2, p0.y - 32);

  // Demais plataformas para cima
  let nextY = p0.y - config.spawnGap;
  for (let i=0; i<12; i++){
    const type = randPlatformType(nextY);
    const px = Math.random() * (canvas.width - config.platformWidth);
    const p = createPlatform(px, nextY, type);
    platforms.push(p);
    nextY -= config.spawnGap;
  }
}

// ===== Regras de dificuldade/sensibilidade =====
function applyDifficulty(){
  const val = difficultySel.value;
  if (val === 'easy'){ config.gravity = 0.36; config.superJump = -20; }
  else if (val === 'normal'){ config.gravity = 0.42; config.superJump = -19; }
  else { config.gravity = 0.52; config.superJump = -18; }
}
function applySensitivity(){
  config.moveSpeed = Number(sensitivitySlider.value);
}

// ===== Loop =====
function startGame(fromRestart = false){
  applyDifficulty();
  applySensitivity();
  buildInitialWorld();

  gameOver = false;
  paused = false;
  gameStarted = true;

  mainMenu.classList.add('hidden');
  pauseMenu.classList.add('hidden');

  if (!fromRestart) {
    // garante que não ficou requestAnimationFrame parado
    requestAnimationFrame(gameLoop);
  }
}

function resumeGame(){
  paused = false;
  pauseMenu.classList.add('hidden');
}

function endGame(){
  gameOver = true;
  paused = true;
  pauseMenu.classList.remove('hidden');
  // Mostra score atual no título
  pauseMenu.querySelector('h2').textContent = `Game Over — Score: ${score}`;
}

function gameLoop(){
  // desenha fundo primeiro
  drawBackground();

  if (gameStarted && !paused && !gameOver){
    updatePlayer();
    updatePlatforms();
  }

  // draw order: player + plataformas + HUD
  drawPlatforms();
  drawPlayer();
  ui.textContent = `Score: ${score}`;

  // Agenda próximo frame SEM parar zoom/tela
  requestAnimationFrame(gameLoop);
}

// ===== Atualizações =====
function updatePlayer(){
  // movimento horizontal
  if (keys.left) player.x -= config.moveSpeed;
  if (keys.right) player.x += config.moveSpeed;

  // bordas wrap
  if (player.x + player.w < 0) player.x = canvas.width;
  if (player.x > canvas.width) player.x = -player.w;

  // gravidade
  player.vy += config.gravity;
  player.y += player.vy;

  // colisão com plataformas (só quando caindo)
  for (const p of platforms){
    if (!p.visible) continue;
    const px = p.x, py = p.y;
    if (
      player.x < px + p.w &&
      player.x + player.w > px &&
      player.y + player.h > py &&
      player.y + player.h < py + p.h + 10 &&
      player.vy > 0
    ){
      // tem mola? super pulo em qualquer parte da plataforma
      if (p.hasSpring) player.vy = config.superJump;
      else player.vy = config.jump;

      if (player.lastPlatform !== p){
        score++;
        player.lastPlatform = p;
      }

      // nuvem começa a sumir
      if (p.type === 'cloud'){
        p.fadingOut = true;
      }
    }
  }

  // cai abaixo da câmera => game over
  if (player.y - cameraY > canvas.height + 60){
    endGame();
  }

  // mover câmera pra cima quando o player sobe
  const camTarget = player.y - canvas.height * 0.45;
  if (camTarget < cameraY){
    cameraY = camTarget;
  }
}

function updatePlatforms(){
  // mover plataformas móveis (e não “subir” tela sozinha)
  for (const p of platforms){
    if (p.type === 'moving'){
      p.x += p.dx;
      if (p.x <= 0 || p.x + p.w >= canvas.width) p.dx *= -1;
    }

    // nuvens piscando
    if (p.type === 'cloud' && p.fadingOut){
      p.alpha -= 0.05;
      if (p.alpha <= 0){
        p.alpha = 0;
        p.visible = false;
        p.fadingOut = false;
        p.timer = performance.now();
      }
    } else if (p.type === 'cloud' && !p.visible){
      if (performance.now() - p.timer > 2400){
        p.visible = true;
        p.fadingIn = true;
      }
    } else if (p.type === 'cloud' && p.fadingIn){
      p.alpha += 0.05;
      if (p.alpha >= 1){
        p.alpha = 1;
        p.fadingIn = false;
      }
    }
  }

  // reciclar plataformas: mantém 14 visíveis acima/abaixo da câmera
  platforms = platforms.filter(p => p.y - cameraY < canvas.height + 140);

  // gerar novas acima
  while (platforms.length < 14){
    const last = platforms.reduce((a,b)=> a.y < b.y ? a : b); // menor Y (mais alto no mundo)
    const newY = (last ? last.y : (player.y - 200)) - config.spawnGap;
    const type = randPlatformType(newY);
    const px = Math.random() * (canvas.width - config.platformWidth);
    const p = createPlatform(px, newY, type);
    platforms.push(p);
  }
}

// ===== Desenho =====
function drawBackground(){
  // fundo em relação à câmera
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#7ec8ff');
  grad.addColorStop(1, '#e6fbff');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawPlayer(){
  const x = player.x, y = player.y - cameraY;
  // player com gradiente + borda
  const g = ctx.createLinearGradient(x, y, x+player.w, y+player.h);
  g.addColorStop(0, '#ff8a65');
  g.addColorStop(1, '#ff5722');
  ctx.fillStyle = g;
  ctx.fillRect(x, y, player.w, player.h);
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#ffffff';
  ctx.strokeRect(x, y, player.w, player.h);
}

function drawPlatforms(){
  for (const p of platforms){
    if (!p.visible && !p.fadingIn) continue;
    const x = p.x, y = p.y - cameraY;

    ctx.save();
    ctx.globalAlpha = p.alpha;

    if (p.type === 'normal'){
      const g = ctx.createLinearGradient(x, y, x, y + p.h);
      g.addColorStop(0, '#4caf50');
      g.addColorStop(1, '#2e7d32');
      ctx.fillStyle = g;
    } else if (p.type === 'moving'){
      const g = ctx.createLinearGradient(x, y, x + p.w, y + p.h);
      g.addColorStop(0, '#2196f3');
      g.addColorStop(1, '#0d47a1');
      ctx.fillStyle = g;
    } else {
      // nuvem fofinha
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 14;
      ctx.shadowColor = 'rgba(0,0,0,.25)';
    }

    // corpo da plataforma
    ctx.fillRect(x, y, p.w, p.h);

    // mola estilizada (se existir)
    if (p.hasSpring){
      const sx = x + p.w/2 - 10;
      const sy = y - 14;
      ctx.fillStyle = '#d9d9d9';
      for (let i=0;i<4;i++){
        ctx.fillRect(sx, sy - i*4, 20, 3);
      }
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#333';
      ctx.strokeRect(sx, sy - 12, 20, 14);
    }

    ctx.restore();
  }
}

// ===== Inicial =====
// Não começar a rodar lógica até clicar "Iniciar"
mainMenu.classList.remove('hidden');

// Evita “arrastar/rolar” a página no mobile ao tocar nos botões
['leftBtn','rightBtn','pauseBtn','fullscreenBtn'].forEach(id=>{
  const el = document.getElementById(id);
  el.addEventListener('touchstart', e=>e.preventDefault(), {passive:false});
  el.addEventListener('touchmove', e=>e.preventDefault(), {passive:false});
});
