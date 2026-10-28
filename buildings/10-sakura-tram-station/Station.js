import * as THREE from 'three';
import {group,box,plate,rod,cylinder,extrudeShape,wallWithHoles,rectPath} from '../shared/primitives.js';
import {Bench} from '../shared/props.js';

export const G={platform:.66,platformEdge:2.15,railY:.34,trackZ:3.70,gauge:1.18,contactY:5.65};
function frame(g,m,x,y,z,w,h){
 for(const dx of [-w/2,w/2])box(g,.085,h+.12,.13,m.frame,[x+dx,y,z]);
 for(const dy of [-h/2,h/2])box(g,w+.14,.085,.13,m.frame,[x,y+dy,z]);
 box(g,w-.06,h-.06,.012,m.glass,[x,y,z-.025],false);
 box(g,.045,h,.08,m.cream,[x,y,z+.025]);box(g,w,.045,.08,m.cream,[x,y+.15,z+.025]);
 box(g,w+.28,.08,.23,m.cream,[x,y-h/2-.08,z+.03]);
}
function roof(g,m,w,d,eave,rise,z,cx=0){
 for(const side of [-1,1]){
  const s=new THREE.Shape();s.moveTo(0,eave+rise);s.lineTo(side*(w/2-.2),eave+.08);s.quadraticCurveTo(side*w/2,eave+.01,side*(w/2+.15),eave+.10);s.lineTo(side*(w/2+.15),eave-.04);s.lineTo(0,eave+rise-.16);s.closePath();
  extrudeShape(g,s,d,m.roof,[cx,0,z]);
  if(side===1)rod(g,[cx, eave+rise+.04,z-d/2-.03],[cx,eave+rise+.04,z+d/2+.03],.095,m.roof,12);
  // Explicit ink follows the rounded ridge and raised gable edges; smooth tile
  // profiles alone do not produce a reliable silhouette with EdgesGeometry.
  if(side===1)rod(g,[cx,eave+rise+.14,z-d/2-.035],[cx,eave+rise+.14,z+d/2+.035],.022,m.ink,8);
  for(const sz of [-1,1]){
   const zz=z+sz*(d/2+.11);
   rod(g,[cx,eave+rise+.025,zz],[cx+side*(w/2-.2),eave+.105,zz],.022,m.ink,8);
   rod(g,[cx+side*(w/2-.2),eave+.105,zz],[cx+side*(w/2+.15),eave+.12,zz],.022,m.ink,8);
  }
  rod(g,[cx+side*(w/2+.15),eave+.12,z-d/2],[cx+side*(w/2+.15),eave+.12,z+d/2],.022,m.ink,8);
  for(let row=1;row<6;row++){
   const x=side*w/2*row/6,y=eave+rise*(1-row/6)+.04;
   rod(g,[cx+x,y,z-d/2-.02],[cx+x,y,z+d/2+.02],.018,m.walnut,5);
  }
  for(let k=0;k<=13;k++){const zz=z-d/2+k*d/13;rod(g,[cx,eave+rise+.07,zz],[cx+side*(w/2-.2),eave+.14,zz],.014,m.roof,5);}
  for(const sz of [-1,1])rod(g,[cx,eave+rise-.08,z+sz*(d/2+.02)],[cx+side*(w/2+.12),eave-.01,z+sz*(d/2+.02)],.035,m.ink,8);
 }
}
export function Station(root,m,atlas){
 const platform=group(root,'Raised tiled platform');
 box(platform,12.1,.49,5.88,m.stone,[0,.40,-.82]);box(platform,12.2,.055,5.98,m.paving,[0,.6325,-.82]);
 for(let x=-5.8;x<6;x+=.55)box(platform,.51,.035,.32,m.yellow,[x,.677,1.90],false);
 for(let x=-5.7;x<6;x+=.9)box(platform,.012,.005,5.75,m.joint,[x,.664,-.82],false);
 for(let z=-3.4;z<2;z+=.7)box(platform,12,.005,.012,m.joint,[0,.665,z],false);
 for(let x=-5.7;x<6;x+=.6)box(platform,.56,.18,.09,m.cream,[x,.43,2.15]);
 for(let i=0;i<3;i++)box(platform,1.40,.17,(3-i)*.35,m.stone,[5.35,.155+.085+i*.17,2.45+(2-i)*.17]);
 const shell=group(root,'Station cutaway walls'),roofs=group(root,'Station roofs and canopy');
 const fixedWalls=group(root,'Station rear and side walls');
 box(roofs,6.83,.14,3.20,m.cream,[.1,3.60,-1.67]);
 box(roofs,6.66,.065,3.03,m.frame,[.1,3.50,-1.67]);
 for(const side of [-1,1]){
  for(const z of [-2.95,-2.45,-1.95,-1.45,-.95,-.40])box(roofs,.045,.42,.045,m.walnut,[.1+side*3.24,3.88,z]);
  for(const y of [3.75,4.10])rod(roofs,[.1+side*3.24,y,-2.97],[.1+side*3.24,y,-.39],.025,m.walnut,7);
  for(const z of [-2.6,-1.4])box(roofs,.33,.23,.66,m.cream,[.1+side*2.98,3.79,z]);
 }
 const holes=[rectPath(THREE.Path,-.70,0,.70,2.22),rectPath(THREE.Path,-2.65,.76,-1.20,2.17),rectPath(THREE.Path,1.18,.76,2.65,2.17)];
 wallWithHoles(shell,6.5,2.9,.20,holes,m.wall,[.1,G.platform,-.25]);
 box(fixedWalls,6.5,2.9,.20,m.wall,[.1,2.11,-3.12]);
 for(const s of [-1,1]){
  const side=group(fixedWalls,'Side wall',[.1+s*3.25,G.platform,-1.68]);side.rotation.y=Math.PI/2;
  wallWithHoles(side,2.88,2.9,.20,[rectPath(THREE.Path,-.76,.78,.76,2.14)],m.wall);
  frame(side,m,0,1.46,.12,1.52,1.36);
  frame(fixedWalls,m,s*1.94+.1,2.11,-3.24,1.4,1.42);
 }
 for(const x of [-3.15,3.35])for(const z of [-.16,-3.15]){
  const parent=z< -1?fixedWalls:shell;
  box(parent,.16,2.9,.18,m.frame,[x,2.11,z]);box(parent,.27,.22,.27,m.stone,[x,.78,z]);
 }
 for(const z of [-.13,-3.24])for(const y of [.86,1.12,3.44])box(z< -1?fixedWalls:shell,6.6,.11,.08,m.cream,[.1,y,z]);
 frame(shell,m,-1.84,2.12,-.12,1.45,1.41);frame(shell,m,2.04,2.12,-.12,1.47,1.41);
 const entry=group(shell,'Station glazed entrance',[.1,G.platform,-.10]);
 for(const x of [-.66,0,.66])box(entry,.075,2.22,.13,m.frame,[x,1.11,0]);
 for(const y of [.08,.56,2.18])box(entry,1.4,.075,.13,m.frame,[0,y,0]);
 box(entry,1.25,1.58,.018,m.glass,[0,1.38,0],false);box(entry,1.26,.43,.09,m.wood,[0,.30,0]);
 for(const x of [-.12,.12])rod(entry,[x,.85,.10],[x,1.12,.10],.022,m.brass,8);
 // Attic and the front clock gable: the small raised mass is part of the station roof.
 box(roofs,4.7,.95,2.62,m.wall,[.1,3.95,-1.67]);
 const tri=new THREE.Shape();tri.moveTo(-2.35,4.39);tri.lineTo(.0,5.87);tri.lineTo(2.35,4.39);tri.closePath();
 for(const z of [-.31,-3.03])extrudeShape(roofs,tri,.16,m.wall,[.1,0,z]);
 roof(roofs,m,5.4,3.36,4.31,1.60,-1.67,.1);
 for(const x of [-1.65,1.65])frame(roofs,m,x+.1,3.97,-.30,.84,.65);
 const clock=cylinder(roofs,.43,.43,.09,m.wood,[.1,4.86,-.16],true,40);clock.rotation.x=Math.PI/2;
 atlas.attach(roofs,'clock',.82,.82,[.1,4.86,-.105]);
 plate(roofs,4.36,.78,.15,.05,m.cream,[.1,3.72,-.07]);atlas.attach(roofs,'sign',4.20,.70,[.1,3.72,.012]);
 // An engineered standing-seam rain canopy, with independent posts and curved braces.
 const canopy=group(roofs,'Green platform rain canopy');
 const cap=box(canopy,9.65,.12,1.85,m.canopy,[.0,3.33,.12]);cap.rotation.x=.12;
 for(let x=-4.65;x<4.8;x+=.32)rod(canopy,[x,3.50,-.78],[x,3.29,1.02],.012,m.cream,4);
 box(canopy,9.75,.17,.13,m.canopy,[0,3.21,1.05]);
 for(const x of [-4.55,-2.8,2.8,4.55]){
  box(root,.16,2.55,.16,m.frame,[x,1.935,.65]);box(root,.30,.15,.30,m.stone,[x,.735,.65]);
  rod(root,[x,2.64,.65],[x,3.23,-.02],.05,m.frame,8);
  rod(root,[x,2.68,.65],[x+(x<0?.42:-.42),3.2,.65],.045,m.frame,8);
 }
 for(const x of [-3.6,0,3.6]){
  rod(roofs,[x,3.15,.48],[x,2.89,.48],.015,m.iron,6);
  cylinder(roofs,.13,.20,.13,m.frame,[x,2.85,.48],true,16);cylinder(roofs,.115,.10,.17,m.glow,[x,2.73,.48],false,16);
 }
 const interior=group(root,'Ticket hall interior');interior.userData.noShadow=true;
 box(interior,6.25,.06,2.65,m.woodLight,[.1,.70,-1.7]);
 for(let x=-2.8;x<3.3;x+=.3)box(interior,.012,.005,2.60,m.walnut,[x,.733,-1.7],false);
 Bench(interior,m,[-1.9,.74,-2.53],0);Bench(interior,m,[2,.74,-2.53],0);
 const counter=group(interior,'Ticket counter',[.15,.74,-2.18]);box(counter,1.3,.91,.53,m.wood,[0,.455,0]);box(counter,1.42,.07,.63,m.walnut,[0,.945,0]);
 for(const x of [-.72,.72])box(counter,.065,1.30,.06,m.frame,[x,1.56,-.15]);box(counter,1.5,.065,.06,m.frame,[0,2.20,-.15]);
 atlas.attach(interior,'timetable',.72,.90,[-1.82,2.40,-2.996]);atlas.attach(interior,'map',.72,.90,[1.93,2.40,-2.996]);
 for(const x of [-2.35,2.45])frame(fixedWalls,m,x,2.15,-3.25,1.0,1.4);
 box(interior,.12,.15,.14,m.glow,[0,2.77,-2.92],false);
 return {shell,roofs,interior};
}
