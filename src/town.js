import {clearedCount,JOB_TREES} from './forest.js?v=45';

export const LODGE=[-7,-6.5],LODGE_APPROACH=[-7,-4.75];
export const JOB_TYPES=['timber','convoy','supply'];
export const JOB_NAMES={timber:'TIMBER RUSH',convoy:'CONVOY DEFENSE',supply:'SUPPLY DRIVE'};
export const CONVOY_ROUTES=[
 [[3.4,-1.3],[4,-4],[4,-8],[0,-12],[0,-16]],
 [[3.4,-1.3],[4,0],[7,0],[8,-2],[8,-5],[4,-8],[4,-12]],
 [[3.4,-1.3],[0,-4],[-4,-4],[-4,-8],[-7,-12],[-7,-16]]
];
export const townUnlocked=s=>!!s.freightWinch&&clearedCount(s)===75;
export const initialTown=()=>({stage:0,jobsDone:0,serial:0,counts:{timber:0,convoy:0,supply:0},best:{timber:0,convoy:0,supply:0},active:null});
export function jobSpec(type,variant=0){return {type,variant,name:JOB_NAMES[type],trees:12,loads:[8,5,10][variant],recipe:variant===1?'mixed':'wood',wood:type==='convoy'?16:0,food:type==='timber'?12:type==='convoy'?8:6,gold:type==='convoy'?10:4};}
const integer=(x,max=1e9)=>Number.isFinite(x)?Math.max(0,Math.min(max,Math.floor(x))):0;
export function normalizeTown(raw,s){
 const town=initialTown();if(!townUnlocked(s)||!raw)return town;
 town.stage=integer(raw.stage,4);town.jobsDone=Math.max(town.stage,integer(raw.jobsDone));town.serial=integer(raw.serial);
 for(const type of JOB_TYPES){town.counts[type]=integer(raw.counts?.[type]);town.best[type]=Number.isFinite(raw.best?.[type])?Math.max(0,raw.best[type]):0;}
 const a=raw.active;if(!a||!JOB_TYPES.includes(a.type))return town;
 const variant=integer(a.variant,2),sites=JOB_TREES.filter(t=>t.variant===variant),ids=new Set(sites.map(t=>t.id));
 const active={id:integer(a.id),type:a.type,variant,status:['active','ready','won','lost'].includes(a.status)?a.status:'active',elapsed:Number.isFinite(a.elapsed)?Math.max(0,a.elapsed):0,cleared:[...new Set((Array.isArray(a.cleared)?a.cleared:[]).filter(id=>ids.has(id)))],damage:{},loads:integer(a.loads,jobSpec(a.type,variant).loads)};
 for(const tree of sites){const damage=integer(a.damage?.[tree.id],tree.hp-1);if(damage&&!active.cleared.includes(tree.id))active.damage[tree.id]=damage;}
 if(active.type==='convoy'&&active.status==='active'){active.status='ready';active.elapsed=0;}
 if(active.type==='timber')active.status=active.cleared.length===12?'won':'active';
 if(active.type==='supply')active.status=active.loads===jobSpec('supply',variant).loads?'won':'active';
 town.active=active;return town;
}
export function startJob(s,type){
 if(!townUnlocked(s)||s.town.active||!JOB_TYPES.includes(type))return false;
 const variant=s.town.counts[type]%3;
 s.town.active={id:++s.town.serial,type,variant,status:type==='convoy'?'ready':'active',elapsed:0,cleared:[],damage:{},loads:0};
 if(type==='supply'){s.orders.mode=jobSpec(type,variant).recipe;s.orders.enabled=true;}
 return true;
}
export function jobShipment(s,kind){const a=s.town?.active;if(a?.type==='supply'&&a.status==='active'&&kind===jobSpec(a.type,a.variant).recipe){a.loads++;if(a.loads>=jobSpec(a.type,a.variant).loads)a.status='won';}}
export function claimJob(s){
 const a=s.town.active;if(!a||a.status!=='won')return null;const spec=jobSpec(a.type,a.variant);
 for(const k of ['wood','food','gold'])s[k]+=spec[k];s.town.jobsDone++;s.town.counts[a.type]++;
 const best=s.town.best[a.type];if(a.elapsed>0&&(!best||a.elapsed<best))s.town.best[a.type]=a.elapsed;
 s.town.active=null;return spec;
}
export function leaveJob(s){if(!s.town.active)return false;s.town.active=null;return true;}
export function tickJob(s,dt){const a=s.town.active;if(a?.type==='timber'&&a.status==='active')a.elapsed+=Math.max(0,Math.min(.08,dt));}
