const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 360;
canvas.height = 640;

let isMobile = /Mobi|Android/i.test(navigator.userAgent);

let player = {x:canvas.width/2-20, y:canvas.height-80, width:40, height:40, color:"#ff5722", velocityY:0, gravity:0.4, jumpPower:-10, lastPlatform:null};
let platforms=[], score=0, gameOver=false, gameStarted=false, cameraY=0, paused=false, sensitivity=4, difficulty="normal";

// Botões
const restartBtn = document.getElementById("restartBtn");
const startBtn = document.getElementById("startBtn");
const pauseMobileBtn = document.getElementById("pauseMobileBtn");
const backBtn = document.getElementById("backBtn");
const resumeBtn = document.getElementById("resumeBtn");
const sensitivityInput = document.getElementById("sensitivity");
const pauseMenu = document.getElementById("pauseMenu");
const difficultyBtns = document.querySelectorAll(".difficultyBtn");

restartBtn.addEventListener("click",()=>{ resetGame(); gameLoop(); });
startBtn.addEventListener("click",()=>{ gameStarted=true; document.getElementById("startScreen").style.display="none"; resetGame(); gameLoop(); });
pauseMobileBtn.addEventListener("click",()=>{ paused=!paused; togglePauseMenu(); });
backBtn.addEventListener("click",()=>{ gameStarted=false; document.getElementById("startScreen").style.display="flex"; paused=false; pauseMenu.style.display="none"; });
resumeBtn.addEventListener("click",()=>{ paused=false; togglePauseMenu(); });
sensitivityInput.addEventListener("input",e=>sensitivity=parseInt(e.target.value));
difficultyBtns.forEach(btn=>btn.addEventListener("click",e=>{difficulty=e.target.dataset.level;}));

let keys = { left:false, right:false };
document.addEventListener("keydown",e=>{
  if(e.key==="ArrowLeft"||e.key==="a") keys.left=true;
  if(e.key==="ArrowRight"||e.key==="d") keys.right=true;
  if(e.key==="Escape"){ paused=!paused; togglePauseMenu(); }
});
document.addEventListener("keyup",e=>{
  if(e.key==="ArrowLeft"||e.key==="a") keys.left=false;
  if(e.key==="ArrowRight"||e.key==="d") keys.right=false;
});

window.addEventListener("deviceorientation", e=>{
  if(!gameStarted) return;
  if(e.gamma>5*sensitivity){ keys.right=true; keys.left=false; }
  else if(e.gamma<-5*sensitivity){ keys.left=true; keys.right=false; }
  else { keys.left=false; keys.right=false; }
});

function createPlatform(x,y,type="normal"){ 
  let hasSpring = Math.random()<0.25;
  return {x,y,width:70,height:15,type,dx:type==="moving"?2:0,hasSpring};
}

function resetGame(){
  player.x = canvas.width/2-20; player.y = canvas.height-80; player.velocityY=0; player.lastPlatform=null;
  score=0; gameOver=false; cameraY=0; paused=false;
  platforms=[];
  platforms.push(createPlatform(canvas.width/2-35,canvas.height-40,"normal"));
  for(let i=1;i<7;i++){
    let px=Math.random()*(canvas.width-70);
    let py=canvas.height-i*100;
    let types=["normal","moving"];
    platforms.push(createPlatform(px,py,types[Math.floor(Math.random()*types.length)]));
  }
  restartBtn.style.display="none";
  pauseMenu.style.display="none";
}

function togglePauseMenu(){ pauseMenu.style.display=paused?"block":"none"; }

function updatePlayer(){
  let moveSpeed=4;
  if(difficulty==="easy") moveSpeed=2;
  else if(difficulty==="hard") moveSpeed=6;

  if(keys.left) player.x-=sensitivity*moveSpeed;
  if(keys.right) player.x+=sensitivity*moveSpeed;
  if(player.x+player.width<0) player.x=canvas.width;
  if(player.x>canvas.width) player.x=-player.width;

  player.velocityY+=player.gravity;
  player.y+=player.velocityY;

  platforms.forEach(p=>{
    if(player.x<p.x+p.width && player.x+player.width>p.x && player.y+player.height>p.y && player.y+player.height<p.y+p.height+10 && player.velocityY>0){
      if(p.hasSpring){ player.velocityY=-18; }
      else { player.velocityY=player.jumpPower; }

      if(player.lastPlatform!==p){ score++; player.lastPlatform=p; }
      if(p.type==="cloud"){ platforms=platforms.filter(pl=>pl!==p); }
    }
  });

  if(player.y-cameraY>canvas.height){ gameOver=true; }

  if(player.y<canvas.height/2-cameraY) cameraY=player.y-canvas.height/2;
}

function updatePlatforms(){
  platforms.forEach(p=>{ if(p.type==="moving"){ p.x+=p.dx; if(p.x<=0||p.x+p.width>=canvas.width) p.dx*=-1; } });
  platforms=platforms.filter(p=>p.y-cameraY<canvas.height+100);

  let maxPlatforms = difficulty==="easy"?7:difficulty==="hard"?12:10;
  while(platforms.length<maxPlatforms){
    let px=Math.random()*(canvas.width-70);
    let py=platforms[platforms.length-1].y-80;
    let types=score>=250?["normal","moving","cloud"]:["normal","moving"];
    platforms.push(createPlatform(px,py,types[Math.floor(Math.random()*types.length)]));
  }
}

function drawPlayer(){ ctx.fillStyle=player.color; ctx.fillRect(player.x,player.y-cameraY,player.width,player.height); }

function drawPlatforms(){
  platforms.forEach(p=>{
    if(p.type==="normal") ctx.fillStyle="#4caf50";
    if(p.type==="moving") ctx.fillStyle="#2196f3";
    if(p.type==="cloud") ctx.fillStyle="#ccc";
    ctx.fillRect(p.x,p.y-cameraY,p.width,p.height);
    if(p.hasSpring){ ctx.fillStyle="#000"; ctx.fillRect(p.x+p.width/2-10,p.y-12-cameraY,20,12); }
  });
}

function drawScore(){ ctx.fillStyle="#000"; ctx.font="20px Arial"; ctx.fillText("Score: "+score,10,30); }

function gameLoop(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  if(!gameStarted) return;
  if(paused){ ctx.fillStyle="rgba(0,0,0,0.3)"; ctx.fillRect(0,0,canvas.width,canvas.height); requestAnimationFrame(gameLoop); return; }

  if(!gameOver){ updatePlayer(); updatePlatforms(); drawPlayer(); drawPlatforms(); drawScore(); requestAnimationFrame(gameLoop); }
  else { ctx.fillStyle="#000"; ctx.font="30px Arial"; ctx.fillText("Game Over",canvas.width/2-80,canvas.height/2); restartBtn.style.display="block"; }
}

