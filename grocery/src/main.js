import * as THREE from "three";
import { themes } from "./themes.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { createBuilding } from "./Building.js";
import { finishModel, createIllustrationShadow } from "./optimize.js";
import "./style.css";
const host = document.querySelector("#scene");
let dirty = true;
const invalidate = () => {
  dirty = true;
};
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.outputColorSpace = THREE.SRGBColorSpace;
host.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color("#F7F3E9");
scene.add(new THREE.HemisphereLight(0xffffff, 0xc3b59e, 1.8));
const sun = new THREE.DirectionalLight(0xffffff, 1.25);
sun.position.set(-3, 12, 8);
scene.add(sun);
const camera = new THREE.OrthographicCamera(-10, 10, 8, -8, 0.1, 100);
const initial = new THREE.Vector3(14, 16.8, 14);
camera.position.copy(initial);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 4.2, 0);
controls.enablePan = false;
controls.enableDamping = true;
controls.dampingFactor = 0.09;
controls.minPolarAngle = 0.38;
controls.maxPolarAngle = 1.48;
controls.minZoom = 0.65;
controls.maxZoom = 2;
controls.rotateSpeed = 0.6;
controls.update();
controls.saveState();
controls.addEventListener("change", invalidate);
const building = createBuilding();
scene.add(building.group);
building.storefront.shutter.userData.action = "shutter";
const projectedShadow = createIllustrationShadow(building.group);
const lineMaterials = finishModel(building.group, [
  building.storefront.shutter,
]);
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(150, 150),
  new THREE.MeshBasicMaterial({ color: "#F7F3E9" }),
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.36;
scene.add(floor);
scene.add(projectedShadow);
function resize() {
  const w = host.clientWidth,
    h = host.clientHeight;
  renderer.setSize(w, h);
  const aspect = w / h;
  const span = w < 650 ? Math.max(15.4, 10.9 / aspect) : 15.8;
  camera.top = span / 2;
  camera.bottom = -span / 2;
  camera.left = (-span * aspect) / 2;
  camera.right = (span * aspect) / 2;
  camera.setViewOffset(
    w,
    h,
    w < 650 ? 0 : -w * 0.135,
    w < 650 ? -h * 0.01 : 0,
    w,
    h,
  );
  camera.updateProjectionMatrix();
  lineMaterials.forEach((m) => m.resolution.set(w, h));
  invalidate();
}
new ResizeObserver(resize).observe(host);
resize();
let zoomGoal = null,
  shopOpen = false,
  openAmount = 0,
  details = false;
controls.addEventListener("start", () => {
  zoomGoal = null;
  document.querySelectorAll("[data-view]").forEach(button => button.setAttribute("aria-pressed", "false"));
});
function zoom(value) {
  zoomGoal = THREE.MathUtils.clamp(value, 0.65, 2);
  invalidate();
}
renderer.domElement.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    e.stopImmediatePropagation();
    zoom(
      (zoomGoal ?? camera.zoom) *
        Math.exp(-e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? host.clientHeight : 1) * 0.001),
    );
  },
  { capture: true, passive: false },
);
document.querySelector("#in").onclick = () =>
  zoom((zoomGoal ?? camera.zoom) + 0.15);
document.querySelector("#out").onclick = () =>
  zoom((zoomGoal ?? camera.zoom) - 0.15);
function toggle() {
  shopOpen = !shopOpen;
  document.querySelector("#shutter").innerHTML =
    `${shopOpen ? "Close" : "Open"} the shop <span>↗</span>`;
  document.querySelector("#shutter").setAttribute("aria-pressed", shopOpen);
  invalidate();
}
document.querySelector("#shutter").onclick = toggle;
function setView(view) {
  zoomGoal = null;
  controls.enableDamping = false;
  controls.update();
  controls.reset();
  if (view === "front") camera.position.set(0, 16.8, 19.8);
  if (view === "side") camera.position.set(19.8, 16.8, 0);
  controls.update();
  controls.enableDamping = true;
  document
    .querySelectorAll("[data-view]")
    .forEach((b) => b.setAttribute("aria-pressed", b.dataset.view === view));
  invalidate();
}
document.querySelector("#reset").onclick = () => setView("iso");
document
  .querySelectorAll("[data-view]")
  .forEach((b) => (b.onclick = () => setView(b.dataset.view)));
document.querySelector("#details").onclick = () => {
  details = !details;
  document.querySelector("#details").setAttribute("aria-pressed", details);
  document.querySelector("#annotations").classList.toggle("visible", details);
  document.querySelector("#annotations").setAttribute("aria-hidden", !details);
  invalidate();
};
for (const [index, theme] of themes.entries()) {
  const button = document.createElement('button');
  button.className = 'swatch';
  button.style.background = theme.wall;
  button.setAttribute('aria-label', theme.name);
  button.setAttribute('aria-pressed', String(index === 0));
  button.title = theme.label;
  button.onclick = () => {
    building.setTheme(index);
    document.querySelectorAll('.swatch').forEach((swatch, i) => swatch.setAttribute('aria-pressed', String(i === index)));
    invalidate();
  };
  document.querySelector('#palettes').append(button);
}
const raycaster = new THREE.Raycaster(),
  pointer = new THREE.Vector2();
const hint = document.querySelector("#hint");
let start = null,
  hover = false;
function pick(event) {
  const r = host.getBoundingClientRect();
  pointer.set(
    ((event.clientX - r.left) / r.width) * 2 - 1,
    (-(event.clientY - r.top) / r.height) * 2 + 1,
  );
  raycaster.setFromCamera(pointer, camera);
  for (const hit of raycaster.intersectObject(building.group, true)) {
    if (!hit.object.isMesh || hit.object.isLineSegments2) continue;
    let o = hit.object;
    while (o && o !== building.group) {
      if (o.userData.action) return o.userData.action;
      o = o.parent;
    }
    return null;
  }
  return null;
}
host.addEventListener("pointerdown", (e) => {
  start = [e.clientX, e.clientY];
});
host.addEventListener("pointerup", (e) => {
  if (
    start &&
    Math.hypot(e.clientX - start[0], e.clientY - start[1]) < 5 &&
    pick(e) === "shutter"
  )
    toggle();
  start = null;
});
host.addEventListener("pointercancel", () => (start = null));
host.addEventListener("pointermove", (e) => {
  if (e.pointerType === "touch" || e.buttons) { hint.style.display = "none"; return; }
  hover = pick(e) === "shutter";
  renderer.domElement.style.cursor = hover ? "pointer" : "grab";
  hint.textContent = shopOpen
    ? "Close the shutter ↗"
    : "Open the neighbourhood shop ↗";
  hint.style.display = hover ? "block" : "none";
  hint.style.left = `${Math.max(8, Math.min(e.clientX + 12, innerWidth - 230))}px`;
  hint.style.top = `${Math.max(8, e.clientY - 36)}px`;
});
host.addEventListener("pointerleave", () => {
  hint.style.display = "none";
});
const annotations = {
  roof: new THREE.Vector3(1.1, 8.7, 0),
  shop: new THREE.Vector3(-1.9, 3.6, 2.3),
  drinks: new THREE.Vector3(3.2, 1.5, -0.59),
};
const clock = new THREE.Clock();
let renders = 0;
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05),
    changed = controls.update(),
    moving = Math.abs(openAmount - (shopOpen ? 1 : 0)) > 0.0001;
  if (!dirty && !changed && !moving && zoomGoal === null) return;
  dirty = false;
  if (zoomGoal !== null) {
    camera.zoom = THREE.MathUtils.damp(camera.zoom, zoomGoal, 12, dt);
    if (Math.abs(camera.zoom - zoomGoal) < 0.001) {
      camera.zoom = zoomGoal;
      zoomGoal = null;
    }
    camera.updateProjectionMatrix();
  }
  openAmount = THREE.MathUtils.damp(openAmount, shopOpen ? 1 : 0, 7, dt);
  building.storefront.setOpen(openAmount);
  if (details)
    for (const [key, point] of Object.entries(annotations)) {
      const p = point.clone().project(camera);
      const label = document.querySelector(`[data-anchor=${key}]`);
      const labelWidth = label.offsetWidth;
      const x = Math.max(23, Math.min(((p.x + 1) * host.clientWidth) / 2, host.clientWidth - labelWidth + 7));
      const y = Math.max(22, Math.min(((1 - p.y) * host.clientHeight) / 2, host.clientHeight - (innerWidth < 650 ? 22 : 95)));
      label.style.left = `${x + host.offsetLeft}px`;
      label.style.top = `${y + host.offsetTop}px`;
      label.hidden = p.z < -1 || p.z > 1;
    }
  document.querySelector("#zoom-value").value =
    `${Math.round(camera.zoom * 100)}%`;
  renderer.render(scene, camera);
  renders++;
});
window.__grocery = {
  building,
  scene,
  camera,
  controls,
  renderer,
  get shopOpen() {
    return shopOpen;
  },
  get renders() {
    return renders;
  },
};
