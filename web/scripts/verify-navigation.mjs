import {closeBrowser} from './close-browser.mjs';
let checksPassed=false;
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const output=new URL('../screenshots/',import.meta.url);await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
const errors=[];page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
const assert=(value,message)=>{if(!value)throw new Error(message);};

try{
 await page.goto((process.env.BASE_URL||'http://127.0.0.1:5176/')+'#collection',{waitUntil:'load'});
 await page.waitForFunction(()=>window.__series);await page.waitForTimeout(250);
 assert(await page.evaluate(()=>Math.abs(__series.camera.zoom-3.2)<.001),'Collection did not open at 320%');
 assert(await page.getByRole('button',{name:'Previous buildings'}).isDisabled(),'Collection previous button should begin disabled');
 assert(!await page.getByRole('button',{name:'Next buildings'}).isDisabled(),'Collection next button should begin enabled');
 await page.screenshot({path:new URL('navigation-collection-start.png',output).pathname,fullPage:true});

 await page.getByRole('button',{name:'Next buildings'}).click();
 assert(await page.evaluate(()=>__series.state.collectionPage===1),'Collection did not advance to page 2');
 const settled=()=>page.waitForFunction(()=>Math.abs(__series.state.collectionShift-__series.collectionShiftGoal())<.02,null,{timeout:8000}).catch(()=>{});
 await settled();
 assert(await page.evaluate(()=>Math.abs(__series.state.collectionShift-__series.collectionShiftGoal())<.02),'Collection glide did not settle smoothly');
 // page on to the end; four places per page, so the last page is (places − 4)
 const lastPage=await page.evaluate(()=>Object.keys(__series.items).length-4);
 for(let i=1;i<lastPage;i++){await page.getByRole('button',{name:'Next buildings'}).click();await settled();}
 assert(await page.evaluate(last=>__series.state.collectionPage===last&&Math.abs(__series.state.collectionShift-__series.collectionShiftGoal())<.02,lastPage),'Collection did not reach its final page');
 assert(await page.getByRole('button',{name:'Next buildings'}).isDisabled(),'Collection next button should be disabled at the end');
 await page.screenshot({path:new URL('navigation-collection-end.png',output).pathname,fullPage:true});

 await page.getByRole('tab',{name:'01 Sakura Café',exact:true}).click();
 assert(await page.evaluate(()=>Math.abs(__series.camera.zoom-1.45)<.001),'Single building did not open at 145%');
 assert(await page.getByRole('button',{name:'Previous building'}).isDisabled(),'First building previous button should be disabled');
 await page.getByRole('button',{name:'Next building'}).click();
 assert(await page.evaluate(()=>__series.state.active==='grocery'),'Single building next button did not select the grocery');
 await page.waitForTimeout(800);
 assert(await page.evaluate(()=>Math.abs(__series.state.singleSlide)<.02),'Single building slide did not settle');
 assert(await page.evaluate(()=>Math.abs(__series.camera.zoom-1.45)<.001),'Single building navigation changed the default zoom');

 await page.setViewportSize({width:390,height:844});
 await page.getByRole('tab',{name:'00 The collection 10',exact:true}).click();await page.waitForTimeout(200);
 assert(await page.evaluate(()=>Math.abs(__series.camera.zoom-1.55)<.001),'Mobile collection did not open at 155%');
 assert(await page.evaluate(()=>document.documentElement.scrollWidth===innerWidth),'Mobile gallery caused horizontal page overflow');
 await page.getByRole('button',{name:'Next buildings'}).click();await page.waitForTimeout(850);
 assert(await page.evaluate(()=>__series.state.collectionPage===1),'Mobile collection arrow did not advance one place');
 await page.screenshot({path:new URL('navigation-collection-mobile.png',output).pathname,fullPage:true});
 assert(errors.length===0,errors.join('\n'));
 console.log(JSON.stringify({passed:true,checks:['320% collection default (155% on phones)','145% single default','desktop collection glide and endpoints','single-place next navigation','mobile one-place gallery','no console errors']},null,2));
 checksPassed=true;
}catch(error){console.error(error);throw error;}finally{await closeBrowser(browser,checksPassed);}
