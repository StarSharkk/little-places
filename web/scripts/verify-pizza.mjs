// Pizza Piccola inside the collection. Start the dev server, then `npm run check:pizza`.
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
const click3d=async(part,local)=>{const p=await page.evaluate(([part,local])=>{const b=__series.items.pizza.model,o=part==='door'?b.door.leaf:part==='box'?b.box.lid:b.oven.mouth;o.updateWorldMatrix(true,false);const v=o.localToWorld(new o.position.constructor(...local)).project(__series.camera),r=document.querySelector('#scene').getBoundingClientRect();return[r.x+(v.x+1)*r.width/2,r.y+(1-v.y)*r.height/2];},[part,local]);await page.mouse.click(p[0],p[1]);};
// an exact camera for the rooftop and interior shots
const view=(az,el,zoom,dy=0,focus=false)=>page.evaluate(([az,el,zoom,dy,focus])=>{const {camera,controls,state}=__series,t=controls.target;controls.enableDamping=false;if(focus){const o=__series.items.pizza.model.box.lid;o.updateWorldMatrix(true,false);o.getWorldPosition(t);}t.y+=dy;const a=az*Math.PI/180,e=el*Math.PI/180;camera.position.set(t.x+Math.sin(a)*Math.cos(e)*28,t.y+Math.sin(e)*28,t.z+Math.cos(a)*Math.cos(e)*28);camera.zoom=zoom;camera.updateProjectionMatrix();controls.update();state.zoomGoal=null;},[az,el,zoom,dy,focus]);
// every chalkboard A-frame must stand on the ground as a Λ: feet on the paving, leaves wider apart at the feet than at the hinge
const aframes=(mod,factory)=>page.evaluate(async([mod,factory])=>{const z=(await import(mod))[factory]();z.group.updateMatrixWorld(true);const out=[];
 z.group.traverse(o=>{if(o.name!=='Chalkboard A-frame')return;let low=Infinity;const V=o.position.constructor;
  o.traverse(c=>{if(!c.isMesh)return;c.geometry.computeBoundingBox();const b=c.geometry.boundingBox;for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const zz of [b.min.z,b.max.z])low=Math.min(low,new V(x,y,zz).applyMatrix4(c.matrixWorld).y);});
  const [f,k]=['Front leaf','Back leaf'].map(n=>o.getObjectByName(n)),at=(leaf,y)=>leaf.localToWorld(new V(0,y,0));
  out.push({low,top:at(f,-0.05).distanceTo(at(k,-0.05)),feet:at(f,-0.9).distanceTo(at(k,-0.9))});});return out;},[mod,factory]);
const assertAframes=async(mod,factory,ground=.155)=>{const list=await aframes(mod,factory);assert(list.length>0,'No A-frame found');for(const a of list)assert(Math.abs(a.low-ground)<.03&&a.feet>a.top+.2,`A-frame wrong: lowest point ${a.low.toFixed(3)} (ground ${ground}), top gap ${a.top.toFixed(2)}, feet gap ${a.feet.toFixed(2)}`);return list.length;};
try{
 await page.goto((process.env.BASE_URL||'http://127.0.0.1:5176/')+'#pizza',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>!!window.__series&&__series.frames>0);await page.waitForTimeout(600);
 assert(await page.evaluate(()=>__series.state.active==='pizza'&&__series.items.pizza.wrapper.visible&&!__series.items.books.wrapper.visible),'Deep link must show only the pizzeria');
 for(const id of ['pizza-door','pizza-oven','pizza-box','see-through'])assert(await page.locator('#'+id).isVisible(),`#${id} hidden`);
 for(const id of ['books-door','sweets-door','flower-door','bakery-door'])assert(await page.locator('#'+id).isHidden(),`#${id} should be hidden`);
 const info=await page.evaluate(()=>{let t=0,l=0;__series.items.pizza.wrapper.traverse(o=>{if(o.isLineSegments2)l+=o.geometry.instanceCount||0;else if(o.isMesh){const g=o.geometry;t+=(g.index?g.index.count:g.attributes.position.count)/3;}});return{t:Math.round(t),l};});
 assert(info.t<=120000&&info.l<=15000,`Over budget: ${info.t} triangles, ${info.l} outline segments`);
 assert(await page.evaluate(()=>!!__series.items.pizza.model.roof.getObjectByName('Rooftop pizza sign')&&!!__series.items.pizza.model.roof.getObjectByName('Pizza slice')),'Rooftop slice missing');
 checks.push(`#pizza deep link, contextual controls, budget (${info.t} triangles, ${info.l} outline segments)`);
 const nA=await assertAframes(fsPath('../../buildings/07-pizza-piccola/Pizzeria.js'),'createPizzeria');checks.push(`${nA} chalkboard A-frame(s) standing on the ground as a Λ`);await snap('pizza-desktop');
 await page.locator('[data-view="front"]').click();await page.waitForTimeout(300);await snap('pizza-front');
 await page.locator('[data-view="side"]').click();await page.waitForTimeout(300);await snap('pizza-right');
 await page.locator('[data-view="iso"]').click();await page.waitForTimeout(200);
 await view(30,82,1.4,1.2);await page.waitForTimeout(300);await snap('pizza-rooftop');
 await page.locator('[data-view="iso"]').click();await page.waitForTimeout(200);checks.push('default, front, right and rooftop views');

 await page.locator('#pizza-door').click();await until(()=>__series.state.pizzaDoorAmount>.99);
 assert(await page.evaluate(()=>Math.abs(__series.items.pizza.model.door.hinge.rotation.y)>1.3),'Door did not open');
 await page.locator('#pizza-door').click();await until(()=>__series.state.pizzaDoorAmount<.01);
 await click3d('door',[.43,.5,.04]);await until(()=>__series.state.pizzaDoorOpen);assert(await page.evaluate(()=>__series.state.pizzaDoorOpen),'Clicking the 3D door must open it');
 await page.locator('#pizza-door').click();checks.push('door from the button and from a click on the model');
 await page.locator('#pizza-box').click();await until(()=>__series.state.pizzaBoxAmount>.99);
 assert(await page.evaluate(()=>__series.items.pizza.model.box.hinge.rotation.z>1.7),'Box did not open');
 await view(60,35,4.2,.1,true);await page.waitForTimeout(300);await snap('pizza-box-open');
 await page.locator('#pizza-box').click();await until(()=>__series.state.pizzaBoxAmount<.01);await page.locator('[data-view="iso"]').click();await page.waitForTimeout(300);
 await click3d('box',[.21,.01,0]);await until(()=>__series.state.pizzaBoxOpen);assert(await page.evaluate(()=>__series.state.pizzaBoxOpen),'Clicking the box must open it');
 await page.locator('#pizza-box').click();checks.push('pizza box lid from the button and from a click on the model');

 await page.locator('#pizza-oven').click();await page.waitForTimeout(200);
 assert(await page.evaluate(()=>{const p=__series.items.pizza.model;return !p.state.oven&&!p.oven.fire.visible;}),'Resting the oven must put the fire out');
 await snap('pizza-oven-off');await page.locator('#pizza-oven').click();
 assert(await page.evaluate(()=>__series.items.pizza.model.oven.fire.visible),'Fire did not come back');checks.push('oven fire and chimney smoke off and on');
 await page.locator('#see-through').click();await page.waitForTimeout(200);
 assert(await page.evaluate(()=>!__series.items.pizza.model.facade.visible&&!__series.items.pizza.model.roof.visible),'See-through must lift the façade and roof');
 await click3d('oven',[0,1.0,.612]);await page.waitForTimeout(200);assert(await page.evaluate(()=>!__series.state.pizzaOven),'Clicking the oven mouth must rest the fire');await page.locator('#pizza-oven').click();
 await view(45,30,1.9,-.6);await page.waitForTimeout(300);await snap('pizza-interior');
 await page.locator('#see-through').click();await page.locator('[data-view="iso"]').click();checks.push('see-through interior, oven click');

 const walls=new Set();
 for(const name of ['Butter yellow','Pistachio','Rose milk','Blue hour','Terracotta']){await page.getByRole('button',{name,exact:true}).click();await page.waitForTimeout(60);walls.add(await page.evaluate(()=>__series.items.pizza.model.materials.wall.color.getHexString()));}
 assert(walls.size===5,'Five schemes must give five wall colours');
 assert(await page.evaluate(()=>__series.items.pizza.model.materials.coral.color.getHexString()==='e0715b'),'Awnings must keep their own colours');
 await page.getByRole('button',{name:'Butter yellow',exact:true}).click();checks.push('five colour schemes (building only)');
 await page.locator('#labels-button').click();await page.waitForTimeout(400);
 assert(await page.locator('#labels .part-label:not([hidden])').count()===6,'Six labels expected');await snap('pizza-labels');await page.locator('#labels-button').click();
 await page.locator('#tab-collection').click();await page.waitForTimeout(400);
 assert(await page.evaluate(()=>Object.values(__series.items).filter(i=>i.wrapper.visible).length===7),'Overview must show 7 places');
 for(let i=0;i<8&&!(await page.locator('[data-focus="pizza"]').isVisible());i++){await page.locator('#gallery-next').click();await page.waitForTimeout(450);}
 await page.locator('[data-focus="pizza"]').click();await page.waitForTimeout(200);assert(await page.evaluate(()=>__series.state.active==='pizza'),'Caption navigation failed');
 checks.push('labels, 7-place overview, caption navigation');
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(400);
 assert(await page.evaluate(()=>document.documentElement.scrollWidth===innerWidth),'Mobile overflow');await snap('pizza-mobile');
 checks.push('390 px without overflow');
 assert(errors.length===0,errors.join('\n'));
 const report={passed:true,checkedAt:new Date().toISOString(),checks,consoleErrors:errors};
 await writeFile(out('pizza-verification.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
