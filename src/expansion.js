// A working western frontier, paid for by the original camp.
export const EXP_LOCATIONS={trade:[-8,3.3],bridge:[-10,3.3],tool:[-17.4,3.3],outpost:[-22,0],stone:[-24,4]};
export const MINER_BASE=[-24.5,.5];
export const RIDGE_BOUNDS=[-29,-13,-8,11];
export const RIDGE_LANES=[[-12.2,3.3],[-14,3.3],[-17,3.3],[-20,3.3],[-23,3.3],[-26,3.3],[-20,-3],[-26,-3],[-20,8],[-26,10],[-23,6],[-23,9.5],[-17,6],[-17,9.5]];
export const RIDGE_TREES=[[-18,-5],[-22,-5],[-26,-5],[-25,8]].flatMap((c,i)=>[0,1,2].map(j=>({id:'ridge-tree-'+(i*3+j),ridge:true,sector:4,hp:9,position:[c[0]+[0,-.8,.8][j],c[1]+[0,-.4,-.4][j]],approach:[c[0],c[1]+1.45],size:.85+j*.045})));
export const ROCKS=[[-18,7],[-20,7],[-22,7],[-27,6],[-27,4],[-27,1],[-27,-1],[-25,-3],[-21,-3],[-17,-1]].map((position,i)=>({id:'ridge-rock-'+i,position,approach:[position[0],position[1]+1.15],hp:12,size:.65+(i%3)*.12}));
export const ROCK_BY_ID=new Map(ROCKS.map(t=>[t.id,t]));
export const initialExpansion=()=>({post:false,contracts:0,bridge:0,breaker:false,outpost:0,minerClock:0,stock:0,stoneShipped:0,trees:{cleared:[],damage:{}},rocks:{cleared:[],damage:{}}});
export const minerInterval=s=>s.expansion.outpost===4?4:4.8;
export const minerYield=s=>s.expansion.outpost>=2?6:3;
const integer=(v,max=1e9)=>Number.isFinite(v)?Math.max(0,Math.min(max,Math.floor(v))):0;
export function normalizeExpansion(raw,s){const x=initialExpansion();if(s.town.stage!==4||!raw)return x;x.post=raw.post===true;x.contracts=x.post?integer(raw.contracts):0;x.bridge=x.post?integer(raw.bridge,3):0;x.breaker=x.bridge===3&&raw.breaker===true;x.outpost=x.breaker?integer(raw.outpost,4):0;x.stock=x.outpost?integer(raw.stock,60):0;x.stoneShipped=integer(raw.stoneShipped);x.minerClock=x.outpost&&Number.isFinite(raw.minerClock)?Math.max(0,Math.min(x.outpost===4?4:4.8,raw.minerClock)):0;for(const [key,sites] of [['trees',RIDGE_TREES],['rocks',ROCKS]]){if(x.bridge!==3)continue;const ids=new Set(sites.map(t=>t.id)),source=raw[key];x[key].cleared=[...new Set((Array.isArray(source?.cleared)?source.cleared:[]).filter(id=>ids.has(id)))];for(const site of sites){const damage=integer(source?.damage?.[site.id],site.hp-1);if(damage&&!x[key].cleared.includes(site.id))x[key].damage[site.id]=damage;}}return x;}
export const EXPANSION_RECIPES={
 trade:[36,18,20,'TRADING POST','Put your town on the trade route.','BUILD TRADING POST','Timber +50% coin value · active wagons','trade'],
 bridge0:[24,10,12,'BRIDGE · FOUNDATION','Complete three shipments, then rebuild the crossing.','BUILD FOUNDATION','First bridge section · Stone Ridge preview','bridge'],
 bridge1:[32,14,16,'BRIDGE · DECK','Your workers supply the next section.','LAY THE DECK','Second section · almost across','bridge'],
 bridge2:[40,18,20,'OPEN STONE RIDGE','Finish the rails and cross the river.','OPEN THE BRIDGE','New forest · stone deposits · second outpost','bridge'],
 breaker:[12,6,28,'ROCK BREAKER','Clear four ridge trees to reach the tool cache.','BUY ROCK BREAKER','New hammer · 4 damage · +2 stone per hit','tool'],
 outpost0:[24,12,20,'STONE OUTPOST','Break two rocks to establish a quarry.','BUILD OUTPOST','Miner fills a local stone stockpile','outpost',0,12],
 outpost1:[20,8,12,'HAUL CART','Give your miner a delivery route.','BUILD HAUL CART','Automatic stone delivery · 3 → 6 per cycle','outpost',0,12],
 outpost2:[28,12,18,'STONEWORKS','Turn the quarry into a processing business.','BUILD STONEWORKS','8 stone → 12 coins · processing machinery','outpost',0,20],
 outpost3:[32,12,20,'CONNECT THE CAMPS','Finish six deposits and eight ridge trees.','OPEN FREIGHT LINK','Wagon route · faster mining and all shipments','outpost',0,24]
};
export function expansionAction(s){const x=s.expansion;if(s.town.stage!==4)return null;return !x.post?'trade':x.bridge<3?'bridge'+x.bridge:!x.breaker?'breaker':x.outpost<4?'outpost'+x.outpost:null;}
export function expansionGate(s,action){const x=s.expansion;const gate=(kind,current,target,label,node)=>current<target?{kind,current,target,label,node}:null;return action==='bridge0'?gate('ship',x.contracts,3,'SHIPMENTS','ship'):action==='breaker'?gate('trees',x.trees.cleared.length,4,'RIDGE TREES','wood'):action==='outpost0'?gate('rocks',x.rocks.cleared.length,2,'ROCKS','stone'):action==='outpost3'?gate('trees',x.trees.cleared.length,8,'RIDGE TREES','wood')||gate('rocks',x.rocks.cleared.length,6,'ROCKS','stone'):null;}
export function buyExpansion(s,action){const x=s.expansion;if(action==='trade')x.post=true;else if(action.startsWith('bridge'))x.bridge++;else if(action==='breaker')x.breaker=true;else if(action.startsWith('outpost')){const phase=x.minerClock/minerInterval(s);x.outpost++;x.minerClock=phase*minerInterval(s);if(action==='outpost2')s.orders.mode='stone';}}
export const rockAlive=(s,t)=>s.expansion.bridge===3&&!s.expansion.rocks.cleared.includes(t.id);
export function mineRock(s,id){const t=ROCK_BY_ID.get(id);if(!t||!s.expansion.breaker||!rockAlive(s,t))return null;const stand=s.expansion.rocks,damage=(stand.damage[id]||0)+4;s.stone+=2;const cleared=damage>=t.hp;if(cleared){stand.cleared.push(id);delete stand.damage[id];}else stand.damage[id]=damage;return {id,position:t.position,cleared,stone:2};}
export function collectStone(s){const n=Math.min(6,s.expansion.stock);s.expansion.stock-=n;s.stone+=n;return n;}
