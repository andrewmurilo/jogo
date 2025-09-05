const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 360;
canvas.height = 640;

// UI
const ui = document.getElementById("ui");
const mainMenu = document.getElementById("mainMenu");
const pauseMenu = document.getElementById("pauseMenu");
const pauseTitle = document.getElementById("pauseTitle");
const startBtn = document.getElementById("startBtn");
const resumeBtn = document.getElementById("resumeBtn");
const restartBtn = document.getElementById("restartBtn");
const pauseBtn = document.getElementById("pauseBtn");
const fullscreenBtn = document.getElementById("fullscreenBtn");
const difficultySel = document.getElementById("difficulty");
const sensitivitySlider = document.getElementById("sensitivity");
const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");

const isMobile = /Mobi|Android/i.test(navigator.userAgent);

// Estado
let gameStarted = false, paused = false, gameOver = false;
let score = 0, cameraY = 0;
const keys = { left: false, right: false };
let player, platforms = [];

// Config
const config = {
  moveSpeed: 6, gravity: 0.42, jump: -11, superJump: -18,
  platformWidth: 70, platformHeight: 15, springChance: 0.25,
  spawnGap: 90
};

// Criar jogador e plataformas
function createPlayer(x,y){ return {x,y,w:32,h:32,vy:0,lastPlatform:null}; }
function createPlatform(x,y,type="normal"){
  return {x,y,w:config.platformWidth,h:config.platformHeight,type,
    dx:type==="moving"?2:0, hasSpring:Math.random()<config.springChance,
    visible:true,alpha:1};
}

function buildWorld(){
  platforms = [];
  score = 0; cameraY = 0;
  const p0 = createPlatform(canvas.width/2-35, canvas.height-60,"normal");
  p0.hasSpring=false;
  platforms.push(p0);
  player = createPlayer(p0.x+(p0.w-32)/2, p0.y-32);
  for(let i=1;i<8;i++){
    let px = Math.random()*(canvas.width-config.platformWidth);
    let py = canvas.height-i*config.spawnGap;
    let type = Math.random()<0.3?"moving":"normal";
    platforms.push(createPlatform(px,py,type));
  }
}

// Atualizar
function updatePlayer(){
  if(keys.left) player.x -= config.moveSpeed;
  if(keys.right) player.x += config.moveSpeed;
  if(player.x+player.w<0) player.x = canvas.width;
  if(player.x>canvas.width) player.x = -player.w;

  player.vy += config.gravity;
  player.y += player.vy;

  let onPlatform=false;
  for(const p of platforms){
    if(player.x<p.x+p.w && player.x+player.w>p.x &&
       player.y+player.h>p.y && player.y+player.h<p.y+p.h+10 &&
       player.vy>0){
      onPlatform=true;
      player.vy = p.hasSpring?config.superJump:config.jump;
      if(player.lastPlatform!==p){ score++; player.lastPlatform=p; }
    }
  }
  if(!onPlatform && player.y-cameraY>canvas.height) endGame();
  if(player.y<canvas.height/2-cameraY) cameraY = player.y-canvas.height/2;
}

function updatePlatforms(){
  for(const p of platforms){
    if(p.type==="moving"){ p.x+=p.dx; if(p.x<=0||p.x+p.w>=canvas.width)p.dx*=-1; }
  }
  platforms = platforms.filter(p=>p.y-cameraY<canvas.height+100);
  while(platforms.length<10){
    let px=Math.random()*(canvas.width-config.platformWidth);
    let py=platforms[platforms.length-1].y-config.spawnGap;
    let type=Math.random()<0.3?"moving":"normal";
    platforms.push(createPlatform(px,py,type));
  }
}

// Desenhar
function drawBackground(){ ctx.fillStyle="#7ec8ff"; ctx.fillRect(0,0,canvas.width,canvas.height); }
function drawPlayer(){ ctx.fillStyle="#ff5722"; ctx.fillRect(player.x,player.y-cameraY,player.w,player.h); }
function drawPlatforms(){
  for(const p of platforms){
    ctx.fillStyle = p.type==="moving"?"#2196f3":"#4caf50";
    ctx.fillRect(p.x,p.y-cameraY,p.w,p.h);
    if(p.hasSpring){ ctx.fillStyle="#000"; ctx.fillRect(p.x+p.w/2-8,p.y-12-cameraY,16,12); }
  }
}

// Fluxo
function loop(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  if(gameStarted && !paused && !gameOver){
    updatePlayer(); updatePlatforms();
  }
  drawBackground(); drawPlatforms(); if(player) drawPlayer();
  ui.textContent="Score: "+score;
  requestAnimationFrame(loop);
}

function startGame(){
  buildWorld(); mainMenu.classList.add("hidden");
  pauseMenu.classList.add("hidden"); gameStarted=true; paused=false; gameOver=false;
  if(isMobile) document.getElementById("controls").style.display="flex";
}

function endGame(){
  gameOver=true; paused=true;
  pauseMenu.classList.remove("hidden");
  pauseTitle.textContent="💀 Game Over | Score: "+score;
}

// Eventos
startBtn.onclick=startGame;
resumeBtn.onclick=()=>{paused=false; pauseMenu.classList.add("hidden");};
restartBtn.onclick=startGame;
pauseBtn.onclick=()=>{if(gameStarted){paused=!paused; pauseMenu.classList.toggle("hidden",!paused);}};
fullscreenBtn.onclick=()=>{if(isMobile) root.requestFullscreen();};

document.addEventListener("keydown",e=>{
  if(e.key==="ArrowLeft"||e.key==="a")keys.left=true;
  if(e.key==="ArrowRight"||e.key==="d")keys.right=true;
  if(e.key==="Escape")paused=!paused,pauseMenu.classList.toggle("hidden",!paused);
});
document.addEventListener("keyup",e=>{
  if(e.key==="ArrowLeft"||e.key==="a")keys.left=false;
  if(e.key==="ArrowRight"||e.key==="d")keys.right=false;
});

// Touch mobile
leftBtn.onmousedown=()=>keys.left=true;
leftBtn.onmouseup=()=>keys.left=false;
rightBtn.onmousedown=()=>keys.right=true;
rightBtn.onmouseup=()=>keys.right=false;

loop();
