const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// UI
const ui = document.getElementById('ui');
const mainMenu = document.getElementById('mainMenu');
const pauseMenu = document.getElementById('pauseMenu');
const pauseTitle = document.getElementById('pauseTitle');
const bestScoreText = document.getElementById('bestScoreText');
const pauseBest = document.getElementById('pauseBest');

// Buttons
const startBtn = document.getElementById('startBtn');
const resumeBtn = document.getElementById('resumeBtn');
const restartBtn = document.getElementById('restartBtn');
const pauseBtn = document.getElementById('pauseBtn');

// Config options
const difficultySel = document.getElementById('difficulty');
const sensitivitySlider = document.getElementById('sensitivity');
const pauseDifficulty = document.getElementById('pauseDifficulty');
const pauseSensitivity = document.getElementById('pauseSensitivity');

// Mobile buttons
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');

// Game vars
let gameStarted = false, paused = false, gameOver = false;
let score = 0, bestScore = localStorage.getItem("bestScore") || 0;
let cameraY = 0;
let player, platforms;

const keys = { left:false, right:false };

const config = {
  moveSpeed: 6,
  gravity: 0.45,
  jump: -11,
  platformW: 70,
  platformH: 14,
  spawnGap: 90
};

function setDifficulty(mode){
  if(mode==="easy"){config.gravity=0.35;config.jump=-12;config.spawnGap=80;}
  else if(mode==="hard"){config.gravity=0.55;config.jump=-10;config.spawnGap=100;}
  else{config.gravity=0.45;config.jump=-11;config.spawnGap=90;}
}

function createPlayer(x,y){return {x,y,w:30,h:30,vy:0};}
function createPlatform(x,y){
  return {x,y,w:config.platformW,h:config.platformH,hasSpring:Math.random()<0.25};
}

function buildWorld(){
  platforms=[];score=0;cameraY=0;
  const baseY=canvas.height-80;
  const p0=createPlatform((canvas.width-config.platformW)/2,baseY);
  p0.hasSpring=false; // sempre start sem mola
  platforms=[p0];
  player=createPlayer(p0.x+(p0.w-30)/2,p0.y-30);

  let y=p0.y-config.spawnGap;
  for(let i=0;i<10;i++){
    const x=Math.random()*(canvas.width-config.platformW);
    platforms.push(createPlatform(x,y));
    y-=config.spawnGap;
  }
}

function updatePlayer(){
  if(keys.left) player.x-=config.moveSpeed*0.7;
  if(keys.right) player.x+=config.moveSpeed*0.7;

  if(player.x< -player.w) player.x=canvas.width;
  if(player.x>canvas.width) player.x=-player.w;

  player.vy+=config.gravity;
  player.y+=player.vy;

  for(const p of platforms){
    if(player.vy>0 &&
       player.x+player.w>p.x && player.x<p.x+p.w &&
       player.y+player.h>p.y && player.y+player.h<p.y+p.h+10){
      if(p.hasSpring){
        player.vy=config.jump*1.5; // super pulo
        score+=3; // pontos extras
      }else{
        player.vy=config.jump;
        score++;
      }
    }
  }

  if(player.y-cameraY>canvas.height) endGame();

  const target=player.y-canvas.height*0.5;
  if(target<cameraY) cameraY=target;
}

function updatePlatforms(){
  platforms=platforms.filter(p=>p.y-cameraY<canvas.height+100);
  while(platforms.length<12){
    const highest=Math.min(...platforms.map(p=>p.y));
    const x=Math.random()*(canvas.width-config.platformW);
    platforms.push(createPlatform(x,highest-config.spawnGap));
  }
}

function draw(){
  ctx.fillStyle="#87ceeb";ctx.fillRect(0,0,canvas.width,canvas.height);

  // Player
  ctx.fillStyle="white";
  ctx.fillRect(player.x,player.y-cameraY,player.w,player.h);

  // Plataformas
  for(const p of platforms){
    ctx.fillStyle=p.hasSpring?"#ff0":"green";
    ctx.fillRect(p.x,p.y-cameraY,p.w,p.h);
    if(p.hasSpring){
      ctx.fillStyle="#000";
      ctx.fillRect(p.x+p.w/2-8,p.y-6-cameraY,16,6);
    }
  }

  ui.textContent="Score: "+score+" | Recorde: "+bestScore;
}

function loop(){
  if(gameStarted&&!paused&&!gameOver){
    updatePlayer();
    updatePlatforms();
  }
  draw();
  requestAnimationFrame(loop);
}

function startGame(){
  setDifficulty(difficultySel.value);
  buildWorld();
  mainMenu.classList.add('hidden');
  pauseMenu.classList.add('hidden');
  gameStarted=true;paused=false;gameOver=false;
}

function togglePause(){
  if(!gameStarted) return;
  paused=!paused;
  pauseMenu.classList.toggle('hidden',!paused);
  pauseDifficulty.value=difficultySel.value;
  pauseSensitivity.value=sensitivitySlider.value;
  pauseBest.textContent="Recorde: "+bestScore;
}

function endGame(){
  paused=true;gameOver=true;
  if(score>bestScore){
    bestScore=score;
    localStorage.setItem("bestScore",bestScore);
  }
  pauseMenu.classList.remove('hidden');
  pauseTitle.textContent="💀 Game Over — Score: "+score;
  pauseBest.textContent="Recorde: "+bestScore;
  bestScoreText.textContent="Recorde: "+bestScore;
}

// === Events ===
startBtn.onclick=startGame;
pauseBtn.onclick=togglePause;
resumeBtn.onclick=()=>{paused=false;pauseMenu.classList.add('hidden');};
restartBtn.onclick=()=>{startGame();};

difficultySel.onchange=()=>{setDifficulty(difficultySel.value);};
sensitivitySlider.oninput=()=>{config.moveSpeed=+sensitivitySlider.value;};
pauseDifficulty.onchange=()=>{difficultySel.value=pauseDifficulty.value;setDifficulty(pauseDifficulty.value);};
pauseSensitivity.oninput=()=>{sensitivitySlider.value=pauseSensitivity.value;config.moveSpeed=+pauseSensitivity.value;};

window.onkeydown=e=>{if(e.key==="ArrowLeft"||e.key==="a")keys.left=true;if(e.key==="ArrowRight"||e.key==="d")keys.right=true;if(e.key==="Escape")togglePause();};
window.onkeyup=e=>{if(e.key==="ArrowLeft"||e.key==="a")keys.left=false;if(e.key==="ArrowRight"||e.key==="d")keys.right=false;};

[leftBtn,rightBtn].forEach(btn=>{
  btn.addEventListener("touchstart",e=>{e.preventDefault();keys[btn.id==="leftBtn"?"left":"right"]=true;},{passive:false});
  btn.addEventListener("touchend",()=>{keys[btn.id==="leftBtn"?"left":"right"]=false;});
});

// inicializa
bestScoreText.textContent="Recorde: "+bestScore;
buildWorld();
loop();
