// Verify one place in the kit viewer: start `npm run dev`, then `npm run verify -- <place-id>` (default: the first place).
// These are the checks every Little Places building must pass (SKILL.md → Definition of done). A building adds its own
// in buildings/<folder>/verify.extra.mjs: `export default async ({ page, assert, checks, view, snap, until }) => { … }`.
// Screenshots and a JSON report go to screenshots/<id>-*.
import { chromium } from 'playwright';
import { mkdir, writeFile, access } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = new URL('..', import.meta.url), base = process.env.BASE_URL || 'http://127.0.0.1:5180/';
const id = process.argv[2] || (await import(new URL('src/places.js', root))).places[0].id;
const out = (name) => fileURLToPath(new URL(`screenshots/${id}-${name}`, root));
await mkdir(new URL('screenshots/', root), { recursive: true });
// the bundled Chromium (npx playwright install chromium), else the system Chrome
const browser = await chromium.launch().catch(() => chromium.launch({ channel: 'chrome' }));
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } }), page = await context.newPage();
const errors = [], checks = [];
page.on('pageerror', (e) => errors.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
const assert = (v, msg) => { if (!v) throw new Error(msg); };
const until = (fn, arg, timeout = 15000) => page.waitForFunction(fn, arg, { timeout });
const snap = async (name) => { await page.mouse.move(2, 2); await page.waitForTimeout(300); await page.screenshot({ path: out(`${name}.png`), fullPage: true }); };
const view = (name) => page.evaluate((n) => __viewer.setView(n), name).then(() => page.waitForTimeout(250));
const idle = async () => { const f = await page.evaluate(() => __viewer.frames); await page.waitForTimeout(700); return page.evaluate((f) => __viewer.frames === f, f); };
// a moving part's pose: every dynamic group's world matrix plus visibility, as one string
const pose = () => page.evaluate(() => __viewer.model.dynamic.map((d) => { d.updateWorldMatrix(true, true); let s = ''; d.traverse((o) => { s += o.visible ? o.matrixWorld.elements.map((e) => e.toFixed(3)).join() : 'h'; }); return s; }).join('|'));

async function load(p) {
  await p.goto(`${base}?place=${id}`, { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => window.__viewer?.ready && __viewer.frames > 0, null, { timeout: 30000 }); await p.waitForTimeout(400);
}
// a screen point where a click lands on `action`: scan the projected box of its dynamic groups for a visible pixel
const clickTarget = (action) => page.evaluate((action) => {
  const { model, camera, pickAt } = __viewer, stage = document.querySelector('#stage').getBoundingClientRect();
  const parts = model.dynamic.filter((d) => { for (let a = d; a; a = a.parent) if (a.userData.action === action) return true; let hit = false; d.traverse((o) => { if (o.userData.action === action) hit = true; }); return hit; });
  for (const part of parts) {
    part.updateWorldMatrix(true, true);
    const pts = []; part.traverse((o) => { if (!o.isMesh || !o.geometry.attributes.position) return; o.geometry.computeBoundingBox(); const b = o.geometry.boundingBox;
      for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) pts.push(new camera.position.constructor(x, y, z).applyMatrix4(o.matrixWorld).project(camera)); });
    if (!pts.length) continue;
    const xs = pts.map((p) => stage.x + (p.x + 1) * stage.width / 2), ys = pts.map((p) => stage.y + (1 - p.y) * stage.height / 2);
    const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    for (let i = 1; i < 12; i++) for (let j = 1; j < 12; j++) { const x = x0 + (x1 - x0) * i / 12, y = y0 + (y1 - y0) * j / 12; if (x > stage.x && x < stage.right && y > stage.y && y < stage.bottom && pickAt(x, y) === action) return [x, y]; }
  }
  return null;
}, action);

try {
  await load(page);
  // ---- the model contract -----------------------------------------------------------------------------------------
  const contract = await page.evaluate(() => { const z = __viewer.model; return { group: !!z.group?.isGroup, dynamic: Array.isArray(z.dynamic), labels: (z.labels ?? []).length, palette: typeof z.setPalette === 'function', materials: !!z.materials, interactions: (z.interactions ?? []).length }; });
  assert(contract.group && contract.dynamic && contract.materials && contract.palette, `Model contract incomplete: ${JSON.stringify(contract)}`);
  assert(contract.labels >= 3 && contract.labels <= 6, `3–6 labels expected, got ${contract.labels}`);
  assert(contract.interactions >= 1, 'The model lists no interactions');
  const budget = await page.evaluate(() => { let t = 0, l = 0, bad = 0; __viewer.wrapper.traverse((o) => { if (o.isLineSegments2) l += o.geometry.instanceCount || 0; else if (o.isMesh) { const g = o.geometry, p = g.attributes.position; t += (g.index ? g.index.count : p.count) / 3; for (let i = 0; i < p.array.length; i += 97) if (!Number.isFinite(p.array[i])) { bad++; break; } } }); return { t: Math.round(t), l, bad }; });
  assert(budget.t <= 120000 && budget.l <= 15000, `Over budget: ${budget.t} triangles, ${budget.l} outline segments (≤ 120k / ≤ 15k)`);
  assert(budget.bad === 0, `${budget.bad} baked meshes have NaN positions (a dynamic group scaled to 0? hide it with visible instead)`);
  checks.push(`model contract, ${contract.interactions} interactions, ${contract.labels} labels, budget ${budget.t} triangles / ${budget.l} outline segments, no NaN geometry`);
  // ---- structure, on a fresh unbaked model ------------------------------------------------------------------------
  const structure = await page.evaluate(async () => {
    const z = await __viewer.create(); z.group.updateMatrixWorld(true); const V = z.group.position.constructor, dyn = new Set(z.dynamic), nested = [], frames = [];
    for (const d of z.dynamic) for (let a = d.parent; a; a = a.parent) if (dyn.has(a)) nested.push(`${d.name} inside ${a.name}`);
    const low = (o) => { let y = Infinity; o.traverse((c) => { if (!c.isMesh) return; c.geometry.computeBoundingBox(); const b = c.geometry.boundingBox; for (const x of [b.min.x, b.max.x]) for (const yy of [b.min.y, b.max.y]) for (const zz of [b.min.z, b.max.z]) y = Math.min(y, new V(x, yy, zz).applyMatrix4(c.matrixWorld).y); }); return y; };
    z.group.traverse((o) => { if (o.name !== 'Chalkboard A-frame') return; const [f, k] = ['Front leaf', 'Back leaf'].map((n) => o.getObjectByName(n)), at = (leaf, y) => leaf.localToWorld(new V(0, y, 0)); frames.push({ low: low(o), top: at(f, -0.05).distanceTo(at(k, -0.05)), feet: at(f, -0.9).distanceTo(at(k, -0.9)) }); });
    return { nested, frames };
  });
  assert(structure.nested.length === 0, `Dynamic groups nested in dynamic groups: ${structure.nested.join(', ')}`);
  for (const a of structure.frames) assert(Math.abs(a.low - 0.155) < 0.03 && a.feet > a.top + 0.2, `A-frame wrong: lowest point ${a.low.toFixed(3)} (street 0.155), top gap ${a.top.toFixed(2)}, feet gap ${a.feet.toFixed(2)}`);
  checks.push(`no nested dynamic groups; ${structure.frames.length} chalkboard A-frame(s) standing on the street as a Λ`);
  // ---- views -----------------------------------------------------------------------------------------------------
  for (const v of ['iso', 'front', 'side', 'left', 'back', 'top']) { await view(v); await snap(v === 'iso' ? 'default' : v); }
  await view('iso'); checks.push('default, front, side, left, back and top views');
  // ---- every interaction, from its button and from a click on the model --------------------------------------------
  const list = await page.evaluate(() => __viewer.interactions.map((i) => ({ action: i.action, toggle: !!i.set })));
  for (const { action, toggle } of list) {
    const button = page.locator(`#do-${action}`); assert(await button.isVisible(), `No visible button for ${action}`);
    const before = await pose();
    if (toggle) {
      await button.click(); await until((a) => __viewer.state.toggles[a].amount === 1, action);
      assert((await pose()) !== before, `${action}: the button changed nothing on the model`); await snap(`${action}-on`);
      await button.click(); await until((a) => __viewer.state.toggles[a].amount === 0, action);
    } else {
      const runs = await page.evaluate((a) => __viewer.state.runs[a] ?? 0, action); await button.click();
      let changed = false; for (let i = 0; i < 20 && !changed; i++) { await page.waitForTimeout(100); changed = (await pose()) !== before; }
      assert(changed && (await page.evaluate((a) => __viewer.state.runs[a], action)) === runs + 1, `${action}: the button set nothing in motion`);
      await page.waitForTimeout(400); await snap(`${action}`); await until(() => !__viewer.model.animate?.(0, 0), null, 20000);
    }
    await view('iso');
    const at = await clickTarget(action); assert(at, `${action}: no part of it can be clicked from the default camera (hidden behind something?)`);
    const n = await page.evaluate((a) => [__viewer.state.toggles[a]?.on, __viewer.state.runs[a]], action);
    await page.mouse.click(at[0], at[1]); await page.waitForTimeout(150);
    const m = await page.evaluate((a) => [__viewer.state.toggles[a]?.on, __viewer.state.runs[a]], action);
    assert(toggle ? m[0] !== n[0] : m[1] === n[1] + 1, `${action}: clicking the model did not trigger it`);
    if (toggle) { await button.click(); await until((a) => __viewer.state.toggles[a].amount === 0, action); } else await until(() => !__viewer.model.animate?.(0, 0), null, 20000);
    checks.push(`${action}: ${toggle ? 'opens and closes' : 'runs'} from its button and from a click on the model`);
  }
  assert(await idle(), 'The page keeps drawing when nothing moves'); checks.push('renders on demand: idle once everything is still');
  // ---- see-through, night, colours, labels ------------------------------------------------------------------------
  if (await page.locator('#see-through').count()) {
    await page.locator('#see-through').click(); await view('iso'); await page.evaluate(() => { __viewer.camera.zoom = 1.7; __viewer.camera.updateProjectionMatrix(); }); await snap('interior');
    await page.locator('#see-through').click(); await view('iso'); checks.push('see-through interior');
  }
  await page.locator('#night').click(); await until(() => __viewer.state.nightAmount === 1); await snap('night');
  await page.locator('#night').click(); await until(() => __viewer.state.nightAmount === 0); checks.push('night and back');
  const schemes = new Set();
  for (let i = 0; i < 5; i++) { await page.locator('.swatch').nth(i).click(); schemes.add(await page.evaluate(() => Object.values(__viewer.model.materials).map((m) => m.color?.getHexString()).join())); }
  assert(schemes.size === 5, `Five swatches must give five colour schemes, got ${schemes.size}`); await page.locator('.swatch').first().click(); checks.push('five colour schemes');
  await page.locator('#labels-button').click(); await page.waitForTimeout(300);
  const tags = await page.evaluate(() => { const s = document.querySelector('#stage').getBoundingClientRect(); return [...document.querySelectorAll('.part-label:not([hidden])')].map((e) => { const r = e.getBoundingClientRect(); return r.left >= s.left && r.right <= s.right + 1 && r.top >= s.top && r.bottom <= s.bottom; }); });
  assert(tags.length === contract.labels && tags.every(Boolean), `Labels: ${tags.filter(Boolean).length} of ${contract.labels} on the stage`);
  await snap('labels'); await page.locator('#labels-button').click(); checks.push('labels on the stage');
  // ---- the building's own checks ---------------------------------------------------------------------------------
  const folder = await page.evaluate(() => __viewer.place.module.toString().match(/buildings\/([^/]+)\//)?.[1]);
  const extra = folder && new URL(`buildings/${folder}/verify.extra.mjs`, root);
  if (extra && await access(extra).then(() => true, () => false)) { await view('iso'); await (await import(pathToFileURL(fileURLToPath(extra)).href)).default({ page, assert, checks, view, snap, until }); }
  // ---- reduced motion snaps, mobile fits ------------------------------------------------------------------------
  const calm = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' }); await load(calm);
  const snapped = await calm.evaluate(async () => { const t = __viewer.interactions.find((i) => i.set); if (!t) return true; document.querySelector(`#do-${t.action}`).click(); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); return __viewer.state.toggles[t.action].amount === 1 && __viewer.state.animateCalls === 0; });
  assert(snapped, 'With reduced motion, toggles must snap and no ambient motion may run'); await calm.close(); checks.push('reduced motion: toggles snap, no ambient motion');
  await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(400); await view('iso');
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Horizontal overflow at 390 px'); await snap('mobile'); checks.push('390 px without horizontal overflow');
  assert(errors.length === 0, `Console errors:\n${errors.join('\n')}`);
  const report = { place: id, passed: true, checkedAt: new Date().toISOString(), checks, notChecked: ['real devices', 'frame rate'] };
  await writeFile(out('verification.json'), JSON.stringify(report, null, 2) + '\n'); console.log(JSON.stringify(report, null, 2));
} finally { await browser.close(); }
