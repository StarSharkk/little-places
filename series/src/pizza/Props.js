import * as THREE from 'three';
import { group, box, plate, rod, tube, cylinder, sphere, cone } from './primitives.js';
import { hull } from './outline.js';
import { G, rng } from './Building.js';
import { Pizza } from './Interior.js';

const inked = (o, m) => (hull(o, m.hull), o);

// Potted plants with inked silhouettes: a round bush, a leafy tropical plant, or flowers.
export function plant(p, m, pos, { r = 0.14, h = 0.2, pot = m.terracotta, kind = 'bush', s = 1 } = {}) {
  const g = group(p, 'Potted plant', pos); g.scale.setScalar(s);
  inked(cylinder(g, r, r * 0.75, h, pot, [0, h / 2, 0], true, 24), m);
  inked(cylinder(g, r * 1.08, r * 1.08, h * 0.18, pot, [0, h * 0.91, 0], true, 24), m);
  cylinder(g, r * 0.95, r * 0.95, 0.01, m.soil, [0, h + 0.004, 0], false, 16);
  if (kind === 'bush' || kind === 'flowers') {
    for (let i = 0; i < 6; i++) { const a = i * 2.4; inked(sphere(g, [r * 0.85, r * 0.78, r * 0.85], i % 2 ? m.leaf : m.leafLight, [Math.cos(a) * r * 0.5, h + r * 0.6 + (i % 3) * r * 0.32, Math.sin(a) * r * 0.5], [10, 7]), m); }
    if (kind === 'flowers') for (let i = 0; i < 7; i++) { const a = i * 1.7; sphere(g, [r * 0.22, r * 0.2, r * 0.22], i % 2 ? m.pink : m.flowerRed, [Math.cos(a) * r * 0.75, h + r * 0.9 + (i % 3) * r * 0.3, Math.sin(a) * r * 0.75], [8, 6]); }
  }
  if (kind === 'leafy') {
    for (let i = 0; i < 9; i++) {
      const a = i * 2.39, lift = 0.5 + (i % 3) * 0.28, len = r * (2.2 + (i % 2) * 0.6);
      const tip = [Math.cos(a) * len * 0.75, h + len * lift, Math.sin(a) * len * 0.75];
      rod(g, [0, h, 0], tip, 0.01, m.leafDeep, 4);
      const leaf = sphere(g, [r * 0.42, r * 0.12, r * 0.9], i % 2 ? m.leaf : m.leafLight, tip, [10, 6]);
      leaf.rotation.y = -a + Math.PI / 2; leaf.rotation.x = -0.5 + (i % 3) * 0.2; inked(leaf, m);
    }
  }
  return g;
}

// A trailing vine: stem with leaf pairs
function vine(p, m, a, b, leaves = 8, seed = 0) {
  const mid = [(a[0] + b[0]) / 2 + 0.05 * Math.cos(seed), (a[1] + b[1]) / 2, (a[2] + b[2]) / 2 + 0.05 * Math.sin(seed)];
  tube(p, [a, mid, b], 0.008, m.leafDeep);
  const c = new THREE.CatmullRomCurve3([a, mid, b].map(v => new THREE.Vector3(...v)));
  for (let i = 1; i <= leaves; i++) { const v = c.getPoint(i / (leaves + 0.3)); sphere(p, [0.055, 0.035, 0.055], (i + seed) % 2 ? m.leaf : m.leafLight, [v.x + (i % 2 ? 0.03 : -0.03), v.y, v.z + (i % 3 - 1) * 0.02], [6, 4]); }
}

function Chair(p, m, pos, turn) {
  const g = group(p, 'Bistro chair', pos); g.rotation.y = turn;
  inked(cylinder(g, 0.19, 0.19, 0.035, m.mint, [0, 0.46, 0], true, 22), m);
  for (const [x, z] of [[-0.13, -0.13], [0.13, -0.13], [-0.13, 0.13], [0.13, 0.13]]) rod(g, [x * 1.15, 0, z * 1.15], [x * 0.85, 0.45, z * 0.85], 0.017, m.mintDeep, 6);
  tube(g, [[-0.15, 0.46, -0.12], [-0.16, 0.74, -0.17], [0, 0.82, -0.2], [0.16, 0.74, -0.17], [0.15, 0.46, -0.12]], 0.018, m.mintDeep);
  for (const x of [-0.07, 0, 0.07]) rod(g, [x, 0.47, -0.15], [x, 0.78, -0.19], 0.008, m.mintDeep, 4);
  return g;
}
function Table(p, m, atlas, pos, items = true) {
  const g = group(p, 'Bistro table', pos);
  inked(cylinder(g, 0.34, 0.34, 0.035, m.cream, [0, 0.74, 0], true, 28), m);
  rod(g, [0, 0, 0], [0, 0.73, 0], 0.03, m.iron, 8);
  for (const a of [0.4, 2.5, 4.6]) rod(g, [0, 0.04, 0], [Math.sin(a) * 0.26, 0.005, Math.cos(a) * 0.26], 0.02, m.iron, 6);
  if (!items) return g;
  cylinder(g, 0.19, 0.19, 0.012, m.paper, [0.04, 0.762, 0.02], false, 24);
  Pizza(g, m, atlas, [0.04, 0.768, 0.02], 0.15);
  for (const [x, z, col] of [[-0.22, -0.1, m.coral], [0.2, -0.2, m.butter]]) { cylinder(g, 0.035, 0.03, 0.12, m.glass, [x, 0.82, z], false, 12); cylinder(g, 0.031, 0.027, 0.08, col, [x, 0.8, z], false, 12); }
  const vase = group(g, 'Little vase', [-0.18, 0.758, 0.2]);
  inked(cylinder(vase, 0.035, 0.04, 0.1, m.stripe, [0, 0.05, 0], true, 14), m);
  for (let i = 0; i < 3; i++) { rod(vase, [0, 0.08, 0], [Math.cos(i * 2) * 0.04, 0.2, Math.sin(i * 2) * 0.04], 0.004, m.leafDeep, 4); sphere(vase, [0.025, 0.02, 0.025], i % 2 ? m.pink : m.flowerRed, [Math.cos(i * 2) * 0.04, 0.21, Math.sin(i * 2) * 0.04], [8, 5]); }
  return g;
}
function Planter(p, m, pos, len, turn = 0) {
  const g = group(p, 'Flower planter', pos); g.rotation.y = turn;
  box(g, len, 0.32, 0.32, m.wood, [0, 0.16, 0]); box(g, len + 0.04, 0.04, 0.36, m.walnut, [0, 0.33, 0]);
  for (let i = 0; i < 3; i++) box(g, len + 0.004, 0.01, 0.324, m.walnut, [0, 0.08 + i * 0.08, 0], false);
  const n = Math.round(len / 0.2);
  for (let i = 0; i < n; i++) {
    const x = -len / 2 + 0.12 + (i / (n - 1)) * (len - 0.24);
    inked(sphere(g, [0.12, 0.1, 0.12], i % 2 ? m.leaf : m.leafLight, [x, 0.42, (i % 2 - 0.5) * 0.06], [9, 6]), m);
    sphere(g, [0.045, 0.04, 0.045], i % 3 ? m.pink : m.flowerRed, [x + 0.03, 0.52, 0.06], [8, 6]);
    if (i % 2 === 0) sphere(g, [0.04, 0.035, 0.04], m.paper, [x - 0.05, 0.5, -0.04], [8, 6]);
  }
  return g;
}

// Chalkboard A-frame. The two leaves hinge together at the TOP and hang down and outwards, so the board reads as
// a Λ and both feet land on the ground: hinge height = L·cos(a). (Hinging at the feet opens it into a V.)
function ABoard(p, m, atlas, pos, turn, { L = 1.0, a = 0.2, w = 0.65 } = {}) {
  const g = group(p, 'Chalkboard A-frame', pos); g.rotation.y = turn;
  const H = L * Math.cos(a);
  for (const s of [1, -1]) {
    const leaf = group(g, s > 0 ? 'Front leaf' : 'Back leaf', [0, H, 0]); leaf.rotation.x = -s * a;
    for (const x of [-(w / 2 - 0.025), w / 2 - 0.025]) box(leaf, 0.045, L, 0.045, m.walnut, [x, -L / 2, 0]);
    box(leaf, w, 0.05, 0.045, m.walnut, [0, -0.025, 0]); box(leaf, w, 0.04, 0.045, m.walnut, [0, -L + 0.16, 0]);
    box(leaf, w - 0.09, 0.74, 0.02, m.chalk, [0, -L + 0.56, s * 0.003], false);
    if (s > 0) atlas.attach(leaf, 'board', w - 0.15, 0.66, [0, -L + 0.56, 0.016]);
  }
  rod(g, [-w / 2 - 0.02, H, 0], [w / 2 + 0.02, H, 0], 0.014, m.brass, 8);                       // top hinge
  for (const x of [-(w / 2 - 0.05), w / 2 - 0.05]) rod(g, [x, H * 0.45, Math.sin(a) * L * 0.55], [x, H * 0.45, -Math.sin(a) * L * 0.55], 0.006, m.ink, 4); // spreader chains
  return g;
}

// ---- outside: fenced terrace with tables, a lamp post, the A-board, plants, vines and the delivery scooter ------
export function StreetDetails(root, m, atlas) {
  const { GROUND: Y, FLOOR: F, X0, X1, Z1 } = G, g = group(root, 'Life around the pizzeria');
  // low wooden fence around the terrace on the left and in front
  const fence = (a, b) => {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(2, Math.round(len / 0.5));
    for (let i = 0; i <= n; i++) { const t = i / n; box(g, 0.07, 0.68, 0.07, m.walnut, [a[0] + (b[0] - a[0]) * t, Y + 0.34, a[1] + (b[1] - a[1]) * t]); }
    for (const y of [0.3, 0.6]) { const along = Math.abs(b[0] - a[0]) > 0.01; box(g, along ? len : 0.045, 0.06, along ? 0.045 : len, m.wood, [(a[0] + b[0]) / 2, Y + y, (a[1] + b[1]) / 2]); }
  };
  fence([-5.1, -0.9], [-5.1, 3.9]); fence([-5.1, 3.9], [-1.6, 3.9]);
  Planter(g, m, [-4.85, Y, 1.7], 1.3, Math.PI / 2); Planter(g, m, [-3.4, Y, 3.65], 1.2);
  Table(g, m, atlas, [-4.05, Y, 0.35]); Chair(g, m, [-4.05, Y, -0.25], 0); Chair(g, m, [-3.45, Y, 0.45], -Math.PI / 2 - 0.2); Chair(g, m, [-4.55, Y, 0.85], Math.PI * 0.75);
  Table(g, m, atlas, [-2.35, Y, 2.85]); Chair(g, m, [-2.95, Y, 2.7], Math.PI / 2 + 0.2); Chair(g, m, [-1.75, Y, 2.9], -Math.PI / 2 + 0.1); Chair(g, m, [-2.4, Y, 3.45], Math.PI);
  // a little table by the door too
  Table(g, m, atlas, [-0.3, Y, 2.75], false); Chair(g, m, [0.2, Y, 2.95], -Math.PI / 2 - 0.3);
  cylinder(g, 0.035, 0.03, 0.12, m.glass, [-0.25, Y + 0.82, 2.7], false, 12); cylinder(g, 0.031, 0.027, 0.08, m.coral, [-0.25, Y + 0.8, 2.7], false, 12);
  // lamp post with a little hanging pizza sign
  const lamp = group(g, 'Street lamp', [-4.72, Y, 3.6]);
  cylinder(lamp, 0.13, 0.16, 0.22, m.iron, [0, 0.11, 0], true, 16);
  rod(lamp, [0, 0.2, 0], [0, 2.75, 0], 0.045, m.iron, 12);
  cylinder(lamp, 0.07, 0.07, 0.08, m.iron, [0, 2.78, 0], true, 12);
  const head = group(lamp, 'Lantern', [0, 2.82, 0]);
  inked(cylinder(head, 0.12, 0.08, 0.06, m.iron, [0, 0, 0], true, 6), m);
  box(head, 0.15, 0.26, 0.15, m.glow, [0, 0.16, 0]);
  for (const [x, z] of [[-0.08, -0.08], [0.08, -0.08], [-0.08, 0.08], [0.08, 0.08]]) box(head, 0.025, 0.28, 0.025, m.iron, [x, 0.16, z]);
  inked(cone(head, 0.16, 0.16, m.iron, [0, 0.37, 0], true, 6), m); sphere(head, [0.03, 0.03, 0.03], m.iron, [0, 0.47, 0], [8, 6]);
  rod(lamp, [0, 2.2, 0], [0.4, 2.2, 0], 0.014, m.iron, 6);
  const sg = group(lamp, 'Little sign', [0.32, 1.98, 0]);
  for (const x of [-0.08, 0.08]) rod(sg, [x, 0.22, 0], [x, 0.12, 0], 0.004, m.iron, 4);
  const ring = cylinder(sg, 0.13, 0.13, 0.03, m.coral, [0, 0, 0], true, 24); ring.rotation.x = Math.PI / 2; inked(ring, m);
  atlas.disc(sg, 'emblem', 0.12, [0, 0, 0.017], false); atlas.disc(sg, 'emblem', 0.12, [0, 0, -0.017], false).rotation.y = Math.PI;
  // A-board by the door
  ABoard(g, m, atlas, [0.55, Y, 3.35], -0.3);
  // pots and vines at the door and the corners
  plant(g, m, [0.98, Y, 2.25], { r: 0.2, h: 0.34, kind: 'leafy' });
  plant(g, m, [2.68, Y, 2.3], { r: 0.22, h: 0.36, kind: 'leafy' });
  plant(g, m, [3.35, Y, -2.2], { r: 0.18, h: 0.3, kind: 'bush' });
  plant(g, m, [3.32, Y, 1.55], { r: 0.16, h: 0.26, pot: m.cream, kind: 'flowers' });
  plant(g, m, [-3.25, Y, -1.6], { r: 0.18, h: 0.3, kind: 'leafy' });
  const vx = X0 - 0.03, vz = Z1 + 0.03;
  vine(g, m, [vx, Y + 0.3, vz], [vx - 0.02, 1.7, vz + 0.03], 12, 1); vine(g, m, [vx + 0.03, 1.6, vz], [vx, 3.0, vz + 0.04], 11, 2);
  vine(g, m, [vx, 3.0, vz + 0.04], [-2.0, 3.35, vz + 0.04], 8, 3); vine(g, m, [-2.5, 3.25, vz + 0.04], [-2.45, 2.85, vz + 0.05], 3, 4);
  vine(g, m, [X1 + 0.03, Y + 0.3, 1.75], [X1 + 0.04, 2.3, 1.7], 13, 5); vine(g, m, [X1 + 0.04, 2.3, 1.7], [X1 + 0.03, 3.3, 1.2], 8, 6);
  // drain grate in the pavement
  box(g, 0.6, 0.012, 0.22, m.iron, [1.9, Y + 0.006, 3.9], false);
  for (let i = 0; i < 6; i++) box(g, 0.012, 0.014, 0.18, m.steelDark, [1.66 + i * 0.095, Y + 0.008, 3.9], false);
  // parked along the right-hand side, below the takeaway window, side-on to the default camera
  Scooter(g, m, atlas, [3.78, Y, -0.95], Math.PI / 2 + 0.25);
  return g;
}

// The green delivery scooter with a branded box on its rack.
function Scooter(p, m, atlas, pos, turn) {
  const g = group(p, 'Delivery scooter', pos); g.rotation.y = turn;   // local +x is the front
  for (const x of [-0.5, 0.52]) {
    const w = cylinder(g, 0.21, 0.21, 0.11, m.tyre, [x, 0.21, 0], true, 28); w.rotation.x = Math.PI / 2; inked(w, m);
    const hub = cylinder(g, 0.1, 0.1, 0.12, m.stripe, [x, 0.21, 0], true, 18); hub.rotation.x = Math.PI / 2;
  }
  box(g, 0.62, 0.07, 0.3, m.mintDeep, [0.02, 0.34, 0]);
  inked(sphere(g, [0.42, 0.26, 0.24], m.mint, [-0.38, 0.52, 0], [22, 14]), m);
  const shield = plate(g, 0.3, 0.72, 0.14, 0.1, m.mint, [0.38, 0.66, 0]); shield.rotation.y = Math.PI / 2; shield.rotation.z = 0;
  const lean = group(g, 'Front', [0.42, 0.3, 0]); lean.rotation.z = -0.28;
  rod(lean, [0, 0, 0], [0, 0.82, 0], 0.03, m.iron, 8);
  inked(sphere(lean, [0.26, 0.12, 0.13], m.mint, [0.06, -0.02, 0], [16, 10]), m);
  rod(lean, [0, 0.82, -0.3], [0, 0.82, 0.3], 0.02, m.iron, 8);
  for (const s of [-1, 1]) { cylinder(lean, 0.03, 0.03, 0.1, m.tyre, [0, 0.82, s * 0.3], false, 8).rotation.x = Math.PI / 2; rod(lean, [0, 0.82, s * 0.2], [-0.04, 1.0, s * 0.26], 0.008, m.iron, 4); inked(sphere(lean, [0.04, 0.03, 0.02], m.steel, [-0.04, 1.02, s * 0.27], [8, 6]), m); }
  inked(sphere(lean, [0.07, 0.07, 0.07], m.glow, [0.06, 0.74, 0], [12, 8]), m);
  plate(g, 0.55, 0.09, 0.27, 0.04, m.walnut, [-0.32, 0.8, 0]).rotation.x = -Math.PI / 2;
  // rack and the delivery box
  box(g, 0.44, 0.03, 0.36, m.iron, [-0.62, 0.85, 0]);
  const bx = group(g, 'Delivery box', [-0.62, 0.87, 0]);
  plate(bx, 0.46, 0.44, 0.46, 0.04, m.card, [0, 0.22, 0]);
  box(bx, 0.48, 0.05, 0.48, m.coral, [0, 0.45, 0]);
  atlas.attach(bx, 'boxside', 0.42, 0.21, [0, 0.22, 0.232]); atlas.attach(bx, 'boxside', 0.42, 0.21, [0, 0.22, -0.232], Math.PI);
  atlas.attach(bx, 'boxside', 0.42, 0.21, [0.232, 0.22, 0], Math.PI / 2);
  rod(g, [-0.15, 0.12, 0.12], [-0.05, 0.0, 0.2], 0.012, m.iron, 4); // kickstand
  return g;
}

// Pizza boxes on the takeaway ledge; the top one's lid lifts to show the pizza inside.
export function TakeawayBoxes(root, m, atlas) {
  const { X1, FLOOR } = G, y = FLOOR + 0.98;
  const g = group(root, 'Takeaway boxes', [X1 + 0.22, y, 0.75]);
  for (let i = 0; i < 2; i++) { const b = box(g, 0.42, 0.06, 0.42, m.card, [0, 0.03 + i * 0.062, 0]); b.rotation.y = (i - 0.5) * 0.08; }
  const top = group(g, 'Top box', [0, 0.124, 0]); top.rotation.y = 0.05;
  box(top, 0.42, 0.012, 0.42, m.card, [0, 0.006, 0]);
  for (const [w, d, x, z] of [[0.42, 0.012, 0, 0.204], [0.42, 0.012, 0, -0.204], [0.012, 0.42, 0.204, 0], [0.012, 0.42, -0.204, 0]]) box(top, w, 0.05, d, m.card, [x, 0.035, z]);
  Pizza(top, m, atlas, [0, 0.013, 0], 0.17);
  const hinge = group(top, 'Box lid hinge', [-0.21, 0.06, 0]);
  const lid = group(hinge, 'Open the pizza box'); lid.userData.action = 'pizzaBox';
  box(lid, 0.42, 0.012, 0.42, m.card, [0.21, 0.006, 0]);
  atlas.attach(lid, 'boxlid', 0.38, 0.38, [0.21, 0.0135, 0]).rotation.set(-Math.PI / 2, 0, -Math.PI / 2);
  return { group: g, hinge, lid };
}
