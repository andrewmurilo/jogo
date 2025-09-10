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
let player = {x: 180, y: 560, width: 40, height: 40, vy:0, jumpForce:-12, gravity:0.4, speed:3.5, color:"red"};

// Plataformas
let platforms = [];
let score = 0;
let cameraY = 0;

// Controle
let keys = {left:false,right:false};
let lastPlatformY = 0;

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
  platforms=[];
  lastPlatformY = canvas.height - 20;
  // Plataforma inicial abaixo do jogador
  platforms.push({x:canvas.width/2-50, y:canvas.height-20, width:100, height:10, type:"normal", dx:0, timer:null, hasSpring:false});
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
        // sumir por 3s e reaparecer no mesmo lugar
        setTimeout(()=>{},3000);
      }
      if(player.y<lastPlatformY){ score++; lastPlatformY = player.y; }
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
  // Remover abaixo da tela
  platforms = platforms.filter(p=>p.y-cameraY<canvas.height+50);
  // Gerar novas plataformas
  while(platforms.length<10){
    addPlatform(platforms[platforms.length-1].y-80);
  }
}

// Draw
function draw(){
  // Fundo dinâmico
  let color1 = Math.min(255, 135 + Math.floor(cameraY/10));
  let color2 = Math.min(255, 255 - Math.floor(cameraY/15));
  ctx.fillStyle = `rgb(${color1},${color2},255)`;
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // Plataformas
  platforms.forEach(p=>{
    if(p.type==="normal") ctx.fillStyle="#4caf50";
    if(p.type==="moving") ctx.fillStyle="#2196f3";
    if(p.type==="temporary") ctx.fillStyle="#ff9800";
    if(p.type==="cloud") ctx.fillStyle="#fff";
    ctx.fillRect(p.x, p.y-cameraY, p.width, p.height);
    if(p.hasSpring){
      ctx.fillStyle="purple";
      ctx.fillRect(p.x+p.width/2-5, p.y-10-cameraY,10,10);
    }
  });

  // Player
  ctx.fillStyle=player.color;
  ctx.fillRect(player.x, player.y-cameraY, player.width, player.height);

  // Pontuação
  ctx.fillStyle="#000";
  ctx.font="20px Arial";
  ctx.fillText("Score: "+score,10,30);
}

// Game loop
function gameLoop(){
  if(gameRunning && !gamePaused){
    updatePlayer();
    updatePlatforms();
    draw();
    requestAnimationFrame(gameLoop);
  }
}

// ==== Eventos ====
startBtn.addEventListener("click", startGame);
optionsBtn.addEventListener("click",()=>{startScreen.style.display="none"; optionsScreen.style.display="flex";});
backBtn.addEventListener("click",()=>{optionsScreen.style.display="none"; startScreen.style.display="flex";});
restartBtn.addEventListener("click",()=>{startGame();});

pauseBtn.addEventListener("click",()=>{gamePaused=!gamePaused; if(gamePaused) alert("Jogo pausado. Ajuste opções."); requestAnimationFrame(gameLoop);});

// Controles PC
document.addEventListener("keydown",e=>{
  if(e.key==="ArrowLeft"||e.key==="a") keys.left=true;
  if(e.key==="ArrowRight"||e.key==="d") keys.right=true;
  if(e.key==="Escape"){ gamePaused=!gamePaused; if(gamePaused) alert("Jogo pausado. Ajuste opções."); requestAnimationFrame(gameLoop);}
});
document.addEventListener("keyup",e=>{
  if(e.key==="ArrowLeft"||e.key==="a") keys.left=false;
  if(e.key==="ArrowRight"||e.key==="d") keys.right=false;
});

// HUD celular
btnLeft.addEventListener("touchstart",()=>keys.left=true);
btnLeft.addEventListener("touchend",()=>keys.left=false);
btnRight.addEventListener("touchstart",()=>keys.right=true);
btnRight.addEventListener("touchend",()=>keys.right=false);
