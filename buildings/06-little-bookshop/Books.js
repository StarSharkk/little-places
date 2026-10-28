import * as THREE from 'three';
import { group, box, plate, sphere, cylinder, rod, tube } from './primitives.js';

// Seeded randomness keeps every shelf the same on every load.
export function rng(seed) {
  return () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const q = v => Math.round(v * 200) / 200; // quantised sizes share geometry

// A book standing upright, spine to +z: cover-coloured body, a cream page line on top, a spine band.
export function standing(p, m, mats, w, h, d, ci, pos, lean = 0, outline = false) {
  const b = group(p, 'Book', pos); b.rotation.z = lean;
  box(b, w, h, d, mats[ci % mats.length], [0, h / 2, 0], outline);
  box(b, q(w * 0.7), 0.004, q(d - 0.02), m.paper, [0, h + 0.002, -0.006], false);
  if (ci % 3 !== 1) box(b, q(w + 0.004), 0.016, 0.004, ci % 2 ? m.cream : m.brass, [0, h * 0.78, d / 2 + 0.001], false);
  return b;
}
// A book lying flat: covers in colour, the page block showing as a cream stripe on three sides.
export function lying(p, m, mats, w, t, d, ci, pos, turn = 0, outline = true) {
  const b = group(p, 'Book', pos); b.rotation.y = turn;
  box(b, w, t, d, mats[ci % mats.length], [0, t / 2, 0], outline);
  box(b, q(w - 0.006), q(t * 0.7), q(d + 0.004), m.paper, [0.004, t / 2, 0], false);
  return b;
}
// A book face-out (cover to +z), as on a display ledge, with a cream title block and the page edge on top.
export function faceOut(p, m, mats, w, h, t, ci, pos, tilt = -0.12, outline = true) {
  const b = group(p, 'Display book', pos); b.rotation.x = tilt;
  box(b, w, h, t, mats[ci % mats.length], [0, h / 2, 0], outline);
  box(b, q(w - 0.012), 0.004, q(t * 0.7), m.paper, [0.003, h + 0.002, 0], false);
  box(b, q(w * 0.62), q(h * 0.16), 0.004, m.cream, [0, h * 0.7, t / 2 + 0.002], false);
  if (ci % 2) sphere(b, [w * 0.14, w * 0.14, 0.004], m.cream, [0, h * 0.36, t / 2 + 0.002], [10, 6]);
  return b;
}
export function stack(p, m, mats, pos, n, seed, turn = 0) {
  const r = rng(seed), g = group(p, 'Stack of books', pos); g.rotation.y = turn; let y = 0;
  for (let i = 0; i < n; i++) {
    const t = q(0.035 + r() * 0.03), w = q(0.2 + r() * 0.08), d = q(0.15 + r() * 0.06);
    lying(g, m, mats, w, t, d, Math.floor(r() * 12), [(r() - 0.5) * 0.02, y, (r() - 0.5) * 0.02], (r() - 0.5) * 0.25); y += t;
  }
  return g;
}

// One shelf of books along local x (x0..x1), spines facing +z, flush with the shelf front at z = 0.
// Varied heights, thicknesses and colours, the odd gap, a leaning book and a small flat stack.
export function row(p, m, mats, { x0, x1, y = 0, depth = 0.3, maxH = 0.32, seed = 1, stacks = true }) {
  const r = rng(seed); let x = x0 + 0.01, leaned = false;
  while (x < x1 - 0.05) {
    const roll = r();
    if (roll < 0.05 && x > x0 + 0.2) { x += 0.06 + r() * 0.08; continue; }
    if (stacks && roll < 0.12 && x < x1 - 0.3) {
      const n = 2 + Math.floor(r() * 3), w = q(0.2 + r() * 0.06); let yy = y;
      for (let i = 0; i < n; i++) { const t = q(0.03 + r() * 0.025), d = q(Math.min(depth - 0.03, 0.16 + r() * 0.06)); lying(p, m, mats, w, t, d, Math.floor(r() * 12), [x + w / 2, yy, -d / 2 - 0.01], 0, false); yy += t; }
      x += w + 0.02; continue;
    }
    const w = q(0.025 + r() * 0.04), h = q(Math.min(maxH, 0.17 + r() * 0.15)), d = q(Math.min(depth - 0.02, 0.14 + r() * 0.1));
    if (!leaned && roll > 0.93 && x < x1 - 0.3) {
      // a book leaning on its neighbour across a gap
      const lean = -0.32, dx = Math.sin(-lean) * h;
      standing(p, m, mats, w, h, d, Math.floor(r() * 12), [x + w / 2 + 0.02, y + Math.sin(-lean) * w / 2, -d / 2 - 0.01], lean);
      x += dx + w + 0.01; leaned = true; continue;
    }
    standing(p, m, mats, w, h, d, Math.floor(r() * 12), [x + w / 2, y, -d / 2 - 0.01]); x += w + 0.002;
  }
}

// Bookcase: carcass in shelf wood with a lighter back, shelves filled row by row. Front faces local +z.
export function Bookcase(p, m, mats, { pos, turn = 0, w = 1.2, h = 2.2, d = 0.34, levels = 5, bays = 1, seed = 1, plinth = 0.1, top = true, fill = true, name = 'Bookcase' }) {
  const g = group(p, name, pos); g.rotation.y = turn;
  const st = 0.035, inner = h - plinth - st, gap = inner / levels;
  box(g, w, h, 0.02, m.shelfLight, [0, h / 2, -d / 2 + 0.01]);
  for (const s of [-1, 1]) box(g, st, h, d, m.shelf, [s * (w / 2 - st / 2), h / 2, 0]);
  box(g, w, plinth, d - 0.02, m.shelf, [0, plinth / 2, 0.01]);
  if (top) box(g, w + 0.06, 0.04, d + 0.04, m.shelf, [0, h + 0.02, 0.01]);
  const bw = (w - 2 * st) / bays;
  for (let b = 1; b < bays; b++) box(g, 0.025, inner, d - 0.02, m.shelf, [-w / 2 + st + b * bw, plinth + inner / 2, 0]);
  for (let i = 0; i < levels; i++) {
    const y = plinth + i * gap;
    box(g, w - 2 * st, st, d - 0.02, m.shelf, [0, y + st / 2, 0.0], i > 0);
    if (!fill) continue;
    for (let b = 0; b < bays; b++) {
      const bx0 = -w / 2 + st + b * bw + (b ? 0.0125 : 0), bx1 = bx0 + bw - (b < bays - 1 ? 0.0125 : 0) - (b ? 0.0125 : 0);
      const sub = group(g, 'Shelf', [0, 0, d / 2 - 0.005]);
      row(sub, m, mats, { x0: bx0, x1: bx1, y: y + st, depth: d - 0.03, maxH: Math.min(0.34, gap - st - 0.03), seed: seed * 97 + i * 13 + b * 7 });
    }
  }
  return g;
}

// Small potted plant (bush) and a trailing pothos; used inside, on the deck and on the roof
export function plant(p, m, pos, { r = 0.12, h = 0.16, pot = m.terracotta, kind = 'bush', s = 1 } = {}) {
  const g = group(p, 'Potted plant', pos); g.scale.setScalar(s);
  cylinder(g, r, r * 0.75, h, pot, [0, h / 2, 0], true, 18);
  cylinder(g, r * 1.08, r * 1.08, h * 0.18, pot, [0, h * 0.91, 0], true, 18);
  cylinder(g, r * 0.95, r * 0.95, 0.01, m.soil, [0, h + 0.004, 0], false, 14);
  if (kind === 'bush') for (let i = 0; i < 7; i++) { const a = i * 2.4; sphere(g, [r * 0.8, r * 0.85, r * 0.8], i % 2 ? m.leaf : m.leafLight, [Math.cos(a) * r * 0.5, h + r * 0.7 + (i % 3) * r * 0.3, Math.sin(a) * r * 0.5], [10, 7]); }
  if (kind === 'trailing') {
    for (let i = 0; i < 5; i++) sphere(g, [r * 0.6, r * 0.45, r * 0.6], i % 2 ? m.leaf : m.leafLight, [Math.cos(i * 1.3) * r * 0.5, h + r * 0.3, Math.sin(i * 1.3) * r * 0.5], [8, 6]);
    for (let i = 0; i < 3; i++) { const a = 0.6 + i * 1.9, x = Math.cos(a) * r, z = Math.sin(a) * r; vine(g, m, [x, h, z], [x * 1.6, h - 0.35 - i * 0.12, z * 1.6], 4 + i, i); }
  }
  if (kind === 'tall') {
    for (let i = 0; i < 9; i++) { const a = i * 2.3, y = h + 0.15 + i * 0.07; sphere(g, [r * 0.75, r * 0.5, r * 0.75], i % 2 ? m.leaf : m.leafDeep, [Math.cos(a) * r * 0.55, y, Math.sin(a) * r * 0.55], [10, 7]); }
    rod(g, [0, h, 0], [0, h + 0.7, 0], 0.015, m.walnut, 5);
  }
  return g;
}
// A trailing vine: a thin stem with leaf pairs along it
export function vine(p, m, a, b, leaves = 5, seed = 0, sag = 0.06, size = 1) {
  const mid = [(a[0] + b[0]) / 2 + sag * Math.cos(seed), (a[1] + b[1]) / 2, (a[2] + b[2]) / 2 + sag * Math.sin(seed)];
  tube(p, [a, mid, b], 0.006, m.leafDeep);
  const c = new THREE.CatmullRomCurve3([a, mid, b].map(v => new THREE.Vector3(...v)));
  for (let i = 1; i <= leaves; i++) { const v = c.getPoint(i / (leaves + 0.3)); sphere(p, [0.035 * size, 0.024 * size, 0.035 * size], (i + seed) % 2 ? m.leaf : m.leafLight, [v.x + (i % 2 ? 0.02 : -0.02) * size, v.y, v.z + (i % 3 - 1) * 0.015 * size], [7, 5]); }
}
