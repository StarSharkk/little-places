import { group, box, plate, rod, tube, sphere, cylinder, cone } from './primitives.js';
import { G } from './Architecture.js';
import { Bookcase, row, standing, faceOut, stack, plant, rng } from './Books.js';

// The room inside: x ∈ [-2.7, 2.7], z ∈ [-1.7, 1.5] on the raised floor. Everything here stays put;
// see-through only lifts the front façade and the roof off it.
export function Interior(root, m, atlas) {
  const F = G.FLOOR, B = m.books, g = group(root, 'Bookshop interior');
  // oak floor, planks running front to back
  box(g, 5.4, 0.02, 3.2, m.floorWood, [0, F + 0.01, -0.1], false);
  for (let x = -2.4; x < 2.6; x += 0.3) rod(g, [x, F + 0.021, -1.69], [x, F + 0.021, 1.49], 0.004, m.shelf, 4);

  // ---- Book Collection: the tall back bookcase with a library ladder on a brass rail ----------------------
  Bookcase(g, m, B, { name: 'Book collection', pos: [-0.15, F + 0.02, -1.52], w: 2.4, h: 2.55, d: 0.34, levels: 6, bays: 3, seed: 3 });
  rod(g, [-1.3, F + 2.38, -1.31], [1.0, F + 2.38, -1.31], 0.012, m.brass, 8);
  for (const x of [0.38, 0.72]) rod(g, [x, F + 0.02, -0.92], [x, F + 2.42, -1.3], 0.022, m.walnut, 8);
  for (let i = 1; i < 8; i++) { const t = i / 8; rod(g, [0.38, F + 0.02 + 2.4 * t, -0.92 - 0.38 * t], [0.72, F + 0.02 + 2.4 * t, -0.92 - 0.38 * t], 0.014, m.walnut, 6); }
  for (const x of [0.38, 0.72]) tube(g, [[x, F + 2.42, -1.3], [x, F + 2.47, -1.33], [x, F + 2.4, -1.35]], 0.012, m.brass);

  // ---- Reading Corner (back left): rug, armchair, arc lamp, side table, a floating shelf -------------------
  cylinder(g, 0.66, 0.66, 0.012, m.rug, [-2.0, F + 0.026, -1.05], true, 36);
  cylinder(g, 0.52, 0.52, 0.013, m.cream, [-2.0, F + 0.027, -1.05], false, 36);
  cylinder(g, 0.44, 0.44, 0.014, m.rug, [-2.0, F + 0.028, -1.05], false, 36);
  Armchair(g, m, [-2.12, F + 0.03, -1.17], Math.PI / 4);
  const lamp = group(g, 'Arc lamp', [-2.55, F, -1.58]);
  cylinder(lamp, 0.15, 0.17, 0.04, m.walnut, [0, 0.02, 0], true, 20);
  tube(lamp, [[0, 0.04, 0], [0, 1.2, 0], [0.12, 1.75, 0.12], [0.42, 1.82, 0.42], [0.58, 1.66, 0.58]], 0.016, m.walnut);
  cone(lamp, 0.17, 0.16, m.yellow, [0.58, 1.58, 0.58], true, 18);
  sphere(lamp, [0.06, 0.05, 0.06], m.glow, [0.58, 1.49, 0.58], [10, 6]);
  const table = group(g, 'Side table', [-1.56, F, -1.42]);
  cylinder(table, 0.2, 0.2, 0.035, m.walnut, [0, 0.56, 0], true, 22); rod(table, [0, 0, 0], [0, 0.55, 0], 0.025, m.walnut, 8);
  cylinder(table, 0.12, 0.14, 0.025, m.walnut, [0, 0.012, 0], true, 16);
  stack(table, m, B, [0.03, 0.578, 0.02], 3, 21, 0.3);
  Mug(table, m, [-0.11, 0.578, 0.08], m.coral);
  const shelf = group(g, 'Floating shelf', [-2.05, F + 1.95, -1.58]);
  box(shelf, 1.05, 0.035, 0.22, m.shelf, [0, 0, 0]);
  for (const x of [-0.4, 0.4]) box(shelf, 0.03, 0.12, 0.16, m.walnut, [x, -0.07, -0.02]);
  row(group(shelf, 'Books', [0, 0, 0.1]), m, B, { x0: -0.5, x1: 0.18, y: 0.018, depth: 0.2, seed: 41, stacks: false });
  plant(shelf, m, [0.34, 0.018, -0.01], { r: 0.07, h: 0.1, pot: m.cream, kind: 'trailing' });
  for (const [x, y, key] of [[-1.75, 1.2, 'poster']]) { plate(g, 0.48, 0.48, 0.025, 0.02, m.walnut, [x - 0.1, F + y + 0.1, -1.685]); atlas.attach(g, key, 0.42, 0.42, [x - 0.1, F + y + 0.1, -1.671]); }

  // low bookcase under the round window, a plant, a globe and a few books on top
  Bookcase(g, m, B, { name: 'Low bookcase', pos: [-2.53, F + 0.02, 0.38], turn: Math.PI / 2, w: 1.8, h: 1.0, d: 0.32, levels: 2, bays: 2, seed: 8 });
  plant(g, m, [-2.52, F + 1.06, 1.05], { r: 0.09, h: 0.13, pot: m.terracotta, kind: 'trailing' });
  stack(g, m, B, [-2.5, F + 1.06, 0.45], 4, 33, 0.5);
  const globe = group(g, 'Globe', [-2.52, F + 1.06, -0.15]);
  cylinder(globe, 0.06, 0.07, 0.03, m.walnut, [0, 0.015, 0], true, 14); rod(globe, [0, 0.03, 0], [0, 0.1, 0], 0.01, m.brass, 6);
  sphere(globe, [0.12, 0.12, 0.12], m.blue, [0, 0.22, 0], [16, 12]); sphere(globe, [0.07, 0.05, 0.08], m.leafLight, [0.07, 0.25, 0.05], [8, 6]);
  tube(globe, [[0, 0.08, 0.02], [0.1, 0.13, 0.08], [0.14, 0.24, 0.07], [0.08, 0.34, 0.03]], 0.008, m.brass);

  // ---- Book Display: a stepped window display, books facing the street -----------------------------------
  const disp = group(g, 'Window book display', [-0.35, F, 1.28]);
  box(disp, 4.1, 0.5, 0.42, m.shelfLight, [0, 0.25, 0]);
  box(disp, 4.14, 0.03, 0.45, m.walnut, [0, 0.515, 0]);
  box(disp, 3.6, 0.22, 0.17, m.shelfLight, [0, 0.64, -0.12]); box(disp, 3.64, 0.025, 0.2, m.walnut, [0, 0.76, -0.12]);
  const r = rng(7);
  for (let i = 0; i < 11; i++) { const x = -1.85 + i * 0.37 + (r() - 0.5) * 0.06, w = 0.18 + r() * 0.06; faceOut(disp, m, B, w, w * 1.35, 0.035, i * 5 + 2, [x, 0.53, 0.1], -0.16); }
  for (let i = 0; i < 8; i++) { const x = -1.6 + i * 0.46, w = 0.16 + r() * 0.05; faceOut(disp, m, B, w, w * 1.4, 0.03, i * 3 + 1, [x, 0.775, -0.1], -0.14); }
  stack(disp, m, B, [-1.98, 0.53, -0.05], 4, 12, 0.2); stack(disp, m, B, [1.92, 0.53, -0.04], 3, 13, -0.3);
  plant(disp, m, [0.02, 0.775, -0.12], { r: 0.07, h: 0.1, pot: m.cream, kind: 'bush' });
  plant(disp, m, [1.75, 0.775, -0.12], { r: 0.06, h: 0.09, pot: m.terracotta, kind: 'trailing' });

  // ---- display table in the middle of the room ------------------------------------------------------
  const dt = group(g, 'Display table', [-0.95, F, 0.2]);
  box(dt, 1.3, 0.05, 0.74, m.woodLight, [0, 0.78, 0]); box(dt, 1.22, 0.1, 0.66, m.walnut, [0, 0.71, 0]);
  for (const [x, z] of [[-0.58, -0.3], [0.58, -0.3], [-0.58, 0.3], [0.58, 0.3]]) box(dt, 0.06, 0.7, 0.06, m.walnut, [x, 0.35, z]);
  box(dt, 1.1, 0.025, 0.55, m.walnut, [0, 0.18, 0]);
  stack(dt, m, B, [-0.42, 0.805, -0.12], 5, 3, 0.15); stack(dt, m, B, [0.1, 0.805, 0.15], 3, 4, -0.2); stack(dt, m, B, [0.45, 0.805, -0.15], 4, 5, 0.4);
  for (const [x, ci] of [[-0.12, 2], [0.3, 6]]) { box(dt, 0.12, 0.02, 0.1, m.walnut, [x, 0.815, 0.25]); faceOut(dt, m, B, 0.2, 0.28, 0.03, ci, [x, 0.825, 0.24], -0.3); }
  stack(dt, m, B, [-0.2, 0.205, 0], 3, 6, 0.1); stack(dt, m, B, [0.25, 0.205, 0.05], 2, 9, -0.2);
  plate(dt, 0.2, 0.13, 0.015, 0.015, m.cream, [-0.45, 0.88, 0.28]).rotation.x = -0.4;

  // double-sided island bookcase, books facing both aisles
  for (const s of [1, -1]) Bookcase(g, m, B, { name: 'Island bookcase', pos: [0.6 + s * 0.135, F + 0.02, 0.35], turn: s * Math.PI / 2, w: 1.15, h: 1.3, d: 0.26, levels: 3, bays: 2, seed: 20 + s });
  faceOut(g, m, B, 0.22, 0.3, 0.035, 0, [0.6, F + 1.36, 0.1], -0.1); faceOut(g, m, B, 0.2, 0.28, 0.035, 7, [0.6, F + 1.36, 0.6], -0.1);
  plant(g, m, [0.6, F + 1.36, 0.85], { r: 0.07, h: 0.1, pot: m.cream, kind: 'bush' });

  // ---- Cashier: counter facing the door, vintage register, banker's lamp, a stool behind ------------------
  Counter(g, m, atlas, [1.72, F, -0.98]);
  const stool = group(g, 'Stool', [1.14, F, -0.95]);
  cylinder(stool, 0.17, 0.17, 0.05, m.coral, [0, 0.66, 0], true, 18);
  for (const a of [0.4, 2.5, 4.6]) rod(stool, [Math.sin(a) * 0.15, 0, Math.cos(a) * 0.15], [Math.sin(a) * 0.1, 0.64, Math.cos(a) * 0.1], 0.018, m.walnut, 6);
  // behind the till: two floating shelves and the shop's tote bags on pegs
  for (const [y, seed] of [[1.95, 51], [2.42, 52]]) {
    const s = group(g, 'Wall shelf', [1.95, F + y, -1.58]);
    box(s, 1.1, 0.035, 0.22, m.shelf, [0, 0, 0]);
    row(group(s, 'Books', [0, 0, 0.1]), m, B, { x0: -0.5, x1: 0.5, y: 0.018, depth: 0.2, seed, maxH: 0.26 });
  }
  for (const [x, col] of [[1.55, m.cream], [2.05, m.paper]]) {
    rod(g, [x, F + 1.62, -1.7], [x, F + 1.62, -1.62], 0.012, m.walnut, 6);
    tube(g, [[x - 0.1, F + 1.36, -1.645], [x, F + 1.62, -1.62], [x + 0.1, F + 1.36, -1.645]], 0.007, m.walnut);
    plate(g, 0.34, 0.4, 0.015, 0.02, col, [x, F + 1.16, -1.65]); atlas.attach(g, 'bag', 0.28, 0.28, [x, F + 1.14, -1.641]);
  }

  // ---- pocket-book spinner by the door, seen through the side light -------------------------------------
  Spinner(g, m, B, [2.22, F, 0.95], 0.4);
  plant(g, m, [2.45, F, -0.32], { r: 0.16, h: 0.3, pot: m.cream, kind: 'tall' });

  // ---- three pendant lamps over the room --------------------------------------------------------------
  for (const [x, z] of [[-1.7, 0.45], [-0.3, 0.3], [1.3, 0.4]]) {
    rod(g, [x, G.TOP, z], [x, G.TOP - 0.62, z], 0.006, m.ink, 4);
    cone(g, 0.18, 0.15, m.cream, [x, G.TOP - 0.68, z], true, 20);
    cylinder(g, 0.14, 0.14, 0.006, m.glow, [x, G.TOP - 0.755, z], false, 18);
    sphere(g, [0.05, 0.05, 0.05], m.glow, [x, G.TOP - 0.77, z], [10, 6]);
  }
  return g;
}

export function Mug(p, m, pos, mat = m.cream) {
  const g = group(p, 'Mug', pos);
  cylinder(g, 0.035, 0.032, 0.075, mat, [0, 0.0375, 0], true, 14);
  cylinder(g, 0.03, 0.03, 0.004, m.walnut, [0, 0.071, 0], false, 12);
  tube(g, [[0.03, 0.06, 0], [0.06, 0.045, 0], [0.03, 0.02, 0]], 0.006, mat);
  return g;
}

function Armchair(p, m, pos, turn) {
  const g = group(p, 'Armchair', pos); g.rotation.y = turn;
  for (const [x, z] of [[-0.3, -0.26], [0.3, -0.26], [-0.3, 0.26], [0.3, 0.26]]) cylinder(g, 0.025, 0.02, 0.1, m.walnut, [x, 0.05, z], false, 8);
  box(g, 0.78, 0.26, 0.68, m.blue, [0, 0.23, 0]);
  box(g, 0.56, 0.1, 0.56, m.fabric, [0, 0.41, 0.04]);
  plate(g, 0.78, 0.56, 0.16, 0.08, m.blue, [0, 0.62, -0.27]);
  for (const s of [-1, 1]) plate(g, 0.13, 0.3, 0.68, 0.05, m.blue, [s * 0.33, 0.48, 0]);
  const pillow = sphere(g, [0.17, 0.13, 0.06], m.yellow, [0.06, 0.6, -0.15], [12, 8]); pillow.rotation.z = 0.2;
  // a throw folded over the arm
  box(g, 0.17, 0.02, 0.32, m.coral, [-0.33, 0.64, 0.05]); box(g, 0.02, 0.22, 0.32, m.coral, [-0.41, 0.53, 0.05]);
  for (const z of [-0.06, 0.06, 0.18]) box(g, 0.174, 0.022, 0.012, m.cream, [-0.33, 0.641, z], false);
  // an open book left on the seat
  const ob = group(g, 'Open book', [0.05, 0.465, 0.12]); ob.rotation.y = 0.3;
  for (const s of [-1, 1]) { const h = box(ob, 0.13, 0.012, 0.18, m.paperIn, [s * 0.065, 0.012, 0]); h.rotation.z = -s * 0.12; }
  box(ob, 0.27, 0.008, 0.19, m.books[0], [0, 0.002, 0]);
  return g;
}

function Counter(p, m, atlas, pos) {
  const g = group(p, 'Cashier counter', pos);
  box(g, 0.6, 0.92, 1.15, m.wood, [0, 0.46, 0]);
  box(g, 0.7, 0.05, 1.25, m.walnut, [0.02, 0.945, 0]);
  box(g, 0.62, 0.08, 1.17, m.walnut, [0.01, 0.04, 0]);
  for (const z of [-0.29, 0.29]) { plate(g, 0.44, 0.58, 0.02, 0.03, m.woodLight, [0.31, 0.5, z]).rotation.y = Math.PI / 2; }
  // till: a little vintage register in the typewriter green with brass keys
  const till = group(g, 'Register', [-0.02, 0.97, -0.34]); till.rotation.y = Math.PI / 2;
  box(till, 0.34, 0.12, 0.28, m.typewriter, [0, 0.06, 0]);
  const keys = box(till, 0.3, 0.06, 0.16, m.typewriter, [0, 0.13, 0.04]); keys.rotation.x = 0.35;
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) cylinder(till, 0.012, 0.012, 0.012, m.cream, [-0.11 + i * 0.075, 0.17 + j * 0.02, 0.1 - j * 0.05], false, 8);
  plate(till, 0.24, 0.1, 0.06, 0.02, m.brass, [0, 0.22, -0.08]);
  box(till, 0.1, 0.04, 0.03, m.cream, [0, 0.26, -0.08], false);
  // banker's lamp, bookmarks in a cup, the day's receipt roll, a stack of new books, a wrapped gift
  const lamp = group(g, "Banker's lamp", [-0.15, 0.97, 0.36]);
  box(lamp, 0.16, 0.025, 0.1, m.brass, [0, 0.012, 0]); rod(lamp, [0, 0.02, 0], [0, 0.24, 0], 0.01, m.brass, 6);
  const sh = cylinder(lamp, 0.06, 0.06, 0.26, m.leafDeep, [0, 0.26, 0.02], true, 14); sh.rotation.x = Math.PI / 2; sh.scale.set(1, 1, 0.6);
  box(lamp, 0.22, 0.008, 0.06, m.glow, [0, 0.235, 0.02], false);
  const cup = group(g, 'Bookmarks', [0.12, 0.97, 0.05]);
  cylinder(cup, 0.04, 0.036, 0.08, m.coral, [0, 0.04, 0], true, 12);
  m.books.slice(0, 5).forEach((mat, i) => box(cup, 0.025, 0.12, 0.003, mat, [-0.02 + i * 0.01, 0.1, (i - 2) * 0.008], false).rotation.z = (i - 2) * 0.12);
  stack(g, m, m.books, [0.02, 0.97, 0.32], 3, 61, 0.1);
  const gift = group(g, 'Wrapped book', [0.1, 0.97, -0.08]); gift.rotation.y = 0.4;
  box(gift, 0.2, 0.05, 0.15, m.paper, [0, 0.025, 0]); box(gift, 0.21, 0.052, 0.02, m.coral, [0, 0.026, 0], false); box(gift, 0.02, 0.052, 0.16, m.coral, [0, 0.026, 0], false);
  sphere(gift, [0.03, 0.015, 0.02], m.coral, [0, 0.055, 0], [8, 5]);
  return g;
}

function Spinner(p, m, B, pos, turn) {
  const g = group(p, 'Pocket-book spinner', pos); g.rotation.y = turn;
  cylinder(g, 0.2, 0.22, 0.04, m.steel, [0, 0.02, 0], true, 18);
  rod(g, [0, 0, 0], [0, 1.62, 0], 0.016, m.steel, 8);
  cylinder(g, 0.04, 0.04, 0.05, m.coral, [0, 1.64, 0], true, 10);
  for (let t = 0; t < 3; t++) {
    const y = 0.35 + t * 0.42;
    for (let f = 0; f < 4; f++) {
      const face = group(g, 'Rack face', [0, y, 0]); face.rotation.y = f * Math.PI / 2;
      box(face, 0.36, 0.015, 0.1, m.steel, [0, 0, 0.18], false);
      box(face, 0.36, 0.05, 0.01, m.steel, [0, 0.04, 0.23], false);
      for (let i = 0; i < 3; i++) faceOut(face, m, B, 0.1, 0.16, 0.018, t * 5 + f * 3 + i, [-0.12 + i * 0.12, 0.01, 0.2], -0.18);
    }
  }
  return g;
}
