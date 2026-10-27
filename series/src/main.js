import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createCollection, colours } from './collection.js';
import './style.css';

const $=selector=>document.querySelector(selector);
const host=$('#scene');
const state={active:'collection',doorOpen:false,shutterOpen:false,shutterAmount:0,labels:false,auto:false,view:'iso',zoomGoal:null,bakeryDoorOpen:false,pastriesVisible:true,seeThrough:false,breadTaken:false,flowerDoorOpen:false,ventOpen:false,ventAmount:0,bouquetTaken:false,sweetsDoorOpen:false,booksDoorOpen:false,booksDoorAmount:0,booksLights:true,bookOpen:false,bookAmount:0};
let dirty=true,frames=0,hover=null,gesture=null;
const invalidate=()=>{dirty=true;};
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;
host.append(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color('#F7F3E9');
scene.add(new THREE.HemisphereLight(0xffffff,0xc3b59e,1.8));
const light=new THREE.DirectionalLight(0xffffff,1.4);light.position.set(-3,12,8);scene.add(light);
const camera=new THREE.OrthographicCamera(-12,12,6,-6,.1,200);
camera.position.set(14,16,14);
const controls=new OrbitControls(camera,renderer.domElement);
controls.enablePan=false;controls.enableDamping=true;controls.dampingFactor=.09;controls.rotateSpeed=.6;
controls.minZoom=.65;controls.maxZoom=2.2;controls.minPolarAngle=.4;controls.maxPolarAngle=1.47;
controls.autoRotateSpeed=.45;
const items=createCollection();
Object.values(items).forEach(item=>scene.add(item.wrapper));
const ground=new THREE.Mesh(new THREE.PlaneGeometry(180,180),new THREE.MeshBasicMaterial({color:'#F7F3E9'}));
ground.rotation.x=-Math.PI/2;ground.position.y=-.6;scene.add(ground);
const right=new THREE.Vector3(),up=new THREE.Vector3();
const stackedOverview=()=>innerWidth<=650&&state.active==='collection';
const activeItems=()=>state.active==='collection'?Object.values(items):[items[state.active]];
function layout(){
 const overview=state.active==='collection';
 const delta=camera.position.clone().sub(controls.target);
 right.set(delta.z,0,-delta.x).normalize();
 up.crossVectors(delta.normalize(),right).normalize();
 ground.visible=!stackedOverview();
 for(const [index,item] of Object.values(items).entries()){
  item.wrapper.visible=overview||state.active===item.id;
  // four places side by side (or stacked on phones), centred on the middle gap
  const middle=(Object.keys(items).length-1)/2;
  item.wrapper.scale.setScalar(stackedOverview()?[.78,.68,.98,.92,.7,.86][index]:overview?item.scale:1);
  if(stackedOverview())item.wrapper.position.copy(up).multiplyScalar((middle-index)*10.8);
  else item.wrapper.position.copy(right).multiplyScalar(overview?(index-middle)*11.4:0);
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
 const vertical=item?item.span:stackedOverview()?count*11:13.4,horizontal=item?item.width:stackedOverview()?11.8:count*11.4+3;
 const span=Math.max(vertical,horizontal/aspect);
 camera.left=-span*aspect/2;camera.right=span*aspect/2;camera.top=span/2;camera.bottom=-span/2;
 camera.clearViewOffset();camera.updateProjectionMatrix();
 for(const item of Object.values(items))for(const material of item.lines)material.resolution.set(w,h);
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
 else camera.position.set(14,pivot+12.6,14);
 camera.zoom=1;camera.updateProjectionMatrix();controls.update();controls.saveState();controls.enableDamping=true;
 document.querySelectorAll('[data-view]').forEach(button=>{const selected=button.dataset.view===view;button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected));});
 layout();invalidate();
}
function updateColourUI(){
 const indices=activeItems().map(item=>item.colourIndex);
 const same=indices.every(index=>index===indices[0]);
 document.querySelectorAll('.swatch').forEach((button,index)=>button.setAttribute('aria-pressed',String(same&&indices[0]===index)));
 $('#colour-name').textContent=same?colours[indices[0]].name:'Your own mix';
}
function updateActions(){
 $('#door').hidden=!['collection','cafe'].includes(state.active);$('#menu-button').hidden=$('#door').hidden;$('#shutter').hidden=!['collection','grocery'].includes(state.active);
 for(const id of ['bakery-door','pastries','take-bread'])$('#'+id).hidden=state.active!=='bakery';
 for(const id of ['flower-door','vent','pick-bouquet'])$('#'+id).hidden=state.active!=='flowers';
 $('#see-through').hidden=!['bakery','flowers','books'].includes(state.active);
 for(const id of ['sweets-door','sweets-menu-button'])$('#'+id).hidden=state.active!=='sweets';
 for(const id of ['books-door','books-lights','books-book'])$('#'+id).hidden=state.active!=='books';
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
function select(id,{writeHash=true}={}){
 if(id!=='collection'&&!items[id])return;
 state.active=id;$('#exhibition').dataset.mode=id;hover=null;$('#tooltip').style.display='none';
 const overview=id==='collection';
 document.querySelectorAll('[data-building]').forEach(button=>{const selected=button.dataset.building===id;button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;});
 $('#exhibition').setAttribute('aria-labelledby',`tab-${id}`);
 $('#building-captions').hidden=!overview;
 $('#stage-caption').textContent=overview?'THE COMPLETE COLLECTION':`${items[id].number} / ${items[id].title.toUpperCase()} · ${items[id].native}`;
 $('#object-description').textContent=overview?'01 Café  +  02 Grocery  +  03 Bakery  +  04 Flowers  +  05 Sweets  +  06 Bookshop':`${items[id].number} / ${items[id].description}`;
 $('#action-hint').textContent=overview?'Pick a place. Make yourself at home.':id==='cafe'?'A door to open. A menu to linger over.':id==='bakery'?'Fresh from the oven. Made for you.':id==='flowers'?'Fresh blooms. A glasshouse on the roof.':id==='sweets'?'A door to open. Something sweet inside.':id==='books'?'Shelves to browse. A roof to read on.':'Everyday goods & four little capsule machines.';
 if(writeHash)history.replaceState(null,'',`#${id}`);
 updateActions();updateColourUI();setView('iso');resize();
 if(id!=='cafe'&&id!=='collection'&&$('#cafe-menu').open)$('#cafe-menu').close();
 if(id!=='sweets'&&$('#sweets-menu').open)$('#sweets-menu').close();
}
for(const button of document.querySelectorAll('[data-building]'))button.onclick=()=>select(button.dataset.building);
for(const button of document.querySelectorAll('[data-focus]'))button.onclick=()=>select(button.dataset.focus);
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
$('#see-through').onclick=()=>{state.seeThrough=!state.seeThrough;items.bakery.model.setSeeThrough(state.seeThrough);items.flowers.model.setSeeThrough(state.seeThrough);items.books.model.setSeeThrough(state.seeThrough);updateActions();invalidate();};
function toggleFlowerDoor(){state.flowerDoorOpen=!state.flowerDoorOpen;updateActions();invalidate();}
function toggleVent(){state.ventOpen=!state.ventOpen;updateActions();invalidate();}
function pickBouquet(){state.bouquetTaken=!state.bouquetTaken;$('#action-hint').textContent=state.bouquetTaken?'A fresh bunch, just for you.':'Back on the workbench, still fresh.';updateActions();invalidate();}
function toggleSweetsDoor(){state.sweetsDoorOpen=!state.sweetsDoorOpen;items.sweets.model.toggleDoor();updateActions();invalidate();}
const showSweetsMenu=()=>{const d=$('#sweets-menu');if(!d.open)d.showModal();};
function toggleBooksDoor(){state.booksDoorOpen=!state.booksDoorOpen;updateActions();invalidate();}
function toggleBooksLights(){state.booksLights=!state.booksLights;items.books.model.setLights(state.booksLights);updateActions();invalidate();}
function toggleBook(){state.bookOpen=!state.bookOpen;updateActions();invalidate();}
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
$('#turntable').onclick=()=>{state.auto=!state.auto;controls.autoRotate=state.auto;$('#turntable').setAttribute('aria-pressed',String(state.auto));invalidate();};
$('#labels-button').onclick=()=>{state.labels=!state.labels;$('#labels-button').setAttribute('aria-pressed',String(state.labels));$('#labels').setAttribute('aria-hidden',String(!state.labels));invalidate();};
const partLabels=[];
for(const item of Object.values(items))for(const [text,point,visibleWhen] of item.labels){const element=document.createElement('div');element.className='part-label';element.textContent=text;$('#labels').append(element);partLabels.push({element,item,point:typeof point==='function'?point:new THREE.Vector3(...point),visibleWhen});}
function zoomTo(value){state.zoomGoal=THREE.MathUtils.clamp(value,.65,2.2);invalidate();}
$('#zoom-in').onclick=()=>zoomTo((state.zoomGoal??camera.zoom)+.15);$('#zoom-out').onclick=()=>zoomTo((state.zoomGoal??camera.zoom)-.15);
renderer.domElement.addEventListener('wheel',event=>{event.preventDefault();event.stopImmediatePropagation();const units=event.deltaMode===1?16:event.deltaMode===2?host.clientHeight:1;zoomTo((state.zoomGoal??camera.zoom)*Math.exp(-event.deltaY*units*.001));},{capture:true,passive:false});
controls.addEventListener('start',()=>{state.zoomGoal=null;stopTurntable();$('#tooltip').style.display='none';document.querySelectorAll('[data-view]').forEach(button=>{button.classList.remove('selected');button.setAttribute('aria-pressed','false');});});
controls.addEventListener('change',invalidate);
const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();
function pick(event){
 const bounds=host.getBoundingClientRect();pointer.set((event.clientX-bounds.left)/bounds.width*2-1,-(event.clientY-bounds.top)/bounds.height*2+1);
 scene.updateMatrixWorld(true);ray.setFromCamera(pointer,camera);
 for(const hit of ray.intersectObjects(activeItems().map(item=>item.wrapper),true)){
  if(!hit.object.isMesh||hit.object.isLineSegments2||!hit.object.material?.visible)continue;
  let visible=true;for(let ancestor=hit.object;ancestor;ancestor=ancestor.parent)if(!ancestor.visible){visible=false;break;}if(!visible)continue;
  let object=hit.object,action=null,target=null,id=null;
  while(object){if(!action&&object.userData.action){action=object.userData.action;target=object;}if(object.userData.buildingId)id=object.userData.buildingId;object=object.parent;}
  if(id)return {id,action,target};
 }
 return null;
}
host.addEventListener('pointerdown',event=>{gesture={x:event.clientX,y:event.clientY,distance:0,id:event.pointerId};});
host.addEventListener('pointermove',event=>{
 if(gesture)gesture.distance=Math.max(gesture.distance,Math.hypot(event.clientX-gesture.x,event.clientY-gesture.y));
 if(event.buttons||event.pointerType==='touch'){hover=null;$('#tooltip').style.display='none';return;}
 hover=pick(event);const actionable=!!hover&&(!!hover.action||state.active==='collection');renderer.domElement.style.cursor=actionable?'pointer':'grab';
 const tooltip=$('#tooltip');tooltip.style.display=actionable?'block':'none';
 if(actionable){tooltip.textContent=hover.action==='booksDoor'?(state.booksDoorOpen?'Close the bookshop door':'Step inside the bookshop'):hover.action==='booksOpen'?(state.bookOpen?'Close the book':'Open today\'s pick'):hover.action==='sweetsDoor'?(state.sweetsDoorOpen?'Close the dessert shop door':'Step inside for something sweet'):hover.action==='sweetsMenu'?'See the dessert menu':hover.action==='flowerDoor'?(state.flowerDoorOpen?'Close the shop door':'Step inside the flower shop'):hover.action==='flowerVent'?(state.ventOpen?'Close the glasshouse vent':'Let the glasshouse breathe'):hover.action==='flowerPick'?(state.bouquetTaken?'Put the bouquet back':'Pick a fresh bouquet'):hover.action==='bakeryDoor'?(state.bakeryDoorOpen?'Close the bakery door':'Step inside the bakery'):hover.action==='bakeryTake'?(state.breadTaken?'Put your bread back':'Take a warm loaf home'):hover.action==='door'?(state.doorOpen?'Close the café door':'Step inside the café'):hover.action==='menu'?'Explore the café menu':hover.action==='shutter'?(state.shutterOpen?'Close the grocery shutter':'Open the grocery'):`Explore ${items[hover.id].title} ↗`;tooltip.style.left=`${Math.max(8,Math.min(event.clientX+12,innerWidth-240))}px`;tooltip.style.top=`${Math.max(8,event.clientY-36)}px`;}
 invalidate();
});
host.addEventListener('pointerup',event=>{
 const isClick=gesture&&gesture.id===event.pointerId&&gesture.distance<6&&Math.hypot(event.clientX-gesture.x,event.clientY-gesture.y)<6;gesture=null;
 if(!isClick)return;const result=pick(event);if(!result)return;
 if(result.action==='booksDoor')toggleBooksDoor();else if(result.action==='booksOpen')toggleBook();else if(result.action==='sweetsDoor')toggleSweetsDoor();else if(result.action==='sweetsMenu')showSweetsMenu();else if(result.action==='flowerDoor')toggleFlowerDoor();else if(result.action==='flowerVent')toggleVent();else if(result.action==='flowerPick')pickBouquet();else if(result.action==='bakeryDoor')toggleBakeryDoor();else if(result.action==='bakeryTake')takeBread();else if(result.action==='door')toggleDoor();else if(result.action==='shutter')toggleShutter();else if(result.action==='menu')showMenu();else if(state.active==='collection')select(result.id);
});
host.addEventListener('pointercancel',()=>gesture=null);host.addEventListener('pointerleave',()=>{hover=null;$('#tooltip').style.display='none';invalidate();});
function project(point){return point.clone().project(camera);}
function renderOverlays(){
 if(state.active==='collection')for(const item of Object.values(items)){
  const point=project(item.wrapper.localToWorld(new THREE.Vector3(.2,-4.2,0)));const element=$(`[data-focus=${item.id}]`);
  const x=(point.x+1)*host.clientWidth/2;
  element.style.left=`${Math.max(77,Math.min(x,host.clientWidth-77))+host.offsetLeft}px`;
  if(stackedOverview()){
    element.style.top=`${(1-point.y)*host.clientHeight/2+host.offsetTop+5}px`;element.style.bottom='auto';
  }else{element.style.top='auto';element.style.bottom='62px';}

 }
 if(state.labels)for(const {element,item,point,visibleWhen} of partLabels){
  element.hidden=!item.wrapper.visible||(visibleWhen&&!visibleWhen());if(element.hidden)continue;
  const p=project(item.model.group.localToWorld(typeof point==='function'?point():point.clone()));
  element.style.left=`${Math.max(9,Math.min((p.x+1)*host.clientWidth/2+10,host.clientWidth-element.offsetWidth-9))+host.offsetLeft}px`;
  element.style.top=`${Math.max(22,Math.min((1-p.y)*host.clientHeight/2-18,host.clientHeight-22))+host.offsetTop}px`;
  element.hidden=p.z<-1||p.z>1;
 }
}
const clock=new THREE.Clock();
renderer.setAnimationLoop(()=>{
 const dt=Math.min(clock.getDelta(),.05),changed=controls.update(dt);
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
 const movingBooks=Math.abs(state.booksDoorAmount-booksDoorGoal)>.0005||Math.abs(state.bookAmount-bookGoal)>.0005;
 if(!dirty&&!changed&&!movingBakeryDoor&&!movingBag&&!movingFlowers&&!movingSweets&&!movingBooks&&!movingDoor&&!movingShutter&&state.zoomGoal===null&&!state.auto)return;
 dirty=false;
 if(state.zoomGoal!==null){camera.zoom=reducedMotion.matches?state.zoomGoal:THREE.MathUtils.damp(camera.zoom,state.zoomGoal,12,dt);if(Math.abs(camera.zoom-state.zoomGoal)<.001){camera.zoom=state.zoomGoal;state.zoomGoal=null;}camera.updateProjectionMatrix();}
 items.cafe.model.door.hinge.rotation.y=reducedMotion.matches?(state.doorOpen?-Math.PI*.58:0):THREE.MathUtils.damp(items.cafe.model.door.hinge.rotation.y,state.doorOpen?-Math.PI*.58:0,9,dt);
 state.shutterAmount=reducedMotion.matches?(state.shutterOpen?1:0):THREE.MathUtils.damp(state.shutterAmount,state.shutterOpen?1:0,7,dt);items.grocery.model.storefront.setOpen(state.shutterAmount);
 bakery.door.hinge.rotation.y=reducedMotion.matches?(state.bakeryDoorOpen?-Math.PI*.56:0):THREE.MathUtils.damp(bakery.door.hinge.rotation.y,state.bakeryDoorOpen?-Math.PI*.56:0,9,dt);
 bakery.pickup.position.lerp(bagTarget,reducedMotion.matches?1:1-Math.exp(-8*dt));if(!movingBag)bakery.pickup.position.copy(bagTarget);
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
window.addEventListener('hashchange',()=>select(location.hash.slice(1)||'collection',{writeHash:false}));
select(['cafe','grocery','bakery','flowers','sweets','books'].includes(location.hash.slice(1))?location.hash.slice(1):'collection');
$('#loading').hidden=true;
window.__series={items,state,scene,camera,controls,renderer,select,setView,get frames(){return frames;}};
