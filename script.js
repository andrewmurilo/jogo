const canvas=document.getElementById('gameCanvas');
const ctx=canvas.getContext('2d');

const ui=document.getElementById('ui');
const mainMenu=document.getElementById('mainMenu');
const pauseMenu=document.getElementById('pauseMenu');
const pauseTitle=document.getElementById('pauseTitle');
const bestScoreText=document.getElementById('bestScoreText');
const pauseBest=document.getElementById('pauseBest');

const startBtn=document.getElementById('startBtn');
const resumeBtn=document.getElementById('resumeBtn');
const restartBtn=document.getElementById('restartBtn');
const pauseBtn=document.getElementById('pauseBtn');

const difficultySel=document.getElementById('difficulty');
const sensitivitySlider=document.getElementById('sensitivity');
const pauseDifficulty=document.getElementById('pauseDifficulty');
const pauseSensitivity=document.getElementById('pauseSensitivity');

const leftBtn=document.getElementById('leftBtn');
const rightBtn=document.getElementById('rightBtn');

let gameStarted=false, paused=false, gameOver=false;
let score=0, bestScore=localStorage.getItem("bestScore")||0;
let cameraY=0;
let player, platforms;

const keys={left:false,right:false};

const config={
  moveSpeed:6,gravity:0.45,jump:-11,platformW:70,platformH:14,spawnGap:90
};

function setDifficulty(mode){
  if(mode==="easy"){config.gravity=0.35;config.jump=-12;config.spawnGap=80;}
  else if(mode==="hard"){config.gravity=0.55;config.jump=-10;config.spawnGap=100;}
  else{config.gravity=0.45;config.jump=-11;config.spawnGap=90;}
}

function createPlayer(x,y){return {x,y,w:30,h:30,vy:0};}
function createPlatform(x,y,type="normal"){
  return {x,y,w:config.platformW,h:config.platformH,type,hasSpring:Math.random()<0.25,visible:true,timer:0,dx:type==="moving"?2:0};
}

function buildWorld(){
  platforms=[];score=0;cameraY=0;
  const baseY=canvas.height-80;
  const p0=createPlatform((canvas.width-config.platformW)/2,baseY,"normal");
  p0.hasSpring=false;
  platforms=[p0];
  player=createPlayer(p0.x+(p0.w-30)/2,p0.y-30);
  let y=p0.y-config.spawnGap;
  for(let i=0;i<12;i++){
    let type="normal";
    if(Math.random()<0.25 && score>=2500) type="cloud";
    else if(Math.random()<0.25) type="moving";
    platforms.push(createPlatform(Math.random()*(canvas.width-config.platformW),y,type));
    y-=config.spawnGap;
  }
}

function updatePlayer(){
  if(keys.left)player.x-=config.moveSpeed*0.7;
  if(keys.right)player.x+=config.moveSpeed*0.7;
  if(player.x<-player.w)player.x=canvas.width;
  if(player.x>canvas.width)player.x=-player.w;
  player.vy+=config.gravity;
  player.y+=player.vy;

  for(const p of platforms){
    if(player.vy>0 && player.x+player.w>p.x && player.x<p.x+p.w && player.y+player.h>p.y && player.y+player.h<p.y+p.h+10 && p.visible){
      if(p.hasSpring){player.vy=config.jump*1.5;score+=3;}
      else{player.vy=config.jump;score++;}
    }
  }

  if(player.y-cameraY>canvas.height) endGame();
  const target=player.y-canvas.height*0.5;
  if(target<cameraY) cameraY=target;
}

function updatePlatforms(){
  platforms.forEach(p=>{
    if(p.type==="moving"){p.x+=p.dx;if(p.x<=0||p.x+p.w>=canvas.width)p.dx*=-1;}
    if(p.type==="cloud"){if(!p.visible){p.timer++;if(p.timer>120){p.visible=true;p.timer=0;}}}
  });
  platforms=platforms.filter(p=>p.y-cameraY<canvas.height+100);
  while(platforms.length<14){
    const highest=Math.min(...platforms.map(p=>p.y));
    let type="normal";
    if(Math.random()<0.25 && score>=2500) type="cloud";
    else if(Math.random()<0.25) type="moving";
    platforms.push(createPlatform(Math.random()*(canvas.width-config.platformW),highest-config.spawnGap,type));
  }
}

function draw(){
  ctx.fillStyle="#87ceeb";ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle="white";ctx.fillRect(player.x,player.y-cameraY,player.w,player.h);
  platforms.forEach(p=>{
    if(!p.visible) return;
    ctx.fillStyle=p.hasSpring?"#ffeb3b":p.type==="cloud"?"#ccc":p.type==="moving"?"#2196f3":"#4caf50";
    ctx.fillRect(p.x,p.y-cameraY,p.w,p.h);
    if(p.hasSpring){ctx.fillStyle="#000";ctx.fillRect(p.x+p.w/2-8,p.y-6-cameraY,16,6);}
  });
  ui.textContent="Score: "+score+" | Recorde: "+bestScore;
}

function loop(){if(gameStarted&&!paused&&!gameOver){updatePlayer();updatePlatforms();}draw();requestAnimationFrame(loop);}

function startGame(){setDifficulty(difficultySel.value);buildWorld();mainMenu.classList.add('hidden');pauseMenu.classList.add('hidden');gameStarted=true;paused=false;gameOver=false;}
function togglePause(){if(!gameStarted) return;paused=!paused;pauseMenu.classList.toggle('hidden',!paused);pauseDifficulty.value=difficultySel.value;pauseSensitivity.value=sensitivitySlider.value;pauseBest.textContent="Recorde: "+bestScore;}
function endGame(){paused=true;gameOver=true;if(score>bestScore){bestScore=score;localStorage.setItem("bestScore",bestScore);}pauseMenu.classList.remove('hidden');pauseTitle.textContent="💀 Game Over — Score: "+score;pauseBest.textContent="Recorde: "+bestScore;bestScoreText.textContent="Recorde: "+bestScore;}

startBtn.onclick=startGame;
pauseBtn.onclick=togglePause;
resumeBtn.onclick=()=>{paused=false;pauseMenu.classList.add('hidden');};
restartBtn.onclick=startGame;
difficultySel.onchange=()=>setDifficulty(difficultySel.value);
sensitivitySlider.oninput=()=>config.moveSpeed=+sensitivitySlider.value;
pauseDifficulty.onchange=()=>{difficultySel.value=pauseDifficulty.value;setDifficulty(pauseDifficulty.value);}
pauseSensitivity.oninput=()=>{sensitivitySlider.value=pauseSensitivity.value;config.moveSpeed=+pauseSensitivity.value;}
window.onkeydown=e=>{if(e.key==="ArrowLeft"||e.key==="a")keys.left=true;if(e.key==="ArrowRight"||e.key==="d")keys.right=true;if(e.key==="Escape")togglePause();}
window.onkeyup=e=>{if(e.key==="ArrowLeft"||e.key==="a")keys.left=false;if(e.key==="ArrowRight"||e.key==="d")keys.right=false;}

if(leftBtn&&rightBtn){
  [leftBtn,rightBtn].forEach(btn=>{
    btn.addEventListener("touchstart",e=>{e.preventDefault();keys[btn.id==="leftBtn"?"left":"right"]=true;},{passive:false});
    btn.addEventListener("touchend",()=>{keys[btn.id==="leftBtn"?"left":"right"]=false;});
  });
}

bestScoreText.textContent="Recorde: "+bestScore;
loop();
