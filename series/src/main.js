import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createCollection, colours } from './collection.js';
import './style.css';

const $=selector=>document.querySelector(selector);
const host=$('#scene');
const state={active:'collection',doorOpen:false,shutterOpen:false,shutterAmount:0,labels:false,auto:false,view:'iso',zoomGoal:null};
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
  item.wrapper.scale.setScalar(stackedOverview()?(index===0?.78:.68):overview?item.scale:1);
  if(stackedOverview())item.wrapper.position.copy(up).multiplyScalar(index===0?5.4:-5.4);
  else item.wrapper.position.copy(right).multiplyScalar(overview?(index===0?-6.4:6.4):0);
 }
}
function resize(){
 const w=host.clientWidth,h=host.clientHeight,aspect=w/h;
 renderer.setSize(w,h);
 const item=items[state.active];
 const vertical=item?item.span:stackedOverview()?22:13.4,horizontal=item?item.width:stackedOverview()?11.8:24.2;
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
 $('#door').hidden=state.active==='grocery';$('#menu-button').hidden=state.active==='grocery';$('#shutter').hidden=state.active==='cafe';
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
 $('#object-description').textContent=overview?'01 Sakura Café  +  02 Yamada Grocery':`${items[id].number} / ${items[id].description}`;
 $('#action-hint').textContent=overview?'Pick a place. Make yourself at home.':id==='cafe'?'A door to open. A menu to linger over.':'Everyday goods & four little capsule machines.';
 if(writeHash)history.replaceState(null,'',`#${id}`);
 updateActions();updateColourUI();setView('iso');resize();
 if(id==='grocery'&&$('#cafe-menu').open)$('#cafe-menu').close();
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
const menu=$('#cafe-menu'),about=$('#about-dialog');
const showMenu=()=>{if(!menu.open)menu.showModal();};$('#menu-button').onclick=showMenu;$('#about').onclick=()=>about.showModal();
for(const dialog of [menu,about]){
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
for(const item of Object.values(items))for(const [text,point] of item.labels){const element=document.createElement('div');element.className='part-label';element.textContent=text;$('#labels').append(element);partLabels.push({element,item,point:new THREE.Vector3(...point)});}
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
 if(actionable){tooltip.textContent=hover.action==='door'?(state.doorOpen?'Close the café door':'Step inside the café'):hover.action==='menu'?'Explore the café menu':hover.action==='shutter'?(state.shutterOpen?'Close the grocery shutter':'Open the grocery'):`Explore ${items[hover.id].title} ↗`;tooltip.style.left=`${Math.max(8,Math.min(event.clientX+12,innerWidth-240))}px`;tooltip.style.top=`${Math.max(8,event.clientY-36)}px`;}
 invalidate();
});
host.addEventListener('pointerup',event=>{
 const isClick=gesture&&gesture.id===event.pointerId&&gesture.distance<6&&Math.hypot(event.clientX-gesture.x,event.clientY-gesture.y)<6;gesture=null;
 if(!isClick)return;const result=pick(event);if(!result)return;
 if(result.action==='door')toggleDoor();else if(result.action==='shutter')toggleShutter();else if(result.action==='menu')showMenu();else if(state.active==='collection')select(result.id);
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
 if(state.labels)for(const {element,item,point} of partLabels){
  element.hidden=!item.wrapper.visible;if(element.hidden)continue;
  const p=project(item.model.group.localToWorld(point.clone()));
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
 if(!dirty&&!changed&&!movingDoor&&!movingShutter&&state.zoomGoal===null&&!state.auto)return;
 dirty=false;
 if(state.zoomGoal!==null){camera.zoom=reducedMotion.matches?state.zoomGoal:THREE.MathUtils.damp(camera.zoom,state.zoomGoal,12,dt);if(Math.abs(camera.zoom-state.zoomGoal)<.001){camera.zoom=state.zoomGoal;state.zoomGoal=null;}camera.updateProjectionMatrix();}
 items.cafe.model.door.hinge.rotation.y=reducedMotion.matches?(state.doorOpen?-Math.PI*.58:0):THREE.MathUtils.damp(items.cafe.model.door.hinge.rotation.y,state.doorOpen?-Math.PI*.58:0,9,dt);
 state.shutterAmount=reducedMotion.matches?(state.shutterOpen?1:0):THREE.MathUtils.damp(state.shutterAmount,state.shutterOpen?1:0,7,dt);items.grocery.model.storefront.setOpen(state.shutterAmount);
 for(const item of Object.values(items))for(const {object,source,target} of item.hoverMaterials){object.material.color.copy(source.color);object.material.emissive.setHex(hover?.target===target?0x24190c:0);}
 layout();scene.updateMatrixWorld(true);renderOverlays();$('#zoom-value').value=`${Math.round(camera.zoom*100)}%`;
 renderer.render(scene,camera);frames++;
});
new ResizeObserver(resize).observe(host);
window.addEventListener('hashchange',()=>select(location.hash.slice(1)||'collection',{writeHash:false}));
select(['cafe','grocery'].includes(location.hash.slice(1))?location.hash.slice(1):'collection');
$('#loading').hidden=true;
window.__series={items,state,scene,camera,controls,renderer,select,setView,get frames(){return frames;}};
