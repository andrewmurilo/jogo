// ---------- Config / Estado ----------
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 360;
canvas.height = 640;

let state = {
  running: false,
  paused: false,
  gameOver: false,
  cameraY: 0,
  score: 0,
  lastLandY: Infinity, // para contar pontos somente ao subir
  difficulty: 'normal', // easy | normal | hard
  sensitivity: 4,
  hud: {
    size: 60,
    opacity: 1,
  },
  textures: {
    player: null,
    platform: null,
    cloud: null
  }
};

// ---------- DOM refs ----------
const startScreen = document.getElementById('startScreen');
const startBtn = document.getElementById('startBtn');
const openOptionsFromMenu = document.getElementById('openOptionsFromMenu');
const menuBackdrop = document.getElementById('menuBackdrop');

const pauseBtn = document.getElementById('pauseBtn');
const pausePanel = document.getElementById('pausePanel');
const resumeBtn = document.getElementById('resumeBtn');
const openOptionsBtn = document.getElementById('openOptionsBtn');
const openHudEditorBtn = document.getElementById('openHudEditorBtn');
const goMenuBtn = document.getElementById('goMenuBtn');

const optionsPanel = document.getElementById('optionsPanel');
const difficultySelect = document.getElementById('difficultySelect');
const sensitivityRange = document.getElementById('sensitivityRange');
const playerTextureInput = document.getElementById('playerTextureInput');
const platformTextureInput = document.getElementById('platformTextureInput');
const cloudTextureInput = document.getElementById('cloudTextureInput');
const applyTexturesBtn = document.getElementById('applyTexturesBtn');
const optionsBackBtn = document.getElementById('optionsBackBtn');

const hudEditor = document.getElementById('hudEditor');
const hudSizeRange = document.getElementById('hudSizeRange');
const hudOpacityRange = document.getElementById('hudOpacityRange');
const confirmHudBtn = document.getElementById('confirmHudBtn');
const hudBackBtn = document.getElementById('hudBackBtn');

const mobileControls = document.getElementById('mobileControls');
const hudLeft = document.getElementById('hudLeft');
const hudRight = document.getElementById('hudRight');

const restartBtn = document.getElementById('restartBtn');
const backToMenuBtn = document.getElementById('backToMenuBtn');

const menuAssetInput = document.getElementById('menuAssetInput');
const applyMenuAsset = document.getElementById('applyMenuAsset');
const openOptionsFromMenuBtn = document.getElementById('openOptionsFromMenu');

// ---------- Audio (simples) ----------
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(f=440, t=0.12, type='sine'){ const o=audioCtx.createOscillator(), g=audioCtx.createGain(); o.type=type; o.frequency.value=f; g.gain.value=0.08; o.connect(g); g.connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime+t); }

// ---------- Player ----------
const player = {
  x: canvas.width/2 - 20,
  y: canvas.height - 120,
  w: 36,
  h: 36,
  color: '#ff5722',
  velY: 0,
  gravity: 0.4,
  jumpPower: -10,
};

// ---------- Platforms ----------
let platforms = [];

// helper: create platform (supports types normal, moving, temporary, cloud, spring-on-platform)
function createPlatform(x, y, type='normal'){
  return {
    x, y,
    w: 70, h: 14,
    type,
    dx: type==='moving' ? (Math.random()<0.5?2:-2) : 0,
    timer: type==='temporary'? 300 : null,
    hasSpring: Math.random() < 0.18 && type!=='temporary',
    springOffsetX: null, // position for spring (calculated)
    cloudState: { visible:true, alpha:1, fading:false, timer:0 }, // for clouds
    touchedThisFrame:false
  };
}

// ---------- Init / Reset ----------
function resetGame(){
  state.running = true;
  state.paused = false;
  state.gameOver = false;
  state.cameraY = 0;
  state.score = 0;
  state.lastLandY = Infinity;
  platforms = [];

  // initial platform directly under player (ensures no immediate death)
  const base = createPlatform(canvas.width/2 - 35, canvas.height - 32, 'normal');
  base.hasSpring = false;
  platforms.push(base);

  // create a few starter platforms above
  let y = canvas.height - 120;
  for(let i=0;i<6;i++){
    const px = Math.random()*(canvas.width - 70);
    const types = ['normal','moving','temporary'];
    const type = types[Math.floor(Math.random()*types.length)];
    platforms.push(createPlatform(px, y, type));
    y -= 90 + Math.random()*20;
  }

  // reset player
  player.x = canvas.width/2 - 20;
  player.y = canvas.height - 120;
  player.velY = 0;

  // hide UI
  restartBtn.style.display='none';
  backToMenuBtn.style.display='none';
  pauseBtn.style.display='block';
  mobileControls.style.display = isMobileDevice() ? 'flex' : 'none';
  // place HUD buttons default positions (center bottom left/right)
  placeDefaultHudPositions();
}

// ---------- HUD interactivity (drag) ----------
function isMobileDevice(){ return /Mobi|Android/i.test(navigator.userAgent); }
function placeDefaultHudPositions(){
  // center bottom left/right
  hudLeft.style.left = '15%'; hudLeft.style.bottom = '18px';
  hudRight.style.left = '65%'; hudRight.style.bottom = '18px';
  hudLeft.style.position = hudRight.style.position = 'fixed';
  hudLeft.style.width = hudLeft.style.height = hudLeft.style.fontSize = state.hud.size + 'px';
  hudRight.style.width = hudRight.style.height = hudRight.style.fontSize = state.hud.size + 'px';
  hudLeft.style.opacity = hudRight.style.opacity = state.hud.opacity;
}

// drag support for HUD buttons (pointer events)
function makeDraggable(el){
  let dragging=false, startX=0, startY=0, origLeft=0, origTop=0;
  el.addEventListener('pointerdown', (e)=>{
    e.preventDefault();
    dragging=true;
    el.setPointerCapture(e.pointerId);
    startX = e.clientX; startY = e.clientY;
    const rect = el.getBoundingClientRect();
    origLeft = rect.left; origTop = rect.top;
    el.style.cursor = 'grabbing';
  });
  window.addEventListener('pointermove', (e)=>{
    if(!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    el.style.left = (origLeft + dx) + 'px';
    el.style.top = (origTop + dy) + 'px';
    el.style.bottom = 'auto'; // override bottom fixed
  });
  el.addEventListener('pointerup', (e)=>{
    dragging=false;
    el.releasePointerCapture?.(e.pointerId);
    el.style.cursor = 'grab';
  });
}
makeDraggable(hudLeft);
makeDraggable(hudRight);

// apply HUD settings UI -> canvas
hudSizeRange.addEventListener('input', (e)=>{
  state.hud.size = Number(e.target.value);
  hudLeft.style.width = hudLeft.style.height = state.hud.size+'px';
  hudRight.style.width = hudRight.style.height = state.hud.size+'px';
});
hudOpacityRange.addEventListener('input', (e)=>{
  state.hud.opacity = Number(e.target.value);
  hudLeft.style.opacity = hudRight.style.opacity = state.hud.opacity;
});
confirmHudBtn.addEventListener('click', ()=>{
  hudEditor.style.display='none';
  pausePanel.style.display='block';
});

// ---------- Controls ----------
let keys = { left:false, right:false };
document.addEventListener('keydown', (e)=>{
  if(e.key === 'ArrowLeft' || e.key === 'a') keys.left = true;
  if(e.key === 'ArrowRight' || e.key === 'd') keys.right = true;
  if(e.key === 'Escape'){ // ESC toggles pause
    if(state.running && !state.gameOver) togglePause();
  }
});
document.addEventListener('keyup', (e)=>{
  if(e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
  if(e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
});

// mobile hud click handlers (touch/press)
hudLeft.addEventListener('pointerdown', () => keys.left = true);
hudLeft.addEventListener('pointerup', () => keys.left = false);
hudLeft.addEventListener('pointercancel', () => keys.left = false);
hudRight.addEventListener('pointerdown', () => keys.right = true);
hudRight.addEventListener('pointerup', () => keys.right = false);
hudRight.addEventListener('pointercancel', () => keys.right = false);

// ---------- Pause / Panels ----------
function togglePause(){
  state.paused = !state.paused;
  if(state.paused){
    pausePanel.style.display='block';
    optionsPanel.style.display='none';
    hudEditor.style.display='none';
  } else {
    pausePanel.style.display='none';
    if(!state.gameOver) requestAnimationFrame(loop);
  }
}
pauseBtn.addEventListener('click', togglePause);
resumeBtn.addEventListener('click', ()=>{ state.paused=false; pausePanel.style.display='none'; requestAnimationFrame(loop); });
openOptionsBtn.addEventListener('click', ()=>{ pausePanel.style.display='none'; optionsPanel.style.display='block'; });
openHudEditorBtn.addEventListener('click', ()=>{ pausePanel.style.display='none'; hudEditor.style.display='block'; });
goMenuBtn.addEventListener('click', ()=>{ goToMenu(); });

optionsBackBtn.addEventListener('click', ()=>{
  optionsPanel.style.display='none';
  pausePanel.style.display='block';
});

// apply difficulty & sensitivity
difficultySelect.addEventListener('change', (e)=>{
  state.difficulty = e.target.value;
  if(state.difficulty === 'easy'){ player.gravity = 0.28; player.jumpPower = -9; }
  else if(state.difficulty === 'normal'){ player.gravity = 0.4; player.jumpPower = -10; }
  else { player.gravity = 0.6; player.jumpPower = -11; }
});
sensitivityRange.addEventListener('input', (e)=>{
  state.sensitivity = Number(e.target.value);
});

// ---------- Textures (apply via URL inputs) ----------
function loadImage(url){
  return new Promise((res, rej)=>{
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = ()=>res(img);
    img.onerror = ()=>rej(new Error('Falha ao carregar imagem: '+url));
    img.src = url;
  });
}
applyTexturesBtn.addEventListener('click', async ()=>{
  if(playerTextureInput.value) {
    try{ state.textures.player = await loadImage(playerTextureInput.value); } catch(e){ alert('Player texture load failed'); }
  }
  if(platformTextureInput.value) {
    try{ state.textures.platform = await loadImage(platformTextureInput.value); } catch(e){ alert('Platform texture load failed'); }
  }
  if(cloudTextureInput.value){
    try{ state.textures.cloud = await loadImage(cloudTextureInput.value); } catch(e){ alert('Cloud texture load failed'); }
  }
  optionsPanel.style.display='none';
  pausePanel.style.display='block';
});

// ---------- Menu backdrop (image or video) ----------
applyMenuAsset.addEventListener('click', ()=>{
  const url = menuAssetInput.value.trim();
  if(!url) { menuBackdrop.style.backgroundImage=''; menuBackdrop.innerHTML=''; return; }
  // simple heuristic: if ends with mp4 -> use video
  if(url.match(/\.(mp4|webm|ogg)$/i)){
    menuBackdrop.innerHTML = `<video id="menuVideo" autoplay muted loop style="width:100%;height:100%;object-fit:cover;"></video>`;
    const vid = document.getElementById('menuVideo');
    vid.src = url;
    vid.play().catch(()=>{/* autoplay may block until user gesture */});
  } else {
    menuBackdrop.innerHTML = '';
    menuBackdrop.style.backgroundImage = `url('${url}')`;
  }
});

// ---------- Game Over buttons ----------
restartBtn.addEventListener('click', ()=>{
  restartBtn.style.display='none';
  backToMenuBtn.style.display='none';
  resetGame();
  requestAnimationFrame(loop);
});
backToMenuBtn.addEventListener('click', ()=> goToMenu());

function goToMenu(){
  state.running=false;
  state.gameOver=false;
  startScreen.style.display='flex';
  menuBackdrop.style.display='block';
  pausePanel.style.display='none';
  optionsPanel.style.display='none';
  hudEditor.style.display='none';
  document.getElementById('gameContainer').style.display = 'none';
  pauseBtn.style.display='none';
  restartBtn.style.display='none';
  backToMenuBtn.style.display='none';
}

// ---------- Springs (coil drawing) ----------
function drawSpring(x,y,width,height, t=0){
  // draw a coil centered horizontally on (x,y) area. We'll draw a simple spiral/zigzag coil
  const coils = 6;
  const cx = x + width/2;
  const top = y - 8;
  const bottom = y + height;
  ctx.save();
  ctx.strokeStyle = '#b71c1c';
  ctx.lineWidth = 3;
  ctx.beginPath();
  const total = coils * 2 * Math.PI;
  const steps = 60;
  for(let i=0;i<=steps;i++){
    const u = i/steps;
    const angle = u * total + t * 0.002;
    const r = 6 + 6 * (1 - u); // decreasing radius
    const px = cx + Math.cos(angle) * r;
    const py = top + u*(bottom-top) + Math.sin(angle)*2;
    if(i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
  }
  ctx.stroke();
  ctx.restore();
}

// ---------- Physics & collision helpers ----------
function platformCollision(pl){
  // returns true if player is landing on platform pl
  return player.x < pl.x + pl.w &&
         player.x + player.w > pl.x &&
         player.y + player.h > pl.y &&
         player.y + player.h < pl.y + pl.h + 10 &&
         player.velY > 0;
}

// ---------- Update / Draw ----------
function update(dt=0){
  // movement horizontal (sensitivity controls speed)
  const horizSpeed = 2.5 * (state.sensitivity/4);
  if(keys.left) player.x -= horizSpeed;
  if(keys.right) player.x += horizSpeed;

  // lateral wrap
  if(player.x + player.w < 0) player.x = canvas.width;
  if(player.x > canvas.width) player.x = -player.w;

  // gravity
  player.velY += player.gravity;
  player.y += player.velY;

  // collisions with platforms (only when visible)
  platforms.forEach(pl=>{
    if(pl.type === 'cloud'){
      if(pl.cloudState.visible && platformCollision(pl)){
        // land on cloud: initiate fade-out animation, player bounces
        player.velY = player.jumpPower;
        pl.cloudState.fading = true;
        pl.cloudState.timer = 60; // fade frames (~1s)
        state.score++;
        playTone(440,0.08);
      }
      // handle fade & reappear
      if(pl.cloudState.fading){
        pl.cloudState.timer--;
        pl.cloudState.alpha = pl.cloudState.timer/60;
        if(pl.cloudState.timer <= 0){
          pl.cloudState.fading = false;
          pl.cloudState.visible = false;
          pl.cloudState.alpha = 0;
          // schedule reappear after 3s
          setTimeout(()=>{ pl.cloudState.visible = true; pl.cloudState.alpha = 1; }, 3000);
        }
      }
    } else {
      if(platformCollision(pl) && pl.type !== 'cloud'){
        // normal landing
        player.velY = player.jumpPower;
        // if temporary, start timer
        if(pl.type === 'temporary'){
          pl.timer = (pl.timer === null) ? 180 : pl.timer - 1;
          // we don't remove immediately, the updatePlatforms will handle it
        }
        // spring on platform
        if(pl.hasSpring){
          // bounce stronger
          player.velY = -18;
          playTone(780,0.1,'square');
        } else {
          playTone(440,0.07);
        }
        // increment score only when moving upward (we check lastLandY to avoid repeated counts)
        if(player.y < state.lastLandY - 1){
          state.score++;
          state.lastLandY = player.y;
        }
      }
    }
  });

  // camera follow (smooth)
  const targetCam = Math.min(state.cameraY, player.y - canvas.height/2);
  // we want cameraY to follow upward only — don't let player go above the top bound visually
  if(player.y < state.cameraY + canvas.height/2){
    state.cameraY = player.y - canvas.height/2;
  }

  // remove platforms far below
  platforms = platforms.filter(p => (p.y - state.cameraY) < canvas.height + 120);

  // update moving & temporary timers
  platforms.forEach(pl=>{
    if(pl.type === 'moving'){
      pl.x += pl.dx;
      if(pl.x <= 0 || pl.x + pl.w >= canvas.width) pl.dx *= -1;
    }
    if(pl.type === 'temporary' && pl.timer != null){
      pl.timer--;
      if(pl.timer <= 0) {
        // remove
        platforms = platforms.filter(x => x !== pl);
      }
    }
  });

  // spawn new platforms to maintain pool (clouds only when score > threshold)
  let maxPlatforms = 10;
  while(platforms.length < maxPlatforms){
    const last = platforms[platforms.length - 1] || { y: player.y - 80 };
    const newY = last.y - (70 + Math.random()*60);
    const px = Math.random()*(canvas.width - 70);
    let types = ['normal','moving','temporary'];
    if(state.score > 150) types.push('cloud'); // clouds after 150 points
    const type = types[Math.floor(Math.random()*types.length)];
    platforms.push(createPlatform(px, newY, type));
  }

  // game over check
  if(player.y - state.cameraY > canvas.height + 80){
    state.gameOver = true;
    endGame();
  }
}

function draw(){
  // dynamic background color based on height (y increases downward, cameraY negative when high)
  const hue = Math.max(200 - Math.floor((state.cameraY * -1) / 50), 0);
  ctx.fillStyle = `hsl(${hue}, 80%, 85%)`;
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // draw platforms — use textures if provided
  platforms.forEach(pl=>{
    const drawX = pl.x;
    const drawY = pl.y - state.cameraY;
    if(pl.type === 'cloud'){
      // cloud: white with fade (alpha)
      const alpha = pl.cloudState ? (pl.cloudState.alpha ?? 1) : 1;
      ctx.save();
      ctx.globalAlpha = alpha;
      if(state.textures.cloud){
        ctx.drawImage(state.textures.cloud, drawX, drawY - 8, pl.w, pl.h + 8);
      } else {
        // soft rounded white rectangle
        ctx.fillStyle = '#fff';
        roundRect(ctx, drawX, drawY - 6, pl.w, pl.h + 8, 8, true, false);
      }
      ctx.restore();
      // draw spring if platform hasSpring (on top of cloud) — optional
      if(pl.hasSpring && pl.cloudState.visible){
        drawSpring(drawX, drawY, pl.w, pl.h);
      }
    } else {
      // non-cloud platform: texture or solid
      if(state.textures.platform){
        ctx.drawImage(state.textures.platform, drawX, drawY, pl.w, pl.h);
      } else {
        ctx.fillStyle = pl.type === 'moving' ? '#2196f3' : (pl.type === 'temporary' ? '#ff9800' : '#4caf50');
        ctx.fillRect(drawX, drawY, pl.w, pl.h);
      }
      // spring drawing
      if(pl.hasSpring){
        const sx = drawX + pl.w/2 - 10;
        drawSpring(sx, drawY, 20, pl.h + 8);
      }
    }
  });

  // draw player (texture or rectangle)
  const px = player.x;
  const py = player.y - state.cameraY;
  if(state.textures.player){
    ctx.drawImage(state.textures.player, px, py - 6, player.w, player.h + 6);
  } else {
    ctx.fillStyle = player.color;
    roundRect(ctx, px, py, player.w, player.h, 6, true, false);
  }

  // HUD score
  ctx.fillStyle = '#000';
  ctx.font = '18px Arial';
  ctx.fillText('Score: '+state.score, 10, 26);
}

// helper to draw rounded rect
function roundRect(ctx, x, y, w, h, r, fill, stroke){
  if(typeof r === 'undefined') r = 5;
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.arcTo(x+w, y, x+w, y+h, r);
  ctx.arcTo(x+w, y+h, x, y+h, r);
  ctx.arcTo(x, y+h, x, y, r);
  ctx.arcTo(x, y, x+w, y, r);
  ctx.closePath();
  if(fill) ctx.fill();
  if(stroke) ctx.stroke();
}

// draw spring coil (coil drawn inside rectangle area)
function drawSpring(x,y,width,height){
  // draw a simple coil with multiple arcs to look like a spring
  const coilColor = '#b71c1c';
  const cx = x + width/2;
  const top = y - 6;
  const bottom = y + height + 4;
  const turns = 5;
  const steps = 40;
  ctx.save();
  ctx.strokeStyle = coilColor;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for(let i=0;i<=steps;i++){
    const t = i/steps;
    const angle = t * turns * Math.PI * 2;
    const radius = 6 + 3 * (1 - t);
    const sx = cx + Math.cos(angle) * radius;
    const sy = top + t*(bottom-top) + Math.sin(angle)*1.5;
    if(i===0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
  }
  ctx.stroke();
  ctx.restore();
}

// ---------- Game loop ----------
let lastTime = 0;
function loop(timestamp){
  if(!state.running || state.paused || state.gameOver) return;
  const dt = timestamp - lastTime;
  lastTime = timestamp;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

// ---------- End game ----------
function endGame(){
  state.running = false;
  state.gameOver = true;
  restartBtn.style.display='block';
  backToMenuBtn.style.display='block';
  pauseBtn.style.display='none';
}

// ---------- Event hookups (start menu) ----------
startBtn.addEventListener('click', ()=>{
  startScreen.style.display='none';
  document.getElementById('gameContainer').style.display='block';
  menuBackdrop.style.display='none';
  resetGame();
  requestAnimationFrame(loop);
});
openOptionsFromMenu.addEventListener('click', ()=>{
  startScreen.style.display='none';
  optionsPanel.style.display='block';
});

// ---------- apply textures button ----------
applyTexturesBtn.addEventListener('click', async ()=>{
  // load images if URLs provided
  if(playerTextureInput.value) {
    try{ state.textures.player = await loadImage(playerTextureInput.value); } catch(e){ alert('Falha ao carregar textura do player'); }
  }
  if(platformTextureInput.value){
    try{ state.textures.platform = await loadImage(platformTextureInput.value); } catch(e){ alert('Falha ao carregar textura de plataforma'); }
  }
  if(cloudTextureInput.value){
    try{ state.textures.cloud = await loadImage(cloudTextureInput.value); } catch(e){ alert('Falha ao carregar textura de nuvem'); }
  }
  optionsPanel.style.display='none';
  pausePanel.style.display='block';
});

// helper load image
function loadImage(url){
  return new Promise((res, rej)=>{ const i=new Image(); i.crossOrigin='anonymous'; i.onload=()=>res(i); i.onerror=()=>rej(); i.src=url; });
}

// ---------- Input for menu backdrop handled earlier -->
applyMenuAsset.addEventListener('click', ()=>{
  // code already in index, but ensure fallback if no value
  const url = menuAssetInput.value.trim();
  if(!url){ menuBackdrop.style.backgroundImage=''; menuBackdrop.innerHTML=''; return; }
  if(url.match(/\.(mp4|webm|ogg)$/i)){
    menuBackdrop.innerHTML = `<video id="menuVideo" autoplay muted loop style="width:100%;height:100%;object-fit:cover;"></video>`;
    const vid = document.getElementById('menuVideo');
    vid.src = url;
    vid.play().catch(()=>{});
  } else {
    menuBackdrop.innerHTML = '';
    menuBackdrop.style.backgroundImage = `url('${url}')`;
  }
});

// ---------- make canvas visible initially */
document.getElementById('gameContainer').style.display='none';
pauseBtn.style.display='none';

// show pause button and HUD when game running (handled in resetGame)

// ---------- utility: drag HUD already implemented earlier: make draggable via pointer (we used makeDraggable) ----------
// but we also need to style HUD buttons to be absolute/fixed so dragging works:
hudLeft.style.position = hudRight.style.position = 'fixed';
placeDefaultHudPositions();

// ensure mobile controls initial settings:
hudSizeRange.value = state.hud.size;
hudOpacityRange.value = state.hud.opacity;

// ---------- simple initial assets: none loaded ----------

// ---------- Start: show menu ----------
startScreen.style.display='flex';
menuBackdrop.style.display='block';

/* End of file - all systems integrated.
   Notes:
   - Nuvens: fade out on landing, then invisible, then reappear after 3s with fade-in.
   - Springs: drawn as coils on platforms that have hasSpring=true.
   - Pause: ESC and pause button toggle pausePanel (with options/HUD/continue/menu).
   - HUD: drag the HUD buttons (pointer-drag) to reposition, adjust size/opac via HUD editor.
   - Textures: paste image URLs in options panel and click "Apply Textures" to use them.
   - Menu backdrop: paste image or video URL in start menu and click Apply to set as background.
*/

