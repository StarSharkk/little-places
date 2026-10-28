import * as THREE from 'three';
import { group, box, plate, rod, tube, cylinder, sphere, cone, ring, mesh, cached } from './primitives.js';
import { hull } from './outline.js';
// Street props shared by the buildings (first made for 08 Bubble Laundry). Each takes the building's material set `m`
// and needs these keys: plant → terracotta, soil, leaf, leafLight, leafDeep, blossom, shirtYellow, hull;
// Bicycle → tyre, chrome, steelDark, bike, seat, woodLight, wood, shirtPink, shirtBlue, hull; Bench → wood, iron;
// CherryTree → cream, soil, trunk, blossom, blossomDeep, hull; StreetLamp → iron, glow, hull.
const inked = (o, m) => (hull(o, m.hull), o);

export function plant(p, m, pos, { r = 0.14, h = 0.2, pot = m.terracotta, kind = 'bush' } = {}) {
  const g = group(p, 'Potted plant', pos);
  inked(cylinder(g, r, r * 0.75, h, pot, [0, h / 2, 0], true, 24), m);
  inked(cylinder(g, r * 1.08, r * 1.08, h * 0.18, pot, [0, h * 0.91, 0], true, 24), m);
  cylinder(g, r * 0.95, r * 0.95, 0.01, m.soil, [0, h + 0.004, 0], false, 16);
  if (kind !== 'leafy') {
    for (let i = 0; i < 5; i++) { const a = i * 2.4; inked(sphere(g, [r * 0.9, r * 0.8, r * 0.9], i % 2 ? m.leaf : m.leafLight, [Math.cos(a) * r * 0.5, h + r * 0.6 + (i % 3) * r * 0.32, Math.sin(a) * r * 0.5], [9, 6]), m); }
    if (kind === 'flowers') for (let i = 0; i < 7; i++) { const a = i * 1.7; sphere(g, [r * 0.22, r * 0.2, r * 0.22], i % 2 ? m.blossom : m.shirtYellow, [Math.cos(a) * r * 0.75, h + r * 0.9 + (i % 3) * r * 0.3, Math.sin(a) * r * 0.75], [8, 6]); }
  } else {
    for (let i = 0; i < 7; i++) {
      const a = i * 2.39, lift = 0.5 + (i % 3) * 0.28, len = r * (2.2 + (i % 2) * 0.6), tip = [Math.cos(a) * len * 0.75, h + len * lift, Math.sin(a) * len * 0.75];
      rod(g, [0, h, 0], tip, 0.01, m.leafDeep, 4);
      const leaf = sphere(g, [r * 0.45, r * 0.12, r * 0.95], i % 2 ? m.leaf : m.leafLight, tip, [8, 5]); leaf.rotation.y = -a + Math.PI / 2; leaf.rotation.x = -0.5 + (i % 3) * 0.2; inked(leaf, m);
    }
  }
  return g;
}

export function Bicycle(p, m, pos, turn, cargo = 'clothes') {   // cargo: 'clothes' (laundry) or 'letters' (post)
  const g = group(p, 'Bicycle', pos); g.rotation.y = turn;                           // local +x is the front
  const R = 0.3, hubY = 0.33, rear = [-0.52, hubY, 0], frontHub = [0.52, hubY, 0], bb = [-0.04, 0.3, 0], seat = [-0.2, 0.82, 0], head = [0.36, 0.86, 0];
  for (const c of [rear, frontHub]) {
    inked(ring(g, R, 0.026, m.tyre, c, 32, 6), m); ring(g, R - 0.03, 0.008, m.chrome, c, 28, 4);
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; rod(g, c, [c[0] + Math.cos(a) * (R - 0.03), c[1] + Math.sin(a) * (R - 0.03), 0], 0.004, m.chrome, 3); }
    const hb = cylinder(g, 0.03, 0.03, 0.08, m.steelDark, c, false, 10); hb.rotation.x = Math.PI / 2;
  }
  const tubeTo = (a, b, r = 0.022) => rod(g, a, b, r, m.bike, 8);
  tubeTo(bb, head); tubeTo(bb, [-0.18, 0.74, 0]); tubeTo(bb, [rear[0], rear[1], 0.04]); tubeTo(bb, [rear[0], rear[1], -0.04]);
  tubeTo([-0.18, 0.74, 0.03], [rear[0], rear[1], 0.04], 0.016); tubeTo([-0.18, 0.74, -0.03], [rear[0], rear[1], -0.04], 0.016);
  tubeTo(head, [frontHub[0], frontHub[1], 0.04], 0.018); tubeTo(head, [frontHub[0], frontHub[1], -0.04], 0.018);
  rod(g, head, [0.32, 1.02, 0], 0.02, m.bike, 8);
  tube(g, [[0.28, 1.05, -0.26], [0.34, 1.03, -0.1], [0.34, 1.03, 0.1], [0.28, 1.05, 0.26]], 0.016, m.chrome);
  for (const z of [-0.26, 0.26]) { const gr = cylinder(g, 0.022, 0.022, 0.08, m.seat, [0.28, 1.05, z], false, 8); gr.rotation.x = Math.PI / 2; }
  rod(g, [-0.18, 0.74, 0], seat, 0.016, m.chrome, 8); plate(g, 0.24, 0.07, 0.12, 0.03, m.seat, [-0.2, 0.86, 0]);
  // mudguards, chain ring, the wicker basket on the front, a kickstand
  for (const [c, a0] of [[rear, 0.2], [frontHub, 0.6]]) { const pts = []; for (let i = 0; i <= 8; i++) { const a = a0 + i * 0.28; pts.push([c[0] - Math.cos(a) * (R + 0.04) * (c === rear ? 1 : -1), c[1] + Math.sin(a) * (R + 0.04), 0]); } tube(g, pts, 0.014, m.bike); }
  inked(ring(g, 0.08, 0.012, m.steelDark, [bb[0], bb[1], 0.05]), m);
  const bk = group(g, 'Basket', [0.5, 0.98, 0]);
  box(bk, 0.32, 0.02, 0.36, m.woodLight, [0, 0, 0]); for (const s of [-1, 1]) { box(bk, 0.32, 0.2, 0.02, m.woodLight, [0, 0.1, s * 0.17]); box(bk, 0.02, 0.2, 0.36, m.woodLight, [s * 0.15, 0.1, 0]); }
  for (let i = 0; i < 3; i++) box(bk, 0.325, 0.012, 0.365, m.wood, [0, 0.05 + i * 0.06, 0], false);
  if (cargo === 'letters') for (let i = 0; i < 5; i++) { const e = box(bk, 0.012, 0.16, 0.24, i % 2 ? m.paper : m.label ?? m.paper, [-0.08 + i * 0.04, 0.17, 0], false); e.rotation.x = (i - 2) * 0.08; }
  else { sphere(bk, [0.1, 0.06, 0.1], m.shirtPink, [-0.04, 0.18, 0.02], [10, 6]); sphere(bk, [0.08, 0.05, 0.08], m.shirtBlue, [0.06, 0.2, -0.05], [10, 6]); }
  rod(g, [-0.1, 0.3, 0.06], [-0.22, 0.0, 0.2], 0.012, m.steelDark, 6);
  return g;
}

export function Bench(p, m, pos, turn) {
  const g = group(p, 'Street bench', pos); g.rotation.y = turn;
  for (let i = 0; i < 3; i++) box(g, 1.5, 0.04, 0.12, m.wood, [0, 0.45, -0.14 + i * 0.14]);
  for (let i = 0; i < 2; i++) box(g, 1.5, 0.09, 0.035, m.wood, [0, 0.66 + i * 0.13, -0.24]);
  for (const x of [-0.6, 0.6]) {
    const leg = new THREE.Shape(); leg.moveTo(-0.2, 0); leg.lineTo(-0.16, 0); leg.lineTo(-0.1, 0.43); leg.lineTo(0.16, 0.43); leg.lineTo(0.2, 0); leg.lineTo(0.24, 0); leg.lineTo(0.18, 0.47); leg.lineTo(-0.2, 0.47); leg.lineTo(-0.24, 0.85); leg.lineTo(-0.28, 0.85); leg.closePath();
    const l = mesh(g, cached('bench-leg', () => { const e = new THREE.ExtrudeGeometry(leg, { depth: 0.04, bevelEnabled: false }); e.translate(0, 0, -0.02); return e; }), m.iron, [x, 0, 0.02]); l.rotation.y = Math.PI / 2;
  }
  return g;
}

export function CherryTree(p, m, pos) {
  const g = group(p, 'Cherry tree', pos);
  inked(cylinder(g, 0.42, 0.36, 0.42, m.cream, [0, 0.21, 0], true, 28), m); cylinder(g, 0.38, 0.38, 0.02, m.soil, [0, 0.42, 0], false, 20);
  const trunk = [[0, 0.4, 0], [0.04, 1.0, 0.02], [-0.06, 1.55, -0.02], [0.04, 2.0, 0.02]];
  inked(tube(g, trunk, 0.07, m.trunk), m);
  for (const b of [[[-0.03, 1.3, 0], [-0.4, 1.65, 0.1], [-0.6, 1.9, 0.12]], [[0.0, 1.75, 0], [0.38, 2.0, -0.08], [0.6, 2.1, -0.1]], [[0.02, 1.1, 0], [0.3, 1.35, 0.2], [0.45, 1.5, 0.28]]]) inked(tube(g, b, 0.035, m.trunk), m);
  const C = [[0.05, 2.3, 0, 0.55], [-0.55, 2.0, 0.12, 0.42], [0.62, 2.12, -0.08, 0.44], [-0.25, 2.55, -0.15, 0.38], [0.38, 2.55, 0.2, 0.36], [0.4, 1.6, 0.3, 0.3], [-0.15, 2.0, 0.38, 0.32]];
  for (const [x, y, z, r] of C) inked(sphere(g, [r, r * 0.86, r], m.blossom, [x, y, z], [11, 8]), m);
  for (const [x, y, z, r] of C) sphere(g, [0.05, 0.05, 0.05], m.blossomDeep, [x + Math.cos(2 + x) * r * 0.7, y + 0.1, z + r * 0.75], [6, 4]);
  return g;
}

export function StreetLamp(p, m, pos) {
  const lamp = group(p, 'Street lamp', pos);
  inked(cylinder(lamp, 0.13, 0.16, 0.22, m.iron, [0, 0.11, 0], true, 16), m);
  rod(lamp, [0, 0.2, 0], [0, 2.75, 0], 0.045, m.iron, 12);
  const head = group(lamp, 'Lantern', [0, 2.82, 0]);
  inked(cylinder(head, 0.12, 0.08, 0.06, m.iron, [0, 0, 0], true, 6), m);
  box(head, 0.15, 0.26, 0.15, m.glow, [0, 0.16, 0]);
  for (const [x, z] of [[-0.08, -0.08], [0.08, -0.08], [-0.08, 0.08], [0.08, 0.08]]) box(head, 0.025, 0.28, 0.025, m.iron, [x, 0.16, z]);
  inked(cone(head, 0.16, 0.16, m.iron, [0, 0.37, 0], true, 6), m); sphere(head, [0.03, 0.03, 0.03], m.iron, [0, 0.47, 0], [8, 6]);
  return lamp;
}

