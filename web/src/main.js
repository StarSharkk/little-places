import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createCollection, colours } from './collection.js';
import './style.css';
import { createExplorer } from './explorer.js';
import { createCollectionMotion } from './collection-motion.js';

const $=selector=>document.querySelector(selector);
const host=$('#scene');
let explorer,collectionVisible=true;
new IntersectionObserver(entries=>{collectionVisible=entries[0].isIntersecting;if(collectionVisible)invalidate();}).observe(host);
const state={active:'collection',collectionPage:0,collectionShift:11.4,singleSlide:0,doorOpen:false,shutterOpen:false,shutterAmount:0,labels:false,auto:false,view:'iso',zoomGoal:null,bakeryDoorOpen:false,pastriesVisible:true,seeThrough:false,breadTaken:false,flowerDoorOpen:false,ventOpen:false,ventAmount:0,bouquetTaken:false,sweetsDoorOpen:false,booksDoorOpen:false,booksDoorAmount:0,booksLights:true,bookOpen:false,bookAmount:0,pizzaDoorOpen:false,pizzaDoorAmount:0,pizzaOven:true,pizzaBoxOpen:false,pizzaBoxAmount:0,laundryDoorOpen:false,laundryDoorAmount:0,laundryWashing:false,machineDoorOpen:false,machineDoorAmount:0,postDoorOpen:false,postDoorAmount:0,night:false,nightAmount:0};
let dirty=true,frames=0,hover=null,gesture=null,nightShown=0;
const invalidate=()=>{dirty=true;};
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.localClippingEnabled=true;
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;
host.append(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color('#F7F3E9');
const hemi=new THREE.HemisphereLight(0xffffff,0xc3b59e,1.8);scene.add(hemi);
const light=new THREE.DirectionalLight(0xffffff,1.4);light.position.set(-3,12,8);scene.add(light);
// Night is drawn, not lit: the toon surfaces dim with the lights while unlit materials (lamps, signs, glass, neon)
// keep their colour and so seem to glow. Buildings may add their own touches through setNight(amount).
const DAY={bg:'#F7F3E9',ground:'#F7F3E9',sky:'#FFFFFF',earth:'#C3B59E',hemi:1.8,sun:'#FFFFFF',dir:1.4,shadow:'#92A6CF'};
const NIGHT={bg:'#1F2638',ground:'#273047',sky:'#8A98C4',earth:'#3A3550',hemi:1.05,sun:'#AFBCE6',dir:.45,shadow:'#161C2B'};
const mixColour=(a,b,t,out)=>out.set(a).lerp(new THREE.Color(b),t);
const camera=new THREE.OrthographicCamera(-12,12,6,-6,.1,200);
// Default view, matched to the angle the owner picked: azimuth 25° (the façade a little more frontal than 45°),
// elevation 28°, distance 23.5 from the target.
const VIEW={az:25*Math.PI/180,el:28*Math.PI/180,d:23.47};
const isoOffset=()=>new THREE.Vector3(Math.sin(VIEW.az)*Math.cos(VIEW.el),Math.sin(VIEW.el),Math.cos(VIEW.az)*Math.cos(VIEW.el)).multiplyScalar(VIEW.d);
camera.position.copy(isoOffset()).add(new THREE.Vector3(0,3.05,0));
const controls=new OrbitControls(camera,renderer.domElement);
controls.enablePan=false;controls.enableDamping=true;controls.dampingFactor=.09;controls.rotateSpeed=.6;
controls.enableZoom=false;controls.minZoom=.65;controls.maxZoom=3.2;controls.minPolarAngle=.4;controls.maxPolarAngle=1.47;
controls.autoRotateSpeed=.45;
const items=createCollection();
if(reducedMotion.matches)items.tram.model.settle();
reducedMotion.addEventListener('change',()=>{if(reducedMotion.matches){items.tram.model.settle();carousel.pause();if(state.active==='collection')stopTurntable();}updateCruiseButton();invalidate();});
Object.values(items).forEach(item=>scene.add(item.wrapper));
// Each place's full footprint (shadow included) at scale 1, used to space the overview evenly.
// Each place turns about the centre of its own footprint (its hub), and owns a slot as wide as the circle its
// footprint sweeps when turning, so dragging the view can never push neighbours into each other.
scene.updateMatrixWorld(true);
for(const item of Object.values(items)){
 const b=item.model.footprint?new THREE.Box3(new THREE.Vector3(...item.model.footprint.min),new THREE.Vector3(...item.model.footprint.max)):new THREE.Box3().setFromObject(item.model.group),hub=b.getCenter(new THREE.Vector3());
 item.hub=new THREE.Vector3(hub.x,0,hub.z);
 const visual=item.model.footprint?b:new THREE.Box3().setFromObject(item.wrapper);item.visualRadius=Math.max(...[visual.min.x,visual.max.x].flatMap(x=>[visual.min.z,visual.max.z].map(z=>Math.hypot(x-hub.x,z-hub.z))));
 item.radius=Math.max(...[b.min.x,b.max.x].flatMap(x=>[b.min.z,b.max.z].map(z=>Math.hypot(x-hub.x,z-hub.z))));
}
const RAIL_GAP=0.8;
const ground=new THREE.Mesh(new THREE.PlaneGeometry(180,180),new THREE.MeshBasicMaterial({color:'#F7F3E9'}));
ground.rotation.x=-Math.PI/2;ground.position.y=-.6;scene.add(ground);
const right=new THREE.Vector3(Math.cos(VIEW.az),0,-Math.sin(VIEW.az));
const buildingIds=Object.keys(items);
const carousel=createCollectionMotion(buildingIds);
const horizontalMotion=new THREE.Group();horizontalMotion.name='HorizontalMotion';scene.add(horizontalMotion);
for(const item of Object.values(items)){
 item.carrier=new THREE.Group();item.carrier.name=`Building${item.number}`;
 item.rotationPivot=new THREE.Group();item.rotationPivot.name='RotationPivot';
 horizontalMotion.add(item.carrier);item.carrier.add(item.rotationPivot);item.rotationPivot.add(item.wrapper);
}
const cruiseButton=document.createElement('button');cruiseButton.id='collection-cruise';cruiseButton.className='pill';
cruiseButton.title='Pause or resume the automatic horizontal tour';$('#action-hint').before(cruiseButton);
cruiseButton.onclick=()=>{carousel.setCruising(!carousel.state.cruising);updateCruiseButton();invalidate();};
function updateCruiseButton(){cruiseButton.hidden=state.active!=='collection';cruiseButton.textContent=carousel.state.cruising?'Pause tour':'Resume tour';cruiseButton.setAttribute('aria-pressed',String(!carousel.state.cruising));}
function configureCarousel(){const r=railLayout(),first=(r.centre[0]+r.ext[0][0]+r.centre[3]+r.ext[3][1])/2;
 carousel.configure({centres:r.centre,period:r.length+RAIL_GAP,shift:compactCollection()?-r.centre[0]:-first,halfWidth:(camera.right-camera.left)/camera.zoom/2,extent:Math.max(...Object.values(items).map(i=>i.visualRadius*i.scale)),unitsPerPixel:(camera.right-camera.left)/camera.zoom/Math.max(1,host.clientWidth)});
}
function openExplorer(id){carousel.pause();updateCruiseButton();explorer.open(id);invalidate();}
// The tour pauses while the pointer rests on a place, and that place grows a little (see layout and the loop).
function setHovered(id){if(state.hoveredId===id)return;state.hoveredId=id;carousel.hover(!!id);invalidate();}
// a resting pointer also counts when the tour slides a place under it
let restingPointer=null,hoverCheck=0;
const compactCollection=()=>innerWidth<=650&&state.active==='collection';
// Overview rail: places sit side by side along the camera's right axis with the same gap between footprints,
// so wide places (the dessert shop's street corner, the pizzeria's terrace) no longer crowd their neighbours.
function railLayout(){
 // slots depend only on each place's turning circle, never on the camera angle
 const list=Object.values(items),r=list.map(item=>item.radius*item.scale),c=[];
 let at=0;for(let i=0;i<list.length;i++){if(i)at+=r[i-1]+RAIL_GAP+r[i];c.push(at);}
 const mid=(c[0]-r[0]+c.at(-1)+r.at(-1))/2;
 return {centre:c.map(v=>v-mid),ext:r.map(v=>[-v,v]),length:c.at(-1)+r.at(-1)-(c[0]-r[0])};
}
const collectionLastPage=()=>compactCollection()?buildingIds.length-1:Math.max(0,buildingIds.length-4);
// four places per page on desktop: page 0 shows indices 0–3, centred on the middle of those four
// four places per page on desktop (one on phones): shift so the visible footprints are centred
const collectionShiftGoal=()=>{const r=railLayout(),first=state.collectionPage,last=Math.min(buildingIds.length-1,first+(compactCollection()?0:3));return -((r.centre[first]+r.ext[first][0])+(r.centre[last]+r.ext[last][1]))/2;};
// the collection opens at 320% on desktop; phones keep 155% so one place still fits the screen
const defaultZoom=()=>state.active==='collection'?(compactCollection()?1.55:3.2):1.45;
const activeItems=()=>state.active==='collection'?Object.values(items):[items[state.active]];
function layout(){
 const overview=state.active==='collection';
 const delta=camera.position.clone().sub(controls.target);
 right.set(delta.z,0,-delta.x).normalize();
 ground.visible=true;
 if(overview)configureCarousel();
 for(const [index,item] of Object.values(items).entries()){
  item.wrapper.visible=overview||state.active===item.id;
  // Every hub sits on one camera-relative rail (the rail glides beneath the fixed camera); the wrapper is offset
  // by its hub so the place turns about its own footprint centre, in the overview and on its own.
  const scale=overview?item.scale*(1+.07*(item.hoverAmount||0)):1;
  item.wrapper.scale.setScalar(scale);
  const x=overview?carousel.position(item.id):state.singleSlide;
  item.carrier.position.copy(right).multiplyScalar(x);
  item.rotationPivot.rotation.y=overview?carousel.angles[item.id]:0;
  item.wrapper.position.copy(item.hub).multiplyScalar(-scale);
  const half=(camera.right-camera.left)/camera.zoom/2;
  item.onStage=overview?Math.abs(x)<half+item.visualRadius*scale+1:state.active===item.id;
  item.carrier.visible=item.wrapper.visible&&item.onStage;
 }
}
function revealActiveTab(){
 const nav=$('.building-tabs'),button=$('[data-building="'+state.active+'"]');
 if(!button)return;
 const n=nav.getBoundingClientRect(),b=button.getBoundingClientRect();
 if(b.left<n.left+12)nav.scrollLeft-=n.left+12-b.left;
 else if(b.right>n.right-12)nav.scrollLeft+=b.right-n.right+12;
}
function resize(){
 const w=host.clientWidth,h=host.clientHeight,aspect=w/h;
 renderer.setSize(w,h);revealActiveTab();
 const item=items[state.active];
 const count=Object.keys(items).length;
 state.collectionPage=Math.min(state.collectionPage,collectionLastPage());
 const vertical=item?item.span:compactCollection()?15.5:13.4,horizontal=item?item.width:compactCollection()?23:railLayout().length*1.23+3;
 const span=Math.max(vertical,horizontal/aspect);
 camera.left=-span*aspect/2;camera.right=span*aspect/2;camera.top=span/2;camera.bottom=-span/2;
 camera.clearViewOffset();camera.updateProjectionMatrix();
 // A single object ring must leave room for a complete offscreen wrap at both edges.
 controls.minZoom=state.active==='collection'?Math.max(.65,(camera.right-camera.left)/(railLayout().length+RAIL_GAP-2*Math.max(...Object.values(items).map(i=>i.visualRadius*i.scale))-2)):.65;
 if(camera.zoom<controls.minZoom){camera.zoom=controls.minZoom;camera.updateProjectionMatrix();}
 for(const item of Object.values(items))for(const material of item.lines)material.resolution.set(w,h);
 updateGalleryButtons();
 // Offscreen canvases pause, but their DOM overlays must still fit a resized page.
 layout();scene.updateMatrixWorld(true);renderOverlays();
 invalidate();
}
function stopTurntable(){state.auto=false;controls.autoRotate=false;$('#turntable').setAttribute('aria-pressed','false');}
function setView(view='iso'){
 stopTurntable();state.view=view;state.zoomGoal=null;
 // Flush leftover damping before setting an exact view.
 controls.enableDamping=false;controls.update();
 const pivot=items[state.active]?.pivot??3.05;
 controls.target.set(0,pivot,0);
 if(view==='front')camera.position.set(0,pivot+12.6,19.8);
 else if(view==='side')camera.position.set(19.8,pivot+12.6,0);
 else camera.position.copy(isoOffset()).add(controls.target);
 camera.zoom=defaultZoom();camera.updateProjectionMatrix();controls.update();controls.saveState();controls.enableDamping=true;
 document.querySelectorAll('[data-view]').forEach(button=>{const selected=button.dataset.view===view;button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected));});
 layout();invalidate();
}
function updateColourUI(){
 const indices=activeItems().map(item=>item.colourIndex);
 const same=indices.every(index=>index===indices[0]);
 document.querySelectorAll('.swatch').forEach((button,index)=>button.setAttribute('aria-pressed',String(same&&indices[0]===index)));
 $('#colour-name').textContent=same?colours[indices[0]].name:'Your own mix';
}
let tramActionKey='';
function updateTramActions(){
 const t=items.tram.model.state;
 const key=[state.active,t.auto,t.moving,t.docked,t.doorsOpen,t.stopRequested,t.ticketRunning,t.doorAmount>.001].join('|');
 if(key===tramActionKey)return;tramActionKey=key;
 for(const id of ['tram-travel','tram-doors','tram-ticket'])$('#'+id).hidden=state.active!=='tram';
 $('#tram-travel').innerHTML=`${t.auto?'Pause tram':'Resume tram'} <span>↗</span>`;
 $('#tram-travel').disabled=t.doorsOpen||t.doorAmount>.001;
 $('#tram-travel').title=t.doorsOpen?'Close the tram doors before departure':'';
 $('#tram-doors').innerHTML=`${t.doorsOpen?'Close tram doors':t.stopRequested?'Cancel requested stop':'Open tram doors'} <span>↗</span>`;
 $('#tram-doors').setAttribute('aria-pressed',String(t.doorsOpen||t.stopRequested));$('#tram-doors').disabled=false;
 $('#tram-ticket').disabled=t.ticketRunning;
}
function updateActions(){
 updateTramActions();
 $('#door').hidden=!['collection','cafe'].includes(state.active);$('#menu-button').hidden=$('#door').hidden;$('#shutter').hidden=!['collection','grocery'].includes(state.active);
 for(const id of ['bakery-door','pastries','take-bread'])$('#'+id).hidden=state.active!=='bakery';
 for(const id of ['flower-door','vent','pick-bouquet'])$('#'+id).hidden=state.active!=='flowers';
 $('#see-through').hidden=!['bakery','flowers','books','pizza','laundry','post','tram'].includes(state.active);
 for(const id of ['sweets-door','sweets-menu-button'])$('#'+id).hidden=state.active!=='sweets';
 for(const id of ['books-door','books-lights','books-book'])$('#'+id).hidden=state.active!=='books';
 for(const id of ['pizza-door','pizza-oven','pizza-box'])$('#'+id).hidden=state.active!=='pizza';
 for(const id of ['laundry-door','laundry-wash','laundry-machine-door','laundry-vend'])$('#'+id).hidden=state.active!=='laundry';
 for(const id of ['post-door','post-letter','post-parcel'])$('#'+id).hidden=state.active!=='post';
 $('#post-door').innerHTML=`${state.postDoorOpen?'Close':'Open'} the door <span>↗</span>`;$('#post-door').setAttribute('aria-pressed',String(state.postDoorOpen));
 $('#laundry-door').innerHTML=`${state.laundryDoorOpen?'Close':'Open'} the door <span>↗</span>`;$('#laundry-door').setAttribute('aria-pressed',String(state.laundryDoorOpen));
 $('#laundry-wash').textContent=state.laundryWashing?'Stop washing':'Start washing';$('#laundry-wash').setAttribute('aria-pressed',String(state.laundryWashing));
 $('#laundry-machine-door').innerHTML=`${state.machineDoorOpen?'Close':'Open'} machine door <span>↗</span>`;$('#laundry-machine-door').setAttribute('aria-pressed',String(state.machineDoorOpen));
 // the porthole stays shut while the drum is turning
 $('#laundry-machine-door').disabled=state.laundryWashing;$('#laundry-machine-door').title=state.laundryWashing?'Stop the machine first':'';
 $('#pizza-door').innerHTML=`${state.pizzaDoorOpen?'Close':'Open'} the door <span>↗</span>`;$('#pizza-door').setAttribute('aria-pressed',String(state.pizzaDoorOpen));
 $('#pizza-oven').textContent=state.pizzaOven?'Rest the oven':'Fire up the oven';$('#pizza-oven').setAttribute('aria-pressed',String(state.pizzaOven));
 $('#pizza-box').innerHTML=`${state.pizzaBoxOpen?'Close':'Open'} the pizza box <span>↗</span>`;$('#pizza-box').setAttribute('aria-pressed',String(state.pizzaBoxOpen));
 $('#books-door').innerHTML=`${state.booksDoorOpen?'Close':'Open'} the door <span>↗</span>`;$('#books-door').setAttribute('aria-pressed',String(state.booksDoorOpen));
 $('#books-lights').textContent=state.booksLights?'Lights off':'Lights on';$('#books-lights').setAttribute('aria-pressed',String(!state.booksLights));
 $('#books-book').innerHTML=`${state.bookOpen?'Close':'Open'} the book <span>↗</span>`;$('#books-book').setAttribute('aria-pressed',String(state.bookOpen));
 $('#sweets-door').innerHTML=`${state.sweetsDoorOpen?'Close':'Open'} the door <span>↗</span>`;$('#sweets-door').setAttribute('aria-pressed',String(state.sweetsDoorOpen));
 $('#flower-door').innerHTML=`${state.flowerDoorOpen?'Close':'Open'} the door <span>↗</span>`;$('#flower-door').setAttribute('aria-pressed',String(state.flowerDoorOpen));
 $('#vent').innerHTML=`${state.ventOpen?'Close':'Open'} the glasshouse vent <span>↗</span>`;$('#vent').setAttribute('aria-pressed',String(state.ventOpen));
 $('#pick-bouquet').innerHTML=`${state.bouquetTaken?'Put it back':'Pick a bouquet'} <span>↗</span>`;$('#pick-bouquet').setAttribute('aria-pressed',String(state.bouquetTaken));
 $('#bakery-door').innerHTML=`${state.bakeryDoorOpen?'Close':'Open'} the door <span>↗</span>`;$('#bakery-door').setAttribute('aria-pressed',String(state.bakeryDoorOpen));
 $('#pastries').textContent=state.pastriesVisible?'Hide pastries':'Show pastries';$('#pastries').setAttribute('aria-pressed',String(state.pastriesVisible));
 $('#take-bread').innerHTML=`${state.breadTaken?'Put bread back':'Take your bread'} <span>↗</span>`;$('#take-bread').setAttribute('aria-pressed',String(state.breadTaken));
 $('#see-through').setAttribute('aria-pressed',String(state.seeThrough));
 $('#door').innerHTML=`${state.doorOpen?'Close':'Open'} café door <span>↗</span>`;
 $('#door').setAttribute('aria-pressed',String(state.doorOpen));
 $('#shutter').innerHTML=`${state.shutterOpen?'Close':'Open'} grocery shutter <span>↗</span>`;
 $('#shutter').setAttribute('aria-pressed',String(state.shutterOpen));
}
function updateGalleryButtons(){
 const index=state.active==='collection'?state.collectionPage:buildingIds.indexOf(state.active);
 const last=state.active==='collection'?collectionLastPage():buildingIds.length-1;
 const previous=$('#gallery-prev'),next=$('#gallery-next');
 previous.disabled=state.active==='collection'?false:index<=0;next.disabled=state.active==='collection'?false:index>=last;
 previous.setAttribute('aria-label',state.active==='collection'?'Previous buildings':'Previous building');
 next.setAttribute('aria-label',state.active==='collection'?'Next buildings':'Next building');
}
function navigateGallery(direction){
 if(state.active==='collection'){
  const id=carousel.navigate(direction);state.collectionPage=buildingIds.indexOf(id);updateCruiseButton();
  updateGalleryButtons();invalidate();return;
 }
 const current=buildingIds.indexOf(state.active),next=THREE.MathUtils.clamp(current+direction,0,buildingIds.length-1);
 if(next===current)return;
 select(buildingIds[next],{slideDirection:direction});
}
function select(id,{writeHash=true,slideDirection=0}={}){
 if(id!=='collection'&&!items[id])return;
 state.active=id;
 if(id==='collection'){state.collectionPage=0;state.collectionShift=collectionShiftGoal();carousel.reset(reducedMotion.matches);}
 else state.singleSlide=slideDirection*(innerWidth<=650?5.5:8);
 $('#exhibition').dataset.mode=id;hover=null;$('#tooltip').style.display='none';
 const overview=id==='collection';
 document.querySelectorAll('[data-building]').forEach(button=>{const selected=button.dataset.building===id;button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;});
 $('#exhibition').setAttribute('aria-labelledby',`tab-${id}`);
 $('#building-captions').hidden=!overview;
 $('#stage-caption').textContent=overview?'THE COMPLETE COLLECTION':`${items[id].number} / ${items[id].title.toUpperCase()} · ${items[id].native}`;
 $('#object-description').textContent=overview?'01 Café  +  02 Grocery  +  03 Bakery  +  04 Flowers  +  05 Sweets  +  06 Bookshop  +  07 Pizza  +  08 Laundry  +  09 Post  +  10 Tram':`${items[id].number} / ${items[id].description}`;
 $('#action-hint').textContent=overview?'Pick a place. Make yourself at home.':id==='cafe'?'A door to open. A menu to linger over.':id==='bakery'?'Fresh from the oven. Made for you.':id==='flowers'?'Fresh blooms. A glasshouse on the roof.':id==='sweets'?'A door to open. Something sweet inside.':id==='tram'?'A quiet stop in a charming town.':id==='post'?'A letter to post. A parcel to send.':id==='laundry'?'A drum to spin. A bottle to buy.':id==='pizza'?'A fire to light. A box to peek into.':id==='books'?'Shelves to browse. A roof to read on.':'Everyday goods & four little capsule machines.';
 if(writeHash)history.replaceState(null,'',`#${id}`);
 controls.enabled=!overview;host.style.touchAction=renderer.domElement.style.touchAction='pan-y';   // vertical swipes always scroll the page
 updateActions();updateColourUI();setView('iso');resize();updateGalleryButtons();
 if(overview){state.auto=!reducedMotion.matches;controls.autoRotate=false;$('#turntable').setAttribute('aria-pressed',String(state.auto));}
 updateCruiseButton();
 if(id!=='cafe'&&id!=='collection'&&$('#cafe-menu').open)$('#cafe-menu').close();
 if(id!=='sweets'&&$('#sweets-menu').open)$('#sweets-menu').close();
}
for(const button of document.querySelectorAll('[data-building]'))button.onclick=()=>select(button.dataset.building);
for(const button of document.querySelectorAll('[data-focus]'))button.onclick=()=>openExplorer(button.dataset.focus);
$('#gallery-prev').onclick=()=>navigateGallery(-1);
$('#gallery-next').onclick=()=>navigateGallery(1);
$('#exhibition').addEventListener('keydown',event=>{
 if(!['ArrowLeft','ArrowRight'].includes(event.key)||event.target.closest('button'))return;
 event.preventDefault();navigateGallery(event.key==='ArrowRight'?1:-1);
});
$('.brand').onclick=event=>{event.preventDefault();select('collection');};
$('.building-tabs').addEventListener('keydown',event=>{
 const tabs=[...document.querySelectorAll('[data-building]')],index=tabs.indexOf(document.activeElement);
 if(index<0||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
 event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
 select(tabs[next].dataset.building);tabs[next].focus();
});
function toggleDoor(){state.doorOpen=!state.doorOpen;updateActions();invalidate();}
function toggleShutter(){state.shutterOpen=!state.shutterOpen;updateActions();invalidate();}
$('#door').onclick=toggleDoor;$('#shutter').onclick=toggleShutter;
function toggleBakeryDoor(){state.bakeryDoorOpen=!state.bakeryDoorOpen;updateActions();invalidate();}
function takeBread(){state.breadTaken=!state.breadTaken;$('#action-hint').textContent=state.breadTaken?'A warm loaf, just for you.':'Back on the counter. Fresh as ever.';updateActions();invalidate();}
$('#bakery-door').onclick=toggleBakeryDoor;$('#take-bread').onclick=takeBread;
$('#pastries').onclick=()=>{state.pastriesVisible=!state.pastriesVisible;items.bakery.model.setPastries(state.pastriesVisible);updateActions();invalidate();};
// See-through cuts away both one-storey shops at once, so switching between them stays consistent.
$('#see-through').onclick=()=>{state.seeThrough=!state.seeThrough;items.bakery.model.setSeeThrough(state.seeThrough);items.flowers.model.setSeeThrough(state.seeThrough);items.books.model.setSeeThrough(state.seeThrough);items.pizza.model.setSeeThrough(state.seeThrough);items.laundry.model.setSeeThrough(state.seeThrough);items.post.model.setSeeThrough(state.seeThrough);items.tram.model.setSeeThrough(state.seeThrough);updateActions();invalidate();};
function toggleFlowerDoor(){state.flowerDoorOpen=!state.flowerDoorOpen;updateActions();invalidate();}
function toggleVent(){state.ventOpen=!state.ventOpen;updateActions();invalidate();}
function pickBouquet(){state.bouquetTaken=!state.bouquetTaken;$('#action-hint').textContent=state.bouquetTaken?'A fresh bunch, just for you.':'Back on the workbench, still fresh.';updateActions();invalidate();}
function toggleSweetsDoor(){state.sweetsDoorOpen=!state.sweetsDoorOpen;items.sweets.model.toggleDoor();updateActions();invalidate();}
const showSweetsMenu=()=>{const d=$('#sweets-menu');if(!d.open)d.showModal();};
function toggleBooksDoor(){state.booksDoorOpen=!state.booksDoorOpen;updateActions();invalidate();}
function toggleBooksLights(){state.booksLights=!state.booksLights;items.books.model.setLights(state.booksLights);updateActions();invalidate();}
function toggleBook(){state.bookOpen=!state.bookOpen;updateActions();invalidate();}
function togglePizzaDoor(){state.pizzaDoorOpen=!state.pizzaDoorOpen;updateActions();invalidate();}
function togglePizzaOven(){state.pizzaOven=!state.pizzaOven;items.pizza.model.setOven(state.pizzaOven);updateActions();invalidate();}
function togglePizzaBox(){state.pizzaBoxOpen=!state.pizzaBoxOpen;updateActions();invalidate();}
function toggleLaundryDoor(){state.laundryDoorOpen=!state.laundryDoorOpen;updateActions();invalidate();}
function toggleWashing(){state.laundryWashing=!state.laundryWashing;if(state.laundryWashing)state.machineDoorOpen=false;items.laundry.model.setWashing(state.laundryWashing);updateActions();invalidate();}
function toggleMachineDoor(){if(state.laundryWashing)return;state.machineDoorOpen=!state.machineDoorOpen;updateActions();invalidate();}
function buyDetergent(){items.laundry.model.startVend(reducedMotion.matches);invalidate();}
function travelTram(){items.tram.model.toggleTravel(reducedMotion.matches);updateTramActions();invalidate();}
function doorsTram(){items.tram.model.toggleDoors(reducedMotion.matches);updateTramActions();invalidate();}
function ticketTram(){items.tram.model.buyTicket(reducedMotion.matches);updateTramActions();invalidate();}
$('#tram-travel').onclick=travelTram;$('#tram-doors').onclick=doorsTram;$('#tram-ticket').onclick=ticketTram;
function togglePostDoor(){state.postDoorOpen=!state.postDoorOpen;updateActions();invalidate();}
function sendLetter(){items.post.model.sendLetter(reducedMotion.matches);invalidate();}
function deliverParcel(){items.post.model.deliverParcel(reducedMotion.matches);invalidate();}
$('#post-door').onclick=togglePostDoor;$('#post-letter').onclick=sendLetter;$('#post-parcel').onclick=deliverParcel;
$('#laundry-door').onclick=toggleLaundryDoor;$('#laundry-wash').onclick=toggleWashing;$('#laundry-machine-door').onclick=toggleMachineDoor;$('#laundry-vend').onclick=buyDetergent;
$('#pizza-door').onclick=togglePizzaDoor;$('#pizza-oven').onclick=togglePizzaOven;$('#pizza-box').onclick=togglePizzaBox;
$('#books-door').onclick=toggleBooksDoor;$('#books-lights').onclick=toggleBooksLights;$('#books-book').onclick=toggleBook;
$('#sweets-door').onclick=toggleSweetsDoor;$('#sweets-menu-button').onclick=showSweetsMenu;
$('#flower-door').onclick=toggleFlowerDoor;$('#vent').onclick=toggleVent;$('#pick-bouquet').onclick=pickBouquet;
const menu=$('#cafe-menu'),about=$('#about-dialog');
const showMenu=()=>{if(!menu.open)menu.showModal();};$('#menu-button').onclick=showMenu;$('#about').onclick=()=>about.showModal();
for(const dialog of [menu,about,$('#sweets-menu')]){
 dialog.querySelector('.dialog-close').onclick=()=>dialog.close();
 dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const b=dialog.getBoundingClientRect();if(event.clientX<b.left||event.clientX>b.right||event.clientY<b.top||event.clientY>b.bottom)dialog.close();});
}
for(const [index,colour] of colours.entries()){
 const button=document.createElement('button');button.className='swatch';button.style.background=colour.colour;button.setAttribute('aria-label',colour.name);button.title=colour.name;
 button.onclick=()=>{for(const item of activeItems())item.setColour(index);updateColourUI();invalidate();};$('#colours').append(button);
}
for(const button of document.querySelectorAll('[data-view]'))button.onclick=()=>setView(button.dataset.view);
$('#night').onclick=()=>{state.night=!state.night;$('#night').setAttribute('aria-pressed',String(state.night));$('#night').innerHTML=state.night?'Day <span>☀</span>':'Night <span>☾</span>';invalidate();};
$('#turntable').onclick=()=>{state.auto=!state.auto;controls.autoRotate=state.active!=='collection'&&state.auto;$('#turntable').setAttribute('aria-pressed',String(state.auto));invalidate();};
$('#labels-button').onclick=()=>{state.labels=!state.labels;$('#labels-button').setAttribute('aria-pressed',String(state.labels));$('#labels').setAttribute('aria-hidden',String(!state.labels));invalidate();};
const partLabels=[];
for(const item of Object.values(items))for(const [text,point,visibleWhen] of item.labels){const element=document.createElement('div');element.className='part-label';element.textContent=text;$('#labels').append(element);partLabels.push({element,item,point:typeof point==='function'?point:new THREE.Vector3(...point),visibleWhen});}
function zoomTo(value){state.zoomGoal=THREE.MathUtils.clamp(value,controls.minZoom,3.2);invalidate();}
$('#zoom-in').onclick=()=>zoomTo((state.zoomGoal??camera.zoom)+.15);$('#zoom-out').onclick=()=>zoomTo((state.zoomGoal??camera.zoom)-.15);
// The wheel scrolls the page; zoom is on the − / + buttons only.
controls.addEventListener('start',()=>{state.zoomGoal=null;stopTurntable();$('#tooltip').style.display='none';document.querySelectorAll('[data-view]').forEach(button=>{button.classList.remove('selected');button.setAttribute('aria-pressed','false');});});
controls.addEventListener('change',invalidate);
const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();
function pick(event){
 const bounds=host.getBoundingClientRect();pointer.set((event.clientX-bounds.left)/bounds.width*2-1,-(event.clientY-bounds.top)/bounds.height*2+1);
 scene.updateMatrixWorld(true);ray.setFromCamera(pointer,camera);
 for(const hit of ray.intersectObjects(activeItems().map(item=>item.wrapper),true)){
  if(!hit.object.isMesh||hit.object.isLineSegments2||!hit.object.material?.visible||hit.object.material.transparent)continue;
  let visible=true;for(let ancestor=hit.object;ancestor;ancestor=ancestor.parent)if(!ancestor.visible){visible=false;break;}if(!visible)continue;
  let object=hit.object,action=null,target=null,id=null;
  while(object){if(!action&&object.userData.action){action=object.userData.action;target=object;}if(object.userData.buildingId)id=object.userData.buildingId;object=object.parent;}
  if(id)return {id,action,target};
 }
 return null;
}
host.addEventListener('pointerdown',event=>{
 gesture={x:event.clientX,y:event.clientY,lastX:event.clientX,distance:0,id:event.pointerId,type:event.pointerType,buildingId:null,axis:null};
 if(state.active==='collection'){gesture.buildingId=pick(event)?.id??null;carousel.hold(gesture.buildingId);carousel.state.touching=event.pointerType==='touch';host.setPointerCapture(event.pointerId);invalidate();}
});
host.addEventListener('pointermove',event=>{
 if(gesture){
  gesture.distance=Math.max(gesture.distance,Math.hypot(event.clientX-gesture.x,event.clientY-gesture.y));
  if(state.active==='collection'&&event.pointerId===gesture.id){
   const dx=event.clientX-gesture.lastX;
   if(!gesture.axis&&gesture.distance>7)gesture.axis=Math.abs(event.clientX-gesture.x)>Math.abs(event.clientY-gesture.y)?'x':'y';
   if(gesture.type==='touch'&&gesture.axis==='x'){carousel.scrub(dx);updateCruiseButton();}
   else if(gesture.type!=='touch'&&gesture.buildingId&&gesture.distance>5)carousel.dragRotation(gesture.buildingId,dx);
   gesture.lastX=event.clientX;invalidate();
  }
 }
 if(event.buttons||event.pointerType==='touch'){hover=null;setHovered(null);$('#tooltip').style.display='none';return;}
 restingPointer={clientX:event.clientX,clientY:event.clientY};hover=pick(event);setHovered(state.active==='collection'&&hover?hover.id:null);const actionable=!!hover&&(!!hover.action||state.active==='collection');renderer.domElement.style.cursor=actionable?'pointer':'grab';
 const tooltip=$('#tooltip');tooltip.style.display=actionable?'block':'none';
 if(actionable){tooltip.textContent=hover.action==='tramTravel'?'Arrival / departure · close doors first':hover.action==='tramDoors'?'Open / close tram doors':hover.action==='tramTicket'?'Buy a ticket':hover.action==='postDoor'?(state.postDoorOpen?'Close the post office door':'Step inside the post office'):hover.action==='postLetter'?'Post a letter':hover.action==='postParcel'?'Send this parcel':hover.action==='laundryDoor'?(state.laundryDoorOpen?'Close the laundry door':'Step inside the laundry'):hover.action==='laundryWash'?(state.laundryWashing?'Stop the machine':'Start washing'):hover.action==='laundryMachineDoor'?(state.laundryWashing?'Stop the machine first':state.machineDoorOpen?'Close the porthole':'Open the porthole'):hover.action==='laundryVend'?'Buy a bottle of detergent':hover.action==='pizzaDoor'?(state.pizzaDoorOpen?'Close the pizzeria door':'Step inside for a slice'):hover.action==='pizzaOven'?(state.pizzaOven?'Let the oven rest':'Fire up the oven'):hover.action==='pizzaBox'?(state.pizzaBoxOpen?'Close the box':'Peek inside the box'):hover.action==='booksDoor'?(state.booksDoorOpen?'Close the bookshop door':'Step inside the bookshop'):hover.action==='booksOpen'?(state.bookOpen?'Close the book':'Open today\'s pick'):hover.action==='sweetsDoor'?(state.sweetsDoorOpen?'Close the dessert shop door':'Step inside for something sweet'):hover.action==='sweetsMenu'?'See the dessert menu':hover.action==='flowerDoor'?(state.flowerDoorOpen?'Close the shop door':'Step inside the flower shop'):hover.action==='flowerVent'?(state.ventOpen?'Close the glasshouse vent':'Let the glasshouse breathe'):hover.action==='flowerPick'?(state.bouquetTaken?'Put the bouquet back':'Pick a fresh bouquet'):hover.action==='bakeryDoor'?(state.bakeryDoorOpen?'Close the bakery door':'Step inside the bakery'):hover.action==='bakeryTake'?(state.breadTaken?'Put your bread back':'Take a warm loaf home'):hover.action==='door'?(state.doorOpen?'Close the café door':'Step inside the café'):hover.action==='menu'?'Explore the café menu':hover.action==='shutter'?(state.shutterOpen?'Close the grocery shutter':'Open the grocery'):`Explore ${items[hover.id].title} ↗`;tooltip.style.left=`${Math.max(8,Math.min(event.clientX+12,innerWidth-240))}px`;tooltip.style.top=`${Math.max(8,event.clientY-36)}px`;}
 if(actionable&&state.active==='collection')tooltip.textContent=`Explore ${items[hover.id].title} ↗`;
 invalidate();
});
host.addEventListener('pointerup',event=>{
 const isClick=gesture&&gesture.id===event.pointerId&&gesture.distance<6&&Math.hypot(event.clientX-gesture.x,event.clientY-gesture.y)<6;gesture=null;carousel.release();if(host.hasPointerCapture(event.pointerId))host.releasePointerCapture(event.pointerId);
 if(!isClick)return;const result=pick(event);if(!result)return;
 if(state.active==='collection'){openExplorer(result.id);return;}
 if(result.action==='tramTravel')travelTram();else if(result.action==='tramDoors')doorsTram();else if(result.action==='tramTicket')ticketTram();else if(result.action==='postDoor')togglePostDoor();else if(result.action==='postLetter')sendLetter();else if(result.action==='postParcel')deliverParcel();else if(result.action==='laundryDoor')toggleLaundryDoor();else if(result.action==='laundryWash')toggleWashing();else if(result.action==='laundryMachineDoor')toggleMachineDoor();else if(result.action==='laundryVend')buyDetergent();else if(result.action==='pizzaDoor')togglePizzaDoor();else if(result.action==='pizzaOven')togglePizzaOven();else if(result.action==='pizzaBox')togglePizzaBox();else if(result.action==='booksDoor')toggleBooksDoor();else if(result.action==='booksOpen')toggleBook();else if(result.action==='sweetsDoor')toggleSweetsDoor();else if(result.action==='sweetsMenu')showSweetsMenu();else if(result.action==='flowerDoor')toggleFlowerDoor();else if(result.action==='flowerVent')toggleVent();else if(result.action==='flowerPick')pickBouquet();else if(result.action==='bakeryDoor')toggleBakeryDoor();else if(result.action==='bakeryTake')takeBread();else if(result.action==='door')toggleDoor();else if(result.action==='shutter')toggleShutter();else if(result.action==='menu')showMenu();else if(state.active==='collection')select(result.id);
});
host.addEventListener('pointercancel',()=>{gesture=null;carousel.release();invalidate();});host.addEventListener('pointerleave',()=>{hover=null;restingPointer=null;setHovered(null);$('#tooltip').style.display='none';invalidate();});
function project(point){return point.clone().project(camera);}
function renderOverlays(){
 if(state.active==='collection')for(const item of Object.values(items)){
  const point=project(item.carrier.localToWorld(new THREE.Vector3(0,-4.2,0)));const element=$(`[data-focus=${item.id}]`);
  const x=(point.x+1)*host.clientWidth/2;
  element.hidden=!item.onStage||point.x< -1.25||point.x>1.25||point.z<-1||point.z>1;
  if(element.hidden)continue;
  element.style.left=`${x+host.offsetLeft}px`;
  element.style.top='auto';element.style.bottom=compactCollection()?'68px':'62px';

 }
 if(state.labels)for(const {element,item,point,visibleWhen} of partLabels){
  element.hidden=!item.wrapper.visible||(visibleWhen&&!visibleWhen());if(element.hidden)continue;
  const p=project(item.model.group.localToWorld(typeof point==='function'?point():point.clone()));
  element.style.left=`${Math.max(9,Math.min((p.x+1)*host.clientWidth/2+10,host.clientWidth-element.offsetWidth-9))+host.offsetLeft}px`;
  element.style.top=`${Math.max(22,Math.min((1-p.y)*host.clientHeight/2-18,host.clientHeight-22))+host.offsetTop}px`;
  element.hidden=p.z<-1||p.z>1||p.x<-.98||p.x>.98||p.y<-.98||p.y>.98;
 }
}
const clock=new THREE.Clock();
renderer.setAnimationLoop(()=>{
 const dt=Math.min(clock.getDelta(),.05);
 explorer?.frame(dt);
 if(document.hidden||!collectionVisible)return;
 const changed=controls.update(dt);
 configureCarousel();
 let movingHover=false;
 for(const item of Object.values(items)){const goal=state.active==='collection'&&state.hoveredId===item.id?1:0,a=item.hoverAmount||0;if(a!==goal){item.hoverAmount=reducedMotion.matches||Math.abs(a-goal)<.002?goal:THREE.MathUtils.damp(a,goal,10,dt);movingHover=true;}}
 const movingCarousel=state.active==='collection'&&carousel.step(dt,{reduced:reducedMotion.matches,rotate:state.auto,blocked:!!document.querySelector('dialog[open]')});
 if(movingCarousel&&restingPointer&&!gesture&&(hoverCheck+=dt)>.12){hoverCheck=0;const hit=pick(restingPointer);setHovered(hit?.id??null);}
 const movingDoor=Math.abs(items.cafe.model.door.hinge.rotation.y-(state.doorOpen?-Math.PI*.58:0))>.0001;
 const movingShutter=Math.abs(state.shutterAmount-(state.shutterOpen?1:0))>.0001;
 const bakery=items.bakery.model;
 const movingBakeryDoor=Math.abs(bakery.door.hinge.rotation.y-(state.bakeryDoorOpen?-Math.PI*.56:0))>.0001;
 const bagTarget=state.breadTaken?bakery.pickupAway:bakery.pickupHome;
 const movingBag=bakery.pickup.position.distanceToSquared(bagTarget)>.000001;
 const flowers=items.flowers.model,flowerDoorGoal=state.flowerDoorOpen?-Math.PI*.56:0,ventGoal=state.ventOpen?1:0;
 const bouquetTarget=state.bouquetTaken?flowers.pickAway:flowers.pickHome;
 const movingFlowers=Math.abs(flowers.door.hinge.rotation.y-flowerDoorGoal)>.0001||Math.abs(state.ventAmount-ventGoal)>.0001||flowers.pickup.position.distanceToSquared(bouquetTarget)>.000001;
 const movingSweets=items.sweets.model.update(dt);
 const booksModel=items.books.model,booksDoorGoal=state.booksDoorOpen?1:0,bookGoal=state.bookOpen?1:0;
 const pizzaModel=items.pizza.model,pizzaDoorGoal=state.pizzaDoorOpen?1:0,pizzaBoxGoal=state.pizzaBoxOpen?1:0;
 const laundryModel=items.laundry.model,laundryDoorGoal=state.laundryDoorOpen?1:0,machineDoorGoal=state.machineDoorOpen?1:0;
 const movingLaundry=Math.abs(state.laundryDoorAmount-laundryDoorGoal)>.0005||Math.abs(state.machineDoorAmount-machineDoorGoal)>.0005;
 const postModel=items.post.model,postDoorGoal=state.postDoorOpen?1:0,movingPost=Math.abs(state.postDoorAmount-postDoorGoal)>.0005;
 const movingPizza=Math.abs(state.pizzaDoorAmount-pizzaDoorGoal)>.0005||Math.abs(state.pizzaBoxAmount-pizzaBoxGoal)>.0005;
 const movingBooks=Math.abs(state.booksDoorAmount-booksDoorGoal)>.0005||Math.abs(state.bookAmount-bookGoal)>.0005;
 // Ambient animation (drums, trams, steam): only for places on screen, never with the tab hidden or reduced motion.
 let ambient=false;
 if(!document.hidden&&!reducedMotion.matches){const first=state.collectionPage,count=compactCollection()?1:4;
  activeItems().forEach((item,i)=>{if(!item.onStage)return;if(item.model.animate?.(dt,clock.elapsedTime))ambient=true;});}
 updateTramActions();
 const nightGoal=state.night?1:0,movingNight=Math.abs(state.nightAmount-nightGoal)>.001;
 const shiftGoal=state.collectionShift,movingGallery=Math.abs(state.singleSlide)>.001;
 if(!dirty&&!changed&&!movingHover&&!movingBakeryDoor&&!movingBag&&!movingFlowers&&!movingSweets&&!movingBooks&&!movingPizza&&!movingLaundry&&!movingPost&&!movingDoor&&!movingShutter&&!movingGallery&&!movingCarousel&&!ambient&&!movingNight&&state.zoomGoal===null&&!state.auto)return;
 dirty=false;
 state.collectionShift=reducedMotion.matches?shiftGoal:THREE.MathUtils.damp(state.collectionShift,shiftGoal,7,dt);
 state.singleSlide=reducedMotion.matches?0:THREE.MathUtils.damp(state.singleSlide,0,9,dt);
 if(Math.abs(state.collectionShift-shiftGoal)<.001)state.collectionShift=shiftGoal;
 if(Math.abs(state.singleSlide)<.001)state.singleSlide=0;
 state.nightAmount=reducedMotion.matches?nightGoal:THREE.MathUtils.damp(state.nightAmount,nightGoal,5,dt);if(Math.abs(state.nightAmount-nightGoal)<.002)state.nightAmount=nightGoal;
 if(state.nightAmount!==nightShown){const t=nightShown=state.nightAmount;
  mixColour(DAY.bg,NIGHT.bg,t,scene.background);mixColour(DAY.ground,NIGHT.ground,t,ground.material.color);
  mixColour(DAY.sky,NIGHT.sky,t,hemi.color);mixColour(DAY.earth,NIGHT.earth,t,hemi.groundColor);hemi.intensity=THREE.MathUtils.lerp(DAY.hemi,NIGHT.hemi,t);
  mixColour(DAY.sun,NIGHT.sun,t,light.color);light.intensity=THREE.MathUtils.lerp(DAY.dir,NIGHT.dir,t);
  for(const item of Object.values(items)){for(const m of item.shadowMaterials)mixColour(DAY.shadow,NIGHT.shadow,t,m.color);item.model.setNight?.(t);}}
 if(state.zoomGoal!==null){camera.zoom=reducedMotion.matches?state.zoomGoal:THREE.MathUtils.damp(camera.zoom,state.zoomGoal,12,dt);if(Math.abs(camera.zoom-state.zoomGoal)<.001){camera.zoom=state.zoomGoal;state.zoomGoal=null;}camera.updateProjectionMatrix();}
 items.cafe.model.door.hinge.rotation.y=reducedMotion.matches?(state.doorOpen?-Math.PI*.58:0):THREE.MathUtils.damp(items.cafe.model.door.hinge.rotation.y,state.doorOpen?-Math.PI*.58:0,9,dt);
 state.shutterAmount=reducedMotion.matches?(state.shutterOpen?1:0):THREE.MathUtils.damp(state.shutterAmount,state.shutterOpen?1:0,7,dt);items.grocery.model.storefront.setOpen(state.shutterAmount);
 bakery.door.hinge.rotation.y=reducedMotion.matches?(state.bakeryDoorOpen?-Math.PI*.56:0):THREE.MathUtils.damp(bakery.door.hinge.rotation.y,state.bakeryDoorOpen?-Math.PI*.56:0,9,dt);
 bakery.pickup.position.lerp(bagTarget,reducedMotion.matches?1:1-Math.exp(-8*dt));if(!movingBag)bakery.pickup.position.copy(bagTarget);
 state.postDoorAmount=reducedMotion.matches?postDoorGoal:THREE.MathUtils.damp(state.postDoorAmount,postDoorGoal,8,dt);if(Math.abs(state.postDoorAmount-postDoorGoal)<.001)state.postDoorAmount=postDoorGoal;postModel.setDoor(state.postDoorAmount);
 state.laundryDoorAmount=reducedMotion.matches?laundryDoorGoal:THREE.MathUtils.damp(state.laundryDoorAmount,laundryDoorGoal,8,dt);if(Math.abs(state.laundryDoorAmount-laundryDoorGoal)<.001)state.laundryDoorAmount=laundryDoorGoal;laundryModel.setDoor(state.laundryDoorAmount);
 state.machineDoorAmount=reducedMotion.matches?machineDoorGoal:THREE.MathUtils.damp(state.machineDoorAmount,machineDoorGoal,7,dt);if(Math.abs(state.machineDoorAmount-machineDoorGoal)<.001)state.machineDoorAmount=machineDoorGoal;laundryModel.setMachineDoor(state.machineDoorAmount);
 state.pizzaDoorAmount=reducedMotion.matches?pizzaDoorGoal:THREE.MathUtils.damp(state.pizzaDoorAmount,pizzaDoorGoal,8,dt);if(Math.abs(state.pizzaDoorAmount-pizzaDoorGoal)<.001)state.pizzaDoorAmount=pizzaDoorGoal;pizzaModel.setDoor(state.pizzaDoorAmount);
 state.pizzaBoxAmount=reducedMotion.matches?pizzaBoxGoal:THREE.MathUtils.damp(state.pizzaBoxAmount,pizzaBoxGoal,6,dt);if(Math.abs(state.pizzaBoxAmount-pizzaBoxGoal)<.001)state.pizzaBoxAmount=pizzaBoxGoal;pizzaModel.setBox(state.pizzaBoxAmount);
 state.booksDoorAmount=reducedMotion.matches?booksDoorGoal:THREE.MathUtils.damp(state.booksDoorAmount,booksDoorGoal,8,dt);if(Math.abs(state.booksDoorAmount-booksDoorGoal)<.001)state.booksDoorAmount=booksDoorGoal;booksModel.setDoor(state.booksDoorAmount);
 state.bookAmount=reducedMotion.matches?bookGoal:THREE.MathUtils.damp(state.bookAmount,bookGoal,4,dt);if(Math.abs(state.bookAmount-bookGoal)<.001)state.bookAmount=bookGoal;booksModel.setBook?.(state.bookAmount);
 flowers.door.hinge.rotation.y=reducedMotion.matches?flowerDoorGoal:THREE.MathUtils.damp(flowers.door.hinge.rotation.y,flowerDoorGoal,9,dt);
 state.ventAmount=reducedMotion.matches?ventGoal:THREE.MathUtils.damp(state.ventAmount,ventGoal,7,dt);if(Math.abs(state.ventAmount-ventGoal)<.0005)state.ventAmount=ventGoal;flowers.setVent(state.ventAmount);
 flowers.pickup.position.lerp(bouquetTarget,reducedMotion.matches?1:1-Math.exp(-8*dt));if(flowers.pickup.position.distanceToSquared(bouquetTarget)<.000001)flowers.pickup.position.copy(bouquetTarget);
 for(const item of Object.values(items))for(const {object,source,target} of item.hoverMaterials){object.material.color.copy(source.color);object.material.emissive.setHex(hover?.target===target?0x24190c:0);}
 layout();scene.updateMatrixWorld(true);renderOverlays();$('#zoom-value').value=`${Math.round(camera.zoom*100)}%`;
 renderer.render(scene,camera);frames++;
});
new ResizeObserver(resize).observe(host);
window.addEventListener('hashchange',()=>{if(!location.hash.startsWith('#explore/'))select(location.hash.slice(1)||'collection',{writeHash:false});});
select(['cafe','grocery','bakery','flowers','sweets','books','pizza','laundry','post','tram'].includes(location.hash.slice(1))?location.hash.slice(1):'collection',{writeHash:false});
$('#loading').hidden=true;
window.__series={items,state,scene,camera,controls,renderer,select,setView,collectionShiftGoal,railLayout,carousel,horizontalMotion,invalidate,get frames(){return frames;}};

explorer=createExplorer({collectionItems:items,reducedMotion});
window.__explorer=explorer;
