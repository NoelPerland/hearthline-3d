import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {groundHeight} from './forest.js?v=47';
const actorAssets=new Map();

export async function loadActor(name,scene,palette){
 if(!actorAssets.has(name))actorAssets.set(name,new GLTFLoader().loadAsync('assets/characters/'+name+'.glb?v=47'));
 const source=await actorAssets.get(name),gltf={...source,scene:clone(source.scene)};
 const root=new THREE.Group();root.name=name;root.add(gltf.scene);scene.add(root);gltf.scene.scale.setScalar(1.14);
 gltf.scene.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;}});
 const mixer=new THREE.AnimationMixer(gltf.scene),actions=Object.fromEntries(gltf.animations.map(c=>[c.name,mixer.clipAction(c)]));
 const strides=Object.fromEntries(gltf.parser.json.animations.map(a=>[a.name,a.extras?.stride||1]));
 const contact=new THREE.Mesh(new THREE.CircleGeometry(.45,16),new THREE.MeshBasicMaterial({color:'#24473B',transparent:true,opacity:.16,depthWrite:false}));contact.rotation.x=-Math.PI/2;contact.scale.y=.60;contact.position.set(0,.055,.04);root.add(contact);
 if(name==='mara'){const ring=new THREE.Mesh(new THREE.RingGeometry(.46,.57,40),new THREE.MeshBasicMaterial({color:'#26DDF2',side:THREE.DoubleSide,transparent:true,opacity:.95,depthWrite:false})),rim=new THREE.Mesh(new THREE.RingGeometry(.57,.62,40),new THREE.MeshBasicMaterial({color:'#FFFDF4',side:THREE.DoubleSide,depthWrite:false}));ring.rotation.x=rim.rotation.x=-Math.PI/2;ring.position.y=.065;rim.position.y=.064;root.add(rim,ring);}
 actions.deliver.setLoop(THREE.LoopOnce,1);actions.deliver.clampWhenFinished=true;
 const pluckArm=gltf.scene.getObjectByName('ArmR'),pluckForearm=gltf.scene.getObjectByName('ForearmR'),grip=gltf.scene.getObjectByName('Chest'),cargo=new THREE.Group();grip.add(cargo);cargo.position.set(0,-.14,.47);
 const cargoGeometry=new RoundedBoxGeometry(.48,.22,.36,1,.04),box=new THREE.Mesh(cargoGeometry,palette.wood),pieces=[box];cargo.add(box);
 for(const x of [-.15,.15]){const strap=new THREE.Mesh(new THREE.BoxGeometry(.035,.34,.37),palette.teal);strap.position.x=x;cargo.add(strap);}
 for(let i=0;i<7;i++){const load=new THREE.Mesh(cargoGeometry,palette.wood);load.scale.set(.94,.78,.92);load.position.y=.22+i*.17;load.rotation.y=i%2?.04:-.04;cargo.add(load);pieces.push(load);}
 const commerceCargo=new THREE.Group();cargo.add(commerceCargo);const pouch=new THREE.Mesh(new THREE.SphereGeometry(1,12,8),palette.gold);pouch.scale.set(.29,.36,.25);pouch.position.y=.14;commerceCargo.add(pouch);const knot=new THREE.Mesh(cargoGeometry,palette.darkWood);knot.scale.set(.35,.25,.4);knot.position.y=.44;commerceCargo.add(knot);const pieCargo=new THREE.Group();commerceCargo.add(pieCargo);for(let i=0;i<2;i++){const crust=new THREE.Mesh(new THREE.CylinderGeometry(.27,.24,.1,12),palette.wood);crust.position.y=.05+i*.17;pieCargo.add(crust);const filling=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,.03,12),palette.red);filling.position.y=.115+i*.17;pieCargo.add(filling);const lattice=new THREE.Mesh(cargoGeometry,palette.cream);lattice.scale.set(.85,.1,.13);lattice.position.y=.14+i*.17;pieCargo.add(lattice);}commerceCargo.visible=false;
 cargo.traverse(o=>{if(o.isMesh)o.castShadow=true;});cargo.visible=false;
 const tool=new THREE.Group();gltf.scene.getObjectByName('HandR').add(tool);tool.position.set(0,-.1,.02);tool.rotation.set(Math.PI,0,-.12);
 const handle=new THREE.Mesh(new THREE.CylinderGeometry(.034,.043,.59,8),palette.darkWood);tool.add(handle);
 const edge=new THREE.Shape();edge.moveTo(-.04,-.09);edge.lineTo(-.04,.10);edge.quadraticCurveTo(.13,.16,.26,.13);edge.quadraticCurveTo(.32,0,.25,-.15);edge.quadraticCurveTo(.12,-.13,-.04,-.09);const blade=new THREE.Mesh(new THREE.ExtrudeGeometry(edge,{depth:.065,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.012,bevelThickness:.012,curveSegments:4}),palette.stone);blade.position.set(.02,.23,-.032);tool.add(blade);const ferrule=new THREE.Mesh(new THREE.CylinderGeometry(.055,.055,.12,8),palette.gold);ferrule.position.y=.17;tool.add(ferrule);tool.visible=false;
 const hammer=tool.clone();gltf.scene.getObjectByName('HandR').add(hammer);hammer.children[1].visible=false;const head=new THREE.Mesh(new RoundedBoxGeometry(.66,.32,.30,1,.065),palette.stone);head.position.y=.25;hammer.add(head);hammer.scale.setScalar(1.25);hammer.visible=false;
 const orbit=new THREE.Group();root.add(orbit);orbit.position.y=1.05;const spinAxe=tool.clone();spinAxe.visible=true;spinAxe.position.set(0,0,1.8);spinAxe.rotation.set(Math.PI/2,0,Math.PI/2);spinAxe.scale.setScalar(1.75);spinAxe.children[0].material=palette.dark;spinAxe.children[1].scale.setScalar(1.15);orbit.add(spinAxe);orbit.visible=false;
 const trail=new THREE.Mesh(new THREE.RingGeometry(1.72,1.87,32,1,-Math.PI*1.15,Math.PI*.65),new THREE.MeshBasicMaterial({color:'#75E5F4',transparent:true,opacity:.48,side:THREE.DoubleSide,depthWrite:false}));trail.rotation.x=-Math.PI/2;orbit.add(trail);
 const weapons={};if(name==='mara'){
  const make=(kind,bone='HandR')=>{const g=new THREE.Group();gltf.scene.getObjectByName(bone).add(g);g.visible=false;weapons[kind]=g;return g;},spear=make('spear');spear.rotation.x=Math.PI/2;
  const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.045,.055,1.8,8),palette.darkWood);shaft.position.y=.65;spear.add(shaft);const tip=new THREE.Mesh(new THREE.ConeGeometry(.13,.38,4),palette.cream);tip.position.y=1.73;spear.add(tip);
  const sword=make('sword');sword.rotation.x=Math.PI;const steel=new THREE.Mesh(new RoundedBoxGeometry(.13,.86,.055,1,.025),palette.cream);steel.position.y=.48;sword.add(steel);const hilt=new THREE.Mesh(new RoundedBoxGeometry(.35,.08,.10,1,.025),palette.teal);sword.add(hilt);const gripMesh=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,.26,8),palette.darkWood);gripMesh.position.y=-.12;sword.add(gripMesh);
  const bow=make('bow','HandL');bow.rotation.z=-.25;const limb=new THREE.Mesh(new THREE.TorusGeometry(.43,.038,6,20,Math.PI*1.3),palette.wood);limb.rotation.z=-Math.PI*.15;bow.add(limb);const string=new THREE.Mesh(new THREE.CylinderGeometry(.009,.009,.77,4),palette.cream);string.position.x=-.18;bow.add(string);
  Object.values(weapons).forEach(g=>g.traverse(o=>{if(o.isMesh)o.castShadow=true;}));
 }
 let current='idle',temporary=0,loadCount=0,loadWood=0,loadFood=0,loadStone=0,mining=false,spinning=false,lean=0,combat='hatchet';const reduced=matchMedia('(prefers-reduced-motion: reduce)');actions.idle.play();
 return {root,mixer,actions,cargo,tool,orbit,
  setMining(value){mining=value;hammer.visible=mining&&current==='work';if(mining){tool.visible=false;orbit.visible=false;}},
  setAxe(sharp,spin,angle,triple=false){spinning=spin&&combat==='hatchet';orbit.rotation.y=angle-root.rotation.y;spinAxe.position.z=triple?2.6:1.8;spinAxe.scale.setScalar(triple?2.25:1.75);trail.scale.setScalar(triple?2.6/1.8:1);spinAxe.children[1].material=sharp?palette.cream:palette.stone;tool.children[1].material=sharp?palette.cream:palette.stone;ferrule.visible=spinAxe.children[2].visible=sharp;trail.visible=!reduced.matches;orbit.visible=!mining&&spinning&&!cargo.visible&&current!=='deliver';},
  setCombat(kind='hatchet',level=1,stowed=false){combat=stowed?'hatchet':kind;for(const [key,g] of Object.entries(weapons)){const parent=gltf.scene.getObjectByName(stowed?'Chest':key==='bow'?'HandL':'HandR');if(g.parent!==parent){parent.add(g);g.position.set(stowed?.28:0,stowed?-.15:0,stowed?-.28:0);g.rotation.set(stowed?0:key==='spear'?Math.PI/2:key==='sword'?Math.PI:0,0,stowed?-.45:key==='bow'?-.25:0);}g.visible=key===kind&&!cargo.visible;g.scale.setScalar(level===2?1.12:1);if(key===kind)g.children[key==='bow'?0:key==='spear'?1:0].material=level===2?palette.gold:key==='bow'?palette.wood:palette.cream;}},
  play(name,duration=0){if(duration)temporary=duration;if(name===current&&!(duration&&(name==='deliver'||name.startsWith('attack_'))))return;const previous=actions[current],next=actions[name]||actions.idle;next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).play();if(previous!==next)previous.crossFadeTo(next,.12,false);current=name;},
  setLoad(wood=0,food=0,stone=0){loadStone=Math.max(0,Math.floor(stone));loadWood=Math.max(0,Math.floor(wood));loadFood=Math.max(0,Math.floor(food));loadCount=loadWood+loadFood+loadStone;pieces.forEach((piece,i)=>{piece.visible=i<loadCount;piece.material=i<Math.round(Math.min(8,loadCount)*loadWood/(loadCount||1))?palette.wood:i<Math.round(Math.min(8,loadCount)*(loadWood+loadFood)/(loadCount||1))?palette.red:palette.stone;});},
  setCommerceLoad(kind,count=0){commerceCargo.visible=!!kind&&count>0;if(!commerceCargo.visible)return;loadCount=count;pieces.forEach(p=>p.visible=false);pouch.visible=knot.visible=kind!=='pies';pieCargo.visible=kind==='pies';pouch.material=kind==='gold'?palette.gold:palette.cream;},
  tick(dt,pose='idle',speed=0,kind='wood',workSeconds=0){if(temporary>0)temporary-=dt;else this.play(pose);const moving=current==='walk'||current==='carry';if(moving){const clip=actions[current].getClip();actions[current].setEffectiveTimeScale(Math.max(0,Math.min(8,speed*clip.duration/(strides[current]*gltf.scene.scale.x))));}if(current==='work')actions.work.setEffectiveTimeScale(workSeconds?actions.work.getClip().duration*.75/workSeconds:1);mixer.update(dt);if(dt>0&&current==='work'&&kind==='food'){const weight=actions.work.getEffectiveWeight();pluckArm.rotation.x+=(-.7+pluckArm.rotation.x*.25-pluckArm.rotation.x)*weight;pluckForearm.rotation.x+=(-.5+(pluckForearm.rotation.x+.35)*.22-pluckForearm.rotation.x)*weight;grip.rotation.x*=1-.65*weight;}lean+=((moving?Math.min(.065,speed*.012):0)-lean)*(1-Math.exp(-dt*14));gltf.scene.rotation.x=reduced.matches?0:lean;cargo.position.y=-.14+(reduced.matches||!moving?0:Math.sin(actions[current].time*2*Math.PI)*.012);cargo.visible=loadCount>0&&(commerceCargo.visible||current==='carry'||current==='deliver'&&actions.deliver.time<.25);tool.visible=!mining&&!spinning&&(current==='work'&&kind==='wood'||current==='attack');orbit.visible=!mining&&spinning&&!cargo.visible&&current!=='deliver';contact.material.opacity=moving?.13:.17;},
  face(dx,dz,dt){if(Math.hypot(dx,dz)<.001)return;const target=Math.atan2(dx,dz),delta=Math.atan2(Math.sin(target-root.rotation.y),Math.cos(target-root.rotation.y));root.rotation.y+=delta*(1-Math.exp(-dt*17));},
  get pose(){return current;},get load(){return {wood:loadWood,food:loadFood,stone:loadStone};}
 };
}

export async function loadWolves(scene){
 const gltf=await new GLTFLoader().loadAsync('assets/characters/wolf.glb?v=47'),stride=gltf.parser.json.animations.find(a=>a.name==='run').extras?.stride||.78,reduced=matchMedia('(prefers-reduced-motion: reduce)');
 return Array.from({length:6},()=>{
  const root=new THREE.Group(),skin=clone(gltf.scene),mixer=new THREE.AnimationMixer(skin),actions=Object.fromEntries(gltf.animations.map(c=>[c.name,mixer.clipAction(c)]));
  let current='idle',wasActive=false,previousHit=0,hold=0,hpClock=0,arrival=0,exitClock=0;root.add(skin);scene.add(root);root.visible=false;
  const materials=[];skin.traverse(o=>{if(o.isMesh){o.castShadow=true;o.material=o.material.clone();o.material.transparent=true;materials.push(o.material);}});actions.idle.play();
  const contact=new THREE.Mesh(new THREE.CircleGeometry(.48,16),new THREE.MeshBasicMaterial({color:'#263F55',transparent:true,opacity:.15,depthWrite:false}));contact.rotation.x=-Math.PI/2;contact.scale.y=.7;contact.position.y=.06;root.add(contact);
  const track=new THREE.Mesh(new THREE.PlaneGeometry(.72,.085),new THREE.MeshBasicMaterial({color:'#263F55',side:THREE.DoubleSide})),bar=new THREE.Mesh(new THREE.PlaneGeometry(.66,.045),new THREE.MeshBasicMaterial({color:'#EB7960',side:THREE.DoubleSide}));track.position.y=1.95;bar.position.set(0,1.95,.008);root.add(track,bar);
  return {root,tick(dt,e,camera){
   if(!e||!e.active&&e.retreat<=0)exitClock=0;else if(!e.active&&wasActive)exitClock=.38;exitClock=Math.max(0,exitClock-dt);root.visible=!!e&&(e.active||exitClock>0);if(!root.visible){wasActive=false;return;}
   const previous=[root.position.x,root.position.z],target=e.path?.[0]||[0,1.15],yaw=Math.atan2(target[0]-e.position[0],target[1]-e.position[1]);
   if(e.active&&!wasActive){arrival=0;previousHit=0;hpClock=0;root.rotation.y=yaw;}
   arrival=Math.min(1,arrival+dt/.12);const delta=Math.atan2(Math.sin(yaw-root.rotation.y),Math.cos(yaw-root.rotation.y));root.rotation.y+=delta*(1-Math.exp(-dt*16));
   const exit=e.active?0:1-exitClock/.38;root.position.set(e.position[0]+Math.sin(root.rotation.y)*exit*.35,0,e.position[1]+Math.cos(root.rotation.y)*exit*.35);skin.scale.setScalar(1.18*(reduced.matches?1:.92+.08*arrival));
   if(e.hit>previousHit){hold=.035;hpClock=.9;}previousHit=e.hit;hpClock=Math.max(0,hpClock-dt);hold=Math.max(0,hold-dt);
   const pose=!e.active?'retreat':e.hit>0?'hit':e.path.length?'run':'bite';if(pose!==current){actions[pose].reset().play();actions[current].crossFadeTo(actions[pose],.08,false);current=pose;}
   if(pose==='run'){const speed=Math.hypot(e.position[0]-previous[0],e.position[1]-previous[1])/Math.max(.001,dt);actions.run.setEffectiveTimeScale(Math.min(2,speed*.65/(stride*1.18)));}mixer.update(hold>0?0:dt);materials.forEach(m=>{m.emissive.setHex(e.hit>0?0x77321c:0);m.opacity=1-exit;});contact.material.opacity=.15*(1-exit);
   root.position.y=groundHeight(root.position.x,root.position.z);track.quaternion.copy(camera.quaternion).premultiply(root.quaternion.clone().invert());bar.quaternion.copy(track.quaternion);track.visible=bar.visible=e.active&&hpClock>0;bar.scale.x=Math.max(0,e.hp/(e.maxHp||6));bar.position.x=-(1-bar.scale.x)*.33;wasActive=e.active;
  }};
 });
}
