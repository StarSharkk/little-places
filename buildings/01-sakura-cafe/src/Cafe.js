import * as THREE from "three";
import { addDecorations } from "./components/Decoration.js";
import { defaultConfig, palettes } from "./config.js";
import { box, group } from "./components/primitives.js";
import { Roof, Window, Door, Awning, Sign } from "./components/architecture.js";
import { createHullMaterial } from "./components/outline.js";
export function createCafe(options = {}) {
  const config = { ...defaultConfig, ...options };
  const root = new THREE.Group();
  root.name = "SAKURA CAFÉ";
  const m = {};
  const initial = {
    ...palettes[0],
    ink: "#252525",
    gold: "#D6A34B",
    reflection: "#E2EFE4",
    paving: "#FBF7EB",
    joint: "#D8CBA9",
    soil: "#67574B",
    roofLine: "#A6604D",
    leaf: "#6CA887",
  };
  const gradient = new THREE.DataTexture(
    new Uint8Array([165, 220, 255]),
    3,
    1,
    THREE.RedFormat,
  );
  gradient.needsUpdate = true;
  gradient.minFilter = gradient.magFilter = THREE.NearestFilter;
  for (const [key, color] of Object.entries(initial)) {
    if (["name", "label"].includes(key)) continue;
    m[key] = new THREE.MeshToonMaterial({ color, gradientMap: gradient });
  }
  m.doorGlass = new THREE.MeshBasicMaterial({
    color: initial.glass,
    transparent: true,
    opacity: 0.72,
  });
  m.hull = createHullMaterial();
  const { width: w, depth: d, height: h } = config;
  box(root, w, h - 2.7, d, m.wall, [0, (h + 2.7) / 2, 0]);
  // Ground floor is assembled around actual openings rather than a solid wall behind the door.
  box(root, w, 0.3, d, m.trim, [0, 0.15, 0]);
  box(root, w, 0.28, d, m.wall, [0, 2.7, 0]);
  box(root, w, 2.4, 0.18, m.wall, [0, 1.5, -d / 2 + 0.09]);
  for (const x of [-w / 2 + 0.1, w / 2 - 0.1])
    box(root, 0.2, 2.4, d, m.wall, [x, 1.5, 0]);
  for (const [x, width] of [
    [-2.84, 0.32],
    [-0.94, 0.38],
    [0.94, 0.38],
    [2.84, 0.32],
  ])
    box(root, width, 2.4, 0.23, m.wall, [x, 1.5, d / 2 - 0.1]);
  box(root, w - 0.3, 0.08, d - 0.2, m.soil, [0, 0.32, 0]);
  for (const y of [0.3, 2.93, 3.49, h]) {
    box(root, w + 0.17, 0.12, d + 0.17, m.trim, [0, y, 0]);
  }
  for (const x of [-w / 2, w / 2])
    for (const z of [-d / 2, d / 2]) {
      box(root, 0.18, h, 0.18, m.trim, [x, h / 2, z]);
      for (let y = 0.55; y < h; y += 0.42)
        box(root, 0.28, 0.2, 0.28, m.trim, [x, y, z]);
    }
  Roof(root, m, config);
  for (const x of config.frontWindows)
    Window(root, m, { x, y: 0.45, z: d / 2, w: 1.45, h: 2.04 });
  for (const x of config.upperWindows)
    Window(root, m, { x, y: 3.72, z: d / 2, w: 1.02, h: 1.28, shutters: true });
  for (const z of [-1, 1]) {
    Window(root, m, {
      x: w / 2 + 0.02,
      y: 3.72,
      z,
      w: 0.95,
      h: 1.28,
      rotation: Math.PI / 2,
      shutters: true,
    });
    Window(root, m, {
      x: w / 2 + 0.02,
      y: 0.5,
      z,
      w: 1.25,
      h: 1.95,
      rotation: Math.PI / 2,
    });
  }
  const door = Door(root, m, config);
  const sign = Sign(root, m, config);
  for (const x of config.frontWindows)
    Awning(root, m, { x, z: d / 2 + 0.19, w: 1.79 });
  box(root, 1.9, 0.13, 0.58, m.trim, [0, 0.08, d / 2 + 0.51]);
  box(root, 1.6, 0.14, 0.42, m.trim, [0, 0.2, d / 2 + 0.34]);
  addDecorations(root, m, config);
  return {
    group: root,
    materials: m,
    // round-shape silhouettes; keep their resolution in step with the edge lines
    outlineMaterials: [m.hull],
    config,
    door,
    sign,
    setPalette(index) {
      const p = palettes[index];
      for (const key of [
        "wall",
        "trim",
        "roof",
        "accent",
        "door",
        "glass",
        "flower",
      ])
        m[key].color.set(p[key]);
      m.doorGlass.color.set(p.glass);
      m.roofLine.color.set(p.roof).multiplyScalar(0.75);
    },
  };
}
