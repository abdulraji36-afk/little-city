import {SIZE,CATALOG,GOALS,key,water,freshCity,stats,placement,build,tick,restore} from './engine.mjs';
import {THEMES,resolveTheme,paint} from './themes.mjs';
const $=id=>document.getElementById(id), SAVE_KEY='little-city-save-v1';
let city=freshCity(),restoredSave=false,selected=null,category='all',hover=null,focusTile=null,metrics,elapsed=0,lastFrame=0,toastTimer,view={zoom:window.innerWidth<600?1.85:1.08,panX:0,panY:0},pointer=null,dragging=false,w=0,h=0,originX=0,originY=0,scale=1,dpr=1,particles=[];
try{const saved=localStorage.getItem(SAVE_KEY);if(saved){city=restore(saved);restoredSave=true;}}catch(e){console.warn('City save could not be restored.',e.message);}
const UI_THEME_KEY='little-city-ui-theme-v1';
let uiTheme='modern',currentAdvice='';
try{uiTheme=resolveTheme(localStorage.getItem(UI_THEME_KEY));}catch{}
document.body.dataset.theme=uiTheme;
const canvas=$('cityCanvas'),TW=56,TH=28;
let ctx=canvas.getContext('2d');
const money=n=>'$'+Math.round(n).toLocaleString('en-US');
const icons={road:'road',home:'home',apartment:'home',shop:'work',factory:'work',park:'tree',school:'home',power:'power'};
const months=['March','April','May','June','July','August','September','October','November','December','January','February'];
const hash=(x,y,n=0)=>{const v=Math.sin(x*127.1+y*311.7+n*79.6)*43758.5453;return v-Math.floor(v);};
const p=(x,y,z=0)=>[(x-y)*TW/2,(x+y)*TH/2-z];
function poly(points,fill,stroke){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();if(fill){ctx.fillStyle=paint(fill,uiTheme);ctx.fill();}if(stroke){ctx.strokeStyle=paint(stroke,uiTheme);ctx.lineWidth=.6;ctx.stroke();}}
function line(points,color,width=1){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.strokeStyle=paint(color,uiTheme);ctx.lineWidth=width;ctx.lineCap='round';ctx.stroke();}
function prism(x,y,bw,bd,bh,colors,z=0){
  const c=typeof colors==='string'?[colors,colors,colors]:colors;
  poly([p(x,y+bd,z),p(x+bw,y+bd,z),p(x+bw,y+bd,z+bh),p(x,y+bd,z+bh)],c[1]);
  poly([p(x+bw,y,z),p(x+bw,y+bd,z),p(x+bw,y+bd,z+bh),p(x+bw,y,z+bh)],c[2]);
  poly([p(x,y,z+bh),p(x+bw,y,z+bh),p(x+bw,y+bd,z+bh),p(x,y+bd,z+bh)],c[0]);
}
function ellipse(x,y,rx,ry,color){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=paint(color,uiTheme);ctx.fill();}
function faceWindow(x,y,z,face='x',ww=.11,wh=5,color='#5f817e'){
  if(face==='x')poly([p(x,y,z),p(x,y+ww,z),p(x,y+ww,z+wh),p(x,y,z+wh)],color);
  else poly([p(x,y,z),p(x+ww,y,z),p(x+ww,y,z+wh),p(x,y,z+wh)],color);
}
function tree(x,y,size=1,variant=0){
  const [px,py]=p(x,y);ellipse(px+6*size,py+2*size,10*size,4*size,'#526f3b14');
  prism(x-.026*size,y-.026*size,.052*size,.052*size,14*size,['#947854','#947854','#7d6d4b']);
  const c=variant?['#99b476','#80a366','#71975f']:['#8ca868','#76995b','#648850'];
  if(variant===2){for(let i=0;i<3;i++){const z=10*size+i*6*size,r=(.26-i*.055)*size;poly([p(x-r,y-r,z),p(x+r,y-r,z),p(x+r,y+r,z),p(x-r,y+r,z)],c[0]);poly([p(x-r,y+r,z),p(x+r,y+r,z),p(x,y,z+15*size)],c[1]);poly([p(x+r,y-r,z),p(x+r,y+r,z),p(x,y,z+15*size)],c[2]);}}
  else{const z=20*size,r=9*size;ellipse(px,py-z,r*.95,r*1.06,c[0]);ellipse(px-r*.42,py-z+4*size,r*.8,r*.8,c[1]);ellipse(px+r*.46,py-z+4*size,r*.65,r*.85,c[2]);ellipse(px-2*size,py-z-5*size,r*.62,r*.64,c[0]);}
}
function shadow(x,y,bw=.7,bd=.7){poly([p(x+.1,y+.1),p(x+bw+.3,y+.1),p(x+bw+.55,y+bd+.18),p(x+.35,y+bd+.18)],'#3c54281b');}
function roof(x,y,bw,bd,z,color=['#d38a6d','#b66e59']){
 const a=p(x,y,z),b=p(x+bw,y,z),c=p(x+bw,y+bd,z),d=p(x,y+bd,z),r1=p(x+bw/2,y,z+13),r2=p(x+bw/2,y+bd,z+13);
 poly([a,d,r2,r1],color[0]);poly([b,c,r2,r1],color[1]);poly([d,c,r2],'#e7d5b2');line([r1,r2],'#b66e58',1);
}
function building(type,x,y,now=0){
 if(type==='home'){
  shadow(x+.1,y+.14);prism(x+.15,y+.15,.68,.68,23,['#f3e4c5','#eee0c3','#d4c3a3']);
  const roofs=hash(x,y)>.65?['#a8a993','#818c80']:['#d08a6e','#b76e56'];roof(x+.10,y+.1,.78,.78,23,roofs);
  faceWindow(x+.831,y+.3,8,'x',.13,7);faceWindow(x+.831,y+.62,7,'x',.12,8);faceWindow(x+.28,y+.831,8,'y',.13,7);
  poly([p(x+.57,y+.835),p(x+.72,y+.835),p(x+.72,y+.835,12),p(x+.57,y+.835,12)],'#a58a65');
  prism(x+.14,y+.87,.2,.1,3,['#afbd89','#8fa372','#7e9767']);prism(x+.66,y+.1,.1,.12,13,['#d8bd9d','#bda082','#a98a70'],24);
  tree(x+.12,y+.12,.4,1);
 }else if(type==='apartment'){
  shadow(x,y,.8,.8);prism(x+.13,y+.13,.75,.72,59,['#d3d6b9','#e7d8ad','#ccbf97']);prism(x+.1,y+.1,.81,.78,3,['#939d8a','#9fa48f','#7c8b79'],59);
  prism(x+.2,y+.25,.28,.3,5,['#a7b19b','#929e87','#7c8f79'],62);
  for(let z=10;z<55;z+=13){for(let v=.24;v<.8;v+=.23){faceWindow(x+.881,y+v,z,'x',.1,7,'#6c8987');faceWindow(x+v,y+.851,z,'y',.1,7,'#91a29a');}line([p(x+.13,y+.85,z-3),p(x+.88,y+.85,z-3)],'#ccb987',1);}
  faceWindow(x+.46,y+.851,0,'y',.18,12,'#7d8d79');
 }else if(type==='shop'){
  shadow(x+.04,y+.1);prism(x+.12,y+.15,.77,.71,24,['#c4d4cf','#dce4d2','#adc7be']);
  prism(x+.07,y+.1,.87,.81,5,['#8faeb0','#7d9ba2','#698f98'],24);
  faceWindow(x+.892,y+.26,4,'x',.2,13,'#6f9393');faceWindow(x+.892,y+.55,4,'x',.2,13,'#6f9393');
  faceWindow(x+.26,y+.862,3,'y',.17,14,'#779994');faceWindow(x+.56,y+.862,0,'y',.16,17,'#72918d');
  for(let i=0;i<6;i++)poly([p(x+.1+i*.14,y+.84,20),p(x+.24+i*.14,y+.84,20),p(x+.24+i*.14,y+1.02,15),p(x+.1+i*.14,y+1.02,15)],i%2?'#e9dcc0':'#c98c72');
  prism(x+.3,y+.29,.43,.18,4,['#f0e6ce','#e3d5b8','#d3c6a7'],29);
 }else if(type==='park'){
  prism(x+.04,y+.04,.92,.92,2,['#acc18c','#98ac7a','#8ca374']);
  poly([p(x+.13,y+.77,2),p(x+.24,y+.9,2),p(x+.9,y+.25,2),p(x+.76,y+.14,2)],'#e1d9b5');
  ellipse(...p(x+.52,y+.5,3),7,3.5,'#d5dcc3');ellipse(...p(x+.52,y+.5,4),5,2.5,'#a2c6c2');
  prism(x+.65,y+.72,.23,.085,3,['#b39264','#a17f55','#947047'],4);prism(x+.65,y+.8,.23,.03,4,['#ba9a6b','#b4956b','#907853'],5);
  tree(x+.23,y+.27,.73,1);tree(x+.77,y+.32,.62);tree(x+.26,y+.78,.5,1);
  for(let j=0;j<5;j++){const xx=x+.1+hash(x,j)*.15,yy=y+.5+hash(j,y)*.22;ellipse(...p(xx,yy,4),1.4,1.2,j%2?'#d9a678':'#ede1b2');}
 }else if(type==='power'){
  poly([p(x+.07,y+.07),p(x+.93,y+.07),p(x+.93,y+.93),p(x+.07,y+.93)],'#a9bb90');
  const [px,py]=p(x+.5,y+.5);line([[px,py],[px,py-60]],'#8b9d91',4);line([[px-1,py],[px-1,py-60]],'#e9eee0',2.5);
  const a=now*.0007+hash(x,y)*3;for(let i=0;i<3;i++){let aa=a+i*Math.PI*2/3;const vx=Math.cos(aa),vy=Math.sin(aa);poly([[px-vy*1.5,py-60+vx*1.5],[px+vx*26-vy*.6,py-60+vy*26+vx*.6],[px+vx*20+vy*2,py-60+vy*20-vx*2],[px+vy*2,py-60-vx*2]],'#f1f2e6');}
  ellipse(px,py-60,3,3,'#d2dbca');prism(x+.69,y+.58,.18,.24,10,['#d3d8c0','#b9c5a9','#a9b99d']);
 }else if(type==='factory'){
  shadow(x,y,.8,.8);prism(x+.08,y+.12,.85,.76,27,['#b99f87','#d2b798','#b69a7d']);
  for(let i=0;i<3;i++){prism(x+.13+i*.25,y+.15,.22,.67,6,['#a4aaa0','#92998f','#858f84'],27);}
  prism(x+.7,y+.18,.13,.14,32,['#b89f87','#baa184','#9e8169'],27);
  for(let v=.2;v<.8;v+=.23)faceWindow(x+v,y+.885,10,'y',.12,8,'#8d9b92');
  faceWindow(x+.932,y+.4,0,'x',.31,17,'#8b9485');line([p(x+.932,y+.4,5),p(x+.932,y+.71,5)],'#748477',1);
 }else if(type==='school'){
  shadow(x,y,.8,.8);prism(x+.08,y+.15,.84,.72,29,['#ead6b8','#ebd8b8','#c6b699']);roof(x+.04,y+.11,.92,.8,29,['#c08964','#a87657']);
  for(let v=.2;v<.82;v+=.22){faceWindow(x+v,y+.875,7,'y',.12,12,'#829b91');faceWindow(x+.925,y+v,8,'x',.12,12,'#748f86');}
  prism(x+.39,y+.4,.22,.21,45,['#e5d4b3','#e9d8b8','#c4b796']);roof(x+.36,y+.37,.28,.27,45,['#a78764','#8b745b']);
  const q=p(x+.51,y+.618,37);ellipse(q[0],q[1],3.2,3.2,'#f2eed9');line([[q[0],q[1]-2],[q[0],q[1]],[q[0]+1.5,q[1]+1]],'#8a926e',.6);
 }else if(type==='hall'){
  shadow(x-.02,y,1,1);prism(x+.04,y+.05,.92,.87,3,['#d8d7bd','#bfbea3','#acb398']);
  prism(x+.13,y+.12,.72,.67,30,['#e9dec2','#e6d9ba','#c6bea2'],3);
  prism(x+.08,y+.08,.82,.76,4,['#bac5b1','#a4b29d','#92a38d'],33);
  for(let i=0;i<3;i++)prism(x+.22+i*.2,y+.78,.07,.11,20,['#e6dfc8','#e5dcc2','#c6c4a8'],3);
  faceWindow(x+.853,y+.23,13,'x',.12,11,'#859a8b');faceWindow(x+.853,y+.53,13,'x',.12,11,'#859a8b');faceWindow(x+.4,y+.797,3,'y',.2,17,'#829282');
  poly([p(x+.1,y+.82,28),p(x+.9,y+.82,28),p(x+.5,y+.82,43)],'#ded8bd');poly([p(x+.1,y+.82,28),p(x+.5,y+.82,43),p(x+.5,y+.12,43),p(x+.1,y+.12,28)],'#b4c0a7');poly([p(x+.5,y+.12,43),p(x+.5,y+.82,43),p(x+.9,y+.82,28),p(x+.9,y+.12,28)],'#98ab94');
  const fl=p(x+.52,y+.48,42);line([fl,[fl[0],fl[1]-20]],'#7c8f70',1);poly([[fl[0],fl[1]-20],[fl[0]+10,fl[1]-16],[fl[0],fl[1]-12]],'#d9a76d');
 }
}
function drawRoad(x,y){
 const waterTile=water(x,y),t=waterTile?'#b6ad8c':'#b9bca9';
 poly([p(x+.05,y+.05,1),p(x+.95,y+.05,1),p(x+.95,y+.95,1),p(x+.05,y+.95,1)],t);
 const con=(dx,dy)=>city.tiles[key(x+dx,y+dy)]==='road';
 const road='#a1a79a';poly([p(x+.23,y+.23,1.2),p(x+.77,y+.23,1.2),p(x+.77,y+.77,1.2),p(x+.23,y+.77,1.2)],road);
 if(con(-1,0))poly([p(x,y+.23,1.2),p(x+.5,y+.23,1.2),p(x+.5,y+.77,1.2),p(x,y+.77,1.2)],road);
 if(con(1,0))poly([p(x+.5,y+.23,1.2),p(x+1,y+.23,1.2),p(x+1,y+.77,1.2),p(x+.5,y+.77,1.2)],road);
 if(con(0,-1))poly([p(x+.23,y,1.2),p(x+.77,y,1.2),p(x+.77,y+.5,1.2),p(x+.23,y+.5,1.2)],road);
 if(con(0,1))poly([p(x+.23,y+.5,1.2),p(x+.77,y+.5,1.2),p(x+.77,y+1,1.2),p(x+.23,y+1,1.2)],road);
 if(con(1,0)||con(-1,0))line([p(x+.35,y+.5,1.4),p(x+.65,y+.5,1.4)],'#d6d4b7',.75);
 if(con(0,1)||con(0,-1))line([p(x+.5,y+.35,1.4),p(x+.5,y+.65,1.4)],'#d6d4b7',.75);
 if(waterTile){line([p(x,y+.08,7),p(x+1,y+.08,7)],'#8c8e73',1.4);line([p(x,y+.92,7),p(x+1,y+.92,7)],'#8c8e73',1.4);}
}
function tile(x,y,now){
 const isWater=water(x,y),v=hash(x,y),edge=x===0||y===0||x===SIZE-1||y===SIZE-1;
 const palette=THEMES[uiTheme],color=isWater?palette.water[Math.floor(v*3)]:palette.land[Math.floor(v*5)];
 poly([p(x,y),p(x+1,y),p(x+1,y+1),p(x,y+1)],color,isWater?'#a2c6c1':'#c1cea020');
 if(isWater){if(v>.4){const z=1+Math.sin(now*.001+x+y)*.3;line([p(x+.3,y+.3,z),p(x+.65,y+.3,z)],'#c9dfd1',.7);if(v>.7)line([p(x+.55,y+.6,z),p(x+.8,y+.6,z)],'#c3dcd0',.6);}}
 else if(!city.tiles[key(x,y)]&&v>.44){for(let i=0;i<3;i++){const xx=x+.15+hash(x,y,i+3)*.7,yy=y+.15+hash(y,x,i+7)*.7;line([p(xx,yy),p(xx,yy,1.3)],v>.8?'#adb98b':'#b6c18f',.65);}}
 if(edge&&!isWater)line([p(x,y),p(x+1,y)],'#afbe8a35',.5);
}
function nature(x,y){
 if(city.tiles[key(x,y)]||water(x,y))return;
 const v=hash(x,y),outer=x<3||y<2||x>12||y>13;
 if(outer&&v>.6){tree(x+.3,y+.35,.7+v*.2,v>.85?2:0);if(v>.82)tree(x+.73,y+.72,.5,1);}
 else if(!outer&&v>.96)tree(x+.4,y+.5,.6,1);
 else if(v<.06){const [a,b]=p(x+.5,y+.5);ellipse(a,b,3.5,2,'#b0b997');poly([[a-3,b],[a-1,b-4],[a+2,b-3],[a+4,b]],'#c2c7ac');}
}
function badge(x,y,symbol,color){const [px,py]=p(x+.5,y+.5,60);ellipse(px,py,6,6,'#fff9e3');ctx.fillStyle=color;ctx.font='bold 8px sans-serif';ctx.textAlign='center';ctx.fillText(symbol,px,py+3);}
function draw(now){
 ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
 const bg=ctx.createRadialGradient(w*.45,h*.37,50,w*.45,h*.4,w*.8);bg.addColorStop(0,THEMES[uiTheme].sky[0]);bg.addColorStop(1,THEMES[uiTheme].sky[1]);ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
 ctx.save();ctx.translate(originX+view.panX,originY+view.panY);ctx.scale(scale,scale);
 // A quiet shadow gives the whole valley the feel of a little tabletop world.
 const corners=[p(0,0),p(SIZE,0),p(SIZE,SIZE),p(0,SIZE)];ctx.save();ctx.shadowColor='#70835416';ctx.shadowBlur=24;ctx.shadowOffsetY=15;poly(corners,'#c1cea0');ctx.restore();
 poly([p(0,SIZE),p(SIZE,SIZE),p(SIZE,SIZE,-9),p(0,SIZE,-9)],THEMES[uiTheme].edge[0]);poly([p(SIZE,0),p(SIZE,SIZE),p(SIZE,SIZE,-9),p(SIZE,0,-9)],THEMES[uiTheme].edge[1]);
 for(let sum=0;sum<SIZE*2-1;sum++)for(let x=0;x<SIZE;x++){const y=sum-x;if(y>=0&&y<SIZE)tile(x,y,now);}
 for(const [k,t]of Object.entries(city.tiles))if(t==='road'){const [x,y]=k.split(',').map(Number);drawRoad(x,y);}
 const active=hover||focusTile;
 for(let sum=0;sum<SIZE*2-1;sum++)for(let x=0;x<SIZE;x++){const y=sum-x;if(y<0||y>=SIZE)continue;const type=city.tiles[key(x,y)];
  if(type&&type!=='road')building(type,x,y,now);else nature(x,y);
  if(type&&type!=='road'&&type!=='hall'&&!metrics.connected.has(key(x,y)))badge(x,y,'!', '#b77b52');
  else if(type&&type!=='road'&&type!=='power'&&!metrics.powered)badge(x,y,'ϟ','#b59b50');
  if(active?.x===x&&active?.y===y){const invalid=selected&&placement(city,selected,x,y),fill=selected==='bulldoze'?'#d59c7659':invalid?'#c9886b55':'#f2f7db77';
   poly([p(x+.015,y+.015,2),p(x+.985,y+.015,2),p(x+.985,y+.985,2),p(x+.015,y+.985,2)],fill,selected==='bulldoze'||invalid?'#c4805a':'#f9ffeb');
   if(selected&&selected!=='bulldoze'&&!invalid){ctx.save();ctx.globalAlpha=.55;if(selected==='road')drawRoad(x,y);else building(selected,x,y,now);ctx.restore();}
  }
 }
 // Cars follow short stretches of the established road network.
 for(const car of [{x:5.2,y:8.38,dx:1.7,dy:0,c:'#d8bc80',o:0},{x:9.35,y:4,dx:0,dy:2,c:'#de9b7d',o:1.9},{x:10.1,y:8.61,dx:1.6,dy:0,c:'#dde2cd',o:3}]){
  const phase=(now*.00006+car.o)%1,xx=car.x+car.dx*phase,yy=car.y+car.dy*phase;
  if(city.tiles[key(Math.floor(xx),Math.floor(yy))]==='road')prism(xx,yy,.14,.21,3.5,[car.c,car.c,'#9ca28d'],2);
 }
 particles=particles.filter(v=>now-v.start<1400);for(const v of particles){const age=(now-v.start)/1400;const [px,py]=p(v.x+.5,v.y+.5,50+age*30);ctx.globalAlpha=1-age;ctx.fillStyle='#547546';ctx.font='600 11px sans-serif';ctx.textAlign='center';ctx.fillText('+'+CATALOG[v.type].name,px,py);}ctx.globalAlpha=1;
 ctx.restore();
 const dt=lastFrame?Math.min(now-lastFrame,1000):0;lastFrame=now;
 if(!city.paused&&!$('modal').open){elapsed+=dt*city.speed;if(elapsed>=10000){elapsed%=10000;advanceMonth();}}
 $('monthBar').style.width=elapsed/100+'%';
 requestAnimationFrame(draw);
}
function resize(){const r=canvas.getBoundingClientRect();w=r.width;h=r.height;dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);updateScale();}
function updateScale(){const availH=Math.max(180,h-170),fit=Math.min((w-48)/(SIZE*TW),availH/(SIZE*TH+65),1.55);scale=Math.max(.28,fit)*view.zoom;originX=w/2;originY=h*.52-SIZE*TH*scale/2;}
function screenTile(ev){const r=canvas.getBoundingClientRect(),sx=(ev.clientX-r.left-originX-view.panX)/scale,sy=(ev.clientY-r.top-originY-view.panY)/scale;
 const x=Math.floor(sy/TH+sx/TW),y=Math.floor(sy/TH-sx/TW);return x>=0&&x<SIZE&&y>=0&&y<SIZE?{x,y}:null;}
function toast(text,error=false){$('toast').textContent=text;$('toast').classList.toggle('error',error);$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),4200);}
function save(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(city));$('saveState').lastChild.textContent='All changes saved';}catch(e){$('saveState').lastChild.textContent='Playing without autosave';}}
function advanceMonth(){const result=tick(city);if(result.newGoals.length)toast(`${result.newGoals[0].name}! ${money(result.newGoals[0].reward)} grant received.`);renderUI();save();}
function renderUI(){
 metrics=stats(city);
 $('cityName').textContent=city.name;$('money').textContent=money(city.money);
 $('income').textContent=(metrics.income>=0?'+':'−')+money(Math.abs(metrics.income))+' / month';$('income').style.color=metrics.income>=0?'var(--accent)':'var(--gold)';
 $('hudPopulation').textContent=city.population.toLocaleString();$('hudCapacity').textContent='Room for '+metrics.capacity;
 $('happiness').innerHTML=metrics.happiness+'<span>%</span>';$('hudMood').textContent=metrics.happiness>=75?'Feeling good':metrics.happiness>=45?'Room to grow':'Needs some care';
 $('hudPower').innerHTML=metrics.used+'<span>/'+metrics.power+'</span>';$('hudEnergy').textContent=metrics.powered?'Power supplied':'More power needed';
 const gi=GOALS.findIndex((g,i)=>!city.claimed.includes(i)),g=GOALS[gi]||GOALS.at(-1),pct=Math.min(100,Math.floor(city.population/g.pop*100));
 $('goalName').textContent=gi<0?'Every milestone reached':g.name;$('goalProgress').textContent=Math.min(city.population,g.pop).toLocaleString()+' / '+g.pop.toLocaleString();$('goalBar').style.width=pct+'%';
 currentAdvice='A park or school brings a little more joy to everyday life.';
 if(!metrics.powered)currentAdvice='Your city needs more clean energy. Connect another wind turbine to your roads.';
 else if(metrics.capacity<=city.population+15)currentAdvice='Your homes are filling up. Build a cottage'+(city.population>=120?' or apartments':'')+' beside a road.';
 else if(metrics.jobs<city.population)currentAdvice='Your neighbors need places to work. Add a market or workshop beside a road.';
 else if(metrics.connected.size<Object.keys(city.tiles).length)currentAdvice='A building needs a road to City Hall. Look for the warning above disconnected buildings.';
 else if(city.population<120)currentAdvice='Build homes and markets along your roads. New neighbors arrive every month.';
 $('month').textContent=months[city.month%12]+', Year '+(Math.floor(city.month/12)+1);$('season').textContent=city.paused?'Game paused':city.month===0?'A fresh beginning':city.month%12<3?'Spring':city.month%12<6?'Summer':city.month%12<9?'Autumn':'Winter';
 $('pauseBtn').innerHTML=city.paused?'▶':'<span class="pause-glyph">Ⅱ</span>';$('pauseBtn').setAttribute('aria-label',city.paused?'Resume game':'Pause game');$('pauseBtn').classList.toggle('active',city.paused);$('speedBtn').textContent=city.speed+'×';
 renderBuildings();
}
function renderBuildings(){const list=$('buildingList'),previousScroll=list.scrollLeft;list.replaceChildren();
 const types=['road','home','apartment','shop','factory','park','school','power'];
 for(const type of types){const def=CATALOG[type];if(category!=='all'&&def.category!==category)continue;
  const locked=def.unlock&&city.population<def.unlock,button=document.createElement('button');button.className='building-card'+(selected===type?' active':'')+(locked?' locked':'');button.dataset.type=type;button.setAttribute('aria-label',`${def.name}, ${locked?'unlocks at '+def.unlock+' residents':money(def.cost)+', '+def.detail}`);button.setAttribute('aria-pressed',selected===type);button.title=def.description+' '+def.detail;button.innerHTML=`<canvas class="building-art" width="140" height="100" aria-hidden="true"></canvas><strong>${def.name}</strong><span class="building-price">${locked?'↗ '+def.unlock+' residents':money(def.cost)}</span><span class="building-key">${types.indexOf(type)+1}</span>`;
  button.addEventListener('click',()=>{if(locked){toast(`Welcome ${def.unlock} residents to unlock ${def.name.toLowerCase()}.`);return;}select(type);});list.append(button);drawThumbnail(button.querySelector('canvas'),type);
 }list.scrollLeft=previousScroll;
}
// Miniature building previews use the same geometry as the playable map.
function drawThumbnail(c,type){const cc=c.getContext('2d'),original=ctx;cc.translate(70,55);cc.scale(1.15,1.15);ctx=cc;
 try{if(type==='road'){prism(.04,.04,.92,.92,1,['#c4c8b4','#adb59d','#99a48d']);poly([p(.25,0,2),p(.75,0,2),p(.75,1,2),p(.25,1,2)],'#969e90');line([p(.5,.2,3),p(.5,.4,3)],'#dedcc4',1);line([p(.5,.6,3),p(.5,.8,3)],'#dedcc4',1);}else{cc.translate(0,type==='power'?20:type==='apartment'?15:3);building(type,0,0,0);}}
 finally{ctx=original;}
}
function select(type){selected=selected===type?null:type;canvas.classList.toggle('building',!!selected);$('bulldozeBtn').classList.toggle('active',selected==='bulldoze');$('bulldozeBtn').setAttribute('aria-pressed',selected==='bulldoze');
 $('buildHeading').textContent=selected==='bulldoze'?'A little room for a new idea.':selected?CATALOG[selected].name+' · '+money(CATALOG[selected].cost):'Your next great idea starts here.';
 $('buildInstruction').textContent=selected==='bulldoze'?'Click a building to remove it. Recover 30% of the cost.':selected?CATALOG[selected].detail+'. Click a tile to build.':'Choose a building, then a little patch of land.';renderBuildings();$('tileTooltip').hidden=true;setBuildOpen(false);updateSelection();
}
function perform(tile){if(!tile)return;if(!selected){const type=city.tiles[key(tile.x,tile.y)];if(type){const c=CATALOG[type],connected=metrics.connected.has(key(tile.x,tile.y));toast(c.name+' · '+c.detail+(connected?'':' · Needs a connected road'));}else toast('Open Build to choose a building, then click an empty tile.');return;}
 const type=selected,result=build(city,type,tile.x,tile.y);toast(result.message,!result.ok);if(result.ok){if(type!=='bulldoze'&&type!=='road')particles.push({...tile,type,start:performance.now()});renderUI();save();}
}
canvas.addEventListener('pointerdown',ev=>{if(ev.button!==0)return;pointer={id:ev.pointerId,x:ev.clientX,y:ev.clientY,panX:view.panX,panY:view.panY};dragging=false;canvas.setPointerCapture(ev.pointerId);});
canvas.addEventListener('pointermove',ev=>{
 if(pointer&&pointer.id===ev.pointerId){const dx=ev.clientX-pointer.x,dy=ev.clientY-pointer.y;if(Math.hypot(dx,dy)>5)dragging=true;if(dragging){view.panX=pointer.panX+dx;view.panY=pointer.panY+dy;canvas.classList.add('dragging');hover=null;$('tileTooltip').hidden=true;return;}}
 hover=screenTile(ev);focusTile=null;showTooltip(ev);
});
canvas.addEventListener('pointerup',ev=>{if(!pointer||pointer.id!==ev.pointerId)return;const moved=dragging;pointer=null;dragging=false;canvas.classList.remove('dragging');if(!moved)perform(screenTile(ev));});
canvas.addEventListener('pointercancel',()=>{pointer=null;dragging=false;canvas.classList.remove('dragging');});
canvas.addEventListener('pointerleave',()=>{if(!dragging){hover=null;$('tileTooltip').hidden=true;}});
function showTooltip(ev){const tip=$('tileTooltip');if(!hover||dragging){tip.hidden=true;return;}const type=city.tiles[key(hover.x,hover.y)];
 let title='',detail='';if(selected){const error=placement(city,selected,hover.x,hover.y);title=selected==='bulldoze'?'Bulldoze':CATALOG[selected].name;detail=error||(selected==='bulldoze'?'Click to remove · 30% refund':(selected==='road'&&water(hover.x,hover.y)?'$45 bridge':'Click to build · '+money(CATALOG[selected].cost)));}
 else if(type){title=CATALOG[type].name;detail=CATALOG[type].detail+(metrics.connected.has(key(hover.x,hover.y))?'':' · No road connection');}else{tip.hidden=true;return;}
 tip.replaceChildren();const a=document.createElement('strong'),b=document.createElement('span');a.textContent=title;b.textContent=detail;tip.append(a,b);tip.hidden=false;const r=canvas.getBoundingClientRect();tip.style.left=Math.max(8,Math.min(w-250,ev.clientX-r.left+15))+'px';tip.style.top=Math.max(w<950?163:105,Math.min(h-110,ev.clientY-r.top-55))+'px';
}
function zoom(amount){view.zoom=Math.max(.65,Math.min(2.5,view.zoom+amount));updateScale();}
canvas.addEventListener('wheel',ev=>{ev.preventDefault();zoom(ev.deltaY<0?.1:-.1);},{passive:false});
$('zoomIn').addEventListener('click',()=>zoom(.15));$('zoomOut').addEventListener('click',()=>zoom(-.15));$('fitView').addEventListener('click',()=>{view={zoom:window.innerWidth<600?1.85:1.08,panX:0,panY:0};updateScale();});
$('pauseBtn').addEventListener('click',()=>{city.paused=!city.paused;renderUI();save();});$('speedBtn').addEventListener('click',()=>{city.speed=city.speed%3+1;renderUI();save();});$('bulldozeBtn').addEventListener('click',()=>select('bulldoze'));
document.querySelectorAll('[data-category]').forEach(btn=>btn.addEventListener('click',()=>{category=btn.dataset.category;document.querySelectorAll('[data-category]').forEach(b=>{b.classList.toggle('active',b===btn);b.setAttribute('aria-selected',b===btn);});renderBuildings();}));
document.addEventListener('keydown',ev=>{if($('modal').open||ev.ctrlKey||ev.metaKey||ev.altKey||['INPUT','TEXTAREA'].includes(document.activeElement.tagName))return;
 if(ev.key==='Escape'){selected=null;select(null);hover=null;focusTile=null;closeFloatingPanels();setBuildOpen(false);}
 if(ev.key.toLowerCase()==='b')select('bulldoze');
 if(ev.key.toLowerCase()==='k')setBuildOpen($('buildDock').hidden);
 if(ev.key.toLowerCase()==='f')toggleFullscreen();
 if(/^[1-8]$/.test(ev.key)){const t=['road','home','apartment','shop','factory','park','school','power'][Number(ev.key)-1];if(CATALOG[t].unlock>city.population)toast('This building unlocks at '+CATALOG[t].unlock+' residents.');else select(t);}
 if(ev.code==='Space'&&(document.activeElement===canvas||document.activeElement===document.body)){ev.preventDefault();$('pauseBtn').click();}
 if(document.activeElement===canvas&&['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Enter'].includes(ev.key)){
  ev.preventDefault();focusTile??={x:9,y:9};hover=null;if(ev.key==='Enter'){perform(focusTile);return;}
  if(ev.key==='ArrowUp')focusTile.y=Math.max(0,focusTile.y-1);if(ev.key==='ArrowDown')focusTile.y=Math.min(SIZE-1,focusTile.y+1);if(ev.key==='ArrowLeft')focusTile.x=Math.max(0,focusTile.x-1);if(ev.key==='ArrowRight')focusTile.x=Math.min(SIZE-1,focusTile.x+1);
 }
});
function modal(html){closeFloatingPanels();$('modalContent').innerHTML=html;$('modal').showModal();$('tileTooltip').hidden=true;}
$('closeModal').addEventListener('click',()=>$('modal').close());$('modal').addEventListener('click',ev=>{if(ev.target===$('modal')){const r=$('modal').getBoundingClientRect();if(ev.clientX<r.left||ev.clientX>r.right||ev.clientY<r.top||ev.clientY>r.bottom)$('modal').close();}});
$('helpBtn').addEventListener('click',()=>{modal(`<div class="modal-eyebrow">A little guide</div><h2 class="modal-title">Good cities start<br>with little things.</h2><p class="modal-description">Welcome, Mayor. This little valley is yours to shape, one street at a time.</p><div class="help-steps"><div class="help-step"><span class="step-number">1</span><div><strong>Make a place to call home.</strong><p>Open Build to choose a building, then click an empty tile. Cottages welcome people; markets and workshops create jobs.</p></div></div><div class="help-step"><span class="step-number">2</span><div><strong>Keep everything connected.</strong><p>Buildings need an adjacent road that leads to City Hall. Wind turbines supply 12 buildings each. Roads can cross the river as bridges.</p></div></div><div class="help-step"><span class="step-number">3</span><div><strong>Let your little city grow.</strong><p>A month passes every 10 seconds at 1× speed. Residents arrive when there are homes, jobs, power, and happiness. Parks and schools lift spirits.</p></div></div></div><p class="modal-note">Drag the map to explore. Scroll to zoom. Keys 1–8 select buildings; B selects the bulldozer; Esc deselects. Focus the map and use arrow keys + Enter to build. Press K to open building tools and F for full screen. The UI style button switches between four looks. Progress saves in this browser.</p><button class="primary-button" id="startPlaying">Let's build something lovely <span>↗</span></button>`);$('startPlaying').onclick=()=>$('modal').close();});
$('renameBtn').addEventListener('click',()=>{modal('<div class="modal-eyebrow">Make it yours</div><h2 class="modal-title">Every city has a name.</h2><label class="modal-description" for="nameInput">What will you call your little corner of the world?</label><form id="renameForm"><input class="city-input" id="nameInput" maxlength="28" required autocomplete="off"><p class="modal-error" id="nameError"></p><button class="primary-button" type="submit">Save city name</button></form>');$('nameInput').value=city.name;$('nameInput').focus();$('nameInput').select();$('renameForm').onsubmit=ev=>{ev.preventDefault();const n=$('nameInput').value.trim();if(!n){$('nameError').textContent='Give your city a name first.';return;}city.name=n;renderUI();save();$('modal').close();toast('Welcome to '+city.name+'.');};});
$('mapNameBtn').addEventListener('click',()=>$('renameBtn').click());
$('cityReportBtn').addEventListener('click',()=>{const g=GOALS.find((v,i)=>!city.claimed.includes(i));modal(`<div class="modal-eyebrow">Your city, at a glance</div><h2 class="modal-title" id="reportTitle"></h2><div class="report-grid"><div><span>Residents / capacity</span><strong>${city.population} / ${metrics.capacity}</strong></div><div><span>Employment</span><strong>${metrics.employment}%</strong></div><div><span>Power use / supply</span><strong>${metrics.used} / ${metrics.power}</strong></div><div><span>Monthly balance</span><strong>${metrics.income>=0?'+':'−'}${money(Math.abs(metrics.income))}</strong></div></div><p class="modal-description">${g?g.description+' Reach this milestone to earn a '+money(g.reward)+' grant.':'Every milestone reached. Keep making it yours.'}</p><p class="modal-note" id="reportAdvice"></p><button class="primary-button" id="closeReport">Back to my city</button>`);$('reportTitle').textContent=city.name;$('reportAdvice').textContent=currentAdvice;$('closeReport').onclick=()=>$('modal').close();});
$('newCityBtn').addEventListener('click',()=>{modal(`<div class="modal-eyebrow">A fresh patch of possibility</div><h2 class="modal-title">Start a new little city?</h2><p class="modal-description">Your current city will be replaced. Start again with a small neighborhood and $3,200 to make something new.</p><button class="primary-button" id="confirmNewCity">Start a new city</button><button class="secondary-button" id="keepCity">Keep building this one</button>`);$('keepCity').onclick=()=>$('modal').close();$('confirmNewCity').onclick=()=>{city=freshCity();elapsed=0;view={zoom:window.innerWidth<600?1.85:1.08,panX:0,panY:0};selected=null;category='all';hover=null;focusTile=null;particles=[];document.querySelector('[data-category="all"]').click();select(null);updateScale();renderUI();save();$('modal').close();toast('A fresh start. Let’s build something lovely.');};});
function updateSelection(){
 $('clearSelection').hidden=!selected;
 $('buildToggleLabel').textContent=!$('buildDock').hidden?'Close building tools':selected==='bulldoze'?'Bulldoze mode':selected?CATALOG[selected].name:'Build your city';
}
function setBuildOpen(open){
 $('buildDock').hidden=!open;$('buildToggle').setAttribute('aria-expanded',String(open));document.body.classList.toggle('build-open',open);updateSelection();
 if(open)closeFloatingPanels();
}
function closeFloatingPanels(){
 $('stylePanel').hidden=true;$('gameMenu').hidden=true;$('styleBtn').setAttribute('aria-expanded','false');$('menuBtn').setAttribute('aria-expanded','false');
}
function setTheme(name,persist=true){
 uiTheme=resolveTheme(name);document.body.dataset.theme=uiTheme;$('activeThemeLabel').textContent=THEMES[uiTheme].name;
 document.querySelectorAll('[data-theme]').forEach(button=>{if(button===document.body)return;const active=button.dataset.theme===uiTheme;button.setAttribute('aria-pressed',String(active));const label=button.querySelector('.theme-selected');if(label)label.innerHTML=active?'Selected <b>✓</b>':'Use this style <b>↗</b>';});
 const meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.setAttribute('content',THEMES[uiTheme].sky[1]);
 if(persist)try{localStorage.setItem(UI_THEME_KEY,uiTheme);}catch{toast('Style applied. This browser could not save your preference.');}
 renderBuildings();
}
async function toggleFullscreen(){
 try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else toast('This browser does not support full-screen mode. The game still fills the window.');}
 catch{toast('Full-screen mode is unavailable in this window.');}
}
$('buildToggle').addEventListener('click',()=>setBuildOpen($('buildDock').hidden));$('closeBuild').addEventListener('click',()=>setBuildOpen(false));
$('clearSelection').addEventListener('click',()=>{selected=null;select(null);canvas.focus();});
$('styleBtn').addEventListener('click',()=>{const open=$('stylePanel').hidden;closeFloatingPanels();$('stylePanel').hidden=!open;$('styleBtn').setAttribute('aria-expanded',String(open));});
$('closeStyles').addEventListener('click',()=>{closeFloatingPanels();$('styleBtn').focus();});
$('menuBtn').addEventListener('click',()=>{const open=$('gameMenu').hidden;closeFloatingPanels();$('gameMenu').hidden=!open;$('menuBtn').setAttribute('aria-expanded',String(open));});
$('milestoneBtn').addEventListener('click',()=>$('cityReportBtn').click());
$('fullscreenBtn').addEventListener('click',toggleFullscreen);
if(!document.documentElement.requestFullscreen)$('fullscreenBtn').hidden=true;
// Native full-screen changes also happen when the player presses Escape.
document.addEventListener('fullscreenchange',()=>{$('fullscreenBtn').setAttribute('aria-label',document.fullscreenElement?'Exit full screen':'Enter full screen');$('fullscreenBtn').title=document.fullscreenElement?'Exit full screen (F)':'Full screen (F)';resize();});
document.querySelectorAll('.theme-card').forEach(button=>button.addEventListener('click',()=>setTheme(button.dataset.theme)));
document.addEventListener('pointerdown',ev=>{if(!$('stylePanel').hidden&&!$('stylePanel').contains(ev.target)&&!$('styleBtn').contains(ev.target)){$('stylePanel').hidden=true;$('styleBtn').setAttribute('aria-expanded','false');}if(!$('gameMenu').hidden&&!$('gameMenu').contains(ev.target)&&!$('menuBtn').contains(ev.target)){$('gameMenu').hidden=true;$('menuBtn').setAttribute('aria-expanded','false');}});
setTheme(uiTheme,false);setBuildOpen(false);
document.addEventListener('visibilitychange',()=>{lastFrame=0;if(document.hidden)save();});window.addEventListener('beforeunload',save);
new ResizeObserver(resize).observe(canvas);renderUI();resize();requestAnimationFrame(draw);save();
if(!restoredSave)setTimeout(()=>toast('Welcome, Mayor. Open Build to start your city. Try the four UI styles in the top corner.'),600);
