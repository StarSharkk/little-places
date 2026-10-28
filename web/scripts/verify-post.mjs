import {closeBrowser} from './close-browser.mjs';
let checksPassed=false;
// Little Post Office inside the collection. Start the dev server, then `npm run check:post`.
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
const click3d=async(part,local)=>{const p=await page.evaluate(([part,local])=>{const b=__series.items.post.model,o={door:b.doors[1].leaf,post:b.post.body,cart:b.cart.cart}[part];o.updateWorldMatrix(true,false);const v=o.localToWorld(new o.position.constructor(...local)).project(__series.camera),r=document.querySelector('#scene').getBoundingClientRect();return[r.x+(v.x+1)*r.width/2,r.y+(1-v.y)*r.height/2];},[part,local]);await page.mouse.click(p[0],p[1]);};
// an exact camera for the rooftop and interior shots
const view=(az,el,zoom,dy=0,focus=null)=>page.evaluate(([az,el,zoom,dy,focus])=>{const {camera,controls,state}=__series,t=controls.target;controls.enableDamping=false;if(focus){const o=__series.items.post.wrapper.getObjectByName(focus);o.updateWorldMatrix(true,false);o.getWorldPosition(t);}t.y+=dy;const a=az*Math.PI/180,e=el*Math.PI/180;camera.position.set(t.x+Math.sin(a)*Math.cos(e)*28,t.y+Math.sin(e)*28,t.z+Math.cos(a)*Math.cos(e)*28);camera.zoom=zoom;camera.updateProjectionMatrix();controls.update();state.zoomGoal=null;__series.invalidate();},[az,el,zoom,dy,focus]);
// every chalkboard A-frame must stand on the ground as a Λ: feet on the paving, leaves wider apart at the feet than at the hinge
const aframes=(mod,factory)=>page.evaluate(async([mod,factory])=>{const z=(await import(mod))[factory]();z.group.updateMatrixWorld(true);const out=[];
 z.group.traverse(o=>{if(o.name!=='Chalkboard A-frame')return;let low=Infinity;const V=o.position.constructor;
  o.traverse(c=>{if(!c.isMesh)return;c.geometry.computeBoundingBox();const b=c.geometry.boundingBox;for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const zz of [b.min.z,b.max.z])low=Math.min(low,new V(x,y,zz).applyMatrix4(c.matrixWorld).y);});
  const [f,k]=['Front leaf','Back leaf'].map(n=>o.getObjectByName(n)),at=(leaf,y)=>leaf.localToWorld(new V(0,y,0));
  out.push({low,top:at(f,-0.05).distanceTo(at(k,-0.05)),feet:at(f,-0.9).distanceTo(at(k,-0.9))});});return out;},[mod,factory]);
const assertAframes=async(mod,factory,ground=.155)=>{const list=await aframes(mod,factory);assert(list.length>0,'No A-frame found');for(const a of list)assert(Math.abs(a.low-ground)<.03&&a.feet>a.top+.2,`A-frame wrong: lowest point ${a.low.toFixed(3)} (ground ${ground}), top gap ${a.top.toFixed(2)}, feet gap ${a.feet.toFixed(2)}`);return list.length;};
try{
 await page.goto((process.env.BASE_URL||'http://127.0.0.1:5176/')+'#post',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>!!window.__series&&__series.frames>0);await page.waitForTimeout(800);
 assert(await page.evaluate(()=>__series.state.active==='post'&&__series.items.post.wrapper.visible&&!__series.items.laundry.wrapper.visible),'Deep link must show only the post office');
 for(const id of ['post-door','post-letter','post-parcel','see-through','night'])assert(await page.locator('#'+id).isVisible(),`#${id} hidden`);
 for(const id of ['laundry-door','pizza-door','books-door'])assert(await page.locator('#'+id).isHidden(),`#${id} should be hidden`);
 assert(await page.evaluate(()=>__series.items.post.colourIndex===0&&__series.items.post.model.materials.wall.color.getHexString()==='f3cf76'&&__series.items.post.model.materials.cap.color.getHexString()==='e87558'),'Default must be the butter-yellow wall and red-cap scheme');
 const info=await page.evaluate(()=>{let t=0,l=0;__series.items.post.wrapper.traverse(o=>{if(o.isLineSegments2)l+=o.geometry.instanceCount||0;else if(o.isMesh){const g=o.geometry;t+=(g.index?g.index.count:g.attributes.position.count)/3;}});return{t:Math.round(t),l};});
 assert(info.t<=120000&&info.l<=15000,`Over budget: ${info.t} triangles, ${info.l} outline segments`);
 const parts=await page.evaluate(()=>{const z=__series.items.post.model,n=x=>!!z.group.getObjectByName(x);return ['PostOfficeRoot','Clock tower','Tower clock','Glass hall and entrance front','Post office sign','Upstairs front','Hall upstairs glazing','Post mark','Upstairs','Sorting room','Pigeonholes','Upstairs office','Office desk','Bookshelf','Filing cabinet','Parcel wing','Parcel window flap','Skylight','Post box','Parcel cart','Bicycle','Cherry tree','Street lamp','Sorting cabinet','PO boxes','Service counter','Postcard spinner','Stamp display','Writing desk'].filter(x=>!n(x));});
 assert(parts.length===0,`Missing parts: ${parts.join(', ')}`);
 checks.push(`#post deep link, controls, classic default, all named parts present, budget (${info.t} triangles, ${info.l} outline segments)`);
 const nA=await assertAframes(fsPath('../../buildings/09-little-post-office/PostOffice.js'),'createPostOffice');checks.push(`${nA} chalkboard A-frame(s) standing on the ground as a Λ`);
 const floating=await page.evaluate(async mod=>{const z=(await import(mod)).createPostOffice();z.group.updateMatrixWorld(true);const V=z.group.position.constructor,bad=[];
  const {G}=await import(mod),floors=[G.GROUND,G.GROUND+.47,G.TOP,G.TOP+.2,G.TOP+.54];
  for(const gname of ['Life around the post office','Roofs and clock tower','Upstairs'])for(const o of z.group.getObjectByName(gname).children){if(!o.isGroup||['Postcard display','Travelling parcel','Clock tower'].includes(o.name))continue;let low=Infinity;
   if(gname==='Upstairs')floors.push(G.F2);
   o.traverse(c=>{if(!c.isMesh)return;c.geometry.computeBoundingBox();const b=c.geometry.boundingBox;for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const zz of [b.min.z,b.max.z])low=Math.min(low,new V(x,y,zz).applyMatrix4(c.matrixWorld).y);});
   if(!floors.some(f=>Math.abs(low-f)<.02))bad.push(`${o.name} @ ${low.toFixed(3)}`);}
  return bad;},fsPath('../../buildings/09-little-post-office/PostOffice.js'));
 assert(floating.length===0,`Floating props: ${floating.join(', ')}`);checks.push('every street, roof and upstairs prop rests on the paving, a roof, the upstairs floor or the prop below it');
 // the building's layers: low wing → two storeys → tower over the door. The tower is a cylinder set into the façade;
 // sight lines along the default camera (azimuth 25°, elevation 28°) show what it hides and what stays clear.
 const sight=await page.evaluate(async mod=>{const {G}=await import(mod),T=G.TOWER,a=25*Math.PI/180,e=28*Math.PI/180,d=[Math.sin(a)*Math.cos(e),Math.sin(e),Math.cos(a)*Math.cos(e)];
  // does the ray from p towards the camera pass through the tower (body, or the corbel from base−0.34)?
  const hits=p=>{const ox=p[0]-T.cx,oz=p[2]-T.cz,A=d[0]**2+d[2]**2,B=2*(ox*d[0]+oz*d[2]),C=ox*ox+oz*oz-T.r*T.r,D=B*B-4*A*C;if(D<0)return false;
   for(const t of [(-B-Math.sqrt(D))/(2*A),(-B+Math.sqrt(D))/(2*A)]){if(t<=0)continue;const y=p[1]+t*d[1];if(y>T.base-0.34&&y<T.top)return true;}return C<0&&p[1]>T.base-0.34;};
  const zf=G.MAIN.z1+0.01,up=G.F2+0.85;
  return{storeys:G.F2>G.MID&&G.FLOOR+G.WING.h<G.MID,upstairsHalf:Math.abs((G.TOP-G.F2)/(G.MID-G.FLOOR)-0.5)<0.08,towerAbove:T.top>G.TOP+1.5,engaged:Math.abs(T.cz-G.MAIN.z1)<1e-6&&T.base>=G.MID,
   overDoor:Math.abs(T.cx-(G.DOOR.x0+G.DOOR.x1)/2)<1e-6,
   centreHidden:[T.cx-0.3,T.cx,T.cx+0.3].every(x=>hits([x,up,zf])),
   sidesVisible:[-0.18,1.95].every(x=>!hits([x,up,zf])),
   doorClear:[[T.cx,1.0],[T.cx,G.FLOOR+G.DOOR.h-0.3],[G.DOOR.x0+0.15,1.2],[G.DOOR.x1-0.15,1.2]].every(([x,y])=>!hits([x,y,zf])),
   signClear:[T.cx-0.8,T.cx,T.cx+0.8].every(x=>!hits([x,G.FLOOR+2.6+0.21,G.MAIN.z1+0.18]))};},fsPath('../../buildings/09-little-post-office/PostOffice.js'));
 for(const [k,v] of Object.entries(sight))assert(v,`Building layers: ${k} failed`);
 checks.push('two storeys (upstairs about half the shop floor) over a low wing; the round tower is set into the façade over the door, rises above the roof, hides the middle of the upstairs front from the default camera while both upstairs windows, the door and the sign stay in clear view');
 await snap('post-desktop');
 await page.locator('[data-view="front"]').click();await page.waitForTimeout(300);await snap('post-front');
 await page.locator('[data-view="side"]').click();await page.waitForTimeout(300);await snap('post-right');
 await page.locator('[data-view="iso"]').click();await page.waitForTimeout(200);
 await view(-65,22,1.3,0.5);await page.waitForTimeout(300);await snap('post-left');
 await page.locator('[data-view="iso"]').click();await page.waitForTimeout(200);
 await view(205,28,1.4,0);await page.waitForTimeout(300);await snap('post-back');
 await page.locator('[data-view="iso"]').click();await page.waitForTimeout(200);
 await view(30,82,1.3,1.2);await page.waitForTimeout(300);await snap('post-rooftop');
 await page.locator('[data-view="iso"]').click();await page.waitForTimeout(200);checks.push('default, front, right, left, back and rooftop views');

 // 1 · double door
 await page.locator('#post-door').click();await until(()=>__series.state.postDoorAmount>.99);
 assert(await page.evaluate(()=>{const d=__series.items.post.model.doors;return d[0].hinge.rotation.y<-1.2&&d[1].hinge.rotation.y>1.2;}),'Both door leaves must open on their hinges');
 await page.locator('#post-door').click();await until(()=>__series.state.postDoorAmount<.01);
 await click3d('door',[-.3,.15,.03]);await until(()=>__series.state.postDoorOpen);assert(await page.evaluate(()=>__series.state.postDoorOpen),'Clicking the door must open it');
 await page.locator('#post-door').click();await until(()=>__series.state.postDoorAmount<.01);checks.push('double door: button and click, both leaves on their hinges');

 // 2 · send a letter: appears, glides to the slot without touching the box, slips in, hides; can run again
 const letterAt=()=>page.evaluate(()=>{const p=__series.items.post.model.post,l=p.letter;return [l.position.x,l.position.y,l.position.z,l.scale.x,l.visible?1:0,p.flapHinge.rotation.x];});
 await page.locator('#post-letter').click();const lp=[];for(let i=0;i<14;i++){await page.waitForTimeout(120);lp.push(await letterAt());}
 const r=.28,slot=.96;
 const touches=lp.some(([x,y,z,s,v])=>v&&s>.05&&z<r+.02&&Math.abs(y-(slot+.004))>.02);
 assert(!touches,'The letter touched the post box outside the slot');
 assert(lp.some(p=>p[4]&&p[2]<r),'The letter never went into the slot');assert(lp.some(p=>p[5]>.3),'The slot flap did not move');
 assert(lp.slice(1).every((p,i)=>!p[4]||!lp[i][4]||Math.hypot(p[0]-lp[i][0],p[1]-lp[i][1],p[2]-lp[i][2])<.5),'The letter jumped');
 await page.waitForFunction(()=>!__series.items.post.model.letterRunning,null,{timeout:25000});
 assert(await page.evaluate(()=>!__series.items.post.model.post.letter.visible),'The letter should be gone after posting');
 await click3d('post',[0,.6,.29]);await page.waitForTimeout(250);assert(await page.evaluate(()=>__series.items.post.model.letterRunning),'Clicking the post box must post another letter');
 await view(40,18,4.2,.2,'Post box');await page.waitForTimeout(250);await snap('post-letter');await page.locator('[data-view="iso"]').click();
 await page.waitForFunction(()=>!__series.items.post.model.letterRunning,null,{timeout:25000});
 checks.push('send a letter: button and click, glides to the slot, slips in through it (flap moves), hides, runs again');

 // 3 · deliver a parcel: lift, carry, flap opens, in through the window, flap shuts, a new parcel on the cart
 const parcelAt=()=>page.evaluate(()=>{const z=__series.items.post.model,p=z.cart.parcel;return [p.position.x,p.position.y,p.position.z,p.visible?1:0,z.walls.flapHinge.rotation.x];});
 await page.locator('#post-parcel').click();const pp=[];for(let i=0;i<20;i++){await page.waitForTimeout(140);pp.push(await parcelAt());}
 assert(pp.some(p=>p[4]<-1.0),'The window flap did not open');
 assert(pp.some(p=>p[3]&&p[2]<1.6&&p[0]>2.95&&p[0]<3.95&&p[1]>1.355),'The parcel did not go in through the window opening');
 assert(pp.slice(1).every((p,i)=>!p[3]||!pp[i][3]||Math.hypot(p[0]-pp[i][0],p[1]-pp[i][1],p[2]-pp[i][2])<.6),'The parcel jumped');
 await page.waitForFunction(()=>!__series.items.post.model.parcelRunning,null,{timeout:25000});
 assert(await page.evaluate(()=>{const z=__series.items.post.model;return z.cart.parcel.visible&&z.cart.parcel.scale.x>.99&&Math.abs(z.walls.flapHinge.rotation.x)<.01;}),'Cart and window did not reset');
 await click3d('cart',[.1,.3,.3]);await page.waitForTimeout(250);assert(await page.evaluate(()=>__series.items.post.model.parcelRunning),'Clicking the cart must send another parcel');
 await page.waitForTimeout(1300);await view(30,20,3.6,.3,'Parcel wing');await page.waitForTimeout(150);await snap('post-parcel');await page.locator('[data-view="iso"]').click();
 await page.waitForFunction(()=>!__series.items.post.model.parcelRunning,null,{timeout:25000});
 const f0=await page.evaluate(()=>__series.frames);await page.waitForTimeout(600);assert(await page.evaluate(f0=>__series.frames===f0,f0),'The page keeps drawing after the deliveries');
 checks.push('deliver a parcel: button and click, lifted and carried, window flap opens, in through the window, resets, page idles after');

 // 4 · night: the shared Night mode; the hall glass glows warm
 await page.locator('#night').click();await page.waitForFunction(()=>__series.state.nightAmount===1,null,{timeout:25000});
 assert(await page.evaluate(()=>{const g=__series.items.post.model.materials.glass;return g.color.getHexString()==='ffd78a'&&g.opacity>.4;}),'Night did not warm the glass hall');
 await snap('post-night');await page.locator('#night').click();await page.waitForFunction(()=>__series.state.nightAmount===0,null,{timeout:25000});
 assert(await page.evaluate(()=>__series.items.post.model.materials.glass.color.getHexString()==='bfe0e4'),'Day did not come back');checks.push('night mode: shared stage dusk, warm glass hall, lamps, clock and signs lit');

 await page.locator('#see-through').click();await page.waitForTimeout(200);
 assert(await page.evaluate(()=>{const z=__series.items.post.model;return !z.front.visible&&!z.roofs.visible;}),'See-through must lift the front and roofs');
 await view(25,30,1.6,.2);await page.waitForTimeout(300);await snap('post-interior');
 await page.locator('#see-through').click();await page.locator('[data-view="iso"]').click();checks.push('see-through interior');
 const walls=new Set();
 for(const name of ['Butter yellow','Pistachio','Rose milk','Blue hour','Terracotta']){await page.getByRole('button',{name,exact:true}).click();await page.waitForTimeout(60);walls.add(await page.evaluate(()=>__series.items.post.model.materials.roof.color.getHexString()));}
 assert(walls.size===5,'Five schemes must give five roof colours');
 assert(await page.evaluate(()=>__series.items.post.model.materials.postRed.color.getHexString()==='d94d3d'&&__series.items.post.model.materials.kraft.color.getHexString()==='c99a62'),'Post box and parcels must keep their own colours');
 await page.getByRole('button',{name:'Butter yellow',exact:true}).click();checks.push('five colour schemes (building only)');
 await page.locator('#labels-button').click();await page.waitForTimeout(400);
 assert(await page.locator('#labels .part-label:not([hidden])').count()===6,'Six labels expected');await snap('post-labels');await page.locator('#labels-button').click();
 await page.locator('#tab-collection').click();await page.waitForTimeout(400);
 assert(await page.evaluate(()=>Object.values(__series.items).filter(i=>i.wrapper.visible).length===10),'Overview must show 10 places');
 for(let i=0;i<9&&!(await page.locator('#gallery-next').isDisabled());i++){await page.locator('#gallery-next').click();await page.waitForTimeout(450);}
 await page.waitForTimeout(600);await page.locator('[data-focus="post"]').waitFor({state:'visible',timeout:5000});
 await snap('post-overview');
 await page.locator('#tab-post').click();await page.waitForTimeout(200);assert(await page.evaluate(()=>__series.state.active==='post'),'Tab navigation failed');
 checks.push('labels, 10-place overview with paging, tab navigation');
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(400);
 assert(await page.evaluate(()=>document.documentElement.scrollWidth===innerWidth),'Mobile overflow');await snap('post-mobile');
 checks.push('390 px without overflow');
 assert(errors.length===0,errors.join('\n'));
 const report={passed:true,checkedAt:new Date().toISOString(),checks,consoleErrors:errors};
 await writeFile(out('post-verification.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
 checksPassed=true;
}catch(error){console.error(error);throw error;}finally{await closeBrowser(browser,checksPassed);}
