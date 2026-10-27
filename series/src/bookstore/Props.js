import { group, box, plate, rod, tube, sphere, cylinder, cone } from './primitives.js';
import { G } from './Architecture.js';
import { stack, faceOut, plant, vine, rng } from './Books.js';
import { Mug } from './Interior.js';

const OUT = m => m.booksOut;

// ---- the street and the deck: an outdoor reading corner, boards, crates, a cart, plants and vines -----------
export function StreetDetails(root, m, atlas) {
  const { GROUND: Y, FLOOR: F } = G, B = OUT(m), g = group(root, 'Life around the bookshop');

  // outdoor reading corner in front of the window: bench, café table, a coffee, a crate of books
  const bench = group(g, 'Bench', [-2.05, Y, 2.3]);
  box(bench, 1.3, 0.05, 0.4, m.wood, [0, 0.44, 0]);
  for (let i = 0; i < 3; i++) box(bench, 1.3, 0.012, 0.11, m.woodLight, [0, 0.47, -0.13 + i * 0.13], false);
  for (const x of [-0.56, 0.56]) { box(bench, 0.06, 0.42, 0.34, m.walnut, [x, 0.21, 0]); box(bench, 0.06, 0.46, 0.05, m.walnut, [x, 0.67, -0.2]); }
  box(bench, 1.34, 0.12, 0.04, m.wood, [0, 0.82, -0.2]); box(bench, 1.34, 0.08, 0.04, m.wood, [0, 0.62, -0.2]);
  box(bench, 0.48, 0.07, 0.34, m.yellow, [-0.32, 0.505, 0.0]);
  plate(bench, 0.3, 0.26, 0.08, 0.06, m.coral, [-0.38, 0.62, -0.12]).rotation.x = -0.2;
  stack(bench, m, B, [0.3, 0.465, 0.02], 2, 71, 0.25);
  const ob = group(bench, 'Open book', [0.0, 0.47, 0.05]); ob.rotation.y = -0.3;
  for (const s of [-1, 1]) box(ob, 0.13, 0.012, 0.18, m.paper, [s * 0.066, 0.012, 0]).rotation.z = -s * 0.1;
  box(ob, 0.27, 0.008, 0.19, B[1], [0, 0.003, 0]);
  const table = group(g, 'Café table', [-1.0, Y, 2.45]);
  cylinder(table, 0.24, 0.24, 0.035, m.cream, [0, 0.6, 0], true, 24); rod(table, [0, 0, 0], [0, 0.59, 0], 0.022, m.walnut, 8);
  for (const a of [0.5, 2.6, 4.7]) rod(table, [0, 0.03, 0], [Math.sin(a) * 0.18, 0.005, Math.cos(a) * 0.18], 0.016, m.walnut, 6);
  Mug(table, m, [0.08, 0.618, 0.06], m.cream);
  cylinder(table, 0.065, 0.065, 0.006, m.paper, [0.08, 0.62, 0.06], false, 14);
  stack(table, m, B, [-0.08, 0.618, -0.05], 2, 72, -0.4);
  plant(g, m, [-3.25, Y, 2.0], { r: 0.2, h: 0.32, pot: m.terracotta, kind: 'bush' });
  plant(g, m, [-3.3, Y, 2.55], { r: 0.13, h: 0.22, pot: m.cream, kind: 'bush' });
  Crate(g, m, B, [-0.42, Y, 2.2], 0.15);

  // Today's Picks: a two-step stand with three books facing the street and a card on top
  const picks = group(g, "Today's picks", [0.7, Y, 2.2]); picks.rotation.y = -0.1;
  box(picks, 0.9, 0.36, 0.32, m.wood, [0, 0.18, 0]); box(picks, 0.9, 0.24, 0.16, m.wood, [0, 0.48, -0.08]);
  box(picks, 0.94, 0.03, 0.34, m.walnut, [0, 0.375, 0]); box(picks, 0.94, 0.03, 0.18, m.walnut, [0, 0.615, -0.08]);
  faceOut(picks, m, B, 0.2, 0.27, 0.03, 0, [-0.27, 0.39, 0.08], -0.18); faceOut(picks, m, B, 0.22, 0.3, 0.03, 1, [0, 0.39, 0.08], -0.18); faceOut(picks, m, B, 0.2, 0.27, 0.03, 3, [0.27, 0.39, 0.08], -0.18);
  plate(picks, 0.46, 0.46, 0.025, 0.02, m.walnut, [0.05, 0.86, -0.06]); atlas.attach(picks, 'picks', 0.42, 0.42, [0.05, 0.86, -0.045]);
  box(picks, 0.03, 0.26, 0.02, m.walnut, [0.05, 0.63, -0.1]);
  stack(picks, m, B, [-0.28, 0.63, -0.08], 3, 73, 0.3);

  // chalkboard A-frame by the steps
  ABoard(g, m, atlas, [2.42, Y, 2.55], 0.3);

  // vine climbing the front-left corner from a trough, over the top of the window
  box(g, 0.5, 0.26, 0.26, m.terracotta, [-2.9, Y + 0.13, 1.92]); box(g, 0.54, 0.04, 0.3, m.terracotta, [-2.9, Y + 0.27, 1.92]);
  for (let i = 0; i < 4; i++) sphere(g, [0.1, 0.08, 0.1], i % 2 ? m.leaf : m.leafLight, [-3.08 + i * 0.12, Y + 0.33, 1.92], [8, 6]);
  // ivy climbing the corner post: a few overlapping stems, denser near the trough and thinning out at the top
  const vx = -2.99, vz = 1.79;
  vine(g, m, [vx, Y + 0.3, vz], [vx - 0.03, 1.3, vz + 0.04], 11, 1, 0.05, 1.5);
  vine(g, m, [vx + 0.04, Y + 0.3, vz - 0.03], [vx + 0.02, 1.9, vz + 0.02], 13, 2, 0.07, 1.3);
  vine(g, m, [vx - 0.03, 1.3, vz + 0.04], [vx, 2.6, vz + 0.03], 10, 3, 0.05, 1.25);
  vine(g, m, [vx, 2.6, vz + 0.03], [vx + 0.04, 3.5, vz - 0.04], 7, 4, 0.04, 1.1);
  vine(g, m, [vx + 0.08, 3.5, vz + 0.02], [-2.45, 3.56, vz + 0.02], 6, 5, 0.03, 1.1);
  vine(g, m, [-2.7, 3.55, vz + 0.02], [-2.66, 3.25, vz + 0.03], 3, 6, 0.02, 1.1);

  // ---- on the deck ---------------------------------------------------------------------------------
  // welcome mat outside the double door
  box(g, 0.5, 0.012, 0.95, m.woodLight, [3.3, F + 0.006, -0.1], false);
  const mat = atlas.attach(g, 'mat', 0.92, 0.46, [3.3, F + 0.014, -0.1]); mat.rotation.set(-Math.PI / 2, 0, Math.PI / 2);
  // postcard spinner and umbrella stand either side of the door
  const pc = group(g, 'Postcard rack', [3.24, F, -1.62]); pc.rotation.y = 0.5;
  cylinder(pc, 0.13, 0.15, 0.03, m.steel, [0, 0.015, 0], true, 14); rod(pc, [0, 0, 0], [0, 1.25, 0], 0.012, m.steel, 6);
  for (const y of [0.55, 0.88]) for (let f = 0; f < 4; f++) {
    const face = group(pc, 'Postcards', [0, y, 0]); face.rotation.y = f * Math.PI / 2;
    box(face, 0.26, 0.01, 0.05, m.steel, [0, -0.09, 0.08], false);
    atlas.attach(face, 'postcards', 0.26, 0.15, [0, 0.0, 0.1]).rotation.x = -0.1;
  }
  const um = group(g, 'Umbrella stand', [3.14, F, -1.12]);
  cylinder(um, 0.11, 0.1, 0.42, m.typewriter, [0, 0.21, 0], true, 16); cylinder(um, 0.115, 0.115, 0.03, m.brass, [0, 0.41, 0], false, 16);
  for (const [a, col, h] of [[0.4, m.coral, 0.92], [2.4, m.blue, 0.82], [4.3, m.yellow, 0.88]]) {
    const top = [Math.sin(a) * 0.08, h, Math.cos(a) * 0.08];
    rod(um, [0, 0.05, 0], top, 0.008, m.ink, 4);
    const c = cone(um, 0.05, 0.42, col, [top[0] * 0.8, h - 0.25, top[2] * 0.8], true, 8); c.rotation.x = Math.PI;
    tube(um, [top, [top[0], h + 0.06, top[2]], [top[0] + 0.05, h + 0.06, top[2]]], 0.007, m.walnut);
  }
  // discount book cart
  Cart(g, m, atlas, B, [4.18, F, -1.28]);
  // “We recommend” easel
  const easel = group(g, 'Recommendation board', [4.38, F, -0.38]); easel.rotation.y = Math.PI / 2 - 0.25;
  for (const s of [-1, 1]) rod(easel, [s * 0.26, 0, 0.12], [s * 0.18, 1.3, -0.02], 0.016, m.walnut, 6);
  rod(easel, [0, 0, -0.32], [0, 1.25, -0.04], 0.016, m.walnut, 6);
  box(easel, 0.62, 0.03, 0.08, m.walnut, [0, 0.5, 0.06]);
  const bd = group(easel, 'Board', [0, 0.87, 0.04]); bd.rotation.x = -0.1;
  plate(bd, 0.62, 0.66, 0.03, 0.02, m.walnut, [0, 0, 0]); atlas.attach(bd, 'recommend', 0.56, 0.6, [0, 0, 0.017]);
  // stool with a stack of books
  const stool = group(g, 'Stool', [4.32, F, 0.32]);
  cylinder(stool, 0.17, 0.17, 0.04, m.wood, [0, 0.46, 0], true, 18);
  for (const a of [0.3, 2.4, 4.5]) rod(stool, [Math.sin(a) * 0.15, 0, Math.cos(a) * 0.15], [Math.sin(a) * 0.1, 0.44, Math.cos(a) * 0.1], 0.016, m.walnut, 6);
  stack(stool, m, B, [0, 0.48, 0], 4, 74, 0.6);
  // basket of wrapping paper rolls and string
  const basket = group(g, 'Wrapping basket', [3.24, F, 1.3]);
  cylinder(basket, 0.16, 0.13, 0.3, m.woodLight, [0, 0.15, 0], true, 18);
  for (let i = 0; i < 4; i++) box(basket, 0.002, 0.3, 0.002, m.wood, [0, 0.15, 0], false);
  for (const y of [0.08, 0.16, 0.24]) cylinder(basket, 0.152 - y * 0.06, 0.152 - y * 0.06, 0.012, m.wood, [0, y, 0], false, 18);
  for (const [x, z, h, col, lean] of [[-0.05, -0.03, 0.62, m.paper, 0.1], [0.05, 0.02, 0.55, m.coral, -0.12], [0.0, 0.07, 0.5, m.blue, 0.05], [0.06, -0.06, 0.58, m.woodLight, -0.05]]) {
    const r = cylinder(basket, 0.035, 0.035, h, col, [x, h / 2 + 0.04, z], true, 12); r.rotation.z = lean;
  }
  cylinder(basket, 0.05, 0.05, 0.05, m.cream, [0.1, 0.33, 0.08], true, 12);
  // plants on the low wall, one trailing over the street side
  plant(g, m, [4.74, F + 0.67, -1.62], { r: 0.12, h: 0.18, pot: m.terracotta, kind: 'trailing' });
  plant(g, m, [4.74, F + 0.67, 1.46], { r: 0.1, h: 0.16, pot: m.cream, kind: 'bush' });
  plant(g, m, [4.74, F + 0.67, 0.68], { r: 0.08, h: 0.12, pot: m.terracotta, kind: 'bush' });
  // a second crate of books at the foot of the steps
  Crate(g, m, B, [2.62, Y, 3.25], 0.35);
  return g;
}

function ABoard(p, m, atlas, pos, turn) {
  const g = group(p, 'Chalkboard A-frame', pos); g.rotation.y = turn;
  const h = 1.0, splay = 0.2;
  for (const s of [1, -1]) {
    const leaf = group(g, 'Leaf', [0, 0, s * 0.18]); leaf.rotation.x = s * splay;
    for (const x of [-0.3, 0.3]) box(leaf, 0.045, h, 0.045, m.walnut, [x, h / 2, 0]);
    box(leaf, 0.65, 0.05, 0.045, m.walnut, [0, h - 0.02, 0]); box(leaf, 0.65, 0.04, 0.045, m.walnut, [0, 0.16, 0]);
    box(leaf, 0.56, 0.74, 0.02, m.chalk, [0, 0.56, 0], false);
    if (s > 0) atlas.attach(leaf, 'board', 0.5, 0.66, [0, 0.56, 0.012]);
  }
  rod(g, [-0.27, 0.5, 0.08], [-0.27, 0.5, -0.08], 0.008, m.brass, 4); rod(g, [0.27, 0.5, 0.08], [0.27, 0.5, -0.08], 0.008, m.brass, 4);
  return g;
}

function Crate(p, m, B, pos, turn) {
  const g = group(p, 'Crate of books', pos); g.rotation.y = turn;
  for (const s of [-1, 1]) { box(g, 0.56, 0.3, 0.025, m.woodLight, [0, 0.15, s * 0.19]); box(g, 0.025, 0.3, 0.36, m.woodLight, [s * 0.27, 0.15, 0]); }
  box(g, 0.54, 0.02, 0.36, m.wood, [0, 0.01, 0]);
  for (const y of [0.1, 0.22]) for (const s of [-1, 1]) box(g, 0.565, 0.012, 0.03, m.wood, [0, y, s * 0.192], false);
  const r = rng(9);
  for (let i = 0, x = -0.24; x < 0.22; i++) { const w = 0.03 + r() * 0.035, h = 0.2 + r() * 0.08; box(g, w, h, 0.26, B[(i * 5) % B.length], [x + w / 2, 0.02 + h / 2, 0.02], false); box(g, w * 0.7, 0.004, 0.24, m.paper, [x + w / 2, 0.022 + h, 0.01], false); x += w + 0.004; }
  return g;
}

function Cart(p, m, atlas, B, pos) {
  const g = group(p, 'Discount book cart', pos);
  box(g, 0.5, 0.26, 0.82, m.wood, [0, 0.62, 0]); box(g, 0.54, 0.03, 0.86, m.walnut, [0, 0.765, 0]);
  box(g, 0.44, 0.02, 0.76, m.walnut, [0, 0.2, 0]);
  for (const [x, z] of [[-0.21, -0.35], [0.21, -0.35], [-0.21, 0.35], [0.21, 0.35]]) box(g, 0.04, 0.5, 0.04, m.walnut, [x, 0.25, z]);
  // books spine-up in two rows, the browsing way
  const r = rng(17);
  for (const x of [-0.11, 0.11]) for (let z = -0.37, i = 0; z < 0.36; i++) {
    const w = 0.03 + r() * 0.03, h = 0.16 + r() * 0.08, d = 0.18 + r() * 0.03;
    const b = group(g, 'Book', [x, 0.78, z + w / 2]); b.rotation.set(0, Math.PI / 2, 0); b.rotation.z = (r() - 0.5) * 0.12;
    box(b, w, h, d, B[(i * 7 + (x > 0 ? 3 : 0)) % B.length], [0, h / 2 - 0.08, 0], false);
    box(b, w * 0.7, 0.004, d - 0.02, m.paper, [0, h - 0.078, 0], false);
    z += w + 0.004;
  }
  stack(g, m, B, [0, 0.2 + 0.01, -0.15], 3, 75, 0.2);
  // swinging price card on the street-facing end
  plate(g, 0.44, 0.24, 0.02, 0.02, m.walnut, [0.27, 0.6, 0]).rotation.y = Math.PI / 2;
  atlas.attach(g, 'sale', 0.4, 0.2, [0.282, 0.6, 0], Math.PI / 2);
  for (const z of [-0.37, 0.37]) { const w = cylinder(g, 0.06, 0.06, 0.03, m.ink, [0.25, 0.06, z], true, 14); w.rotation.z = Math.PI / 2; }
  return g;
}

// The lectern on the deck holds an oversized book; its right half turns on the spine (dynamic leaf).
export function Lectern(p, m, atlas, pos, turn) {
  const g = group(p, 'Book lectern', pos); g.rotation.y = turn;
  box(g, 0.44, 0.04, 0.34, m.walnut, [0, 0.02, 0]);
  box(g, 0.09, 0.9, 0.09, m.walnut, [0, 0.47, 0]); box(g, 0.12, 0.06, 0.12, m.wood, [0, 0.9, 0]);
  const top = group(g, 'Lectern top', [0, 0.97, 0]); top.rotation.x = 0.32;
  box(top, 0.64, 0.035, 0.46, m.wood, [0, -0.018, 0]);
  box(top, 0.64, 0.05, 0.03, m.walnut, [0, 0.01, 0.235]);
  const t = 0.032, w = 0.27, d = 0.38;
  // left half (fixed): cover, page block, printed page
  box(top, w + 0.01, 0.008, d + 0.01, m.coral, [-(w + 0.01) / 2, 0.004, 0]);
  box(top, w - 0.005, t - 0.008, d - 0.01, m.paper, [-w / 2, 0.008 + (t - 0.008) / 2, 0]);
  atlas.attach(top, 'pageL', w - 0.01, d - 0.02, [-w / 2, t + 0.0015, 0]).rotation.x = -Math.PI / 2;
  rod(top, [0, 0.008, -d / 2 - 0.005], [0, 0.008, d / 2 + 0.005], 0.012, m.coral, 8);
  tube(top, [[-0.04, t, -d / 2], [-0.06, t + 0.004, 0], [-0.05, t, d / 2 - 0.02], [-0.07, -0.05, d / 2 + 0.02], [-0.06, -0.16, d / 2 + 0.04]], 0.006, m.yellow);
  // right half on the spine hinge
  const hinge = group(top, 'Book spine hinge', [0, t, 0]);
  const leaf = group(hinge, 'Open the book'); leaf.userData.action = 'booksOpen';
  box(leaf, w + 0.01, 0.008, d + 0.01, m.coral, [(w + 0.01) / 2, -t + 0.004, 0]);
  box(leaf, w - 0.005, t - 0.008, d - 0.01, m.paper, [w / 2, -t + 0.008 + (t - 0.008) / 2, 0]);
  atlas.attach(leaf, 'pageR', w - 0.01, d - 0.02, [w / 2, 0.0015, 0]).rotation.x = -Math.PI / 2;
  box(leaf, 0.16, 0.003, 0.06, m.cream, [w / 2 + 0.01, -t - 0.001, -0.05], false);
  box(leaf, 0.12, 0.003, 0.012, m.cream, [w / 2 + 0.01, -t - 0.001, 0.03], false);
  hinge.rotation.z = Math.PI; // closed
  return { group: g, hinge, leaf };
}
