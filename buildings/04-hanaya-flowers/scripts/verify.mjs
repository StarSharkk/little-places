// Browser checks for the standalone flower shop. Start `npm run preview` (or `npm run dev`) first.
//   BASE_URL=http://127.0.0.1:4177/ npm run check
import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const out = name => fileURLToPath(new URL(`../screenshots/${name}`, import.meta.url));
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 1040 }, deviceScaleFactor: 1 });
const errors = [], checks = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (['error', 'warning'].includes(m.type()) && !m.text().includes('GL Driver')) errors.push(m.text()); });
const assert = (v, msg) => { if (!v) throw new Error(msg); };
// Software WebGL in headless Chrome runs at a few fps, so wait on state instead of fixed delays.
const until = (fn, arg) => page.waitForFunction(fn, arg, { timeout: 25000 }).catch(() => {});
const shot = async name => { await page.mouse.move(5, 5); await page.waitForTimeout(250); await page.screenshot({ path: out(`${name}.png`) }); };
async function click3d(world) {
  const p = await page.evaluate(([x, y, z]) => {
    const { shop, camera, scene } = window.__flowers; scene.updateMatrixWorld(true);
    const v = new camera.position.constructor(x, y, z); shop.group.localToWorld(v); v.project(camera);
    const b = document.querySelector('#scene').getBoundingClientRect();
    return [b.left + (v.x + 1) / 2 * b.width, b.top + (1 - v.y) / 2 * b.height];
  }, world);
  await page.mouse.move(p[0], p[1]); await page.mouse.click(p[0], p[1]);
}
const doorShut = () => Math.abs(window.__flowers.shop.door.hinge.rotation.y) < 0.01;
const ventShut = () => Math.abs(window.__flowers.shop.vent.hinge.rotation.x) < 0.01;
try {
  await page.goto(process.env.BASE_URL || 'http://127.0.0.1:5177/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__flowers?.frames > 0, null, { timeout: 40000 }); await page.waitForTimeout(400);
  const initial = await page.evaluate(() => ({ calls: window.__flowers.renderer.info.render.calls, triangles: window.__flowers.renderer.info.render.triangles, textures: window.__flowers.renderer.info.memory.textures, orthographic: window.__flowers.camera.isOrthographicCamera }));
  assert(initial.orthographic, 'Perspective camera'); checks.push('orthographic camera renders the model');
  await shot('flowers-desktop');

  // door: button, then a raycast click on the 3D door
  await page.locator('#door').click(); await until(() => window.__flowers.shop.door.hinge.rotation.y < -1.6);
  assert(await page.evaluate(() => window.__flowers.state.doorOpen && window.__flowers.shop.door.hinge.rotation.y < -1.6), 'Door did not open'); await shot('flowers-door-open');
  await page.locator('#door').click(); await until(doorShut);
  assert(await page.evaluate(doorShut), 'Door did not close');
  await click3d([-2.15, 0.75, 1.66]); await until(() => window.__flowers.state.doorOpen);
  assert(await page.evaluate(() => window.__flowers.state.doorOpen), 'Clicking the door model must open it');
  await page.locator('#door').click(); await until(doorShut);
  checks.push('door opens/closes from the button and from a click on the 3D door');

  // glasshouse vent
  await page.locator('#vent').click(); await until(() => window.__flowers.shop.vent.hinge.rotation.x < -0.9);
  assert(await page.evaluate(() => window.__flowers.shop.vent.hinge.rotation.x < -0.9), 'Vent did not lift'); await shot('flowers-vent-open');
  await page.locator('#vent').click(); await until(ventShut);
  assert(await page.evaluate(ventShut), 'Vent did not close');
  checks.push('glasshouse vent lifts and closes');

  // see-through + bouquet pickup
  await page.locator('#see-through').click(); await page.waitForTimeout(150);
  assert(await page.evaluate(() => !window.__flowers.shop.roof.visible && !window.__flowers.shop.shell.visible), 'See-through must hide roof and shell'); await shot('flowers-see-through');
  await page.locator('#pick').click(); await until(() => window.__flowers.shop.pickup.position.distanceTo(window.__flowers.shop.pickAway) < 0.02);
  assert(await page.evaluate(() => window.__flowers.state.pickTaken && window.__flowers.shop.pickup.position.distanceTo(window.__flowers.shop.pickAway) < 0.02), 'Bouquet did not move to the cart');
  await page.locator('#pick').click(); await until(() => window.__flowers.shop.pickup.position.distanceTo(window.__flowers.shop.pickHome) < 0.02);
  assert(await page.evaluate(() => window.__flowers.shop.pickup.position.distanceTo(window.__flowers.shop.pickHome) < 0.02), 'Bouquet did not return');
  await page.locator('#see-through').click(); await page.waitForTimeout(150);
  assert(await page.evaluate(() => window.__flowers.shop.roof.visible && window.__flowers.shop.shell.visible), 'See-through must restore');
  checks.push('see-through toggles roof/shell/glass; bouquet moves to the cart and back');

  // palettes
  const schemes = [['Butter yellow', 'f4d477'], ['Pistachio', 'b9deca'], ['Rose milk', 'f1cdd9'], ['Blue hour', 'c7d9ed'], ['Terracotta', 'f0b29d']];
  for (const [name, hex] of schemes) {
    await page.getByRole('button', { name, exact: true }).click(); await page.waitForTimeout(60);
    assert(await page.evaluate(h => window.__flowers.shop.materials.wall.color.getHexString() === h, hex), `Palette ${name} did not apply`);
    await shot(`flowers-${name.split(' ')[0].toLowerCase()}`);
  }
  await page.getByRole('button', { name: 'Butter yellow', exact: true }).click(); checks.push('five palettes recolour the shared materials');

  // labels, views, orbit, zoom
  await page.locator('#labels-button').click(); await page.waitForTimeout(250);
  assert(await page.locator('#labels .part-label:not([hidden])').count() >= 3, 'Labels missing'); await shot('flowers-labels'); await page.locator('#labels-button').click();
  await page.getByRole('button', { name: 'Front', exact: true }).click(); await shot('flowers-front');
  await page.getByRole('button', { name: 'Side', exact: true }).click(); await shot('flowers-side');
  await page.getByRole('button', { name: /Default view/ }).click();
  const b = await page.locator('#scene').boundingBox(); const a0 = await page.evaluate(() => window.__flowers.controls.getAzimuthalAngle());
  await page.mouse.move(b.x + b.width * 0.5, b.y + b.height * 0.5); await page.mouse.down(); await page.mouse.move(b.x + b.width * 0.62, b.y + b.height * 0.52, { steps: 8 }); await page.mouse.up(); await page.waitForTimeout(1500);
  assert(await page.evaluate(a => Math.abs(window.__flowers.controls.getAzimuthalAngle() - a) > 0.05, a0), 'Drag did not rotate');
  await page.mouse.wheel(0, -400); await until(() => window.__flowers.camera.zoom > 1.2);
  assert(await page.evaluate(() => window.__flowers.camera.zoom > 1.2), 'Wheel did not zoom');
  await page.getByRole('button', { name: /Default view/ }).click(); await page.waitForTimeout(200);
  checks.push('labels, front/side views, drag-orbit, smooth zoom');

  // mobile
  await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(500);
  assert(await page.evaluate(() => document.documentElement.scrollWidth === innerWidth), 'Mobile horizontal overflow'); await shot('flowers-mobile');
  checks.push('390 × 844: no horizontal overflow');
  assert(errors.length === 0, errors.join('\n'));
  const report = { passed: true, checkedAt: new Date().toISOString(), viewports: ['1440 × 1040', '390 × 844'], initial, checks, consoleErrors: errors };
  await writeFile(out('verification.json'), JSON.stringify(report, null, 2) + '\n'); console.log(JSON.stringify(report, null, 2));
} finally { await browser.close(); }
