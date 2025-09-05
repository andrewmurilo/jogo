const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const ui = document.getElementById('ui');
const mainMenu = document.getElementById('mainMenu');
const pauseMenu = document.getElementById('pauseMenu');
const pauseTitle = document.getElementById('pauseTitle');

const startBtn = document.getElementById('startBtn');
const resumeBtn = document.getElementById('resumeBtn');
const restartBtn = document.getElementById('restartBtn');
const pauseBtn = document.getElementById('pauseBtn');

const difficultySel = document.getElementById('difficulty');
const sensitivitySlider = document.getElementById('sensitivity');
const pauseDifficulty = document.getElementById('pauseDifficulty');
const pauseSensitivity = document.getElementById('pauseSensitivity');

const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');

let gameStarted = false, paused = false, gameOver = false;
let score = 0, cameraY = 0;
let player, platforms;

const keys = { left:false, right:false };

const config = {
  moveSpeed: 6,
  gravity: 0.45,
  jump: -11,
  superJump: -18,
  platformW: 70,
  platformH: 14,
  spawnGap: 90
};

function createPlayer(x,y){return {x,y,w:30,h:30,vy:0};}
function createPlatform(x,y){return {x,y,w:config.platformW,h:config.platformH};}

function buildWorld(){
  platforms=[];score=0;cameraY=0;
  const baseY=canvas.height-80;
  const p0=createPlatform((canvas.width-config.platformW)/2,baseY);
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
      player.vy=config.jump;
      score++;
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
  ctx.fillStyle="#fff";ctx.fillRect(player.x,player.y-cameraY,player.w,player.h);
  ctx.fillStyle="green";
  for(const p of platforms) ctx.fillRect(p.x,p.y-cameraY,p.w,p.h);
  ui.textContent="Score: "+score;
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
}

function endGame(){
  paused=true;gameOver=true;
  pauseMenu.classList.remove('hidden');
  pauseTitle.textContent="💀 Game Over — Score: "+score;
}

// === Events ===
startBtn.onclick=startGame;
pauseBtn.onclick=togglePause;
resumeBtn.onclick=()=>{paused=false;pauseMenu.classList.add('hidden');};
restartBtn.onclick=()=>{startGame();};

difficultySel.onchange=()=>{config.gravity=difficultySel.value==="easy"?0.35:difficultySel.value==="hard"?0.55:0.45;};
sensitivitySlider.oninput=()=>{config.moveSpeed=+sensitivitySlider.value;};
pauseDifficulty.onchange=()=>{difficultySel.value=pauseDifficulty.value;difficultySel.onchange();};
pauseSensitivity.oninput=()=>{sensitivitySlider.value=pauseSensitivity.value;sensitivitySlider.oninput();};

window.onkeydown=e=>{if(e.key==="ArrowLeft"||e.key==="a")keys.left=true;if(e.key==="ArrowRight"||e.key==="d")keys.right=true;if(e.key==="Escape")togglePause();};
window.onkeyup=e=>{if(e.key==="ArrowLeft"||e.key==="a")keys.left=false;if(e.key==="ArrowRight"||e.key==="d")keys.right=false;};

[leftBtn,rightBtn].forEach(btn=>{
  btn.addEventListener("touchstart",e=>{e.preventDefault();keys[btn.id==="leftBtn"?"left":"right"]=true;},{passive:false});
  btn.addEventListener("touchend",()=>{keys[btn.id==="leftBtn"?"left":"right"]=false;});
});

buildWorld();
loop();
