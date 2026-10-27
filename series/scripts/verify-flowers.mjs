// Hanaya Flowers inside the collection. Start `npm run dev` (5176) or set BASE_URL, then `npm run check:flowers`.
import {chromium} from 'playwright';
import {writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const out=name=>fileURLToPath(new URL(`../screenshots/${name}`,import.meta.url));
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1040},deviceScaleFactor:1});
const errors=[],checks=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const assert=(v,msg)=>{if(!v)throw new Error(msg);};
const until=fn=>page.waitForFunction(fn,null,{timeout:20000}).catch(()=>{});
const snap=async name=>{await page.mouse.move(10,10);await page.waitForTimeout(250);await page.screenshot({path:out(`${name}.png`),fullPage:true});};
const F='__series.items.flowers.model';
try{
 await page.goto((process.env.BASE_URL||'http://127.0.0.1:5176/')+'#flowers',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>!!window.__series);await page.waitForTimeout(500);
 assert(await page.evaluate(()=>__series.state.active==='flowers'&&__series.items.flowers.wrapper.visible&&!__series.items.bakery.wrapper.visible),'Deep link must show only the flower shop');
 for(const id of ['flower-door','vent','pick-bouquet','see-through'])assert(await page.locator('#'+id).isVisible(),`#${id} hidden`);
 for(const id of ['bakery-door','take-bread','door','shutter'])assert(await page.locator('#'+id).isHidden(),`#${id} should be hidden`);
 checks.push('#flowers deep link, contextual controls');await snap('flowers-desktop');
 await page.locator('#flower-door').click();await until(()=>__series.items.flowers.model.door.hinge.rotation.y<-1.6);
 assert(await page.evaluate(()=>__series.items.flowers.model.door.hinge.rotation.y<-1.6),'Door did not open');await snap('flowers-door-open');
 await page.locator('#flower-door').click();await until(()=>Math.abs(__series.items.flowers.model.door.hinge.rotation.y)<.01);
 // raycast click on the 3D door leaf
 const p=await page.evaluate(()=>{const f=__series.items.flowers.model,v=f.door.leaf.localToWorld(new f.door.leaf.position.constructor(.4,.75,.06)).project(__series.camera),r=document.querySelector('#scene').getBoundingClientRect();return[r.x+(v.x+1)*r.width/2,r.y+(1-v.y)*r.height/2];});
 await page.mouse.click(p[0],p[1]);await until(()=>__series.state.flowerDoorOpen);
 assert(await page.evaluate(()=>__series.state.flowerDoorOpen),'Clicking the 3D door must open it');await page.locator('#flower-door').click();
 checks.push('door from the button and from a click on the model');
 await page.locator('#vent').click();await until(()=>__series.items.flowers.model.vent.hinge.rotation.x<-.9);
 assert(await page.evaluate(()=>__series.items.flowers.model.vent.hinge.rotation.x<-.9),'Vent did not lift');await snap('flowers-vent');
 await page.locator('#vent').click();await until(()=>Math.abs(__series.items.flowers.model.vent.hinge.rotation.x)<.01);
 await page.locator('#see-through').click();assert(await page.evaluate(()=>!__series.items.flowers.model.roof.visible&&!__series.items.flowers.model.shell.visible),'See-through failed');await snap('flowers-cutaway');
 await page.locator('#pick-bouquet').click();await until(()=>__series.items.flowers.model.pickup.position.distanceTo(__series.items.flowers.model.pickAway)<.02);
 assert(await page.evaluate(()=>__series.items.flowers.model.pickup.position.distanceTo(__series.items.flowers.model.pickAway)<.02),'Bouquet did not move to the cart');
 await page.locator('#pick-bouquet').click();await until(()=>__series.items.flowers.model.pickup.position.distanceTo(__series.items.flowers.model.pickHome)<.02);
 await page.locator('#see-through').click();assert(await page.evaluate(()=>__series.items.flowers.model.roof.visible),'See-through did not restore');
 checks.push('glasshouse vent, see-through, bouquet pickup');
 const schemes=[['Butter yellow','f4d477'],['Pistachio','b9deca'],['Rose milk','f1cdd9'],['Blue hour','c7d9ed'],['Terracotta','f0b29d']];
 for(const [name,hex]of schemes){await page.getByRole('button',{name,exact:true}).click();await page.waitForTimeout(60);assert(await page.evaluate(h=>__series.items.flowers.model.materials.wall.color.getHexString()===h,hex),`Palette ${name} failed`);}
 await page.getByRole('button',{name:'Butter yellow',exact:true}).click();checks.push('five palettes');
 await page.locator('#labels-button').click();await page.waitForTimeout(400);assert(await page.locator('#labels .part-label:not([hidden])').count()>=3,'Labels missing');await snap('flowers-labels');await page.locator('#labels-button').click();
 await page.locator('#tab-collection').click();await page.waitForTimeout(400);
 assert(await page.evaluate(()=>Object.values(__series.items).filter(i=>i.wrapper.visible).length===5),'Overview must show 5 places');await snap('collection-desktop');
 await page.locator('[data-focus="flowers"]').click();await page.waitForTimeout(200);assert(await page.evaluate(()=>__series.state.active==='flowers'),'Caption navigation failed');
 checks.push('labels, 4-place overview and caption navigation');
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(400);
 assert(await page.evaluate(()=>document.documentElement.scrollWidth===innerWidth),'Mobile overflow');await snap('flowers-mobile');
 await page.locator('#tab-collection').click();await page.waitForTimeout(400);assert(await page.evaluate(()=>document.documentElement.scrollWidth===innerWidth),'Collection mobile overflow');await snap('collection-mobile');
 checks.push('390 px: flower shop and 4-place stacked overview without overflow');
 assert(errors.length===0,errors.join('\n'));
 const report={passed:true,checkedAt:new Date().toISOString(),checks,consoleErrors:errors};
 await writeFile(out('flowers-verification.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
