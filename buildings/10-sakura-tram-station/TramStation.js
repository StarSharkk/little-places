import * as THREE from 'three';
import {createMaterials,themes} from './materials.js';
import {createAtlas} from './Atlas.js';
import {Station,G} from './Station.js';
import {Track} from './Track.js';
import {Tram} from './Tram.js';
import {Props} from './Props.js';
import {streetEdge} from '../shared/street.js';
import {timeline,ease} from '../shared/motion.js';
import {plate} from '../shared/primitives.js';
import {createTramLoop,clipTram,ROUTE} from './TramLoop.js';

/** 10 / Sakura Tram Station. One human-scale transport diorama and a single shared pivot. */
export function createTramStation(options={}){
 const root=new THREE.Group();root.name='TramStationRoot';
 const m=createMaterials(),atlas=createAtlas();
 const ground=streetEdge(root,{style:'curb',x0:-6.50,x1:6.50,z0:-4.05,z1:5.55,sides:[],corner:.45});
 const station=Station(root,m,atlas);Track(root,m);const props=Props(root,m,atlas),tram=Tram(root,m,atlas);
 m.tramShadow=new THREE.MeshBasicMaterial({color:'#92A6CF'});
 const travellingShadow=plate(tram.motion,5.25,1.65,.006,.25,m.tramShadow,[-.17,.252,.24]);
 travellingShadow.rotation.x=-Math.PI/2;travellingShadow.userData.outline=false;
 clipTram(tram,root);
 const state={auto:true,docked:false,moving:true,speed:ROUTE.speed,loops:0,stopRequested:false,doorsOpen:false,doorAmount:0,ticketCount:0,ticketRunning:false,night:0,seeThrough:false};
 const loop=createTramLoop(tram,state);
 const ticket=timeline(1.8,t=>{
  props.paper.visible=t>=.5&&t<1.8;props.paper.position.z=-1.28+ease((t-.5)/.85)*.22;
  props.paper.position.y=G.platform+.44-ease((t-.9)/.8)*.06;
  props.button.position.z=.34-(t<.35?Math.sin(t/.35*Math.PI)*.035:0);
  m.screen.color.set(t<1.8?'#FFF0A9':state.night>.5?'#FFE1A1':'#97BCAE');
 });
 const api={
  group:root,materials:m,atlas,state,tram,station,props,
  footprint:{min:[-6.55,0,-4.10],max:[6.55,6.15,5.60]},
  dynamic:[station.shell,station.roofs,props.ticket,props.paper],
  outlineMaterials:[m.hull,...tram.outlineMaterials],
  // The tram's own shadow follows its live parent along the ballast.
  shadowFloor:ground.floors,
  labels:[['さくら町駅 · Sakura Station',[.1,4.1,.1]],['Platform 1 · Please mind the gap',[-3.8,1.7,1.5]],['Tickets for little journeys',[3.94,2.55,-1.2]],['Vintage tram 709',()=>tram.motion.position.clone().add(new THREE.Vector3(1.1,2.3,.95)),()=>tram.motion.visible],['Overhead contact wire',[0,G.contactY,G.trackZ]]],
  toggleTravel:instant=>loop.toggleTravel(instant),
  toggleDoors:instant=>loop.toggleDoors(instant),
  buyTicket(instant=false){if(ticket.running)return false;state.ticketCount++;ticket.start(instant);state.ticketRunning=ticket.running;return true;},
  animate(dt){
   const moving=loop.step(dt),wasTicket=ticket.running;
   ticket.step(dt);state.ticketRunning=ticket.running;
   return moving||wasTicket;
  },
  settle(){loop.settle();if(ticket.running)ticket.step(2);state.ticketRunning=false;},
  setSeeThrough(on){state.seeThrough=on;station.shell.visible=!on;station.roofs.visible=!on;tram.roof.visible=!on;},
  setNight(t){
   state.night=t;m.glass.color.set('#BFE0DC').lerp(new THREE.Color('#FFD48A'),t);m.glass.opacity=.15+.15*t;
   m.glow.color.set('#E8DAB6').lerp(new THREE.Color('#FFD17E'),t);
   m.headlight.color.set('#EEE5C3').lerp(new THREE.Color('#FFF0AF'),t);
   m.screen.color.set('#97BCAE').lerp(new THREE.Color('#FFE1A1'),t);m.redLight.color.set('#BD6654').lerp(new THREE.Color('#FF7454'),t);
   m.tramShadow.color.set('#92A6CF').lerp(new THREE.Color('#161C2B'),t);
  },
  setPalette(index){const palette=themes[index%5];for(const [key,color]of Object.entries(palette))m[key].color.set(color);},
 };
 root.position.set(...(options.position??[0,0,0]));
 return api;
}
