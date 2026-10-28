import {chromium} from 'playwright';
import {writeFile} from 'node:fs/promises';
import {closeBrowser} from './close-browser.mjs';
const browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],checks=[];let passed=false;
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const assert=(v,m)=>{if(!v)throw Error(m);};
const until=fn=>page.waitForFunction(fn,null,{timeout:35000});
const choose=async id=>{await page.locator(`[data-explore="${id}"]`).click();await until(()=>__explorer.item?.id===__explorer.state.selected);await page.waitForTimeout(100);};
const act=key=>page.locator(`[data-explorer-action="${key}"]`).click();
try{
 await page.goto((process.env.BASE_URL||'http://127.0.0.1:5176/')+'#collection',{waitUntil:'load'});await until(()=>window.__series?.frames>0&&window.__explorer);
 assert(await page.locator('#scene canvas').count()===1,'Original collection canvas missing');
 assert(await page.evaluate(()=>__series.camera.zoom===3.2&&__series.state.active==='collection'&&Object.keys(__series.items).length===10),'Collection changed');
 const before=await page.evaluate(()=>({page:__series.state.collectionPage,wall:__series.items.cafe.colourIndex}));
 if(await page.evaluate(()=>{const b=document.querySelector('#collection-cruise');if(b&&!b.hidden&&/pause/i.test(b.textContent)){b.click();return true;}return false;}))await page.waitForTimeout(900);
 const caption=page.locator('[data-focus]:visible').first(),id=await caption.getAttribute('data-focus');await caption.click();await until(()=>__explorer.item&&__explorer.state.visible);await page.waitForTimeout(600);
 assert(await page.evaluate(id=>__explorer.state.selected===id&&__series.state.active==='collection',id),'Caption replaced Collection');
 assert(page.url().endsWith('#explore/'+id),'Explorer hash missing');
 assert(await page.locator('canvas').count()===2,'Expected one collection and one Explorer canvas');
 const rendererId=await page.evaluate(()=>__explorer.renderer.domElement.dataset.testId='stable-renderer');
 console.log('verified step');checks.push('original collection at 320%, ten models, caption scroll to isolated Explorer and non-conflicting hash');
 await choose('cafe');const scrollY=await page.evaluate(()=>window.scrollY);await choose('grocery');assert(Math.abs(await page.evaluate(()=>window.scrollY)-scrollY)<3,'Directory selection scrolled page');await choose('cafe');
 await page.locator('[data-explore="pizza"]').hover();await page.waitForTimeout(400);
 assert(await page.locator('.explorer-preview').getAttribute('aria-hidden')==='false','Hover preview did not open');
 assert(await page.evaluate(()=>__explorer.state.selected==='cafe'),'Hover changed selected building');
 assert(await page.locator('.explorer-preview img').evaluate(img=>img.complete&&img.naturalWidth>0),'Preview image missing');
 const anchor=await page.locator('[data-explore="pizza"]').boundingBox(),preview=await page.locator('.explorer-preview').boundingBox();assert(Math.abs(preview.x-(anchor.x+anchor.width+12))<2,'Preview not anchored to directory row');
 await page.mouse.move(anchor.x+10,anchor.y+10);const fixed=await page.locator('.explorer-preview').boundingBox();assert(Math.abs(fixed.x-preview.x)<1,'Preview follows mouse');
 await page.locator('#explorer-title').hover();await page.waitForTimeout(250);
 assert(await page.locator('.explorer-preview').getAttribute('aria-hidden')==='true','Preview did not hide');
 await act('door');await until(()=>__explorer.item.model.door.hinge.rotation.y< -1.6);
 await act('menu');assert(await page.locator('#cafe-menu').evaluate(d=>d.open),'Café menu not connected');await page.locator('#cafe-menu .dialog-close').click();
 const angle=await page.evaluate(()=>__explorer.controls.getAzimuthalAngle());const box=await page.locator('.explorer-canvas').boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2+100,box.y+box.height/2+15,{steps:10});await page.mouse.up();await page.waitForTimeout(300);
 assert(await page.evaluate(a=>Math.abs(__explorer.controls.getAzimuthalAngle()-a)>.03,angle),'Explorer drag broken');
 await page.locator('#explorer-zoom-in').click();await until(()=>__explorer.camera.zoom>1.59);await page.locator('#explorer-reset').click();assert(await page.evaluate(()=>__explorer.camera.zoom===1.45),'Reset failed');
 await page.locator('[data-explorer-detail="0"]').hover();await until(()=>document.querySelectorAll('.explorer-part-label:not([hidden])').length===1)
 await page.locator('[data-explorer-detail="0"]').click();await until(()=>__explorer.state.focus===0&&__explorer.camera.zoom>2.35)
 await page.locator('[data-explorer-detail="0"]').click();await until(()=>__explorer.state.focus===null&&Math.abs(__explorer.camera.zoom-1.45)<.01)
 checks.push('details: hover shows one label, click turns and zooms to it, click again returns')
 await page.locator('#explorer-label-toggle').click();await until(()=>document.querySelectorAll('.explorer-part-label:not([hidden])').length>0);
 await page.locator('[data-explorer-colour="2"]').click();assert(await page.evaluate(()=>__explorer.item.colourIndex===2&&__series.items.cafe.colourIndex===0),'Explorer palette affected collection');
 await page.locator('#explorer-night').click();await page.waitForTimeout(900);assert(await page.evaluate(()=>__explorer.state.night&&!__series.state.night),'Night leaked to Collection');
 await page.locator('#explorer-night').click();
 await page.locator('#explorer-turntable').click();const a=await page.evaluate(()=>__explorer.controls.getAzimuthalAngle());await page.waitForFunction(a=>Math.abs(__explorer.controls.getAzimuthalAngle()-a)>.005,a,{timeout:12000});await page.locator('#explorer-reset').click();
 console.log('verified step');checks.push('anchored static hover preview; café door and menu; drag, zoom/reset, labels, independent palette/night, turntable');
 for(const id of ['grocery','bakery','flowers','sweets','books','pizza','laundry','post','tram']){
  console.log('checking',id);await choose(id);
  assert(await page.evaluate(()=>__explorer.renderer.domElement.dataset.testId==='stable-renderer'&&__explorer.item.wrapper.parent.children.filter(o=>o.userData.buildingId).length===1),'Renderer recreated or old scene retained');

  const fits=await page.evaluate(()=>__explorer.item.framing.x<=1&&__explorer.item.framing.y<=1);assert(fits,id+' default framing clips');
  await page.locator('[data-explorer-colour="1"]').click();assert(await page.evaluate(()=>__explorer.item.colourIndex===1),'Palette not connected '+id);
  if(id==='grocery'){await act('shutter');await until(()=>__explorer.adapter.state.shutter);}
  if(['bakery','flowers','sweets','books','pizza','laundry','post'].includes(id)){await act('door');await until(()=>__explorer.adapter.state.door);}
  if(id==='bakery'){await act('pastries');assert(await page.evaluate(()=>!__explorer.item.model.pastries.visible),'Pastries not hidden');await act('take');}
  if(id==='flowers'){await act('vent');await act('pick');}
  if(id==='books'){await act('book');await act('lights');}
  if(id==='pizza'){await act('box');await act('oven');}
  if(id==='laundry'){await act('wash');await page.waitForTimeout(300);assert(await page.evaluate(()=>__explorer.item.model.state.speed>0),'Washer not spinning');assert(await page.locator('[data-explorer-action="machine"]').isDisabled(),'Machine door not locked');await act('wash');await act('machine');await act('vend');}
  if(id==='post'){await act('letter');await until(()=>__explorer.item.model.letterRunning);await act('parcel');assert(await page.evaluate(()=>__explorer.item.model.parcelRunning),'Parcel not triggered');}
  if(id==='tram'){await act('doors');await until(()=>__explorer.item.model.state.doorsOpen);await act('ticket');await until(()=>__explorer.item.model.state.ticketRunning);await act('doors');}
  if(await page.locator('#explorer-cutaway').isVisible()){await page.locator('#explorer-cutaway').click();assert(await page.evaluate(()=>__explorer.adapter.state.seeThrough),'Cutaway not connected');await page.locator('#explorer-cutaway').click();}
 }
 console.log('verified step');checks.push('all ten models individually framed with one stable renderer; all existing dedicated actions, supported cutaways and palettes');
 await page.locator('#explorer').screenshot({path:'screenshots/explorer-desktop.png'});
 await page.locator('#explorer-fullscreen').click();await until(()=>!!document.fullscreenElement||document.querySelector('.explorer-expanded'));await page.waitForTimeout(300);await page.locator('#explorer-fullscreen').click();await page.waitForTimeout(300);
 await page.locator('#explorer-previous').click();assert(await page.evaluate(()=>__explorer.state.selected==='post'),'Previous not connected');await page.locator('#explorer-next').click();assert(await page.evaluate(()=>__explorer.state.selected==='tram'),'Next not connected');
 // A normal wheel gesture scrolls the page, not the model.
 const zoom=await page.evaluate(()=>__explorer.camera.zoom);await page.locator('.explorer-canvas').hover();await page.mouse.wheel(0,180);await page.waitForTimeout(400);assert(await page.evaluate(z=>__explorer.camera.zoom===z,zoom),'Wheel unexpectedly zoomed Explorer');
 await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(500);const paused=await page.evaluate(()=>__explorer.frames);await page.waitForTimeout(300);assert(await page.evaluate(n=>__explorer.frames===n,paused),'Offscreen Explorer kept drawing');
 await page.goto((process.env.BASE_URL||'http://127.0.0.1:5176/')+'#explore/laundry',{waitUntil:'load'});await until(()=>window.__explorer?.item?.id==='laundry'&&__explorer.state.visible);await page.waitForTimeout(500);assert(await page.evaluate(()=>__series.state.active==='collection'),'Deep link changed collection');
 await page.setViewportSize({width:390,height:844});await page.locator('#explorer').scrollIntoViewIfNeeded();await page.waitForTimeout(500);assert(await page.evaluate(()=>document.documentElement.scrollWidth===innerWidth),'390px horizontal overflow');await page.locator('#explorer').screenshot({path:'screenshots/explorer-mobile.png'});
 await page.locator('[data-explore="post"]').click();await until(()=>__explorer.item.id==='post');await act('letter');assert(await page.evaluate(()=>__explorer.item.model.letterRunning),'Mobile interaction failed');
 await page.locator('#explorer-fullscreen').click();await until(()=>!!document.fullscreenElement||document.querySelector('.explorer-expanded'));await page.waitForTimeout(300);await page.screenshot({path:'screenshots/explorer-mobile-fullscreen.png'});await page.locator('#explorer-fullscreen').click();
 await page.emulateMedia({reducedMotion:'reduce'});await choose('cafe');await act('door');await until(()=>__explorer.item.model.door.hinge.rotation.y< -1.8);
 assert(await page.evaluate(()=>__series.state.collectionPage===0&&__series.items.cafe.colourIndex===0),'Collection state changed');
 console.log('verified step');checks.push('fullscreen, previous/next, page-wheel scrolling, offscreen pause, direct hash restore, 390px/mobile interaction/fullscreen and reduced motion');
 assert(errors.length===0,errors.join('\n'));const report={passed:true,checks,consoleErrors:errors};await writeFile('screenshots/explorer-verification.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));passed=true;
}catch(error){await page.screenshot({path:'screenshots/explorer-failure.png',fullPage:true}).catch(()=>{});throw error;}finally{await closeBrowser(browser,passed);}
