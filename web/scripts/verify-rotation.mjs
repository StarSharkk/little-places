import {closeBrowser} from './close-browser.mjs';
let checksPassed=false;
// Rotation: every place turns about its own footprint centre and never runs into its neighbours, whatever the angle.
// Start the dev server, then `npm run check:rotation`.
import {chromium} from 'playwright';
import {writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const out=name=>fileURLToPath(new URL(`../screenshots/${name}`,import.meta.url));
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1040},deviceScaleFactor:1});
const errors=[],checks=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const assert=(v,msg)=>{if(!v)throw new Error(msg);};
// put the camera at an exact angle around the current target, then wait until the page has laid out and drawn it
const turn=async(az,el)=>{await page.evaluate(([az,el])=>{const {camera,controls}=__series,t=controls.target,d=camera.position.distanceTo(t),a=az*Math.PI/180,e=el*Math.PI/180;controls.enableDamping=false;
 camera.position.set(t.x+Math.sin(a)*Math.cos(e)*d,t.y+Math.sin(e)*d,t.z+Math.cos(a)*Math.cos(e)*d);controls.update();window.__f=__series.frames;__series.invalidate();},[az,el]);
 await page.waitForFunction(()=>__series.frames>window.__f,null,{timeout:10000});};
// screen-space extent of each visible place's own geometry (shadows excluded) and where its hub lands
const measure=()=>page.evaluate(()=>{const {items,camera}=__series,r=document.querySelector('#scene').getBoundingClientRect(),res=[];
 for(const [id,item] of Object.entries(items)){if(!item.wrapper.visible)continue;item.wrapper.updateMatrixWorld(true);const V=item.wrapper.position.constructor;let lo=1e9,hi=-1e9;
  item.model.group.traverse(o=>{if(!o.isMesh||o.isLineSegments2)return;for(let parent=o;parent;parent=parent.parent)if(parent.name==='TramMotionRoot')return;const p=o.geometry.attributes.position,v=new V();for(let i=0;i<p.count;i+=5){v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld).project(camera);const x=(v.x+1)/2*r.width;lo=Math.min(lo,x);hi=Math.max(hi,x);}});
  const h=(item.hub||new V()).clone().multiplyScalar(item.wrapper.scale.x).add(item.wrapper.position).project(camera);
  res.push({id,lo,hi,hub:[(h.x+1)/2*r.width,(1-h.y)/2*r.height]});}
 return res;});
const AZ=[25,60,95,130,165,200,235,270,305,340],EL=[28,10,62];
try{
 await page.goto((process.env.BASE_URL||'http://127.0.0.1:5176/')+'#collection',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>!!window.__series&&__series.frames>0);await page.waitForTimeout(800);
 // ---- overview: no neighbours overlap at any angle, and every hub keeps its place on screen ----
 let worst=-1e9,hubDrift=0;const home={};
 for(const el of EL)for(const az of AZ){
  await turn(az,el);const m=await measure();
  for(let i=1;i<m.length;i++)worst=Math.max(worst,m[i-1].hi-m[i].lo);
  for(const p of m){const key=`${p.id}@${el}`;if(!home[key])home[key]=p.hub;else hubDrift=Math.max(hubDrift,Math.hypot(p.hub[0]-home[key][0],p.hub[1]-home[key][1]));}
 }
 assert(worst<=1,`Neighbouring places overlap by ${worst.toFixed(1)} px at some angle`);
 assert(hubDrift<1,`A place moved on screen while turning (${hubDrift.toFixed(2)} px)`);
 checks.push(`overview: ${AZ.length*EL.length} angles, closest neighbours ${(-worst).toFixed(0)} px apart at worst, hubs fixed (drift ${hubDrift.toFixed(2)} px)`);
 for(const [az,el,name] of [[25,28,'rotation-default'],[130,40,'rotation-130'],[250,62,'rotation-top']]){await turn(az,el);await page.mouse.move(5,5);await page.waitForTimeout(250);await page.screenshot({path:out(`${name}.png`)});}
 // ---- real drag: the row stays a row and the places turn in place ----
 await page.locator('[data-view="iso"]').click();await page.waitForTimeout(300);
 const before=await measure(),box=await page.locator('#scene').boundingBox();
 await page.mouse.move(box.x+box.width*.5,box.y+box.height*.5);await page.mouse.down();await page.mouse.move(box.x+box.width*.85,box.y+box.height*.45,{steps:20});await page.mouse.up();await page.waitForTimeout(900);
 const after=await measure();let dragOverlap=-1e9;for(let i=1;i<after.length;i++)dragOverlap=Math.max(dragOverlap,after[i-1].hi-after[i].lo);
 const moved=Math.max(...after.map((p,i)=>Math.abs(p.hub[0]-before[i].hub[0])));
 assert(dragOverlap<=1,`Places overlap after a drag (${dragOverlap.toFixed(1)} px)`);assert(moved<1,`Places slid sideways during a drag (${moved.toFixed(2)} px)`);
 checks.push('mouse drag in the overview: places turn in place without overlapping');
 // ---- every single place turns about its own footprint centre ----
 for(const id of Object.keys(await page.evaluate(()=>__series.items))){
  await page.evaluate(id=>__series.select(id),id);await page.waitForTimeout(700);await page.locator('[data-view="iso"]').click();await page.waitForTimeout(300);
  let drift=0,start=null;for(const az of [25,115,205,295]){await turn(az,28);const p=(await measure())[0];if(!start)start=p.hub;else drift=Math.max(drift,Math.hypot(p.hub[0]-start[0],p.hub[1]-start[1]));}
  assert(drift<1,`${id} swings off-centre while turning (${drift.toFixed(2)} px)`);
 }
 checks.push('all ten single views turn about their footprint centre');
 await page.evaluate(()=>__series.select('collection'));await page.waitForTimeout(500);
 assert(errors.length===0,errors.join('\n'));
 const report={passed:true,checkedAt:new Date().toISOString(),checks,consoleErrors:errors};
 await writeFile(out('rotation-verification.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
 checksPassed=true;
}catch(error){console.error(error);throw error;}finally{await closeBrowser(browser,checksPassed);}
