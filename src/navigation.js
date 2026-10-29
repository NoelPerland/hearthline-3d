import {COMMERCE_BUILDINGS,COMMERCE_LOCATIONS} from './commerce.js?v=47';
import {SECTORS,SCENERY_TREES,CAMP_RADIUS,ALL_TREES as TREES,sectorOpen,treeAlive,clearedCount} from './forest.js?v=47';
import {LODGE} from './town.js?v=47';
import {RIDGE_BOUNDS,RIDGE_LANES,RIDGE_TREES,ROCKS,rockAlive} from './expansion.js?v=47';
// Small lane graph, deterministic shortest paths. No actor or economy imports.
let access=null;
export function setNavigationState(state){access=state;}
export const LANES=[[-1,3],[0,0],[-4,0],[-7,0],[-4,4],[0,4],[4,4],[7,4],[4,0],[7,0],[0,-4],[-4,-4],[4,-4],[8,-2],[8,-5],[6,-1.3]];
const EDGES=[[0,1],[0,5],[0,4],[1,2],[2,3],[2,4],[4,5],[5,6],[6,7],[6,8],[8,9],[1,8],[1,10],[2,11],[10,11],[10,12],[8,12],[9,13],[13,14],[8,15],[15,13]];
export const OBSTACLES=[{x:0,z:-2.25,w:1.8,d:1.25},{x:-6,z:2.2,w:1.4,d:.95},{x:6,z:2.15,w:1.3,d:1.05},{x:0,z:1.15,w:.65,d:.65},{x:6,z:-3.5,w:1.1,d:1.1}];
export const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
export const WATCH_POST=[-1.6,2.25];
// Short acceleration ramps, constant pace through most of the lane.
export function travelProgress(t){t=Math.max(0,Math.min(1,t));const ramp=.1;return t<ramp?t*t/(2*ramp*(1-ramp)):t>1-ramp?1-(1-t)**2/(2*ramp*(1-ramp)):(t-ramp/2)/(1-ramp);}
export function walkable(p){if(access&&p[0]>-12.5&&p[0]<-11.8&&p[1]>-8&&p[1]<11&&(access.expansion.bridge!==3||Math.abs(p[1]-3.3)>1))return false;const inSector=sector=>p[0]>sector.bounds[0]&&p[0]<sector.bounds[1]&&p[1]>sector.bounds[2]&&p[1]<sector.bounds[3],open=access&&SECTORS.some((sector,i)=>sectorOpen(access,i)&&inSector(sector)),locked=access&&!open&&SECTORS.some((sector,i)=>!sectorOpen(access,i)&&inSector(sector));const ridge=p[0]<RIDGE_BOUNDS[1]&&p[0]>RIDGE_BOUNDS[0]&&p[1]>RIDGE_BOUNDS[2]&&p[1]<RIDGE_BOUNDS[3],inside=!(ridge&&access?.expansion?.bridge!==3)&&!locked&&(ridge&&access?.expansion?.bridge===3||Math.hypot(p[0]/CAMP_RADIUS[0],p[1]/CAMP_RADIUS[1])<1||open);return !!inside&&!(access?.commerce&&COMMERCE_BUILDINGS.some(o=>access.commerce.level>=o.level&&Math.abs(p[0]-o.x)<o.w+.2&&Math.abs(p[1]-o.z)<o.d+.2))&&!(access?.expansion?.post&&Math.abs(p[0]+8.4)<1.1&&Math.abs(p[1]-1.4)<.9)&&!(access?.expansion?.outpost&&Math.abs(p[0]+23)<1.5&&Math.abs(p[1]+1.7)<1.3)&&(!access||!ROCKS.some(t=>Math.abs(t.position[0]-p[0])<.55&&Math.abs(t.position[1]-p[1])<.55&&rockAlive(access,t)))&&!(access?.freightWinch&&clearedCount(access)===75&&Math.abs(p[0]-LODGE[0])<1.5&&Math.abs(p[1]-LODGE[1])<1.3)&&!OBSTACLES.some(o=>Math.abs(p[0]-o.x)<o.w+.3&&Math.abs(p[1]-o.z)<o.d+.3)&&(!access||!TREES.some(t=>Math.abs(t.position[0]-p[0])<.42&&Math.abs(t.position[1]-p[1])<.42&&treeAlive(access,t)));}
function crosses(a,b,x,z,w,d){
 let enter=0,exit=1;for(const [start,delta,min,max] of [[a[0],b[0]-a[0],x-w,x+w],[a[1],b[1]-a[1],z-d,z+d]]){if(Math.abs(delta)<1e-9){if(start<=min||start>=max)return false;}else{const low=(min-start)/delta,high=(max-start)/delta;enter=Math.max(enter,Math.min(low,high));exit=Math.min(exit,Math.max(low,high));if(enter>=exit)return false;}}return enter<exit;
}
export function clear(a,b){if(access?.commerce&&COMMERCE_BUILDINGS.some(o=>access.commerce.level>=o.level&&crosses(a,b,o.x,o.z,o.w+.2,o.d+.2))||access?.expansion?.post&&crosses(a,b,-8.4,1.4,1.1,.9)||access?.expansion?.outpost&&crosses(a,b,-23,-1.7,1.5,1.3)||access&&ROCKS.some(t=>rockAlive(access,t)&&crosses(a,b,...t.position,.55,.55))||OBSTACLES.some(o=>crosses(a,b,o.x,o.z,o.w+.3,o.d+.3))||access?.freightWinch&&clearedCount(access)===75&&crosses(a,b,...LODGE,1.5,1.3)||access&&TREES.some(t=>treeAlive(access,t)&&crosses(a,b,...t.position,.42,.42)))return false;const steps=Math.max(1,Math.ceil(distance(a,b)/.2));for(let i=0;i<=steps;i++){const t=i/steps;if(!walkable([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]))return false;}return true;}
export function route(a,b){
 if(!walkable(b))return [];if(clear(a,b))return [b];
 const extras=access?SECTORS.flatMap((sector,i)=>sectorOpen(access,i)?sector.centers.map(c=>[c[0],c[1]+1.45]):[]):[],base=[...LANES,...extras,...(access?.expansion?.outpost===4?[...Object.values(COMMERCE_LOCATIONS),[-6,11.5],[-2,11.5],[2,11.5],[8,12.5],[4,13.5],[0,13.5]]:[]),...SCENERY_TREES.map(t=>t.approach),...(access?.expansion?.post?[[-9.8,0],[-9.8,3.3]]:[]),...(access?.expansion?.bridge===3?[...RIDGE_LANES,...RIDGE_TREES.map(t=>t.approach),...ROCKS.map(t=>t.approach)]:[])],points=[...base,a,b],start=points.length-2,end=start+1,edges=EDGES.filter(e=>clear(points[e[0]],points[e[1]])).map(e=>[...e]);
 for(let i=LANES.length;i<base.length;i++)for(let j=0;j<i;j++)if(distance(base[i],base[j])<6&&clear(base[i],base[j]))edges.push([i,j]);
 for(const node of [start,end])for(let i=0;i<base.length;i++)if(clear(points[node],points[i]))edges.push([node,i]);
 const cost=points.map(()=>Infinity),prev=points.map(()=>-1),todo=new Set(points.map((_,i)=>i));cost[start]=0;
 while(todo.size){let u=-1;for(const i of todo)if(u<0||cost[i]<cost[u])u=i;if(!Number.isFinite(cost[u])||u===end)break;todo.delete(u);
  for(const e of edges){const v=e[0]===u?e[1]:e[1]===u?e[0]:-1;if(v<0||!todo.has(v))continue;const next=cost[u]+distance(points[u],points[v]);if(next<cost[v]){cost[v]=next;prev[v]=u;}}
 }
 if(!Number.isFinite(cost[end]))return [];const result=[];for(let i=end;i!==start;i=prev[i]){if(i<0)return [];result.unshift(points[i]);}return result;
}
export function pointOn(path,t){
 if(path.length<2)return path[0]||[0,0];const lengths=path.slice(1).map((p,i)=>distance(path[i],p)),total=lengths.reduce((a,b)=>a+b,0);let left=Math.max(0,Math.min(1,t))*total;
 for(let i=0;i<lengths.length;i++){if(left<=lengths[i]){const w=left/(lengths[i]||1);return [path[i][0]+(path[i+1][0]-path[i][0])*w,path[i][1]+(path[i+1][1]-path[i][1])*w];}left-=lengths[i];}return path.at(-1);
}
