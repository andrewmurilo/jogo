/* script.js */
/* Certifique-se de que o HTML contenha os elementos com os IDs usados abaixo. */

const config = {
    playerSpeed: 1.8,
    runSpeed: 3.1,
    enemySpeed: 1.6,
    enemyChaseSpeed: 2.2,
    enemyVisionAngle: Math.PI/3,
    enemyVisionDistance: 280,
    playerVisionRadius: 160,
    playerVisionFeather: 220,
    noiseBaseRadius: 160,
    noiseRunBonus: 110,
    damagePerSecond: 28,
    attackReach: 26,
    maxHealth: 100,
    investigateTime: 1800,
};

const gameState = {
    started:false,
    player: { x:420, y:320, angle:0, health:config.maxHealth, hasKey:false, isRunning:false, noiseLevel:0, hidden:false },
    enemy: {
        x:220, y:200, angle:0, state:'patrol',
        patrolPoints:[ {x:200,y:200},{x:640,y:200},{x:640,y:420},{x:200,y:420} ],
        currentPatrol:0, lastSeen:null, sinceInvestigate:0
    },
    objects:[
        {type:'key', x:560, y:360, r:10, collected:false},
        {type:'door', x:720, y:320, w:26, h:70, locked:true},
        {type:'furniture', x:300,y:210, w:90,h:46},
        {type:'furniture', x:520,y:410, w:70,h:70},
        {type:'furniture', x:220,y:360, w:56,h:34},
    ],
    walls:[
        {x:120,y:120,w:620,h:18},
        {x:120,y:120,w:18,h:420},
        {x:120,y:522,w:620,h:18},
        {x:722,y:120,w:18,h:420},
        {x:340,y:300,w:18,h:120},
    ],
    keys: { w:false,a:false,s:false,d:false, shift:false, space:false },
    mouse: { x:0, y:0 },
    lastTs: 0
};

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameStart = document.getElementById('gameStart');
const gameOver = document.getElementById('gameOver');
const gameWin = document.getElementById('gameWin');
const enemyAlert = document.getElementById('enemyAlert');
const healthFill = document.getElementById('healthFill');
const customCursor = document.getElementById('customCursor');
const noiseIndicators = [ 'noise1','noise2','noise3' ].map(id => document.getElementById(id));

function resize() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
}
resize();
addEventListener('resize', resize);

document.addEventListener('keydown', (e)=>{
    const k = e.key.toLowerCase();
    if (k==='w'||k==='a'||k==='s'||k==='d') gameState.keys[k]=true;
    if (k==='shift') gameState.keys.shift = true;
    if (k===' ') gameState.keys.space = true;
    if (k==='e') tryInteract();
});
document.addEventListener('keyup', (e)=>{
    const k = e.key.toLowerCase();
    if (k==='w'||k==='a'||k==='s'||k==='d') gameState.keys[k]=false;
    if (k==='shift') gameState.keys.shift = false;
    if (k===' ') gameState.keys.space = false;
});
document.addEventListener('mousemove', (e)=>{
    gameState.mouse.x = e.clientX;
    gameState.mouse.y = e.clientY;
    customCursor.style.left = e.clientX+'px';
    customCursor.style.top = e.clientY+'px';
});
document.addEventListener('click', ()=>{});

function startGame(){ gameState.started = true; if (gameStart) gameStart.style.display='none'; resetGame(); }
function restartGame(){ if (gameOver) gameOver.style.display='none'; if (gameWin) gameWin.style.display='none'; resetGame(); }
function resetGame(){
    Object.assign(gameState.player, { x:420,y:320,angle:0,health:config.maxHealth,hasKey:false,isRunning:false,noiseLevel:0,hidden:false });
    Object.assign(gameState.enemy, { x:220,y:200,angle:0,state:'patrol',currentPatrol:0,lastSeen:null,sinceInvestigate:0 });
    gameState.objects.forEach(o=>{
        if (o.type==='key') o.collected=false;
        if (o.type==='door') o.locked=true;
    });
    updateHealthBar();
}

function gameLoop(ts){
    if (!gameState.started){ requestAnimationFrame(gameLoop); return; }
    const dt = Math.min(40, (ts - (gameState.lastTs||ts))) / 1000;
    gameState.lastTs = ts;

    update(dt);
    render();

    requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);

function update(dt){
    faceMouse();
    movePlayer(dt);
    updateNoise();
    updateEnemy(dt);
    checkWin();
}

function faceMouse(){
    const p = gameState.player;
    const rect = canvas.getBoundingClientRect();
    const mx = gameState.mouse.x - rect.left;
    const my = gameState.mouse.y - rect.top;
    p.angle = Math.atan2(my - p.y, mx - p.x);
}

function movePlayer(dt){
    const p = gameState.player;
    let speed = config.playerSpeed;
    p.isRunning = false;
    if (gameState.keys.shift){ speed = config.runSpeed; p.isRunning = true; }

    let dx=0, dy=0;
    if (gameState.keys.w) { dy -= 1; }
    if (gameState.keys.s) { dy += 1; }
    if (gameState.keys.a) { dx -= 1; }
    if (gameState.keys.d) { dx += 1; }

    if (dx||dy){
        const len = Math.hypot(dx,dy);
        dx = dx/len * speed * (dt*60/60);
        dy = dy/len * speed * (dt*60/60);
        tryMove(p, dx, 0);
        tryMove(p, 0, dy);
    }

    if (gameState.keys.space){
        p.hidden = isNearFurniture(p.x, p.y, 26);
    } else {
        p.hidden = false;
    }
}

function tryMove(obj, dx, dy){
    const nx = obj.x + dx, ny = obj.y + dy;
    if (!collidesWithWalls(nx, ny, 10) && !collidesWithFurniture(nx, ny, 10)){
        obj.x = nx; obj.y = ny;
    }
}

function updateNoise(){
    const p = gameState.player;
    let level = 0;
    const moving = gameState.keys.w||gameState.keys.a||gameState.keys.s||gameState.keys.d;
    if (moving) level = p.isRunning ? 3 : 1;
    if (p.hidden) level = Math.max(0, level-1);
    p.noiseLevel = level;
    noiseIndicators.forEach((el,i)=>{
        if (!el) return;
        if (i<level) el.classList.add('active'); else el.classList.remove('active');
    });
}

function updateEnemy(dt){
    const e = gameState.enemy, p = gameState.player;
    const sees = canSeePlayer();
    const noiseRadius = config.noiseBaseRadius + (p.isRunning ? config.noiseRunBonus : 0);
    const hears = p.noiseLevel>0 && distance(e.x,e.y,p.x,p.y) < noiseRadius;

    if (sees){
        if (e.state!=='chase') flashAlert();
        e.state='chase';
        e.lastSeen = {x:p.x, y:p.y, t:performance.now()};
    } else if (hears){
        e.state='investigate';
        e.lastSeen = {x:p.x, y:p.y, t:performance.now()};
    }

    switch(e.state){
        case 'patrol': patrolBehavior(dt); break;
        case 'chase': chaseBehavior(dt); break;
        case 'investigate': investigateBehavior(dt); break;
        case 'attack': attackBehavior(dt); break;
    }
}

function patrolBehavior(dt){
    const e = gameState.enemy;
    const t = e.patrolPoints[e.currentPatrol];
    moveTowards(e, t.x, t.y, config.enemySpeed, dt);
    if (distance(e.x,e.y,t.x,t.y) < 10){
        e.currentPatrol = (e.currentPatrol+1) % e.patrolPoints.length;
    }
}

function chaseBehavior(dt){
    const e = gameState.enemy, p = gameState.player;
    moveTowards(e, p.x, p.y, config.enemyChaseSpeed, dt);
    if (distance(e.x,e.y,p.x,p.y) <= config.attackReach){
        e.state='attack';
    } else if (!canSeePlayer()){
        e.state='investigate';
        e.sinceInvestigate = 0;
    }
}

function investigateBehavior(dt){
    const e = gameState.enemy;
    if (!e.lastSeen){ e.state='patrol'; return; }
    moveTowards(e, e.lastSeen.x, e.lastSeen.y, config.enemySpeed, dt);
    e.sinceInvestigate += dt*1000;
    const arrived = distance(e.x,e.y,e.lastSeen.x,e.lastSeen.y) < 14;
    if (arrived || e.sinceInvestigate > config.investigateTime){
        e.state='patrol';
        e.lastSeen = null;
        e.sinceInvestigate = 0;
    }
    if (canSeePlayer()){
        e.state='chase';
    }
}

function attackBehavior(dt){
    const e = gameState.enemy, p = gameState.player;
    e.angle = Math.atan2(p.y - e.y, p.x - e.x);
    const dist = distance(e.x,e.y,p.x,p.y);
    if (dist > config.attackReach*1.2){
        e.state='chase'; return;
    }
    if (!p.hidden){
        const damage = config.damagePerSecond * dt;
        p.health = Math.max(0, p.health - damage);
        updateHealthBar();
        if (p.health<=0) endGame(false);
    }
}

function tryInteract(){
    const p = gameState.player;
    const key = gameState.objects.find(o=>o.type==='key' && !o.collected && distance(o.x,o.y,p.x,p.y) < 24);
    if (key){ key.collected = true; p.hasKey = true; p.noiseLevel = Math.max(p.noiseLevel,1); return; }
    const door = gameState.objects.find(o=>o.type==='door' && rectDist(p.x,p.y,o.x,o.y,o.w,o.h) < 18);
    if (door){
        if (p.hasKey){ door.locked = false; } else { p.noiseLevel = Math.max(p.noiseLevel,2); }
    }
}

function checkWin(){
    const p = gameState.player;
    const door = gameState.objects.find(o=>o.type==='door');
    if (!door.locked && rectDist(p.x,p.y,door.x,door.y,door.w,door.h) < 16){
        endGame(true);
    }
}

function endGame(win){
    gameState.started=false;
    if (win && gameWin) gameWin.style.display='block';
    if (!win && gameOver) gameOver.style.display='block';
}

function collidesWithRect(px,py, rx,ry,rw,rh, radius=10){
    const cx = Math.max(rx, Math.min(px, rx+rw));
    const cy = Math.max(ry, Math.min(py, ry+rh));
    return distance(px,py,cx,cy) < radius;
}
function collidesWithWalls(px,py, radius=10){ return gameState.walls.some(w => collidesWithRect(px,py,w.x,w.y,w.w,w.h, radius)); }
function collidesWithFurniture(px,py, radius=10){ return gameState.objects.some(o => o.type==='furniture' && collidesWithRect(px,py,o.x,o.y,o.w,o.h, radius)); }
function isNearFurniture(px,py, dist=24){ return gameState.objects.some(o => o.type==='furniture' && rectDist(px,py,o.x,o.y,o.w,o.h) < dist); }

function rectEdges(r){
    return [
        [r.x, r.y, r.x+r.w, r.y],
        [r.x+r.w, r.y, r.x+r.w, r.y+r.h],
        [r.x+r.w, r.y+r.h, r.x, r.y+r.h],
        [r.x, r.y+r.h, r.x, r.y],
    ];
}
function lineIntersectsWalls(x1,y1,x2,y2){
    const blockers = [
        ...gameState.walls.map(w=>({x:w.x,y:w.y,w:w.w,h:w.h})),
        ...gameState.objects.filter(o=>o.type==='furniture').map(o=>({x:o.x,y:o.y,w:o.w,h:o.h}))
    ];
    for (const r of blockers){
        for (const [ax,ay,bx,by] of rectEdges(r)){
            if (segmentsIntersect(x1,y1,x2,y2, ax,ay,bx,by)) return true;
        }
    }
    return false;
}
function segmentsIntersect(x1,y1,x2,y2, x3,y3,x4,y4){
    function ccw(ax,ay,bx,by,cx,cy){ return (cy-ay)*(bx-ax) > (by-ay)*(cx-ax); }
    return (ccw(x1,y1,x3,y3,x4,y4) !== ccw(x2,y2,x3,y3,x4,y4)) &&
           (ccw(x1,y1,x2,y2,x3,y3) !== ccw(x1,y1,x2,y2,x4,y4));
}
function distance(x1,y1,x2,y2){ return Math.hypot(x2-x1, y2-y1); }
function rectDist(px,py, rx,ry,rw,rh){
    const cx = Math.max(rx, Math.min(px, rx+rw));
    const cy = Math.max(ry, Math.min(py, ry+rh));
    return distance(px,py,cx,cy);
}

function canSeePlayer(){
    const e = gameState.enemy, p = gameState.player;
    if (p.hidden) return false;
    const dx = p.x - e.x, dy = p.y - e.y;
    const dist = Math.hypot(dx,dy);
    if (dist > config.enemyVisionDistance) return false;
    const dirToPlayer = Math.atan2(dy,dx);
    let delta = Math.abs(angleDiff(e.angle, dirToPlayer));
    if (delta > config.enemyVisionAngle/2) return false;
    if (lineIntersectsWalls(e.x,e.y, p.x,p.y)) return false;
    return true;
}
function angleDiff(a,b){
    let d = a-b;
    while (d>Math.PI) d-=2*Math.PI;
    while (d<-Math.PI) d+=2*Math.PI;
    return d;
}

function moveTowards(obj, tx,ty, speed, dt){
    const dx = tx - obj.x, dy = ty - obj.y;
    const dist = Math.hypot(dx,dy);
    if (dist>0.0001){
        const step = Math.min(dist, speed * (dt*60/60));
        const nx = obj.x + (dx/dist)*step;
        const ny = obj.y + (dy/dist)*step;
        if (!collidesWithWalls(nx, obj.y, 10) && !collidesWithFurniture(nx, obj.y, 10)) obj.x = nx;
        if (!collidesWithWalls(obj.x, ny, 10) && !collidesWithFurniture(obj.x, ny, 10)) obj.y = ny;
        obj.angle = Math.atan2(ty - obj.y, tx - obj.x);
    }
}

function updateHealthBar(){
    const pct = Math.max(0, gameState.player.health) / config.maxHealth * 100;
    if (healthFill) healthFill.style.width = pct+'%';
}
function flashAlert(){
    if (!enemyAlert) return;
    enemyAlert.style.display='block';
    setTimeout(()=> enemyAlert.style.display='none', 800);
}

function render(){
    const {width:W, height:H} = canvas;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0,0,W,H);
    ctx.fillStyle = '#111'; ctx.fillRect(110,110, 640,430);
    ctx.fillStyle = '#2b2b2b';
    gameState.walls.forEach(w=>{ ctx.fillRect(w.x,w.y,w.w,w.h); });

    gameState.objects.filter(o=>o.type==='furniture').forEach(o=>{
        ctx.fillStyle = '#3a3a3a'; ctx.fillRect(o.x,o.y,o.w,o.h);
        ctx.strokeStyle = '#555'; ctx.strokeRect(o.x+0.5,o.y+0.5,o.w-1,o.h-1);
    });

    const door = gameState.objects.find(o=>o.type==='door');
    if (door){ ctx.fillStyle = door.locked ? '#663300' : '#228822'; ctx.fillRect(door.x,door.y,door.w,door.h); ctx.strokeStyle='#000'; ctx.strokeRect(door.x+0.5,door.y+0.5,door.w-1,door.h-1); }

    const key = gameState.objects.find(o=>o.type==='key' && !o.collected);
    if (key){ ctx.beginPath(); ctx.fillStyle = '#ffd700'; ctx.arc(key.x, key.y, key.r, 0, Math.PI*2); ctx.fill(); }

    drawEnemyVision();
    drawCircle(gameState.enemy.x, gameState.enemy.y, 10, '#ff3333');
    const ex = gameState.enemy.x + Math.cos(gameState.enemy.angle)*12;
    const ey = gameState.enemy.y + Math.sin(gameState.enemy.angle)*12;
    drawCircle(ex,ey,3,'#ffffff');

    const p = gameState.player;
    drawCircle(p.x, p.y, 9, p.hidden ? '#888' : '#44aaff');
    const px = p.x + Math.cos(p.angle)*12;
    const py = p.y + Math.sin(p.angle)*12;
    drawCircle(px,py,3,'#ffffff');

    drawDarknessMask(p.x, p.y);

    ctx.font = '14px Arial'; ctx.fillStyle = '#fff'; ctx.textAlign='center';
    if (key && distance(p.x,p.y,key.x,key.y) < 26) ctx.fillText('Pressione [E] para pegar a chave', key.x, key.y-18);
    if (door && rectDist(p.x,p.y,door.x,door.y,door.w,door.h) < 24) ctx.fillText(door.locked ? 'Trancada. Precisa da chave [E]' : 'Abrir e sair [E]', door.x+door.w/2, door.y-10);
    if (isNearFurniture(p.x,p.y,26) && !p.hidden) ctx.fillText('Segure [ESPAÇO] para se esconder', p.x, p.y-16);
}

function drawCircle(x,y,r,color){ ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fillStyle=color; ctx.fill(); }
function drawEnemyVision(){
    const e = gameState.enemy;
    const ang1 = e.angle - config.enemyVisionAngle/2;
    const ang2 = e.angle + config.enemyVisionAngle/2;
    const r = config.enemyVisionDistance;
    const p1x = e.x + Math.cos(ang1)*r;
    const p1y = e.y + Math.sin(ang1)*r;
    const p2x = e.x + Math.cos(ang2)*r;
    const p2y = e.y + Math.sin(ang2)*r;
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = '#ff5555';
    ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(p1x,p1y); ctx.lineTo(p2x,p2y); ctx.closePath(); ctx.fill();
    ctx.restore();
}
function drawDarknessMask(cx, cy){
    const {width:W, height:H} = canvas;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.96)'; ctx.fillRect(0,0,W,H);
    const grd = ctx.createRadialGradient(cx, cy, Math.max(0, config.playerVisionRadius-30), cx, cy, config.playerVisionRadius+config.playerVisionFeather);
    grd.addColorStop(0, 'rgba(0,0,0,0)');
    grd.addColorStop(0.6, 'rgba(0,0,0,0.25)');
    grd.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.globalCompositeOperation = 'destination-in';
    ctx.fillStyle = grd; ctx.beginPath(); ctx.rect(0,0,W,H); ctx.fill();
    ctx.restore();
}

/* Inicialização pequena */
function init(){ /* placeholder */ }
init();
setTimeout(()=>resize(),50);
