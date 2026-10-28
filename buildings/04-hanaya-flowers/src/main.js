import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createFlowerShop } from './shop/FlowerShop.js';
import { themes } from './shop/materials.js';
import { finishModel, createIllustrationShadow } from '@grocery-finish';
import './style.css';

// Standalone viewer that mirrors the Little Places collection's renderer set-up, so the shop looks the same in both.
const $ = selector => document.querySelector(selector);
const host = $('#scene');
const colours = [['Butter yellow', '#F6C445'], ['Pistachio', '#9AD5B6'], ['Rose milk', '#EFA8C4'], ['Blue hour', '#91B7EB'], ['Terracotta', '#EF745F']];
const state = { doorOpen: false, ventOpen: false, ventAmount: 0, pickTaken: false, seeThrough: false, labels: false, auto: false, zoomGoal: null, colourIndex: 0 };
let dirty = true, hover = null, gesture = null;
const invalidate = () => { dirty = true; };
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); renderer.outputColorSpace = THREE.SRGBColorSpace;
host.append(renderer.domElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color('#F7F3E9');
scene.add(new THREE.HemisphereLight(0xffffff, 0xc3b59e, 1.8));
const light = new THREE.DirectionalLight(0xffffff, 1.4); light.position.set(-3, 12, 8); scene.add(light);
const camera = new THREE.OrthographicCamera(-12, 12, 6, -6, 0.1, 200);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enablePan = false; controls.enableDamping = true; controls.dampingFactor = 0.09; controls.rotateSpeed = 0.6;
controls.minZoom = 0.65; controls.maxZoom = 2.6; controls.minPolarAngle = 0.4; controls.maxPolarAngle = 1.47; controls.autoRotateSpeed = 0.45;

const shop = createFlowerShop();
const wrapper = new THREE.Group(); wrapper.name = 'Hanaya Flowers'; wrapper.userData.buildingId = 'flowers';
shop.group.userData.buildingId = 'flowers';
// Shared finishing used by the whole collection: batched materials + screen-width outlines + projected shadow.
const shadow = createIllustrationShadow(shop.group);
const lines = finishModel(shop.group, shop.dynamic);
wrapper.add(shop.group, shadow); scene.add(wrapper);

// hover feedback: separate toon material clones for the interactive batches
const hoverMaterials = [];
for (const target of shop.dynamic) target.traverse(object => {
  if (object.isMesh && object.material.isMeshToonMaterial) { const source = object.material; object.material = source.clone(); hoverMaterials.push({ object, source, target }); }
});

const SPAN = 10.8, WIDTH = 11.8, PIVOT = 2.55;
function resize() {
  const w = host.clientWidth, h = host.clientHeight, aspect = w / h;
  renderer.setSize(w, h);
  const span = Math.max(SPAN, WIDTH / aspect);
  camera.left = -span * aspect / 2; camera.right = span * aspect / 2; camera.top = span / 2; camera.bottom = -span / 2;
  camera.updateProjectionMatrix();
  for (const material of lines) material.resolution.set(w, h);
  invalidate();
}
function setView(view = 'iso') {
  state.auto = false; controls.autoRotate = false; $('#turntable').setAttribute('aria-pressed', 'false');
  state.zoomGoal = null; controls.enableDamping = false; controls.update();
  controls.target.set(0, PIVOT, 0);
  if (view === 'front') camera.position.set(0, PIVOT + 12.6, 19.8);
  else if (view === 'side') camera.position.set(19.8, PIVOT + 12.6, 0);
  else camera.position.set(14, PIVOT + 12.6, 14);
  camera.zoom = 1; camera.updateProjectionMatrix(); controls.update(); controls.enableDamping = true;
  document.querySelectorAll('[data-view]').forEach(b => { const on = b.dataset.view === view; b.classList.toggle('selected', on); b.setAttribute('aria-pressed', String(on)); });
  invalidate();
}

function updateActions() {
  $('#door').innerHTML = `${state.doorOpen ? 'Close' : 'Open'} the door <span>↗</span>`; $('#door').setAttribute('aria-pressed', String(state.doorOpen));
  $('#vent').innerHTML = `${state.ventOpen ? 'Close' : 'Open'} the glasshouse vent <span>↗</span>`; $('#vent').setAttribute('aria-pressed', String(state.ventOpen));
  $('#pick').innerHTML = `${state.pickTaken ? 'Put it back' : 'Pick a bouquet'} <span>↗</span>`; $('#pick').setAttribute('aria-pressed', String(state.pickTaken));
  $('#see-through').setAttribute('aria-pressed', String(state.seeThrough));
}
const toggleDoor = () => { state.doorOpen = !state.doorOpen; updateActions(); invalidate(); };
const toggleVent = () => { state.ventOpen = !state.ventOpen; updateActions(); invalidate(); };
const togglePick = () => { state.pickTaken = !state.pickTaken; $('#action-hint').textContent = state.pickTaken ? 'A fresh bunch, just for you.' : 'Back on the counter, still fresh.'; updateActions(); invalidate(); };
$('#door').onclick = toggleDoor; $('#vent').onclick = toggleVent; $('#pick').onclick = togglePick;
$('#see-through').onclick = () => { state.seeThrough = !state.seeThrough; shop.setSeeThrough(state.seeThrough); updateActions(); invalidate(); };

for (const [index, [name, colour]] of colours.entries()) {
  const b = document.createElement('button'); b.className = 'swatch'; b.style.background = colour; b.setAttribute('aria-label', name); b.title = name;
  b.onclick = () => { shop.setPalette(index); state.colourIndex = index; updateColours(); invalidate(); };
  $('#colours').append(b);
}
function updateColours() {
  document.querySelectorAll('.swatch').forEach((b, i) => b.setAttribute('aria-pressed', String(i === state.colourIndex)));
  $('#colour-name').textContent = colours[state.colourIndex][0];
}
for (const b of document.querySelectorAll('[data-view]')) b.onclick = () => setView(b.dataset.view);
$('#turntable').onclick = () => { state.auto = !state.auto; controls.autoRotate = state.auto; $('#turntable').setAttribute('aria-pressed', String(state.auto)); invalidate(); };
$('#labels-button').onclick = () => { state.labels = !state.labels; $('#labels-button').setAttribute('aria-pressed', String(state.labels)); $('#labels').setAttribute('aria-hidden', String(!state.labels)); invalidate(); };
const partLabels = [];
for (const [text, point, visibleWhen] of shop.labels ?? []) {
  const el = document.createElement('div'); el.className = 'part-label'; el.textContent = text; $('#labels').append(el);
  partLabels.push({ el, point: typeof point === 'function' ? point : new THREE.Vector3(...point), visibleWhen });
}
const zoomTo = v => { state.zoomGoal = THREE.MathUtils.clamp(v, 0.65, 2.6); invalidate(); };
$('#zoom-in').onclick = () => zoomTo((state.zoomGoal ?? camera.zoom) + 0.15); $('#zoom-out').onclick = () => zoomTo((state.zoomGoal ?? camera.zoom) - 0.15);
renderer.domElement.addEventListener('wheel', e => {
  e.preventDefault(); e.stopImmediatePropagation();
  const units = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? host.clientHeight : 1;
  zoomTo((state.zoomGoal ?? camera.zoom) * Math.exp(-e.deltaY * units * 0.001));
}, { capture: true, passive: false });
controls.addEventListener('start', () => { state.zoomGoal = null; state.auto = false; controls.autoRotate = false; $('#tooltip').style.display = 'none'; });
controls.addEventListener('change', invalidate);

// picking: walk up to the nearest object that carries userData.action
const ray = new THREE.Raycaster(), pointer = new THREE.Vector2();
function pick(event) {
  const b = host.getBoundingClientRect();
  pointer.set((event.clientX - b.left) / b.width * 2 - 1, -(event.clientY - b.top) / b.height * 2 + 1);
  scene.updateMatrixWorld(true); ray.setFromCamera(pointer, camera);
  for (const hit of ray.intersectObject(wrapper, true)) {
    if (!hit.object.isMesh || hit.object.isLineSegments2 || !hit.object.material?.visible) continue;
    let visible = true; for (let a = hit.object; a; a = a.parent) if (!a.visible) { visible = false; break; }
    if (!visible) continue;
    for (let o = hit.object; o; o = o.parent) if (o.userData.action) return { action: o.userData.action, target: o };
    return null;
  }
  return null;
}
const TIPS = { flowerDoor: () => state.doorOpen ? 'Close the shop door' : 'Step inside the flower shop', flowerVent: () => state.ventOpen ? 'Close the glasshouse vent' : 'Let the glasshouse breathe', flowerPick: () => state.pickTaken ? 'Put the bouquet back' : 'Pick a fresh bouquet' };
host.addEventListener('pointerdown', e => { gesture = { x: e.clientX, y: e.clientY, distance: 0, id: e.pointerId }; });
host.addEventListener('pointermove', e => {
  if (gesture) gesture.distance = Math.max(gesture.distance, Math.hypot(e.clientX - gesture.x, e.clientY - gesture.y));
  if (e.buttons || e.pointerType === 'touch') { hover = null; $('#tooltip').style.display = 'none'; return; }
  hover = pick(e); renderer.domElement.style.cursor = hover ? 'pointer' : 'grab';
  const tip = $('#tooltip'); tip.style.display = hover ? 'block' : 'none';
  if (hover) { tip.textContent = TIPS[hover.action]?.() ?? ''; tip.style.left = `${Math.max(8, Math.min(e.clientX + 12, innerWidth - 240))}px`; tip.style.top = `${Math.max(8, e.clientY - 36)}px`; }
  invalidate();
});
host.addEventListener('pointerup', e => {
  const click = gesture && gesture.id === e.pointerId && gesture.distance < 6; gesture = null;
  if (!click) return; const r = pick(e); if (!r) return;
  if (r.action === 'flowerDoor') toggleDoor(); else if (r.action === 'flowerVent') toggleVent(); else if (r.action === 'flowerPick') togglePick();
});
host.addEventListener('pointercancel', () => { gesture = null; });
host.addEventListener('pointerleave', () => { hover = null; $('#tooltip').style.display = 'none'; invalidate(); });

const project = p => p.clone().project(camera);
function renderLabels() {
  if (!state.labels) return;
  for (const { el, point, visibleWhen } of partLabels) {
    el.hidden = !!visibleWhen && !visibleWhen(); if (el.hidden) continue;
    const p = project(shop.group.localToWorld(typeof point === 'function' ? point() : point.clone()));
    el.style.left = `${Math.max(9, Math.min((p.x + 1) * host.clientWidth / 2 + 10, host.clientWidth - el.offsetWidth - 9)) + host.offsetLeft}px`;
    el.style.top = `${Math.max(22, Math.min((1 - p.y) * host.clientHeight / 2 - 18, host.clientHeight - 22)) + host.offsetTop}px`;
    el.hidden = p.z < -1 || p.z > 1;
  }
}

let last = performance.now(), frames = 0;
renderer.setAnimationLoop(now => {
  const dt = Math.min((now - last) / 1000, 0.05); last = now;
  const changed = controls.update(dt);
  const doorGoal = state.doorOpen ? -Math.PI * 0.56 : 0;
  const ventGoal = state.ventOpen ? 1 : 0;
  const bagTarget = state.pickTaken ? shop.pickAway : shop.pickHome;
  const movingDoor = Math.abs(shop.door.hinge.rotation.y - doorGoal) > 1e-4;
  const movingVent = Math.abs(state.ventAmount - ventGoal) > 1e-4;
  const movingBag = shop.pickup.position.distanceToSquared(bagTarget) > 1e-6;
  if (!dirty && !changed && !movingDoor && !movingVent && !movingBag && state.zoomGoal === null && !state.auto) return;
  dirty = false;
  if (state.zoomGoal !== null) { camera.zoom = reducedMotion.matches ? state.zoomGoal : THREE.MathUtils.damp(camera.zoom, state.zoomGoal, 12, dt); if (Math.abs(camera.zoom - state.zoomGoal) < 0.001) { camera.zoom = state.zoomGoal; state.zoomGoal = null; } camera.updateProjectionMatrix(); }
  shop.door.hinge.rotation.y = reducedMotion.matches ? doorGoal : THREE.MathUtils.damp(shop.door.hinge.rotation.y, doorGoal, 9, dt);
  state.ventAmount = reducedMotion.matches ? ventGoal : THREE.MathUtils.damp(state.ventAmount, ventGoal, 7, dt);
  shop.setVent(state.ventAmount);
  shop.pickup.position.lerp(bagTarget, reducedMotion.matches ? 1 : 1 - Math.exp(-8 * dt)); if (!movingBag) shop.pickup.position.copy(bagTarget);
  for (const { object, source, target } of hoverMaterials) { object.material.color.copy(source.color); object.material.emissive.setHex(hover?.target === target ? 0x24190c : 0); }
  renderLabels();
  $('#zoom-value').value = `${Math.round(camera.zoom * 100)}%`;
  renderer.render(scene, camera); frames++;
});
new ResizeObserver(resize).observe(host);
updateActions(); updateColours(); setView('iso'); resize();
window.__flowers = { shop, state, scene, camera, controls, renderer, setView, themes, get frames() { return frames; } };
