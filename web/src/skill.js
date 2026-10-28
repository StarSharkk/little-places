import * as THREE from 'three';
import './style.css';
import './cta.css';
import './fit.css';
import './skill.css';
import { createCollection, buildingCatalog } from './collection.js';

const $ = (s) => document.querySelector(s);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

// ---- copy the install command --------------------------------------------------------------------------------------
$('#copy-command').onclick = async () => {
  const text = $('#install-command').textContent, button = $('#copy-command');
  try { await navigator.clipboard.writeText(text); button.textContent = 'Copied ✓'; }
  catch { const range = document.createRange(); range.selectNodeContents($('#install-command')); getSelection().removeAllRanges(); getSelection().addRange(range); button.textContent = 'Selected'; }
  setTimeout(() => { button.textContent = 'Copy'; }, 1600);
};

// ---- the demo: four places at a time, each turning about its own centre, then the next four -----------------------
// One canvas, four scissored viewports, the series' camera (azimuth 25°, elevation 28°) and lights.
const stage = $('#demo-stage'), figure = stage.closest('figure'), cellsEl = $('#demo-cells');
const ids = buildingCatalog.map((b) => b.id), PER = 4, HOLD = 9, TURN = 0.32;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.localClippingEnabled = true; renderer.setScissorTest(true);
stage.prepend(renderer.domElement);
const EL = THREE.MathUtils.degToRad(28), AZ = THREE.MathUtils.degToRad(25);
const toCamera = new THREE.Vector3(Math.sin(AZ) * Math.cos(EL), Math.sin(EL), Math.cos(AZ) * Math.cos(EL));
const built = new Map();
function build(id) {
  if (built.has(id)) return built.get(id);
  const item = createCollection({ only: id })[id];
  item.model.settle?.();
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#FBF7EE');
  scene.add(new THREE.HemisphereLight(0xffffff, 0xc3b59e, 1.8));
  const sun = new THREE.DirectionalLight(0xffffff, 1.4); sun.position.set(-3, 12, 8); scene.add(sun);
  const box = new THREE.Box3().setFromObject(item.model.group), centre = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3());
  const pivot = new THREE.Group(); item.wrapper.position.set(-centre.x, 0, -centre.z); pivot.add(item.wrapper); scene.add(pivot);
  // rotation-proof framing: the footprint's turning circle, seen from 28° up
  const radius = Math.hypot(size.x, size.z) / 2, y0 = Math.min(box.min.y, 0), y1 = box.max.y;
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 400), target = new THREE.Vector3(0, (y0 + y1) / 2, 0);
  camera.position.copy(target).addScaledVector(toCamera, 60); camera.lookAt(target);
  const entry = { id, item, scene, camera, pivot, radius, height: y1 - y0 };
  built.set(id, entry); return entry;
}
const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));
const idle = (fn) => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 2000 }) : setTimeout(fn, 200));
let start = 0, current = [], held = 0, paused = false, switching = false, visible = true;
const groupAt = (s) => Array.from({ length: PER }, (_, k) => ids[(s + k) % ids.length]);
async function show(s) {
  const group = groupAt(s);
  for (const id of group) if (!built.has(id)) { build(id); await nextFrame(); }   // let the page paint between bakes
  start = s; current = group.map((id) => built.get(id)); held = 0;
  for (const e of current) e.pivot.rotation.y = 0;
  cellsEl.replaceChildren(...current.map((e) => {
    const meta = buildingCatalog.find((b) => b.id === e.id), a = document.createElement('a');
    a.href = `/#explore/${e.id}`; a.setAttribute('aria-label', `Explore ${meta.title}`);
    a.innerHTML = `<span><b>${meta.number}</b>${meta.title.toUpperCase()}</span>`; return a;
  }));
  $('#demo-count').textContent = `${group.map((id) => buildingCatalog.find((b) => b.id === id).number).join(' · ')} / ${ids.length}`;
  $('#demo-loading').hidden = true;
  idle(() => { for (const id of groupAt(s + PER)) if (!built.has(id)) { build(id); break; } });       // warm up the next four
}
async function advance() {
  if (switching) return; switching = true;
  figure.classList.add('switching'); await new Promise((r) => setTimeout(r, reducedMotion.matches ? 0 : 360));
  await show((start + PER) % ids.length); figure.classList.remove('switching'); switching = false;
}
function syncButton() {
  const b = $('#demo-pause');
  if (reducedMotion.matches) { b.textContent = 'Next four →'; b.removeAttribute('aria-pressed'); $('#demo-caption').textContent = 'Four at a time'; }
  else { b.textContent = paused ? 'Play' : 'Pause'; b.setAttribute('aria-pressed', String(paused)); $('#demo-caption').textContent = 'Four at a time, turning by themselves'; }
}
$('#demo-pause').onclick = () => { if (reducedMotion.matches) advance(); else { paused = !paused; syncButton(); } };
reducedMotion.addEventListener('change', syncButton);
new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(stage);

const clock = new THREE.Clock();
function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), 0.05);
  if (!visible || document.hidden || !current.length) return;
  const moving = !paused && !reducedMotion.matches;
  if (moving) { for (const e of current) e.pivot.rotation.y += dt * TURN; held += dt; if (held > HOLD) advance(); }
  const w = stage.clientWidth, h = stage.clientHeight, cw = w / 2, ch = h / 2;
  if (renderer.domElement.width !== Math.round(w * renderer.getPixelRatio())) renderer.setSize(w, h, false);
  current.forEach((e, i) => {
    const x = (i % 2) * cw, y = i < 2 ? ch : 0, aspect = cw / ch;
    const half = Math.max((e.height * Math.cos(EL) + 2 * e.radius * Math.sin(EL)) / 2, e.radius / aspect) * 1.04;
    Object.assign(e.camera, { left: -half * aspect, right: half * aspect, top: half, bottom: -half }); e.camera.updateProjectionMatrix();
    for (const m of e.item.lines ?? []) m.resolution?.set(cw, ch);
    renderer.setViewport(x, y, cw, ch); renderer.setScissor(x, y, cw, ch); renderer.render(e.scene, e.camera);
  });
}
syncButton();
nextFrame().then(() => show(0)).then(frame);
window.__skillDemo = { get current() { return current.map((e) => e.id); }, get start() { return start; }, advance, built };
