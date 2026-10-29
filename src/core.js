import {initialCommerce,normalizeCommerce,COMMERCE_RECIPES,commerceAction,commerceGate,tickCommerce} from './commerce.js?v=45';
import {TREES,SCENERY_TREES,CAMP_RADIUS,ALL_TREES,ALL_TREE_BY_ID,clearedCount,treeAlive,treeStand,sweepPass} from './forest.js?v=45';
import {initialTown,normalizeTown,townUnlocked,jobShipment} from './town.js?v=45';
import {initialExpansion,normalizeExpansion,expansionAction,expansionGate,EXPANSION_RECIPES,buyExpansion,minerInterval,minerYield} from './expansion.js?v=45';
export const SAVE_KEY='hearthline-3d-save-v1';
export const PLAYER_SPEED=6.6,GATHER_SECONDS=.52,REGROW_SECONDS=.18,DROP_SECONDS=.08;
export const WEAPONS=Object.freeze({hatchet:{damage:2,range:1.8,cooldown:.9},spear:{damage:4,range:2.6,cooldown:.8},bow:{damage:3,range:5.2,cooldown:.65},sword:{damage:2,range:1.9,cooldown:.32}});
export const interval=(level=1)=>Math.max(3.6,(56-(Math.max(1,level)-1)*6)/10);
export const yieldFor=s=>Math.ceil(Math.max(1,s.level));
export const axeStats=s=>s.axeTriple?{yield:5,damage:3,radius:2.6,period:.4,spin:true,triple:true}:{yield:s.axeSharp?5:3,damage:s.axeSharp?3:2,radius:1.8,period:.9,spin:!!s.axeSpin};
export const axeAngleAt=(s,time)=>time*Math.PI*2/axeStats(s).period;
export function weaponStats(s,kind=s.weapons?.equipped||'hatchet'){return kind==='hatchet'?{damage:axeStats(s).damage,range:axeStats(s).radius,cooldown:axeStats(s).period}:{...WEAPONS[kind],damage:s.weapons?.[kind]===2?{spear:8,bow:4,sword:4}[kind]:WEAPONS[kind].damage};}
export const shipmentRecipe=(s,kind=s.orders.mode)=>kind==='stone'?{wood:0,food:0,stone:8,gold:12,duration:s.expansion.outpost===4?3:5}:kind==='wood'?{wood:12,food:0,stone:0,gold:s.expansion.post?6:4,duration:s.expansion.outpost===4?2.5:s.freightWinch?3:4}:{wood:12,food:6,stone:0,gold:s.expansion.post?12:8,duration:s.expansion.outpost===4?4:s.freightWinch?5:6};
// One read-only preview for the tray and pads; active reservations keep their paid recipe/duration.
export function shipmentStatus(s){const kind=s.orders.reserved?s.orders.activeKind:s.orders.queued||!s.home3?'wood':s.orders.mode,r=shipmentRecipe(s,kind),o=offer(s);return {...r,gold:s.orders.reserved?(s.orders.gold??r.gold):r.gold,kind,missingStone:s.orders.reserved?0:Math.max(0,r.stone-Math.max(0,s.stone-(o.stone||0))),duration:s.orders.reserved?s.orders.duration:r.duration,missingWood:s.orders.reserved?0:Math.max(0,r.wood-Math.max(0,s.wood-o.wood)),missingFood:s.orders.reserved?0:Math.max(0,r.food-Math.max(0,s.food-o.food))};}
export const crewInterval=s=>s.mill===2?4:4.8;
export const crewYield=s=>s.mill===2?6:4;
const recipes={
 ...EXPANSION_RECIPES,...COMMERCE_RECIPES,
 build:[5,3,0,'Bring the hearth to life','Repair your home and light the fire.','LIGHT THE HEARTH','Warm fire · repaired cabin · +10 coins','home'],
 recruit:[0,0,0,'Let Rowan take the route','Rowan brings wood and berries while you explore.','WELCOME ROWAN','Free · automatic supplies · +5 coins','rowan'],
 upgrade:[5,3,0,'Grow your operation','Improve the home and open your workshop.','BUILD LEVEL 2','Double loads · faster routes · +6 coins','home'],
 sharpen:[6,4,6,'Give your axe an edge','Bigger harvests now. Stronger hits against the horde.','SHARPEN AXE',axeStats({}).yield+' → '+axeStats({axeSharp:true}).yield+' wood · '+axeStats({}).damage+' → '+axeStats({axeSharp:true}).damage+' damage','workshop'],
 spin:[10,6,10,'Let the axe fly','Unlock a spinning axe for harvesting and defense.','UNLOCK SPIN',axeStats({axeSharp:true}).yield+' wood per revolution · automatic sweeping hits','workshop'],
 brace:[4,3,0,'Brace the camp','An optional defense before the wolves arrive.','BUILD DEFENSES','Visible barricades · half hearth damage','home'],
 watch:[0,0,0,'Take the first watch','Drag the left side or tap ground. Mara attacks automatically.','START THE HORDE','Three waves · 35 seconds · +25 coins · Timber Grove','home'],
 mill:[16,10,8,'A new grove, a new crew','Build the sawmill and put a woodcutter to work.','BUILD SAWMILL','Dedicated crew · +4 wood every '+crewInterval({mill:1})+' seconds','mill'],
 train:[20,12,10,'Put the timber crew in gear','Larger stacks and faster wood deliveries.','TRAIN WOOD CREW','4 → 6 wood · '+crewInterval({mill:1})+' → '+crewInterval({mill:2})+' seconds','mill'],
 home3:[24,16,14,'Raise your camp to level 3','Turn a busy camp into a working timber network.','BUILD LEVEL 3','Rowan +3 per '+interval(3)+'s · automatic paid orders','home'],
 triple:[24,12,24,'TRIPLE SPIN','Clear 10 trees and ship timber.','TRIPLE SPIN','Continuous spin · 2.25× faster · wider reach · 3 trees','workshop',10],
 forge:[24,12,12,'UNLOCK FORGE','Clear the northern frontier.','BUILD FORGE','Spear · bow · sword','workshop',25],
 watch2:[0,0,0,'DEFEND FROSTWOOD','Drag the left side or tap ground. Your weapon attacks automatically.','DEFEND','Stronger wolves · +30 coins · Frostwood','home',50],
 winch:[24,12,16,'FREIGHT WINCH','Clear Frostwood for a stronger timber route.','UPGRADE FREIGHT','Wood: 4 → 3s · orders: 6 → 5s','mill',75]
};
for(const [kind,cost,improve] of [['spear',18,12],['bow',22,14],['sword',16,10]]){recipes['buy_'+kind]=[0,0,cost,kind.toUpperCase(),'Arm Mara for the frontier.','BUY '+kind.toUpperCase(),{spear:'Reach · pierce two wolves',bow:'Range · visible arrows',sword:'Fast · close sweep'}[kind],'workshop'];recipes['improve_'+kind]=[0,0,improve,kind.toUpperCase()+' II','A decisive improvement.','UPGRADE '+kind.toUpperCase(),{spear:'8 damage · one hit vs 8 health',bow:'4 damage · two hits vs 8 health',sword:'4 damage · two hits vs 8 health'}[kind],'workshop'];}
for(let stage=0;stage<4;stage++)recipes['lodge'+stage]=[[30,40,50,60][stage],[12,16,20,24][stage],[8,10,12,16][stage],'WATCH LODGE · '+(stage+1)+' / 4','One job advances the next construction stage.','BUILD '+['FOUNDATION','WALLS','ROOF','WATCH LODGE'][stage],stage===3?'Guard escort · +40 convoy armor · patrol active':['Foundation and timber arrive','Walls rise above the frontier','Roof, banners and scaffolding'][stage],'lodge'];
const count=(v,max=Number.MAX_SAFE_INTEGER)=>Number.isFinite(v)?Math.max(0,Math.min(max,Math.floor(v))):0;
export function initial(){return {version:1,progression:2,pace:1,returns:1,town:initialTown(),commerceVersion:1,commerce:initialCommerce(),expansionVersion:1,expansion:initialExpansion(),stone:0,wood:0,food:0,gold:0,stage:0,level:1,workers:0,workerMode:'balanced',workerType:'wood',workerClock:0,deliveries:0,last:Date.now(),mara:[0,3.5],sound:false,supplied:{wood:0,food:0},axeSharp:false,axeSpin:false,axeTriple:false,braced:false,watchWon:false,frontierWon:false,chapter:1,mill:0,home3:false,forge:false,freightWinch:false,forest:{cleared:[],damage:{},scenery:{cleared:[],damage:{}}},weapons:{equipped:'hatchet',spear:0,bow:0,sword:0},crewClock:0,crewDeliveries:0,orders:{enabled:true,reserved:false,clock:0,completed:0,woodCompleted:0,mode:'mixed',activeKind:'mixed',duration:6,gold:8,queued:false}};}
export function normalize(raw){
 const s=initial();if(!raw||raw.version!==1)return s;
 for(const k of ['wood','food','gold','stone','deliveries','crewDeliveries'])s[k]=count(raw[k]);
 s.stage=count(Number(raw.stage),3);s.workers=s.stage>=2?1:0;
 s.axeSharp=s.stage===3&&raw.axeSharp===true;s.axeSpin=s.axeSharp&&raw.axeSpin===true;s.braced=s.stage===3&&raw.braced===true;s.watchWon=s.axeSpin&&raw.watchWon===true;s.chapter=s.watchWon?2:1;
 s.mill=s.watchWon?count(raw.mill,2):0;s.home3=s.mill===2&&raw.home3===true;s.level=s.home3?3:s.stage===3?2:1;
 for(const [stand,source,trees] of [[s.forest,raw.forest,TREES],[s.forest.scenery,raw.forest?.scenery,SCENERY_TREES]]){const ids=new Set(trees.map(t=>t.id));stand.cleared=[...new Set(Array.isArray(source?.cleared)?source.cleared.filter(id=>ids.has(id)):[])];for(const t of trees){const damage=count(source?.damage?.[t.id],t.hp-1);if(damage&&!stand.cleared.includes(t.id))stand.damage[t.id]=damage;}}
 s.axeTriple=s.home3&&raw.axeTriple===true;s.forge=s.axeTriple&&raw.forge===true;
 for(const kind of ['spear','bow','sword'])s.weapons[kind]=s.forge?count(raw.weapons?.[kind],2):0;
 s.weapons.equipped=['spear','bow','sword'].includes(raw.weapons?.equipped)&&s.weapons[raw.weapons.equipped]>0?raw.weapons.equipped:'hatchet';s.frontierWon=s.forge&&raw.frontierWon===true;s.chapter=s.frontierWon?3:s.watchWon?2:1;s.freightWinch=s.frontierWon&&raw.freightWinch===true;s.town=normalizeTown(raw.town,s);s.expansion=normalizeExpansion(raw.expansion,s);s.commerce=normalizeCommerce(raw.commerce,s);
 s.workerMode=['balanced','wood','food'].includes(raw.workerMode)?raw.workerMode:'balanced';s.workerType=raw.workerType==='food'?'food':'wood';
 const paceScale=raw.pace===1?1:.8; // v32 shortens worker cycles by 20%; retain the carried-load phase.
 s.workerClock=Number.isFinite(raw.workerClock)?Math.max(0,Math.min(interval(s.level),raw.workerClock*paceScale)):0;s.crewClock=s.mill&&Number.isFinite(raw.crewClock)?Math.max(0,Math.min(crewInterval(s),raw.crewClock*paceScale)):0;
 s.last=Number.isFinite(raw.last)?Math.min(Date.now(),raw.last):Date.now();s.sound=raw.sound===true;
 if(Array.isArray(raw.mara)&&raw.mara.length===2&&raw.mara.every(Number.isFinite))s.mara=[Math.max(-29,Math.min(CAMP_RADIUS[0],raw.mara[0])),Math.max(-33,Math.min(CAMP_RADIUS[1],raw.mara[1]))];
 const action=raw.supplied?.action||(s.stage===0?'build':s.stage===2?'upgrade':null),primary=baseOffer(s);
 if(action&&(action===primary.action||action==='brace'&&s.stage===3&&!s.braced&&!s.watchWon)){const r=recipes[action];s.supplied={action,wood:count(raw.supplied?.wood,r[0]),food:count(raw.supplied?.food,r[1]),...(COMMERCE_RECIPES[action]?{gold:count(raw.supplied?.gold,r[2])}:{}),...(r[9]?{stone:count(raw.supplied?.stone,r[9])}:{})};}
 s.orders.enabled=raw.orders?.enabled!==false;s.orders.completed=count(raw.orders?.completed);s.orders.woodCompleted=count(raw.orders?.woodCompleted);s.orders.mode=['wood','mixed',...(s.expansion.outpost>=3?['stone']:[])].includes(raw.orders?.mode)?raw.orders.mode:'mixed';s.orders.activeKind=['wood','mixed',...(s.expansion.outpost>=3?['stone']:[])].includes(raw.orders?.activeKind)?raw.orders.activeKind:'mixed';s.orders.queued=s.stage===3&&raw.orders?.queued===true;
 s.orders.reserved=(s.orders.activeKind==='wood'?s.stage===3:s.home3)&&raw.orders?.reserved===true;const valid=s.orders.activeKind==='wood'?[2.5,3,4]:s.orders.activeKind==='stone'?[3,5]:[4,5,6];s.orders.gold=Number.isFinite(raw.orders?.gold)?count(raw.orders.gold,12):shipmentRecipe(s,s.orders.activeKind).gold;s.orders.duration=valid.includes(raw.orders?.duration)?raw.orders.duration:valid[1];s.orders.clock=s.orders.reserved&&Number.isFinite(raw.orders?.clock)?Math.max(0,Math.min(s.orders.duration,raw.orders.clock)):0;
 return s;
}
function recipe(action){const r=recipes[action];return {action,wood:r[0],food:r[1],gold:r[2],totalWood:r[0],totalFood:r[1],totalGold:r[2],title:r[3],copy:r[4],label:r[5],benefit:r[6],node:r[7],trees:r[8]||0,stone:r[9]||0,totalStone:r[9]||0};}
export function baseOffer(s){
 const owned=['spear','bow','sword'].some(k=>s.weapons?.[k]);const improve=['spear','bow','sword'].find(k=>s.weapons?.[k]===1);
 const action=s.stage===0?'build':s.stage===1?'recruit':s.stage===2?'upgrade':!s.axeSharp?'sharpen':!s.axeSpin?'spin':!s.watchWon?'watch':!s.mill?'mill':s.mill===1?'train':!s.home3?'home3':!s.axeTriple?'triple':!s.forge?'forge':!owned?'buy_spear':!s.frontierWon?'watch2':!s.freightWinch?'winch':townUnlocked(s)&&s.town.stage<4?'lodge'+s.town.stage:expansionAction(s)?expansionAction(s):commerceAction(s)?commerceAction(s):improve?'improve_'+improve:null;
 return action?recipe(action):{action:null,wood:0,food:0,gold:0,totalWood:0,totalFood:0,node:s.expansion.outpost===4?'trade':'mill',title:s.expansion.outpost===4?'STONE NETWORK ONLINE':'FRONTIER CLEARED',copy:'▰ → ◉ · AUTOMATION ON',label:'CAMP WORKING',benefit:s.expansion.outpost===4?'Three supply routes · stone processing · connected camps':'75 trees · stronger freight · visit the forge'};
}
export function offer(s,requested=null){
 const locked=s.supplied?.action&&(s.supplied.wood+s.supplied.food+(s.supplied.stone||0)+(s.supplied.gold||0))>0?s.supplied.action:null;
 const primary=baseOffer(s),optional=requested==='brace'&&s.stage===3&&!s.braced&&!s.watchWon||s.forge&&requested?.startsWith('buy_')&&!s.weapons[requested.slice(4)]&&recipes[requested]||s.forge&&requested?.startsWith('improve_')&&s.weapons[requested.slice(8)]===1&&recipes[requested];let o=locked?recipe(locked):optional?recipe(requested):primary;
 if(s.supplied?.action===o.action||!s.supplied?.action&&(o.action==='build'||o.action==='upgrade')){o.wood-=s.supplied?.wood||0;o.food-=s.supplied?.food||0;o.stone-=s.supplied?.stone||0;if(COMMERCE_RECIPES[o.action])o.gold-=s.supplied?.gold||0;}o.gated=o.action?.startsWith('lodge')&&s.town.jobsDone<=s.town.stage||clearedCount(s)<(o.trees||0)||o.action==='triple'&&!s.orders.woodCompleted;o.gate=expansionGate(s,o.action)||commerceGate(s,o.action);o.gated=!!o.gated||!!o.gate;return o;
}
export function dropSupply(s,requested=null){const o=offer(s,requested);if(COMMERCE_RECIPES[o.action]){if(o.gated||o.gold<=0||s.gold<1)return null;s.gold--;s.supplied.action=o.action;s.supplied.gold=(s.supplied.gold||0)+1;return 'gold';}if(!o.action||o.gated||['recruit','watch','watch2'].includes(o.action)||s.gold<o.gold)return null;const kind=o.wood>0&&s.wood>0?'wood':o.food>0&&s.food>0?'food':o.stone>0&&s.stone>0?'stone':null;if(!kind)return null;s.supplied.action=o.action;s[kind]--;s.supplied[kind]=(s.supplied[kind]||0)+1;return kind;}
export function purchase(s,action){
 const o=offer(s,action);if(action!==o.action||o.gated||['watch','watch2'].includes(action)||!o.action||s.wood<o.wood||s.food<o.food||s.stone<(o.stone||0)||s.gold<o.gold)return false;
 s.wood-=o.wood;s.food-=o.food;s.stone-=o.stone||0;s.gold-=o.gold;s.supplied={wood:0,food:0};
 if(action==='build'){s.stage=1;s.gold+=10;}
 if(action==='recruit'){s.stage=2;s.workers=1;s.workerMode='balanced';s.workerType='wood';s.workerClock=0;s.wood+=4;s.food+=3;s.gold+=5;}
 if(action==='upgrade'||action==='home3'){const old=interval(s.level);s.level=action==='home3'?3:2;s.stage=3;s.home3=action==='home3';s.workerClock=s.workerClock/old*interval(s.level);if(action==='upgrade')s.gold+=6;}
 if(action==='sharpen')s.axeSharp=true;if(action==='spin')s.axeSpin=true;if(action==='brace')s.braced=true;
 if(action==='mill'){s.mill=1;s.crewClock=0;}if(action==='train'){const old=crewInterval(s);s.mill=2;s.crewClock=s.crewClock/old*crewInterval(s);}
 if(action.startsWith('lodge'))s.town.stage++;if(action==='triple')s.axeTriple=true;if(action==='forge')s.forge=true;if(action==='winch')s.freightWinch=true;
 if(EXPANSION_RECIPES[action])buyExpansion(s,action);if(COMMERCE_RECIPES[action]){s.commerce.level++;s.commerce.authorized=null;if(s.commerce.level===4)s.commerce.cartPhase=39;if(s.commerce.level===6)s.commerce.cashPhase=47;}
 if(action.startsWith('buy_')){const kind=action.slice(4);s.weapons[kind]=1;s.weapons.equipped=kind;}if(action.startsWith('improve_'))s.weapons[action.slice(8)]=2;
 return true;
}
export function claimWatch(s){if(!s.axeSpin||s.watchWon)return false;s.watchWon=true;s.chapter=2;s.gold+=25;return true;}
export function claimFrontier(s){if(!s.forge||s.frontierWon||clearedCount(s)<50)return false;s.frontierWon=true;s.chapter=3;s.gold+=30;return true;}
export function gather(s,kind){if(!['wood','food'].includes(kind))return false;s[kind]+=kind==='wood'?axeStats(s).yield:3;if(kind==='food'||!s.home3)s.gold++;return true;}
export function chopTree(s,id){const tree=ALL_TREE_BY_ID.get(id);if(!tree||!treeAlive(s,tree))return null;const stand=treeStand(s,tree),damage=(stand.damage[id]||0)+axeStats(s).damage;gather(s,'wood');const cleared=damage>=tree.hp;if(cleared){stand.cleared.push(id);delete stand.damage[id];if(tree.job&&stand.type==='timber'&&stand.cleared.length===12)stand.status='won';}else stand.damage[id]=damage;return {id,position:tree.position,cleared,wood:axeStats(s).yield};}
export function cutSweep(s,player,from,to,target,guard){const stats=axeStats(s),contacts=[];if(to<=from)return contacts;const candidates=ALL_TREES.filter(t=>treeAlive(s,t)&&(stats.triple||t.id===target)&&Math.hypot(t.position[0]-player[0],t.position[1]-player[1])<=stats.radius+.45).sort((a,b)=>Math.hypot(a.position[0]-player[0],a.position[1]-player[1])-Math.hypot(b.position[0]-player[0],b.position[1]-player[1]));
 for(const tree of candidates){const pass=sweepPass(tree.position,player,from,to,stats.radius,guard.last.get(tree.id));if(pass===null)continue;let ids=guard.passes.get(pass);if(!ids){ids=new Set();guard.passes.set(pass,ids);}if(ids.size>=(stats.triple?3:1))continue;ids.add(tree.id);guard.last.set(tree.id,pass);const contact=chopTree(s,tree.id);if(contact)contacts.push(contact);}for(const pass of guard.passes.keys())if(pass<Math.floor(to/(Math.PI*2))-3)guard.passes.delete(pass);return contacts;}
export function deliveries(s,count){
 count=Math.max(0,Math.floor(count));if(!s.workers||!count)return {wood:0,food:0};const amount=yieldFor(s),kind=s.workerType;
 const w=s.workerMode==='balanced'?Math.floor(count/2)+(count%2&&kind==='wood'?1:0):(kind==='wood'?1:0)+(s.workerMode==='wood'?count-1:0);
 const result={wood:w*amount,food:(count-w)*amount};s.wood+=result.wood;s.food+=result.food;s.deliveries+=count;
 if(s.workerMode==='balanced'){if(count%2)s.workerType=kind==='wood'?'food':'wood';}else s.workerType=s.workerMode;return result;
}
function reserveOrder(s){if(!s.orders.enabled||s.orders.reserved||!s.home3&&!s.orders.queued)return;const kind=s.orders.queued?'wood':s.orders.mode,r=shipmentRecipe(s,kind),o=offer(s);if(Math.max(0,s.wood-o.wood)>=r.wood&&Math.max(0,s.food-o.food)>=r.food&&Math.max(0,s.stone-(o.stone||0))>=r.stone){s.wood-=r.wood;s.food-=r.food;s.stone-=r.stone;s.orders.reserved=true;s.orders.clock=0;s.orders.activeKind=kind;s.orders.duration=r.duration;s.orders.gold=r.gold;s.orders.queued=false;}}
export function shipWood(s){if(s.stage!==3)return false;s.orders.mode='wood';s.orders.queued=true;s.orders.enabled=true;reserveOrder(s);return true;}
export function advance(s,seconds){
 let left=Number.isFinite(seconds)?Math.max(0,Math.min(14400,seconds)):0;const result={wood:0,food:0,crewWood:0,gold:0,stone:0,quarry:0,marketGold:0,marketSales:0,commerceBuilt:null};
 if(!s.workers)return result;
 if(!s.mill&&!s.orders.reserved&&!s.orders.queued){s.workerClock+=left;const n=Math.floor((s.workerClock+1e-9)/interval(s.level));s.workerClock=Math.max(0,s.workerClock-n*interval(s.level));return {...result,...deliveries(s,n)};}
 // Bounded by four hours; commerce uses the same chronological live/offline events.
 reserveOrder(s);while(left>1e-9){const step=Math.min(left,s.commerce.level?Math.max(0,.25-s.commerce.clock):Infinity,Math.max(0,interval(s.level)-s.workerClock),s.mill?Math.max(0,crewInterval(s)-s.crewClock):Infinity,s.orders.reserved&&s.orders.enabled?Math.max(0,s.orders.duration-s.orders.clock):Infinity,s.expansion.outpost?Math.max(0,minerInterval(s)-s.expansion.minerClock):Infinity);if(s.town?.active?.type==='supply'&&s.town.active.status==='active')s.town.active.elapsed+=step;s.workerClock+=step;if(s.commerce.level)s.commerce.clock+=step;if(s.expansion.outpost)s.expansion.minerClock+=step;if(s.mill)s.crewClock+=step;if(s.orders.reserved&&s.orders.enabled)s.orders.clock+=step;left-=step;
  if(s.workerClock+1e-9>=interval(s.level)){s.workerClock=0;const r=deliveries(s,1);result.wood+=r.wood;result.food+=r.food;}
  if(s.mill&&s.crewClock+1e-9>=crewInterval(s)){s.crewClock=0;const n=crewYield(s);s.wood+=n;s.crewDeliveries++;result.wood+=n;result.crewWood+=n;}
  if(s.expansion.outpost&&s.expansion.minerClock+1e-9>=minerInterval(s)){s.expansion.minerClock=0;const n=minerYield(s);if(s.expansion.outpost>=2){s.stone+=n+s.expansion.stock;result.stone+=n+s.expansion.stock;s.expansion.stock=0;}else{const produced=Math.min(n,60-s.expansion.stock);s.expansion.stock+=produced;result.quarry+=produced;}}
  if(s.orders.reserved&&s.orders.enabled&&s.orders.clock+1e-9>=s.orders.duration){const gold=s.orders.gold??(s.orders.activeKind==='wood'?4:8);if(s.expansion.post)s.expansion.contracts++;if(s.orders.activeKind==='stone')s.expansion.stoneShipped++;jobShipment(s,s.orders.activeKind);if(s.orders.activeKind==='wood')s.orders.woodCompleted++;s.orders.reserved=false;s.orders.clock=0;s.orders.completed++;s.gold+=gold;result.gold+=gold;}
  if(s.commerce.level&&s.commerce.clock+1e-9>=.25){s.commerce.clock=0;const before=s.commerce.collected,sold=s.commerce.sold;tickCommerce(s,offer(s).food);result.marketGold+=s.commerce.collected-before;result.marketSales+=s.commerce.sold-sold;
   if(s.commerce.enabled&&s.commerce.level>=6&&s.commerce.cashPhase===36&&s.commerce.authorized===commerceAction(s)){const action=s.commerce.authorized;for(let i=0;i<12;i++)if(!dropSupply(s,action))break;const o=offer(s);if(o.action===action&&!o.gold&&purchase(s,action))result.commerceBuilt=action;}
  }
  reserveOrder(s);
 }return result;
}
export function load(storage,key=SAVE_KEY,now=Date.now()){
 let raw=null,error=false,saved=true;try{raw=JSON.parse(storage.getItem(key)||'null');}catch{error=true;}
 if(raw&&raw.version===1&&!raw.progression){try{if(!storage.getItem(key+'-pre-progression'))storage.setItem(key+'-pre-progression',JSON.stringify(raw));}catch{saved=false;}}
 if(raw&&raw.version===1&&raw.progression!==2){try{if(!storage.getItem(key+'-pre-frontier'))storage.setItem(key+'-pre-frontier',JSON.stringify(raw));}catch{saved=false;}}
 if(raw&&raw.version===1&&raw.returns!==1){try{if(!storage.getItem(key+'-pre-return-loop'))storage.setItem(key+'-pre-return-loop',JSON.stringify(raw));}catch{saved=false;}}
 if(raw&&raw.version===1&&raw.pace!==1){try{if(!storage.getItem(key+'-pre-fast-pace'))storage.setItem(key+'-pre-fast-pace',JSON.stringify(raw));}catch{saved=false;}}
 if(raw&&raw.version===1&&raw.expansionVersion!==1){try{if(!storage.getItem(key+'-pre-stone-ridge'))storage.setItem(key+'-pre-stone-ridge',JSON.stringify(raw));}catch{saved=false;}}
 if(raw&&raw.version===1&&raw.commerceVersion!==1){try{if(!storage.getItem(key+'-pre-commerce'))storage.setItem(key+'-pre-commerce',JSON.stringify(raw));}catch{saved=false;}}
 const state=normalize(raw),away=raw&&raw.version===1?Math.min(14400,Math.max(0,(now-state.last)/1000)):0,credit=advance(state,away);state.last=now;
 try{storage.setItem(key,JSON.stringify(state));}catch{saved=false;}return {state,credit,away,error,saved};
}
export function save(storage,s,key=SAVE_KEY){s.last=Date.now();try{storage.setItem(key,JSON.stringify(s));return true;}catch{return false;}}
