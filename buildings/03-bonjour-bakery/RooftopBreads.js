import * as THREE from 'three';
import {group,plate,shape,tube,sphere,mesh} from './primitives.js';
import {hull} from './outline.js';

const ROOF={depth:3.5,height:.9,eave:3.56};
const roofY=z=>ROOF.eave+ROOF.height*(1-Math.abs(z)/(ROOF.depth/2));

// Each bread is a bevelled slab with a dark-brown ink silhouette (hull) and the same ink on the rim of its face.
function face(parent,name,outline,inner,m,pos,depth=.30){
 const g=group(parent,name,pos);g.userData.depth=depth+.09;
 const geometry=new THREE.ExtrudeGeometry(outline,{depth,bevelEnabled:true,bevelSize:.045,bevelThickness:.045,bevelSegments:4,curveSegments:24,steps:1});
 geometry.translate(0,.045,-depth/2);
 hull(mesh(g,geometry,m.bread,[0,0,0],false),m.breadInk);
 tube(g,outline.getPoints(64).map(p=>[p.x,p.y+.045,depth/2+.046]),.009,m.breadInkLine,true);
 shape(g,inner,.014,m.crumb,[0,.045,depth/2+.047],false);
 return g;
}

function Boule(parent,m,pos){
 const outer=new THREE.Shape();outer.moveTo(-.42,0);outer.quadraticCurveTo(-.46,.31,-.30,.52);outer.quadraticCurveTo(0,.82,.30,.52);outer.quadraticCurveTo(.46,.31,.42,0);outer.closePath();
 const inner=new THREE.Shape();inner.moveTo(-.34,.06);inner.quadraticCurveTo(-.37,.30,-.24,.47);inner.quadraticCurveTo(0,.69,.24,.47);inner.quadraticCurveTo(.37,.30,.34,.06);inner.closePath();
 const g=face(parent,'Sesame boule',outer,inner,m,pos,.52);
 for(let i=0;i<13;i++){const a=i*2.399,r=.08+(i%4)*.065;const seed=sphere(g,[.012,.025,.008],m.crumb,[Math.cos(a)*r,.31+Math.sin(a)*r*.62,.322]);seed.rotation.z=a;}
 tube(g,[[-.27,.28,.322],[-.12,.37,.325],[.04,.41,.326],[.20,.38,.325]],.012,m.cream);
 return g;
}

function MilkBread(parent,m,pos){
 const outer=new THREE.Shape();outer.moveTo(-.34,0);outer.lineTo(.34,0);outer.lineTo(.34,.39);outer.quadraticCurveTo(.34,.62,.17,.64);outer.quadraticCurveTo(.04,.64,0,.51);outer.quadraticCurveTo(-.04,.64,-.17,.64);outer.quadraticCurveTo(-.34,.62,-.34,.39);outer.closePath();
 const inner=new THREE.Shape();inner.moveTo(-.27,.06);inner.lineTo(.27,.06);inner.lineTo(.27,.39);inner.quadraticCurveTo(.27,.54,.15,.56);inner.quadraticCurveTo(.04,.56,0,.44);inner.quadraticCurveTo(-.04,.56,-.15,.56);inner.quadraticCurveTo(-.27,.54,-.27,.39);inner.closePath();
 const g=face(parent,'Split-top milk bread',outer,inner,m,pos,.48);
 tube(g,[[0,.18,.30],[-.015,.32,.301],[0,.47,.301]],.012,m.cream);
 return g;
}

// a softly tapered capsule (superellipse), so the long loaf reads round rather than pointed
function capsule(a,b,taper,y0=0,n=2.4,steps=72){
 const pts=[];for(let i=0;i<steps;i++){const t=i/steps*Math.PI*2,c=Math.cos(t),si=Math.sin(t);
  const y=b+b*Math.sign(si)*Math.abs(si)**(2/n),x=a*Math.sign(c)*Math.abs(c)**(2/n)*(1-taper*(y-b)/b);pts.push(new THREE.Vector2(x,y+y0));}
 return new THREE.Shape(pts);
}
function Baguette(parent,m,pos){
 const outer=capsule(.2,.53,.12),inner=capsule(.145,.47,.12,.06);
 const g=face(parent,'Scored baguette',outer,inner,m,pos,.40);
 for(const y of [.27,.47,.67,.85])tube(g,[[-.09,y-.05,.263],[.02,y,.267],[.1,y+.06,.263]],.016,m.cream);
 return g;
}

// A wooden board lies flat on the front slope of the hipped roof (no posts), and the breads stand upright on it.
// Each loaf is seated so its front edge just touches the board; the back tucks into it like an ornament.
const SLOPE=Math.atan2(ROOF.height,ROOF.depth/2),BOARD=.12;
export function RooftopBreads(parent,m){
 const display=group(parent,'Three rooftop breads');
 const z=.66,clearance=.012;
 const board=group(display,'Bread board',[0,roofY(z)+.012,z]);board.rotation.x=SLOPE;
 plate(board,3.58,.96,BOARD,.12,m.woodLight,[0,BOARD/2,0]).rotation.x=-Math.PI/2;
 const surface=zz=>roofY(zz)+.012+BOARD/Math.cos(SLOPE);
 const seat=(make,x,dz,s)=>{
  const b=make(display,m,[x,0,z+dz]);b.scale.set(...s);
  const front=z+dz+b.userData.depth/2*s[2];b.position.y=surface(front)+clearance;return b;
 };
 seat(Boule,-1.02,0,[1.5,1.5,1.5]);
 seat(MilkBread,.21,.015,[1.5,1.5,1.5]);
 seat(Baguette,1.12,0,[1.55,1.5,1.5]);
 display.userData.breadCount=3;
 display.userData.roofClearance=clearance;
 return display;
}
