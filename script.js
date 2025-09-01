const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 360;
canvas.height = 640;

// Player
let player = { x: 180, y: 560, width: 40, height: 40, color: "#ff5722", velocityY: 0, gravity: 0.4, jumpPower: -10 };

// IA
let ia = { x: 100, y: 560, width: 40, height: 40, color: "#0000ff", velocityY: 0, gravity: 0.4, jumpPower: -10 };

// Plataformas
let platforms = [];
let score = 0;
let iaScore = 0;
let gameOver = false;
let falling = false;
let cameraY = 0;
let level = 1;
let unlockIA = false;
let faseIA = false;
let pontosInfinitos = false;

// HTML elementos
const startScreen = document.getElementById("startScreen");
const startSoloBtn = document.getElementById("startSolo");
const startIABtn = document.getElementById("startIA");
const restartBtn = document.getElementById("restartBtn");
const menuBtn = document.getElementById("menuBtn");

// Controles PC
let keys = { left: false, right: false };
document.addEventListener("keydown", e => { if(e.key==="ArrowLeft"||e.key==="a") keys.left=true; if(e.key==="ArrowRight"||e.key==="d") keys.right=true; });
document.addEventListener("keyup", e => { if(e.key==="ArrowLeft"||e.key==="a") keys.left=false; if(e.key==="ArrowRight"||e.key==="d") keys.right=false; });

// Controles celular (inclinação)
window.addEventListener("deviceorientation",(e)=>{ keys.right=e.gamma>5; keys.left=e.gamma<-5; });

// Iniciar Solo
startSoloBtn.addEventListener("click", ()=>{
    startScreen.style.display = "none";
    pontosInfinitos = true;
    resetGame();
    gameLoop();
});

// Iniciar IA
startIABtn.addEventListener("click", ()=>{
    startScreen.style.display = "none";
    faseIA = true; unlockIA = true;
    startFaseIA();
    gameLoop();
});

// Botão reiniciar
restartBtn.addEventListener("click", ()=>{
    if(faseIA) startFaseIA();
    else resetGame();
    restartBtn.style.display="none"; menuBtn.style.display="none";
    gameLoop();
});

// Botão menu inicial
menuBtn.addEventListener("click", ()=>{
    startScreen.style.display = "flex";
    restartBtn.style.display="none";
    menuBtn.style.display="none";
    faseIA = false;
    pontosInfinitos = false;
    resetGame();
});

// Criar plataforma
function createPlatform(x,y,type="normal") {
    return {
        x,
        y,
        width:70,
        height:15,
        type,
        dx:type==="moving"?2:0,
        timer:type==="temporary"?300:null,
        hasSpring:Math.random()<0.2 && type!=="temporary",
        springPressed:false,
        springScale:1,
        visited:false,
        targetY:y
    };
}

// Reset jogo normal
function resetGame() {
    player.x=180; player.y=560; player.velocityY=0;
    score=0; gameOver=false; falling=false; cameraY=0; level=1;
    platforms=[createPlatform(canvas.width/2-35, canvas.height-40, "normal")];
    for(let i=1;i<7;i++){
        let px=Math.random()*(canvas.width-70);
        let py=canvas.height-i*100;
        let types=["normal","moving","temporary"];
        platforms.push(createPlatform(px, py, types[Math.floor(Math.random()*types.length)]));
    }
    cameraY = 0;
    restartBtn.style.display="none";
    menuBtn.style.display="none";
    faseIA=false; unlockIA=false; pontosInfinitos=false;
}

// Iniciar fase IA
function startFaseIA(){
    faseIA=true; resetGame(); ia.x=100; ia.y=560; ia.velocityY=0; iaScore=0; gameOver=false; restartBtn.style.display="none"; menuBtn.style.display="none";
}

// Atualizar jogador
function updatePlayer(){
    if(falling) return;
    if(keys.left) player.x-=4; if(keys.right) player.x+=4;
    if(player.x+player.width<0) player.x=canvas.width; if(player.x>canvas.width) player.x=-player.width;
    player.velocityY+=player.gravity; player.y+=player.velocityY;

    platforms.forEach(p=>{
        if(player.x< p.x+p.width &&
           player.x+player.width>p.x &&
           player.y+player.height>p.y &&
           player.y+player.height<p.y+p.height+10 &&
           player.velocityY>0){

            if(p.type==="temporary"){ 
                p.timer--; 
                if(p.timer<=0) platforms=platforms.filter(pl=>pl!==p);
            }

            player.velocityY=player.jumpPower;
            if(p.hasSpring){ player.velocityY=-18; p.springPressed=true; }

            if(!p.visited){ score += 10; p.visited=true; }
        }
    });

    if(player.y-cameraY>canvas.height) falling=true;
    if(player.y - cameraY < canvas.height/2){ cameraY = player.y - canvas.height/2; }
}

// Atualizar IA
function updateIA(){
    let candidates = platforms.filter(p=>p.y<ia.y);
    if(candidates.length>0){
        let target = candidates.reduce((prev,curr)=>curr.y>prev.y?curr:prev,candidates[0]);
        if(ia.x+ia.width/2 < target.x+target.width/2) ia.x+=3;
        else if(ia.x+ia.width/2>target.x+target.width/2) ia.x-=3;
    }
    ia.velocityY+=ia.gravity; ia.y+=ia.velocityY;
    platforms.forEach(p=>{
        if(ia.x<p.x+p.width && ia.x+ia.width>p.x &&
           ia.y+ia.height>p.y && ia.y+ia.height<p.y+p.height+10 && ia.velocityY>0){
            ia.velocityY=ia.jumpPower; if(p.hasSpring) ia.velocityY=-18; iaScore++;
        }
    });
    if(ia.y-cameraY>canvas.height) gameOver=true;
}

// Atualizar plataformas
function updatePlatforms(){
    platforms.forEach(p=>{
        if(p.type==="moving"){ p.x+=p.dx; if(p.x<=0||p.x+p.width>=canvas.width) p.dx*=-1; }
        if(p.type==="temporary"){ p.timer--; if(p.timer<=0) platforms=platforms.filter(pl=>pl!==p); }
        if(p.hasSpring){
            if(p.springPressed){ p.springScale = Math.max(0.6, p.springScale - 0.1); if(p.springScale <= 0.6) p.springPressed=false; }
            else { p.springScale += 0.05; if(p.springScale>1) p.springScale=1; }
        }
        p.y += (p.targetY - p.y)*0.1;
    });
    spawnPlatforms();
}

// Spawn contínuo de plataformas
function spawnPlatforms() {
    while (platforms.length < 10) {
        let px = Math.random() * (canvas.width - 70);
        let minY = Math.min(...platforms.map(p => p.y));
        let py = minY - 80 - Math.random() * 40;
        let types;
        if (level === 1) types = ["normal", "normal", "moving"];
        else if (level === 2) types = ["normal", "moving", "temporary"];
        else types = ["moving", "temporary", "temporary"];
        let type = types[Math.floor(Math.random() * types.length)];
        platforms.push(createPlatform(px, py, type));
    }
}

// Desenhar jogador e IA
function drawEntities(){
    ctx.fillStyle=player.color; ctx.fillRect(player.x,player.y-cameraY,player.width,player.height);
    if(faseIA){ ctx.fillStyle=ia.color; ctx.fillRect(ia.x,ia.y-cameraY,ia.width,ia.height);}
}

// Desenhar plataformas
function drawPlatforms(){
    platforms.forEach(p=>{
        if(p.type==="normal") ctx.fillStyle="#4caf50";
        if(p.type==="moving") ctx.fillStyle="#2196f3";
        if(p.type==="temporary") ctx.fillStyle="#ff9800";
        ctx.fillRect(p.x,p.y-cameraY,p.width,p.height);
        if(p.hasSpring){
            let springHeight = 10 * p.springScale;
            ctx.fillStyle="#000";
            ctx.fillRect(p.x + p.width/2 -5, p.y - springHeight - cameraY, 10, springHeight);
        }
    });
}

// HUD
function drawHUD(){
    ctx.fillStyle="#000"; ctx.font="20px Arial";
    ctx.fillText("Score: "+Math.floor(score),10,30); 
    ctx.fillText("Level: "+level,10,55);
    if(falling){ ctx.fillStyle="red"; ctx.fillText("Caiu! Pontos diminuindo...",50,80); }
    if(faseIA){ ctx.fillStyle="#0000ff"; ctx.fillText("IA Score: "+iaScore,200,30);}
}

// Fundo
function drawBackground(){
    if(level===1) ctx.fillStyle="#e0f7fa";
    else if(level===2) ctx.fillStyle="#ffe0b2";
    else ctx.fillStyle="#d1c4e9";
    ctx.fillRect(0,0,canvas.width,canvas.height);
}

// Loop principal
function gameLoop(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    if(!gameOver){
        if(score>=500 && level===1) level=2;
        if(score>=1000 && level===2) level=3;
        if(!pontosInfinitos && score>=150000 && !faseIA){ unlockIA=true; gameOver=true; }

        drawBackground();
        if(!falling){ updatePlayer(); updatePlatforms(); if(faseIA) updateIA(); }
        else { score-=5; if(score<=0){ score=0; gameOver=true; } }

        drawEntities(); drawPlatforms(); drawHUD();
        requestAnimationFrame(gameLoop);
    }else{
        ctx.fillStyle="#000"; ctx.font="30px Arial";
        if(unlockIA && !faseIA){
            ctx.fillText("Parabéns! Fase IA desbloqueada!",10,canvas.height/2);
            restartBtn.style.display="block"; restartBtn.textContent="Jogar contra IA";
            menuBtn.style.display="block";
        }
        else if(faseIA){ 
            let winner = score>iaScore?"Você venceu!":"IA venceu!";
            ctx.fillText("Fim da Fase IA!",10,canvas.height/2-30);
            ctx.fillText("Seu Score: "+Math.floor(score),10,canvas.height/2);
            ctx.fillText("IA Score: "+iaScore,10,canvas.height/2+30);
            ctx.fillText(winner,10,canvas.height/2+60);
            restartBtn.style.display="block"; restartBtn.textContent="Reiniciar";
            menuBtn.style.display="block";
        } 
        else{
            ctx.fillText("Game Over",canvas.width/2-80,canvas.height/2);
            restartBtn.style.display="block"; restartBtn.textContent="Reiniciar";
            menuBtn.style.display="block";
        }
    }
}

// Iniciar
resetGame();
