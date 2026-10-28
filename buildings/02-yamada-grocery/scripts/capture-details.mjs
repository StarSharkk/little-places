import { chromium } from 'playwright';
const output=new URL('../screenshots/',import.meta.url);
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
try {
 await page.goto(process.env.BASE_URL || 'http://127.0.0.1:5174/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>!!window.__grocery);
 console.log(JSON.stringify(await page.evaluate(()=>({audit:__grocery.building.layoutAudit,calls:__grocery.renderer.info.render.calls,triangles:__grocery.renderer.info.render.triangles,textures:__grocery.renderer.info.memory.textures})),null,2));
 await page.getByRole('button',{name:'Open the shop'}).click();await page.waitForTimeout(1500);
 async function pose(target,position,zoom){await page.evaluate(({target,position,zoom})=>{const g=__grocery;g.controls.enableDamping=false;g.controls.update();g.controls.maxPolarAngle=Math.PI/2;g.camera.clearViewOffset();g.controls.target.set(...target);g.camera.position.set(...position);g.camera.zoom=zoom;g.camera.updateProjectionMatrix();g.controls.update();}, {target,position,zoom});await page.waitForTimeout(250);}
 await pose([0,1.73,1.5],[0,1.73,16],3.0);
 await page.screenshot({path:new URL('interior-detail.png',output).pathname,clip:{x:350,y:245,width:740,height:480}});
 await pose([2.7,2.1,0],[17,2.1,0],3);
 await page.screenshot({path:new URL('posters-detail.png',output).pathname,clip:{x:340,y:240,width:760,height:490}});
 await pose([2.7,1.24,-.59],[17,1.9,-.59],5.2);
 await page.screenshot({path:new URL('capsules-detail.png',output).pathname,clip:{x:480,y:240,width:480,height:520}});
 console.log(JSON.stringify({errors}));
}finally{await browser.close();}
