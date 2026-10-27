import * as THREE from 'three';
const cache=new Map();
export const cached=(key,make)=>{if(!cache.has(key))cache.set(key,make());return cache.get(key);};
export function group(parent,name,pos=[0,0,0]){const g=new THREE.Group();g.name=name;g.position.set(...pos);parent.add(g);return g;}
export function mesh(parent,geo,mat,pos=[0,0,0],outline=true){const m=new THREE.Mesh(geo,mat);m.position.set(...pos);m.userData.outline=outline;parent.add(m);return m;}
export function box(p,w,h,d,m,pos=[0,0,0],outline=true){return mesh(p,cached(`box:${w}:${h}:${d}`,()=>new THREE.BoxGeometry(w,h,d)),m,pos,outline);}
export function rounded(w,h,r){const s=new THREE.Shape(),x=-w/2,y=-h/2;s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s;}
export function plate(p,w,h,d,r,m,pos=[0,0,0]){const geo=cached(`plate:${w}:${h}:${d}:${r}`,()=>{const g=new THREE.ExtrudeGeometry(rounded(w,h,r),{depth:d,bevelEnabled:false,curveSegments:12,steps:1});g.translate(0,0,-d/2);return g;});return mesh(p,geo,m,pos);}
export function cylinder(p,rt,rb,h,m,pos=[0,0,0],outline=true,seg=24){return mesh(p,cached(`c:${rt}:${rb}:${h}:${seg}`,()=>new THREE.CylinderGeometry(rt,rb,h,seg)),m,pos,outline);}
export function rod(p,a,b,r,m,seg=24){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b);const q=cylinder(p,r,r,av.distanceTo(bv),m,av.clone().add(bv).multiplyScalar(.5).toArray(),false,seg);q.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),bv.sub(av).normalize());return q;}
export function tube(p,points,r,m,closed=false){const c=new THREE.CatmullRomCurve3(points.map(v=>new THREE.Vector3(...v)),closed);return mesh(p,new THREE.TubeGeometry(c,Math.max(12,points.length*2),r,6,closed),m,[0,0,0],false);}
// Tiny spheres (seeds, sprinkles, leaves) don't need 768 triangles each: pick the tessellation by size.
export function sphere(p,scale,m,pos=[0,0,0]){const r=Math.max(...scale),[w,h]=r<.05?[8,6]:r<.16?[14,10]:[24,16];const o=mesh(p,cached(`sphere:${w}`,()=>new THREE.SphereGeometry(1,w,h)),m,pos,false);o.scale.set(...scale);return o;}
export function ring(p,r,t,m,pos=[0,0,0]){return mesh(p,cached(`ring:${r}:${t}`,()=>new THREE.TorusGeometry(r,t,10,40)),m,pos,false);}
// Extruded outline shape, centred on its depth (used for triangular cheeks and window beads).
export function shape(p,s,d,m,pos=[0,0,0],outline=true){const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false,curveSegments:12,steps:1});g.translate(0,0,-d/2);return mesh(p,g,m,pos,outline);}
// The collection's illustrated ground: a paved slab, a lower trim course, a ring of curb stones and
// restrained expansion joints — the same vocabulary as the café forecourt.
export function PavedBase(p,m,{w,d,cx=0,cz=0,top=.155}){
 const g=group(p,'Paved forecourt');
 box(g,w,.15,d,m.paving,[cx,top-.075,cz]);
 box(g,w+.1,.1,d+.1,m.cream,[cx,top-.2,cz]);
 const sx=.57,sz=.55,y=top-.025;
 for(let x=cx-w/2+.3;x<=cx+w/2-.29;x+=sx){box(g,.52,.1,.27,m.cream,[x,y,cz+d/2-.135]);box(g,.52,.1,.27,m.cream,[x,y,cz-d/2+.135]);}
 for(let z=cz-d/2+.55;z<cz+d/2-.4;z+=sz){box(g,.25,.1,.5,m.cream,[cx+w/2-.125,y,z]);box(g,.25,.1,.5,m.cream,[cx-w/2+.125,y,z]);}
 for(let z=cz-d/2+.75;z<cz+d/2-.3;z+=.9)rod(g,[cx-w/2+.27,top+.003,z],[cx+w/2-.27,top+.003,z],.004,m.joint,4);
 for(let x=cx-w/2+.8;x<cx+w/2-.3;x+=1.3)rod(g,[x,top+.003,cz-d/2+.27],[x,top+.003,cz+d/2-.27],.004,m.joint,4);
 return g;
}
