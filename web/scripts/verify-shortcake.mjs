import {chromium} from 'playwright';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url);
const before=JSON.parse(await readFile(new URL('screenshots/roof-scope-before.json',root),'utf8'));
const unchanged=[];
for(const [path,hash]of Object.entries(before)){
 const current=createHash('sha256').update(await readFile(new URL(path,root))).digest('hex');
 if(current!==hash)throw new Error(`Out-of-scope modification: ${path}`);unchanged.push(path);
}
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1040},deviceScaleFactor:2});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto((process.env.BASE_URL||'http://127.0.0.1:5176/')+'#bakery',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>!!window.__series);await page.waitForTimeout(300);
 const audit=await page.evaluate(()=>__series.items.bakery.model.roof.userData.cakeAudit);
 if(audit.diameterRatio<.30||audit.diameterRatio>.35)throw new Error('Cake diameter out of range');
 if(Math.abs(audit.pedestalBottomY-audit.roofSurfaceY)>.00001)throw new Error('Floating or intersecting pedestal');
 if(audit.strawberryCount!==4||audit.creamRosetteCount!==8||audit.closestToppingCenters<.35)throw new Error('Topping layout is crowded or incomplete');
 if(audit.decorationTopY-audit.roofSurfaceY>1.3)throw new Error('Decoration too tall');
 const oldNames=await page.evaluate(()=>{const names=[];__series.items.bakery.model.roof.traverse(o=>{if(/croissant|Bonjour roof sign/i.test(o.name))names.push(o.name);});return names;});
 if(oldNames.length)throw new Error('Old decoration still present');
 await page.screenshot({path:new URL('screenshots/shortcake-desktop.png',root).pathname,fullPage:true});
 const center=await page.evaluate(()=>{const p=__series.camera.position.clone().set(0,4.15,0).project(__series.camera),r=document.querySelector('#scene').getBoundingClientRect();return{x:r.x+(p.x+1)*r.width/2,y:r.y+(1-p.y)*r.height/2};});
 await page.screenshot({path:new URL('screenshots/shortcake-detail.png',root).pathname,clip:{x:center.x-150,y:center.y-130,width:300,height:260}});
 if(errors.length)throw new Error(errors.join('\n'));
 const report={passed:true,checkedAt:new Date().toISOString(),scopeUnchanged:unchanged,audit,oldRoofDecorationNodes:oldNames,consoleErrors:errors};
 await writeFile(new URL('screenshots/shortcake-verification.json',root),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
