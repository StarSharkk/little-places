import * as THREE from 'three';
export const themes=[
 {wall:'#F4D477',accent:'#EF745F',roof:'#F6C445',trim:'#9AD5B6'},
 {wall:'#B9DECA',accent:'#83B99B',roof:'#9AD5B6',trim:'#EF745F'},
 {wall:'#F1CDD9',accent:'#DA8AA8',roof:'#EFA8C4',trim:'#9AD5B6'},
 {wall:'#C7D9ED',accent:'#729AC9',roof:'#91B7EB',trim:'#F6C445'},
 {wall:'#F0B29D',accent:'#D86651',roof:'#EF745F',trim:'#9AD5B6'},
];
export function createMaterials(){
 const gradient=new THREE.DataTexture(new Uint8Array([185,222,255]),3,1,THREE.RedFormat);gradient.minFilter=gradient.magFilter=THREE.NearestFilter;gradient.needsUpdate=true;
 const colours={...themes[0],cream:'#FFF8E7',paper:'#F7F3E9',bread:'#EAB45C',crust:'#BF7439',crumb:'#FFE3A3',wood:'#C39564',woodLight:'#E1BE8C',woodDark:'#8F6A48',leaf:'#75AC8C',leafLight:'#A4CEA3',pink:'#EFA8C4',blue:'#91B7EB',tile:'#E7DBC2',oven:'#52686B',steel:'#CDCDBA',
  // shared with the café forecourt so the three bases read as one set
  roofLine:'#C99A30',paving:'#E7DEC9',joint:'#67574B',brass:'#D6A34B',berry:'#E65D57',choc:'#8A5A3C',stone:'#D9CCB0',soil:'#6A4B3B'};
 const m=Object.fromEntries(Object.entries(colours).map(([key,color])=>[key,new THREE.MeshToonMaterial({color,gradientMap:gradient})]));
 m.ink=new THREE.MeshBasicMaterial({color:'#302B26'});m.chalk=new THREE.MeshBasicMaterial({color:'#F7F3E9'});
 m.glass=new THREE.MeshBasicMaterial({color:'#B4DEDE',transparent:true,opacity:.13,depthWrite:false,side:THREE.DoubleSide});
 m.reflection=new THREE.MeshBasicMaterial({color:'#FFFFFF',transparent:true,opacity:.48,depthWrite:false});
 m.lamp=new THREE.MeshBasicMaterial({color:'#FBE7A6'});
 return m;
}
