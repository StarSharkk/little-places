import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { buildingCatalog, createCollection, colours } from './collection.js';
import { createExplorerActions } from './explorer-actions.js';
import './explorer.css';

/** One lazy renderer, one selected model and the page's existing animation clock. */
export function createExplorer({ collectionItems, reducedMotion }) {
 const section=document.createElement('section');section.id='explorer';section.className='explorer';section.setAttribute('aria-labelledby','explorer-heading');
 section.innerHTML=`<div class="explorer-intro"><div><span class="eyebrow">A CLOSER LOOK / 建筑展厅</span><h2 id="explorer-heading">Every little detail. Yours to explore.</h2></div><p>Ten places, up close.<br>Choose one. Stay a little longer.</p></div><div class="explorer-layout"><nav class="explorer-directory" aria-label="Explorer building directory">${buildingCatalog.map(b=>`<button data-explore="${b.id}" aria-pressed="false"><span>${b.number}</span>${b.title}</button>`).join('')}</nav><div class="explorer-display"><header class="explorer-display-heading"><div><span class="eyebrow" id="explorer-number">01 / 桜カフェ</span><h3 id="explorer-title">Sakura Café</h3><p id="explorer-description">Coffee, croissants & slow mornings.</p></div><div class="explorer-heading-tools"><div class="explorer-paging"><button class="pill explorer-step" id="explorer-previous" aria-label="Previous explorer building">←</button><span id="explorer-count">01 / 10</span><button class="pill explorer-step" id="explorer-next" aria-label="Next explorer building">→</button></div><button class="pill" id="explorer-fullscreen">Fullscreen ↗</button></div></header><div class="explorer-stage"><div class="explorer-actions" role="group" aria-label="Explorer building interactions"></div><div class="explorer-canvas" aria-label="Drag to rotate the selected building"></div><div class="explorer-labels" aria-hidden="true"></div><div class="explorer-details" role="group" aria-label="Details of this place"><span class="explorer-details-title">DETAILS</span><div class="explorer-details-list"></div></div><span class="explorer-stage-note">DRAG TO TURN · ZOOM WITH − +</span><span class="explorer-loading" role="status">Choose a place to look closer.</span></div><div class="explorer-toolbar"><div class="explorer-colours" role="group" aria-label="Explorer colours">${colours.map((c,i)=>`<button class="explorer-swatch" data-explorer-colour="${i}" style="--swatch:${c.colour}" aria-label="Explorer: ${c.name}" aria-pressed="false"></button>`).join('')}</div><div class="explorer-toggles"><button class="pill" id="explorer-cutaway" aria-pressed="false">See-through</button><button class="pill" id="explorer-label-toggle" aria-pressed="false">Labels</button><button class="pill" id="explorer-turntable" aria-pressed="false">Turntable ↻</button><button class="pill" id="explorer-night" aria-pressed="false">Night ☾</button></div><div class="explorer-view"><button class="pill" id="explorer-reset">Reset view ↺</button><div class="explorer-zoom"><button id="explorer-zoom-out" aria-label="Explorer zoom out">−</button><output id="explorer-zoom-value">145%</output><button id="explorer-zoom-in" aria-label="Explorer zoom in">+</button></div></div></div></div></div><div class="explorer-preview" role="tooltip" aria-hidden="true"><img alt=""><span></span></div>`;
 document.querySelector('.page').append(section);
 const $=s=>section.querySelector(s), stage=$('.explorer-stage'),host=$('.explorer-canvas'),display=$('.explorer-display'),labels=$('.explorer-labels');
 const state={selected:'cafe',visible:false,labels:false,turntable:false,night:false,zoom:1.45,focus:null,peek:null};
 let focusAnim=null,renderer,scene,camera,controls,hemi,sun,item,adapter,dirty=true,elapsed=0,zoomGoal=1.45,nightAmount=0,actionKey='',labelNodes=[],frames=0,gesture=null,hoverTarget=null;
 const invalidate=()=>{dirty=true;};
 const resources=root=>{const out=new Set();root.traverse(o=>{if(o.geometry)out.add(o.geometry);for(const m of [o.material].flat().filter(Boolean)){out.add(m);for(const v of Object.values(m))if(v?.isTexture)out.add(v);for(const u of Object.values(m.uniforms??{}))if(u.value?.isTexture)out.add(u.value);}});return out;};
 const protectedResources=new Set();for(const i of Object.values(collectionItems))for(const r of resources(i.wrapper))protectedResources.add(r);
 function release(){if(!item)return;scene.remove(item.wrapper);const owned=resources(item.wrapper);for(const m of Object.values(item.model.materials??{}))if(m?.isMaterial){owned.add(m);for(const v of Object.values(m))if(v?.isTexture)owned.add(v);}for(const r of owned)if(!protectedResources.has(r))r.dispose();renderer.renderLists.dispose();item=null;adapter=null;hoverTarget=null;labels.replaceChildren();labelNodes=[];}
 function init(){
  if(renderer)return;
  renderer=new THREE.WebGLRenderer({antialias:true});renderer.localClippingEnabled=true;renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;host.append(renderer.domElement);
  scene=new THREE.Scene();scene.background=new THREE.Color('#F7F3E9');hemi=new THREE.HemisphereLight(0xffffff,0xc3b59e,1.8);scene.add(hemi);sun=new THREE.DirectionalLight(0xffffff,1.4);sun.position.set(-3,12,8);scene.add(sun);
  camera=new THREE.OrthographicCamera(-10,10,7,-7,.1,200);controls=new OrbitControls(camera,renderer.domElement);controls.enablePan=false;controls.enableZoom=false;controls.enableDamping=true;controls.dampingFactor=.09;controls.rotateSpeed=.6;controls.minPolarAngle=.16;controls.maxPolarAngle=1.48;controls.autoRotateSpeed=.45;
  renderer.domElement.style.touchAction='pan-y';controls.addEventListener('change',invalidate);controls.addEventListener('start',()=>{state.turntable=false;controls.autoRotate=false;focusAnim=null;syncCommon();});
  // Wheel remains page scrolling; zoom is deliberately button controlled.
  host.addEventListener('pointerdown',e=>gesture={x:e.clientX,y:e.clientY,id:e.pointerId});
  host.addEventListener('pointerup',e=>{if(gesture?.id===e.pointerId&&Math.hypot(e.clientX-gesture.x,e.clientY-gesture.y)<6){const hit=pick(e);if(hit){adapter.act(hit.action);invalidate();}}gesture=null;});
  host.addEventListener('pointercancel',()=>gesture=null);
  host.addEventListener('pointermove',e=>{if(e.buttons||e.pointerType==='touch')return;const hit=pick(e);hoverTarget=hit?.target??null;renderer.domElement.style.cursor=hit?'pointer':'grab';invalidate();});
  host.addEventListener('pointerleave',()=>{hoverTarget=null;invalidate();});
 }
 function pick(e){if(!item)return null;const b=host.getBoundingClientRect(),ray=new THREE.Raycaster();scene.updateMatrixWorld(true);ray.setFromCamera(new THREE.Vector2((e.clientX-b.left)/b.width*2-1,1-(e.clientY-b.top)/b.height*2),camera);
  for(const hit of ray.intersectObject(item.wrapper,true)){const o=hit.object;if(!o.isMesh||o.isLineSegments2||!o.material?.visible||o.material.transparent)continue;let visible=true;for(let p=o;p;p=p.parent)if(!p.visible)visible=false;if(!visible)continue;for(let p=o;p;p=p.parent)if(p.userData.action)return {action:p.userData.action,target:p};return null;}return null;
 }
 function revealDirectory(){const nav=$('.explorer-directory'),b=$(`[data-explore="${state.selected}"]`),n=nav.getBoundingClientRect(),r=b.getBoundingClientRect();if(nav.scrollWidth<=nav.clientWidth)return;if(r.left<n.left)nav.scrollLeft-=n.left-r.left;else if(r.right>n.right)nav.scrollLeft+=r.right-n.right;}
 function resize(){revealDirectory();if(!renderer||!item)return;const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h);for(const m of item.lines)m.resolution.set(w,h);fit();invalidate();}
 function fit(){
  const box=item.viewBounds,aspect=host.clientWidth/host.clientHeight;
  camera.updateMatrixWorld(true);const pts=[];for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z])pts.push(new THREE.Vector3(x,y,z).applyMatrix4(camera.matrixWorldInverse));
  const ext=new THREE.Box3().setFromPoints(pts),baseSpan=Math.max(2*Math.max(Math.abs(ext.min.y),Math.abs(ext.max.y)),2*Math.max(Math.abs(ext.min.x),Math.abs(ext.max.x))/aspect)*1.12;
  // Enlarge to 145% using the real silhouette, rather than empty corners of a 3D bounding box.
  // Only view changes scan vertices; animation frames never repeat this work.
  scene.updateMatrixWorld(true);const v=new THREE.Vector3(),matrix=new THREE.Matrix4();let maxX=0,maxY=0;
  item.wrapper.traverse(o=>{if(!o.isMesh||o.isLineSegments2||!o.geometry?.attributes.position)return;for(let p=o;p;p=p.parent)if(!p.visible||p.name==='TramMotionRoot')return;matrix.multiplyMatrices(camera.matrixWorldInverse,o.matrixWorld);const positions=o.geometry.attributes.position;for(let i=0;i<positions.count;i++){v.fromBufferAttribute(positions,i).applyMatrix4(matrix);maxX=Math.max(maxX,Math.abs(v.x));maxY=Math.max(maxY,Math.abs(v.y));}});
  const span=Math.max(baseSpan,2*Math.max(maxY,maxX/aspect)*1.45*1.06);
  item.framing={x:maxX*2/span/aspect*1.45,y:maxY*2/span*1.45};
  camera.left=-span*aspect/2;camera.right=span*aspect/2;camera.top=span/2;camera.bottom=-span/2;camera.updateProjectionMatrix();
 }
 function reset(){if(!item)return;state.focus=null;focusAnim=null;state.turntable=false;controls.autoRotate=false;controls.enableDamping=false;controls.update();const c=item.focusBounds.getCenter(new THREE.Vector3());c.y-=item.focusBounds.getSize(new THREE.Vector3()).y*.06;controls.target.copy(c);const az=25*Math.PI/180,el=28*Math.PI/180;camera.position.copy(c).add(new THREE.Vector3(Math.sin(az)*Math.cos(el),Math.sin(el),Math.cos(az)*Math.cos(el)).multiplyScalar(35));camera.zoom=1.45;state.zoom=zoomGoal=1.45;camera.lookAt(c);controls.update();controls.enableDamping=true;fit();syncCommon();syncDetails();invalidate();}
 // Details: hovering one shows just its label; clicking turns the camera to it and moves in; the same detail again (or Reset view) shows the whole place.
 function focusDetail(i){if(!item)return;if(state.focus===i){reset();return;}const [,point]=item.labels[i];scene.updateMatrixWorld(true);const to=item.model.group.localToWorld(typeof point==='function'?point():new THREE.Vector3(...point));state.focus=i;state.turntable=false;controls.autoRotate=false;zoomGoal=Math.max(zoomGoal,2.4);focusAnim={from:controls.target.clone(),to,t:0};if(reducedMotion.matches)stepFocus(1);syncDetails();syncCommon();invalidate();}
 function stepFocus(dt){if(!focusAnim)return false;focusAnim.t=Math.min(1,focusAnim.t+dt/.65);const t=focusAnim.t,k=t*t*(3-2*t),offset=camera.position.clone().sub(controls.target);controls.target.lerpVectors(focusAnim.from,focusAnim.to,k);camera.position.copy(controls.target).add(offset);if(t>=1)focusAnim=null;return true;}
 function syncDetails(){for(const b of section.querySelectorAll('[data-explorer-detail]'))b.setAttribute('aria-pressed',String(Number(b.dataset.explorerDetail)===state.focus));}
 // A place that fails to set out (a lost WebGL context, a reload mid-way) says so, and tries again when it is shown or clicked.
 function load(){const note=$('.explorer-loading');try{loadPlace();note.classList.remove('is-error');}catch(error){console.error('Explorer: could not load',state.selected,error);item=null;adapter=null;note.hidden=false;note.classList.add('is-error');note.textContent='This place didn’t set out. Click to try again ↻';}}
 function loadPlace(){
  init();release();item=createCollection({only:state.selected})[state.selected];const m=item.model;
  scene.add(item.wrapper);scene.updateMatrixWorld(true);
  let box=m.footprint?new THREE.Box3(new THREE.Vector3(...m.footprint.min),new THREE.Vector3(...m.footprint.max)):new THREE.Box3().setFromObject(item.wrapper);
  // Centre on architecture, rather than the blue shadow stretching to one side.
  const body=m.footprint?box.clone():new THREE.Box3().setFromObject(m.group),center=body.getCenter(new THREE.Vector3()),offset=new THREE.Vector3(-center.x,0,-center.z);item.wrapper.position.copy(offset);box.translate(offset);body.translate(offset);item.viewBounds=box;item.focusBounds=body;
  adapter=createExplorerActions(item,{reduced:()=>reducedMotion.matches,menu:id=>{const d=document.querySelector(id==='cafe'?'#cafe-menu':'#sweets-menu');if(!d.open)d.showModal();}});
  state.labels=false;state.night=false;nightAmount=0;scene.background.set('#F7F3E9');hemi.color.set('#FFFFFF');hemi.groundColor.set('#C3B59E');hemi.intensity=1.8;sun.color.set('#FFFFFF');sun.intensity=1.4;
  $('.explorer-actions').replaceChildren(...adapter.actions.map(a=>{const b=document.createElement('button');b.className='pill';b.dataset.explorerAction=a.key;b.onclick=()=>{adapter.act(a.key);invalidate();syncActions();};return b;}));
  labelNodes=item.labels.map(([text,point,when])=>{const el=document.createElement('span');el.className='explorer-part-label';el.textContent=text;labels.append(el);return {el,point,when};});
  state.focus=state.peek=null;$('.explorer-details').hidden=!item.labels.length;
  $('.explorer-details-list').replaceChildren(...item.labels.map(([text],i)=>{const b=document.createElement('button');b.className='explorer-detail';b.dataset.explorerDetail=i;b.textContent=text;b.setAttribute('aria-pressed','false');const peek=on=>{if(on)state.peek=i;else if(state.peek===i)state.peek=null;invalidate();};b.onpointerenter=b.onfocus=()=>peek(true);b.onpointerleave=b.onblur=()=>peek(false);b.onclick=()=>focusDetail(i);return b;}));
  $('#explorer-cutaway').hidden=!m.setSeeThrough;$('.explorer-loading').hidden=true;actionKey='';reset();resize();syncActions();syncCommon();
 }
 function select(id,{scroll=false,writeHash=true}={}){
  const meta=buildingCatalog.find(b=>b.id===id);if(!meta)return;
  const changed=id!==state.selected;state.selected=id;
  for(const b of section.querySelectorAll('[data-explore]'))b.setAttribute('aria-pressed',String(b.dataset.explore===id));
  $('#explorer-number').textContent=`${meta.number} / ${meta.native}`;$('#explorer-title').textContent=meta.title;$('#explorer-description').textContent=meta.description;$('#explorer-count').textContent=`${meta.number} / 10`;
  revealDirectory();
  $('#explorer-previous').disabled=id==='cafe';$('#explorer-next').disabled=id==='tram';
  if(writeHash)history.replaceState(null,'',`#explore/${id}`);
  if((state.visible||scroll||renderer)&&(changed||!item))load();
  if(scroll)section.scrollIntoView({behavior:reducedMotion.matches?'instant':'smooth',block:'start'});
 }
 function syncActions(){if(!adapter)return;const key=adapter.actions.map(a=>[a.label(),a.pressed?.(),a.disabled?.()].join(':')).join('|');if(key===actionKey)return;actionKey=key;adapter.actions.forEach(a=>{const b=$(`[data-explorer-action="${a.key}"]`);b.textContent=a.label();b.disabled=!!a.disabled?.();if(a.pressed)b.setAttribute('aria-pressed',String(a.pressed()));});}
 function syncCommon(){for(const [id,value]of [['cutaway',adapter?.state.seeThrough],['label-toggle',state.labels],['turntable',state.turntable],['night',state.night]])$('#explorer-'+id).setAttribute('aria-pressed',String(!!value));$('#explorer-night').textContent=state.night?'Day ☀':'Night ☾';labels.setAttribute('aria-hidden',String(!state.labels));for(const b of section.querySelectorAll('[data-explorer-colour]'))b.setAttribute('aria-pressed',String(Number(b.dataset.explorerColour)===item?.colourIndex));}
 for(const b of section.querySelectorAll('[data-explore]'))b.onclick=()=>select(b.dataset.explore);
 for(const b of section.querySelectorAll('[data-explorer-colour]'))b.onclick=()=>{if(!item)load();item.setColour(Number(b.dataset.explorerColour));syncCommon();invalidate();};
 $('#explorer-cutaway').onclick=()=>{adapter.seeThrough(!adapter.state.seeThrough);syncCommon();invalidate();};
 $('#explorer-label-toggle').onclick=()=>{state.labels=!state.labels;syncCommon();invalidate();};
 $('#explorer-turntable').onclick=()=>{state.turntable=!state.turntable;controls.autoRotate=state.turntable&&!reducedMotion.matches;syncCommon();invalidate();};
 $('#explorer-night').onclick=()=>{state.night=!state.night;syncCommon();invalidate();};
 $('#explorer-reset').onclick=reset;
 const zoomBy=n=>{zoomGoal=THREE.MathUtils.clamp(zoomGoal+n,.65,3.2);invalidate();};
 $('#explorer-zoom-in').onclick=()=>zoomBy(.15);$('#explorer-zoom-out').onclick=()=>zoomBy(-.15);
 for(const [id,dir]of [['previous',-1],['next',1]])$('#explorer-'+id).onclick=()=>select(buildingCatalog[buildingCatalog.findIndex(b=>b.id===state.selected)+dir]?.id);
 const expandFallback=on=>{display.classList.toggle('explorer-expanded',on);document.body.classList.toggle('explorer-modal-open',on);$('#explorer-fullscreen').textContent=on?'Exit fullscreen ↙':'Fullscreen ↗';resize();};
 $('#explorer-fullscreen').onclick=async()=>{if(display.classList.contains('explorer-expanded')){expandFallback(false);return;}try{if(document.fullscreenElement===display)await document.exitFullscreen();else if(display.requestFullscreen)await display.requestFullscreen();else expandFallback(true);}catch{expandFallback(true);}};
 document.addEventListener('fullscreenchange',()=>{$('#explorer-fullscreen').textContent=document.fullscreenElement?'Exit fullscreen ↙':'Fullscreen ↗';resize();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&display.classList.contains('explorer-expanded')){expandFallback(false);}});
 const preview=$('.explorer-preview');let previewTimer;
 function hidePreview(){clearTimeout(previewTimer);preview.classList.remove('is-visible');preview.setAttribute('aria-hidden','true');}
 function showPreview(button){if(!matchMedia('(hover:hover) and (pointer:fine)').matches)return;clearTimeout(previewTimer);previewTimer=setTimeout(()=>{const b=buildingCatalog.find(b=>b.id===button.dataset.explore),rect=button.getBoundingClientRect();preview.querySelector('img').src=`/previews/${b.id}.png`;preview.querySelector('img').alt=`${b.title} isometric preview`;preview.querySelector('span').textContent=`${b.number} / ${b.title}`;preview.style.left=`${Math.min(rect.right+12,innerWidth-220)}px`;preview.style.top=`${Math.max(8,Math.min(rect.top,innerHeight-185))}px`;preview.classList.add('is-visible');preview.setAttribute('aria-hidden','false');},150);}
 for(const b of section.querySelectorAll('[data-explore]')){b.addEventListener('pointerenter',()=>showPreview(b));b.addEventListener('pointerleave',hidePreview);b.addEventListener('focus',()=>showPreview(b));b.addEventListener('blur',hidePreview);}
 window.addEventListener('scroll',hidePreview,{passive:true});window.addEventListener('resize',hidePreview);
 new ResizeObserver(resize).observe(host);
 new IntersectionObserver(entries=>{state.visible=entries[0].isIntersecting;if(state.visible&&!item)load();invalidate();},{rootMargin:'0px'}).observe(display);
 $('.explorer-loading').addEventListener('click',()=>{if(!item)load();});
 function route(){const id=location.hash.match(/^#explore\/([a-z]+)$/)?.[1];if(buildingCatalog.some(b=>b.id===id))select(id,{scroll:true,writeHash:false});}
 window.addEventListener('hashchange',route);
 select('cafe',{writeHash:false});if(location.hash.startsWith('#explore/'))requestAnimationFrame(route);
 reducedMotion.addEventListener('change',()=>{if(controls)controls.autoRotate=state.turntable&&!reducedMotion.matches;if(reducedMotion.matches&&item?.id==='tram')item.model.settle();invalidate();});
 function frame(dt){
  if(!state.visible||document.hidden||!renderer||!item||!adapter)return;elapsed+=dt;
  const focusing=stepFocus(dt),changed=controls.update(dt),moving=adapter.step(dt,elapsed),z=Math.abs(camera.zoom-zoomGoal)>.001,n=Math.abs(nightAmount-Number(state.night))>.001;
  syncActions();if(!dirty&&!focusing&&!changed&&!moving&&!z&&!n&&!(state.turntable&&!reducedMotion.matches))return;
  dirty=false;
  if(z){camera.zoom=reducedMotion.matches?zoomGoal:THREE.MathUtils.damp(camera.zoom,zoomGoal,12,dt);if(Math.abs(camera.zoom-zoomGoal)<.001)camera.zoom=zoomGoal;camera.updateProjectionMatrix();}state.zoom=camera.zoom;
  nightAmount=reducedMotion.matches?Number(state.night):THREE.MathUtils.damp(nightAmount,Number(state.night),5,dt);if(Math.abs(nightAmount-Number(state.night))<.002)nightAmount=Number(state.night);
  const t=nightAmount;scene.background.set('#F7F3E9').lerp(new THREE.Color('#1F2638'),t);hemi.color.set('#FFFFFF').lerp(new THREE.Color('#8A98C4'),t);hemi.groundColor.set('#C3B59E').lerp(new THREE.Color('#3A3550'),t);hemi.intensity=1.8-.75*t;sun.color.set('#FFFFFF').lerp(new THREE.Color('#AFBCE6'),t);sun.intensity=1.4-.95*t;item.model.setNight?.(t);for(const m of item.shadowMaterials)m.color.set('#92A6CF').lerp(new THREE.Color('#161C2B'),t);
  for(const {object,source,target}of item.hoverMaterials){object.material.color.copy(source.color);object.material.emissive.setHex(hoverTarget===target?0x24190c:0);}
  scene.updateMatrixWorld(true);labelNodes.forEach(({el,point,when},i)=>{const picked=i===state.focus||i===state.peek;el.hidden=!(state.labels||picked)||(when&&!when());el.classList.toggle('is-focus',picked);if(el.hidden)return;const p=item.model.group.localToWorld(typeof point==='function'?point():new THREE.Vector3(...point)).project(camera);el.hidden=Math.abs(p.x)>1||Math.abs(p.y)>1;el.style.left=`${THREE.MathUtils.clamp((p.x+1)*host.clientWidth/2,55,host.clientWidth-55)}px`;el.style.top=`${(1-p.y)*host.clientHeight/2}px`;});
  $('#explorer-zoom-value').value=`${Math.round(camera.zoom*100)}%`;renderer.render(scene,camera);frames++;
 }
 return {open:(id,opts)=>select(id,{scroll:true,...opts}),select,frame,state,section,get item(){return item;},get adapter(){return adapter;},get renderer(){return renderer;},get camera(){return camera;},get controls(){return controls;},get frames(){return frames;}};
}
