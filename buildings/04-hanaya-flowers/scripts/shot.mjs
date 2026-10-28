// Usage: node scripts/shot.mjs name [az=45] [el=39] [zoom=1] [x y z (look-at, default 0 2.75 0)] — screenshots the scene canvas area
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
const [name, az = 45, el = 39, zoom = 1, tx = 0, ty = 2.75, tz = 0, w = 1440, h = 1000] = process.argv.slice(2);
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (['error', 'warning'].includes(m.type()) && !m.text().includes('GL Driver')) errors.push(m.text()); });
await page.goto(process.env.BASE_URL || 'http://127.0.0.1:5177/', { waitUntil: 'domcontentloaded' });
try { await page.waitForFunction(() => window.__flowers && window.__flowers.frames > 0, null, { timeout: 20000 }); } catch (e) { console.log('LOAD FAILED\n' + errors.join('\n')); await browser.close(); process.exit(1); }
await page.evaluate(([az, el, zoom, tx, ty, tz]) => {
  const { camera, controls } = window.__flowers;
  const a = az * Math.PI / 180, e = el * Math.PI / 180, d = 28;
  controls.target.set(tx, ty, tz);
  camera.position.set(tx + Math.sin(a) * Math.cos(e) * d, ty + Math.sin(e) * d, tz + Math.cos(a) * Math.cos(e) * d);
  camera.zoom = zoom; camera.updateProjectionMatrix(); controls.update();
}, [+az, +el, +zoom, +tx, +ty, +tz]);
await page.waitForTimeout(500);
if (process.env.EVAL) await page.evaluate(process.env.EVAL);
await page.waitForTimeout(700);
const box = await page.locator('#scene').boundingBox();
await page.screenshot({ path: fileURLToPath(new URL(`../screenshots/${name}.png`, import.meta.url)), clip: box });
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'ok', JSON.stringify(await page.evaluate(() => ({ calls: window.__flowers.renderer.info.render.calls, tris: window.__flowers.renderer.info.render.triangles }))));
await browser.close();
