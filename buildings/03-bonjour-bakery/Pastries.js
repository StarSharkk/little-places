import * as THREE from 'three';
import { group,mesh,box,plate,sphere,ring,tube,cylinder,cached } from './primitives.js';
// Three stepped shelves inside the projecting window, front (low) to back (high). Boards live in
// Details.Interior; the goods below are a separate, toggleable group.
export const TIERS=[{y:.86,z:2.0},{y:1.2,z:1.72},{y:1.54,z:1.44}];
export const TIER_X=.8,TIER_W=3.3,TIER_TOP=.0225;
// A tapered, curved pastry with real volume rather than overlapping spheres.
function croissantPoint(t,phi){const a=-1.45+2.90*t,r=.025+.31*Math.pow(Math.sin(Math.PI*t),.7);return [Math.sin(a)*.94+Math.sin(a)*r*Math.cos(phi),Math.cos(a)*.96+r*Math.cos(a)*Math.cos(phi),r*1.12*Math.sin(phi)];}
export function Croissant(p,m,pos=[0,0,0],scale=1){
 const g=group(p,'Butter croissant',pos);g.scale.setScalar(scale);
 const geo=cached('croissant',()=>{const vertices=[],indices=[],uv=[],n=48,k=16;for(let i=0;i<=n;i++)for(let j=0;j<=k;j++){vertices.push(...croissantPoint(i/n,j/k*Math.PI*2));uv.push(i/n,j/k);}for(let i=0;i<n;i++)for(let j=0;j<k;j++){const a=i*(k+1)+j,b=a+k+1;indices.push(a,b,a+1,b,b+1,a+1);}const q=new THREE.BufferGeometry();q.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));q.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));q.setIndex(indices);q.computeVertexNormals();return q;});
 mesh(g,geo,m.bread,[0,0,0],false);
 // Fine perimeter and rolled seams are drawn deliberately, not triangulation.
 for(const phi of [0,Math.PI])tube(g,Array.from({length:35},(_,i)=>croissantPoint(i/34,phi)),.009,m.ink);
 // small window croissants keep three seams; full-size ones keep all six
 for(const t of scale<.2?[.27,.5,.73]:[.14,.27,.4,.6,.73,.86]){const pts=Array.from({length:19},(_,i)=>croissantPoint(t,i/18*Math.PI));tube(g,pts,.012,m.crust);}
 return g;
}
export function Baguette(p,m,pos=[0,0,0],scale=1){const g=group(p,'Baguette',pos);g.scale.setScalar(scale);plate(g,.26,1.17,.22,.13,m.bread);for(let i=0;i<5;i++){const s=plate(g,.19,.035,.008,.016,m.crumb,[0,-.38+i*.19,.114]);s.rotation.z=-.5;s.userData.outline=false;}return g;}
export function Toast(p,m,pos=[0,0,0],scale=1){const g=group(p,'Milk bread',pos);g.scale.setScalar(scale);plate(g,.58,.57,.29,.17,m.crust);plate(g,.47,.46,.012,.14,m.crumb,[0,0,.153]).userData.outline=false;return g;}
export function Bagel(p,m,pos=[0,0,0],scale=1){const g=group(p,'Sesame bagel',pos);g.scale.setScalar(scale);ring(g,.20,.09,m.bread);ring(g,.29,.007,m.ink);ring(g,.11,.007,m.crust);for(let i=0;i<11;i++){const a=i*2.399,r=.19+Math.sin(i)*.025;const seed=sphere(g,[.012,.026,.008],m.crumb,[Math.cos(a)*r,Math.sin(a)*r,.088]);seed.rotation.z=a;}return g;}
// Lying flat: dough ring, a glaze ring on top and a few sprinkles.
export function Donut(p,m,pos=[0,0,0],glaze='pink'){
 const g=group(p,'Glazed donut',pos);
 const d=ring(g,.075,.04,m.bread);d.rotation.x=-Math.PI/2;
 const i=ring(g,.075,.034,m[glaze]);i.rotation.x=-Math.PI/2;i.position.y=.014;i.scale.set(1,1,.8);
 const o=ring(g,.118,.005,m.ink);o.rotation.x=-Math.PI/2;
 for(let k=0;k<6;k++){const a=k*1.05;const s=box(g,.018,.006,.006,[m.cream,m.blue,m.trim][k%3],[Math.cos(a)*.075,.05,Math.sin(a)*.075],false);s.rotation.y=a*2;}
 return g;
}
export function Cupcake(p,m,pos=[0,0,0],liner='pink'){
 const g=group(p,'Cupcake',pos);
 cylinder(g,.065,.05,.08,m[liner],[0,.04,0],true,14);
 for(let k=0;k<3;k++)sphere(g,[.07-k*.02,.035,.07-k*.02],m.cream,[0,.1+k*.035,0]);
 sphere(g,[.022,.022,.022],m.berry,[0,.2,0]);
 return g;
}
export function MiniCake(p,m,pos=[0,0,0]){
 const g=group(p,'Little strawberry cake on a stand',pos);
 cylinder(g,.07,.1,.02,m.cream,[0,.01,0],true,20);cylinder(g,.025,.025,.12,m.cream,[0,.08,0],false,10);cylinder(g,.2,.2,.02,m.cream,[0,.15,0],true,28);
 cylinder(g,.15,.15,.13,m.cream,[0,.225,0],true,28);cylinder(g,.152,.152,.03,m.pink,[0,.22,0],false,28);
 for(let k=0;k<5;k++){const a=k/5*Math.PI*2;sphere(g,[.026,.032,.026],m.berry,[Math.cos(a)*.1,.31,Math.sin(a)*.1]);sphere(g,[.024,.018,.024],m.cream,[Math.cos(a+.63)*.11,.3,Math.sin(a+.63)*.11]);}
 return g;
}
export function KraftBag(p,m,atlas,pos=[0,0,0],scale=1){
 const g=group(p,'Kraft bag',pos);g.scale.setScalar(scale);
 box(g,.2,.27,.12,m.woodLight,[0,.135,0]);const f=box(g,.21,.05,.13,m.paper,[0,.28,0]);f.rotation.x=.1;
 atlas.attach(g,'bag',.16,.16,[0,.13,.061]);
 return g;
}
function Basket(p,m,pos,w=.5){const g=group(p,'Bread basket',pos);box(g,w,.14,.26,m.wood,[0,.07,0]);for(const y of [.04,.1])box(g,w+.01,.025,.27,m.woodDark,[0,y,0],false);return g;}
export function PastryDisplay(parent,m,atlas){
 const g=group(parent,'Fresh pastry collection');
 const top=t=>TIERS[t].y+TIER_TOP,z=t=>TIERS[t].z;
 // front tier: croissants, donuts, cupcakes, all facing the glass
 for(const [i,x] of [-.6,-.22,.16].entries()){const o=Croissant(g,m,[x,top(0)+.035,z(0)+.02],.17);o.rotation.x=-Math.PI/2;o.rotation.z=i%2?.3:-.2;}
 [.62,.9,1.18].forEach((x,i)=>Donut(g,m,[x,top(0)+.04,z(0)+(i%2?-.04:.04)],['pink','choc','pink'][i]));
 [1.62,1.86,2.1].forEach((x,i)=>Cupcake(g,m,[x,top(0),z(0)],['pink','blue','trim'][i]));
 // middle tier: bagels on a plate, a little strawberry cake on a stand, toast and kraft bags
 cylinder(g,.22,.2,.02,m.cream,[-.45,top(1)+.01,z(1)],true,24);
 for(const dx of [-.07,.08]){const b=Bagel(g,m,[-.45+dx,top(1)+.06,z(1)+dx*.4],.4);b.rotation.x=-Math.PI/2;}
 Toast(g,m,[.15,top(1)+.13,z(1)],.45);
 MiniCake(g,m,[.82,top(1),z(1)]);
 KraftBag(g,m,atlas,[1.48,top(1),z(1)]);KraftBag(g,m,atlas,[1.72,top(1),z(1)-.03],.9);
 Toast(g,m,[2.2,top(1)+.13,z(1)],.45);
 // back tier: a basket of standing baguettes, loaves, more croissants
 const bb=Basket(g,m,[-.45,top(2),z(2)],.42);
 for(let i=0;i<4;i++){const b=Baguette(bb,m,[-.15+i*.1,.38,0],.42);b.rotation.z=(i-1.5)*.08;}
 for(const x of [.25,.75]){const t=Toast(g,m,[x,top(2)+.13,z(2)],.45);t.rotation.y=.2;}
 Basket(g,m,[1.4,top(2),z(2)],.5);
 for(const dx of [-.12,.12]){const o=Croissant(g,m,[1.4+dx,top(2)+.13,z(2)],.15);o.rotation.x=-Math.PI/2;}
 for(const [i,x] of [1.95,2.2].entries())Donut(g,m,[x,top(2)+.04,z(2)],i?'pink':'choc');
 // A tidy rear rack of baked loaves; visible through the cutaway.
 for(let i=0;i<5;i++){Toast(g,m,[-.25+i*.51,1.05,-1.25],.67);const b=Baguette(g,m,[-.25+i*.51,1.85,-1.25],.64);b.rotation.z=.10;}
 return g;
}
