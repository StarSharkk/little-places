import {closeBrowser} from './close-browser.mjs';
let checksPassed=false;
// Bubble Laundry inside the collection. Start the dev server, then `npm run check:laundry`.
import {chromium} from 'playwright';
import {writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
// building modules live outside web/; Vite serves them through /@fs
const fsPath=rel=>'/@fs'+fileURLToPath(new URL(rel,import.meta.url));
const out=name=>fileURLToPath(new URL(`../screenshots/${name}`,import.meta.url));
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1040},deviceScaleFactor:1});
const errors=[],checks=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const assert=(v,msg)=>{if(!v)throw new Error(msg);};
const until=fn=>page.waitForFunction(fn,null,{timeout:20000}).catch(()=>{});
const snap=async name=>{await page.mouse.move(10,10);await page.waitForTimeout(350);await page.screenshot({path:out(`${name}.png`),fullPage:true});};
// screen position of a local point on one of the model's moving parts
const click3d=async(part,local)=>{const p=await page.evaluate(([part,local])=>{const b=__series.items.laundry.model,o={door:b.doors[1].leaf,washer:b.washer.shell,porthole:b.washer.leaf,vend:b.vending.body}[part];o.updateWorldMatrix(true,false);const v=o.localToWorld(new o.position.constructor(...local)).project(__series.camera),r=document.querySelector('#scene').getBoundingClientRect();return[r.x+(v.x+1)*r.width/2,r.y+(1-v.y)*r.height/2];},[part,local]);await page.mouse.click(p[0],p[1]);};
// an exact camera for the rooftop and interior shots
const view=(az,el,zoom,dy=0,focus=null)=>page.evaluate(([az,el,zoom,dy,focus])=>{const {camera,controls,state}=__series,t=controls.target;controls.enableDamping=false;if(focus){const o=__series.items.laundry.wrapper.getObjectByName(focus);o.updateWorldMatrix(true,false);o.getWorldPosition(t);}t.y+=dy;const a=az*Math.PI/180,e=el*Math.PI/180;camera.position.set(t.x+Math.sin(a)*Math.cos(e)*28,t.y+Math.sin(e)*28,t.z+Math.cos(a)*Math.cos(e)*28);camera.zoom=zoom;camera.updateProjectionMatrix();controls.update();state.zoomGoal=null;__series.invalidate();},[az,el,zoom,dy,focus]);
// every chalkboard A-frame must stand on the ground as a Λ: feet on the paving, leaves wider apart at the feet than at the hinge
const aframes=(mod,factory)=>page.evaluate(async([mod,factory])=>{const z=(await import(mod))[factory]();z.group.updateMatrixWorld(true);const out=[];
 z.group.traverse(o=>{if(o.name!=='Chalkboard A-frame')return;let low=Infinity;const V=o.position.constructor;
  o.traverse(c=>{if(!c.isMesh)return;c.geometry.computeBoundingBox();const b=c.geometry.boundingBox;for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const zz of [b.min.z,b.max.z])low=Math.min(low,new V(x,y,zz).applyMatrix4(c.matrixWorld).y);});
  const [f,k]=['Front leaf','Back leaf'].map(n=>o.getObjectByName(n)),at=(leaf,y)=>leaf.localToWorld(new V(0,y,0));
  out.push({low,top:at(f,-0.05).distanceTo(at(k,-0.05)),feet:at(f,-0.9).distanceTo(at(k,-0.9))});});return out;},[mod,factory]);
const assertAframes=async(mod,factory,ground=.155)=>{const list=await aframes(mod,factory);assert(list.length>0,'No A-frame found');for(const a of list)assert(Math.abs(a.low-ground)<.03&&a.feet>a.top+.2,`A-frame wrong: lowest point ${a.low.toFixed(3)} (ground ${ground}), top gap ${a.top.toFixed(2)}, feet gap ${a.feet.toFixed(2)}`);return list.length;};
try{
 await page.goto((process.env.BASE_URL||'http://127.0.0.1:5176/')+'#laundry',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>!!window.__series&&__series.frames>0);await page.waitForTimeout(800);
 const L=()=>'__series.items.laundry.model';
 assert(await page.evaluate(()=>__series.state.active==='laundry'&&__series.items.laundry.wrapper.visible&&!__series.items.pizza.wrapper.visible),'Deep link must show only the laundry');
 for(const id of ['laundry-door','laundry-wash','laundry-machine-door','laundry-vend','see-through'])assert(await page.locator('#'+id).isVisible(),`#${id} hidden`);
 for(const id of ['pizza-door','books-door','sweets-door'])assert(await page.locator('#'+id).isHidden(),`#${id} should be hidden`);
 assert(await page.evaluate(()=>__series.items.laundry.colourIndex===0&&__series.items.laundry.model.materials.wall.color.getHexString()==='f3d27e'),'Default scheme must be butter yellow');
 const info=await page.evaluate(()=>{let t=0,l=0;__series.items.laundry.wrapper.traverse(o=>{if(o.isLineSegments2)l+=o.geometry.instanceCount||0;else if(o.isMesh){const g=o.geometry;t+=(g.index?g.index.count:g.attributes.position.count)/3;}});return{t:Math.round(t),l};});
 assert(info.t<=120000&&info.l<=15000,`Over budget: ${info.t} triangles, ${info.l} outline segments`);
 assert(await page.evaluate(()=>{const r=__series.items.laundry.model.roof;return !!r.getObjectByName('Giant washer sign')&&!!r.getObjectByName('Drying platform');}),'Rooftop washer or drying platform missing');
 checks.push(`#laundry deep link, controls, butter yellow default, budget (${info.t} triangles, ${info.l} outline segments)`);
 const nA=await assertAframes(fsPath('../../buildings/08-bubble-laundry/Laundry.js'),'createLaundry');checks.push(`${nA} chalkboard A-frame(s) standing on the ground as a Λ`);
 // every street and roof prop rests on something: nothing floats more than 2 cm above the paving, the roof deck or the plinth
 const floating=await page.evaluate(async mod=>{const z=(await import(mod)).createLaundry();z.group.updateMatrixWorld(true);const V=z.group.position.constructor,bad=[];
  // allowed resting heights: the paving, the bench seat and a basket's rim (things stacked on them), the roof deck
  const floors=[.155,.155+.47,.155+.27,3.705];
  for(const gname of ['Life around the laundry','Roof terrace'])for(const o of z.group.getObjectByName(gname).children){if(!o.isGroup)continue;let low=Infinity;
   o.traverse(c=>{if(!c.isMesh)return;c.geometry.computeBoundingBox();const b=c.geometry.boundingBox;for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const zz of [b.min.z,b.max.z])low=Math.min(low,new V(x,y,zz).applyMatrix4(c.matrixWorld).y);});
   if(!floors.some(f=>Math.abs(low-f)<.02))bad.push(`${o.name} @ ${low.toFixed(3)}`);}
  return bad;},fsPath('../../buildings/08-bubble-laundry/Laundry.js'));
 assert(floating.length===0,`Floating props: ${floating.join(', ')}`);checks.push('every street and roof prop rests on the paving, the roof deck or the prop below it');
 await snap('laundry-desktop');
 await page.locator('[data-view="front"]').click();await page.waitForTimeout(300);await snap('laundry-front');
 await page.locator('[data-view="side"]').click();await page.waitForTimeout(300);await snap('laundry-right');
 await page.locator('[data-view="iso"]').click();await page.waitForTimeout(200);
 await view(205,28,1.45,0);await page.waitForTimeout(300);await snap('laundry-back');
 await page.locator('[data-view="iso"]').click();await page.waitForTimeout(200);
 await view(30,82,1.4,1.2);await page.waitForTimeout(300);await snap('laundry-rooftop');
 await page.locator('[data-view="iso"]').click();await page.waitForTimeout(200);checks.push('default, front, right, back and rooftop views');

 // 1 · the glass double door, from the button and from a click on the model
 await page.locator('#laundry-door').click();await until(()=>__series.state.laundryDoorAmount>.99);
 assert(await page.evaluate(()=>{const d=__series.items.laundry.model.doors;return d[0].hinge.rotation.y<-1.2&&d[1].hinge.rotation.y>1.2;}),'Both door leaves must open on their hinges');
 await snap('laundry-door-open');
 await page.locator('#laundry-door').click();await until(()=>__series.state.laundryDoorAmount<.01);
 await click3d('door',[-.3,.07,.035]);await until(()=>__series.state.laundryDoorOpen);assert(await page.evaluate(()=>__series.state.laundryDoorOpen),'Clicking the glass door must open it');
 await page.locator('#laundry-door').click();await until(()=>__series.state.laundryDoorAmount<.01);checks.push('glass double door: button and click, both leaves on their own hinges');

 // 2 · start / stop washing: drum spins with deltaTime, screen and light switch, the page idles again once it stops
 const drumAt=()=>page.evaluate(()=>__series.items.laundry.model.washer.drum.rotation.z);
 await page.locator('#laundry-wash').click();await page.waitForTimeout(1600);
 const r0=await drumAt();await page.waitForTimeout(500);const r1=await drumAt();
 assert(Math.abs(r1-r0)>1,'The drum is not spinning');
 assert(await page.evaluate(()=>{const m=__series.items.laundry.model.materials;return m.screenIdle.color.getHexString()==='7ce0c2'&&m.led.color.getHexString()==='7ce07c';}),'Display and status light did not switch on');
 assert(await page.locator('#laundry-machine-door').isDisabled(),'The porthole button must be disabled while washing');
 await click3d('porthole',[.23,.19,.03]);await page.waitForTimeout(300);assert(await page.evaluate(()=>!__series.state.machineDoorOpen),'The porthole must not open while the drum turns');
 await page.locator('#see-through').click();await view(25,24,3.4,0,'Live washer');await page.waitForTimeout(400);await snap('laundry-washing');await page.locator('#see-through').click();await page.locator('[data-view="iso"]').click();await page.waitForTimeout(300);
 // frame-rate independence: the same 2 s of spin-up at 30 and at 120 frames per second
 const indep=await page.evaluate(async mod=>{const {createLaundry}=await import(mod);const run=fps=>{const z=createLaundry();z.setWashing(true);for(let i=0;i<2*fps;i++)z.animate(1/fps);return z.washer.drum.rotation.z;};const a=run(30),b=run(120);return{a,b};},fsPath('../../buildings/08-bubble-laundry/Laundry.js'));
 assert(Math.abs(indep.a-indep.b)/Math.abs(indep.b)<.03,`Spin depends on frame rate (${indep.a.toFixed(2)} vs ${indep.b.toFixed(2)} rad)`);
 await page.locator('#laundry-wash').click();await page.waitForTimeout(4500);
 const s0=await drumAt();await page.waitForTimeout(500);assert(Math.abs((await drumAt())-s0)<1e-6,'The drum keeps turning after stopping');
 const f0=await page.evaluate(()=>__series.frames);await page.waitForTimeout(600);assert(await page.evaluate(f0=>__series.frames===f0,f0),'The page keeps drawing after the machine stopped');
 await click3d('washer',[.1,.8,.33]);await page.waitForTimeout(400);assert(await page.evaluate(()=>__series.state.laundryWashing),'Clicking the washer must start it');
 await page.locator('#laundry-wash').click();await page.waitForTimeout(300);
 checks.push(`start/stop washing: drum spins (frame-rate independent: ${indep.a.toFixed(2)} vs ${indep.b.toFixed(2)} rad at 30/120 fps), display and light switch, porthole locked while running, animation stops and the page idles`);

 // 3 · the porthole door on its side hinge (button and click), drum and clothes visible
 await page.waitForFunction(()=>!__series.items.laundry.model.state.speed,null,{timeout:10000});
 await page.locator('#laundry-machine-door').click();await until(()=>__series.state.machineDoorAmount>.99);
 assert(await page.evaluate(()=>__series.items.laundry.model.washer.hinge.rotation.y<-1.7),'Porthole did not open');
 await page.locator('#see-through').click();await view(40,22,3.4,0,'Live washer');await page.waitForTimeout(400);await snap('laundry-porthole-open');await page.locator('#see-through').click();await page.locator('[data-view="iso"]').click();await page.waitForTimeout(300);
 await page.locator('#laundry-machine-door').click();await until(()=>__series.state.machineDoorAmount<.01);
 await click3d('porthole',[.23,.19,.03]);await until(()=>__series.state.machineDoorOpen);assert(await page.evaluate(()=>__series.state.machineDoorOpen),'Clicking the porthole must open it');
 await page.locator('#laundry-wash').click();await page.waitForTimeout(200);assert(await page.evaluate(()=>!__series.state.machineDoorOpen),'Starting a wash must close the porthole first');
 await page.locator('#laundry-wash').click();checks.push('porthole: button and click on its side hinge; starting a wash closes it');

 // 4 · detergent vending: button press, the bottle travels inside the machine, flap and light, can run again
 await page.locator('#laundry-vend').click();
 const path=[];for(let i=0;i<14;i++){await page.waitForTimeout(140);path.push(await page.evaluate(()=>{const v=__series.items.laundry.model.vending,p=v.bottle.position;return [p.x,p.y,p.z,v.bottle.scale.x,v.flapHinge.rotation.x];}));}
 const inside=path.every(([x,y,z,s])=>s<.01||(x>-.4&&x<.2&&y>.15&&y<1.7&&z<.36));
 const jumps=path.slice(1).every((p,i)=>Math.hypot(p[0]-path[i][0],p[1]-path[i][1],p[2]-path[i][2])<.5||p[3]<.01||path[i][3]<.01);
 assert(inside,'The bottle left the machine during its trip');assert(jumps,'The bottle jumped instead of moving');
 assert(path.some(p=>p[4]>1.0),'The pickup flap did not open');
 await view(80,18,4.0,.2,'Detergent vending machine');await page.waitForTimeout(50);await snap('laundry-vending');await page.locator('[data-view="iso"]').click();
 await page.waitForFunction(()=>!__series.items.laundry.model.vendRunning,null,{timeout:10000});
 assert(await page.evaluate(()=>{const v=__series.items.laundry.model.vending;return v.bottle.scale.x>.99&&Math.abs(v.flapHinge.rotation.x)<.01;}),'The machine did not reset');
 await click3d('vend',[0,1.0,.37]);await page.waitForTimeout(300);assert(await page.evaluate(()=>__series.items.laundry.model.vendRunning),'Clicking the machine must start it again');
 await page.waitForFunction(()=>!__series.items.laundry.model.vendRunning,null,{timeout:10000});
 checks.push('vending: button and click, bottle stays inside and moves smoothly, flap opens with the pickup light, resets and runs again');

 // see-through: washers, folding table and waiting bench in view
 await page.locator('#see-through').click();await page.waitForTimeout(200);
 assert(await page.evaluate(()=>{const z=__series.items.laundry.model;return !z.facade.visible&&!z.roof.visible;}),'See-through must lift the front and roof');
 await view(25,30,1.9,-.7);await page.waitForTimeout(300);await snap('laundry-interior');
 await page.locator('#see-through').click();await page.locator('[data-view="iso"]').click();checks.push('see-through interior');

 const walls=new Set();
 for(const name of ['Butter yellow','Pistachio','Rose milk','Blue hour','Terracotta']){await page.getByRole('button',{name,exact:true}).click();await page.waitForTimeout(60);walls.add(await page.evaluate(()=>__series.items.laundry.model.materials.wall.color.getHexString()));}
 assert(walls.size===5,'Five schemes must give five wall colours');
 assert(await page.evaluate(()=>__series.items.laundry.model.materials.washPink.color.getHexString()==='f0a9b8'&&__series.items.laundry.model.materials.leaf.color.getHexString()==='7faf8a'),'Washers and plants must keep their own colours');
 await page.getByRole('button',{name:'Butter yellow',exact:true}).click();checks.push('five colour schemes (building only)');
 await page.locator('#labels-button').click();await page.waitForTimeout(400);
 assert(await page.locator('#labels .part-label:not([hidden])').count()===6,'Six labels expected');await snap('laundry-labels');await page.locator('#labels-button').click();
 await page.locator('#tab-collection').click();await page.waitForTimeout(400);
 assert(await page.evaluate(()=>Object.values(__series.items).filter(i=>i.wrapper.visible).length===10),'Overview must show 10 places');
 for(let i=0;i<8&&!(await page.locator('[data-focus="laundry"]').isVisible());i++){await page.locator('#gallery-next').click();await page.waitForTimeout(450);}
 await snap('laundry-overview');
 await page.locator('#tab-laundry').click();await page.waitForTimeout(200);assert(await page.evaluate(()=>__series.state.active==='laundry'),'Tab navigation failed');
 checks.push('labels, 10-place overview with paging, tab navigation');
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(400);
 assert(await page.evaluate(()=>document.documentElement.scrollWidth===innerWidth),'Mobile overflow');await snap('laundry-mobile');
 checks.push('390 px without overflow');
 assert(errors.length===0,errors.join('\n'));
 const report={passed:true,checkedAt:new Date().toISOString(),checks,consoleErrors:errors};
 await writeFile(out('laundry-verification.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
 checksPassed=true;
}catch(error){console.error(error);throw error;}finally{await closeBrowser(browser,checksPassed);}
