const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let player, platforms, score, cameraY, gameOver, gameStarted, paused;
let keys = { left: false, right: false };
let moveSpeed = 4;
let gravity = 0.4;

// Controles de pause e opções
const pauseBtn = document.getElementById("pauseBtn");
const optionsBtn = document.getElementById("optionsBtn");
const optionsMenu = document.getElementById("optionsMenu");
const difficultySelect = document.getElementById("difficulty");
const sensitivitySlider = document.getElementById("sensitivity");

pauseBtn.addEventListener("click", () => { paused = !paused; });
optionsBtn.addEventListener("click", () => { optionsMenu.style.display = "flex"; paused = true; });
function closeOptions() {
  optionsMenu.style.display = "none";
  paused = false;
  setDifficulty();
  setSensitivity();
}

// Funções de dificuldade e sensibilidade
function setDifficulty() {
  const value = difficultySelect.value;
  if (value === "easy") gravity = 0.3;
  if (value === "normal") gravity = 0.4;
  if (value === "hard") gravity = 0.6;
}

function setSensitivity() {
  moveSpeed = Number(sensitivitySlider.value);
}

// Controles no PC
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft" || e.key === "a") keys.left = true;
  if (e.key === "ArrowRight" || e.key === "d") keys.right = true;
});
document.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft" || e.key === "a") keys.left = false;
  if (e.key === "ArrowRight" || e.key === "d") keys.right = false;
});

// Controles no celular
window.addEventListener("deviceorientation", (event) => {
  if (!gameStarted || paused) return;
  if (event.gamma > 10) { keys.right = true; keys.left = false; }
  else if (event.gamma < -10) { keys.left = true; keys.right = false; }
  else { keys.left = false; keys.right = false; }
});

// Criar plataforma
function createPlatform(x, y, type = "normal") {
  return { 
    x, y, width: 70, height: 15, type,
    dx: type === "moving" ? 2 : 0,
    hasSpring: Math.random() < 0.3,
    visible: true, timer: 0, alpha: 1, fadingOut: false, fadingIn: false
  };
}

// Iniciar jogo
function startGame() {
  player = { x: canvas.width/2-15, y: canvas.height-50, width:30, height:30, velocityY:0, jumpPower:-10, lastPlatform:null };
  platforms = [];
  let y = canvas.height-20;
  for(let i=0;i<10;i++){ platforms.push(createPlatform(Math.random()*(canvas.width-70),y)); y-=80; }
  score=0; cameraY=0; gameOver=false; gameStarted=true; paused=false;
  document.getElementById("menu").style.display="none";
  setDifficulty(); setSensitivity();
  gameLoop();
}

// Atualizar jogador
function updatePlayer() {
  if(keys.left) player.x -= moveSpeed;
  if(keys.right) player.x += moveSpeed;
  if(player.x+player.width<0) player.x=canvas.width;
  if(player.x>canvas.width) player.x=-player.width;

  player.velocityY += gravity;
  player.y += player.velocityY;

  platforms.forEach(p=>{
    if(!p.visible) return;
    if(player.x< p.x+p.width && player.x+player.width>p.x && player.y+player.height>p.y && player.y+player.height<p.y+p.height+10 && player.velocityY>0){
      if(p.hasSpring && player.x+player.width/2>p.x+p.width/2-10 && player.x+player.width/2<p.x+p.width/2+10){
        player.velocityY=-18;
      } else player.velocityY=player.jumpPower;
      if(player.lastPlatform!==p){ score++; player.lastPlatform=p; }
      if(p.type==="cloud") p.fadingOut=true;
    }
  });

  if(player.y-cameraY>canvas.height) gameOver=true;
  if(player.y<canvas.height/2-cameraY) cameraY=player.y-canvas.height/2;
}

// Atualizar plataformas
function updatePlatforms() {
  platforms.forEach(p=>{
    if(p.type==="moving"){ p.x+=p.dx; if(p.x<=0||p.x+p.width>=canvas.width) p.dx*=-1; }

    if(p.type==="cloud" && p.fadingOut){ p.alpha-=0.05; if(p.alpha<=0){ p.alpha=0; p.visible=false; p.fadingOut=false; p.timer=Date.now(); } }
    if(p.type==="cloud" && !p.visible){ if(Date.now()-p.timer>3000){ p.visible=true; p.fadingIn=true; } }
    if(p.type==="cloud" && p.fadingIn){ p.alpha+=0.05; if(p.alpha>=1){ p.alpha=1; p.fadingIn=false; } }
  });

  platforms=platforms.filter(p=>p.y-cameraY<canvas.height+100);

  while(platforms.length<10){
    let px=Math.random()*(canvas.width-70);
    let py=platforms[platforms.length-1].y-80;
    let types=(py<-2500)?["normal","moving","cloud"]:["normal","moving"];
    platforms.push(createPlatform(px,py,types[Math.floor(Math.random()*types.length)]));
  }
}

// Desenhar jogador
function drawPlayer(){ ctx.fillStyle="#ff0000"; ctx.fillRect(player.x,player.y-cameraY,player.width,player.height); }

// Desenhar plataformas
function drawPlatforms(){
  platforms.forEach(p=>{
    if(!p.visible && !p.fadingIn) return;
    ctx.save(); ctx.globalAlpha=p.alpha;
    if(p.type==="normal") ctx.fillStyle="#4caf50";
    if(p.type==="moving") ctx.fillStyle="#2196f3";
    if(p.type==="cloud") ctx.fillStyle="#ccc";
    ctx.fillRect(p.x,p.y-cameraY,p.width,p.height);
    if(p.hasSpring){ ctx.fillStyle="#000"; ctx.fillRect(p.x+p.width/2-10,p.y-12-cameraY,20,12); }
    ctx.restore();
  });
}

// Atualizar UI
function drawUI(){ document.getElementById("ui").innerText="Score: "+score; }

// Loop principal
function gameLoop(){
  if(!paused){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    if(!gameOver){
      updatePlayer();
      updatePlatforms();
      drawPlayer();
      drawPlatforms();
      drawUI();
      requestAnimationFrame(gameLoop);
    } else {
      document.getElementById("menu").style.display="flex";
      document.querySelector("#menu h1").innerText="Game Over - Score: "+score;
      document.querySelector("#menu button").innerText="Restart";
    }
  } else { requestAnimationFrame(gameLoop); }
}
