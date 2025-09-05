// ===== Elements & canvas =====
const root = document.getElementById('gameRoot');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d', { alpha: false });

const ui = document.getElementById('ui');
const mainMenu = document.getElementById('mainMenu');
const pauseMenu = document.getElementById('pauseMenu');
const pauseTitle = document.getElementById('pauseTitle');

const startBtn = document.getElementById('startBtn');
const startNoFsBtn = document.getElementById('startNoFs');
const resumeBtn = document.getElementById('resumeBtn');
const restartBtn = document.getElementById('restartBtn');
const pauseBtn = document.getElementById('pauseBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');

const difficultySel = document.getElementById('difficulty');
const sensitivitySlider = document.getElementById('sensitivity');

const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');

const isMobile = matchMedia('(hover:none) and (pointer:coarse)').matches;

// ==== Game state & config ====
let gameStarted = false;
let paused = false;
let gameOver = false;
let score = 0;
let cameraY = 0;

const keys = { left: false, right: false };

const config = {
  moveSpeed: 6,
  gravity: 0.42,
  jump: -11,
  superJump: -19,
  platformWidth: 78,
  platformHeight: 16,
  springChance: 0.28,
  spawnGap: 92,
  cloudsBeginAtY: -2400,
};

// world
let player = null;
let platforms = [];

// ===== Utilities =====
function randPlatformType(y){
  if (y > config.cloudsBeginAtY) return Math.random() < 0.25 ? 'moving' : 'normal';
  const r = Math.random();
  if (r < 0.2) return 'moving';
  if (r < 0.45) return 'cloud';
  return 'normal';
}

// ===== Input handlers =====
addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = true;
  if (e.key === 'ArrowRight' || e.key === 'd') keys.right = true;
  if (e.key === 'Escape') togglePause();
});
addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
  if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
});

// mobile touch controls (prevent scroll)
['touchstart','touchend','touchcancel'].forEach(ev=>{
  if (leftBtn && rightBtn) {
    leftBtn.addEventListener(ev, e=>{ e.preventDefault(); keys.left = ev==='touchstart'; }, {passive:false});
    rightBtn.addEventListener(ev, e=>{ e.preventDefault(); keys.right = ev==='touchstart'; }, {passive:false});
  }
});

// optional gyro
addEventListener('deviceorientation', (e)=>{
  if (!gameStarted || paused) return;
  if (typeof e.gamma !== 'number') return;
  if (e.gamma > 12) { keys.right = true; keys.left = false; }
  else if (e.gamma < -12) { keys.left = true; keys.right = false; }
  else { keys.left = false; keys.right = false; }
});

// prevent unwanted touch default on fixed buttons
['pauseBtn','fullscreenBtn','leftBtn','rightBtn','startBtn','startNoFs','resumeBtn','restartBtn'].forEach(id=>{
  const el = document.getElementById(id);
  if (el) el.addEventListener('touchstart', e=>e.preventDefault(), {passive:false});
});

// ===== UI handlers =====
startBtn.addEventListener('click', ()=>startGame(false));
if (startNoFsBtn) startNoFsBtn.addEventListener('click', ()=>startGame(true));
resumeBtn.addEventListener('click', resumeGame);
restartBtn.addEventListener('click', ()=>startGame(true));
pauseBtn.addEventListener('click', togglePause);

fullscreenBtn.addEventListener('click', async ()=>{
  try {
    if (!document.fullscreenElement && isMobile) await root.requestFullscreen();
    else if (document.fullscreenElement) await document.exitFullscreen();
  } catch (err) { /* ignore */ }
});

difficultySel.addEventListener('change', applyDifficulty);
sensitivitySlider.addEventListener('input', applySensitivity);

function togglePause(){
  if (!gameStarted) return;
  paused = !paused;
  pauseMenu.classList.toggle('hidden', !paused);
  if (!paused) { applyDifficulty(); applySensitivity(); }
}

function resumeGame(){
  paused = false;
  pauseMenu.classList.add('hidden');
}

function applyDifficulty(){
  const v = difficultySel.value;
  if (v === 'easy'){ config.gravity = 0.36; config.superJump = -20; }
  else if (v === 'normal'){ config.gravity = 0.42; config.superJump = -19; }
  else { config.gravity = 0.52; config.superJump = -18; }
}
function applySensitivity(){ config.moveSpeed = Number(sensitivitySlider.value); }

// ===== World creation =====
function createPlayer(x,y){ return { x,y,w:32,h:32, vy:0, lastPlatform:null }; }
function createPlatform(x,y,type='normal'){
  return { x, y, w: config.platformWidth, h: config.platformHeight, type,
    dx: type==='moving' ? (Math.random()<0.5?-1:1)*1.8 : 0,
    hasSpring: Math.random() < config.springChance,
    visible: true, alpha: 1, fadingOut: false, fadingIn: false, timer: 0 };
}

function buildInitialWorld(){
  platforms = []; score = 0; cameraY = 0;

  // safe initial platform (no spring)
  const baseY = canvas.height - 90;
  const p0 = createPlatform((canvas.width - config.platformWidth)/2, baseY, 'normal');
  p0.hasSpring = false;
  platforms.push(p0);

  // player spawns on p0
  player = createPlayer(p0.x + (p0.w - 32)/2, p0.y - 32);

  // create stack above
  let y = p0.y - config.spawnGap;
  for (let i=0;i<12;i++){
    const type = randPlatformType(y);
    const px = Math.random() * (canvas.width - config.platformWidth);
    platforms.push(createPlatform(px, y, type));
    y -= config.spawnGap;
  }
}

// ===== Updates =====
function updatePlayer(){
  // horizontal movement
  if (keys.left) player.x -= config.moveSpeed;
  if (keys.right) player.x += config.moveSpeed;

  // wrap horizontally
  if (player.x + player.w < 0) player.x = canvas.width;
  if (player.x > canvas.width) player.x = -player.w;

  // gravity & vertical movement
  player.vy += config.gravity;
  player.y += player.vy;

  // check collisions with platforms (only when falling)
  let onPlatform = false;
  for (const p of platforms){
    if (!p.visible) continue;
    if (
      player.x < p.x + p.w &&
      player.x + player.w > p.x &&
      player.y + player.h > p.y &&
      player.y + player.h < p.y + p.h + 10 &&
      player.vy > 0
    ){
      onPlatform = true;

      // spring anywhere on platform triggers super jump + extra point
      if (p.hasSpring){
        player.vy = config.superJump;
        score++; // extra point for using spring
      } else {
        player.vy = config.jump;
      }

      if (player.lastPlatform !== p){
        score++;
        player.lastPlatform = p;
      }

      if (p.type === 'cloud'){
        p.fadingOut = true;
      }
    }
  }

  // Game Over: only if player is NOT on any platform and fell below the visible screen
  if (!onPlatform && player.y - cameraY > canvas.height + 40){
    endGame();
  }

  // camera follows upward movement (only when player goes up)
  const camTarget = player.y - canvas.height * 0.45;
  if (camTarget < cameraY) cameraY = camTarget;
}

function updatePlatforms(){
  // moving platforms movement and cloud fade logic
  for (const p of platforms){
    if (p.type === 'moving'){
      p.x += p.dx;
      if (p.x <= 0 || p.x + p.w >= canvas.width) p.dx *= -1;
    }

    if (p.type === 'cloud' && p.fadingOut){
      p.alpha -= 0.05;
      if (p.alpha <= 0){ p.alpha = 0; p.visible = false; p.fadingOut = false; p.timer = performance.now(); }
    } else if (p.type === 'cloud' && !p.visible){
      if (performance.now() - p.timer > 2400){ p.visible = true; p.fadingIn = true; }
    } else if (p.type === 'cloud' && p.fadingIn){
      p.alpha += 0.05;
      if (p.alpha >= 1){ p.alpha = 1; p.fadingIn = false; }
    }
  }

  // recycle platforms: keep ones near camera then generate above
  platforms = platforms.filter(p => p.y - cameraY < canvas.height + 160);

  while (platforms.length < 14){
    // find highest (min y)
    let highest = platforms[0];
    for (const p of platforms) if (p.y < highest.y) highest = p;
    const newY = (highest ? highest.y : player.y - 200) - config.spawnGap;
    const type = randPlatformType(newY);
    const px = Math.random() * (canvas.width - config.platformWidth);
    platforms.push(createPlatform(px, newY, type));
  }
}

// ===== Draw =====
function drawBackground(){
  const g = ctx.createLinearGradient(0,0,0,canvas.height);
  g.addColorStop(0, '#7ec8ff');
  g.addColorStop(1, '#e6fbff');
  ctx.fillStyle = g;
  ctx.fillRect(0,0,canvas.width,canvas.height);
}

function drawPlayer(){
  if (!player) return;
  const x = player.x, y = player.y - cameraY;
  const g = ctx.createLinearGradient(x, y, x+player.w, y+player.h);
  g.addColorStop(0, '#ff8a65'); g.addColorStop(1, '#ff5722');
  ctx.fillStyle = g;
  ctx.fillRect(x, y, player.w, player.h);
  ctx.lineWidth = 2; ctx.strokeStyle = '#fff'; ctx.strokeRect(x, y, player.w, player.h);
}

function drawPlatforms(){
  for (const p of platforms){
    if (!p.visible && !p.fadingIn) continue;
    const x = p.x, y = p.y - cameraY;
    ctx.save(); ctx.globalAlpha = p.alpha;

    if (p.type === 'normal'){
      const g = ctx.createLinearGradient(x,y,x,y+p.h); g.addColorStop(0,'#4caf50'); g.addColorStop(1,'#2e7d32'); ctx.fillStyle = g;
    } else if (p.type === 'moving'){
      const g = ctx.createLinearGradient(x,y,x+p.w,y+p.h); g.addColorStop(0,'#2196f3'); g.addColorStop(1,'#0d47a1'); ctx.fillStyle = g;
    } else {
      ctx.fillStyle = '#fff'; ctx.shadowBlur = 14; ctx.shadowColor = 'rgba(0,0,0,.25)';
    }

    ctx.fillRect(x, y, p.w, p.h);

    if (p.hasSpring){
      const sx = x + p.w/2 - 10; const sy = y - 14;
      ctx.fillStyle = '#d9d9d9';
      for (let i=0;i<4;i++) ctx.fillRect(sx, sy - i*4, 20, 3);
      ctx.lineWidth = 1; ctx.strokeStyle = '#333'; ctx.strokeRect(sx, sy - 12, 20, 14);
    }

    ctx.restore();
  }
}

// ===== Game flow =====
function startGame(noFullscreen = false){
  applyDifficulty(); applySensitivity();
  buildInitialWorld();
  mainMenu.classList.add('hidden');
  pauseMenu.classList.add('hidden');
  gameStarted = true; paused = false; gameOver = false;
  if (isMobile){
    document.getElementById('controls').style.display = 'flex';
    if (!noFullscreen){
      try{ root.requestFullscreen(); }catch(e){}
    }
  }
  // start loop
  requestAnimationFrame(loop);
}

function resumeGame(){ paused = false; pauseMenu.classList.add('hidden'); }
function endGame(){ gameOver = true; paused = true; pauseMenu.classList.remove('hidden'); pauseTitle.textContent = `💀 Game Over — Score: ${score}`; }

// main loop
function loop(){
  // clear
  drawBackground();
  if (gameStarted && !paused && !gameOver){
    updatePlayer();
    updatePlatforms();
  }
  drawPlatforms();
  drawPlayer();
  ui.textContent = `Score: ${score}`;
  requestAnimationFrame(loop);
}

// ===== helpers =====
function buildInitialWorld(){
  platforms = []; score = 0; cameraY = 0;
  const baseY = canvas.height - 90;
  const p0 = createPlatform((canvas.width - config.platformWidth)/2, baseY, 'normal');
  p0.hasSpring = false;
  platforms.push(p0);
  player = createPlayer(p0.x + (p0.w - 32)/2, p0.y - 32);
  let y = p0.y - config.spawnGap;
  for (let i=0;i<12;i++){
    const type = randPlatformType(y);
    const px = Math.random() * (canvas.width - config.platformWidth);
    platforms.push(createPlatform(px, y, type));
    y -= config.spawnGap;
  }
  // reset UI
  ui.textContent = `Score: ${score}`;
}

function applyDifficulty(){ const v = difficultySel.value; if (v==='easy'){ config.gravity=0.36; config.superJump=-20; } else if (v==='normal'){ config.gravity=0.42; config.superJump=-19; } else { config.gravity=0.52; config.superJump=-18; } }
function applySensitivity(){ config.moveSpeed = Number(sensitivitySlider.value); }

// start with menu visible
applyDifficulty(); applySensitivity();
mainMenu.classList.remove('hidden');
pauseMenu.classList.add('hidden');

// ensure initial render
requestAnimationFrame(loop);
