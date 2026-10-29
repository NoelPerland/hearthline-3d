// Local goods and in-transit coins; gold remains the only bank currency.
export const COMMERCE_LOCATIONS={market:[4,11.4],flour:[-4,11.4],bakery:[0,11.4],logistics:[2,13],cash:[6.8,11.4]};
export const COMMERCE_BUILDINGS=[{node:'market',level:1,x:4,z:9.5,w:1.3,d:1.1},{node:'flour',level:2,x:-4,z:9.5,w:1.3,d:1.1},{node:'bakery',level:3,x:0,z:9.5,w:1.4,d:1.1}];
export const COMMERCE_RECIPES=Object.fromEntries([
 ['market',12,'BERRY MARKET','market','Serve berries · customers leave coins'],
 ['flour',18,'FLOUR MILL','flour','Grain hopper → two flour every 3s'],
 ['bakery',24,'BERRY BAKERY','bakery','1 flour + 3 berries → 2 pies · 8 coins each'],
 ['cart',24,'DELIVERY CART','logistics','Collects flour + berries · delivers pies'],
 ['seller',30,'HIRE SELLER','market','Customers served automatically'],
 ['collector',36,'CASH CART','logistics','Collects earnings · can fund your chosen build'],
 ['oven',48,'SECOND OVEN','bakery','Double baking capacity · 4 pies per batch']
].map(([key,cost,title,node,benefit])=>['commerce_'+key,[0,0,cost,title,'Stand on the gold card to invest your coins.','BUILD '+title,benefit,node]]));
const actions=Object.keys(COMMERCE_RECIPES),integer=(v,max=1e9)=>Number.isFinite(v)?Math.max(0,Math.min(max,Math.floor(v))):0;
export const initialCommerce=()=>({level:0,clock:0,flourClock:0,flour:0,ingredients:0,berries:0,bake:0,batch:0,pies:0,marketBerries:0,marketPies:0,cargo:0,cargoKind:'pies',cartPhase:0,cartFlour:0,cartBerries:0,cartPies:0,customerPhase:'arrive',customerClock:0,customerPie:false,earnings:0,sold:0,piesSold:0,piesDelivered:0,collected:0,cashPhase:0,cashLoad:0,authorized:null,enabled:true});
export function normalizeCommerce(raw,s){const c=initialCommerce();if(s.expansion.outpost!==4||!raw)return c;c.level=integer(raw.level,7);if(!c.level)return c;for(const [key,max] of Object.entries({flourClock:11,flour:12,ingredients:12,berries:24,bake:12,batch:4,pies:12,marketBerries:12,marketPies:12,cargo:6,cartPhase:39,cartFlour:2,cartBerries:6,cartPies:6,customerClock:8,earnings:1e9,sold:1e9,piesSold:1e9,piesDelivered:1e9,collected:1e9,cashPhase:47,cashLoad:24}))c[key]=integer(raw[key],max);c.clock=Number.isFinite(raw.clock)?Math.max(0,Math.min(.25,raw.clock)):0;c.cargoKind=['pies','flour'].includes(raw.cargoKind)?raw.cargoKind:'pies';c.customerPhase=['arrive','wait','leave'].includes(raw.customerPhase)?raw.customerPhase:'arrive';c.customerPie=raw.customerPie===true;c.enabled=raw.enabled!==false;c.authorized=c.level>=6&&raw.authorized===actions[c.level]?raw.authorized:null;return c;}
export const commerceAction=s=>s.expansion.outpost===4?actions[s.commerce.level]||null:null;
export function commerceGate(s,action){if(!COMMERCE_RECIPES[action])return null;const c=s.commerce,gate=(current,target,label)=>current<target?{kind:'commerce',current,target,label,node:commerceTask(s)}:null;return action==='commerce_flour'?gate(c.collected,6,'COLLECT COINS'):action==='commerce_bakery'?gate(c.flour+c.ingredients+c.cargo,1,'MILL FLOUR'):action==='commerce_cart'?gate(c.piesDelivered,2,'DELIVER PIES'):action==='commerce_seller'?gate(c.piesSold,2,'SELL PIES'):action==='commerce_collector'?gate(c.sold,6,'CUSTOMERS'):null;}
export function commerceTask(s){const c=s.commerce;if(c.earnings&&(c.level<6||!c.enabled))return 'cash';if(c.cargo)return c.cargoKind==='pies'?'market':'bakery';if(c.marketPies||c.marketBerries>=3)return 'market';if(c.level<3)return s.food>=3?'market':'food';if(c.level<4){if(c.pies)return 'bakery';if(!c.ingredients)return 'flour';if(c.berries<3)return s.food>=6?'bakery':'food';return 'bakery';}return 'market';}
export function collectEarnings(s){const n=s.commerce.earnings;s.commerce.earnings=0;s.commerce.collected+=n;s.gold+=n;return n;}
export function sell(s){const c=s.commerce;if(c.customerPhase!=='wait'||!c.marketPies&&c.marketBerries<3)return 0;c.customerPie=c.marketPies>0;const n=c.customerPie?8:6;if(c.customerPie){c.marketPies--;c.piesSold++;}else c.marketBerries-=3;c.earnings+=n;c.sold++;c.customerPhase='leave';c.customerClock=0;return n;}
export function commerceInteract(s,node,reservedFood=0){const c=s.commerce;if(!c.level)return null;
 if(node==='cash'){const n=collectEarnings(s);return n?{gold:n,label:'+'+n+' COINS'}:null;}
 if(node==='flour'&&c.level>=2&&!c.cargo&&c.flour&&c.ingredients+c.cartFlour<12){c.cargo=Math.min(2,c.flour,12-c.ingredients-c.cartFlour);c.flour-=c.cargo;c.cargoKind='flour';return {label:'CARRY '+c.cargo+' FLOUR → BAKERY'};}
 if(node==='bakery'&&c.level>=3){if(c.cargo&&c.cargoKind==='flour'){const n=Math.min(c.cargo,12-c.ingredients-c.cartFlour);c.ingredients+=n;c.cargo-=n;return n?{label:'FLOUR DELIVERED'}:null;}if(!c.cargo&&c.pies&&c.marketPies+c.cartPies<12){c.cargo=Math.min(6,c.pies,12-c.marketPies-c.cartPies);c.pies-=c.cargo;c.cargoKind='pies';return {label:'CARRY '+c.cargo+' PIES → MARKET'};}if(!c.cargo&&c.berries+c.cartBerries<=18&&s.food-reservedFood>=6){s.food-=6;c.berries+=6;return {label:'6 BERRIES → OVEN',food:6};}}
 if(node==='market'){if(c.cargo&&c.cargoKind==='pies'){const n=Math.min(c.cargo,12-c.marketPies-c.cartPies);c.marketPies+=n;c.cargo-=n;c.piesDelivered+=n;return n?{label:n+' PIES ON THE COUNTER'}:null;}const earned=sell(s);if(earned)return {sale:earned,label:'SOLD · +'+earned+' AT THE TILL'};if(c.level<3&&c.marketBerries<=9&&s.food-reservedFood>=3){s.food-=3;c.marketBerries+=3;return {label:'3 BERRIES ON THE COUNTER',food:3};}}
 return null;
}
// Called on quarter-second boundaries by the existing chronological economy loop.
export function tickCommerce(s,reservedFood=0){const c=s.commerce;if(!c.level||!c.enabled)return;
 if(c.level>=2&&c.flour<12&&++c.flourClock>=12){c.flourClock=0;c.flour=Math.min(12,c.flour+2);}
 if(c.bake){if(--c.bake===0){c.pies+=c.batch;c.batch=0;}}
 if(c.level>=3&&!c.bake&&c.ingredients>=1&&c.berries>=3&&c.pies<=(c.level===7?8:10)){c.ingredients--;c.berries-=3;c.batch=c.level===7?4:2;c.bake=12;}
 if(c.level>=4){c.cartPhase=(c.cartPhase+1)%40;if(c.cartPhase===0){c.cartFlour=Math.min(2,c.flour,12-c.ingredients-(c.cargoKind==='flour'?c.cargo:0));c.flour-=c.cartFlour;}if(c.cartPhase===10){c.cartBerries=Math.min(6,Math.max(0,s.food-reservedFood),24-c.berries);s.food-=c.cartBerries;}if(c.cartPhase===20){c.ingredients+=c.cartFlour;c.berries+=c.cartBerries;c.cartFlour=c.cartBerries=0;c.cartPies=Math.min(6,c.pies,12-c.marketPies-(c.cargoKind==='pies'?c.cargo:0));c.pies-=c.cartPies;}if(c.cartPhase===30){const n=Math.min(c.cartPies,12-c.marketPies);c.marketPies+=n;c.cartPies-=n;c.piesDelivered+=n;}}
 if(c.customerPhase!=='wait'&&++c.customerClock>=8){c.customerPhase=c.customerPhase==='arrive'?'wait':'arrive';c.customerClock=0;c.customerPie=false;}if(c.level>=5)sell(s);
 if(c.level>=6){c.cashPhase=(c.cashPhase+1)%48;if(c.cashPhase===0){c.cashLoad=Math.min(24,c.earnings);c.earnings-=c.cashLoad;}if(c.cashPhase===24){s.gold+=c.cashLoad;c.collected+=c.cashLoad;c.cashLoad=0;}}
}
