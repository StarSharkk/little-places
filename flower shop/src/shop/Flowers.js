import * as THREE from 'three';
import { group, box, cylinder, rod, sphere, cone, ring, tube, mesh, cached } from './primitives.js';

// Low-poly flowers: flat-coloured, no outline (like the plants in the other buildings) so the colour does the work.
const S = [9, 6]; // sphere segments for small blooms

const V = (...a) => new THREE.Vector3(...a);
function leafAt(p, m, from, dir, len, mat) {
  const l = sphere(p, [len * 0.16, len * 0.5, len * 0.05], mat, [from[0] + dir[0] * len * 0.5, from[1] + dir[1] * len * 0.5, from[2] + dir[2] * len * 0.5], S);
  l.quaternion.setFromUnitVectors(V(0, 1, 0), V(...dir).normalize());
  return l;
}

export const bloomKinds = {
  tulip(p, m, top, c, s = 1) {
    sphere(p, [0.055 * s, 0.078 * s, 0.055 * s], m[c], top, S);
    return cone(p, 0.045 * s, 0.07 * s, m[c], [top[0], top[1] + 0.07 * s, top[2]], false, 6);
  },
  daisy(p, m, top, c, s = 1) {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      sphere(p, [0.026 * s, 0.012 * s, 0.026 * s], m[c === 'yellow' ? 'yellow' : 'white'], [top[0] + Math.cos(a) * 0.05 * s, top[1], top[2] + Math.sin(a) * 0.05 * s], [6, 4]);
    }
    sphere(p, [0.036 * s, 0.026 * s, 0.036 * s], c === 'yellow' ? m.coral : m.yellow, [top[0], top[1] + 0.008, top[2]], S);
  },
  rose(p, m, top, c, s = 1) {
    sphere(p, [0.06 * s, 0.052 * s, 0.06 * s], m[c], top, S);
    sphere(p, [0.04 * s, 0.04 * s, 0.04 * s], m[c === 'coral' ? 'rose' : 'coral'], [top[0], top[1] + 0.034 * s, top[2]], [8, 5]);
    sphere(p, [0.075 * s, 0.014 * s, 0.075 * s], m.leaf, [top[0], top[1] - 0.045 * s, top[2]], [8, 4]);
  },
  lavender(p, m, top, c, s = 1) {
    for (let i = 0; i < 5; i++) sphere(p, [0.026 * s, 0.04 * s, 0.026 * s], m[c], [top[0], top[1] - i * 0.055 * s + 0.04, top[2]], [6, 5]);
  },
  filler(p, m, top, c, s = 1) {
    for (let i = 0; i < 4; i++) { const a = i * 1.9; sphere(p, [0.03 * s, 0.03 * s, 0.03 * s], m[c], [top[0] + Math.cos(a) * 0.04 * s, top[1] + (i % 2) * 0.03 * s, top[2] + Math.sin(a) * 0.04 * s], [6, 4]); }
  },
  sunflower(p, m, top, c, s = 1) {
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; sphere(p, [0.03 * s, 0.012 * s, 0.075 * s], m.yellow, [top[0] + Math.cos(a) * 0.075 * s, top[1], top[2] + Math.sin(a) * 0.075 * s], [6, 4]).rotation.y = -a + Math.PI / 2; }
    sphere(p, [0.07 * s, 0.03 * s, 0.07 * s], m.woodDark, [top[0], top[1] + 0.012, top[2]], S);
  },
};

// A stem with a bloom at its top. `lean` is the horizontal offset of the head from the base.
export function stem(p, m, base, h, lean, kind, colour, s = 1, withLeaf = true) {
  const top = [base[0] + lean[0], base[1] + h, base[2] + lean[1]];
  rod(p, base, top, 0.011 * s + 0.002, m.leaf, 5);
  if (withLeaf && h > 0.3) leafAt(p, m, [base[0] + lean[0] * 0.3, base[1] + h * 0.3, base[2] + lean[1] * 0.3], [lean[0] * 2 + 0.35, 1, lean[1] * 2], 0.2 * s + 0.06, m.leafLight);
  bloomKinds[kind](p, m, top, colour, s);
}

// golden-angle spread: taller in the middle, leaning outward
export function bunch(p, m, centre, radius, heights, mix, s = 1) {
  const n = mix.length;
  for (let i = 0; i < n; i++) {
    const r = Math.sqrt((i + 0.5) / n) * radius, a = i * 2.399963;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    const h = heights[0] + (heights[1] - heights[0]) * (1 - Math.sqrt((i + 0.5) / n)) * 0.7 + ((i * 37) % 7) * 0.012;
    const [kind, colour] = mix[i];
    stem(p, m, [centre[0] + x * 0.35, centre[1], centre[2] + z * 0.35], h, [x * 0.95, z * 0.95], kind, colour, s, i % 3 === 0);
  }
}

export const MIXES = {
  spring: [['tulip', 'pink'], ['tulip', 'coral'], ['daisy', 'white'], ['tulip', 'yellow'], ['filler', 'white'], ['tulip', 'pink'], ['daisy', 'white'], ['tulip', 'coral'], ['filler', 'white'], ['tulip', 'yellow'], ['daisy', 'white'], ['tulip', 'pink']],
  rose: [['rose', 'rose'], ['rose', 'coral'], ['filler', 'white'], ['rose', 'pink'], ['rose', 'rose'], ['filler', 'white'], ['rose', 'pink'], ['rose', 'coral']],
  field: [['lavender', 'lilac'], ['daisy', 'white'], ['lavender', 'lilac'], ['daisy', 'yellow'], ['lavender', 'blue'], ['filler', 'white'], ['lavender', 'lilac'], ['daisy', 'white']],
  sun: [['sunflower', 'yellow'], ['sunflower', 'yellow'], ['daisy', 'yellow'], ['filler', 'white'], ['sunflower', 'yellow'], ['daisy', 'yellow']],
  tulips: [['tulip', 'coral'], ['tulip', 'pink'], ['tulip', 'coral'], ['tulip', 'white'], ['tulip', 'pink'], ['tulip', 'yellow'], ['tulip', 'pink'], ['tulip', 'coral'], ['tulip', 'white']],
  pastel: [['tulip', 'blue'], ['daisy', 'white'], ['tulip', 'lilac'], ['filler', 'white'], ['tulip', 'pink'], ['daisy', 'white'], ['tulip', 'blue'], ['filler', 'white']],
};

// ---- containers --------------------------------------------------------------------------------
export function bucket(p, m, pos, mixName = 'spring', height = [0.55, 0.82], radius = 0.17) {
  const g = group(p, 'Flower bucket', pos);
  const body = cylinder(g, 0.21, 0.165, 0.4, m.steel, [0, 0.2, 0], true, 20);
  ring(g, 0.215, 0.014, m.steelDark, [0, 0.4, 0]).rotation.x = Math.PI / 2;
  ring(g, 0.19, 0.012, m.steelDark, [0, 0.12, 0]).rotation.x = Math.PI / 2;
  cylinder(g, 0.19, 0.19, 0.01, m.kraft, [0, 0.395, 0], false, 20);
  bunch(g, m, [0, 0.38, 0], radius, height, MIXES[mixName]);
  return g;
}

export function pot(p, m, pos, { r = 0.2, h = 0.3, colour = 'terracotta', plant = 'bush', mix = 'spring' } = {}) {
  const g = group(p, 'Flower pot', pos);
  cylinder(g, r, r * 0.72, h, m[colour], [0, h / 2, 0], true, 20);
  cylinder(g, r * 1.1, r * 1.1, h * 0.2, m[colour], [0, h * 0.9, 0], true, 20);
  cylinder(g, r * 0.95, r * 0.95, 0.012, m.soil, [0, h + 0.005, 0], false, 16);
  if (plant === 'bush') {
    for (let i = 0; i < 7; i++) { const a = i * 2.4; sphere(g, [0.13, 0.15, 0.13], i % 2 ? m.leaf : m.leafLight, [Math.cos(a) * r * 0.55, h + 0.14 + (i % 3) * 0.05, Math.sin(a) * r * 0.55], [10, 7]); }
  } else if (plant === 'flowers') {
    bunch(g, m, [0, h, 0], r * 0.8, [0.2, 0.36], MIXES[mix], 0.9);
    for (let i = 0; i < 5; i++) { const a = i * 1.3; sphere(g, [0.09, 0.07, 0.09], m.leaf, [Math.cos(a) * r * 0.7, h + 0.04, Math.sin(a) * r * 0.7], [8, 6]); }
  } else if (plant === 'fern') {
    for (let i = 0; i < 9; i++) { const a = i * 2.4; const dir = [Math.cos(a) * 0.9, 0.7, Math.sin(a) * 0.9]; leafAt(g, m, [0, h, 0], dir, 0.42, i % 2 ? m.leaf : m.leafLight); }
  } else if (plant === 'sprig') {
    for (let i = 0; i < 6; i++) { const a = i * 1.05; stem(g, m, [0, h, 0], 0.4 + (i % 2) * 0.1, [Math.cos(a) * 0.12, Math.sin(a) * 0.12], 'daisy', 'white', 0.8, false); }
  }
  return g;
}

export function planterBox(p, m, pos, width, mixName = 'spring', trail = true) {
  const g = group(p, 'Planter box', pos);
  box(g, width, 0.22, 0.26, m.accent, [0, 0.11, 0]);
  box(g, width + 0.04, 0.04, 0.3, m.cream, [0, 0.23, 0]);
  const n = Math.max(3, Math.round(width / 0.2));
  for (let i = 0; i < n; i++) {
    const x = -width / 2 + 0.12 + (i / (n - 1)) * (width - 0.24);
    sphere(g, [0.1, 0.09, 0.1], i % 2 ? m.leaf : m.leafLight, [x, 0.3, (i % 2 - 0.5) * 0.06], [9, 6]);
    const mix = MIXES[mixName][i % MIXES[mixName].length];
    stem(g, m, [x, 0.27, (i % 2 - 0.5) * 0.06], 0.14 + (i % 3) * 0.05, [0, 0.02], mix[0], mix[1], 0.8, false);
    if (trail && i % 2 === 0) { rod(g, [x, 0.25, 0.14], [x + 0.01, 0.02, 0.19], 0.012, m.leaf, 5); sphere(g, [0.045, 0.045, 0.045], i % 4 ? m.pink : m.white, [x + 0.01, 0.05, 0.2], [6, 5]); }
  }
  return g;
}

// A wrapped bouquet: kraft cone, pink ribbon, flowers fanned out of the top.
export function bouquet(p, m, pos, mixName = 'spring', s = 1) {
  const g = group(p, 'Wrapped bouquet', pos);
  // a flared kraft sleeve with a small flat foot, so it can stand on a counter
  const paper = mesh(g, cached('bq-sleeve', () => new THREE.CylinderGeometry(0.2, 0.07, 0.46, 18)), m.kraft, [0, 0.23 * s, 0], true);
  paper.scale.setScalar(s);
  const inner = mesh(g, cached('bq-sleeve2', () => new THREE.CylinderGeometry(0.205, 0.15, 0.1, 18)), m.cream, [0, 0.42 * s, 0], false);
  inner.scale.setScalar(s);
  ring(g, 0.13 * s, 0.014 * s, m.accent, [0, 0.2 * s, 0]).rotation.x = Math.PI / 2;
  bunch(g, m, [0, 0.4 * s, 0], 0.16 * s, [0.12 * s, 0.26 * s], MIXES[mixName], 0.9 * s);
  // little bow
  for (const sx of [-1, 1]) sphere(g, [0.045 * s, 0.026 * s, 0.02 * s], m.accent, [sx * 0.045 * s, 0.205 * s, 0.13 * s], [8, 5]).rotation.z = sx * 0.4;
  sphere(g, [0.02 * s, 0.02 * s, 0.02 * s], m.accent, [0, 0.205 * s, 0.135 * s], [6, 5]);
  return g;
}

export function wateringCan(p, m, pos, rot = 0) {
  const g = group(p, 'Watering can', pos); g.rotation.y = rot;
  cylinder(g, 0.13, 0.15, 0.26, m.steel, [0, 0.13, 0], true, 18);
  ring(g, 0.15, 0.01, m.steelDark, [0, 0.01, 0]).rotation.x = Math.PI / 2;
  ring(g, 0.13, 0.01, m.steelDark, [0, 0.26, 0]).rotation.x = Math.PI / 2;
  const spout = rod(g, [0.1, 0.07, 0], [0.34, 0.31, 0], 0.025, m.steel, 8);
  cylinder(g, 0.055, 0.04, 0.04, m.steelDark, [0.35, 0.325, 0], false, 10).rotation.z = -0.8;
  tube(g, [[-0.1, 0.25, 0], [-0.24, 0.2, 0], [-0.22, 0.09, 0], [-0.13, 0.05, 0]], 0.012, m.steelDark);
  tube(g, [[-0.1, 0.27, 0], [0, 0.4, 0], [0.1, 0.27, 0]], 0.011, m.steelDark);
  return g;
}
