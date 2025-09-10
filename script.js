const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 360;
canvas.height = 640;

// Screens
const startScreen = document.getElementById("startScreen");
const optionsScreen = document.getElementById("optionsScreen");
const startBtn = document.getElementById("startBtn");
const optionsBtn = document.getElementById("optionsBtn");
const backBtn = document.getElementById("backBtn");
const pauseBtn = document.getElementById("pauseBtn");
const restartBtn = document.getElementById("restartBtn");

// HUD
const hudControls = document.getElementById("hudControls");
const btnLeft = document.getElementById("btnLeft");
const btnRight = document.getElementById("btnRight");

// Flags
let gameRunning = false;
let gamePaused = false;
let isMobile = /Mobi|Android/i.test(navigator.userAgent);

// Options
let difficulty = "normal";
let sensitivity = 5;
let hudSize = 80;
let hudOpacity = 0.8;

// Player
let player = {x: 180, y: 560, width: 40, height: 40, vy:0, jumpForce:-12, gravity:0.5, speed:4, color:"red"};

// Plataformas
let platforms = [];
let score = 0;
let cameraY = 0;

// ==== Funções ====
function startGame(){
  startScreen.style.display="none";
  optionsScreen.style.display="none";
  canvas.style.display="block";
  pauseBtn.style.display="block";
  if(isMobile) hudControls.style.display="flex";
  gameRunning=true;
  resetGame();
  requestAnimationFrame(gameLoop);
}

function resetGame(){
  player.y=canvas.height-80;
  player.vy=0;
  score=0;
  cameraY=0;
  platforms=[{x:canvas.width/2-50, y:canvas.height-20, width:100, height:10, type:"normal"}];
  restartBtn.style.display="none";
}

// Plataformas aleatórias
function addPlatform(y){
  let types=["normal","moving","temporary"];
  if(score>=150) types.push("cloud");
  let type = types[Math.floor(Math.random()*types.length)];
  let p = {x:Math.random()*(canvas.width-70), y:y, width:70, height:15, type:type, dx:type==="moving"?2:0, timer:type==="temporary"?180:null, hasSpring:Math.random()<0.2 && type!=="temporary"};
  platforms.push(p);
  return p;
}

// Update player
function updatePlayer(){
  // Gravidade
  player.vy += player.gravity;
  player.y += player.vy;

  // Controles
  if(keys.left) player.x -= player.speed*sensitivity;
  if(keys.right) player.x += player.speed*sensitivity;

  // Teletransporte lateral
  if(player.x+player.width<0) player.x=canvas.width;
  if(player.x>canvas.width) player.x=-player.width;

  // Colisão com plataformas
  platforms.forEach(p=>{
    if(player.x< p.x+p.width && player.x+player.width>p.x && player.y+player.height>p.y && player.y+player.height<p.y+p.height+10 && player.vy>0){
      player.vy=player.jumpForce;
      if(p.hasSpring) player.vy=-18;
      if(p.type==="cloud"){
        setTimeout(()=>{},3000); // nuvem desaparece visual (vai atualizar na próxima frame)
      }
    }
  });

  // Câmera
  if(player.y<cameraY+canvas.height/2) cameraY=player.y-canvas.height/2;

  // Game over
  if(player.y>cameraY+canvas.height){
    gameRunning=false;
    pauseBtn.style.display="none";
    hudControls.style.display="none";
    restartBtn.style.display="block";
  }
}

// Update platforms
function updatePlatforms(){
  platforms.forEach(p=>{
    if(p.type==="moving"){
      p.x += p.dx;
      if(p.x<=0 || p.x+p.width>=canvas.width) p.dx*=-1;
    }
    if(p.type==="temporary"){
      p.timer--;
      if(p.timer<=0) platforms=platforms.filter(pl=>pl!==p);
    }
  });

  // Remover plataformas abaixo
  platforms = platforms.filter(p=>p.y-cameraY<canvas.height+100);

  // Adicionar novas
  while(platforms.length<10){
    addPlatform(platforms[platforms.length-1].y-80);
  }
}

// Draw
function draw(){
  // Fundo
  ctx.fillStyle=`hsl(${Math.min(240,score/2)},70%,80%)`;
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // Player
  ctx.fillStyle=player.color;
  ctx.fillRect(player.x, player.y-cameraY, player.width, player.height);

  // Plataformas
  platforms.forEach(p=>{
    if(p.type==="normal") ctx.fillStyle="#4caf50";
    if(p.type==="moving") ctx.fillStyle="#2196f3";
    if(p.type==="temporary") ctx.fillStyle="#ff9800";
    if(p.type==="cloud") ctx.fillStyle="#fff";
    ctx.fillRect(p.x,p.y-cameraY,p.width,p.height);

    if(p.hasSpring){
      ctx.fillStyle="black";
      ctx.fillRect(p.x+p.width/2-5,p.y-10-cameraY,10,10);
    }
  });

  // Pontuação
  ctx.fillStyle="black";
  ctx.font="20px Arial";
  ctx.fillText("Pontuação: "+score,10,30);
}

// Game loop
let keys={left:false,right:false};
function gameLoop(){
  if(!gameRunning || gamePaused) return;
  updatePlayer();
  updatePlatforms();
  draw();
  score++;
  requestAnimationFrame(gameLoop);
}

// Listeners
startBtn.addEventListener("click",startGame);
optionsBtn.addEventListener("click",()=>{startScreen.style.display="none"; optionsScreen.style.display="block";});
backBtn.addEventListener("click",()=>{optionsScreen.style.display="none"; startScreen.style.display="block";});
pauseBtn.addEventListener("click",()=>{gamePaused=!gamePaused; if(!gamePaused) requestAnimationFrame(gameLoop);});
restartBtn.addEventListener("click",startGame);

// HUD mobile
btnLeft.addEventListener("touchstart",()=>{keys.left=true;});
btnLeft.addEventListener("touchend",()=>{keys.left=false;});
btnRight.addEventListener("touchstart",()=>{keys.right=true;});
btnRight.addEventListener("touchend",()=>{keys.right=false;});

// Teclado PC
document.addEventListener("keydown",e=>{
  if(e.key==="ArrowLeft" || e.key==="a") keys.left=true;
  if(e.key==="ArrowRight" || e.key==="d") keys.right=true;
  if(e.key==="Escape") {gamePaused=!gamePaused; if(!gamePaused) requestAnimationFrame(gameLoop);}
});
document.addEventListener("keyup",e=>{
  if(e.key==="ArrowLeft" || e.key==="a") keys.left=false;
  if(e.key==="ArrowRight" || e.key==="d") keys.right=false;
});

// Options
document.getElementById("difficulty").addEventListener("change",e=>difficulty=e.target.value);
document.getElementById("sensitivity").addEventListener("input",e=>sensitivity=parseInt(e.target.value));
document.getElementById("hudSize").addEventListener("input",e=>{
  hudSize=parseInt(e.target.value);
  btnLeft.style.width=btnLeft.style.height=hudSize+"px";
  btnRight.style.width=btnRight.style.height=hudSize+"px";
});
document.getElementById("hudOpacity").addEventListener("input",e=>{
  hudOpacity=parseFloat(e.target.value);
  btnLeft.style.opacity=btnRight.style.opacity=hudOpacity;
});
