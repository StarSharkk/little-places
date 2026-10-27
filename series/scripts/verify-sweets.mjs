// Sakura Sweets (the corner dessert shop) inside the collection. Start the dev server, then `npm run check:sweets`.
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
const click3d=async(name,local)=>{const p=await page.evaluate(([name,local])=>{const s=__series.items.sweets.model,o=name==='door'?s.pickables[0]:s.pickables[1],v=o.localToWorld(new o.position.constructor(...local)).project(__series.camera),r=document.querySelector('#scene').getBoundingClientRect();return[r.x+(v.x+1)*r.width/2,r.y+(1-v.y)*r.height/2];},[name,local]);await page.mouse.click(p[0],p[1]);};
try{
 await page.goto((process.env.BASE_URL||'http://127.0.0.1:5176/')+'#sweets',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>!!window.__series);await page.waitForTimeout(600);
 assert(await page.evaluate(()=>__series.state.active==='sweets'&&__series.items.sweets.wrapper.visible&&!__series.items.cafe.wrapper.visible),'Deep link must show only the dessert shop');
 for(const id of ['sweets-door','sweets-menu-button'])assert(await page.locator('#'+id).isVisible(),`#${id} hidden`);
 for(const id of ['door','menu-button','bakery-door','flower-door'])assert(await page.locator('#'+id).isHidden(),`#${id} should be hidden`);
 assert(await page.evaluate(()=>__series.items.sweets.model.shop.sub==='SWEETS'),'Shop copy is not the dessert shop');
 checks.push('#sweets deep link, contextual controls, SWEETS signage');await snap('sweets-desktop');
 await page.locator('#sweets-door').click();await until(()=>__series.items.sweets.model.state.open>.99);
 assert(await page.evaluate(()=>__series.items.sweets.model.state.open>.99),'Door did not open');await snap('sweets-door-open');
 await page.locator('#sweets-door').click();await until(()=>__series.items.sweets.model.state.open<.01);
 await click3d('door',[.5,1.0,.06]);await until(()=>__series.state.sweetsDoorOpen);assert(await page.evaluate(()=>__series.state.sweetsDoorOpen),'Clicking the 3D door must open it');
 await page.locator('#sweets-door').click();checks.push('door from the button and from a click on the model');
 await click3d('sign',[1.0,.45,.11]);await page.waitForTimeout(300);assert(await page.evaluate(()=>document.querySelector('#sweets-menu').open),'Sign click must open the dessert menu');
 await snap('sweets-menu');await page.keyboard.press('Escape');await page.waitForTimeout(150);
 await page.locator('#sweets-menu-button').click();assert(await page.evaluate(()=>document.querySelector('#sweets-menu').open),'Menu button failed');await page.keyboard.press('Escape');
 checks.push('dessert menu from the sign and from the button');
 const schemes=['Butter yellow','Pistachio','Rose milk','Blue hour','Terracotta'];
 for(const [i,name]of schemes.entries()){await page.getByRole('button',{name,exact:true}).click();await page.waitForTimeout(60);assert(await page.evaluate(i=>__series.items.sweets.colourIndex===i,i),`Palette ${name} failed`);}
 await page.getByRole('button',{name:'Butter yellow',exact:true}).click();checks.push('five palettes');
 await page.locator('#labels-button').click();await page.waitForTimeout(400);assert(await page.locator('#labels .part-label:not([hidden])').count()===3,'Labels missing');await page.locator('#labels-button').click();
 await page.locator('#tab-collection').click();await page.waitForTimeout(400);
 assert(await page.evaluate(()=>Object.values(__series.items).filter(i=>i.wrapper.visible).length===5),'Overview must show 5 places');await snap('collection-desktop');
 await page.locator('[data-focus="sweets"]').click();await page.waitForTimeout(200);assert(await page.evaluate(()=>__series.state.active==='sweets'),'Caption navigation failed');
 checks.push('labels, 5-place overview, caption navigation');
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(400);
 assert(await page.evaluate(()=>document.documentElement.scrollWidth===innerWidth),'Mobile overflow');await snap('sweets-mobile');
 await page.locator('#tab-collection').click();await page.waitForTimeout(400);assert(await page.evaluate(()=>document.documentElement.scrollWidth===innerWidth),'Collection mobile overflow');await snap('collection-mobile');
 checks.push('390 px without overflow');
 assert(errors.length===0,errors.join('\n'));
 const report={passed:true,checkedAt:new Date().toISOString(),checks,consoleErrors:errors};
 await writeFile(out('sweets-verification.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
