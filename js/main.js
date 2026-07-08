"use strict";
const cv=document.getElementById("cv"),ctx=cv.getContext("2d");
const W=960,H=600,BR=11;
const hLevel=document.getElementById("hLevel"),hStrokes=document.getElementById("hStrokes"),
      hCoins=document.getElementById("hCoins"),overlay=document.getElementById("overlay"),
      card=document.getElementById("card");

/* ---------- state ---------- */
let li=0,L=null,ball=null,strokes=0,coinsGot=0,totalCoins=0,totalStrokes=0;
let aiming=false,aim={x:0,y:0},moving=false,sunk=false,lastRest=null;
let pipeCool=0,particles=[],flagWave=0,shellsPos=[],t0=performance.now();

function loadLevel(i){
  li=i;L=LEVELS[i];
  ball={x:L.tee.x,y:L.tee.y,vx:0,vy:0};
  strokes=0;coinsGot=0;sunk=false;moving=false;aiming=false;pipeCool=0;
  lastRest={x:L.tee.x,y:L.tee.y};
  L._coins=L.coins.map(c=>({...c,got:false,ang:Math.random()*6}));
  particles=[];
  hud();
}
function hud(){
  hLevel.textContent=`שלב ${li+1} • ${L.name}`;
  hStrokes.textContent=`חבטות: ${strokes} / פאר ${L.par}`;
  hCoins.textContent=`🪙 ${totalCoins+coinsGot}`;
}

/* ---------- input ---------- */
function pt(e){
  const r=cv.getBoundingClientRect();
  return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height};
}
cv.addEventListener("pointerdown",e=>{
  if(sunk||moving||!overlay.classList.contains("hidden"))return;
  ac();
  aiming=true;aim=pt(e);cv.setPointerCapture(e.pointerId);
});
cv.addEventListener("pointermove",e=>{if(aiming)aim=pt(e)});
cv.addEventListener("pointerup",e=>{
  if(!aiming)return;aiming=false;
  const dx=ball.x-aim.x,dy=ball.y-aim.y,len=Math.hypot(dx,dy);
  if(len<12)return;
  const pw=Math.min(len,190)/190;
  ball.vx=dx/len*pw*17;ball.vy=dy/len*pw*17;
  moving=true;strokes++;totalStrokes++;S.hit(pw);hud();
});
document.getElementById("bRetry").onclick=()=>{totalCoins-= 0;loadLevel(li)};
document.getElementById("bMute").onclick=e=>{muted=!muted;e.target.textContent=muted?"🔇":"🔊"};

/* ---------- overlays ---------- */
document.getElementById("bStart").onclick=()=>{ac();overlay.classList.add("hidden");loadLevel(0)};
function stars(){return strokes<=L.par?3:strokes<=L.par+2?2:1}
function showLevelDone(){
  totalCoins+=coinsGot;
  const st=stars(),sTxt="⭐".repeat(st)+"☆".repeat(3-st);
  const last=li===LEVELS.length-1;
  if(last)S.fanfare();
  card.innerHTML=last?
    `<h1>🏆 סיימתם את כל השלבים!</h1>
     <p>סה"כ חבטות: <b>${totalStrokes}</b> &nbsp;•&nbsp; מטבעות: <b>🪙 ${totalCoins}</b></p>
     <div class="stars">${sTxt}</div>
     <p>כל הכבוד, אלופי הגולף! 🎉</p>
     <div class="btn" id="bNext">שחקו שוב מההתחלה</div>`
    :
    `<h1>⛳ שלב ${li+1} הושלם!</h1>
     <p>${strokes} חבטות (פאר ${L.par}) &nbsp;•&nbsp; 🪙 ${coinsGot} מטבעות</p>
     <div class="stars">${sTxt}</div>
     <div class="btn" id="bNext">לשלב הבא ←</div>`;
  overlay.classList.remove("hidden");
  document.getElementById("bNext").onclick=()=>{
    overlay.classList.add("hidden");
    if(last){totalStrokes=0;totalCoins=0;loadLevel(0)}else loadLevel(li+1);
  };
}

/* ---------- loop ---------- */
let last=performance.now();
function frame(now){
  const dt=Math.min(now-last,40);last=now;
  if(L)step(dt);
  draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
draw();
