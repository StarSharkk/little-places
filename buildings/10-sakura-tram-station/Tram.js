import * as THREE from 'three';
import {group,box,plate,rod,cylinder,wallWithHoles,rectPath,ring} from '../shared/primitives.js';
import {finishModel} from '../02-yamada-grocery/src/optimize.js';
import {G} from './Station.js';

export function Tram(root,m,atlas){
 const motion=group(root,'TramMotionRoot',[-.45,0,G.trackZ]);
 const body=group(motion,'Tram body and cabin');body.userData.action='tramTravel';
 const roof=group(motion,'Removable tram roof');
 const doors=[],wheels=[];
 // Opposite-side leaves slide together; one batch per direction, without nested dynamic groups.
 for(const dx of [-.23,.23]){
  const door=group(motion,'Sliding tram door',[1.64+dx,1.02,0]);door.userData.action='tramDoors';
  doors.push({group:door,home:door.position.x,slide:Math.sign(dx)*.44});
 }
 box(body,4.90,.18,1.50,m.steelDark,[0,.89,0]);box(body,4.80,.07,1.48,m.woodLight,[0,1.015,0]);
 for(const s of [-1,1]){
  const side=group(body,'Windowed tram side',[0,1.02,s*.84]);
  const holes=[rectPath(THREE.Path,1.18,0,2.1,1.94)];
  for(const x of [-1.80,-.94,-.08,.78])holes.push(rectPath(THREE.Path,x-.34,.61,x+.34,1.84));
  wallWithHoles(side,4.90,2.08,.075,holes,m.tramCream);
  // Lower green panel stops at the actual doorway.
  box(body,3.63,.49,.09,m.tramGreen,[-.635,1.265,s*.86]);box(body,.35,.49,.09,m.tramGreen,[2.275,1.265,s*.86]);
  for(const x of [-1.80,-.94,-.08,.78]){
   for(const dx of [-.365,.365])box(body,.042,1.27,.10,m.brass,[x+dx,2.245,s*.865]);
   for(const y of [1.61,2.88])box(body,.77,.043,.10,m.brass,[x,y,s*.865]);
   box(body,.65,1.20,.012,m.glass,[x,2.24,s*.875],false);
   box(body,.70,.035,.08,m.tramCream,[x,2.61,s*.88]);
  }
  for(const [index,dx] of [-.23,.23].entries()){
   const door=group(doors[index].group,'Door glazing and panels',[0,0,s*.896]);
   box(door,.44,.42,.055,m.tramGreen,[0,.21,0]);
   for(const x of [-.205,.205])box(door,.035,1.52,.06,m.tramCream,[x,1.17,0]);
   for(const y of [.45,1.94])box(door,.44,.045,.06,m.tramCream,[0,y,0]);
   box(door,.36,1.40,.012,m.glass,[0,1.2,0],false);box(door,.035,1.4,.06,m.brass,[0,1.2,0]);
   rod(door,[dx<0?.12:-.12,.81,s*.045],[dx<0?.12:-.12,1.06,s*.045],.014,m.brass,6);
  }
  box(body,5.03,.045,.07,m.tramAccent,[0,1.51,s*.89]);
  // Opposing longitudinal benches, with enough aisle clearance for the two doorways.
  box(body,3.2,.12,.34,m.seat,[-.55,1.43,s*.54]);box(body,3.2,.43,.09,m.seat,[-.55,1.71,s*.70]);
  for(const x of [-1.85,-.5,.95])rod(body,[x,1.49,s*.47],[x,2.92,s*.47],.018,m.brass,8);
 }
 for(const end of [-1,1]){
  const cab=group(body,'Rounded tram cab',[end*2.45,0,0]);cab.rotation.y=end*Math.PI/2;
  plate(cab,1.68,.65,.19,.22,m.tramGreen,[0,1.32,0]);
  plate(cab,1.67,.24,.19,.12,m.tramCream,[0,3.02,0]);
  for(const x of [-.75,0,.75])box(cab,.075,1.22,.17,m.tramCream,[x,2.29,0]);
  for(const x of [-.36,.36])box(cab,.65,1.16,.015,m.glass,[x,2.29,.10],false);
  box(cab,1.58,.07,.19,m.brass,[0,1.68,0]);
  plate(cab,1.08,.26,.04,.06,m.tramAccent,[0,2.95,.13]);atlas.attach(cab,'route',1.01,.22,[0,2.95,.155]);
  const housing=cylinder(cab,.15,.15,.12,m.brass,[0,1.38,.16],true,24);housing.rotation.x=Math.PI/2;
  const lamp=cylinder(cab,.115,.115,.025,m.headlight,[0,1.38,.235],false,24);lamp.rotation.x=Math.PI/2;
  for(const x of [-.52,.52]){const l=cylinder(cab,.057,.057,.03,m.redLight,[x,1.17,.12],false,12);l.rotation.x=Math.PI/2;}
  atlas.attach(cab,'number',.30,.24,[.36,1.39,.12]);
  box(cab,1.35,.13,.24,m.steelDark,[0,.93,.17]);
  rod(cab,[0,2.18,.13],[.35,1.85,.13],.012,m.iron,6);
 }
 const top=plate(roof,5.24,1.88,.17,.30,m.tramGreen,[0,3.18,0]);top.rotation.x=-Math.PI/2;
 for(const x of [-1.6,1.45]){
  box(roof,.65,.17,.73,m.steel,[x,3.36,0]);
  for(let k=0;k<5;k++)box(roof,.47,.012,.035,m.steelDark,[x,3.453,-.22+k*.11],false);
 }
 const pantograph=group(roof,'Diamond pantograph');
 box(pantograph,1.1,.10,.78,m.iron,[0,3.4,0]);
 for(const z of [-.28,.28]){
  const points=[[0,3.47,z],[-.79,4.46,z],[0,G.contactY-.03,z],[.79,4.46,z],[0,3.47,z]];
  for(let i=0;i<4;i++)rod(pantograph,points[i],points[i+1],.028,m.steelDark,8);
  for(const x of [-.79,.79]){const pin=cylinder(pantograph,.065,.065,.10,m.brass,[x,4.46,z],true,12);pin.rotation.x=Math.PI/2;}
 }
 rod(pantograph,[0,G.contactY-.02,-.48],[0,G.contactY-.02,.48],.035,m.iron,10);
 for(const x of [-1.66,1.66]){
  box(body,.95,.26,1.24,m.iron,[x,.70,0]);
  const wheel=group(motion,'Rail-aligned wheel axle',[x,G.railY+.245,0]);
  for(const z of [-G.gauge/2,G.gauge/2]){
   const tyre=cylinder(wheel,.245,.245,.13,m.tyre,[0,0,z],true,24);tyre.rotation.x=Math.PI/2;
   const hub=cylinder(wheel,.135,.135,.145,m.steel,[0,0,z],true,16);hub.rotation.x=Math.PI/2;
   for(let k=0;k<6;k++){const a=k*Math.PI/3;rod(wheel,[0,0,z+.08],[Math.cos(a)*.19,Math.sin(a)*.19,z+.08],.012,m.iron,5);}
  }
  wheels.push(wheel);
 }
 for(const x of [-1.7,-.8,.1,.9]){
  const hand=ring(body,.075,.012,m.cream,[x,2.66,0],14,5);
  rod(body,[x,2.75,0],[x,2.94,0],.012,m.brass,6);
 }
 // Bake rigid car/doors/wheels independently before attaching the live hierarchy to the collection.
 // The live ancestor protects these finished batches from the collection's second static pass.
 const outlineMaterials=finishModel(motion,[body,roof,...doors.map(d=>d.group),...wheels]);
 motion.userData.live=true;
 return {motion,body,roof,doors,wheels,pantograph,outlineMaterials};
}
