export const SIZE = 18;
export const CATALOG = {
  road: { name:'Road', category:'utility', cost:15, upkeep:0, description:'Connect your neighborhood to City Hall. Roads over water become bridges.', detail:'Connects buildings', color:'#777c71' },
  home: { name:'Cottage', category:'homes', cost:180, upkeep:3, capacity:24, description:'A little roof, a front garden, and room to put down roots.', detail:'24 residents', color:'#cf775e' },
  apartment: { name:'Apartments', category:'homes', cost:520, upkeep:8, capacity:96, unlock:120, description:'More neighbors, more stories. A compact home for a growing city.', detail:'96 residents', color:'#dfbd79' },
  shop: { name:'Market', category:'work', cost:250, upkeep:5, jobs:24, description:'Fresh bread, friendly faces, and local jobs around the corner.', detail:'24 jobs · +$25 / month', color:'#739cab' },
  factory: { name:'Workshop', category:'work', cost:450, upkeep:9, jobs:56, description:'Give your makers a place to work. Industry brings jobs and a little pollution.', detail:'56 jobs · +$50 / month', color:'#b18d76' },
  park: { name:'Pocket park', category:'life', cost:120, upkeep:3, description:'A patch of green that makes the whole city a little happier.', detail:'+6 happiness', color:'#81a575' },
  school: { name:'School', category:'life', cost:450, upkeep:12, unlock:80, description:'Big futures begin in little classrooms. A happier, better educated city.', detail:'+10 happiness · 12 jobs', jobs:12, color:'#c78e64' },
  power: { name:'Wind turbine', category:'utility', cost:300, upkeep:6, description:'A fresh breeze powers up to 12 connected buildings. Clean energy for your city.', detail:'+12 power capacity', color:'#92b4a5' },
  hall: { name:'City Hall', category:'life', cost:0, upkeep:0, jobs:24, description:'The heart of your city. All roads lead back here.', detail:'24 civic jobs', color:'#d9ccb1' }
};
export const GOALS = [
  {pop:120,name:'A place to call home',description:'Welcome 120 residents to your city.',reward:600},
  {pop:250,name:'A thriving neighborhood',description:'Grow your little town to 250 residents.',reward:1000},
  {pop:500,name:'Small city, big heart',description:'Make a home for 500 residents.',reward:1600},
  {pop:1000,name:'Your very own metropolis',description:'Reach 1,000 residents. What a journey!',reward:2500}
];
export const key = (x,y) => x+','+y;
export function water(x,y) { const bank=15.1+Math.sin(y*.57)*.85; return x>=bank && x<=bank+1.3; }
export function freshCity() {
  const tiles={};
  for(let x=4;x<=13;x++) tiles[key(x,8)]='road';
  for(let y=3;y<=12;y++) tiles[key(9,y)]='road';
  [[8,7,'hall'],[6,7,'home'],[7,9,'home'],[10,5,'home'],[10,10,'home'],[8,4,'shop'],[11,7,'shop'],[8,10,'park'],[10,12,'power']].forEach(([x,y,t])=>tiles[key(x,y)]=t);
  return {version:1,name:'Willowbrook',money:3200,population:64,month:0,tiles,claimed:[],paused:false,speed:1,events:[{text:'Welcome to Willowbrook. Your story starts here.',month:0}]};
}
export function connections(s) {
  const road=new Set(), queue=[];
  for(const [k,t] of Object.entries(s.tiles)) if(t==='hall') {
    const [x,y]=k.split(',').map(Number);
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) if(s.tiles[key(x+dx,y+dy)]==='road') queue.push([x+dx,y+dy]);
  }
  while(queue.length) { const [x,y]=queue.pop(),k=key(x,y); if(road.has(k))continue;road.add(k);
    for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]) {const n=key(x+dx,y+dy);if(s.tiles[n]==='road'&&!road.has(n))queue.push([x+dx,y+dy]);}
  }
  const connected=new Set(road);
  for(const [k,t]of Object.entries(s.tiles))if(t!=='road'){
    const [x,y]=k.split(',').map(Number);
    if(t==='hall'||[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>road.has(key(x+dx,y+dy))))connected.add(k);
  }
  return connected;
}
export function stats(s) {
  const connected=connections(s),counts={};let capacity=0,jobs=0,power=0,used=0,upkeep=0,trade=0;
  for(const [k,t]of Object.entries(s.tiles)){
    const c=CATALOG[t];upkeep+=c.upkeep;
    if(!connected.has(k))continue;
    counts[t]=(counts[t]||0)+1;
    if(t==='power') power+=12;
    else if(t!=='road')used++;
  }
  const powered=power>=used;
  for(const [k,t]of Object.entries(s.tiles))if(connected.has(k)){
    const c=CATALOG[t];capacity+=(c.capacity||0);jobs+=(c.jobs||0);if(t==='shop')trade+=25;if(t==='factory')trade+=50;
  }
  const employment=s.population?Math.min(1,jobs/s.population):1;
  const happiness=Math.max(15,Math.min(100,74+(counts.park||0)*6+(counts.school||0)*10-(counts.factory||0)*4-(powered?0:24)-Math.max(0,1-employment)*30));
  const income=Math.round(s.population*1.35+trade-upkeep);
  return {connected,counts,capacity,jobs,power,used,powered,happiness:Math.round(happiness),employment:Math.round(employment*100),income,upkeep};
}
export function placement(s,type,x,y) {
  if(x<0||y<0||x>=SIZE||y>=SIZE)return 'Choose a tile inside your city.';
  const existing=s.tiles[key(x,y)];
  if(type==='bulldoze')return existing?(existing==='hall'?'City Hall is the heart of your city.':null):'There’s nothing to remove here.';
  const c=CATALOG[type];if(!c||type==='hall')return 'Choose a building first.';
  if(existing)return 'This tile is occupied. Clear it with the bulldozer first.';
  if(water(x,y)&&type!=='road')return 'Build on land. Use roads to bridge the river.';
  if(c.unlock&&s.population<c.unlock)return `Unlocks at ${c.unlock} residents.`;
  const cost=type==='road'&&water(x,y)?45:c.cost;
  if(s.money<cost)return `You need $${cost-s.money} more. Let your city earn for a month.`;
  return null;
}
export function build(s,type,x,y) {
  const error=placement(s,type,x,y);if(error)return {ok:false,message:error};
  const k=key(x,y);
  if(type==='bulldoze') { const old=s.tiles[k];const refund=Math.floor(CATALOG[old].cost*.3);delete s.tiles[k];s.money+=refund;return {ok:true,message:`${CATALOG[old].name} removed. $${refund} recovered.`}; }
  const cost=type==='road'&&water(x,y)?45:CATALOG[type].cost;s.money-=cost;s.tiles[k]=type;
  const st=stats(s),extra=type!=='road'&&!st.connected.has(k)?' Connect it to City Hall with a road.':type!=='power'&&!st.powered?' Add a wind turbine to supply more power.':'';
  return {ok:true,message:`${type==='road'&&water(x,y)?'Bridge':CATALOG[type].name} built.${extra}`};
}
export function tick(s) {
  const st=stats(s);s.month++;s.money+=st.income;
  const limit=Math.min(st.capacity,Math.round(st.jobs*1.3));
  let growth=st.powered&&st.happiness>=45?Math.min(Math.max(0,limit-s.population),Math.max(2,Math.round(s.population*.09))):0;
  s.population+=growth;
  const newGoals=[];
  for(let i=0;i<GOALS.length;i++)if(s.population>=GOALS[i].pop&&!s.claimed.includes(i)){s.claimed.push(i);s.money+=GOALS[i].reward;newGoals.push(GOALS[i]);}
  for(const g of newGoals)s.events.unshift({text:`${g.name}! A $${g.reward.toLocaleString()} city grant is yours.`,month:s.month});
  if(growth)s.events.unshift({text:`${growth} new neighbors moved to ${s.name}.`,month:s.month});
  s.events=s.events.slice(0,6);return {growth,income:st.income,newGoals};
}
export function restore(raw) {
  const s=JSON.parse(raw);
  if(s.version!==1||typeof s.name!=='string'||!s.name.trim()||!Number.isFinite(s.money)||!Number.isFinite(s.population)||s.population<0||!Number.isInteger(s.month)||s.month<0||!Array.isArray(s.claimed)||!Array.isArray(s.events)||!s.tiles||typeof s.tiles!=='object')throw Error('Invalid save');
  if(!Object.values(s.tiles).includes('hall'))throw Error('Missing City Hall');
  for(const [k,t]of Object.entries(s.tiles)) {const [x,y]=k.split(',').map(Number);if(!/^\d+,\d+$/.test(k)||x>=SIZE||y>=SIZE||!CATALOG[t])throw Error('Invalid tile');}
  s.speed=[1,2,3].includes(s.speed)?s.speed:1;s.paused=!!s.paused;s.name=s.name.slice(0,28);return s;
}
