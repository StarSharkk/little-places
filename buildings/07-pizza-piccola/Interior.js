import * as THREE from 'three';
import { group, box, plate, rod, tube, cylinder, sphere, cone, extrudeShape, archPath } from './primitives.js';
import { hull } from './outline.js';
import { G, H } from './Building.js';

// A whole pizza: crust cylinder with the painted top from the atlas.
export function Pizza(p, m, atlas, pos, r = 0.17) {
  const g = group(p, 'Pizza', pos);
  cylinder(g, r, r * 0.98, 0.025, m.crust, [0, 0.0125, 0], true, 24);
  atlas.disc(g, 'pizza', r * 1.0, [0, 0.0262, 0]);
  return g;
}

// Inside: checkered floor, the wood-fired oven, a counter with a glass pizza display, shelves of jars,
// a chalkboard menu, a drinks fridge, boxes by the takeaway window and three pendant lamps.
export function Interior(root, m, atlas, plant) {
  const F = G.FLOOR, g = group(root, 'Pizzeria interior');
  for (let x = -2.45; x < 2.6; x += 0.5) for (let z = -1.45; z < 1.6; z += 0.5) box(g, 0.49, 0.015, 0.49, Math.round((x + 2.45) * 2 + (z + 1.45) * 2) % 2 ? m.tile : m.cream, [x, F + 0.0075, z], false);

  // ---- Wood-fired oven (back left) ------------------------------------------------------------------
  const oven = group(g, 'Wood-fired oven', [-1.8, F, -1.0]); oven.rotation.y = 0.35;
  box(oven, 1.45, 0.82, 1.25, m.stone, [0, 0.41, 0]);
  box(oven, 1.52, 0.06, 1.32, m.cream, [0, 0.85, 0]);
  box(oven, 0.9, 0.42, 0.04, m.soot, [0, 0.36, 0.61], false);                 // log store
  for (let i = 0; i < 6; i++) { const l = cylinder(oven, 0.06, 0.06, 0.8, i % 2 ? m.wood : m.walnut, [0, 0.2 + Math.floor(i / 3) * 0.12, 0.46 + (i % 3) * 0.04], true, 10); l.rotation.z = Math.PI / 2; l.position.y += (i % 3) * 0.04; }
  const dome = sphere(oven, [0.66, 0.6, 0.6], m.brickRed, [0, 0.88, -0.02], [28, 18]); dome.userData.outline = false; hull(dome, m.hull);
  rod(oven, [0, 1.38, -0.05], [0, H - 0.02, -0.05], 0.09, m.steelDark, 16);
  cylinder(oven, 0.13, 0.13, 0.06, m.steelDark, [0, 1.42, -0.05], true, 16);
  // stone surround of the mouth, the dark arch (click to light or rest the fire) and the fire itself
  const surround = archPath(THREE.Shape, 0, 0.74, 0.86, 1.36, 0.37); surround.holes.push(archPath(THREE.Path, 0, 0.5, 0.88, 1.24, 0.25));
  extrudeShape(oven, surround, 0.12, m.cream, [0, 0, 0.56]);
  const mouth = group(oven, 'Fire up the oven'); mouth.userData.action = 'pizzaOven';
  extrudeShape(mouth, archPath(THREE.Shape, 0, 0.5, 0.88, 1.24, 0.25), 0.02, m.soot, [0, 0, 0.6], false);
  const fire = group(oven, 'Oven fire', [0, 0.9, 0.63]); fire.userData.action = 'pizzaOven'; // the flames are clickable too
  for (const [x, h, r, mat] of [[-0.1, 0.24, 0.07, m.fire], [0.07, 0.3, 0.08, m.fire], [0.0, 0.2, 0.05, m.fireCore], [0.15, 0.16, 0.05, m.fireCore]]) cone(fire, r, h, mat, [x, h / 2, 0], false, 10);
  for (const x of [-0.12, 0.1]) { const l = cylinder(fire, 0.03, 0.03, 0.3, m.walnut, [x, 0.02, -0.02], false, 8); l.rotation.z = Math.PI / 2 - 0.3 * Math.sign(x); }
  // pizza peel leaning on the oven
  rod(oven, [0.82, 0.02, 0.45], [0.72, 1.55, 0.5], 0.02, m.wood, 8);
  const peel = plate(oven, 0.34, 0.4, 0.02, 0.12, m.woodLight, [0.84, 0.25, 0.44]); peel.rotation.z = 0.06;

  // ---- counter with the glass pizza display -------------------------------------------------------------
  const counter = group(g, 'Pizza counter', [0.35, F, 0.2]);
  box(counter, 2.1, 0.92, 0.7, m.wood, [0, 0.46, 0]);
  box(counter, 2.2, 0.05, 0.78, m.walnut, [0, 0.945, 0]);
  for (let i = 0; i < 7; i++) box(counter, 0.012, 0.82, 0.01, m.walnut, [-0.9 + i * 0.3, 0.45, 0.352], false);
  box(counter, 2.14, 0.08, 0.72, m.walnut, [0, 0.04, 0]);
  const caseG = group(counter, 'Pizza display', [-0.25, 0.97, 0.02]);
  box(caseG, 1.3, 0.05, 0.56, m.walnut, [0, 0.025, 0]);
  box(caseG, 1.3, 0.5, 0.56, m.glass, [0, 0.3, 0], false);
  for (const [x, z] of [[-0.64, -0.27], [0.64, -0.27], [-0.64, 0.27], [0.64, 0.27]]) box(caseG, 0.025, 0.5, 0.025, m.walnut, [x, 0.3, z]);
  box(caseG, 1.32, 0.04, 0.58, m.walnut, [0, 0.57, 0]);
  box(caseG, 1.24, 0.015, 0.5, m.steel, [0, 0.3, 0], false);
  for (const [x, y] of [[-0.42, 0.06], [0.0, 0.06], [0.42, 0.06], [-0.22, 0.31], [0.22, 0.31]]) Pizza(caseG, m, atlas, [x, y, 0], 0.17);
  const ref = box(caseG, 0.03, 0.4, 0.006, m.reflection, [-0.35, 0.3, 0.285], false); ref.rotation.z = -0.4;
  const till = group(counter, 'Register', [0.75, 0.97, -0.05]);
  plate(till, 0.32, 0.12, 0.26, 0.03, m.iron, [0, 0.06, 0]);
  const screen = box(till, 0.24, 0.16, 0.03, m.iron, [0, 0.22, -0.06]); screen.rotation.x = -0.3;
  box(till, 0.2, 0.12, 0.005, m.doorGlass, [0, 0.225, -0.042], false).rotation.x = -0.3;
  plant(counter, m, [0.95, 0.97, 0.22], { r: 0.07, h: 0.1, pot: m.terracotta, kind: 'bush' });
  Pizza(counter, m, atlas, [0.45, 0.975, 0.18], 0.13);

  // ---- back wall: two shelves of jars and bottles, the chalkboard menu --------------------------------------
  for (const [y, seed] of [[1.55, 1], [2.05, 2]]) {
    const s = group(g, 'Jar shelf', [0.45, F + y, -1.58]);
    box(s, 2.0, 0.04, 0.24, m.walnut, [0, 0, 0]);
    for (const x of [-0.85, 0.85]) box(s, 0.04, 0.14, 0.18, m.walnut, [x, -0.09, -0.02]);
    for (let i = 0; i < 8; i++) {
      const x = -0.85 + i * 0.24, k = (i + seed) % 4;
      if (k === 0) { cylinder(s, 0.06, 0.06, 0.16, m.jar, [x, 0.1, 0], true, 14); cylinder(s, 0.062, 0.062, 0.03, m.tomato, [x, 0.195, 0], true, 14); }
      else if (k === 1) { cylinder(s, 0.04, 0.045, 0.2, m.leafDeep, [x, 0.12, 0], true, 12); cylinder(s, 0.015, 0.015, 0.06, m.leafDeep, [x, 0.25, 0], true, 8); }
      else if (k === 2) { cylinder(s, 0.07, 0.07, 0.13, m.cream, [x, 0.085, 0], true, 14); for (let j = 0; j < 4; j++) box(s, 0.006, 0.1, 0.006, m.cheese, [x - 0.03 + j * 0.02, 0.09, 0.06], false); }
      else { cylinder(s, 0.055, 0.055, 0.12, m.tomato, [x, 0.08, 0], true, 14); box(s, 0.08, 0.05, 0.003, m.cream, [x, 0.08, 0.057], false); }
    }
  }
  plate(g, 1.1, 0.68, 0.04, 0.03, m.walnut, [0.45, F + 2.66, -1.68]);
  atlas.attach(g, 'menu', 1.0, 0.6, [0.45, F + 2.66, -1.657]);
  // drinks fridge in the back-right corner
  const fr = group(g, 'Drinks fridge', [2.25, F, -1.35]);
  plate(fr, 0.8, 1.95, 0.6, 0.05, m.steel, [0, 0.975, 0]);
  box(fr, 0.66, 1.6, 0.012, m.glass, [0, 1.05, 0.305], false);
  for (let r = 0; r < 4; r++) { box(fr, 0.66, 0.015, 0.5, m.steelDark, [0, 0.32 + r * 0.4, 0], false); for (let i = 0; i < 5; i++) cylinder(fr, 0.035, 0.035, 0.22, [m.tomato, m.leafDeep, m.butter, m.coral, m.mint][(i + r) % 5], [-0.24 + i * 0.12, 0.44 + r * 0.4, 0.12], false, 10); }
  box(fr, 0.66, 0.2, 0.02, m.coral, [0, 1.8, 0.305]);
  // stacked pizza boxes ready for the takeaway window
  const tb = group(g, 'Pizza box table', [2.22, F, 0.55]);
  box(tb, 0.7, 0.04, 0.55, m.walnut, [0, 0.74, 0]); for (const [x, z] of [[-0.3, -0.22], [0.3, -0.22], [-0.3, 0.22], [0.3, 0.22]]) box(tb, 0.04, 0.72, 0.04, m.walnut, [x, 0.36, z]);
  for (let i = 0; i < 5; i++) { const b = box(tb, 0.44, 0.06, 0.44, m.card, [(i % 2) * 0.02, 0.79 + i * 0.062, 0]); b.rotation.y = (i % 3 - 1) * 0.05; }
  atlas.attach(tb, 'boxlid', 0.4, 0.4, [0.0, 0.79 + 4 * 0.062 + 0.032, 0]).rotation.x = -Math.PI / 2;

  // ---- three pendant lamps over the counter -------------------------------------------------------------
  for (const x of [-1.15, 0.0, 1.15]) {
    rod(g, [x, G.TOP, 0.9], [x, G.TOP - 0.65, 0.9], 0.006, m.ink, 4);
    hull(cone(g, 0.16, 0.16, m.mintDeep, [x, G.TOP - 0.72, 0.9], true, 20), m.hull);
    sphere(g, [0.05, 0.05, 0.05], m.glow, [x, G.TOP - 0.81, 0.9], [10, 6]);
  }
  return { group: g, mouth, fire };
}
