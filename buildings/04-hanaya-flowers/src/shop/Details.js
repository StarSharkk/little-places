import * as THREE from 'three';
import { group, box, plate, rod, tube, sphere, cone, cylinder, ring, mesh, cached, rounded } from './primitives.js';
import { bucket, pot, bunch, stem, bouquet, wateringCan, MIXES, planterBox } from './Flowers.js';
import { FLOOR } from './Architecture.js';

// the street stands on the paved forecourt, the interior on the raised shop floor
export const GROUND = 0.155;

// ---- inside the shop ----------------------------------------------------------------------------------
export function Interior(root, m, atlas) {
  const g = group(root, 'Flower shop interior');
  // checkerboard floor in two soft tones
  for (let x = -2.5; x < 2.6; x += 0.5) for (let z = -1.35; z < 1.5; z += 0.5) box(g, 0.49, 0.015, 0.49, (Math.round(x * 2 + z * 2) % 2) ? m.paper : m.tile, [x, 0.275, z], false);

  // back shelving with pots, jars and trailing plants
  for (const y of [0.85, 1.55, 2.25]) box(g, 3.3, 0.07, 0.5, m.woodLight, [0.65, y, -1.42]);
  for (const x of [-1.0, 2.3]) box(g, 0.07, 2.2, 0.48, m.wood, [x, 1.38, -1.42]);
  const shelf = [
    [0.85, [['flowers', 'terracotta', 'spring'], ['bush', 'cream'], ['flowers', 'cream', 'pastel'], ['fern', 'terracotta'], ['flowers', 'terracotta', 'rose']]],
    [1.55, [['bush', 'cream'], ['flowers', 'terracotta', 'tulips'], ['sprig', 'cream'], ['flowers', 'cream', 'field']]],
    [2.25, [['fern', 'terracotta'], ['flowers', 'cream', 'sun'], ['bush', 'terracotta']]],
  ];
  for (const [y, items] of shelf) items.forEach(([plant, colour, mix], i) => pot(g, m, [-0.65 + (i / Math.max(1, items.length - 1)) * 2.6 * (items.length > 3 ? 1 : 0.8) + (items.length > 3 ? 0 : 0.2), y + 0.035, -1.42], { r: 0.11, h: 0.15, colour, plant, mix: mix || 'spring' }));
  for (let i = 0; i < 3; i++) { const x = -0.6 + i * 1.0; rod(g, [x, 1.55, -1.18], [x + 0.03, 1.15, -1.14], 0.01, m.leaf, 5); sphere(g, [0.04, 0.04, 0.04], m.pink, [x + 0.03, 1.13, -1.13], [6, 5]); }

  // hanging dried bunches on a rail
  rod(g, [-0.5, 2.78, -1.6], [2.4, 2.78, -1.6], 0.014, m.woodDark, 6);
  for (let i = 0; i < 6; i++) {
    const x = -0.3 + i * 0.5;
    rod(g, [x, 2.78, -1.6], [x, 2.62, -1.6], 0.008, m.ink, 4);
    const mix = [['daisy', 'white'], ['lavender', 'lilac'], ['filler', 'white'], ['rose', 'coral'], ['lavender', 'blue'], ['daisy', 'yellow']][i];
    stem(g, m, [x, 2.62, -1.6], -0.38, [0.02, 0.02], mix[0], mix[1], 0.9, false);
  }

  // florist's workbench (back-left): paper roll, ribbon spools, scissors, till
  box(g, 1.9, 0.9, 0.72, m.woodLight, [-1.88, FLOOR + 0.45, -1.15]);
  box(g, 2.0, 0.06, 0.8, m.cream, [-1.88, FLOOR + 0.93, -1.15]);
  for (const x of [-2.5, -1.88, -1.26]) plate(g, 0.52, 0.5, 0.02, 0.04, m.wood, [x, FLOOR + 0.48, -0.78]);
  const roll = cylinder(g, 0.085, 0.085, 0.55, m.kraft, [-2.3, FLOOR + 1.06, -1.28], true, 18); roll.rotation.z = Math.PI / 2;
  const roll2 = cylinder(g, 0.07, 0.07, 0.5, m.pink, [-2.3, FLOOR + 1.06, -1.1], true, 18); roll2.rotation.z = Math.PI / 2;
  [m.accent, m.yellow, m.lilac].forEach((mat, i) => { const s = cylinder(g, 0.05, 0.05, 0.07, mat, [-1.55 + i * 0.13, FLOOR + 0.99, -1.38], true, 14); });
  rod(g, [-1.4, FLOOR + 0.97, -1.0], [-1.1, FLOOR + 0.97, -0.92], 0.009, m.steel, 4); rod(g, [-1.4, FLOOR + 0.97, -0.92], [-1.1, FLOOR + 0.97, -1.0], 0.009, m.steel, 4);
  const till = plate(g, 0.36, 0.22, 0.3, 0.04, m.steelDark, [-1.0, FLOOR + 1.1, -1.35]); till.rotation.x = -0.15;
  // vase of tulips on the bench
  cylinder(g, 0.07, 0.055, 0.17, m.blue, [-0.75, FLOOR + 1.04, -1.0], true, 14);
  bunch(g, m, [-0.75, FLOOR + 1.12, -1.0], 0.07, [0.22, 0.34], MIXES.tulips.slice(0, 5), 0.8);

  // wrapping table with stools, centre of the room
  cylinder(g, 0.5, 0.5, 0.06, m.cream, [0.0, FLOOR + 0.78, -0.2], true, 28);
  rod(g, [0, FLOOR, -0.2], [0, FLOOR + 0.75, -0.2], 0.05, m.wood, 10);
  cylinder(g, 0.28, 0.3, 0.04, m.wood, [0, FLOOR + 0.02, -0.2], true, 20);
  cylinder(g, 0.09, 0.07, 0.22, m.yellow, [-0.12, FLOOR + 0.92, -0.25], true, 14);
  bunch(g, m, [-0.12, FLOOR + 1.0, -0.25], 0.1, [0.25, 0.4], MIXES.field.slice(0, 6), 0.9);
  for (const [sx, sz] of [[-0.72, -0.05], [0.7, -0.35]]) { cylinder(g, 0.18, 0.18, 0.06, m.woodLight, [sx, FLOOR + 0.5, sz], true, 18); for (const a of [0, 2.094, 4.188]) rod(g, [sx + Math.sin(a) * 0.12, FLOOR, sz + Math.cos(a) * 0.12], [sx + Math.sin(a) * 0.1, FLOOR + 0.48, sz + Math.cos(a) * 0.1], 0.02, m.wood, 6); }

  // tiered display stand behind the shop window, with pots on every step
  const stand = group(g, 'Window display stand', [0.7, 0, 0]);
  const tiers = [[0.62, 1.4, 0.34], [0.98, 1.08, 0.34], [1.34, 0.76, 0.34]];
  for (const [y, z, d] of tiers) {
    box(stand, 3.0, 0.05, d, m.woodLight, [0, FLOOR + y - 0.2, z]);
    for (const x of [-1.42, 1.42]) box(stand, 0.06, y - 0.2, d - 0.04, m.wood, [x, FLOOR + (y - 0.2) / 2, z]);
  }
  const plan = [
    [0, ['flowers', 'terracotta', 'tulips'], ['flowers', 'cream', 'pastel'], ['bush', 'terracotta'], ['flowers', 'terracotta', 'rose'], ['flowers', 'cream', 'spring']],
    [1, ['flowers', 'cream', 'field'], ['flowers', 'terracotta', 'spring'], ['sprig', 'cream'], ['flowers', 'terracotta', 'pastel']],
    [2, ['fern', 'terracotta'], ['flowers', 'cream', 'sun'], ['flowers', 'terracotta', 'tulips']],
  ];
  for (const [ti, ...items] of plan) {
    const [y, z] = tiers[ti];
    items.forEach(([plant, colour, mix], i) => pot(stand, m, [-1.2 + (i / Math.max(1, items.length - 1)) * 2.4 * (items.length > 3 ? 1 : 0.85), FLOOR + y - 0.17, z], { r: 0.13, h: 0.17, colour, plant, mix: mix || 'spring' }));
  }
  // price tags on the stand edge
  atlas.attach(stand, 'prices', 2.2, 0.15, [0, FLOOR + 0.6 - 0.2, 1.58]);

  // macramé-style hanging planters
  for (const [x, z, y] of [[-0.95, 0.35, 2.55], [1.6, -0.1, 2.35], [-2.25, 0.5, 2.5]]) {
    rod(g, [x, 3.1, z], [x, y + 0.2, z], 0.008, m.ink, 4);
    cylinder(g, 0.15, 0.1, 0.14, m.terracotta, [x, y + 0.1, z], true, 14);
    for (let i = 0; i < 6; i++) { const a = i * 1.05; sphere(g, [0.06, 0.07, 0.06], i % 2 ? m.leaf : m.leafLight, [x + Math.cos(a) * 0.11, y + 0.18, z + Math.sin(a) * 0.11], [8, 6]); }
    rod(g, [x + 0.08, y + 0.12, z], [x + 0.12, y - 0.4, z + 0.04], 0.012, m.leaf, 5); sphere(g, [0.05, 0.04, 0.05], m.leafLight, [x + 0.12, y - 0.42, z + 0.04], [8, 6]);
  }
  // a rug under the workbench aisle
  const rug = plate(g, 1.4, 0.8, 0.012, 0.05, m.accent, [-0.5, FLOOR + 0.0125, 0.6]); rug.rotation.x = -Math.PI / 2;
  return g;
}

// ---- the street in front --------------------------------------------------------------------------------
// A-frame board: two leaves hinged at the top, both feet on the ground.
function Chalkboard(parent, m, atlas, pos, rot) {
  const g = group(parent, 'Today’s blooms board', pos); g.rotation.y = rot;
  const L = 0.92, a = 0.17, H = L * Math.cos(a);
  for (const s of [1, -1]) {
    const leaf = group(g, s > 0 ? 'Front leaf' : 'Back leaf', [0, H, 0]); leaf.rotation.x = -s * a;
    plate(leaf, 0.66, L, 0.05, 0.04, m.wood, [0, -L / 2, 0]);
    if (s > 0) atlas.attach(leaf, 'board', 0.55, 0.7, [0, -L / 2 + 0.03, 0.028]);
  }
  rod(g, [-0.35, H, 0], [0.35, H, 0], 0.016, m.yellow, 8);
  for (const x of [-0.27, 0.27]) rod(g, [x, H * 0.45, Math.sin(a) * L * 0.55], [x, H * 0.45, -Math.sin(a) * L * 0.55], 0.007, m.ink, 4);
  return g;
}

function Cart(parent, m) {
  const g = group(parent, 'Flower cart');
  // bed, slatted sides, two big wheels, handles
  box(g, 0.7, 0.07, 1.0, m.woodLight, [0, 0.62, 0]);
  for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) box(g, 0.04, 0.05, 1.0, m.wood, [sx * 0.34, 0.69 + i * 0.075, 0], false);
  for (const sz of [-1, 1]) for (let i = 0; i < 3; i++) box(g, 0.72, 0.05, 0.04, m.wood, [0, 0.69 + i * 0.075, sz * 0.48], false);
  for (const sx of [-1, 1]) {
    const w = group(g, 'Cart wheel', [sx * 0.43, 0.32, -0.12]);
    const r = ring(w, 0.28, 0.03, m.ink); r.rotation.y = Math.PI / 2;
    const hub = cylinder(w, 0.05, 0.05, 0.07, m.yellow, [0, 0, 0], true, 10); hub.rotation.z = Math.PI / 2;
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI; rod(w, [0, Math.cos(a) * 0.27, Math.sin(a) * 0.27], [0, -Math.cos(a) * 0.27, -Math.sin(a) * 0.27], 0.014, m.woodDark, 5); }
  }
  rod(g, [-0.3, 0.6, 0.5], [-0.3, 0.55, 0.95], 0.025, m.woodDark, 8); rod(g, [0.3, 0.6, 0.5], [0.3, 0.55, 0.95], 0.025, m.woodDark, 8);
  rod(g, [-0.3, 0.57, 0.9], [-0.3, 0.0, 0.9], 0.02, m.woodDark, 6); rod(g, [0.3, 0.57, 0.9], [0.3, 0.0, 0.9], 0.02, m.woodDark, 6);
  // blooms packed in the back half
  bunch(g, m, [-0.12, 0.65, -0.28], 0.17, [0.3, 0.5], MIXES.tulips, 1);
  bunch(g, m, [0.16, 0.65, -0.28], 0.14, [0.26, 0.44], MIXES.pastel, 1);
  bunch(g, m, [0.0, 0.65, -0.02], 0.12, [0.22, 0.36], MIXES.spring.slice(0, 7), 0.95);
  return g;
}

function LadderShelf(parent, m, pos, rot) {
  const g = group(parent, 'Ladder shelf', pos); g.rotation.y = rot;
  for (const sx of [-0.42, 0.42]) { const r = rod(g, [sx, 0, 0.32], [sx * 0.8, 1.7, -0.15], 0.032, m.wood, 8); }
  const levels = [[0.22, 0.3], [0.62, 0.17], [1.02, 0.04], [1.42, -0.09]];
  levels.forEach(([y, z], i) => {
    box(g, 0.86 - i * 0.07, 0.04, 0.34, m.woodLight, [0, y, z]);
    const plants = [['flowers', 'terracotta', 'spring'], ['bush', 'cream'], ['flowers', 'cream', 'pastel']];
    [-0.22, 0.2].forEach((x, k) => { const [plant, colour, mix] = plants[(i + k) % 3]; pot(g, m, [x * (1 - i * 0.06), y + 0.02, z], { r: 0.1, h: 0.14, colour, plant, mix: mix || 'spring' }); });
  });
  return g;
}

function RoseTrellis(parent, m, x, z) {
  const g = group(parent, 'Climbing roses', [x, 0, z]);
  for (const sx of [-0.2, 0.2]) box(g, 0.035, 2.4, 0.03, m.wood, [sx, FLOOR + 1.2, 0], false);
  for (let y = 0.4; y < 2.6; y += 0.3) box(g, 0.42, 0.025, 0.025, m.wood, [0, FLOOR + y, 0.005], false);
  for (const sx of [-0.07, 0.07]) box(g, 0.02, 2.4, 0.02, m.woodLight, [sx, FLOOR + 1.2, 0.01], false);
  const spots = [[-0.12, 0.55], [0.1, 0.8], [-0.08, 1.1], [0.14, 1.35], [-0.12, 1.65], [0.06, 1.95], [-0.1, 2.25], [0.12, 2.45]];
  spots.forEach(([dx, y], i) => {
    sphere(g, [0.1, 0.09, 0.07], i % 2 ? m.leaf : m.leafLight, [dx, FLOOR + y, 0.05], [9, 6]);
    sphere(g, [0.07, 0.07, 0.05], i % 3 ? m.leafLight : m.leaf, [dx * -0.7, FLOOR + y + 0.17, 0.05], [9, 6]);
  });
  spots.slice(1, 8).forEach(([dx, y], i) => { const c = [m.pink, m.coral, m.rose][i % 3]; sphere(g, [0.06, 0.06, 0.05], c, [-dx * 0.9, FLOOR + y + 0.07, 0.1], [9, 6]); sphere(g, [0.04, 0.04, 0.035], i % 2 ? m.rose : m.pink, [-dx * 0.9 + 0.01, FLOOR + y + 0.095, 0.13], [8, 5]); });
  return g;
}

function RoundSign(parent, m, atlas, pos) {
  const g = group(parent, 'Hanging flower sign', pos);
  box(g, 0.07, 0.34, 0.05, m.ink, [0, 0, -0.03], false);
  rod(g, [0, 0.1, -0.02], [0, 0.1, 0.78], 0.022, m.ink, 6);
  tube(g, [[0, 0.1, 0.4], [0, -0.05, 0.28], [0, -0.1, 0.12]], 0.012, m.ink);
  for (const dz of [-0.16, 0.16]) rod(g, [0, 0.1, 0.62], [0, -0.16, 0.62 + dz], 0.008, m.ink, 4);
  const disc = cylinder(g, 0.34, 0.34, 0.07, m.cream, [0, -0.5, 0.62], true, 36); disc.rotation.z = Math.PI / 2;
  const rim = ring(g, 0.345, 0.025, m.accent, [0, -0.5, 0.62]); rim.rotation.y = Math.PI / 2;
  for (const s of [-1, 1]) atlas.attach(g, 'wrap', 0.5, 0.5, [s * 0.042, -0.5, 0.62], s * Math.PI / 2);
  return g;
}

export function StreetDetails(root, m, atlas) {
  const g = group(root, 'Morning outside the flower shop');
  // buckets of cut flowers in front of the window
  [['tulips', -0.5], ['rose', 0.3], ['field', 1.1], ['sun', 1.9]].forEach(([mix, x], i) => bucket(g, m, [x, GROUND, 2.42 + (i % 2) * 0.06], mix, [0.5, 0.84], 0.16));
  // door: topiary on the right, pots on the left, watering can, A-board
  const topiary = group(g, 'Topiary', [-1.04, GROUND, 2.0]);
  cylinder(topiary, 0.2, 0.15, 0.3, m.terracotta, [0, 0.15, 0], true, 20); cylinder(topiary, 0.23, 0.23, 0.06, m.terracotta, [0, 0.31, 0], true, 20);
  rod(topiary, [0, 0.3, 0], [0, 0.95, 0], 0.03, m.woodDark, 8);
  sphere(topiary, [0.29, 0.29, 0.29], m.leaf, [0, 1.15, 0], [16, 12]); sphere(topiary, [0.17, 0.17, 0.17], m.leafLight, [0.1, 1.36, 0.06], [12, 9]);
  for (let i = 0; i < 6; i++) { const a = i * 1.1; sphere(topiary, [0.045, 0.045, 0.045], m.pink, [Math.cos(a) * 0.27, 1.12 + (i % 3) * 0.1, Math.sin(a) * 0.27], [6, 5]); }
  pot(g, m, [-3.12, GROUND, 2.0], { r: 0.2, h: 0.34, colour: 'terracotta', plant: 'flowers', mix: 'rose' });
  pot(g, m, [-3.05, GROUND, 2.55], { r: 0.14, h: 0.22, colour: 'cream', plant: 'bush' });
  wateringCan(g, m, [-1.55, GROUND, 2.55], 0.4);
  Chalkboard(g, m, atlas, [-2.5, GROUND, 2.85], 0.1);

  // cart on the right, with space for the bouquet to be picked up
  const cart = Cart(g, m); cart.position.set(3.0, GROUND, 2.25); cart.rotation.y = -0.15;
  // ladder shelf against the right wall
  LadderShelf(g, m, [3.28, GROUND, -0.15], Math.PI / 2);
  // climbing roses on the right pier, hanging sign on the left corner
  RoseTrellis(g, m, 2.64, 1.9);
  RoundSign(g, m, atlas, [-2.88, 2.7, 1.82]);
  atlas.attach(g, 'hours', 0.26, 0.13, [-1.1, 1.64, 1.832]);
  return { group: g, cart };
}

export function Pickup(root, m, atlas) {
  const g = bouquet(root, m, [0, 0, 0], 'spring', 1.25);
  g.name = 'Pick a bouquet'; g.userData.action = 'flowerPick';
  return g;
}
