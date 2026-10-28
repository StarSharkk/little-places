import * as THREE from 'three';
import {G} from './Station.js';

export const ROUTE={left:-6.35,right:6.35,halfLength:2.85,entry:-9.35,exit:9.35,dock:-.45,speed:1.85,acceleration:1.35};

/** A unidirectional route: only the invisible, fully departed car may wrap to the entry. */
export function createTramLoop(tram,state){
 let velocity=ROUTE.speed,stopLap=0;
 tram.motion.position.x=ROUTE.entry;
 function poseDoors(){for(const d of tram.doors)d.group.position.x=d.home+d.slide*state.doorAmount;}
 function visibility(){const x=tram.motion.position.x;tram.motion.visible=x+ROUTE.halfLength>ROUTE.left&&x-ROUTE.halfLength<ROUTE.right;}
 function open(instant){
  if(instant){tram.motion.position.x=ROUTE.dock;state.docked=true;state.moving=false;state.stopRequested=false;state.doorsOpen=true;state.doorAmount=1;velocity=0;poseDoors();visibility();return;}
  state.stopRequested=true;
  stopLap=state.loops+(tram.motion.position.x>ROUTE.dock+.001?1:0);
  state.auto=true;
 }
 visibility();
 return {
  toggleDoors(instant=false){
   if(state.doorsOpen){state.doorsOpen=false;state.stopRequested=false;state.auto=true;if(instant){state.doorAmount=0;poseDoors();}return true;}
   if(state.stopRequested){state.stopRequested=false;return true;}
   if(state.docked&&!state.moving){state.doorsOpen=true;if(instant){state.doorAmount=1;poseDoors();}return true;}
   open(instant);return true;
  },
  toggleTravel(instant=false){
   if(state.doorsOpen||state.doorAmount>.001)return false;
   state.auto=!state.auto;state.stopRequested=false;
   if(instant){velocity=0;state.moving=false;}
   return true;
  },
  step(dt){
   const wasActive=state.moving||state.auto&&!state.doorsOpen||state.doorAmount!==Number(state.doorsOpen);
   const goal=+state.doorsOpen;
   state.doorAmount=THREE.MathUtils.damp(state.doorAmount,goal,10,dt);
   if(Math.abs(state.doorAmount-goal)<.0001)state.doorAmount=goal;
   poseDoors();
   if(state.doorsOpen||state.doorAmount>.0001){velocity=0;state.moving=false;visibility();return wasActive;}
   let dx=0;
   const stopHere=state.stopRequested&&state.loops===stopLap;
   const distance=ROUTE.dock-tram.motion.position.x;
   const desired=state.auto?(stopHere?Math.min(ROUTE.speed,Math.sqrt(2*ROUTE.acceleration*Math.max(0,distance))):ROUTE.speed):0;
   velocity=THREE.MathUtils.clamp(desired,velocity-ROUTE.acceleration*dt,velocity+ROUTE.acceleration*dt);
   if(velocity<.0001)velocity=0;
   dx=velocity*dt;
   if(stopHere&&distance>=0&&dx>=distance-.001){
    dx=distance;velocity=0;state.docked=true;state.doorsOpen=true;state.stopRequested=false;
   }else if(dx>0){state.docked=false;}
   tram.motion.position.x+=dx;
   for(const wheel of tram.wheels)wheel.rotation.z-=dx/.245;
   state.moving=velocity>0;
   if(tram.motion.position.x>=ROUTE.exit){
    state.lastReset={from:tram.motion.position.x,to:ROUTE.entry,fullyOutside:tram.motion.position.x-ROUTE.halfLength>ROUTE.right};
    tram.motion.position.x=ROUTE.entry;state.loops++;
   }
   state.speed=velocity;visibility();
   return wasActive||state.auto&&!state.doorsOpen;
  },
  settle(){velocity=0;state.moving=false;state.stopRequested=false;tram.motion.position.x=ROUTE.dock;state.docked=true;state.doorAmount=+state.doorsOpen;poseDoors();visibility();},
 };
}

/** Local rail boundaries become world planes immediately before each draw, including during turntable/rail layout. */
export function clipTram(tram,root){
 const local=[new THREE.Plane(new THREE.Vector3(1,0,0),-ROUTE.left),new THREE.Plane(new THREE.Vector3(-1,0,0),ROUTE.right)];
 const world=local.map(p=>p.clone()),materials=new Map(),lines=[];
 tram.motion.traverse(o=>{
  if(!o.isMesh)return;
  const source=o.material;
  if(!materials.has(source)){
   const material=source.clone();material.clippingPlanes=world;material.clipShadows=false;
   materials.set(source,material);if(material.isLineMaterial)lines.push(material);
  }
  o.material=materials.get(source);
  o.onBeforeRender=()=>{
   for(let i=0;i<2;i++)world[i].copy(local[i]).applyMatrix4(root.matrixWorld);
   if(source.color)o.material.color.copy(source.color);
  };
 });
 tram.outlineMaterials=lines;
}
