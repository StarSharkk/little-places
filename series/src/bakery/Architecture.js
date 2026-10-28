import * as THREE from 'three';
import {group,box,plate,rod,tube,mesh,cylinder,sphere,shape,cached} from './primitives.js';
import {RooftopBreads} from './RooftopBreads.js';
// Façade zoning shared by every wall: stone skirting, cream wainscot, mint waist band, pale-yellow upper wall.
export const ZONE={skirt:[.26,.40],wainscot:[.40,1.06],band:[1.06,1.14],sill:1.21};
const mid=([a,b])=>(a+b)/2,span=([a,b])=>b-a;
// Dress a wall face in its local frame (local +z points outward, face at z=t).
function dress(g,m,len,t,{panels=0,x=0}={}){
 box(g,len,span(ZONE.skirt),.05,m.stone,[x,mid(ZONE.skirt),t+.025]);
 box(g,len-.02,span(ZONE.wainscot),.025,m.cream,[x,mid(ZONE.wainscot),t+.0125]);
 box(g,len+.02,span(ZONE.band),.05,m.trim,[x,mid(ZONE.band),t+.025]);
 box(g,len,.03,.035,m.cream,[x,ZONE.band[1]+.015,t+.018]);
 // recessed wainscot panels, framed by thin raised mouldings
 for(let i=0;i<panels;i++){const w=(len-.3)/panels-.16,px=x-len/2+.15+(i+.5)*((len-.3)/panels);plate(g,w,.42,.012,.03,m.paper,[px,mid(ZONE.wainscot),t+.031]);}
 // frieze under the cornice
 box(g,len,.08,.03,m.cream,[x,3.0,t+.015]);
}
// Raised rectangular frame on the upper wall (four thin mouldings).
function frame(g,m,cx,cy,w,h,t){for(const s of [-1,1]){box(g,w,.045,.03,m.cream,[cx,cy+s*h/2,t+.015]);box(g,.045,h,.03,m.cream,[cx+s*w/2,cy,t+.015]);}}
function wallFrame(parent,name,pos,ry){const g=group(parent,name,pos);g.rotation.y=ry;return g;}
// Corner pilaster: stone base, cream shaft with a sunk panel, mint necking, cream capital.
export function Pilaster(g,m,x,z){
 box(g,.34,.22,.34,m.stone,[x,.37,z]);box(g,.26,2.5,.26,m.cream,[x,1.73,z]);
 box(g,.28,.05,.28,m.trim,[x,2.99,z]);box(g,.36,.12,.36,m.cream,[x,3.08,z]);
 for(const [dx,dz] of [[0,.131],[.131,0],[0,-.131],[-.131,0]])box(g,dz?.12:.008,1.9,dz?.008:.12,m.paper,[x+dx,1.78,z+dz],false);
}
export function WallLamp(g,m,pos,out=.24){
 const l=group(g,'Vintage wall lamp',pos);
 plate(l,.12,.2,.03,.02,m.ink,[0,0,.015]);
 rod(l,[0,.05,.02],[0,.05,out],.016,m.ink,8);tube(l,[[0,-.06,.03],[0,-.02,.14],[0,.05,out-.02]],.01,m.ink);
 cylinder(l,.07,.05,.05,m.ink,[0,0,out],true,6);
 cylinder(l,.065,.065,.17,m.lamp,[0,-.11,out],false,6);
 for(let i=0;i<6;i++){const a=i/6*Math.PI*2;rod(l,[Math.cos(a)*.066,-.02,out+Math.sin(a)*.066],[Math.cos(a)*.066,-.2,out+Math.sin(a)*.066],.006,m.ink,4);}
 cylinder(l,.1,.06,.06,m.ink,[0,.05,out],true,6);sphere(l,[.02,.02,.02],m.ink,[0,.1,out]);
 return l;
}
export function Shell(root,m,atlas){
 const g=group(root,'Removable upper walls');
 // back wall: wainscot panels and two framed upper panels
 const back=wallFrame(g,'Back wall',[0,0,-1.7],Math.PI);
 box(back,5.8,2.92,.16,m.wall,[0,1.72,0]);dress(back,m,5.8,.08,{panels:4});
 for(const x of [-1.45,1.45])frame(back,m,x,2.15,1.9,1.1,.08);
 // left wall
 const left=wallFrame(g,'Left wall',[-2.82,0,0],-Math.PI/2);
 box(left,3.4,2.92,.16,m.wall,[0,1.72,0]);dress(left,m,3.4,.08,{panels:2});frame(left,m,0,2.15,2.4,1.1,.08);
 // right wall: a real opening for a wooden side window
 const right=wallFrame(g,'Right wall',[2.82,0,0],Math.PI/2);
 const S=ZONE.sill,H=2.55;
 box(right,3.4,S-.26,.16,m.wall,[0,(S+.26)/2,0]);box(right,3.4,3.18-H,.16,m.wall,[0,(H+3.18)/2,0]);
 for(const x of [-1.35,1.35])box(right,.7,H-S,.16,m.wall,[x,(S+H)/2,0]);
 dress(right,m,3.4,.08,{panels:3});
 SideWindow(right,m,S,H);
 const plaque=group(right,'Side bakery plaque',[0,2.9,.105]);plate(plaque,2.1,.3,.05,.05,m.cream);atlas.attach(plaque,'side',2.01,.26,[0,0,.03]);
 // front pier of the right wall: lamp over a hand-drawn bread poster
 WallLamp(right,m,[-1.35,2.42,.08]);
 plate(right,.46,.62,.03,.03,m.wood,[-1.35,1.62,.095]);atlas.attach(right,'poster',.4,.56,[-1.35,1.62,.112]);
 // rear pier: electricity meter with its conduit
 const meter=group(right,'Electricity meter',[1.35,1.62,.08]);
 plate(meter,.34,.46,.12,.04,m.steel,[0,0,.06]);plate(meter,.2,.12,.01,.02,m.ink,[0,.08,.125]);cylinder(meter,.03,.03,.02,m.ink,[0,-.08,.125],false).rotation.x=Math.PI/2;
 rod(meter,[.1,.23,.05],[.1,1.33,.05],.02,m.steel,8);
 // downpipe on the back-right corner with hopper head and shoe
 const pipe=group(g,'Rainwater downpipe',[3.02,0,-1.62]);
 box(pipe,.16,.16,.16,m.trim,[0,3.08,0]);rod(pipe,[0,3.0,0],[0,.4,0],.045,m.trim,10);tube(pipe,[[0,.42,0],[0,.27,.02],[0,.2,.12]],.045,m.trim);
 for(const y of [.9,1.8,2.7])box(pipe,.12,.04,.12,m.ink,[-.03,y,0],false);
 for(const s of [-1,1])Pilaster(g,m,s*2.84,-1.74);
 return g;
}
function SideWindow(g,m,S,H){
 const w=2.0,h=H-S,y=(S+H)/2,z=.03;
 // mint outer frame, cream sash bars, beads and sill
 for(const s of [-1,1])box(g,.09,h,.12,m.trim,[s*(w/2-.045),y,z]);
 box(g,w,.09,.12,m.trim,[0,H-.045,z]);box(g,w,.07,.12,m.trim,[0,S+.035,z]);
 for(const x of [-w/6,w/6])box(g,.06,h-.12,.1,m.cream,[x,y,z]);
 const tr=H-.42;box(g,w-.12,.06,.1,m.cream,[0,tr,z]);
 for(const x of [-w/3,0,w/3])box(g,.035,.33,.08,m.cream,[x,tr+.2,z],false);
 box(g,w-.1,h-.1,.012,m.glass,[0,y,-.01],false);
 for(const x of [-.65,.05,.7]){const s=box(g,.022,.6,.008,m.reflection,[x,S+.55,.0],false);s.rotation.z=-.2;}
 plate(g,w+.3,.07,.28,.03,m.cream,[0,S-.035,.14]);
 for(const x of [-.8,0,.8])box(g,.09,.1,.12,m.cream,[x,S-.12,.12]);
 // hood moulding with a keystone
 box(g,w+.3,.08,.18,m.cream,[0,H+.08,.09]);box(g,.16,.18,.12,m.stone,[0,H+.08,.11]);
 // two small pots on the sill
 for(const x of [-.78,.78]){const p=group(g,'Sill pot',[x,S,.16]);cylinder(p,.09,.07,.14,m.accent,[0,.07,0]);cylinder(p,.1,.1,.03,m.cream,[0,.14,0]);
  for(let i=0;i<5;i++){const a=i*1.26;sphere(p,[.06,.07,.06],i%2?m.leaf:m.leafLight,[Math.cos(a)*.06,.2+(i%2)*.04,Math.sin(a)*.06]);}
  sphere(p,[.035,.035,.035],m.pink,[.02,.27,.03]);}
}
// Hipped roof with a deep-yellow standing-seam finish, cream ridge and hip rolls, an oven chimney
// on the back slope and a small louvred lantern on the ridge: the bakery's roofline, not a prop.
const HIP={W:5.76,D:3.5,H:.9,eave:3.56};
function hipGeometry(W,D,H){
 const r=(W-D)/2,P=[[-W/2,0,D/2],[W/2,0,D/2],[W/2,0,-D/2],[-W/2,0,-D/2],[-r,H,0],[r,H,0]];
 const tris=[[0,1,5],[0,5,4],[2,3,4],[2,4,5],[1,2,5],[3,0,4],[0,3,2],[0,2,1]],pos=[];
 for(const t of tris)for(const k of t)pos.push(...P[k]);
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
 g.setAttribute('uv',new THREE.Float32BufferAttribute(new Array(pos.length/3*2).fill(0),2));g.computeVertexNormals();return g;
}
function Chimney(g,m,x,z){
 const c=group(g,'Oven chimney',[x,0,z]);
 box(c,.44,1.32,.44,m.accent,[0,4.26,0]);box(c,.5,.05,.5,m.cream,[0,4.55,0]);
 for(const y of [3.9,4.15,4.42,4.72])for(const s of [-1,1]){box(c,.445,.012,.012,m.roofLine,[0,y,s*.221],false);box(c,.012,.012,.445,m.roofLine,[s*.221,y,0],false);}
 box(c,.56,.08,.56,m.cream,[0,4.96,0]);for(const dx of [-.11,.11])cylinder(c,.06,.075,.2,m.crust,[dx,5.1,0],true,12);
 return c;
}
export function Roof(root,m,atlas){
 const g=group(root,'Lift-off hipped roof');
 // layered cornice: mint fillet, cream corona and the eave slab the hip roof sits on
 const fillet=plate(g,6.0,3.78,.06,.2,m.trim,[0,3.15,0]);fillet.rotation.x=-Math.PI/2;
 const trim=plate(g,6.08,3.85,.16,.22,m.cream,[0,3.25,0]);trim.rotation.x=-Math.PI/2;
 const top=plate(g,6.04,3.8,.24,.24,m.roof,[0,3.44,0]);top.rotation.x=-Math.PI/2;
 // dentils along the visible side and back
 for(let z=-1.55;z<=1.56;z+=.31)box(g,.07,.06,.12,m.cream,[2.93,3.09,z]);
 for(let x=-2.7;x<=2.71;x+=.3)box(g,.12,.06,.07,m.cream,[x,3.09,-1.81]);
 const {W,D,H,eave}=HIP,r=(W-D)/2;
 mesh(g,cached('hip-roof',()=>hipGeometry(W,D,H)),m.roof,[0,eave,0]);
 // cream eave band where the slopes start
 for(const s of [-1,1]){box(g,W+.1,.07,.07,m.cream,[0,eave+.035,s*(D/2+.01)]);box(g,.07,.07,D+.1,m.cream,[s*(W/2+.01),eave+.035,0]);}
 // standing seams follow the fall line of each slope, ending on the ridge or the hips
 const n=new THREE.Vector3(),k=H/(D/2),off=.012;
 for(let x=-W/2+.28;x<W/2-.1;x+=.4){const s=Math.min(1,(W/2-Math.abs(x))/(W/2-r));for(const sz of [-1,1]){n.set(0,1,sz*k).normalize();
  rod(g,[x,eave+n.y*off,sz*D/2+n.z*off],[x,eave+H*s+n.y*off,sz*D/2*(1-s)+n.z*off],.008,m.roofLine,4);}}
 const kx=H/(W/2-r);
 for(let z=-D/2+.3;z<D/2-.2;z+=.4){const s=(D/2-Math.abs(z))/(D/2);for(const sx of [-1,1]){n.set(sx*kx,1,0).normalize();
  rod(g,[sx*W/2+n.x*off,eave+n.y*off,z],[sx*(W/2-s*(W/2-r))+n.x*off,eave+H*s+n.y*off,z],.008,m.roofLine,4);}}
 // ridge and hip rolls in the deeper roof tone, like capping tiles
 rod(g,[-r-.02,eave+H+.015,0],[r+.02,eave+H+.015,0],.03,m.roofLine,10);
 for(const sx of [-1,1])for(const sz of [-1,1])rod(g,[sx*W/2,eave+.025,sz*D/2],[sx*r,eave+H+.015,0],.026,m.roofLine,10);
 for(const sx of [-1,1])sphere(g,[.05,.05,.05],m.roofLine,[sx*(r+.02),eave+H+.015,0]);
 Chimney(g,m,-1.7,-.95);
 const breads=RooftopBreads(g,m);
 g.userData.rooftopBreads=breads.userData;
 return g;
}
export function Awning(root,m){
 const g=group(root,'Scalloped striped canopy');
 const width=5.78,count=18,sw=width/count;
 // Each stripe follows a softly bowed profile, ending in its own scallop.
 const profile=new THREE.Shape();profile.moveTo(1.75,2.93);profile.bezierCurveTo(2.05,2.93,2.28,2.76,2.48,2.61);profile.lineTo(2.48,2.56);profile.bezierCurveTo(2.28,2.71,2.05,2.88,1.75,2.88);profile.closePath();
 for(let i=0;i<count;i++){
  const geo=new THREE.ExtrudeGeometry(profile,{depth:sw,steps:1,bevelEnabled:false,curveSegments:10});
  // Shape XY=(depth,height), extrusion Z becomes horizontal X.
  const o=mesh(g,geo,i%2?m.cream:m.accent);o.rotation.y=-Math.PI/2;o.position.x=-width/2+(i+1)*sw;
  plate(g,sw,.23,.04,.09,i%2?m.cream:m.accent,[-width/2+(i+.5)*sw,2.49,2.49]);
 }
 // wall batten, closed side cheeks and five wrought arms
 box(g,5.86,.1,.08,m.trim,[0,2.97,1.79]);
 const cheek=new THREE.Shape();cheek.moveTo(-1.75,2.92);cheek.lineTo(-2.46,2.6);cheek.lineTo(-2.46,2.5);cheek.lineTo(-1.75,2.5);cheek.closePath();
 for(const s of [-1,1]){const c=shape(g,cheek,.03,m.accent,[s*2.905,0,0]);c.rotation.y=Math.PI/2;}
 for(const x of [-2.72,-1.36,0,1.36,2.72]){rod(g,[x,2.32,1.8],[x,2.6,2.44],.018,m.ink,8);tube(g,[[x,2.38,1.82],[x,2.47,1.95],[x,2.6,2.0]],.009,m.ink);}
 return g;
}
export function Door(root,m,atlas){
 const x=-1.92,z=1.80;
 for(const side of [-1,1])plate(root,.12,2.48,.22,.035,m.cream,[x+side*.64,1.5,z]);
 plate(root,1.40,.14,.24,.035,m.cream,[x,2.72,z]);
 box(root,1.3,.04,.3,m.stone,[x,.29,z+.02]);
 const hinge=group(root,'Bakery door hinge',[x-.55,.29,z+.04]);
 const leaf=group(hinge,'Open the bakery door');leaf.userData.action='bakeryDoor';
 for(const xx of [0,1.1])box(leaf,.075,2.28,.11,m.trim,[xx,1.14,0]);
 for(const y of [.05,.54,2.26])box(leaf,1.1,.09,.11,m.trim,[.55,y,0]);
 plate(leaf,1.04,.41,.08,.04,m.trim,[.55,.28,0]);
 // raised lower panel with a cream bead, brass kick plate
 for(const s of [-1,1]){box(leaf,.8,.025,.02,m.cream,[.55,.28+s*.15,.05],false);box(leaf,.025,.3,.02,m.cream,[.55+s*.4,.28,.05],false);}
 box(leaf,1.0,.12,.012,m.brass,[.55,.13,.058]);
 box(leaf,1.02,1.63,.012,m.glass,[.55,1.39,0],false);
 // glazing bars divide the glass into four lights
 box(leaf,.04,1.62,.06,m.trim,[.55,1.39,0]);box(leaf,1.02,.04,.06,m.trim,[.55,1.86,0]);
 const s=box(leaf,.022,.55,.008,m.reflection,[.3,1.0,.035],false);s.rotation.z=-.2;
 // brass lever on a backplate, and a little suspended OPEN card
 plate(leaf,.1,.34,.02,.02,m.brass,[.91,1.02,.065]);
 rod(leaf,[.91,.88,.12],[.91,1.15,.12],.026,m.brass,10);
 rod(leaf,[.91,.89,.04],[.91,.89,.12],.018,m.brass,8);rod(leaf,[.91,1.14,.04],[.91,1.14,.12],.018,m.brass,8);
 tube(leaf,[[.32,1.49,.075],[.55,1.72,.075],[.78,1.49,.075]],.008,m.ink);
 plate(leaf,.56,.29,.028,.025,m.cream,[.55,1.35,.08]);atlas.attach(leaf,'open',.52,.26,[.55,1.35,.097]);
 return {hinge,leaf};
}
export function Storefront(root,m,atlas){
 // Actual piers and lintels leave the entry and glazing openings hollow.
 const piers=[[-2.73,.32],[-1.19,.25],[2.72,.33]];
 for(const [x,w] of piers){box(root,w,2.9,.20,m.wall,[x,1.72,1.71]);const f=group(root,'Pier dressing',[x,0,1.71]);dress(f,m,w+.02,.1);}
 box(root,5.8,.36,.20,m.wall,[0,3.01,1.71]);
 for(const s of [-1,1])Pilaster(root,m,s*2.84,1.75);
 const display=group(root,'Projecting pastry bay',[0,0,.32]);
 plate(display,3.68,.47,.50,.06,m.cream,[.78,.51,1.62]);
 for(const x of [-.96,.2,1.35,2.51])box(display,.08,1.85,.13,m.trim,[x,1.64,1.84]);
 for(const y of [.72,2.57])box(display,3.53,.08,.14,m.trim,[.77,y,1.84]);
 // transom rail and small upper lights, cream glazing beads around each lower pane
 box(display,3.5,.06,.12,m.trim,[.77,2.17,1.84]);
 for(const x of [-.38,.775,1.93])box(display,.035,.36,.08,m.cream,[x,2.37,1.84],false);
 for(const [x0,x1] of [[-.92,.16],[.24,1.31],[1.39,2.47]]){const cx=(x0+x1)/2,w=x1-x0;
  for(const y of [.79,2.11])box(display,w,.025,.04,m.cream,[cx,y,1.875],false);
  for(const xx of [x0+.012,x1-.012])box(display,.025,1.32,.04,m.cream,[xx,1.45,1.875],false);}
 const glass=group(display,'Window glazing');
 box(glass,3.44,1.75,.012,m.glass,[.77,1.65,1.85],false);
 for(const x of [-.61,.50,1.65]){const s=box(glass,.025,.75,.009,m.reflection,[x,1.88,1.86],false);s.rotation.z=-.20;}
 plate(display,3.78,.11,.37,.05,m.cream,[.77,.69,1.88]);
 for(const x of [-.75,.2,1.35,2.3])box(display,.1,.12,.14,m.cream,[x,.58,2.0]);
 box(display,3.72,.08,.56,m.cream,[.77,2.65,1.66]);
 // fascia: a mint-rimmed cream board that reads BAKERY
 plate(root,5.44,.56,.1,.07,m.trim,[0,3.01,1.85]);
 plate(root,5.34,.48,.13,.06,m.cream,[0,3.01,1.87]);atlas.attach(root,'brand',5.14,.43,[0,3.01,1.942]);
 // Subtle panel relief and a short brass foot rail.
 for(const x of [-.37,.76,1.89])plate(display,.99,.28,.018,.035,m.wall,[x,.49,1.886]);
 rod(display,[-.94,.32,2.03],[2.5,.32,2.03],.018,m.brass,10);
 for(const x of [-.85,2.42])rod(display,[x,.28,1.9],[x,.32,2.03],.018,m.brass,10);
 for(const x of [-.99,2.54])box(display,.045,1.85,.43,m.trim,[x,1.64,1.66]);
 // the entrance pier: house number, opening hours, a bell button and a shop bell on a bracket
 const p=group(root,'Entrance pier details',[-1.19,0,1.81]);
 plate(p,.2,.11,.02,.02,m.cream,[0,2.36,.01]);atlas.attach(p,'number',.18,.09,[0,2.36,.022]);
 plate(p,.23,.19,.02,.02,m.cream,[0,1.65,.01]);atlas.attach(p,'hours',.21,.17,[0,1.65,.022]);
 plate(p,.07,.11,.02,.015,m.brass,[0,1.3,.01]);cylinder(p,.018,.018,.02,m.cream,[0,1.3,.025],false,10).rotation.x=Math.PI/2;
 rod(p,[0,2.62,.0],[0,2.62,.16],.012,m.ink,6);tube(p,[[0,2.55,.0],[0,2.58,.08],[0,2.62,.14]],.007,m.ink);
 cylinder(p,.012,.055,.07,m.brass,[0,2.55,.16],true,12);sphere(p,[.014,.014,.014],m.brass,[0,2.5,.16]);
 // front-left lamp beside the door
 WallLamp(root,m,[-2.73,2.42,1.81]);
 const door=Door(root,m,atlas);Awning(root,m);
 return {door,glass};
}
