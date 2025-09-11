const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 360;
canvas.height = 640;

let player = {
  x: canvas.width/2 -20,
  y: canvas.height-80,
  width:40,
  height:40,
  color:"#ff5722",
  velocityY:0,
  gravity:0.4,
  jumpPower:-10
};

let platforms=[];
let score=0;
let gameOver=false;
let cameraY=0;

// Botão restart
const restartBtn=document.getElementById('restartBtn');
restartBtn.addEventListener('click',()=>{ resetGame(); gameLoop(); });

// Controles PC
let keys={left:false,right:false};
document.addEventListener("keydown",(e)=>{
  if(e.key==='ArrowLeft'||e.key==='a') keys.left=true;
  if(e.key==='ArrowRight'||e.key==='d') keys.right=true;
});
document.addEventListener("keyup",(e)=>{
  if(e.key==='ArrowLeft'||e.key==='a') keys.left=false;
  if(e.key==='ArrowRight'||e.key==='d') keys.right=false;
});

// Controles Mobile
document.getElementById("leftBtn").addEventListener("touchstart",()=>keys.left=true);
document.getElementById("leftBtn").addEventListener("touchend",()=>keys.left=false);
document.getElementById("rightBtn").addEventListener("touchstart",()=>keys.right=true);
document.getElementById("rightBtn").addEventListener("touchend",()=>keys.right=false);

// Plataforma normal, móvel, temporária, nuvem
function createPlatform(x,y,type='normal'){
  return {
    x,y,
    width:70,height:15,
    type,
    dx:type==='moving'?2:0,
    timer:type==='temporary'?300:null,
    visible:type==='cloud'?true:null,
    alpha:type==='cloud'?1:null,
    cloudTimer:0
  };
}

// Resetar jogo
function resetGame(){
  player.x = canvas.width/2 -20;
  player.y = canvas.height-80;
  player.velocityY=0;
  score=0;
  gameOver=false;
  cameraY=0;

  platforms=[];
  platforms.push(createPlatform(canvas.width/2-35, canvas.height-40,'normal'));
  for(let i=1;i<7;i++){
    let px=Math.random()*(canvas.width-70);
    let py=canvas.height - i*100;
    let types=['normal','moving','temporary'];
    platforms.push(createPlatform(px,py,types[Math.floor(Math.random()*types.length)]));
  }
  restartBtn.style.display='none';
}

// Update Player
function updatePlayer(){
  if(keys.left) player.x -= 4;
  if(keys.right) player.x += 4;

  if(player.x+player.width<0) player.x=canvas.width;
  if(player.x>canvas.width) player.x=-player.width;

  player.velocityY+=player.gravity;
  player.y+=player.velocityY;

  platforms.forEach(p=>{
    if(p.type==='cloud'){
      if(p.visible && player.x < p.x + p.width && player.x + player.width > p.x &&
         player.y+player.height > p.y && player.y+player.height < p.y + p.height + 10 &&
         player.velocityY >0){
           player.velocityY=-10;
           p.visible=false;
           p.cloudTimer=180; //3 segundos
      }
      if(!p.visible){
        p.cloudTimer--;
        p.alpha=p.cloudTimer/180;
        if(p.cloudTimer<=0){ p.visible=true; p.alpha=1; }
      }
    } else {
      if(player.x < p.x + p.width && player.x + player.width > p.x &&
         player.y+player.height > p.y && player.y+player.height < p.y + p.height + 10 &&
         player.velocityY>0){
        if(p.type==='temporary'){ p.timer--; if(p.timer<=0) platforms=platforms.filter(pl=>pl!==p);}
        player.velocityY=-10;
      }
    }
  });

  if(player.y - cameraY > canvas.height) gameOver=true;
  if(player.y < canvas.height/2 - cameraY) cameraY=player.y - canvas.height/2;
}

// Update Platforms
function updatePlatforms(){
  platforms.forEach(p=>{
    if(p.type==='moving'){ p.x+=p.dx; if(p.x<=0||p.x+p.width>=canvas.width) p.dx*=-1; }
  });

  platforms=platforms.filter(p=>p.y - cameraY < canvas.height + 100);

  while(platforms.length<10){
    let px=Math.random()*(canvas.width-70);
    let py=platforms[platforms.length-1].y - 80;
    let types=['normal','moving','temporary'];
    if(score>150) types.push('cloud');
    let type=types[Math.floor(Math.random()*types.length)];
    platforms.push(createPlatform(px,py,type));
  }
}

// Draw
function drawPlayer(){ ctx.fillStyle=player.color; ctx.fillRect(player.x,player.y-cameraY,player.width,player.height); }

function drawPlatforms(){
  platforms.forEach(p=>{
    if(p.type==='normal') ctx.fillStyle='#4caf50';
    if(p.type==='moving') ctx.fillStyle='#2196f3';
    if(p.type==='temporary') ctx.fillStyle='#ff9800';
    if(p.type==='cloud') ctx.fillStyle=`rgba(255,255,255,${p.alpha})`;
    if(p.type!=='cloud' || p.visible) ctx.fillRect(p.x,p.y-cameraY,p.width,p.height);
  });
}

function drawScore(){ ctx.fillStyle='#000'; ctx.font='20px Arial'; ctx.fillText('Score: '+score,10,30); }

// Loop
function gameLoop(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  if(!gameOver){
    updatePlayer();
    updatePlatforms();
    drawPlatforms();
    drawPlayer();
    drawScore();
    score++;
    requestAnimationFrame(gameLoop);
  } else { restartBtn.style.display='block'; }
}

// Tela Inicial
const startScreen=document.getElementById('startScreen');
document.getElementById('startBtn').addEventListener('click',()=>{
  startScreen.style.display='none';
  canvas.style.display='block';
  document.getElementById('pauseBtn').style.display='block';
  resetGame();
  gameLoop();
});
