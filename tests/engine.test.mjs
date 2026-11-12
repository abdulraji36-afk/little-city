import test from 'node:test';
import assert from 'node:assert/strict';
import {SIZE,CATALOG,GOALS,key,water,freshCity,stats,build,tick,restore} from '../dist/engine.mjs';

test('the starter town has connected homes, jobs, and clean power',()=>{
 const s=freshCity(),st=stats(s);
 assert.equal(st.capacity,96);assert.equal(st.jobs,72);assert.equal(st.power,12);assert.equal(st.used,8);
 assert.equal(st.connected.size,Object.keys(s.tiles).length);assert.equal(st.powered,true);assert.equal(st.happiness,80);assert.ok(st.income>0);
});
test('construction enforces budgets, occupancy, unlocks, and land',()=>{
 const s=freshCity(),before=s.money;
 assert.equal(build(s,'home',5,7).ok,true);assert.equal(s.money,before-180);
 assert.equal(build(s,'home',5,7).ok,false);assert.equal(s.money,before-180);
 assert.equal(build(s,'apartment',5,6).ok,false);assert.equal(build(s,'home',-1,4).ok,false);
 const waterTile=Array.from({length:SIZE*SIZE},(_,i)=>[i%SIZE,Math.floor(i/SIZE)]).find(([x,y])=>water(x,y));
 assert.equal(build(s,'home',...waterTile).ok,false);
 assert.equal(build(s,'road',...waterTile).ok,true);assert.equal(s.money,before-180-45);
 s.money=0;assert.equal(build(s,'shop',5,6).ok,false);
});
test('isolated buildings activate only after roads reach City Hall',()=>{
 const s=freshCity();build(s,'home',2,7);
 assert.equal(stats(s).connected.has('2,7'),false);assert.equal(stats(s).capacity,96);
 build(s,'road',2,8);assert.equal(stats(s).connected.has('2,7'),false);
 build(s,'road',3,8);assert.equal(stats(s).connected.has('2,7'),true);assert.equal(stats(s).capacity,120);
 build(s,'bulldoze',3,8);assert.equal(stats(s).connected.has('2,7'),false);
});
test('bulldozing refunds part of the cost and preserves City Hall',()=>{
 const s=freshCity(),before=s.money;
 build(s,'home',5,7);assert.equal(build(s,'bulldoze',5,7).ok,true);assert.equal(s.money,before-180+54);
 assert.equal(build(s,'bulldoze',8,7).ok,false);assert.equal(s.tiles['8,7'],'hall');
});
test('population growth respects housing, jobs, and power',()=>{
 const s=freshCity();const initial=s.population;tick(s);assert.ok(s.population>initial);
 for(let i=0;i<70;i++)tick(s);assert.equal(s.population,94);assert.ok(s.money>3200);
 delete s.tiles['10,12'];const before=s.population;tick(s);assert.equal(s.population,before);assert.equal(stats(s).powered,false);
});
test('new connected housing and jobs grow a village past its first milestone',()=>{
 const s=freshCity();
 for(const [x,y]of [[5,7],[7,7],[10,6]])assert.equal(build(s,'home',x,y).ok,true);
 assert.equal(build(s,'shop',10,7).ok,true);
 for(let i=0;i<50;i++)tick(s);
 assert.ok(s.population>=120);assert.equal(s.claimed.filter(v=>v===0).length,1);
 assert.equal(build(s,'apartment',8,6).ok,true);
});
test('milestone grants are awarded only once',()=>{
 const s=freshCity();s.population=120;const income=stats(s).income,before=s.money;
 const result=tick(s);assert.equal(result.newGoals.length,1);assert.equal(s.money,before+income+GOALS[0].reward);
 const next=s.money;tick(s);assert.equal(s.money,next+stats(s).income);assert.deepEqual(s.claimed,[0]);
});
test('save restores progress and rejects broken city data',()=>{
 const s=freshCity();build(s,'park',8,11);tick(s);s.name='My little town';s.paused=true;s.speed=3;
 assert.deepEqual(restore(JSON.stringify(s)),s);
 assert.throws(()=>restore('{}'));assert.throws(()=>restore('{bad json'));
 const broken=structuredClone(s);broken.tiles['99,2']='home';assert.throws(()=>restore(JSON.stringify(broken)));
 delete s.tiles['8,7'];assert.throws(()=>restore(JSON.stringify(s)));
});
