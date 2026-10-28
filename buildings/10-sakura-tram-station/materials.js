import * as THREE from 'three';
import { createHullMaterial } from '../shared/outline.js';

export const themes=[
 {wall:'#F3CF76',roof:'#D97755',frame:'#735743',canopy:'#A2CDB6',tramCream:'#F6E3AF',tramGreen:'#F6C445',tramAccent:'#DE8265',ticketBody:'#F3D994'},
 {wall:'#E6EEE0',roof:'#669783',frame:'#466B5B',canopy:'#C7D9AE',tramCream:'#F4E7C7',tramGreen:'#688E79',tramAccent:'#D9AF61',ticketBody:'#E7D7A1'},
 {wall:'#F7E8E3',roof:'#C88592',frame:'#7F6264',canopy:'#AFCDBD',tramCream:'#F7E5CC',tramGreen:'#B77A8D',tramAccent:'#788C86',ticketBody:'#F0D8AB'},
 {wall:'#E8EDF1',roof:'#7898B5',frame:'#506E80',canopy:'#B8D8D3',tramCream:'#F2E6C9',tramGreen:'#7299B0',tramAccent:'#D49B6B',ticketBody:'#EDDCA4'},
 {wall:'#F3E2D0',roof:'#C97254',frame:'#5A7564',canopy:'#B8C99F',tramCream:'#F6DBB5',tramGreen:'#B76D55',tramAccent:'#689887',ticketBody:'#EFCB89'},
];
export function createMaterials(){
 const gradient=new THREE.DataTexture(new Uint8Array([185,222,255]),3,1,THREE.RedFormat);
 gradient.minFilter=gradient.magFilter=THREE.NearestFilter;gradient.needsUpdate=true;
 const tokens={...themes[0],cream:'#F6EDD7',stone:'#E3D6BC',paving:'#FBF7EB',joint:'#D8CBA9',wood:'#BC8F65',woodLight:'#DDBA8E',walnut:'#735743',brass:'#D6A34B',iron:'#34453F',steel:'#ACB9B2',steelDark:'#58635C',chrome:'#D8DFD9',tramGreen:themes[0].tramGreen,tramCream:themes[0].tramCream,seat:'#B97C54',tyre:'#343C38',gravel:'#B7AB96',sleeper:'#826B54',yellow:'#EDC65E',coral:'#E2765F',leaf:'#7FAF8A',leafLight:'#A9CFA0',leafDeep:'#5E8F6E',terracotta:'#C9765F',soil:'#6A4B3B',trunk:'#7A5A48',blossom:'#F2A9BF',blossomDeep:'#DC8FA9',bike:'#568875',shirtPink:'#F2A9BF',shirtBlue:'#94B9D8',shirtYellow:'#F3CF76',paper:'#FBF5E8'};
 const m=Object.fromEntries(Object.entries(tokens).map(([k,color])=>[k,new THREE.MeshToonMaterial({color,gradientMap:gradient})]));
 m.ink=new THREE.MeshBasicMaterial({color:'#352F2A'});
 m.glass=new THREE.MeshBasicMaterial({color:'#BFE0DC',transparent:true,opacity:.15,depthWrite:false,side:THREE.DoubleSide});
 m.glow=new THREE.MeshBasicMaterial({color:'#E8DAB6'});
 m.headlight=new THREE.MeshBasicMaterial({color:'#EEE5C3'});
 m.screen=new THREE.MeshBasicMaterial({color:'#97BCAE'});
 m.redLight=new THREE.MeshBasicMaterial({color:'#BD6654'});
 m.hull=createHullMaterial(1.15);
 return m;
}
