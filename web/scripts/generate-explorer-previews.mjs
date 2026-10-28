import {chromium} from 'playwright';
import {closeBrowser} from './close-browser.mjs';
const browser=await chromium.launch();let passed=false;
try{const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});await page.goto('http://127.0.0.1:5176/#cafe',{waitUntil:'load'});await page.waitForFunction(()=>window.__series?.frames>0);
for(const id of ['cafe','grocery','bakery','flowers','sweets','books','pizza','laundry','post','tram']){
 await page.evaluate(id=>{__series.select(id);if(id==='tram'){__series.items.tram.model.state.auto=false;__series.items.tram.model.settle();}__series.state.zoomGoal=null;__series.camera.zoom=.8;__series.camera.updateProjectionMatrix();__series.invalidate();},id);await page.waitForTimeout(250);
 const clip=await page.evaluate(id=>{const s=__series,i=s.items[id],T=s.camera.position.constructor;let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
 // Reuse the exact fitted collection camera; crop the canvas around the visible object.
 const box=i.model.footprint;const bounds=box??null;const positions=[];
 if(bounds){for(const x of [bounds.min[0],bounds.max[0]])for(const y of [bounds.min[1],bounds.max[1]])for(const z of [bounds.min[2],bounds.max[2]])positions.push(i.wrapper.localToWorld(new T(x,y,z)));}
 else i.wrapper.traverse(o=>{if(!o.isMesh||o.isLineSegments2)return;let v=true;for(let p=o;p;p=p.parent)if(!p.visible)v=false;if(!v)return;const g=o.geometry;g.computeBoundingBox();const b=g.boundingBox;for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z])positions.push(o.localToWorld(new T(x,y,z)));});
 for(const p of positions){p.project(s.camera);minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y);}const r=document.querySelector('#scene').getBoundingClientRect();const x=Math.max(r.x,r.x+(minX+1)*r.width/2-10),y=Math.max(r.y,r.y+(1-maxY)*r.height/2-10),right=Math.min(r.right,r.x+(maxX+1)*r.width/2+10),bottom=Math.min(r.bottom,r.y+(1-minY)*r.height/2+10);return {x,y,width:right-x,height:bottom-y};},id);
 await page.screenshot({path:`public/previews/${id}.png`,clip});console.log('preview',id);
}
await page.evaluate(()=>__explorer.open('cafe'));await page.waitForTimeout(1000);await page.locator('#explorer').screenshot({path:'screenshots/explorer-stage1.png'});passed=true;
}finally{await closeBrowser(browser,passed);}
