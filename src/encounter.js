import {route,distance,walkable,pointOn} from './navigation.js?v=45';
import {axeStats,weaponStats} from './core.js?v=45';
import {sweepPass,clearedCount} from './forest.js?v=45';
import {clear} from './navigation.js?v=45';
import {townUnlocked,CONVOY_ROUTES} from './town.js?v=45';
const TAU=Math.PI*2,spawns=[[-8,-4],[8,-6],[0,8]],approaches=[[-1.05,1.15],[1.05,1.15],[0,2.2]];
function encounter(frontier){return {frontier,status:'active',time:0,warmth:100,maxWarmth:100,spawned:0,kills:0,cooldown:0,pending:null,projectiles:Array.from({length:4},()=>({active:false})),enemies:Array.from({length:6},()=>({active:false,hp:0,position:[0,0],path:[],lastTurn:-1,attack:0,hit:0,retreat:0,repath:0}))};}
export function beginWatch(s,frontier=false){return (frontier?s.forge&&!s.frontierWon&&clearedCount(s)>=50&&['spear','bow','sword'].some(k=>s.weapons[k]):s.axeSpin&&!s.watchWon)?encounter(frontier):null;}
export function beginConvoy(s){
 const a=s.town?.active;if(!townUnlocked(s)||a?.type!=='convoy'||!['ready','lost'].includes(a.status))return null;
 const points=CONVOY_ROUTES[a.variant],path=[points[0]];for(const target of points.slice(1)){const segment=route(path.at(-1),target);if(!segment.length)return null;path.push(...segment);}
 const w=encounter(true);w.convoy={path,position:[...path[0]],progress:0};w.maxWarmth=w.warmth=s.town.stage===4?140:100;a.status='active';a.elapsed=0;return w;
}
export function sweepHit(enemy,player,from,to,stats){
 if(!enemy.active)return false;const pass=sweepPass(enemy.position,player,from,to,stats.radius,enemy.lastTurn);if(pass===null)return false;enemy.lastTurn=pass;return true;
}
export function watchTarget(w,s,player){
 if(w?.status!=='active')return null;
 const kind=w.frontier?s.weapons.equipped:'hatchet',stats=weaponStats(s,kind);let nearest=null,best=Infinity;
 for(const enemy of w.enemies){if(!enemy.active)continue;const d=distance(enemy.position,player);if(d<=stats.range+(kind==='hatchet'?.45:0)&&(kind==='hatchet'||clear(player,enemy.position)))return null;if(d<best){nearest=enemy;best=d;}}
 return nearest;
}
export function tickWatch(w,dt,s,player,from,to){
 if(w.status!=='active')return {hits:0,kills:0,contacts:[]};dt=Math.max(0,Math.min(.08,dt));w.time+=dt;if(w.convoy){w.convoy.progress=Math.min(1,w.time/30);w.convoy.position=pointOn(w.convoy.path,w.convoy.progress);}const result={hits:0,kills:0,contacts:[],attack:null},kind=w.frontier?s.weapons.equipped:'hatchet',stats=weaponStats(s,kind);
 function damage(e,amount){if(!e.active)return;result.hits++;e.hp-=amount;e.hit=.18;result.contacts.push({slot:w.enemies.indexOf(e),position:[...e.position],lethal:e.hp<=0});const d=distance(e.position,player)||1,p=[e.position[0]+(e.position[0]-player[0])/d*.24,e.position[1]+(e.position[1]-player[1])/d*.24];if(walkable(p)){e.position=p;e.path=route(p,w.convoy?.position||approaches[e.lane]);}if(e.hp<=0){e.active=false;e.retreat=.38;w.kills++;result.kills++;}}
 while(w.spawned<9&&w.time>=Math.floor(w.spawned/3)*(w.frontier?8:10)){
  const enemy=w.enemies.find(e=>!e.active&&e.retreat<=0);if(!enemy)break;
  const lane=Math.floor(w.spawned/3),slot=w.spawned%3,target=w.convoy?.position||approaches[lane];let p=[spawns[lane][0]+(slot-1)*.65,spawns[lane][1]];
  if(w.convoy){const variant=s.town.active.variant;let candidate=null;for(let i=0;i<16;i++){const angle=(lane*2+slot*.6+variant+i*.4),at=[target[0]+Math.cos(angle)*3.3,target[1]+Math.sin(angle)*3.3];if(walkable(at)&&route(at,target).length){candidate=at;break;}}if(!candidate)break;p=candidate;}
  if(!walkable(p)){let candidate=null;for(let i=0;i<16;i++){const angle=i*Math.PI/8,at=[p[0]+Math.cos(angle)*1.2,p[1]+Math.sin(angle)*1.2];if(walkable(at)&&route(at,target).length){candidate=at;break;}}if(!candidate)break;p=candidate;}
  Object.assign(enemy,{active:true,hp:w.frontier?8:6,maxHp:w.frontier?8:6,position:p,path:route(p,target),lastTurn:-1,attack:0,hit:0,retreat:0,repath:0,lane,id:w.spawned});w.spawned++;
 }
 for(const e of w.enemies){e.hit=Math.max(0,e.hit-dt);e.retreat=Math.max(0,e.retreat-dt);if(!e.active)continue;
  if(w.convoy){e.repath-=dt;if(e.repath<=0){e.repath=.45;e.path=route(e.position,w.convoy.position);}}
  if(e.path.length){let budget=(w.frontier?1.25:1.1)*dt;while(budget>0&&e.path.length){const p=e.path[0],d=distance(e.position,p),n=Math.min(d,budget);if(d<.001){e.path.shift();continue;}e.position=[e.position[0]+(p[0]-e.position[0])/d*n,e.position[1]+(p[1]-e.position[1])/d*n];budget-=n;if(n===d)e.path.shift();}}
  if(distance(e.position,w.convoy?.position||approaches[e.lane])<(w.convoy?.55:.3)){e.attack+=dt;if(e.attack>=1.2){e.attack-=1.2;w.warmth=Math.max(0,w.warmth-(!w.convoy&&s.braced?4:8));}}
  if(kind==='hatchet'&&sweepHit(e,player,from,to,axeStats(s)))damage(e,stats.damage);
 }
 if(kind!=='hatchet'){
  w.cooldown=Math.max(0,w.cooldown-dt);
  if(w.pending){w.pending.delay-=dt;if(w.pending.delay<=0){const attack=w.pending;w.pending=null;const target=w.enemies.find(e=>e.active&&e.id===attack.target);if(target&&distance(target.position,player)<=stats.range+.3&&clear(player,target.position)){if(kind==='bow'){const arrow=w.projectiles.find(p=>!p.active);if(arrow)Object.assign(arrow,{active:true,position:[...player],target:target.id,life:0,damage:stats.damage});}else{const axis=[Math.sin(attack.yaw),Math.cos(attack.yaw)],targets=w.enemies.filter(e=>{const dx=e.position[0]-player[0],dz=e.position[1]-player[1],d=Math.hypot(dx,dz);return e.active&&d<=stats.range+.3&&(d<.35||(dx*axis[0]+dz*axis[1])/(d||1)>(kind==='spear'?.92:.55))&&clear(player,e.position);}).sort((a,b)=>distance(a.position,player)-distance(b.position,player));targets.slice(0,2).forEach(e=>damage(e,stats.damage));}}}}
  if(!w.pending&&w.cooldown<=0){const target=w.enemies.filter(e=>e.active&&distance(e.position,player)<=stats.range&&clear(player,e.position)).sort((a,b)=>distance(a.position,player)-distance(b.position,player))[0];if(target){const yaw=Math.atan2(target.position[0]-player[0],target.position[1]-player[1]);w.pending={target:target.id,yaw,delay:kind==='bow'?.18:kind==='spear'?.12:.10};w.cooldown=stats.cooldown;result.attack={kind,yaw,duration:stats.cooldown};}}
  for(const arrow of w.projectiles){if(!arrow.active)continue;arrow.life+=dt;const target=w.enemies.find(e=>e.active&&e.id===arrow.target);if(!target||arrow.life>stats.range/12+.25){arrow.active=false;continue;}const d=distance(arrow.position,target.position),step=12*dt,p=d<=step?[...target.position]:[arrow.position[0]+(target.position[0]-arrow.position[0])/d*step,arrow.position[1]+(target.position[1]-arrow.position[1])/d*step];if(!clear(arrow.position,p)){arrow.active=false;continue;}arrow.position=p;if(d<=step+.15){damage(target,arrow.damage);arrow.active=false;}}
 }
 if(w.kills===9&&(!w.convoy||w.convoy.progress===1)&&w.warmth>0&&w.time<35)w.status='won';else if(w.warmth<=0||w.time>=35)w.status='lost';return result;
}
