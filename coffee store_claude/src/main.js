import * as THREE from 'three';
import './style.css';
import { createCafe } from './cafe/CafeBuilding.js';

const BG = '#F2EBDA';
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setClearColor(BG);
const DPR_CAP = 1.75;

const scene = new THREE.Scene();
const cafe = createCafe({ paletteIndex: 0 });
scene.add(cafe.group);

// ---- light bound to the camera so the illustration keeps its look while rotating -----------
const sun = new THREE.DirectionalLight('#ffffff', Math.PI);
scene.add(sun, sun.target);

// ---- camera -------------------------------------------------------------------------------
const camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 400);
const P = cafe.bounds;
const CENTER = new THREE.Vector3((P.x0 + P.x1) / 2, 1.9, (P.z0 + P.z1) / 2);
const HOME = { az: Math.PI / 4, el: THREE.MathUtils.degToRad(33), zoom: 1, px: 0, py: 0 };
const view = { ...HOME };
const goal = { ...HOME };
const FIT = { halfW: 9.4, halfH: 9.0 };
const EL_MIN = THREE.MathUtils.degToRad(16), EL_MAX = THREE.MathUtils.degToRad(64);
let aspect = 1, halfH = FIT.halfH, halfW = FIT.halfW;
let dirty = true;

function fit() {
  const w = window.innerWidth, h = window.innerHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
  renderer.setPixelRatio(dpr);
  renderer.setSize(w, h, false);
  cafe.setResolution(w, h);
  aspect = w / h;
  halfH = Math.max(FIT.halfH, FIT.halfW / aspect);
  halfW = halfH * aspect;
  dirty = true;
}

function applyCamera() {
  const dist = 80;
  const hz = Math.cos(view.el), sx = Math.sin(view.az), cz = Math.cos(view.az);
  // camera basis (pan moves the target along the screen plane)
  const dir = new THREE.Vector3(sx * hz, Math.sin(view.el), cz * hz); // from target towards camera
  const right = new THREE.Vector3(cz, 0, -sx);
  const upv = new THREE.Vector3().crossVectors(dir, right).normalize();
  const target = CENTER.clone().addScaledVector(right, view.px).addScaledVector(upv, view.py);
  camera.position.copy(target).addScaledVector(dir, dist);
  camera.up.set(0, 1, 0);
  camera.lookAt(target);
  camera.zoom = view.zoom;
  camera.left = -halfW; camera.right = halfW; camera.top = halfH; camera.bottom = -halfH;
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();

  // light in camera terms: from upper-left, slightly behind the viewer's plane
  const vh = new THREE.Vector3(sx, 0, cz);
  const L = new THREE.Vector3().addScaledVector(right, -0.775).addScaledVector(vh, -0.15).setY(0.62).normalize();
  sun.position.copy(CENTER).addScaledVector(L, 60);
  sun.target.position.copy(CENTER);
  cafe.updateShadow(L.x, L.y, L.z);
}

// ---- interaction state -----------------------------------------------------------------------
const pointers = new Map();
let dragMoved = 0, pinchStart = null, lastHover = null, downAt = null;
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const pickMeshes = [];
for (const root of cafe.pickables) root.traverse(o => { if (o.isMesh) pickMeshes.push(o); });

function pick(clientX, clientY) {
  ndc.set((clientX / window.innerWidth) * 2 - 1, -(clientY / window.innerHeight) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  const hits = raycaster.intersectObjects(pickMeshes, false);
  for (const h of hits) {
    let o = h.object;
    while (o && !o.userData.action) o = o.parent;
    if (o) return o;
  }
  return null;
}

const tip = document.getElementById('tip');
const LABELS = { door: () => (cafe.state.openTarget ? 'Close the door' : 'Open the door'), menu: () => 'See the menu' };
function setHover(obj, x, y) {
  const tag = obj?.userData.tag ?? null;
  if (tag !== lastHover) {
    if (lastHover) cafe.setHover(lastHover, 0);
    if (tag) cafe.setHover(tag, 1);
    lastHover = tag;
    canvas.classList.toggle('hot', !!tag);
    dirty = true;
  }
  if (obj) {
    tip.hidden = false;
    tip.textContent = LABELS[obj.userData.action]?.() ?? '';
    tip.style.left = x + 'px'; tip.style.top = y + 'px';
  } else tip.hidden = true;
}

canvas.addEventListener('pointerdown', e => {
  canvas.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, button: e.button });
  dragMoved = 0;
  downAt = { x: e.clientX, y: e.clientY };
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    pinchStart = { d: Math.hypot(a.x - b.x, a.y - b.y), zoom: goal.zoom };
  }
  canvas.classList.add('dragging');
});

canvas.addEventListener('pointermove', e => {
  const p = pointers.get(e.pointerId);
  if (!p) {
    if (e.pointerType === 'mouse') setHover(pick(e.clientX, e.clientY), e.clientX, e.clientY);
    return;
  }
  const dx = e.clientX - p.x, dy = e.clientY - p.y;
  p.x = e.clientX; p.y = e.clientY;
  dragMoved += Math.abs(dx) + Math.abs(dy);
  if (pointers.size >= 2) {
    const [a, b] = [...pointers.values()];
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    if (pinchStart) setZoom(pinchStart.zoom * d / pinchStart.d, (a.x + b.x) / 2, (a.y + b.y) / 2);
    panBy(dx / 2, dy / 2);
  } else if (p.button === 2 || e.shiftKey) {
    panBy(dx, dy);
  } else {
    goal.az -= dx * 0.0058;
    goal.el = THREE.MathUtils.clamp(goal.el + dy * 0.0045, EL_MIN, EL_MAX);
  }
  dirty = true;
});

function endPointer(e) {
  const had = pointers.delete(e.pointerId);
  if (pointers.size < 2) pinchStart = null;
  if (!pointers.size) canvas.classList.remove('dragging');
  if (had && e.type === 'pointerup' && dragMoved < 6 && downAt) {
    const hit = pick(e.clientX, e.clientY);
    if (hit) activate(hit.userData.action);
  }
}
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);
canvas.addEventListener('pointerleave', () => { if (!pointers.size) setHover(null); });
canvas.addEventListener('contextmenu', e => e.preventDefault());

canvas.addEventListener('wheel', e => {
  e.preventDefault();
  const k = e.ctrlKey ? 0.01 : 0.0016;
  const dy = Math.max(-140, Math.min(140, e.deltaY)); // notched wheels and trackpads feel alike
  setZoom(goal.zoom * Math.exp(-dy * k), e.clientX, e.clientY);
}, { passive: false });

function setZoom(z, cx, cy) {
  const next = THREE.MathUtils.clamp(z, 0.75, 3.4);
  if (cx !== undefined) {
    // keep the point under the cursor fixed
    const nx = (cx / window.innerWidth) * 2 - 1, ny = -(cy / window.innerHeight) * 2 + 1;
    const f = 1 / goal.zoom - 1 / next;
    goal.px += nx * halfW * f; goal.py += ny * halfH * f;
  }
  goal.zoom = next;
  clampPan();
  dirty = true;
}
function panBy(dx, dy) {
  const k = (2 * halfH) / window.innerHeight / goal.zoom;
  goal.px -= dx * k; goal.py += dy * k;
  clampPan();
}
function clampPan() {
  const m = 2.2 + 7.5 * (1 - 1 / goal.zoom);
  goal.px = THREE.MathUtils.clamp(goal.px, -m * 1.4, m * 1.4);
  goal.py = THREE.MathUtils.clamp(goal.py, -m, m);
}

// ---- UI -----------------------------------------------------------------------------------------
const menu = document.getElementById('menu');
function showMenu(show) { menu.hidden = !show; dirty = true; }
function activate(action) {
  if (action === 'door') { cafe.toggleDoor(); syncDoorBtn(); if (!tip.hidden) tip.textContent = LABELS.door(); }
  else if (action === 'menu') showMenu(true);
  dirty = true;
}
document.getElementById('menu-close').onclick = () => showMenu(false);
window.addEventListener('keydown', e => { if (e.key === 'Escape') showMenu(false); });
const doorBtn = document.getElementById('door-btn');
function syncDoorBtn() { doorBtn.textContent = cafe.state.openTarget ? 'Close door' : 'Open door'; }
doorBtn.onclick = () => activate('door');
document.getElementById('reset').onclick = () => { Object.assign(goal, HOME); dirty = true; };
document.getElementById('zoom-in').onclick = () => setZoom(goal.zoom * 1.25);
document.getElementById('zoom-out').onclick = () => setZoom(goal.zoom / 1.25);

const swatchBox = document.getElementById('swatches');
cafe.palettes.forEach((p, i) => {
  const b = document.createElement('button');
  b.className = 'swatch'; b.setAttribute('role', 'radio'); b.setAttribute('aria-label', p.name);
  b.title = p.name; b.style.background = p.wall;
  b.setAttribute('aria-checked', i === 0);
  b.onclick = () => {
    cafe.setPalette(i);
    [...swatchBox.children].forEach((c, j) => c.setAttribute('aria-checked', j === i));
    dirty = true;
  };
  swatchBox.appendChild(b);
});
const zoomLabel = document.getElementById('zoom-label');

// ---- loop ---------------------------------------------------------------------------------------
let last = performance.now();
function frame(now = performance.now()) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  const k = 1 - Math.exp(-dt * 11);
  let moving = false;
  for (const key of ['az', 'el', 'zoom', 'px', 'py']) {
    const d = goal[key] - view[key];
    if (Math.abs(d) > (key === 'zoom' ? 0.0004 : 0.00008)) { view[key] += d * k; moving = true; }
    else view[key] = goal[key];
  }
  const busy = cafe.update(dt);
  if (moving || busy || dirty) {
    applyCamera();
    renderer.render(scene, camera);
    zoomLabel.textContent = Math.round(view.zoom * 100) + '%';
    dirty = false;
  }
  requestAnimationFrame(frame);
}

window.addEventListener('resize', fit);
fit();
syncDoorBtn();
requestAnimationFrame(frame);

if (document.fonts?.load) {
  Promise.all([document.fonts.load('700 120px "Playfair Display"'), document.fonts.load('700 40px "Playfair Display"')])
    .then(() => { cafe.refreshFonts(); dirty = true; }).catch(() => {});
}

// handy for tests / embedding
window.__cafe = {
  cafe, view, goal, camera, renderer, scene,
  render: () => { applyCamera(); renderer.render(scene, camera); },
  // centre the view on a world point (used by the verification scripts)
  lookAt(x, y, z, zoom = 2.5, azDeg = 45, elDeg = 33) {
    const az = THREE.MathUtils.degToRad(azDeg), el = THREE.MathUtils.degToRad(elDeg);
    const right = new THREE.Vector3(Math.cos(az), 0, -Math.sin(az));
    const dir = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
    const up = new THREE.Vector3().crossVectors(dir, right).normalize();
    const d = new THREE.Vector3(x, y, z).sub(CENTER);
    Object.assign(goal, { az, el, zoom, px: d.dot(right), py: d.dot(up) });
    Object.assign(view, goal);
    this.render();
  },
};
