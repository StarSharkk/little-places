import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { createCafe } from "./Cafe.js";
import { finishModel, createIllustrationShadow } from "./components/finish.js";
import { palettes } from "./config.js";
import "./style.css";
const host = document.querySelector("#scene");
let dirty = true;
const invalidate = () => {
  dirty = true;
};
const scene = new THREE.Scene();
scene.background = new THREE.Color("#F7F3E9");
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = false;
host.appendChild(renderer.domElement);
const camera = new THREE.OrthographicCamera(-10, 10, 8, -8, 0.1, 100);
camera.position.set(13, 14.7, 13);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 3, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.09;
controls.enablePan = false;
controls.minZoom = 0.65;
controls.maxZoom = 1.85;
controls.minPolarAngle = Math.PI / 6;
controls.maxPolarAngle = Math.PI * 0.46;
controls.rotateSpeed = 0.65;
controls.zoomSpeed = 0.6;
controls.update();
controls.saveState();
controls.addEventListener("change", invalidate);
scene.add(new THREE.HemisphereLight(0xffffff, 0xc3b59e, 1.8));
const sun = new THREE.DirectionalLight(0xffffff, 1.4);
sun.position.set(-3, 10, 7);
scene.add(sun);
const cafe = createCafe();
scene.add(cafe.group);
const lineMaterials = finishModel(cafe.group, [cafe.door.leaf, cafe.sign]);
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.MeshBasicMaterial({ color: "#F7F3E9" }),
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.21;
scene.add(ground);
scene.add(createIllustrationShadow(cafe.group));
function resize() {
  const w = host.clientWidth,
    h = host.clientHeight;
  renderer.setSize(w, h);
  lineMaterials.forEach((m) => m.resolution.set(w, h));
  const aspect = w / h;
  const span = w < 650 ? Math.max(18, 12.4 / aspect) : 13.8;
  camera.top = span / 2;
  camera.bottom = -span / 2;
  camera.left = (-span * aspect) / 2;
  camera.right = (span * aspect) / 2;
  camera.setViewOffset(
    w,
    h,
    w < 650 ? 0 : -w * 0.12,
    w < 650 ? -h * 0.035 : 0,
    w,
    h,
  );
  camera.updateProjectionMatrix();
  invalidate();
}
new ResizeObserver(resize).observe(host);
resize();
const menu = document.querySelector("#menu");
function showMenu() {
  if (!menu.open) menu.showModal();
}
document.querySelector("#menu-button").onclick = showMenu;
document.querySelector(".close").onclick = () => menu.close();
menu.addEventListener("click", (e) => {
  if (e.target === menu) {
    const r = menu.getBoundingClientRect();
    if (
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom
    )
      menu.close();
  }
});
let doorOpen = false;
function toggleDoor() {
  doorOpen = !doorOpen;
  invalidate();
  const button = document.querySelector("#door-button");
  button.innerHTML = `${doorOpen ? "Close" : "Open"} the door <span>↗</span>`;
  button.setAttribute("aria-pressed", doorOpen);
}
document.querySelector("#door-button").onclick = toggleDoor;
for (const [i, p] of palettes.entries()) {
  const b = document.createElement("button");
  b.className = "swatch";
  b.style.background = p.wall;
  b.setAttribute("aria-label", p.name);
  b.setAttribute("aria-pressed", i === 0);
  b.title = p.label;
  b.onclick = () => {
    cafe.setPalette(i);
    invalidate();
    document
      .querySelectorAll(".swatch")
      .forEach((s, j) => s.setAttribute("aria-pressed", i === j));
    document.querySelector("#palette-name").textContent = p.name;
  };
  document.querySelector("#palettes").append(b);
}
let zoomGoal = null;
controls.addEventListener("start", () => {
  zoomGoal = null;
});
function zoomTo(value) {
  zoomGoal = THREE.MathUtils.clamp(value, 0.65, 1.85);
  invalidate();
}
renderer.domElement.addEventListener(
  "wheel",
  (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    const delta =
      event.deltaY *
      (event.deltaMode === 1
        ? 16
        : event.deltaMode === 2
          ? host.clientHeight
          : 1);
    zoomTo((zoomGoal ?? camera.zoom) * Math.exp(-delta * 0.001));
  },
  { passive: false, capture: true },
);
document.querySelector("#reset").onclick = () => {
  zoomGoal = null;
  controls.reset();
  invalidate();
};
document.querySelector("#zoom-in").onclick = () =>
  zoomTo((zoomGoal ?? camera.zoom) + 0.15);
document.querySelector("#zoom-out").onclick = () =>
  zoomTo((zoomGoal ?? camera.zoom) - 0.15);
const ray = new THREE.Raycaster(),
  pointer = new THREE.Vector2();
let down = [0, 0],
  hover = null;
function hit(e) {
  const r = host.getBoundingClientRect();
  pointer.set(
    ((e.clientX - r.left) / r.width) * 2 - 1,
    (-(e.clientY - r.top) / r.height) * 2 + 1,
  );
  ray.setFromCamera(pointer, camera);
  const hits = ray.intersectObject(cafe.group, true);
  for (const h of hits) {
    if (!h.object.isMesh || h.object.isLineSegments2) continue;
    let o = h.object;
    while (o && o !== cafe.group) {
      if (o.userData.action) return o;
      o = o.parent;
    }
    return null;
  }
  return null;
}
host.addEventListener("pointerdown", (e) => {
  down = [e.clientX, e.clientY];
});
host.addEventListener("pointerup", (e) => {
  if (Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) return;
  const o = hit(e);
  if (o?.userData.action === "door") toggleDoor();
  if (o?.userData.action === "menu") showMenu();
});
const tooltip = document.querySelector("#tooltip");
host.addEventListener("pointermove", (e) => {
  hover = hit(e);
  invalidate();
  renderer.domElement.style.cursor = hover ? "pointer" : "grab";
  tooltip.style.display = hover ? "block" : "none";
  tooltip.textContent =
    hover?.userData.action === "door" ? "Step inside ↗" : "Explore the menu ↗";
  tooltip.style.left = `${Math.min(e.clientX + 14, innerWidth - 155)}px`;
  tooltip.style.top = `${e.clientY - 35}px`;
});
host.addEventListener("pointerleave", () => {
  hover = null;
  invalidate();
  tooltip.style.display = "none";
});
const hoverMaterials = [];
for (const target of [cafe.door.leaf, cafe.sign])
  target.traverse((o) => {
    if (o.isMesh && o.material.isMeshToonMaterial) {
      const source = o.material;
      o.material = o.material.clone();
      hoverMaterials.push({ object: o, target, source });
    }
  });
const clock = new THREE.Clock();
function animate() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const controlsChanged = controls.update();
  const movingDoor =
    Math.abs(cafe.door.hinge.rotation.y - (doorOpen ? -Math.PI * 0.58 : 0)) >
    0.0001;
  if (!dirty && !controlsChanged && !movingDoor && zoomGoal === null) return;
  if (zoomGoal !== null) {
    camera.zoom = THREE.MathUtils.damp(camera.zoom, zoomGoal, 12, dt);
    if (Math.abs(camera.zoom - zoomGoal) < 0.001) {
      camera.zoom = zoomGoal;
      zoomGoal = null;
    }
    camera.updateProjectionMatrix();
  }
  dirty = false;
  for (const { object, target, source } of hoverMaterials) {
    object.material.color.copy(source.color);
    object.material.emissive.setHex(hover === target ? 0x302414 : 0);
  }
  cafe.door.hinge.rotation.y = THREE.MathUtils.damp(
    cafe.door.hinge.rotation.y,
    doorOpen ? -Math.PI * 0.58 : 0,
    9,
    dt,
  );
  document.querySelector("#zoom-value").value =
    `${Math.round(camera.zoom * 100)}%`;
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);
window.__cafe = {
  cafe,
  scene,
  camera,
  renderer,
  controls,
  get doorOpen() {
    return doorOpen;
  },
};
