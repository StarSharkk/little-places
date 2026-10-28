import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import checks from './browser-checks.js';

const output = new URL('../screenshots/', import.meta.url);
await mkdir(output, {recursive:true});
const browser = await chromium.launch({channel:'chrome',headless:true});
const page = await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
const consoleErrors=[];
page.on('console',message=>{if(message.type()==='error')consoleErrors.push(message.text());});
try {
 const results=await checks(page);
 // Mobile labels must also remain inside the viewport when explicitly enabled.
 await page.getByRole('button',{name:'Details',exact:false}).click();
 await page.waitForTimeout(100);
 const detailsOverflow = await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
 if(detailsOverflow)throw new Error('Mobile annotations overflow the viewport');
 await page.getByRole('button',{name:'Details',exact:false}).click();
 await page.mouse.move(15,50);
 await page.screenshot({path:new URL('mobile.png',output).pathname});
 await page.setViewportSize({width:1440,height:1000});
 await page.getByRole('button',{name:'Reset view',exact:true}).click();
 await page.waitForTimeout(700);
 await page.screenshot({path:new URL('desktop.png',output).pathname});
 await page.getByRole('button',{name:'Open the shop'}).click();
 await page.waitForTimeout(1300);
 await page.screenshot({path:new URL('shop-open.png',output).pathname});
 await page.getByRole('button',{name:'Close the shop'}).click();
 await page.getByRole('button',{name:'Gacha corner',exact:true}).click();
 await page.waitForTimeout(500);
 await page.screenshot({path:new URL('gacha-corner.png',output).pathname});
 await page.getByRole('button',{name:'Reset view',exact:true}).click();
 await page.waitForTimeout(700);
 const atlas=await page.evaluate(()=>__grocery.building.atlas.canvas.toDataURL('image/png').split(',')[1]);
 await writeFile(new URL('texture-atlas.png',output),Buffer.from(atlas,'base64'));
 if(consoleErrors.length)throw new Error(`Browser console errors: ${consoleErrors.join('\n')}`);
 const report={...results,consoleErrors,extraChecks:['mobile annotations within viewport'],checkedAt:new Date().toISOString(),viewports:['1440 × 1000','390 × 844'],browser:'Chrome via Playwright'};
 await writeFile(new URL('verification.json',output),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report,null,2));
} finally {await browser.close();}
