import * as THREE from 'three';
import {group,box,cyl,mesh,cached} from './primitives.js';

function capsule(parent,m,pos,colour,glass) {
  const r=.044;
  const lower=cached('capsule-lower',()=>new THREE.SphereGeometry(r,10,5,0,Math.PI*2,Math.PI/2,Math.PI/2));
  const upper=cached('capsule-upper',()=>new THREE.SphereGeometry(r,10,5,0,Math.PI*2,0,Math.PI/2));
  mesh(parent,lower,colour,pos,false);mesh(parent,upper,glass,pos,false);
  const ring=mesh(parent,cached('capsule-seam',()=>new THREE.TorusGeometry(r,.0025,4,12)),m.ink,pos,false);
  ring.rotation.x=Math.PI/2;
}

export function CapsuleMachine(parent,m,atlas,{pos=[0,0,0],colour=m.red,art='capsuleCats',glass,capGlass,index=0}={}) {
  const g=group(parent,pos,0,`Capsule machine ${index+1}`);
  g.userData.kind='capsule-machine';g.userData.collection=art;
  box(g,.475,.35,.5,colour,[0,.255,0]);
  box(g,.49,.07,.54,m.trim,[0,.048,0]);
  box(g,.48,.055,.53,m.trim,[0,.448,0]);
  box(g,.49,.07,.54,colour,[0,.84,0]);
  // A recessed illustrated card and real capsules sit behind clear front/side glazing.
  box(g,.46,.35,.035,m.trim,[0,.635,-.232]);
  atlas.attach(g,art,.405,.285,[0,.638,-.211]);
  const front=mesh(g,cached('gacha-glass-front',()=>new THREE.PlaneGeometry(.436,.341)),glass,[0,.635,.259],false);
  for(const side of [-1,1]) {
    const panel=mesh(g,cached('gacha-glass-side',()=>new THREE.PlaneGeometry(.48,.341)),glass,[side*.231,.635,.005],false);
    panel.rotation.y=side*Math.PI/2;
    box(g,.018,.35,.018,m.trim,[side*.229,.635,.251]);
  }
  const colours=[m.red,m.yellow,m.green,m.blue];
  const layout=[[-.14,.51,.14],[-.045,.51,.18],[.05,.51,.15],[.14,.51,.18],[-.12,.59,.13],[-.02,.59,.18],[.09,.59,.14],[.005,.675,.13]];
  layout.forEach((p,i)=>capsule(g,m,p,colours[(i+index)%4],capGlass));
  // Coin slot, circular crank and retrieval flap are separate solids.
  box(g,.095,.13,.018,m.steel,[.145,.3,.266]);
  box(g,.054,.009,.008,m.ink,[.145,.332,.28],false);
  const hub=cyl(g,.067,.067,.045,m.trim,[-.045,.29,.283],20);hub.rotation.x=Math.PI/2;
  const rim=cyl(g,.076,.076,.012,m.ink,[-.045,.29,.267],20);rim.rotation.x=Math.PI/2;
  box(g,.151,.033,.04,m.steel,[-.045,.29,.316]);
  box(g,.234,.093,.016,m.ink,[0,.125,.261]);
  box(g,.196,.057,.018,m.steel,[0,.113,.274]);
  box(g,.228,.017,.05,m.trim,[0,.08,.283]);
  atlas.attach(g,'gachaLabel',.405,.063,[0,.84,.282]);
  return g;
}

export function CapsuleBank(parent,m,atlas,{pos=[0,0,0],rotation=0}={}) {
  const g=group(parent,pos,rotation,'Four capsule toy machines');
  const glass=new THREE.MeshBasicMaterial({color:'#E8F1FA',transparent:true,opacity:.12,depthWrite:false,side:THREE.DoubleSide});
  const capGlass=new THREE.MeshBasicMaterial({color:'#F7F3E9',transparent:true,opacity:.7,depthWrite:false});
  box(g,1.04,.1,.61,m.steel,[0,.05,0]);
  const collections=['capsuleCats','capsuleBakery','capsulePlants','capsuleRetro'];
  const colours=[m.red,m.blue,m.yellow,m.green];
  for(let i=0;i<4;i++) CapsuleMachine(g,m,atlas,{pos:[i%2===0?-.253:.253,.1+Math.floor(i/2)*.9,0],colour:colours[i],art:collections[i],glass,capGlass,index:i});
  box(g,1.05,.045,.6,m.trim,[0,1.9,0]);
  g.userData.machineCount=4;
  return g;
}
