import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { finishModel, createIllustrationShadow } from '../buildings/shared/finish.js';
import { floorShadow } from '../buildings/shared/shadowFloor.js';
import { places } from './places.js';

// A one-building stage in the Little Places look: the collection page's camera, lights, ground, projected shadow,
// ink lines and night, for any model that follows the contract in references/integration.md. The viewer owns
// every amount (door openings, night, see-through); the model only exposes setters, `interactions` and `animate`.
const $ = (s) => document.querySelector(s);
const SWATCHES = [['Butter yellow', '#F6C445'], ['Pistachio', '#9AD5B6'], ['Rose milk', '#EFA8C4'], ['Blue hour', '#91B7EB'], ['Terracotta', '#EF745F']];
// Night is drawn, not lit: toon surfaces dim with the lights while unlit materials (lamps, signs, glass) keep their colour.
const DAY = { bg: '#F7F3E9', sky: '#FFFFFF', earth: '#C3B59E', hemi: 1.8, sun: '#FFFFFF', dir: 1.4, shadow: '#92A6CF' };
const NIGHT = { bg: '#1F2638', sky: '#8A98C4', earth: '#3A3550', hemi: 1.05, sun: '#AFBCE6', dir: 0.45, shadow: '#161C2B' };
// the series' default camera: azimuth 25° (the façade a little more frontal than 45°), elevation 28°
const VIEWS = { iso: [25, 28], front: [0, 32], side: [90, 32], left: [-65, 22], back: [205, 28], top: [30, 82] };
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

const id = new URLSearchParams(location.search).get('place') || location.hash.slice(1) || places[0].id;
const place = places.find((p) => p.id === id) ?? places[0];
const create = async () => (await place.module())[place.factory]();
const model = await create();
document.title = `${place.title} · Little Places`; $('#title').textContent = place.title;
for (const p of places) $('#place').append(new Option(p.title, p.id, false, p.id === place.id));
$('#place').hidden = places.length < 2; $('#place').onchange = (e) => { location.search = `?place=${e.target.value}`; };

// ---- bake the model the way the collection does --------------------------------------------------------------
const dynamic = model.dynamic ?? [];
const footprint = new THREE.Box3().setFromObject(model.group);
const shadow = createIllustrationShadow(model.group);
const paving = model.shadowFloor ? floorShadow(model.group, shadow.material, model.shadowFloor) : null;
shadow.position.y = 0.35;                                  // the raised paved base
const lines = finishModel(model.group, dynamic);
if (model.outlineMaterials) lines.push(...model.outlineMaterials);
const wrapper = new THREE.Group(); wrapper.add(model.group, shadow); if (paving) wrapper.add(paving);
const centre = footprint.getCenter(new THREE.Vector3()), size = footprint.getSize(new THREE.Vector3());
wrapper.position.set(-centre.x, 0, -centre.z);              // turn about the middle of the footprint
const pivot = place.pivot ?? footprint.max.y * 0.42;
// automatic framing: the model's extent seen from 28° up, with room to spare at the default 145% zoom
const span = place.span ?? (size.y * Math.cos(0.49) + Math.hypot(size.x, size.z) * Math.sin(0.49)) * 1.75;
const width = place.width ?? Math.hypot(size.x, size.z) * 1.6;

// ---- stage ---------------------------------------------------------------------------------------------------
const host = $('#stage');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.localClippingEnabled = true; renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); renderer.outputColorSpace = THREE.SRGBColorSpace;
host.prepend(renderer.domElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color(DAY.bg);
const hemi = new THREE.HemisphereLight(DAY.sky, DAY.earth, DAY.hemi); scene.add(hemi);
const sun = new THREE.DirectionalLight(DAY.sun, DAY.dir); sun.position.set(-3, 12, 8); scene.add(sun);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(180, 180), new THREE.MeshBasicMaterial({ color: DAY.bg }));
ground.rotation.x = -Math.PI / 2; ground.position.y = -0.6; scene.add(ground, wrapper);
const camera = new THREE.OrthographicCamera(-12, 12, 6, -6, 0.1, 200);
const controls = new OrbitControls(camera, renderer.domElement);
Object.assign(controls, { enablePan: false, enableDamping: true, dampingFactor: 0.09, rotateSpeed: 0.6, minZoom: 0.65, maxZoom: 3.2, minPolarAngle: 0.15, maxPolarAngle: 1.47, autoRotateSpeed: 0.45 });
const defaultZoom = () => (host.clientWidth < 650 ? 1.15 : 1.45);
function setView(name) {
  const [az, el] = VIEWS[name], a = THREE.MathUtils.degToRad(az), e = THREE.MathUtils.degToRad(el);
  controls.target.set(0, pivot, 0);
  camera.position.set(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e)).multiplyScalar(23.47).add(controls.target);
  camera.zoom = defaultZoom(); camera.updateProjectionMatrix(); controls.update();
  document.querySelectorAll('[data-view]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === name)));
  invalidate();
}
function resize() {
  const w = host.clientWidth, h = host.clientHeight, aspect = w / h, s = Math.max(span, width / aspect);
  renderer.setSize(w, h);
  Object.assign(camera, { left: -s * aspect / 2, right: s * aspect / 2, top: s / 2, bottom: -s / 2 }); camera.updateProjectionMatrix();
  for (const m of lines) m.resolution?.set(w, h);
  invalidate();
}

// ---- state the page owns ----------------------------------------------------------------------------------------
const state = { night: false, nightAmount: 0, seeThrough: false, labels: false, toggles: {}, runs: {}, animateCalls: 0 };
const interactions = model.interactions ?? [];
for (const it of interactions) if (it.set) state.toggles[it.action] = { on: false, amount: 0 };
let dirty = true, frames = 0;
const invalidate = () => { dirty = true; };
const label = (it) => (Array.isArray(it.label) ? it.label[state.toggles[it.action]?.on ? 1 : 0] : it.label);
function trigger(action) {
  const it = interactions.find((i) => i.action === action); if (!it) return;
  if (it.set) state.toggles[action].on = !state.toggles[action].on;
  else { it.run(reducedMotion.matches); state.runs[action] = (state.runs[action] ?? 0) + 1; }
  updateButtons(); invalidate();
}

// ---- controls ----------------------------------------------------------------------------------------------------
for (const it of interactions) {
  const b = document.createElement('button'); b.className = 'pill'; b.id = `do-${it.action}`; b.onclick = () => trigger(it.action); $('#actions').append(b);
}
if (model.setSeeThrough) {
  const b = document.createElement('button'); b.className = 'pill'; b.id = 'see-through'; b.textContent = 'See-through';
  b.onclick = () => { state.seeThrough = !state.seeThrough; model.setSeeThrough(state.seeThrough); updateButtons(); invalidate(); }; $('#actions').append(b);
}
function updateButtons() {
  for (const it of interactions) { const b = $(`#do-${it.action}`); b.textContent = label(it); if (it.set) b.setAttribute('aria-pressed', String(state.toggles[it.action].on)); }
  $('#see-through')?.setAttribute('aria-pressed', String(state.seeThrough));
  $('#night').setAttribute('aria-pressed', String(state.night)); $('#night').textContent = state.night ? 'Day ☀' : 'Night ☾';
  $('#labels-button').setAttribute('aria-pressed', String(state.labels));
  $('#turntable').setAttribute('aria-pressed', String(controls.autoRotate));
}
SWATCHES.forEach(([name, colour], i) => {
  const b = document.createElement('button'); b.className = 'swatch'; b.style.background = colour; b.title = name; b.setAttribute("aria-label", name);
  b.onclick = () => { model.setPalette?.(i); document.querySelectorAll('.swatch').forEach((s) => s.setAttribute('aria-pressed', String(s === b))); $('#swatch-name').textContent = name; invalidate(); };
  b.setAttribute('aria-pressed', String(i === 0)); $('#swatches').append(b);
});
$('#swatch-name').textContent = SWATCHES[0][0];
$('#night').onclick = () => { state.night = !state.night; updateButtons(); invalidate(); };
$('#labels-button').onclick = () => { state.labels = !state.labels; updateButtons(); invalidate(); };
$('#turntable').onclick = () => { controls.autoRotate = !controls.autoRotate && !reducedMotion.matches; updateButtons(); invalidate(); };
document.querySelectorAll('[data-view]').forEach((b) => { b.onclick = () => setView(b.dataset.view); });
$('#zoom-in').onclick = () => { camera.zoom = Math.min(controls.maxZoom, camera.zoom * 1.15); camera.updateProjectionMatrix(); invalidate(); };
$('#zoom-out').onclick = () => { camera.zoom = Math.max(controls.minZoom, camera.zoom / 1.15); camera.updateProjectionMatrix(); invalidate(); };
controls.addEventListener('change', invalidate);
controls.addEventListener('start', () => { controls.autoRotate = false; updateButtons(); });

// labels: DOM tags at model-space anchors
const labelEls = (model.labels ?? []).map(([text, at, visibleWhen]) => {
  const el = document.createElement('span'); el.className = 'part-label'; el.textContent = text; el.hidden = true; $('#labels').append(el);
  return { el, at: Array.isArray(at) ? new THREE.Vector3(...at) : null, fn: typeof at === 'function' ? at : null, visibleWhen };
});
function placeLabels() {
  const w = host.clientWidth, h = host.clientHeight;
  for (const l of labelEls) {
    l.el.hidden = !state.labels || (l.visibleWhen && !l.visibleWhen()); if (l.el.hidden) continue;
    const p = model.group.localToWorld((l.fn ? l.fn() : l.at).clone()).project(camera);
    l.el.style.left = `${(p.x + 1) * w / 2}px`; l.el.style.top = `${(1 - p.y) * h / 2}px`;
  }
}

// ---- picking: the first opaque, visible surface under the pointer; its nearest `userData.action` -----------------
const ray = new THREE.Raycaster(), pointer = new THREE.Vector2();
function pickAt(clientX, clientY) {
  const r = host.getBoundingClientRect(); pointer.set((clientX - r.left) / r.width * 2 - 1, -(clientY - r.top) / r.height * 2 + 1);
  scene.updateMatrixWorld(true); ray.setFromCamera(pointer, camera);
  for (const hit of ray.intersectObject(wrapper, true)) {
    const o = hit.object; if (!o.isMesh || o.isLineSegments2 || o.material.transparent) continue;   // clicks pass through glass
    let visible = true; for (let a = o; a; a = a.parent) if (!a.visible) { visible = false; break; } if (!visible) continue;
    for (let a = o; a; a = a.parent) if (a.userData.action && interactions.some((i) => i.action === a.userData.action)) return a.userData.action;
    return null;
  }
  return null;
}
let down = null;
host.addEventListener('pointerdown', (e) => { down = [e.clientX, e.clientY]; });
host.addEventListener('pointermove', (e) => {
  if (e.buttons) return; const action = pickAt(e.clientX, e.clientY), tip = $('#tooltip');
  renderer.domElement.style.cursor = action ? 'pointer' : 'grab'; tip.hidden = !action;
  if (action) { tip.textContent = label(interactions.find((i) => i.action === action)); const r = host.getBoundingClientRect(); tip.style.left = `${e.clientX - r.left + 14}px`; tip.style.top = `${e.clientY - r.top + 14}px`; }
});
host.addEventListener('pointerleave', () => { $('#tooltip').hidden = true; });
host.addEventListener('pointerup', (e) => {
  if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) return; down = null;
  const action = pickAt(e.clientX, e.clientY); if (action) trigger(action);
});

// ---- render on demand ----------------------------------------------------------------------------------------------
const clock = new THREE.Clock(); let time = 0;
const mix = (a, b, t, out) => out.set(a).lerp(new THREE.Color(b), t);
function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), 0.05); time += dt;
  let moving = controls.update();
  for (const it of interactions) {
    if (!it.set) continue; const t = state.toggles[it.action], goal = t.on ? 1 : 0;
    if (t.amount === goal) continue;
    t.amount = reducedMotion.matches ? goal : THREE.MathUtils.damp(t.amount, goal, 8, dt);
    if (Math.abs(t.amount - goal) < 0.001) t.amount = goal;
    it.set(t.amount); moving = true;
  }
  const nightGoal = state.night ? 1 : 0;
  if (state.nightAmount !== nightGoal) {
    state.nightAmount = reducedMotion.matches ? nightGoal : THREE.MathUtils.damp(state.nightAmount, nightGoal, 5, dt);
    if (Math.abs(state.nightAmount - nightGoal) < 0.002) state.nightAmount = nightGoal;
    const t = state.nightAmount;
    mix(DAY.bg, NIGHT.bg, t, scene.background); ground.material.color.copy(scene.background);
    mix(DAY.sky, NIGHT.sky, t, hemi.color); mix(DAY.earth, NIGHT.earth, t, hemi.groundColor); hemi.intensity = THREE.MathUtils.lerp(DAY.hemi, NIGHT.hemi, t);
    mix(DAY.sun, NIGHT.sun, t, sun.color); sun.intensity = THREE.MathUtils.lerp(DAY.dir, NIGHT.dir, t);
    mix(DAY.shadow, NIGHT.shadow, t, shadow.material.color); model.setNight?.(t); moving = true;
  }
  // ambient motion only while visible and allowed
  if (model.animate && !reducedMotion.matches && !document.hidden) { state.animateCalls++; if (model.animate(dt, time)) moving = true; }
  if (!dirty && !moving) return;
  dirty = false; frames++; placeLabels(); renderer.render(scene, camera);
}

addEventListener('resize', resize);
document.addEventListener('visibilitychange', () => { clock.getDelta(); invalidate(); });
resize(); setView('iso'); updateButtons(); frame();
$('#loading').hidden = true;

// for scripts/verify.mjs
window.__viewer = {
  ready: true, place, model, camera, controls, wrapper, state, lines, interactions, pickAt, setView, create,
  get frames() { return frames; },
};
