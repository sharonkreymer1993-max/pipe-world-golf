"use strict";
/* ---------- sound ---------- */
let AC=null,muted=false;
function ac(){if(!AC)AC=new (window.AudioContext||window.webkitAudioContext)();return AC}
function beep(f,d,type="square",v=.15,slide=0){
  if(muted)return;
  try{
    const a=ac(),o=a.createOscillator(),g=a.createGain();
    o.type=type;o.frequency.setValueAtTime(f,a.currentTime);
    if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,f+slide),a.currentTime+d);
    g.gain.setValueAtTime(v,a.currentTime);
    g.gain.exponentialRampToValueAtTime(.001,a.currentTime+d);
    o.connect(g).connect(a.destination);o.start();o.stop(a.currentTime+d);
  }catch(e){}
}
const S={
  hit:p=>beep(180+p*220,.12,"triangle",.2),
  wall:()=>beep(140,.07,"square",.1),
  shroom:()=>beep(420,.15,"square",.18,300),
  coin:()=>{beep(988,.08,"square",.12);setTimeout(()=>beep(1319,.14,"square",.12),70)},
  pipe:()=>beep(300,.3,"sawtooth",.12,-200),
  splash:()=>beep(220,.35,"sine",.2,-160),
  shell:()=>beep(110,.12,"sawtooth",.15),
  sink:()=>{[523,659,784,1047].forEach((f,i)=>setTimeout(()=>beep(f,.18,"triangle",.16),i*110))},
  fanfare:()=>{[392,523,659,784,1047].forEach((f,i)=>setTimeout(()=>beep(f,.22,"triangle",.16),i*130))}
};
