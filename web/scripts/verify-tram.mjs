import {chromium} from 'playwright';
import {writeFile} from 'node:fs/promises';
import {closeBrowser} from './close-browser.mjs';
let checksPassed=false;
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1040},deviceScaleFactor:1});
const errors=[],checks=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const assert=(v,m)=>{if(!v)throw Error(m);};
const until=fn=>page.waitForFunction(fn,null,{timeout:20000});
const snap=async name=>{await page.mouse.move(5,5);await page.waitForTimeout(120);await page.screenshot({path:new URL(`../screenshots/tram-${name}.png`,import.meta.url).pathname,fullPage:true});};
const view=async(az,el)=>{await page.evaluate(([az,el])=>{const {controls,camera}=__series,t=controls.target;controls.enableDamping=false;const a=az*Math.PI/180,e=el*Math.PI/180;camera.position.set(t.x+Math.sin(a)*Math.cos(e)*25,t.y+Math.sin(e)*25,t.z+Math.cos(a)*Math.cos(e)*25);camera.zoom=el>60?1.1:1.45;camera.updateProjectionMatrix();controls.update();__series.invalidate();},[az,el]);};
try{
 await page.goto((process.env.BASE_URL||'http://127.0.0.1:5176/')+'#tram',{waitUntil:'load'});await until(()=>window.__series&&__series.frames>0);
 const first=await page.evaluate(()=>__series.items.tram.model.tram.motion.position.x);await page.waitForTimeout(500);
 assert(await page.evaluate(x=>__series.items.tram.model.tram.motion.position.x>x,first),'Tram did not start automatically');
 const sampled=await page.evaluate(()=>{
  const m=__series.items.tram.model,results=[];let last=m.tram.motion.position.x,lastLoop=m.state.loops,lastWheel=m.tram.wheels[0].rotation.z;
  for(let i=0;i<2600;i++){
   m.animate(1/60);const x=m.tram.motion.position.x,w=m.tram.wheels[0].rotation.z;
   if(m.state.loops!==lastLoop){results.push({reset:true,...m.state.lastReset,hidden:!m.tram.motion.visible});lastLoop=m.state.loops;}
   else if(Math.abs(w-lastWheel+(x-last)/.245)>.0001||x<last)results.push({bad:true});
   if(m.tram.motion.position.z!==3.7||m.tram.motion.position.y!==0)results.push({bad:true});last=x;lastWheel=w;
  }
  __series.invalidate();return results;
 });
 assert(sampled.filter(s=>s.reset).length>=3,'Fewer than three complete loops');
 assert(sampled.every(s=>!s.bad&&(!s.reset||s.fullyOutside&&s.hidden&&s.to+2.85< -6.35)),'Visible reset, reversed direction, wheel slip or sideways drift');
 checks.push('automatic start; 3+ unidirectional loops; invisible full-car reset; correct wheel rolling and track alignment');
 // Request from the moving car: it must dock before the leaves begin opening.
 await page.locator('#tram-doors').click();
 assert(await page.evaluate(()=>__series.items.tram.model.state.stopRequested&&!__series.items.tram.model.state.doorsOpen),'Open did not queue a station stop');
 await until(()=>__series.items.tram.model.state.doorAmount>.999);
 assert(await page.evaluate(()=>{const m=__series.items.tram.model;return !m.state.moving&&m.state.docked&&Math.abs(m.tram.motion.position.x+.45)<.001;}),'Doors opened away from dock');
 assert(await page.locator('#tram-travel').isDisabled(),'Open doors allowed motion');
 await snap('desktop');await snap('doors-open');
 for(const [az,el,name]of[[0,28,'front'],[90,28,'right'],[205,28,'back'],[25,80,'rooftop']]){await view(az,el);await snap(name);}
 await page.locator('[data-view="iso"]').click();
 // Check the generous platform corridor and clipped travel materials on the real model.
 const geometry=await page.evaluate(()=>{const m=__series.items.tram.model;let triangles=0,lines=0,clipped=true;
  m.group.traverse(o=>{if(o.isLineSegments2)lines+=o.geometry.instanceCount||0;else if(o.isMesh)triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;});
  m.tram.motion.traverse(o=>{if(o.isMesh&&o.material.clippingPlanes?.length!==2)clipped=false;});
  return{triangles:Math.round(triangles),lines,clipped,platformClearance:m.tram.motion.position.z-.94-.73};});
 assert(geometry.triangles<120000&&geometry.lines<15000&&geometry.clipped&&geometry.platformClearance>2,'Budget, clipping or waiting space');
 const fixed=await page.evaluate(()=>{const m=__series.items.tram.model.materials;return ['tyre','steel','leaf','blossom'].map(k=>m[k].color.getHexString());});
 const palette=[];
 for(const [i,name]of['Butter yellow','Pistachio','Rose milk','Blue hour','Terracotta'].entries()){
  await page.getByRole('button',{name,exact:true}).click();
  palette.push(await page.evaluate(()=>{const m=__series.items.tram.model.materials;return ['roof','canopy','tramGreen','tramCream'].map(k=>m[k].color.getHexString());}));
  assert(await page.evaluate(f=>{const m=__series.items.tram.model.materials;return ['tyre','steel','leaf','blossom'].every((k,j)=>m[k].color.getHexString()===f[j]);},fixed),'Palette changed intrinsic colours');
  await snap(`theme-${i+1}`);
 }
 for(let col=0;col<4;col++)assert(new Set(palette.map(row=>row[col])).size===5,'Roof, canopy and both tram colours need five coordinated themes');
 await page.getByRole('button',{name:'Butter yellow',exact:true}).click();
 await page.locator('#tram-doors').click();await until(()=>__series.items.tram.model.state.doorAmount===0&&__series.items.tram.model.state.moving);
 checks.push('open queues a smooth station stop; doors only open at rest; closing resumes automatic service; widened platform; five linked colour themes');
 // Partial entry is rendered through clipping, with no meshes spilling outside the diorama.
 await page.evaluate(()=>{const m=__series.items.tram.model;m.state.auto=false;m.settle();m.tram.motion.position.x=-6.1;m.animate(0);__series.invalidate();});await snap('clipped-entry');
 await page.evaluate(()=>{const m=__series.items.tram.model;m.settle();m.toggleDoors(true);__series.invalidate();});
 await page.locator('#tram-ticket').click();await until(()=>__series.items.tram.model.props.paper.visible);await snap('ticket');await until(()=>!__series.items.tram.model.state.ticketRunning);
 await page.locator('#night').click();await until(()=>__series.state.nightAmount===1);await snap('night');await page.locator('#night').click();await until(()=>__series.state.nightAmount===0);
 await page.locator('#see-through').click();await view(25,45);await snap('interior');await page.locator('#see-through').click();await page.locator('[data-view="iso"]').click();
 await page.locator('#labels-button').click();await snap('labels');await page.locator('#labels-button').click();
 await page.locator('#turntable').click();const az=await page.evaluate(()=>__series.controls.getAzimuthalAngle());await page.waitForTimeout(600);assert(await page.evaluate(a=>Math.abs(__series.controls.getAzimuthalAngle()-a)>.01,az),'Turntable broke');await page.locator('[data-view="iso"]').click();
 // Page visibility pauses model time; returning resumes without a large delta jump.
 await page.locator('#tram-doors').click();await until(()=>__series.items.tram.model.state.moving);
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});});
 const paused=await page.evaluate(()=>__series.items.tram.model.tram.motion.position.x);await page.waitForTimeout(500);
 assert(await page.evaluate(x=>__series.items.tram.model.tram.motion.position.x===x,paused),'Hidden page moved the tram');
 await page.evaluate(()=>{delete document.hidden;});await page.waitForTimeout(400);assert(await page.evaluate(x=>__series.items.tram.model.tram.motion.position.x!==x,paused),'Visible page did not resume');
 await page.locator('#tram-doors').click();await until(()=>__series.items.tram.model.state.doorsOpen);
 await page.setViewportSize({width:390,height:844});await snap('mobile');assert(await page.evaluate(()=>document.documentElement.scrollWidth===innerWidth),'Mobile overflow');
 await page.locator('#tab-collection').click();for(let i=0;i<9;i++)if(!await page.locator('#gallery-next').isDisabled())await page.locator('#gallery-next').click();await until(()=>Math.abs(__series.state.collectionShift-__series.collectionShiftGoal())<.02);await snap('overview-mobile');
 assert(await page.evaluate(()=>Object.keys(__series.items).length===10),'Other places missing');await page.locator('#tab-tram').click();
 await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#tram-doors').click();await page.locator('#tram-doors').click();
 assert(await page.evaluate(()=>__series.items.tram.model.state.doorAmount===1),'Reduced motion stop/doors');
 checks.push('partial entry clipping, ticket, night, cutaway, labels, turntable, hidden-page pause/resume, mobile, ten-place navigation and reduced motion');
 assert(errors.length===0,errors.join('\n'));
 const report={passed:true,geometry,palette,checks,consoleErrors:errors};await writeFile(new URL('../screenshots/tram-verification.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));checksPassed=true;
}catch(error){console.error(error);throw error;}finally{await closeBrowser(browser,checksPassed);}
