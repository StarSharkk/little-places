import * as THREE from 'three';
import {group,box,plate,cylinder,rod,tube,sphere,ring} from './primitives.js';
import {Baguette,Toast,Croissant,KraftBag,TIERS,TIER_X,TIER_W} from './Pastries.js';
export const GROUND=.155; // top of the paved forecourt
export function PaperBag(parent,m,atlas,pos=[0,0,0]){
 const g=group(parent,'Your bread to take home',pos);g.userData.action='bakeryTake';
 box(g,.42,.55,.27,m.woodLight,[0,.28,0]);
 const flap=box(g,.43,.08,.28,m.paper,[0,.57,0]);flap.rotation.x=.08;
 atlas.attach(g,'bag',.34,.40,[0,.29,.141]);
 for(const z of [-.08,.08])tube(g,[[-.12,.59,z],[-.11,.74,z],[.11,.74,z],[.12,.59,z]],.012,m.crust);
 const b=Baguette(g,m,[.05,.69,0],.40);b.rotation.z=-.19;
 return g;
}
export function Interior(root,m,atlas){
 const g=group(root,'Bakery interior');
 // A real tiled floor, back shelves and baking station.
 for(let x=-2.5;x<2.6;x+=.5)for(let z=-1.35;z<1.5;z+=.5)box(g,.49,.015,.49,(Math.round(x*2+z*2)%2)?m.paper:m.tile,[x,.275,z],false);
 for(const y of [.8,1.55,2.25])box(g,2.9,.08,.57,m.woodLight,[1,y,-1.2]);
 for(const x of [-.53,2.53])box(g,.07,2.2,.5,m.wood,[x,1.38,-1.2]);
 for(let i=0;i<3;i++){box(g,.53,.30,.34,m.cream,[.10+i*.85,2.45,-1.24]);atlas.attach(g,'box',.48,.23,[.10+i*.85,2.45,-1.063]);box(g,.55,.025,.36,m.accent,[.10+i*.85,2.61,-1.24]);}
 // Rounded, ceramic bread oven with a recess and controls.
 plate(g,1.35,1.48,.73,.17,m.oven,[-1.68,1.04,-1.1]);
 plate(g,1.10,.72,.05,.13,m.ink,[-1.68,1.17,-.714]);
 plate(g,.93,.55,.01,.10,m.crust,[-1.68,1.17,-.681]);
 for(const y of [.99,1.25])box(g,.92,.027,.03,m.steel,[-1.68,y,-.669]);
 for(const x of [-2.08,-1.88]){const knob=cylinder(g,.05,.05,.035,m.cream,[x,.61,-.69]);knob.rotation.x=Math.PI/2;}
 rod(g,[-1.95,.79,-.62],[-1.40,.79,-.62],.025,m.ink);
 box(g,1.6,.09,.88,m.woodLight,[-1.68,1.86,-1.06]);
 // chalk menu board above the oven
 plate(g,1.22,.66,.04,.04,m.wood,[-1.68,2.47,-1.6]);atlas.attach(g,'wallmenu',1.1,.55,[-1.68,2.47,-1.578]);
 // Window display: three stepped wooden shelves, price tags on the front lip.
 const stand=group(g,'Window display shelves');
 for(const [i,{y,z}] of TIERS.entries()){
  box(stand,TIER_W,.045,.3,m.woodLight,[TIER_X,y,z]);
  box(stand,TIER_W,.06,.02,m.wood,[TIER_X,y+.02,z+.16]);
  for(const x of [TIER_X-TIER_W/2+.05,TIER_X+TIER_W/2-.05])box(stand,.05,y-.75,.05,m.wood,[x,(y+.75)/2,z+.1]);
 }
 atlas.attach(stand,'tags',2.6,.12,[TIER_X+.15,TIERS[0].y-.01,TIERS[0].z+.172]);
 // Open walkway beside the cabinet leads from the door to the oven.
 plate(g,1.45,1.03,.70,.05,m.woodLight,[1.70,.79,-.15]);
 box(g,1.55,.07,.80,m.cream,[1.70,1.33,-.15]);
 const till=plate(g,.4,.22,.33,.04,m.oven,[1.37,1.48,-.15]);till.rotation.x=-.15;
 return g;
}
function Plant(p,m,pos){const g=group(p,'Terracotta herb pot',pos);cylinder(g,.24,.17,.37,m.accent,[0,.19,0]);cylinder(g,.26,.26,.07,m.cream,[0,.38,0]);cylinder(g,.22,.22,.02,m.crust,[0,.42,0],false);for(let i=0;i<8;i++){const a=i*2.399;const x=Math.sin(a)*.25,z=Math.cos(a)*.22,y=.65+(i%3)*.12;rod(g,[0,.40,0],[x,y,z],.011,m.leaf);const l=sphere(g,[.10,.22,.05],i%2?m.leaf:m.leafLight,[x,y,z]);l.rotation.set(.3,a,-Math.sin(a)*.6);}return g;}
// A taller fig-like plant in a cream pot, so the entrance has two heights of green.
function TallPlant(p,m,pos){
 const g=group(p,'Fig tree in a cream pot',pos);
 cylinder(g,.25,.2,.46,m.cream,[0,.23,0]);cylinder(g,.27,.27,.06,m.stone,[0,.46,0]);cylinder(g,.23,.23,.02,m.soil,[0,.5,0],false);
 rod(g,[0,.5,0],[.03,1.35,0],.025,m.woodDark,8);
 for(let i=0;i<12;i++){const a=i*2.399,y=.85+i*.05;const x=Math.sin(a)*.2,z=Math.cos(a)*.18;rod(g,[.02,y-.08,0],[x,y,z],.008,m.woodDark,4);
  const l=sphere(g,[.09,.13,.035],i%3?m.leaf:m.leafLight,[x*1.15,y+.05,z*1.15]);l.rotation.set(.4,a,-Math.sin(a)*.5);}
 return g;
}
// A-frame board: two leaves hinged at the top, both feet on the ground.
export function ABoard(p,m,atlas,pos,turn=0,key='menu'){
 const g=group(p,'Today’s chalkboard',pos);g.rotation.y=turn;
 const L=.92,a=.17,H=L*Math.cos(a);
 for(const s of [1,-1]){
  const leaf=group(g,s>0?'Front leaf':'Back leaf',[0,H,0]);leaf.rotation.x=-s*a;
  plate(leaf,.66,L,.05,.04,m.wood,[0,-L/2,0]);
  if(s>0){plate(leaf,.57,.76,.012,.03,m.oven,[0,-L/2+.03,.03]);atlas.attach(leaf,key,.54,.72,[0,-L/2+.03,.038]);}
 }
 rod(g,[-.35,H,0],[.35,H,0],.016,m.brass,8);
 for(const x of [-.27,.27])rod(g,[x,H*.45,Math.sin(a)*L*.55],[x,H*.45,-Math.sin(a)*L*.55],.007,m.ink,4);
 return g;
}
function Chair(p,m,pos,turn){
 const g=group(p,'Wooden café chair',pos);g.rotation.y=turn;
 box(g,.42,.05,.42,m.woodLight,[0,.46,0]);
 for(const [x,z] of [[-.17,-.17],[.17,-.17],[-.17,.17],[.17,.17]])rod(g,[x,0,z],[x*.95,.44,z*.95],.02,m.wood,8);
 for(const x of [-.17,.17])rod(g,[x,.46,-.18],[x*1.05,1.0,-.22],.022,m.wood,8);
 for(const y of [.72,.9])box(g,.4,.07,.035,m.woodLight,[0,y,-.2]);
 box(g,.36,.03,.03,m.wood,[0,.22,.17],false);
 return g;
}
function Crate(p,m,atlas,pos,w=.6,h=.3,d=.42){
 const g=group(p,'Bread delivery crate',pos);
 box(g,w,h,d,m.wood,[0,h/2,0]);
 for(const y of [h*.3,h*.72])box(g,w+.012,.04,d+.012,m.woodLight,[0,y,0],false);
 atlas.attach(g,'crate',w*.55,h*.36,[0,h*.5,d/2+.008]);
 return g;
}
export function StreetDetails(root,m,atlas){
 const g=group(root,'Morning outside the bakery');
 const y0=GROUND;
 // Entrance: doormat on the landing, a tall fig and a herb pot, and the A-board clear of the swinging door.
 const mat=plate(g,.9,.5,.02,.04,m.accent,[-1.92,.25,2.05]);mat.rotation.x=-Math.PI/2;
 box(g,.78,.006,.06,m.cream,[-1.92,.262,2.05],false);
 TallPlant(g,m,[-3.3,y0,1.98]);
 Plant(g,m,[-3.25,y0,2.56]).scale.setScalar(.8);
 ABoard(g,m,atlas,[-2.95,y0,3.0],.3);
 // hanging wooden blade sign on the left pilaster
 const blade=group(g,'Hanging bread sign',[-2.98,2.75,1.75]);
 rod(blade,[0,0,0],[-.66,0,0],.016,m.ink,6);tube(blade,[[0,-.18,0],[-.1,-.06,0],[-.3,0,0]],.008,m.ink);
 for(const x of [-.12,-.5])rod(blade,[x,0,0],[x,-.12,0],.006,m.ink,4);
 plate(blade,.5,.2,.04,.04,m.wood,[-.31,-.22,0]);atlas.attach(blade,'blade',.44,.11,[-.31,-.22,.022]);
 // Right of the window: a little table with two chairs (one pulled out), coffee and a croissant.
 const table=group(g,'Little pickup table',[3.05,y0,2.62]);
 cylinder(table,.41,.41,.075,m.woodLight,[0,.755,0]);cylinder(table,.43,.43,.012,m.wood,[0,.72,0],false);
 for(const a of [0,2.094,4.188])rod(table,[Math.sin(a)*.32,0,Math.cos(a)*.32],[Math.sin(a)*.22,.73,Math.cos(a)*.22],.032,m.wood);
 cylinder(table,.09,.08,.012,m.cream,[-.24,.8,.18]);
 cylinder(table,.06,.045,.1,m.cream,[-.24,.855,.18]);ring(table,.035,.01,m.cream,[-.17,.86,.18]);cylinder(table,.05,.05,.008,m.crust,[-.24,.905,.18],false);
 cylinder(table,.13,.13,.01,m.cream,[.17,.798,.2]);const cr=Croissant(table,m,[.17,.84,.2],.12);cr.rotation.x=-Math.PI/2;
 const folded=box(table,.14,.012,.1,m.woodLight,[.3,.8,-.04]);folded.rotation.y=.4;
 Chair(g,m,[3.62,y0,2.5],-Math.PI/2+.1);
 Chair(g,m,[2.5,y0,3.0],Math.PI*.78);
 // Today's special on a small easel at the corner.
 const sp=group(g,'Today’s special stand',[3.5,y0,1.95]);sp.rotation.y=-.5;
 for(const x of [-.17,.17])rod(sp,[x,0,.08],[x*.6,.95,0],.018,m.wood,6);rod(sp,[0,0,-.18],[0,.9,0],.018,m.wood,6);
 box(sp,.42,.03,.08,m.wood,[0,.42,.05]);plate(sp,.42,.42,.03,.03,m.oven,[0,.66,.04]);atlas.attach(sp,'special',.38,.38,[0,.66,.058]);
 // Rattan basket of baguettes by the corner pilaster.
 const basket=group(g,'Baguette basket',[3.5,y0,1.25]);
 cylinder(basket,.22,.18,.38,m.wood,[0,.19,0]);for(const y of [.08,.18,.28,.37])ring(basket,.2+y*.06,.012,m.woodDark,[0,y,0]).rotation.x=Math.PI/2;
 for(let i=0;i<4;i++){const b=Baguette(basket,m,[-.09+i*.06,.62,(i%2?.05:-.05)],.6);b.rotation.z=(i-1.5)*.12;}
 // Right side: a stepped crate display of bread and paper bags, then the bench under the window.
 const rack=group(g,'Bread crate display',[3.4,y0,.15]);rack.rotation.y=Math.PI/2;
 box(rack,1.0,.34,.42,m.wood,[0,.17,0]);for(const y of [.1,.24])box(rack,1.01,.04,.43,m.woodLight,[0,y,0],false);
 box(rack,.9,.3,.32,m.wood,[0,.49,-.08]);
 for(const x of [-.3,0,.3]){const t=Toast(rack,m,[x,.48,.06],.36);t.rotation.x=-.5;}
 KraftBag(rack,m,atlas,[-.22,.64,-.08],.9);KraftBag(rack,m,atlas,[.05,.64,-.08],.9);
 const lb=group(rack,'Loaf basket',[.3,.64,-.08]);box(lb,.3,.12,.22,m.woodLight,[0,.06,0]);for(const x of [-.07,.07]){const c=Croissant(lb,m,[x,.16,0],.1);c.rotation.x=-Math.PI/2;}
 for(const z of [-.22,0,.22])plate(g,.49,1.12,.065,.05,m.woodLight,[3.20,.67,z-.65]).rotation.x=-Math.PI/2;
 for(const z of [-1.15,-.15])for(const x of [3.02,3.4])rod(g,[x,y0,z],[x,.65,z],.027,m.wood);
 const cushion=plate(g,.4,.5,.06,.06,m.pink,[3.22,.73,-.9]);cushion.rotation.x=-Math.PI/2;
 const paper=box(g,.28,.012,.36,m.paper,[3.25,.71,-.35]);paper.rotation.y=.3;
 // Back-right corner: stacked delivery crates and an umbrella stand by the downpipe.
 Crate(g,m,atlas,[3.42,y0,-1.82]);const top=Crate(g,m,atlas,[3.42,y0+.3,-1.82],.56,.26,.4);top.rotation.y=.12;
 for(const x of [-.12,.12]){const t=Toast(top,m,[x,.32,0],.34);t.rotation.x=-.3;}
 const um=group(g,'Umbrella stand',[3.1,y0,-1.38]);cylinder(um,.11,.1,.42,m.steel,[0,.21,0]);ring(um,.11,.01,m.oven,[0,.42,0]).rotation.x=Math.PI/2;
 for(const [x,c] of [[-.03,m.blue],[.04,m.accent]]){cylinder(um,.045,.012,.62,c,[x,.62,0],true,8);tube(um,[[x,.93,0],[x,1.0,0],[x+.06,1.02,0],[x+.08,.97,0]],.01,m.woodDark);}
 return g;
}
