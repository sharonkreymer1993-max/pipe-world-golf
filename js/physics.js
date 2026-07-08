"use strict";
/* ---------- helpers ---------- */
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function inRect(p,r,pad=0){return p.x>r.x-pad&&p.x<r.x+r.w+pad&&p.y>r.y-pad&&p.y<r.y+r.h+pad}
function circleRect(c,r,rad){
  const cx=Math.max(r.x,Math.min(c.x,r.x+r.w)),cy=Math.max(r.y,Math.min(c.y,r.y+r.h));
  const dx=c.x-cx,dy=c.y-cy,d=Math.hypot(dx,dy);
  if(d<rad&&d>0)return{nx:dx/d,ny:dy/d,pen:rad-d};
  if(d===0)return{nx:0,ny:-1,pen:rad};
  return null;
}
function spawnParts(x,y,color,n=10,sp=3){
  for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=Math.random()*sp+1;
    particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1,color});}
}

/* ---------- physics ---------- */
function step(dt){
  flagWave+=dt*.005;
  if(pipeCool>0)pipeCool-=dt;
  // shells
  shellsPos=L.shells.map(s=>{
    const t=(Math.sin(performance.now()*s.sp)+1)/2;
    return{x:s.x1+(s.x2-s.x1)*t,y:s.y1+(s.y2-s.y1)*t,r:s.r,
           vx:Math.cos(performance.now()*s.sp)*(s.x2-s.x1)*s.sp,dir:Math.sign(Math.cos(performance.now()*s.sp)*(s.x2-s.x1))};
  });
  particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.08;p.life-=.03});
  particles=particles.filter(p=>p.life>0);
  if(sunk)return;

  if(moving){
    let fr=.988;
    for(const s of L.sand)if(inRect(ball,s)){fr=.93;break}
    ball.vx*=fr;ball.vy*=fr;
    const sp=Math.hypot(ball.vx,ball.vy),sub=Math.max(1,Math.ceil(sp/6));
    for(let k=0;k<sub;k++){
      ball.x+=ball.vx/sub;ball.y+=ball.vy/sub;
      collide();
      if(sunk)return;
    }
    if(Math.hypot(ball.vx,ball.vy)<.06){
      ball.vx=ball.vy=0;moving=false;lastRest={x:ball.x,y:ball.y};
    }
  }
}
function collide(){
  // borders
  const M=28;
  if(ball.x<M+BR){ball.x=M+BR;ball.vx=Math.abs(ball.vx)*.75;S.wall()}
  if(ball.x>W-M-BR){ball.x=W-M-BR;ball.vx=-Math.abs(ball.vx)*.75;S.wall()}
  if(ball.y<M+BR){ball.y=M+BR;ball.vy=Math.abs(ball.vy)*.75;S.wall()}
  if(ball.y>H-M-BR){ball.y=H-M-BR;ball.vy=-Math.abs(ball.vy)*.75;S.wall()}
  // walls
  for(const w of L.walls){
    const h=circleRect(ball,w,BR);
    if(h){ball.x+=h.nx*h.pen;ball.y+=h.ny*h.pen;
      const d=ball.vx*h.nx+ball.vy*h.ny;
      if(d<0){ball.vx-=2*d*h.nx;ball.vy-=2*d*h.ny;ball.vx*=.75;ball.vy*=.75;
        if(Math.hypot(ball.vx,ball.vy)>1)S.wall()}}
  }
  // mushrooms
  for(const m of L.shrooms){
    const d=dist(ball,m);
    if(d<m.r+BR){
      const nx=(ball.x-m.x)/d,ny=(ball.y-m.y)/d;
      ball.x=m.x+nx*(m.r+BR);ball.y=m.y+ny*(m.r+BR);
      const dd=ball.vx*nx+ball.vy*ny;
      ball.vx-=2*dd*nx;ball.vy-=2*dd*ny;
      const sp=Math.hypot(ball.vx,ball.vy),want=Math.min(sp*1.5+3,18);
      if(sp>0){ball.vx*=want/sp;ball.vy*=want/sp}
      m.sq=1;S.shroom();spawnParts(ball.x,ball.y,"#ff5d5d",8,2);
    }
  }
  // shells
  for(const s of shellsPos){
    const d=dist(ball,s);
    if(d<s.r+BR&&d>0){
      const nx=(ball.x-s.x)/d,ny=(ball.y-s.y)/d;
      ball.x=s.x+nx*(s.r+BR+1);ball.y=s.y+ny*(s.r+BR+1);
      const dd=ball.vx*nx+ball.vy*ny;
      if(dd<0){ball.vx-=2*dd*nx;ball.vy-=2*dd*ny}
      ball.vx+=nx*4;ball.vy+=ny*4;
      S.shell();spawnParts(ball.x,ball.y,"#7bd36f",6,2);
    }
  }
  // pipes
  if(pipeCool<=0)for(const[pin,pout]of L.pipes){
    for(const[a,b]of[[pin,pout],[pout,pin]]){
      if(dist(ball,a)<26){
        S.pipe();spawnParts(a.x,a.y,"#4ce05e",12,3);
        ball.x=b.x;ball.y=b.y;pipeCool=600;
        spawnParts(b.x,b.y,"#4ce05e",12,3);
        return;
      }
    }
  }
  // coins
  for(const c of L._coins)if(!c.got&&dist(ball,c)<14+BR){
    c.got=true;coinsGot++;S.coin();spawnParts(c.x,c.y,"#ffd23f",12,3);hud();
  }
  // water
  for(const w of L.water)if(inRect(ball,w)){
    S.splash();spawnParts(ball.x,ball.y,"#7fd4ff",16,3);
    strokes++;hud();
    ball.x=lastRest.x;ball.y=lastRest.y;ball.vx=ball.vy=0;moving=false;
    return;
  }
  // hole
  const sp=Math.hypot(ball.vx,ball.vy);
  if(dist(ball,L.hole)<15&&sp<5.2){
    sunk=true;moving=false;S.sink();
    spawnParts(L.hole.x,L.hole.y,"#ffd23f",20,4);
    setTimeout(showLevelDone,800);
  }
}
