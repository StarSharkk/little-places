import {group,box,plate,rod,cylinder} from '../shared/primitives.js';
import {plant,Bicycle,Bench,CherryTree,StreetLamp} from '../shared/props.js';
import {G} from './Station.js';

export function Props(root,m,atlas){
 Bench(root,m,[3.4,G.platform,-.26],0);Bench(root,m,[-4.32,G.platform,-1.70],Math.PI/2);
 const ticket=group(root,'Automatic ticket machine',[3.94,G.platform,-1.63]);ticket.userData.action='tramTicket';
 plate(ticket,.78,1.72,.56,.075,m.ticketBody,[0,.86,0]);
 plate(ticket,.68,1.18,.03,.035,m.cream,[0,1.05,.295]);atlas.attach(ticket,'machine',.61,.83,[0,1.20,.315]);
 box(ticket,.51,.19,.028,m.screen,[0,1.16,.331],false);
 box(ticket,.40,.065,.05,m.ink,[0,.43,.31]);box(ticket,.45,.045,.14,m.wood,[0,.36,.34]);
 const button=group(ticket,'Ticket button',[.23,.68,.34]);button.userData.live=true;box(button,.13,.075,.04,m.yellow);
 const paper=group(root,'Issued ticket',[3.94,G.platform+.44,-1.28]);paper.visible=false;
 box(paper,.35,.012,.20,m.paper);const print=atlas.attach(paper,'ticket',.33,.18,[0,.008,0]);print.rotation.x=-Math.PI/2;
 const vending=group(root,'Red drinks vending machine',[5.15,G.platform,-1.86]);
 plate(vending,.87,1.85,.62,.08,m.coral,[0,.925,0]);atlas.attach(vending,'drinks',.76,1.26,[0,1.12,.318]);
 box(vending,.52,.13,.035,m.ink,[-.07,.26,.33]);box(vending,.12,.22,.04,m.iron,[.30,.45,.33]);
 const bin=group(root,'Recycling bin',[5.42,G.platform,-.58]);box(bin,.43,.75,.43,m.steel,[0,.375,0]);plate(bin,.45,.18,.45,.06,m.iron,[0,.77,0]);box(bin,.24,.08,.035,m.ink,[0,.78,.244]);
 const info=group(root,'Platform information board',[-3.94,G.platform,-.14]);
 plate(info,1.10,1.35,.12,.035,m.frame,[0,1.45,0]);atlas.attach(info,'timetable',.48,1.19,[-.27,1.45,.068]);atlas.attach(info,'map',.48,1.19,[.27,1.45,.068]);
 for(const x of [-.45,.45])box(info,.07,.78,.07,m.frame,[x,.39,0]);
 for(const [x,z] of [[-2.17,-3.24],[2.4,-3.24]]){
  const board=plate(root,.65,.82,.04,.02,m.walnut,[x,1.98,z]);atlas.attach(root,'poster',.59,.76,[x,1.98,z-.025],Math.PI);
 }
 const tree=CherryTree(root,m,[4.70,G.platform,-3.00]);tree.scale.setScalar(1.65);
 StreetLamp(root,m,[5.85,G.platform,-.02]);StreetLamp(root,m,[-5.9,G.platform,-2.65]);
 Bicycle(root,m,[5.02,.155,4.86],0,'letters');
 for(const x of [4.65,5.35,6.05]){
  rod(root,[x,.155,4.62],[x,.70,4.62],.018,m.iron,6);rod(root,[x,.70,4.62],[x,.70,4.95],.018,m.iron,6);rod(root,[x,.70,4.95],[x,.155,4.95],.018,m.iron,6);
 }
 for(const [x,z] of [[-5.36,-3.20],[3.85,-3.24],[-3.2,5.05],[.75,5.05]]){
  const y=z>1?.155:G.platform;plant(root,m,[x,y,z],{r:.24,h:.25,kind:'flowers',pot:m.cream});
 }
 const name=group(root,'Vertical station name',[6.03,.155,2.68]);
 box(name,.10,2.63,.10,m.frame,[0,1.315,0]);plate(name,.43,1.65,.12,.05,m.frame,[0,1.8,.02]);atlas.attach(name,'vertical',.35,1.53,[0,1.8,.085]);
 return {ticket,paper,button,vending,tree};
}
