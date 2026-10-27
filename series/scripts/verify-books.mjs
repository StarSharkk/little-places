// The Little Bookshop inside the collection. Start the dev server, then `npm run check:books`.
import {chromium} from 'playwright';
import {writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const out=name=>fileURLToPath(new URL(`../screenshots/${name}`,import.meta.url));
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1040},deviceScaleFactor:1});
const errors=[],checks=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const assert=(v,msg)=>{if(!v)throw new Error(msg);};
const until=fn=>page.waitForFunction(fn,null,{timeout:20000}).catch(()=>{});
const snap=async name=>{await page.mouse.move(10,10);await page.waitForTimeout(350);await page.screenshot({path:out(`${name}.png`),fullPage:true});};
// screen position of a local point on one of the model's moving parts
const click3d=async(part,local)=>{const p=await page.evaluate(([part,local])=>{const b=__series.items.books.model,o=part==='door'?b.doors[1].leaf:b.book.leaf;o.updateWorldMatrix(true,false);const v=o.localToWorld(new o.position.constructor(...local)).project(__series.camera),r=document.querySelector('#scene').getBoundingClientRect();return[r.x+(v.x+1)*r.width/2,r.y+(1-v.y)*r.height/2];},[part,local]);await page.mouse.click(p[0],p[1]);};
// an exact camera for the rooftop and interior shots
const view=(az,el,zoom,dy=0,focus=false)=>page.evaluate(([az,el,zoom,dy,focus])=>{const {camera,controls,state}=__series,t=controls.target;controls.enableDamping=false;if(focus){const o=__series.items.books.model.book.leaf;o.updateWorldMatrix(true,false);o.getWorldPosition(t);}t.y+=dy;const a=az*Math.PI/180,e=el*Math.PI/180;camera.position.set(t.x+Math.sin(a)*Math.cos(e)*28,t.y+Math.sin(e)*28,t.z+Math.cos(a)*Math.cos(e)*28);camera.zoom=zoom;camera.updateProjectionMatrix();controls.update();state.zoomGoal=null;},[az,el,zoom,dy,focus]);
try{
 await page.goto((process.env.BASE_URL||'http://127.0.0.1:5176/')+'#books',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>!!window.__series&&__series.frames>0);await page.waitForTimeout(600);
 assert(await page.evaluate(()=>__series.state.active==='books'&&__series.items.books.wrapper.visible&&!__series.items.cafe.wrapper.visible),'Deep link must show only the bookshop');
 for(const id of ['books-door','books-lights','books-book','see-through'])assert(await page.locator('#'+id).isVisible(),`#${id} hidden`);
 for(const id of ['door','sweets-door','flower-door','bakery-door'])assert(await page.locator('#'+id).isHidden(),`#${id} should be hidden`);
 assert(await page.evaluate(()=>__series.items.books.colourIndex===1&&__series.items.books.model.materials.wall.color.getHexString()==='a8cdbb'),'Default scheme must be mint');
 checks.push('#books deep link, contextual controls, mint by default');await snap('books-desktop');
 await page.locator('[data-view="front"]').click();await page.waitForTimeout(300);await snap('books-front');
 await page.locator('[data-view="side"]').click();await page.waitForTimeout(300);await snap('books-right');
 await page.locator('[data-view="iso"]').click();await page.waitForTimeout(200);
 await view(30,82,1.5,1.4);await page.waitForTimeout(300);await snap('books-rooftop');
 await page.locator('[data-view="iso"]').click();await page.waitForTimeout(200);checks.push('default, front, right and rooftop views');

 await page.locator('#books-door').click();await until(()=>__series.state.booksDoorAmount>.99);
 assert(await page.evaluate(()=>Math.abs(__series.items.books.model.doors[1].hinge.rotation.y)>1.3),'Door did not open');
 await page.locator('#books-door').click();await until(()=>__series.state.booksDoorAmount<.01);
 await click3d('door',[-.28,.45,.06]);await until(()=>__series.state.booksDoorOpen);assert(await page.evaluate(()=>__series.state.booksDoorOpen),'Clicking the 3D door must open it');
 checks.push('double door from the button and from a click on the model');
 await page.locator('#books-book').click();await until(()=>__series.state.bookAmount>.99);
 assert(await page.evaluate(()=>Math.abs(__series.items.books.model.book.hinge.rotation.z)<.01),'Book did not open');
 await view(70,30,4.5,.2,true);await page.waitForTimeout(300);await snap('books-open');
 await page.locator('#books-book').click();await until(()=>__series.state.bookAmount<.01);await page.locator('[data-view="iso"]').click();await page.waitForTimeout(300);
 await click3d('book',[.13,-.03,0]);await until(()=>__series.state.bookOpen);assert(await page.evaluate(()=>__series.state.bookOpen),'Clicking the closed book must open it');
 await page.locator('#books-book').click();await page.locator('#books-door').click();await page.locator('[data-view="iso"]').click();
 checks.push('open a book from the button and from a click on the model');

 const before=await page.evaluate(()=>__series.items.books.model.materials.shelf.color.getHexString());
 await page.locator('#books-lights').click();await page.waitForTimeout(200);
 assert(await page.evaluate(b=>!__series.items.books.model.state.lights&&__series.items.books.model.materials.shelf.color.getHexString()!==b,before),'Lights off must darken the interior');
 await snap('books-lights-off');await page.locator('#books-lights').click();
 assert(await page.evaluate(b=>__series.items.books.model.materials.shelf.color.getHexString()===b,before),'Lights on must restore the interior');
 checks.push('interior lights off and on');
 await page.locator('#see-through').click();await page.waitForTimeout(200);
 assert(await page.evaluate(()=>!__series.items.books.model.shell.visible&&!__series.items.books.model.roof.visible),'See-through must lift the façade and roof');
 await view(45,30,2.1,-.9);await page.waitForTimeout(300);await snap('books-interior');
 await page.locator('#see-through').click();await page.locator('[data-view="iso"]').click();checks.push('see-through interior');

 const walls=new Set();
 for(const name of ['Butter yellow','Pistachio','Rose milk','Blue hour','Terracotta']){await page.getByRole('button',{name,exact:true}).click();await page.waitForTimeout(60);walls.add(await page.evaluate(()=>__series.items.books.model.materials.wall.color.getHexString()));}
 assert(walls.size===5,'Five schemes must give five wall colours');
 assert(await page.evaluate(()=>__series.items.books.model.materials.booksOut[0].color.getHexString()==='d77c68'),'Books must keep their own colours');
 await page.getByRole('button',{name:'Pistachio',exact:true}).click();checks.push('five colour schemes (building only)');
 await page.locator('#labels-button').click();await page.waitForTimeout(400);
 assert(await page.locator('#labels .part-label:not([hidden])').count()===6,'Six labels expected');await snap('books-labels');await page.locator('#labels-button').click();
 await page.locator('#tab-collection').click();await page.waitForTimeout(400);
 assert(await page.evaluate(()=>Object.values(__series.items).filter(i=>i.wrapper.visible).length===6),'Overview must show 6 places');
 await page.locator('[data-focus="books"]').click();await page.waitForTimeout(200);assert(await page.evaluate(()=>__series.state.active==='books'),'Caption navigation failed');
 checks.push('labels, 6-place overview, caption navigation');
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(400);
 assert(await page.evaluate(()=>document.documentElement.scrollWidth===innerWidth),'Mobile overflow');await snap('books-mobile');
 checks.push('390 px without overflow');
 assert(errors.length===0,errors.join('\n'));
 const report={passed:true,checkedAt:new Date().toISOString(),checks,consoleErrors:errors};
 await writeFile(out('books-verification.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
