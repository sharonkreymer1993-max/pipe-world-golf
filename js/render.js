"use strict";
/* ---------- drawing ---------- */
const BALL_DIMPLES=[[-4,-2],[2,-4],[5,1],[-1,4],[-5,3],[3,5],[0,-6]];
function rr(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
function draw(){
  // grass
  const g=ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,"#63c257");g.addColorStop(1,"#4aa842");
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  ctx.fillStyle="rgba(255,255,255,.06)";
  for(let y=0;y<H;y+=48)for(let x=(y/48%2)*48;x<W;x+=96)ctx.fillRect(x,y,48,48);
  // border hedge
  ctx.fillStyle="#2f7d2a";
  rr(10,10,W-20,H-20,26);ctx.lineWidth=36;ctx.strokeStyle="#2f7d2a";ctx.stroke();
  ctx.lineWidth=4;ctx.strokeStyle="rgba(0,0,0,.25)";
  rr(28,28,W-56,H-56,16);ctx.stroke();
  if(!L)return;

  // sand
  for(const s of L.sand){
    ctx.fillStyle="#f0d98a";rr(s.x,s.y,s.w,s.h,18);ctx.fill();
    ctx.strokeStyle="#c9b25e";ctx.lineWidth=3;ctx.stroke();
    ctx.fillStyle="rgba(0,0,0,.07)";
    for(let i=0;i<5;i++)ctx.fillRect(s.x+12+i*((s.w-30)/5),s.y+s.h*.3+((i%2)*s.h*.3),s.w/9,4);
  }
  // water
  for(const w of L.water){
    ctx.fillStyle="#3fa9e8";rr(w.x,w.y,w.w,w.h,16);ctx.fill();
    ctx.strokeStyle="#2a7cb3";ctx.lineWidth=3;ctx.stroke();
    ctx.strokeStyle="rgba(255,255,255,.6)";ctx.lineWidth=2.5;
    const ph=performance.now()*.003;
    for(let i=0;i<3;i++){
      ctx.beginPath();
      for(let x=w.x+10;x<w.x+w.w-10;x+=6)
        ctx.lineTo(x,w.y+w.h*(.25+.25*i)+Math.sin(x*.08+ph+i)*3);
      ctx.stroke();
    }
  }
  // walls = brick blocks
  for(const b of L.walls){
    ctx.fillStyle="#c8722e";rr(b.x,b.y,b.w,b.h,6);ctx.fill();
    ctx.strokeStyle="#7c421a";ctx.lineWidth=3;ctx.stroke();
    ctx.strokeStyle="rgba(60,30,10,.4)";ctx.lineWidth=2;
    for(let y=b.y+22;y<b.y+b.h;y+=22){ctx.beginPath();ctx.moveTo(b.x,y);ctx.lineTo(b.x+b.w,y);ctx.stroke()}
    ctx.fillStyle="rgba(255,255,255,.25)";ctx.fillRect(b.x+3,b.y+3,b.w-6,5);
  }
  // pipes
  for(const pair of L.pipes)for(const p of pair)drawPipe(p.x,p.y);
  // hole + flag
  drawHole();
  // mushrooms
  for(const m of L.shrooms)drawShroom(m);
  // coins
  for(const c of L._coins)if(!c.got)drawCoin(c);
  // shells
  for(const s of shellsPos)drawShell(s);
  // aim line
  if(aiming&&!moving&&!sunk){
    const dx=ball.x-aim.x,dy=ball.y-aim.y,len=Math.hypot(dx,dy);
    if(len>12){
      const pw=Math.min(len,190)/190;
      ctx.setLineDash([]);
      for(let i=1;i<=8;i++){
        const t=i/8;
        ctx.beginPath();
        ctx.arc(ball.x+dx/len*pw*150*t,ball.y+dy/len*pw*150*t,5-t*3,0,7);
        ctx.fillStyle=`rgba(255,255,255,${.9-t*.6})`;ctx.fill();
      }
      // power bar
      ctx.fillStyle="rgba(0,0,0,.4)";rr(ball.x-30,ball.y+24,60,10,5);ctx.fill();
      ctx.fillStyle=pw>.75?"#ff5d5d":pw>.4?"#ffd23f":"#7be06f";
      rr(ball.x-28,ball.y+26,56*pw,6,3);ctx.fill();
    }
  }
  // ball
  if(!sunk)drawBall();
  // particles
  for(const p of particles){
    ctx.globalAlpha=p.life;ctx.fillStyle=p.color;
    ctx.beginPath();ctx.arc(p.x,p.y,4*p.life+1,0,7);ctx.fill();
  }
  ctx.globalAlpha=1;
}
function drawPipe(x,y){
  ctx.save();ctx.translate(x,y);
  // ground shadow
  ctx.beginPath();ctx.ellipse(2,4,22,15,0,0,7);
  ctx.fillStyle="rgba(0,0,0,.2)";ctx.shadowColor="rgba(0,0,0,.25)";ctx.shadowBlur=4;
  ctx.fill();ctx.shadowBlur=0;
  // dark hole with radial depth
  const holeG=ctx.createRadialGradient(0,2,2,0,0,20);
  holeG.addColorStop(0,"#0a1f0a");holeG.addColorStop(.7,"#132913");holeG.addColorStop(1,"rgba(0,0,0,.6)");
  ctx.beginPath();ctx.ellipse(0,0,20,14,0,0,7);ctx.fillStyle=holeG;ctx.fill();
  ctx.strokeStyle="rgba(255,255,255,.15)";ctx.lineWidth=1.5;ctx.stroke();
  // collar with metallic gradient
  const rimG=ctx.createLinearGradient(0,-16,0,-2);
  rimG.addColorStop(0,"#57d666");rimG.addColorStop(.45,"#2fa53a");rimG.addColorStop(1,"#1f7a29");
  ctx.fillStyle=rimG;rr(-26,-16,52,14,7);ctx.fill();
  ctx.strokeStyle="#0e5c18";ctx.lineWidth=3;ctx.stroke();
  // sheen highlight
  ctx.fillStyle="rgba(255,255,255,.4)";
  rr(-20,-14,14,5,3);ctx.fill();
  ctx.restore();
}
function drawHole(){
  const h=L.hole;
  ctx.beginPath();ctx.ellipse(h.x,h.y,17,13,0,0,7);ctx.fillStyle="#123312";ctx.fill();
  ctx.beginPath();ctx.ellipse(h.x,h.y,17,13,0,0,7);ctx.strokeStyle="rgba(255,255,255,.35)";ctx.lineWidth=2;ctx.stroke();
  // flag pole
  ctx.strokeStyle="#e8e8e8";ctx.lineWidth=4;
  ctx.beginPath();ctx.moveTo(h.x,h.y-4);ctx.lineTo(h.x,h.y-62);ctx.stroke();
  // waving flag
  const wv=Math.sin(flagWave)*4;
  ctx.beginPath();ctx.moveTo(h.x,h.y-62);
  ctx.quadraticCurveTo(h.x-18,h.y-58+wv,h.x-34,h.y-52+wv);
  ctx.quadraticCurveTo(h.x-18,h.y-48+wv*.5,h.x,h.y-42);
  ctx.closePath();ctx.fillStyle="#ff4d3d";ctx.fill();
  ctx.strokeStyle="#a32014";ctx.lineWidth=2;ctx.stroke();
}
function drawShroom(m){
  m.sq=Math.max(0,(m.sq||0)-.06);
  const sq=1-(m.sq||0)*.25;
  ctx.save();ctx.translate(m.x,m.y);ctx.scale(1+(m.sq||0)*.2,sq);
  // soft ground shadow
  ctx.beginPath();ctx.ellipse(0,m.r*.5,m.r*.95,m.r*.32,0,0,7);
  ctx.fillStyle="rgba(10,40,10,.25)";ctx.shadowColor="rgba(10,40,10,.3)";ctx.shadowBlur=5;
  ctx.fill();ctx.shadowBlur=0;
  // stem with soft gradient
  const stemG=ctx.createLinearGradient(-m.r*.55,0,m.r*.55,0);
  stemG.addColorStop(0,"#f3d9a8");stemG.addColorStop(.5,"#ffe9c9");stemG.addColorStop(1,"#e8c48f");
  ctx.fillStyle=stemG;rr(-m.r*.55,0,m.r*1.1,m.r*.8,8);ctx.fill();
  ctx.strokeStyle="rgba(150,110,60,.4)";ctx.lineWidth=1.5;ctx.stroke();
  // cap with radial shading (light source upper-left)
  const capG=ctx.createRadialGradient(-m.r*.3,-m.r*.5,m.r*.1,0,-m.r*.1,m.r*1.15);
  capG.addColorStop(0,"#ff8c7a");capG.addColorStop(.45,"#ff5d5d");capG.addColorStop(1,"#c93030");
  ctx.beginPath();ctx.arc(0,0,m.r,Math.PI,0);ctx.closePath();
  ctx.fillStyle=capG;ctx.fill();ctx.strokeStyle="#8f1f1f";ctx.lineWidth=2.5;ctx.stroke();
  // rim shadow where cap meets stem
  ctx.strokeStyle="rgba(80,20,20,.35)";ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(-m.r,0);ctx.lineTo(m.r,0);ctx.stroke();
  // spots
  ctx.fillStyle="#fff";
  ctx.beginPath();ctx.arc(-m.r*.45,-m.r*.35,m.r*.2,0,7);ctx.fill();
  ctx.beginPath();ctx.arc(m.r*.4,-m.r*.3,m.r*.16,0,7);ctx.fill();
  ctx.beginPath();ctx.arc(0,-m.r*.65,m.r*.14,0,7);ctx.fill();
  // rosy cheeks
  ctx.fillStyle="rgba(255,120,120,.35)";
  ctx.beginPath();ctx.ellipse(-m.r*.42,m.r*.42,m.r*.14,m.r*.09,0,0,7);ctx.fill();
  ctx.beginPath();ctx.ellipse(m.r*.42,m.r*.42,m.r*.14,m.r*.09,0,0,7);ctx.fill();
  // eyes with tiny highlight
  ctx.fillStyle="#333";
  ctx.beginPath();ctx.arc(-5,m.r*.32,2.6,0,7);ctx.fill();
  ctx.beginPath();ctx.arc(5,m.r*.32,2.6,0,7);ctx.fill();
  ctx.fillStyle="rgba(255,255,255,.85)";
  ctx.beginPath();ctx.arc(-5.8,m.r*.28,.8,0,7);ctx.fill();
  ctx.beginPath();ctx.arc(4.2,m.r*.28,.8,0,7);ctx.fill();
  ctx.restore();
}
function drawBall(){
  const x=ball.x,y=ball.y;
  // soft blurred ground shadow
  ctx.beginPath();ctx.ellipse(x,y+BR*.75,BR*1.05,BR*.5,0,0,7);
  ctx.fillStyle="rgba(10,30,10,.3)";ctx.shadowColor="rgba(10,30,10,.35)";ctx.shadowBlur=6;
  ctx.fill();ctx.shadowBlur=0;
  // sphere shading (light source upper-left)
  const grad=ctx.createRadialGradient(x-BR*.4,y-BR*.45,BR*.1,x,y,BR*1.1);
  grad.addColorStop(0,"#ffffff");grad.addColorStop(.5,"#f4f4f4");
  grad.addColorStop(.85,"#dcdcdc");grad.addColorStop(1,"#b9b9b9");
  ctx.beginPath();ctx.arc(x,y,BR,0,7);ctx.fillStyle=grad;ctx.fill();
  ctx.lineWidth=1.2;ctx.strokeStyle="rgba(110,110,110,.55)";ctx.stroke();
  // dimple texture, clipped inside the sphere
  ctx.save();
  ctx.beginPath();ctx.arc(x,y,BR-1.5,0,7);ctx.clip();
  ctx.fillStyle="rgba(0,0,0,.08)";
  for(const[dx,dy] of BALL_DIMPLES){ctx.beginPath();ctx.arc(x+dx,y+dy,1,0,7);ctx.fill()}
  ctx.restore();
  // specular highlight
  const hl=ctx.createRadialGradient(x-BR*.35,y-BR*.4,0,x-BR*.35,y-BR*.4,BR*.5);
  hl.addColorStop(0,"rgba(255,255,255,.95)");hl.addColorStop(1,"rgba(255,255,255,0)");
  ctx.beginPath();ctx.arc(x-BR*.35,y-BR*.4,BR*.5,0,7);ctx.fillStyle=hl;ctx.fill();
}
function drawCoin(c){
  c.ang+=.06;
  const w=Math.abs(Math.cos(c.ang))*10+2;
  ctx.save();ctx.translate(c.x,c.y);
  ctx.beginPath();ctx.ellipse(0,2,w,12,0,0,7);ctx.fillStyle="rgba(0,0,0,.2)";ctx.fill();
  ctx.beginPath();ctx.ellipse(0,0,w,12,0,0,7);
  ctx.fillStyle="#ffd23f";ctx.fill();ctx.strokeStyle="#c79a12";ctx.lineWidth=2.5;ctx.stroke();
  if(w>6){ctx.fillStyle="#c79a12";ctx.font="bold 13px Arial";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("★",0,1)}
  ctx.restore();
}
function drawShell(s){
  ctx.save();ctx.translate(s.x,s.y);
  ctx.beginPath();ctx.arc(0,4,s.r,0,7);ctx.fillStyle="rgba(0,0,0,.2)";ctx.fill();
  // shell body
  ctx.beginPath();ctx.arc(0,0,s.r,0,7);
  ctx.fillStyle="#3fae4c";ctx.fill();ctx.strokeStyle="#1c6b28";ctx.lineWidth=3;ctx.stroke();
  ctx.beginPath();ctx.arc(0,0,s.r*.62,0,7);ctx.fillStyle="#8fe08f";ctx.fill();
  ctx.strokeStyle="#1c6b28";ctx.lineWidth=2;
  for(let a=0;a<6;a++){ctx.beginPath();ctx.moveTo(0,0);
    ctx.lineTo(Math.cos(a*1.05)*s.r*.62,Math.sin(a*1.05)*s.r*.62);ctx.stroke()}
  // head
  const d=s.dir>=0?1:-1;
  ctx.beginPath();ctx.arc(d*s.r*.95,-2,s.r*.4,0,7);
  ctx.fillStyle="#ffe27a";ctx.fill();ctx.strokeStyle="#b98d1e";ctx.lineWidth=2;ctx.stroke();
  ctx.fillStyle="#333";ctx.beginPath();ctx.arc(d*s.r*1.05,-4,2.4,0,7);ctx.fill();
  ctx.restore();
}
