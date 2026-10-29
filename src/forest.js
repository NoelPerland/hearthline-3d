import {RIDGE_TREES} from './expansion.js?v=45';
// Stable logical sites shared by economy, navigation and instanced presentation.
export const SECTORS=[
 {name:'Woodlot',centers:[[-6.3,-4.8],[-9,-6.2],[-5.3,-7.6],[-8.4,-8.7]],count:10,hp:6,bounds:[-11,-3,-10,-3]},
 {name:'Timber Fringe',centers:[[-4,-9.5],[-8,-11.8],[-3,-12.8],[-7,-15],[-2,-15.7]],count:15,hp:9,bounds:[-11,1,-17,-8]},
 {name:'North Timber',centers:[[2,-9.5],[5,-12],[1.5,-14],[5.5,-16],[0,-18],[4,-20],[-2,-20],[0,-23],[5,-23]],count:25,hp:12,bounds:[-3,8,-25,-8]},
 {name:'Frostwood',centers:[[-7,-19],[-10,-21],[-5,-22.5],[-8,-25],[-3,-25.8],[-9,-28],[-4,-29],[0,-29],[-7,-31]],count:25,hp:15,bounds:[-12,2,-33,-16.5]}
];
export const TREES=SECTORS.flatMap((sector,si)=>Array.from({length:sector.count},(_,i)=>{const c=sector.centers[Math.floor(i/3)],j=i%3;return {id:'tree-'+si+'-'+i,sector:si,hp:sector.hp,position:[c[0]+[0,-.72,.72][j],c[1]+[0,-.35,-.35][j]],approach:[c[0],c[1]+1.45],size:.76+si*.045+(i%3)*.045};}));
// Managed job stands are separate from the 75 permanent frontier IDs.
export const JOB_TREES=[[[2,-10],[5,-12],[1,-14],[5,-16]],[[-4,-10],[-7,-12],[-3,-14],[-7,-16]],[[-6,-21],[-9,-23],[-4,-25],[-8,-28]]].flatMap((centers,variant)=>centers.flatMap((c,i)=>[0,1,2].map(j=>({id:'job-'+variant+'-'+(i*3+j),job:true,variant,sector:variant===2?3:variant===1?1:2,hp:[36,48,60][variant],position:[c[0]+[0,-.8,.8][j],c[1]+[0,-.4,-.4][j]],approach:[c[0],c[1]+1.45],size:.84+j*.04}))));
// Former scenery uses the same saved damage, contacts, stumps and bounded fall pool.
export const SCENERY_TREES=[[-11,-4,1.4],[7,-8,1.4],[12,-7,1.5],[11,0,1],[-12,1,.8],[-11,6,.8],[-10,10,1.2],[6,9,.7],[11,5,.9],[-16,-12,2],[13,-13,2],[-9.4,12,.82],[-7.6,12.4,.55],[9.1,9,.82],[10.9,9.4,.55],[7.5,-5.9,.82]].map(([x,z,size],i)=>{const d=Math.hypot(x,z);return {id:'scenery-'+i,scenery:true,short:i!==15,grove:i===15,sector:0,hp:6,position:[x,z],approach:i===15?[8,-5]:[x-x/d*1.2,z-z/d*1.2],size};});
export const CAMP_RADIUS=[20,18];
export const PERMANENT_TREES=[...TREES,...SCENERY_TREES,...RIDGE_TREES];
export const ALL_TREES=[...PERMANENT_TREES,...JOB_TREES],ALL_TREE_BY_ID=new Map(ALL_TREES.map(t=>[t.id,t]));
export const treePresent=(s,t)=>t.job?!!s.town?.active&&['timber','supply'].includes(s.town.active.type)&&s.town.active.variant===t.variant:(!t.grove||s.watchWon)&&sectorOpen(s,t.sector);
export const treeStand=(s,t)=>t.job?s.town?.active:t.ridge?s.expansion?.trees:t.scenery?s.forest?.scenery:s.forest;
export const treeDamage=(s,t)=>treeStand(s,t)?.damage[t.id]||0;
export const treeCleared=(s,t)=>!!treeStand(s,t)?.cleared.includes(t.id);
export const TREE_BY_ID=new Map(TREES.map(t=>[t.id,t]));
export const clearedCount=s=>s.forest?.cleared.length||0;
export const sectorOpen=(s,i)=>i===0||i===1&&clearedCount(s)>=10||i===2&&clearedCount(s)>=25||i===3&&s.frontierWon||i===4&&s.expansion?.bridge===3;
export const treeApproach=(t,spin)=>spin||t.scenery?t.approach:[t.position[0],t.position[1]+.8];
export const treeAlive=(s,t)=>treePresent(s,t)&&!treeCleared(s,t);
export function groundHeight(x,z){const ramp=Math.max(0,Math.min(1,(-z-7)/5)),north=Math.max(0,Math.min(1,(-z-18)/5));const west=Math.max(0,Math.min(1,(-x-13)/5));return -.055+west*west*(3-2*west)*.35+ramp*ramp*(3-2*ramp)*.24+north*north*(3-2*north)*.30+Math.sin(x*.6)*Math.cos(z*.4)*.018;}
export function sweepPass(position,player,from,to,radius,last=-1){
 if(to<=from||Math.hypot(position[0]-player[0],position[1]-player[1])>radius+.45)return null;const tau=Math.PI*2,a=(Math.atan2(position[0]-player[0],position[1]-player[1])+tau)%tau,width=.22;
 for(let pass=Math.floor((from-a-width)/tau);pass<=Math.floor((to-a+width)/tau);pass++){if(pass===last)continue;const center=a+pass*tau;if(to>=center-width&&from<=center+width)return pass;}return null;
}
