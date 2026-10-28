import {group,box,rod,cylinder,plate,sphere} from '../shared/primitives.js';
import {G} from './Station.js';

export function Track(root,m){
 const track=group(root,'Track and overhead supply');
 box(track,12.75,.07,2.14,m.gravel,[0,.195,G.trackZ]);
 for(let x=-6.1;x<=6.2;x+=.46){
  box(track,.18,.09,1.86,m.sleeper,[x,.26,G.trackZ]);
  for(const s of [-1,1]){
   box(track,.24,.035,.19,m.steelDark,[x,.316,G.trackZ+s*G.gauge/2]);
   for(const dz of [-.13,.13])cylinder(track,.026,.026,.025,m.iron,[x,.332,G.trackZ+s*G.gauge/2+dz],false,6);
  }
 }
 for(const s of [-1,1]){box(track,12.75,.07,.065,m.steel,[0,G.railY-.035,G.trackZ+s*G.gauge/2]);box(track,12.75,.025,.14,m.steelDark,[0,.293,G.trackZ+s*G.gauge/2]);}
 for(let i=0;i<110;i++){
  const x=-6.12+(i*1.713%12.2),z=G.trackZ-.95+(i*.713%1.9);
  sphere(track,[.05,.027,.035],i%2?m.gravel:m.stone,[x,.25,z],[6,4]);
 }
 for(const x of [-5.55,5.55]){
  cylinder(track,.11,.16,.22,m.stone,[x,.265,.94],true,12);
  cylinder(track,.062,.082,5.72,m.frame,[x,3.03,.94],true,16);
  for(const y of [1.8,3.6,5.2])cylinder(track,.10,.10,.07,m.brass,[x,y,.94],true,12);
  rod(track,[x,5.38,.94],[x,5.65,G.trackZ],.05,m.frame,10);
  rod(track,[x,5.8,.94],[x,5.65,G.trackZ],.035,m.frame,8);
  for(const z of [1.35,G.trackZ-.02])for(let k=0;k<3;k++)cylinder(track,.075,.075,.045,m.cream,[x,5.65+k*.06,z],true,10);
 }
 for(const z of [G.trackZ,G.trackZ-.32])rod(track,[-6.2,G.contactY,z],[6.2,G.contactY,z],.014,m.iron,6);
 rod(track,[-6.2,6.05,G.trackZ],[6.2,6.05,G.trackZ],.009,m.iron,5);
 for(const x of [-5.5,-3.7,-1.9,0,1.9,3.7,5.5])rod(track,[x,6.05,G.trackZ],[x,5.65,G.trackZ],.009,m.iron,5);
 // The crossing equipment sits beside the track, outside the tram's swept envelope.
 const crossing=group(root,'Rail crossing signal',[-5.88,.155,5.01]);crossing.userData.action='tramTravel';
 cylinder(crossing,.055,.07,2.7,m.yellow,[0,1.35,0],true,12);
 for(let i=0;i<7;i++)cylinder(crossing,.072,.072,.13,m.iron,[0,.18+i*.33,0],false,12);
 for(const a of [-.67,.67]){
  const cross=box(crossing,.85,.11,.075,m.yellow,[0,2.48,0]);cross.rotation.z=a;
  for(const x of [-.29,0,.29]){const b=box(crossing,.12,.115,.085,m.iron,[x*Math.cos(a),2.48+x*Math.sin(a),.01],false);b.rotation.z=a;}
 }
 for(const x of [-.23,.23]){const b=cylinder(crossing,.14,.14,.13,m.iron,[x,1.97,0],true,16);b.rotation.x=Math.PI/2;const lamp=cylinder(crossing,.095,.095,.014,m.redLight,[x,1.97,.08],false,16);lamp.rotation.x=Math.PI/2;}
 for(const start of [-4.5,1.9]){
  for(let x=start;x<start+2.9;x+=.55)box(root,.045,.7,.045,m.frame,[x,.505,5.20]);
  for(const y of [.35,.79])rod(root,[start,y,5.20],[start+2.75,y,5.20],.025,m.frame,8);
 }
 return track;
}
