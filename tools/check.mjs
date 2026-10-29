import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as c from '../src/core.js';
import * as n from '../src/navigation.js?v=45';
let s=c.initial();assert.equal(c.purchase(s,'build'),false);c.gather(s,'wood');c.gather(s,'wood');c.gather(s,'food');assert(c.purchase(s,'build'));assert.equal(s.gold,13);const after=JSON.stringify(s);assert.equal(c.purchase(s,'build'),false);assert.equal(JSON.stringify(s),after);assert(c.purchase(s,'recruit'));assert.equal(s.workers,1);assert.equal(s.wood,5);assert.equal(s.food,3);assert.equal(s.gold,18);assert.equal(c.purchase(s,'recruit'),false);c.advance(s,3.5);assert(c.purchase(s,'upgrade'));assert.equal(s.level,2);assert.equal(s.workerClock,3.125);assert.equal(s.gold,24);assert.equal(c.purchase(s,'upgrade'),false);
for(const mode of ['balanced','wood','food']){const a={...s,workerMode:mode,workerType:mode==='food'?'food':'wood'},b=structuredClone(a);for(let i=0;i<9000;i++)c.advance(a,.1);c.advance(b,900);assert(Math.abs(a.workerClock-b.workerClock)<1e-7);for(const k of ['wood','food','gold','deliveries','workerType'])assert.equal(a[k],b[k],mode+' parity '+k);}
let pad=c.initial();pad.wood=6;pad.food=3;assert.equal(c.dropSupply(pad),'wood');assert.equal(c.dropSupply(pad),'wood');pad=c.normalize(JSON.parse(JSON.stringify(pad)));assert.equal(pad.supplied.wood,2);assert.equal(c.offer(pad).wood,3);for(let i=0;i<6;i++)assert(c.dropSupply(pad));assert.equal(c.dropSupply(pad),null);assert.deepEqual(pad.supplied,{action:'build',wood:5,food:3});assert.equal(pad.wood,1);assert.equal(pad.food,0);assert(c.purchase(pad,'build'));assert.equal(pad.wood,1,'escrow is not charged twice');assert.equal(pad.gold,10);assert.equal(c.purchase(pad,'build'),false);assert.deepEqual(pad.supplied,{wood:0,food:0});assert.equal(c.dropSupply(pad),null);
const store=new Map(),storage={getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)};s.last=1000;storage.setItem('new',JSON.stringify(s));const loaded=c.load(storage,'new',1000+4*3600*1000);assert.equal(loaded.state.deliveries,2880);const repeated=c.load(storage,'new',1000+4*3600*1000);assert.equal(repeated.state.deliveries,loaded.state.deliveries,'load credits checkpoint once');assert(!store.has('hearthline-save-v3'));
for(const mode of ['wood','food']){const a={...s,workerMode:mode,workerType:mode==='wood'?'food':'wood'},b=structuredClone(a);const current=a.workerType;c.advance(a,c.interval(a.level)-a.workerClock);assert.equal(a.workerType,mode);assert.equal(a[current],b[current]+c.yieldFor(b),'finish carried load');c.advance(a,c.interval(a.level)*9);c.advance(b,c.interval(b.level)*10-b.workerClock);for(const k of ['wood','food','workerType','deliveries'])assert.equal(a[k],b[k],'switch route aggregate parity');}
assert.equal(c.normalize({version:99}).stage,0);assert.equal(c.normalize({version:1,stage:999,level:88,workerMode:'evil',wood:-99}).level,2);assert.equal(c.normalize({version:1,wood:-99}).wood,0);
const stops=[[0,3.5],[1.8,2.3],[-5.8,-3.9],[-4.8,6.6],[-4,3.6],[-3.4,4],[6,3.7]];
for(const a of stops)for(const b of stops){const path=n.route(a,b);assert(path.length,'route '+a+' → '+b);let from=a;for(const p of path){assert(n.clear(from,p),'collision-free lane');from=p;}}
assert.deepEqual(n.route([0,3.5],[0,-2.25]),[]);assert.equal(n.walkable([99,99]),false);
for(const name of ['mara','rowan']){const data=fs.readFileSync(new URL('../assets/characters/'+name+'.glb',import.meta.url));assert.equal(data.readUInt32LE(0),0x46546c67);assert.equal(data.readUInt32LE(8),data.length);const length=data.readUInt32LE(12),g=JSON.parse(data.subarray(20,20+length).toString());assert.equal(g.skins[0].joints.length,18);assert.deepEqual(g.animations.map(x=>x.name),['idle','walk','carry','work','attack','hit','celebrate','deliver','attack_spear','attack_bow','attack_sword']);const attrs=g.meshes[0].primitives[0].attributes;assert('JOINTS_0' in attrs&&'WEIGHTS_0' in attrs);assert.equal(g.accessors[attrs.POSITION].count,g.accessors[attrs.WEIGHTS_0].count);assert.equal(g.accessors[attrs.POSITION].count/3<3500,true);checkContacts(data,g);}
const cabin=fs.readFileSync(new URL('../assets/buildings/cabin.glb',import.meta.url)),building=JSON.parse(cabin.subarray(20,20+cabin.readUInt32LE(12)).toString());assert.equal(cabin.readUInt32LE(8),cabin.length);assert.deepEqual(building.nodes.map(x=>x.name),['Damaged','HomeI','HomeII']);

function checkContacts(data,g){
 const jsonLength=data.readUInt32LE(12),binStart=28+jsonLength;
 const read=index=>{const a=g.accessors[index],v=g.bufferViews[a.bufferView],size={SCALAR:1,VEC3:3,VEC4:4}[a.type],start=binStart+(v.byteOffset||0)+(a.byteOffset||0);return Array.from({length:a.count*size},(_,i)=>data.readFloatLE(start+i*4));};
 for(const name of ['walk','carry','deliver','idle']){
  const clip=g.animations.find(a=>a.name===name),track=(bone,path)=>read(clip.samplers[clip.channels.find(c=>c.target.node===bone&&c.target.path===path).sampler].output),hips=track(1,'translation');
  if(name==='walk'||name==='carry')assert.equal(clip.extras.stride,1);
  for(const leg of [12,15]){
   const hip=track(leg,'rotation'),knee=track(leg+1,'rotation'),foot=track(leg+2,'rotation');let planted=null,lastPhase=-1;
   for(let i=0;i<25;i++){
    const h=2*Math.atan2(hip[i*4],hip[i*4+3]),k=2*Math.atan2(knee[i*4],knee[i*4+3]),f=2*Math.atan2(foot[i*4],foot[i*4+3]);
    const y=hips[i*3+1]-.01-.38*Math.cos(h)-.34*Math.cos(h+k)-.04*Math.sin(h+k),z=-.38*Math.sin(h)-.34*Math.sin(h+k)+.04*Math.cos(h+k),phase=(i/24+(leg===15?.5:0))%1;
    assert(Math.abs(h+k+f)<1e-5,'level foot sole');assert(y>=.09999,'no floor penetration');
    if(name==='deliver'||name==='idle'||phase<.6){assert(Math.abs(y-.1)<1e-5,'grounded stance');const worldZ=z+(name==='deliver'||name==='idle'?0:i/24);if(phase<lastPhase)planted=null;if(planted!==null)assert(Math.abs(worldZ-planted)<1e-5,'stance foot stays planted at stride speed');planted=worldZ;}else planted=null;
    lastPhase=phase;
   }
  }
 }
}
assert.equal(n.travelProgress(0),0);assert.equal(n.travelProgress(1),1);assert.equal(n.travelProgress(.5),.5);for(let i=1;i<=100;i++)assert(n.travelProgress(i/100)>=n.travelProgress((i-1)/100));

console.log('PASS: Classic opening costs/rewards/guards, cycle-preserving upgrade, live/offline parity including route switches, separate save checkpoint, bounded defaults, collision-free lanes, weighted GLBs/eleven clips and baked foot contacts, eased travel and three cabin stages.');


// Progression acceptance: pure fixtures, never browser saves.
const e=await import('../src/encounter.js');
function rich(){const state=c.initial();state.wood=200;state.food=200;state.gold=100;for(const action of ['build','recruit','upgrade'])assert(c.purchase(state,action));return state;}
let camp=rich();const costs={sharpen:[6,4,6],spin:[10,6,10],brace:[4,3,0],mill:[16,10,8],train:[20,12,10],home3:[24,16,14]};
for(const action of ['sharpen','spin','brace']){const before=[camp.wood,camp.food,camp.gold],o=c.offer(camp,action);assert.equal(o.action,action);assert.deepEqual([o.wood,o.food,o.gold],costs[action]);assert(c.purchase(camp,action));assert.deepEqual(before.map((v,i)=>v-[camp.wood,camp.food,camp.gold][i]),costs[action]);assert.equal(c.purchase(camp,action),false);}
assert.deepEqual(c.axeStats(camp),{yield:5,damage:3,radius:1.8,period:.9,spin:true});const stock=camp.wood,coins=camp.gold;c.gather(camp,'wood');assert.equal(camp.wood-stock,5);assert.equal(camp.gold-coins,1);
let escrow=rich();c.dropSupply(escrow,'brace');assert.equal(c.offer(escrow).action,'brace');const escrowBefore=JSON.stringify(escrow);assert.equal(c.purchase(escrow,'sharpen'),false);assert.equal(JSON.stringify(escrow),escrowBefore);escrow=c.normalize(escrow);assert.equal(escrow.supplied.action,'brace');assert.equal(c.offer(escrow).wood,3);
const TAU=2*Math.PI,enemy={active:true,position:[0,1.8],lastTurn:-1};assert(e.sweepHit(enemy,[0,0],0,.1,c.axeStats(camp)));assert(!e.sweepHit(enemy,[0,0],.1,.2,c.axeStats(camp)));assert(e.sweepHit(enemy,[0,0],TAU,TAU+.1,c.axeStats(camp)));assert(!e.sweepHit({...enemy,position:[0,3]},[0,0],2*TAU,2*TAU+.1,c.axeStats(camp)));
let fight=e.beginWatch(camp),angle=0,peak=0,spawnTimes=[];while(fight.status==='active'){const prev=angle;angle+=.05*TAU/.9;const spawned=fight.spawned;e.tickWatch(fight,.05,camp,[0,2.25],prev,angle);peak=Math.max(peak,fight.enemies.filter(x=>x.active).length);if(fight.spawned>spawned)spawnTimes.push(fight.time);for(const wolf of fight.enemies)if(wolf.active)assert(n.walkable(wolf.position),'wolf remains on collision-checked ground');}
assert.equal(fight.status,'won');assert.equal(fight.kills,9);assert.equal(fight.spawned,9);assert(peak<=6);assert(spawnTimes[0]<.1&&spawnTimes[1]>=10&&spawnTimes[2]>=20);const victoryGold=camp.gold;assert(c.claimWatch(camp));assert.equal(camp.gold,victoryGold+25);assert(!c.claimWatch(camp));assert.equal(camp.gold,victoryGold+25);
let failing=rich();c.purchase(failing,'sharpen');c.purchase(failing,'spin');const frozen=JSON.stringify(failing);let failure=e.beginWatch(failing);for(let i=0;failure.status==='active'&&i<800;i++)e.tickWatch(failure,.05,failing,[-9,6],0,0);assert.equal(failure.status,'lost');assert.equal(JSON.stringify(failing),frozen,'no encounter fee or persistent damage');const retry=e.beginWatch(failing);assert.equal(retry.warmth,100);assert.equal(retry.kills,0);assert.equal(c.normalize(failing).watchWon,false,'reload has no active encounter');
for(const action of ['mill','train','home3']){const before=[camp.wood,camp.food,camp.gold],o=c.offer(camp);assert.equal(o.action,action);assert.deepEqual([o.wood,o.food,o.gold],costs[action]);if(action==='train')camp.crewClock=3;if(action==='home3')camp.workerClock=3.125;assert(c.purchase(camp,action));assert.deepEqual(before.map((v,i)=>v-[camp.wood,camp.food,camp.gold][i]),costs[action]);if(action==='train')assert.equal(camp.crewClock,2.5);if(action==='home3')assert.equal(camp.workerClock,2.75);}
assert.equal(camp.level,3);assert.equal(c.crewYield(camp),6);assert.equal(c.crewInterval(camp),4);assert.equal(c.yieldFor(camp),3);assert.equal(c.interval(3),4.4);
for(const mode of ['balanced','wood','food']){const live=structuredClone(camp),offline=structuredClone(camp);live.workerMode=offline.workerMode=mode;for(let i=0;i<9000;i++)c.advance(live,.1);c.advance(offline,900);for(const k of ['wood','food','gold','deliveries','crewDeliveries','workerType'])assert.equal(live[k],offline[k],'two-worker/order parity '+k);assert.equal(live.orders.completed,offline.orders.completed);assert.equal(live.orders.reserved,offline.orders.reserved);for(const k of ['workerClock','crewClock'])assert(Math.abs(live[k]-offline[k])<1e-7);assert(Math.abs(live.orders.clock-offline.orders.clock)<1e-7);}
const paused=structuredClone(camp);c.advance(paused,1);assert(paused.orders.reserved);paused.orders.enabled=false;const phase=paused.orders.clock,completed=paused.orders.completed;c.advance(paused,30);assert.equal(paused.orders.clock,phase);assert.equal(paused.orders.completed,completed);paused.orders.enabled=true;c.advance(paused,6-phase);assert.equal(paused.orders.completed,completed+1);
const scarce=structuredClone(camp);scarce.wood=c.offer(scarce).wood+11;scarce.food=c.offer(scarce).food+6;scarce.orders.reserved=false;c.advance(scarce,0);assert(!scarce.orders.reserved);scarce.wood=c.offer(scarce).wood+12;c.advance(scarce,0);assert(scarce.orders.reserved);assert.equal(scarce.wood,c.offer(scarce).wood);assert.equal(scarce.food,c.offer(scarce).food);
for(const old of [{version:1,stage:0,wood:9,food:4,supplied:{wood:3,food:1},last:1000},{version:1,stage:3,level:2,wood:123,food:456,gold:78,workerClock:3.125,last:1000}]){const map=new Map([['migration',JSON.stringify(old)]]),st={getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)},m=c.load(st,'migration',1000).state;assert.equal(map.get('migration-pre-progression'),JSON.stringify(old));assert.equal(m.wood,old.wood);assert.equal(m.food,old.food);if(old.stage===0){assert.equal(m.supplied.wood,3);assert.equal(c.offer(m).wood,2);}else{assert.equal(c.offer(m).action,'sharpen');assert.equal(m.workerClock,2.5);}const backup=map.get('migration-pre-progression');c.load(st,'migration',1000);assert.equal(map.get('migration-pre-progression'),backup);}
const longSave=structuredClone(camp);longSave.last=1000;storage.setItem('network',JSON.stringify(longSave));const away=c.load(storage,'network',1000+20000*1000);assert.equal(away.away,14400);const again=c.load(storage,'network',1000+20000*1000);for(const k of ['wood','food','gold','crewDeliveries'])assert.equal(away.state[k],again.state[k],'network repeat-load '+k);
for(const a of [...stops,[6,-1.3],[8,-5]])for(const b of [...stops,[6,-1.3],[8,-5]]){const p=n.route(a,b);assert(p.length,'grove route '+a+' → '+b);let prev=a;for(const at of p){assert(n.clear(prev,at));prev=at;}}
const wolfData=fs.readFileSync(new URL('../assets/characters/wolf.glb',import.meta.url)),wolfJson=JSON.parse(wolfData.subarray(20,20+wolfData.readUInt32LE(12)).toString());assert.equal(wolfData.readUInt32LE(8),wolfData.length);assert.equal(wolfJson.skins[0].joints.length,13);assert.deepEqual(wolfJson.animations.map(a=>a.name),['idle','run','bite','hit','retreat']);assert('WEIGHTS_0' in wolfJson.meshes[0].primitives[0].attributes);
console.log('PASS: axe costs/yield/sweep limits, upgrade-bound escrow, nine wolves/three waves/six-active cap, free retry and one-time reward, two-worker/order live-offline parity, preserved phases, migrations/backups, four-hour/repeat-load cap, 81 grove routes and weighted animated wolf GLB.');
const wrap={active:true,position:[0,1.8],lastTurn:-1};assert(e.sweepHit(wrap,[0,0],TAU-.12,TAU-.06,c.axeStats(camp)));assert(!e.sweepHit(wrap,[0,0],TAU-.06,TAU+.06,c.axeStats(camp)),'one hit across zero-angle boundary');
for(const braced of [false,true]){const state={...failing,braced},w=e.beginWatch(state);w.spawned=9;w.enemies[0]={active:true,hp:6,position:[1.05,1.15],path:[],lastTurn:-1,attack:1.18,hit:0,retreat:0,lane:1};e.tickWatch(w,.05,state,[-9,6],0,0);assert.equal(w.warmth,braced?96:92);}
const mainSource=fs.readFileSync(new URL('../src/main.js',import.meta.url),'utf8'),actorSource=fs.readFileSync(new URL('../src/actors.js',import.meta.url),'utf8'),worldSource=fs.readFileSync(new URL('../src/world.js',import.meta.url),'utf8');assert(mainSource.includes('started&&!document.hidden'));assert(mainSource.includes('if(fighting()){const result=tickWatch'));assert(!mainSource.includes('watch:watch,'),'encounter is absent from persisted state');assert(actorSource.includes("trail.visible=!reduced.matches"));assert(actorSource.includes("orbit.visible=!mining&&spinning&&!cargo.visible&&current!=='deliver'"),'essential orbit retained without decorative trail');assert(worldSource.includes('snow.points.visible=embers.points.visible=!reduced.matches'));assert(worldSource.includes('saw.rotation.z=reduced.matches?0:'));assert(actorSource.includes('m.emissive.setHex(e.hit>0?0x77321c:0)'),'hit reaction independent of decorative-motion setting');
for(const name of ['main','world','actors','encounter']){const source=fs.readFileSync(new URL('../src/'+name+'.js',import.meta.url),'utf8');for(const match of source.matchAll(/from ['"]\.\/[^'"]+['"]/g))assert(match[0].includes('?v='),'synchronized local module '+name);}
console.log('PASS: angle-wrap hit guard, bracing damage, hidden encounter gate, reload-free state, reduced-motion decorative suppression/essential feedback and versioned module imports.');
const expired=e.beginWatch(failing);expired.time=34.99;expired.spawned=9;expired.kills=9;e.tickWatch(expired,.05,failing,[0,2.25],0,0);assert.equal(expired.status,'lost','victory must precede the deadline');
assert(actorSource.includes('gltf.scene.scale.x'),'world-speed gait accounts for presentation scale');
const releaseFiles=['../index.html','../src/main.js','../src/world.js','../src/actors.js','../src/encounter.js','../src/navigation.js','./visual-review.html','./visual-review.js'],versions=new Set(releaseFiles.flatMap(f=>[...fs.readFileSync(new URL(f,import.meta.url),'utf8').matchAll(/\?v=(\d+)/g)].map(m=>m[1])));assert.equal(versions.size,1,'entry/module/asset cache versions move together');

assert(mainSource.includes('Math.abs(dx)<=25&&Math.abs(dy)<=25'),'independent 50px pad touch regions');
assert(mainSource.includes('if(idleSeconds>=2.5){hintNode=nextNode();}'),'contextual card refreshes when worker income changes the next action');
assert(mainSource.includes('carrierWidths.set(id,tag.offsetWidth/2)'),'carrier widths cache until text changes');
assert(mainSource.includes('renderCarriers();renderCounters('),'carrier positions update with each rendered frame');
assert(mainSource.includes('world.impact(result.contacts)'),'authoritative contacts drive presentation');
const contactWatch=e.beginWatch(failing);contactWatch.spawned=9;contactWatch.enemies[0]={active:true,hp:6,position:[0,1.8],path:[],lastTurn:-1,attack:0,hit:0,retreat:0,lane:2};
const contact=e.tickWatch(contactWatch,.01,failing,[0,0],0,.1);assert.equal(contact.contacts.length,1);assert.equal(contact.contacts[0].slot,0);assert.deepEqual(contact.contacts[0].position,[0,1.8]);assert.equal(contact.contacts[0].lethal,false);assert.equal(e.tickWatch(contactWatch,.01,failing,[0,0],.1,.15).contacts.length,0);
console.log('PASS: 50px touch targets, frame-rate carrier anchoring and authoritative transient combat contacts.');

const reviewSource=fs.readFileSync(new URL('./visual-review.js',import.meta.url),'utf8');assert(!/localStorage|\bload\(|\bsave\(/.test(reviewSource),'stress fixture never persists or reads saves');
assert(reviewSource.includes('paused=document.hidden||raw>.5'),'recording excludes background-like stalls');
assert(reviewSource.includes("$('playback-close').onclick"),'recorded motion has a dedicated accessible exit');
const run=wolfJson.animations.find(a=>a.name==='run');assert.equal(run.extras.stride,.78);assert.deepEqual(run.channels.filter(ch=>ch.target.path==='translation').map(ch=>ch.target.node),[6,8,10,12]);
console.log('PASS: non-persistent visual fixture and weighted wolf paw-contact/stride tracks.');

assert(fs.readFileSync(new URL('../style.css',import.meta.url),'utf8').includes('#combat-hud{top:auto;bottom:calc(69px'),'combat status leaves incoming wolves visible');
assert(worldSource.includes('mill:supplyPad(4.4,-1.7,2.7,-.4)'), 'mill visual cost offset leaves payment and touch roots unchanged');
assert(actorSource.includes('exitClock=Math.max(0,exitClock-dt)'), 'retreat presentation continues after encounter clock stops');
assert(actorSource.includes('if(!e||!e.active&&e.retreat<=0)exitClock=0'), 'fresh encounters clear stale retreat presentation');
assert(reviewSource.includes('hp:3,position:[-1.25,.1],path:[],lane:0'), 'final-kill fixture retains the checked encounter lane');

// Frontier acceptance uses the same helpers as play, without touching earned saves.
const f=await import('../src/forest.js');
assert.equal(f.TREES.length,75);assert.equal(new Set(f.TREES.map(t=>t.id)).size,75);
assert.deepEqual(f.SECTORS.map(g=>[g.count,g.hp]),[[10,6],[15,9],[25,12],[25,15]]);
const frontier=structuredClone(camp);frontier.orders.enabled=false;frontier.orders.reserved=false;frontier.wood=200;frontier.food=200;frontier.gold=200;
assert(!c.purchase(frontier,'triple'));
for(const tree of f.TREES.slice(0,10)){assert(c.chopTree(frontier,tree.id));assert(c.chopTree(frontier,tree.id));const stock=frontier.wood;assert.equal(c.chopTree(frontier,tree.id),null);assert.equal(frontier.wood,stock,'permanent tree pays only once');}
assert.equal(f.clearedCount(frontier),10);assert(f.sectorOpen(frontier,1));assert(!f.sectorOpen(frontier,2));assert(!c.purchase(frontier,'triple'),'shipment is required');
const unchangedCoins=frontier.gold;c.chopTree(frontier,'tree-1-0');assert.equal(frontier.gold,unchangedCoins,'Home III timber income comes through shipping');
const normalized=c.normalize({...frontier,forest:{cleared:[...frontier.forest.cleared,...frontier.forest.cleared,'invalid'],damage:{...frontier.forest.damage,'tree-0-0':99}}});assert.equal(f.clearedCount(normalized),10);assert.equal(normalized.forest.damage['tree-1-0'],3);assert.equal(normalized.forest.damage['tree-0-0'],undefined);
assert(c.shipWood(frontier));const activeDuration=frontier.orders.duration;frontier.orders.mode='mixed';c.advance(frontier,activeDuration);assert.equal(frontier.orders.woodCompleted,1);assert(c.purchase(frontier,'triple'));assert.equal(c.axeStats(frontier).radius,2.6);
const guard={last:new Map(),passes:new Map()},at=f.TREES[10].approach,angle0=c.axeAngleAt(frontier,0),angle1=c.axeAngleAt(frontier,.2);
const sweep=c.cutSweep(frontier,at,angle0,angle1,null,guard);assert(sweep.length>0&&sweep.length<=3);assert.equal(c.cutSweep(frontier,at,angle0,angle1,null,guard).length,0,'one contact per tree per revolution');assert(c.cutSweep(frontier,at,c.axeAngleAt(frontier,.61),c.axeAngleAt(frontier,.99),null,guard).length>0,'continuous spin keeps damaging through the former recovery');
assert.equal(c.axeStats(frontier).period,.4);for(const t of [0,.2,.59,.61,1.19,7.3])assert(Math.abs(c.axeAngleAt(frontier,t+.01)-c.axeAngleAt(frontier,t)-Math.PI*2*.01/.4)<1e-10,'constant angular velocity');assert(Math.abs(c.axeAngleAt(frontier,1.2)-Math.PI*6)<1e-10,'same three revolutions per 1.2 seconds');
frontier.forest.cleared=f.TREES.slice(0,25).map(t=>t.id);frontier.forest.damage={};assert(c.purchase(frontier,'forge'));assert(c.purchase(frontier,'buy_spear'));assert(!e.beginWatch(frontier,true),'second watch waits for fifty');frontier.forest.cleared=f.TREES.slice(0,50).map(t=>t.id);
for(const kind of ['spear','bow','sword'])for(const level of [1,2]){const state=structuredClone(frontier);state.weapons[kind]=level;state.weapons.equipped=kind;const stats=c.weaponStats(state),expected={spear:[2,1],bow:[3,2],sword:[4,2]}[kind][level-1];assert.equal(Math.ceil(8/stats.damage),expected);const watch=e.beginWatch(state,true);watch.spawned=9;watch.kills=8;Object.assign(watch.enemies[0],{active:true,hp:8,maxHp:8,id:1,position:[0,3],path:[],lane:2});let hits=0;for(let i=0;i<400&&watch.status==='active';i++)hits+=e.tickWatch(watch,.02,state,[0,4],0,0).hits;assert.equal(watch.status,'won',kind+' remains viable');assert.equal(hits,expected,kind+' II breakpoint');}
const staleArrow=e.beginWatch(frontier,true);staleArrow.spawned=9;Object.assign(staleArrow.enemies[0],{active:true,hp:8,id:42,position:[0,3],path:[],lane:2});Object.assign(staleArrow.projectiles[0],{active:true,position:[0,3],target:41,life:0,damage:8});frontier.weapons.bow=1;frontier.weapons.equipped='bow';e.tickWatch(staleArrow,.02,frontier,[0,5],0,0);assert.equal(staleArrow.enemies[0].hp,8,'arrow cannot hit a reused enemy slot');assert(!staleArrow.projectiles[0].active);
const beforeFailure=JSON.stringify(frontier),secondFailure=e.beginWatch(frontier,true);for(let i=0;secondFailure.status==='active'&&i<800;i++)e.tickWatch(secondFailure,.05,frontier,[-9,6],0,0);assert.equal(secondFailure.status,'lost');assert.equal(JSON.stringify(frontier),beforeFailure);assert.equal(e.beginWatch(frontier,true).warmth,100);const beforeReward=frontier.gold;assert(c.claimFrontier(frontier));assert(!c.claimFrontier(frontier));assert.equal(frontier.gold,beforeReward+30);assert(f.sectorOpen(frontier,3));assert(!c.purchase(frontier,'winch'));
for(const threshold of [0,10,25,50]){const state=structuredClone(frontier);state.forest.cleared=f.TREES.slice(0,threshold).map(t=>t.id);state.frontierWon=threshold===50;n.setNavigationState(state);const sector=threshold===0?0:threshold===10?1:threshold===25?2:3;for(const tree of f.TREES.filter(t=>t.sector===sector)){const path=n.route([0,3.5],tree.approach);assert(path.length,'reachable '+tree.id);let previous=[0,3.5];for(const p of path){assert(n.clear(previous,p));previous=p;}}if(threshold===0)assert(!n.walkable([2,-9]),'unopened northern access blocked');}
n.setNavigationState(null);
const early=rich();early.orders.reserved=false;const earlyLive=structuredClone(early),earlyOffline=structuredClone(early);c.shipWood(earlyLive);c.shipWood(earlyOffline);for(let i=0;i<100;i++)c.advance(earlyLive,.1);c.advance(earlyOffline,10);for(const k of ['wood','food','gold','workerClock'])assert(Math.abs(earlyLive[k]-earlyOffline[k])<1e-7);assert.equal(earlyLive.orders.completed,1,'Home II manual shipment before sawmill');
const woodOnly=structuredClone(frontier);woodOnly.orders.reserved=false;woodOnly.wood=60;woodOnly.food=0;assert(c.shipWood(woodOnly));assert(woodOnly.orders.reserved,'wood shipment does not wait for berries it will never consume');assert.equal(woodOnly.food,0);
frontier.forest.cleared=f.TREES.map(t=>t.id);frontier.wood=300;frontier.food=300;frontier.gold=300;frontier.orders.reserved=false;c.shipWood(frontier);assert.equal(frontier.orders.duration,4);assert(c.purchase(frontier,'winch'));assert.equal(frontier.orders.duration,4,'winch never changes an in-flight snapshot');frontier.orders.mode='mixed';c.advance(frontier,4);assert.equal(frontier.orders.activeKind,'mixed');assert.equal(frontier.orders.duration,5);
for(const mode of ['wood','mixed']){const live=structuredClone(frontier),offline=structuredClone(frontier);live.orders.mode=offline.orders.mode=mode;for(let i=0;i<6000;i++)c.advance(live,.1);c.advance(offline,600);for(const k of ['wood','food','gold','deliveries','crewDeliveries'])assert.equal(live[k],offline[k]);assert.deepEqual(live.forest,offline.forest,'workers never clear permanent trees');assert.equal(live.orders.woodCompleted,offline.orders.woodCompleted);assert(Math.abs(live.orders.clock-offline.orders.clock)<1e-7);}
for(const state of [c.initial(),{...frontier,supplied:{action:'winch',wood:4,food:2},freightWinch:false},frontier]){const old={...structuredClone(state),progression:1,last:1000},map=new Map([['frontier-save',JSON.stringify(old)]]),st={getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)};const migrated=c.load(st,'frontier-save',1000).state;assert.equal(map.get('frontier-save-pre-frontier'),JSON.stringify(old));assert.equal(migrated.wood,old.wood);assert.equal(migrated.food,old.food);assert.equal(migrated.workerClock,old.workerClock);for(const k of ['wood','food'])assert.equal(migrated.supplied[k],old.supplied[k]);if(old.supplied.wood+old.supplied.food)assert.equal(migrated.supplied.action,old.supplied.action);const backup=map.get('frontier-save-pre-frontier');c.load(st,'frontier-save',1000);assert.equal(map.get('frontier-save-pre-frontier'),backup);}
const forestView=fs.readFileSync(new URL('../src/forest-view.js',import.meta.url),'utf8');assert(forestView.includes('length:8'),'fixed eight falling actors');assert(forestView.includes('InstancedMesh'),'shared intact tree rendering');
console.log('PASS: 75 stable trees/permanent rewards/sparse migration, contact caps/continuous spin, checked district routes, forge breakpoints/arrows/free retry/reward, pre-mill shipments/in-flight snapshots and live/offline parity.');

for(const kind of ['spear','bow','sword']){const state=structuredClone(frontier);state.frontierWon=false;state.weapons[kind]=1;state.weapons.equipped=kind;const fight=e.beginWatch(state,true);fight.spawned=9;for(let i=0;i<2;i++)Object.assign(fight.enemies[i],{active:true,hp:8,maxHp:8,id:i,position:[0,3-i*.5],path:[],lane:2});let hits=0;for(let i=0;i<15;i++)hits+=e.tickWatch(fight,.02,state,[0,4],0,0).hits;assert.equal(hits,kind==='bow'?1:2,kind+' target cap');}
const strong=structuredClone(frontier);strong.frontierWon=false;strong.weapons.equipped='hatchet';let stronger=e.beginWatch(strong,true),clock=0,peakStrong=0,strongSpawns=[];while(stronger.status==='active'){const before=c.axeAngleAt(strong,clock),spawned=stronger.spawned;clock+=.02;e.tickWatch(stronger,.02,strong,[0,2.25],before,c.axeAngleAt(strong,clock));peakStrong=Math.max(peakStrong,stronger.enemies.filter(x=>x.active).length);if(stronger.spawned>spawned)strongSpawns.push(stronger.time);}assert.equal(stronger.status,'won');assert.equal(stronger.kills,9);assert(peakStrong<=6);assert(strongSpawns[0]<.1&&strongSpawns[1]>=8&&strongSpawns[2]>=16);
for(const equipped of ['__proto__','toString','invalid'])assert.equal(c.normalize({...frontier,weapons:{...frontier.weapons,equipped}}).weapons.equipped,'hatchet');
assert(!forestView.split('function contact')[1].split('return {update')[0].includes('new THREE'),'contacts and destruction allocate no render objects');
assert(worldSource.includes('!reduced.matches&&revealClock>0'),'reduced-motion boundaries reveal immediately');
console.log('PASS: per-weapon target caps, second-watch waves/active cap, bounded render objects, invalid equipment guard and instant reduced-motion expansion.');

assert(reviewSource.includes("watch.enemies.some(e=>!e.active)"),'stress keeps all six bounded enemy skins active');
assert(mainSource.includes("$(id).hidden=armory||!o.action||!o[k]"),'free resources do not occupy weapon-price rows');
assert(mainSource.includes("if(!o.action)return s.expansion.outpost===4?")&&mainSource.includes("townUnlocked(s)?'lodge':'workshop'"),'terminal guidance finishes ridge sites; jobs and the earlier forge stay reachable');

// Earned-play regression: useful start position and contextual combat guidance.
n.setNavigationState(null);
assert(n.walkable(n.WATCH_POST));
for(const at of stops)assert(n.route(at,n.WATCH_POST).length,'defense post reachable');
const cue=e.beginWatch(failing);cue.spawned=9;
Object.assign(cue.enemies[0],{active:true,hp:6,position:[-8,-4],path:[],lane:0});
assert.equal(e.watchTarget(cue,failing,n.WATCH_POST),cue.enemies[0],'out-of-range wolf receives cue');
e.tickWatch(cue,.08,failing,n.WATCH_POST,0,0);assert.equal(cue.warmth,100,'missing route cannot damage hearth from afar');
cue.enemies[0].position=[-1.05,1.15];assert.equal(e.watchTarget(cue,failing,n.WATCH_POST),null,'cue clears inside visible axe sweep');
cue.status='lost';assert.equal(e.watchTarget(cue,failing,n.WATCH_POST),null);
const guidedWatch=e.beginWatch(failing);let guidedClock=0;
while(guidedWatch.status==='active'&&guidedWatch.time<8){const before=c.axeAngleAt(failing,guidedClock);guidedClock+=.02;e.tickWatch(guidedWatch,.02,failing,n.WATCH_POST,before,c.axeAngleAt(failing,guidedClock));}
assert.equal(guidedWatch.kills,3);assert.equal(guidedWatch.warmth,100,'default approach meets the first wave safely');
console.log('PASS: defense approach, contextual range cue and no remote hearth damage.');

assert(mainSource.includes('go([...target.position],true);intercepting=true'),'combat goal uses existing checked walking');
assert(mainSource.includes('Math.min(canvas.clientWidth-28,p.x)'),'offscreen threat cue stays inside phone viewport');
const blockedCue=e.beginWatch(failing,true)||e.beginWatch(failing);blockedCue.frontier=true;blockedCue.spawned=9;
const cueState=structuredClone(failing);cueState.weapons.spear=1;cueState.weapons.equipped='spear';
Object.assign(blockedCue.enemies[0],{active:true,hp:8,position:[1.05,1.15],path:[],lane:1});
assert.equal(e.watchTarget(blockedCue,cueState,[0,2.25]),blockedCue.enemies[0],'hearth occlusion retains intercept cue');
assert.equal(e.watchTarget(blockedCue,cueState,[1.6,2.25]),null,'clear spear lane removes cue');

for(const kind of ['spear','sword']){const state=structuredClone(frontier);state.frontierWon=false;state.weapons[kind]=1;state.weapons.equipped=kind;const w=e.beginWatch(state,true);w.spawned=9;Object.assign(w.enemies[0],{active:true,hp:8,maxHp:8,id:100,position:[1.05,1.15],path:[],lane:1});let hits=0;for(let i=0;i<50;i++)hits+=e.tickWatch(w,.02,state,[1.05,1.15],0,0).hits;assert(hits>0,kind+' hits at overlapping contact');}
assert(mainSource.includes('intercepting&&fighting()&&!watchTarget'),'intercept stops at a usable attack range');
console.log('PASS: overlapping melee contact and range-stopping intercept.');

assert(worldSource.includes("destinationArrow.visible=watch?.status==='active'&&!!combatTarget"),'station cards have no floating arrow; combat keeps threat guidance');
assert(actorSource.includes("if(name==='mara'){const ring="),'only the player owns the cyan selection ring');
assert(mainSource.includes("actor!==mara&&actor!==guard&&!actor.cargo.visible"),'player tag remains visible without cargo');
console.log('PASS: player identity and arrow-free station cards.');

assert(!worldSource.includes('hintPath')&&!mainSource.includes('world.guide('),'station guidance uses cards/objective without arrow trails');

// Fast-pace migration keeps paid stock, active shipment snapshots and carried-load fractions.
assert.equal(c.PLAYER_SPEED,6.6);assert(Math.abs(c.GATHER_SECONDS+c.REGROW_SECONDS-.7)<1e-9);assert.equal(c.DROP_SECONDS,.08);
for(const old of [c.initial(),rich(),{...camp,supplied:{action:'triple',wood:4,food:2}}]){
 old.pace=0;old.last=1000;old.workerClock=3.125;if(old.mill)old.crewClock=2.5;old.orders.enabled=false;if(old.stage===3){old.orders.reserved=true;old.orders.activeKind=old.home3?'mixed':'wood';old.orders.duration=old.home3?6:4;old.orders.clock=1.25;}
 const map=new Map([['pace',JSON.stringify(old)]]),storage={getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)};
 const migrated=c.load(storage,'pace',1000).state,backup=map.get('pace-pre-fast-pace');
 assert.equal(backup,JSON.stringify(old));assert.equal(migrated.workerClock,2.5);
 assert.equal(migrated.crewClock,old.mill?2:0);assert.deepEqual(migrated.orders,old.orders);
 for(const k of ['wood','food','gold'])assert.equal(migrated[k],old[k]);
 for(const k of ['wood','food'])assert.equal(migrated.supplied[k],old.supplied[k]);if(old.supplied.action)assert.equal(migrated.supplied.action,old.supplied.action);
 const repeated=c.load(storage,'pace',1000).state;assert.equal(repeated.workerClock,migrated.workerClock);assert.equal(repeated.crewClock,migrated.crewClock);assert.equal(map.get('pace-pre-fast-pace'),backup);
}
assert(mainSource.includes('dt*PLAYER_SPEED')&&!mainSource.includes('3.9'),'manual and route movement share faster speed');
assert(actorSource.includes('speed*clip.duration')&&actorSource.includes('workSeconds?'),'gait and gathering follow measured movement/contact');
assert(worldSource.includes('new THREE.InstancedMesh(new THREE.PlaneGeometry(.13,.22)')&&worldSource.includes('confettiTime<1.15&&!reduced.matches'),'fixed celebration pool respects reduced motion');

assert(mainSource.includes('keepGoing=guided')&&mainSource.includes("['build','recruit','upgrade'].includes(o.action)"),'guided purchases keep momentum; repair immediately points to Rowan');
assert(mainSource.includes("$('crew-text').parentElement.hidden=!s.mill"),'unbuilt wood crew never appears as active production');

console.log('PASS: faster shared movement, contact-timed harvesting, pace migration/once-only backups/reloads, preserved escrow/shipment phases and bounded reduced-motion celebrations.');

// Shipping guidance must match the unlocked recipe, construction reserve and paid snapshot.
const previewCamp=rich();previewCamp.orders.reserved=false;previewCamp.orders.queued=false;previewCamp.orders.mode='mixed';
const previewBefore=JSON.stringify(previewCamp);assert.equal(c.shipmentStatus(previewCamp).kind,'wood','Home II never previews locked mixed orders');assert.equal(c.shipmentStatus(previewCamp).gold,4);assert.equal(JSON.stringify(previewCamp),previewBefore,'preview is read-only');
previewCamp.wood=c.offer(previewCamp).wood+7;previewCamp.food=0;previewCamp.orders.queued=true;
assert.equal(c.shipmentStatus(previewCamp).missingWood,5,'only spare wood counts, preserving construction');assert.equal(c.shipmentStatus(previewCamp).missingFood,0);
const paidPreview=structuredClone(camp);paidPreview.orders.reserved=false;paidPreview.orders.queued=false;paidPreview.orders.mode='mixed';paidPreview.freightWinch=true;
assert.equal(c.shipmentStatus(paidPreview).kind,'mixed');assert.equal(c.shipmentStatus(paidPreview).duration,5);
Object.assign(paidPreview.orders,{reserved:true,activeKind:'wood',duration:4,gold:4,clock:2,queued:true});
assert.equal(c.shipmentStatus(paidPreview).kind,'wood');assert.equal(c.shipmentStatus(paidPreview).gold,4);assert.equal(c.shipmentStatus(paidPreview).duration,4,'paid shipment ignores next mode and new winch');assert.equal(c.shipmentStatus(paidPreview).missingWood,0);
assert(mainSource.includes("o.node==='lodge'?'CHOOSE JOB':clearedCount(s)<o.trees?'CUT TREES':'SHIP WOOD'"),'gated purchase names the remaining task');
assert(mainSource.includes("$('order-mode').hidden=!s.home3")&&mainSource.includes("$('ship-wood').onclick=queueShipment"),'locked recipe stays hidden and both shipment controls share feedback');
console.log('PASS: unlocked shipment previews, protected construction deficits, unchanged paid snapshots, honest queue feedback and actionable gated objectives.');

// Return loop uses separate managed IDs, the existing processor and the bounded encounter.
import * as town from '../src/town.js?v=45';
const townCamp=()=>{const s=structuredClone(frontier);s.returns=1;s.town=town.initialTown();s.wood=300;s.food=300;s.gold=300;s.orders.reserved=false;s.orders.queued=false;s.orders.enabled=true;return s;};
let jobs=townCamp();n.setNavigationState(jobs);assert(town.townUnlocked(jobs));assert.equal(f.TREES.length,75);assert.equal(f.JOB_TREES.length,36);assert.equal(c.offer(jobs).action,'lodge0');assert(c.offer(jobs).gated);assert(!c.purchase(jobs,'lodge0'));
const permanent=JSON.stringify(jobs.forest);assert(town.startJob(jobs,'timber'));assert(!town.startJob(jobs,'supply'));
for(const tree of f.JOB_TREES.filter(t=>t.variant===0)){assert(n.route([0,3.5],tree.approach).length,'managed approach '+tree.id);for(let i=0;i<tree.hp/3;i++)assert(c.chopTree(jobs,tree.id));const bank=jobs.wood;assert.equal(c.chopTree(jobs,tree.id),null);assert.equal(jobs.wood,bank);}
assert.equal(jobs.town.active.status,'won');assert.equal(JSON.stringify(jobs.forest),permanent);const beforeClaim=jobs.gold;assert(town.claimJob(jobs));assert.equal(jobs.gold,beforeClaim+4);assert.equal(town.claimJob(jobs),null);assert.equal(jobs.town.jobsDone,1);assert(!c.offer(jobs).gated);
assert.equal(c.dropSupply(jobs),'wood');const partial=c.normalize(jobs);assert.equal(partial.supplied.action,'lodge0');assert.equal(partial.supplied.wood,1);assert(c.offer(partial,'buy_bow').action==='lodge0','paid lodge supplies stay with their stage');assert(c.purchase(partial,'lodge0'));assert.equal(partial.town.stage,1);assert(!c.purchase(partial,'lodge0'));assert(c.offer(partial).gated);
for(let stage=1;stage<4;stage++){partial.town.jobsDone++;const before=partial.wood;assert(c.purchase(partial,'lodge'+stage));assert.equal(partial.wood,before-[30,40,50,60][stage]);}assert.equal(partial.town.stage,4);
for(let variant=0;variant<3;variant++){const s=townCamp();s.town.counts.timber=variant;n.setNavigationState(s);assert(town.startJob(s,'timber'));const tree=f.JOB_TREES.find(t=>t.variant===variant);c.chopTree(s,tree.id);const loaded=c.normalize(s);assert.equal(loaded.town.active.damage[tree.id],3);for(const tree of f.JOB_TREES.filter(t=>t.variant===variant))assert(n.route([0,3.5],tree.approach).length,'variant approach '+tree.id);assert(town.leaveJob(s));assert.equal(JSON.stringify(s.forest),permanent);}
for(const variant of [0,1,2]){const s=townCamp();s.town.counts.supply=variant;Object.assign(s.orders,{reserved:true,activeKind:'wood',duration:4,clock:1.75});const paid=JSON.stringify({kind:s.orders.activeKind,duration:s.orders.duration,clock:s.orders.clock});assert(town.startJob(s,'supply'));assert.equal(JSON.stringify({kind:s.orders.activeKind,duration:s.orders.duration,clock:s.orders.clock}),paid);const live=structuredClone(s),offline=structuredClone(s);for(let i=0;i<500;i++)c.advance(live,.1);c.advance(offline,50);for(const k of ['wood','food','gold','deliveries','crewDeliveries'])assert.equal(live[k],offline[k]);assert.equal(live.town.active.loads,offline.town.active.loads);assert(Math.abs(live.town.active.elapsed-offline.town.active.elapsed)<1e-7);assert.equal(offline.town.active.status,'won');assert.equal(offline.town.jobsDone,0,'offline completion is not an unclaimed payout');const reloaded=c.normalize(offline);assert.equal(reloaded.town.active.status,'won');const a=JSON.stringify(reloaded.orders);town.claimJob(reloaded);assert.equal(JSON.stringify(reloaded.orders),a);assert.equal(town.claimJob(reloaded),null);}
for(let variant=0;variant<3;variant++)for(const stage of [0,4]){const s=townCamp();s.town.stage=stage;s.town.jobsDone=stage;s.town.counts.convoy=variant;n.setNavigationState(s);assert(n.route([0,3.5],town.LODGE_APPROACH).length);assert(town.startJob(s,'convoy'));const w=e.beginConvoy(s);assert(w,'checked convoy route '+variant);assert.equal(w.warmth,stage===4?140:100);let prev=w.convoy.path[0];for(const p of w.convoy.path.slice(1)){assert(n.clear(prev,p));prev=p;}const interrupted=c.normalize(s);assert.equal(interrupted.town.active.status,'ready');assert.equal(interrupted.town.active.elapsed,0);let peak=0;const bank=[s.wood,s.food,s.gold];for(let i=0;w.status==='active'&&i<2000;i++){e.tickWatch(w,.02,s,w.convoy.position,c.axeAngleAt(s,i*.02),c.axeAngleAt(s,(i+1)*.02));peak=Math.max(peak,w.enemies.filter(e=>e.active).length);}assert(peak<=6);assert.equal(w.spawned,9);assert.equal(w.status,'won','following cargo with an upgraded weapon succeeds');assert.equal(w.convoy.progress,1);assert.deepEqual([s.wood,s.food,s.gold],bank,'encounter never pays or spends bank');const fail=e.beginConvoy(interrupted);for(let i=0;fail.status==='active'&&i<1800;i++)e.tickWatch(fail,.02,interrupted,[-10,6],0,0);assert.equal(fail.status,'lost');interrupted.town.active.status='lost';assert(e.beginConvoy(interrupted),'retry costs no resources');}
const oldTown=townCamp();delete oldTown.returns;oldTown.supplied={wood:0,food:0};oldTown.last=1000;oldTown.orders.enabled=false;const townMap=new Map([['town',JSON.stringify(oldTown)]]),townStorage={getItem:k=>townMap.get(k),setItem:(k,v)=>townMap.set(k,v)};const firstTown=c.load(townStorage,'town',1000);assert.equal(townMap.get('town-pre-return-loop'),JSON.stringify(oldTown));assert.equal(firstTown.state.wood,oldTown.wood);const savedTown=townMap.get('town-pre-return-loop');c.load(townStorage,'town',1000);assert.equal(townMap.get('town-pre-return-loop'),savedTown);n.setNavigationState(null);
console.log('PASS: separate managed trees, three varied jobs, per-stage escrow/costs/gates, idempotent claim, real shipment parity/snapshots, checked moving convoy/nine wolves/six cap, free retry/interruption and permanent guard armor.');

const returnSupply=townCamp();town.startJob(returnSupply,'supply');returnSupply.last=1000;const returnMap=new Map([['return-supply',JSON.stringify(returnSupply)]]),returnStorage={getItem:k=>returnMap.get(k),setItem:(k,v)=>returnMap.set(k,v)};const awayJob=c.load(returnStorage,'return-supply',1000+30000),againJob=c.load(returnStorage,'return-supply',1000+30000);assert.equal(awayJob.state.town.active.status,'won');assert.equal(againJob.state.town.jobsDone,0);for(const k of ['wood','food','gold'])assert.equal(againJob.state[k],awayJob.state[k]);assert.equal(againJob.state.town.active.loads,awayJob.state.town.active.loads);town.claimJob(againJob.state);const claimedBank=againJob.state.gold;assert.equal(town.claimJob(againJob.state),null);assert.equal(againJob.state.gold,claimedBank);
const pausedJob=townCamp();town.startJob(pausedJob,'supply');pausedJob.orders.enabled=false;const pausedWood=pausedJob.wood;c.advance(pausedJob,12);assert.equal(pausedJob.town.active.loads,0);assert(pausedJob.wood>pausedWood);const loadBeforeLeave=JSON.stringify(pausedJob.orders);town.leaveJob(pausedJob);assert.equal(JSON.stringify(pausedJob.orders),loadBeforeLeave);
assert(mainSource.includes("!a&&townUnlocked(s)&&s.town.stage<4&&(!currentOffer().action||currentOffer().gated)"),'active timber guidance does not reopen the board');
assert(mainSource.includes("distance(s.mara,LOCATIONS.ship)>2")&&mainSource.includes("$('jobs').hidden=true;guide();}else renderJobs()"),'cargo starts nearby and claim leads directly to the paid build');
console.log('PASS: offline job completes without auto-claim/repeat-load reward, pause preserves worker output, leaving keeps shipments and active-job guidance remains actionable.');

assert(mainSource.includes('guided&&fighting()&&watch.convoy&&!path.length')&&mainSource.includes("cancel();padArmed=true;const length"),'convoy guidance persists until manual movement cancels it');
assert(mainSource.includes('woodPopAmount+=Number(text.slice(3))')&&mainSource.includes('woodPop?.remove()'),'rapid tree contacts aggregate into one bounded pop without changing rewards');
assert(mainSource.includes("querySelectorAll('#purchase .close,#purchase .backdrop')"),'upgrade close handlers cannot replace the jobs close handlers');
assert(mainSource.includes('const at=s.town.stage<4?LODGE:s.mara')&&mainSource.includes("stage<4?' · +1 BUILD CONTRIBUTION':''"),'finished-project rewards stay with Mara without advertising an unusable build step');

// Every visible pine is a selectable, reachable logical tree, including former scenery.
assert.equal(f.SCENERY_TREES.length,16);assert.equal(f.PERMANENT_TREES.length,103);assert.equal(new Set(f.ALL_TREES.map(t=>t.id)).size,f.ALL_TREES.length);
assert(!worldSource.includes('function pine('),'no invulnerable procedural pine remains');
const scenerySave=c.initial(),sceneryTree=f.SCENERY_TREES[0];
assert(c.chopTree(scenerySave,sceneryTree.id));let sceneryReload=c.normalize(JSON.parse(JSON.stringify(scenerySave)));
assert.equal(f.treeDamage(sceneryReload,sceneryTree),2,'partial scenery damage survives reload');
assert.equal(f.clearedCount(sceneryReload),0,'scenery cannot advance the 75 frontier gates');
for(const tree of f.SCENERY_TREES.filter(t=>!t.grove)){while(f.treeAlive(sceneryReload,tree))assert(c.chopTree(sceneryReload,tree.id));const stock=sceneryReload.wood;assert.equal(c.chopTree(sceneryReload,tree.id),null);assert.equal(sceneryReload.wood,stock,'cleared scenery cannot pay again');}
sceneryReload=c.normalize({...sceneryReload,forest:{...sceneryReload.forest,scenery:{cleared:[...sceneryReload.forest.scenery.cleared,'invalid',sceneryTree.id],damage:{[sceneryTree.id]:999,invalid:4}}}});
assert.equal(sceneryReload.forest.scenery.cleared.length,15);assert.equal(f.treeDamage(sceneryReload,sceneryTree),0);assert.equal(f.clearedCount(sceneryReload),0);assert(!f.sectorOpen(sceneryReload,1));
assert.equal(c.chopTree(sceneryReload,f.SCENERY_TREES.at(-1).id),null,'grove scenery waits for the visible grove');
for(const state of [c.initial(),townCamp()]){n.setNavigationState(state);for(const tree of f.SCENERY_TREES.filter(t=>f.treeAlive(state,t))){for(const spin of [false,true]){const at=f.treeApproach(tree,spin),path=n.route([0,3.5],at);assert(path.length,'reachable scenery '+tree.id);let prev=[0,3.5];for(const p of path){assert(n.clear(prev,p));prev=p;}assert(n.distance(tree.position,at)<=c.axeStats(state).radius+.45,'axe reaches scenery trunk');}c.chopTree(state,tree.id);assert.equal(c.normalize({...state,mara:tree.approach}).mara[0],tree.approach[0],'outer approach survives load');}assert(!n.walkable([2,-9])||f.sectorOpen(state,2),'larger camp preserves district gates');}
const allCut=townCamp();for(const tree of f.SCENERY_TREES)while(f.treeAlive(allCut,tree))c.chopTree(allCut,tree.id);assert.equal(f.clearedCount(allCut),75);assert(town.townUnlocked(allCut),'extra clearance does not break completed-frontier jobs');
const cutAgain=c.normalize(JSON.parse(JSON.stringify(allCut)));for(const tree of f.SCENERY_TREES)assert(!f.treeAlive(cutAgain,tree),'scenery stump persists '+tree.id);
n.setNavigationState(null);
console.log('PASS: all 16 scenery pines cuttable/reachable, sparse damage and permanent stumps/reward guard, existing saves, preserved 75-tree gates/jobs and bounded shared rendering.');

assert(!n.clear([7,-8],[4,-4]),'continuous segment cannot clip the mill corner between samples');

const scenerySweep=townCamp(),sceneryTarget=f.SCENERY_TREES[3],sceneryGuard={last:new Map(),passes:new Map()};const sceneryContacts=c.cutSweep(scenerySweep,sceneryTarget.approach,0,TAU,sceneryTarget.id,sceneryGuard);assert(sceneryContacts.some(hit=>hit.id===sceneryTarget.id),'visible sweep contacts scenery');assert.equal(c.cutSweep(scenerySweep,sceneryTarget.approach,0,TAU,sceneryTarget.id,sceneryGuard).length,0,'scenery uses the same per-revolution hit guard');
const sceneryWatch=townCamp();sceneryWatch.frontierWon=false;sceneryWatch.weapons.equipped='hatchet';n.setNavigationState(sceneryWatch);const sceneryFight=e.beginWatch(sceneryWatch,true);let sceneryTime=0;while(sceneryFight.status==='active'){const from=c.axeAngleAt(sceneryWatch,sceneryTime);sceneryTime+=.05;e.tickWatch(sceneryFight,.05,sceneryWatch,n.WATCH_POST,from,c.axeAngleAt(sceneryWatch,sceneryTime));for(const enemy of sceneryFight.enemies)if(enemy.active)assert(n.walkable(enemy.position),'wolf never spawns/walks inside a newly solid tree');}assert.equal(sceneryFight.status,'won');n.setNavigationState(null);

await import('./check-expansion.mjs');

await import('./check-commerce.mjs');
