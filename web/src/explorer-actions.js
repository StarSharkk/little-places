import * as THREE from 'three';

// UI adapter only: every pose and sequence operates on the existing model API.
export function createExplorerActions(item, { reduced, menu }) {
 const m=item.model, id=item.id, state={door:false,shutter:false,pastries:true,taken:false,vent:false,book:false,lights:true,oven:true,washing:false,machine:false,seeThrough:false};
 const tracks=new Map(), actions=[];
 const pose=(key,target,apply,rate=8)=>{const old=tracks.get(key);tracks.set(key,{amount:old?.amount??0,target,apply,rate});};
 const toggle=(key,apply)=>{state[key]=!state[key];pose(key,Number(state[key]),apply);};
 const add=(key,label,run,pressed,disabled)=>actions.push({key,label,run,pressed,disabled});
 const door=()=>{state.door=!state.door;if(id==='sweets')m.toggleDoor();else pose('door',Number(state.door),a=>m.setDoor?m.setDoor(a):m.door.hinge.rotation.y=-Math.PI*(id==='cafe'?.58:.56)*a);};
 if(id!=='grocery'&&id!=='tram')add('door',()=>state.door?'Close the door':'Open the door',door,()=>state.door);
 if(id==='cafe'||id==='sweets')add('menu',()=>id==='cafe'?'Café menu':'Dessert menu',()=>menu(id));
 if(id==='grocery')add('shutter',()=>state.shutter?'Close shutter':'Open shutter',()=>toggle('shutter',a=>m.storefront.setOpen(a)),()=>state.shutter);
 if(id==='bakery'){
  add('pastries',()=>state.pastries?'Hide pastries':'Show pastries',()=>{state.pastries=!state.pastries;m.setPastries(state.pastries);},()=>state.pastries);
  add('take',()=>state.taken?'Put bread back':'Take your bread',()=>toggle('taken',a=>m.pickup.position.lerpVectors(m.pickupHome,m.pickupAway,a)),()=>state.taken);
 }
 if(id==='flowers'){
  add('vent',()=>state.vent?'Close the vent':'Open the vent',()=>toggle('vent',a=>m.setVent(a)),()=>state.vent);
  add('pick',()=>state.taken?'Put bouquet back':'Pick a bouquet',()=>toggle('taken',a=>m.pickup.position.lerpVectors(m.pickHome,m.pickAway,a)),()=>state.taken);
 }
 if(id==='books'){
  add('lights',()=>state.lights?'Lights off':'Lights on',()=>{state.lights=!state.lights;m.setLights(state.lights);},()=>!state.lights);
  add('book',()=>state.book?'Close the book':'Open the book',()=>toggle('book',a=>m.setBook(a),4),()=>state.book);
 }
 if(id==='pizza'){
  add('oven',()=>state.oven?'Rest the oven':'Fire up the oven',()=>{state.oven=!state.oven;m.setOven(state.oven);},()=>state.oven);
  add('box',()=>state.book?'Close pizza box':'Open pizza box',()=>toggle('book',a=>m.setBox(a)),()=>state.book);
 }
 if(id==='laundry'){
  add('wash',()=>state.washing?'Stop washing':'Start washing',()=>{state.washing=!state.washing;if(state.washing){state.machine=false;pose('machine',0,a=>m.setMachineDoor(a));}m.setWashing(state.washing);},()=>state.washing);
  add('machine',()=>state.machine?'Close machine door':'Open machine door',()=>toggle('machine',a=>m.setMachineDoor(a)),()=>state.machine,()=>state.washing);
  add('vend',()=> 'Buy detergent',()=>m.startVend(reduced()),null,()=>m.vendRunning);
 }
 if(id==='post'){
  add('letter',()=> 'Send a letter',()=>m.sendLetter(reduced()),null,()=>m.letterRunning);
  add('parcel',()=> 'Deliver a parcel',()=>m.deliverParcel(reduced()),null,()=>m.parcelRunning);
 }
 if(id==='tram'){
  if(reduced())m.settle();
  add('travel',()=>m.state.auto?'Pause tram':'Resume tram',()=>m.toggleTravel(reduced()),null,()=>m.state.doorsOpen||m.state.doorAmount>.001);
  add('doors',()=>m.state.doorsOpen?'Close tram doors':m.state.stopRequested?'Cancel requested stop':'Open tram doors',()=>m.toggleDoors(reduced()),()=>m.state.doorsOpen||m.state.stopRequested);
  add('ticket',()=> 'Buy a ticket',()=>m.buyTicket(reduced()),null,()=>m.state.ticketRunning);
 }
 const aliases={door:'door',menu:'menu',shutter:'shutter',bakeryDoor:'door',bakeryTake:'take',flowerDoor:'door',flowerVent:'vent',flowerPick:'pick',sweetsDoor:'door',sweetsMenu:'menu',booksDoor:'door',booksOpen:'book',pizzaDoor:'door',pizzaOven:'oven',pizzaBox:'box',laundryDoor:'door',laundryWash:'wash',laundryMachineDoor:'machine',laundryVend:'vend',postDoor:'door',postLetter:'letter',postParcel:'parcel',tramTravel:'travel',tramDoors:'doors',tramTicket:'ticket'};
 return {state,actions,
  act(key){const a=actions.find(a=>a.key===(aliases[key]??key));if(a&&!a.disabled?.())a.run();},
  step(dt,time){let moving=false;for(const t of tracks.values()){t.amount=reduced()?t.target:THREE.MathUtils.damp(t.amount,t.target,t.rate,dt);if(Math.abs(t.amount-t.target)<.001)t.amount=t.target;else moving=true;t.apply(t.amount);}if(m.update?.(reduced()?1:dt))moving=true;if(!reduced()&&m.animate?.(dt,time))moving=true;return moving;},
  seeThrough(on){state.seeThrough=on;m.setSeeThrough?.(on);},
 };
}
