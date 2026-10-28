import * as THREE from 'three';
import { group, box, plate, rod, tube, cylinder, sphere, cone } from './primitives.js';
import { hull } from './outline.js';
import { G, H, rng } from './Building.js';
import { Washer } from './Washer.js';

const upright = (o) => ((o.rotation.x = Math.PI / 2), o);   // turn before inking: the ink copy takes the transform it has
const inked = (o, m) => (hull(o, m.hull), o);

// A plastic laundry basket with slotted sides and a heap of clothes.
export function Basket(p, m, pos, { w = 0.5, d = 0.36, h = 0.26, mat = m.basketBlue, full = true, turn = 0 } = {}) {
  const g = group(p, 'Laundry basket', pos); g.rotation.y = turn;
  box(g, w, 0.025, d, mat, [0, 0.0125, 0]);
  for (const s of [-1, 1]) { box(g, w, h, 0.025, mat, [0, h / 2, s * (d / 2 - 0.0125)]); box(g, 0.025, h, d, mat, [s * (w / 2 - 0.0125), h / 2, 0]); }
  for (let i = 0; i < 4; i++) for (const s of [-1, 1]) box(g, 0.05, h * 0.5, 0.004, m.paper, [-w * 0.3 + i * w * 0.2, h * 0.5, s * (d / 2 + 0.001)], false);
  box(g, w + 0.02, 0.03, d + 0.02, mat, [0, h, 0]);
  if (full) [m.shirtPink, m.shirtWhite, m.shirtBlue, m.shirtYellow].forEach((c, i) => sphere(g, [w * 0.24, 0.07, d * 0.28], c, [(i % 2 - 0.5) * w * 0.35, h - 0.02 + (i > 1 ? 0.05 : 0), (i < 2 ? -1 : 1) * d * 0.12], [10, 6]));
  return g;
}
// A neat stack of folded towels
export function Towels(p, m, pos, colours, turn = 0) {
  const g = group(p, 'Folded towels', pos); g.rotation.y = turn;
  colours.forEach((c, i) => { box(g, 0.32, 0.055, 0.24, c, [(i % 2) * 0.01, 0.0275 + i * 0.058, 0]); box(g, 0.004, 0.04, 0.24, m.paper, [0.162, 0.0275 + i * 0.058, 0], false); });
  return g;
}
// Detergent and softener bottles: body, shoulder, cap, label
export function Bottle(p, m, pos, mat, s = 1) {
  const g = group(p, 'Detergent bottle', pos); g.scale.setScalar(s);
  box(g, 0.1, 0.16, 0.07, mat, [0, 0.08, 0], false);
  box(g, 0.06, 0.04, 0.05, mat, [0.012, 0.18, 0], false); cylinder(g, 0.022, 0.022, 0.03, m.paper, [0.012, 0.215, 0], false, 8);
  box(g, 0.07, 0.07, 0.004, m.paper, [0, 0.08, 0.037], false);
  return g;
}

// Inside: tiled floor, a row of washers with stacked dryers, the folding table, the waiting corner, shelves and lamps.
export function Interior(root, m, atlas, plant) {
  const { FLOOR: F, X1, Z1, R } = G, g = group(root, 'Laundry interior'); g.userData.noShadow = true;   // inside the walls
  // floor tiles, skipping the ones outside the glass curve
  const ccx = X1 - R, ccz = Z1 - R;
  for (let x = -2.65; x < 2.8; x += 0.5) for (let z = -1.75; z < 1.9; z += 0.5) {
    if (x > ccx && z > ccz && Math.hypot(x - ccx, z - ccz) > R - 0.45) continue;
    box(g, 0.49, 0.014, 0.49, Math.round((x + 2.65) * 2 + (z + 1.75) * 2) % 2 ? m.tile : m.paper, [x, F + 0.007, z], false);
  }
  // ---- Washing machines: five washers in three colours; the butter one in the middle of the window is live ------
  const colours = [m.washBlue, m.washPink, m.washButter, m.washBlue, m.washPink];
  let live = null;
  colours.forEach((body, i) => {
    // an island row in the middle of the room, so it shows through the shop window from the street
    const w = Washer(g, m, { pos: [-1.95 + i * 0.73, F, -0.35], body, live: i === 2, name: i === 2 ? 'Live washer' : 'Washer', screen: i === 2 ? m.screenIdle : m.screenRun, led: i === 2 ? m.led : m.ledOn, clothes: i === 2 ? undefined : [[m.shirtYellow, m.shirtWhite], [m.shirtPink, m.shirtBlue]][i % 2] });
    if (i === 2) live = w;
  });
  // stacked dryers: cream cabinets two high, doors a little higher
  for (const x of [1.36, 2.1]) for (const k of [0, 1]) Washer(g, m, { pos: [x, F + k * 0.74, -1.62], w: 0.7, h: 0.72, d: 0.62, r: 0.19, doorY: 0.34, body: m.washCream, name: 'Dryer', solid: true, glass: m.dryerGlass });
  box(g, 1.52, 0.05, 0.64, m.steel, [1.73, F + 1.475, -1.62]);
  // washing instructions and the process board above the machines, a clock on the left wall
  plate(g, 0.62, 0.62, 0.025, 0.03, m.frame, [-1.7, F + 1.75, -1.985]); atlas.attach(g, 'howto', 0.56, 0.56, [-1.7, F + 1.75, -1.97]);
  plate(g, 1.26, 0.5, 0.025, 0.03, m.walnut, [-0.25, F + 1.82, -1.985]); atlas.attach(g, 'steps', 1.18, 0.43, [-0.25, F + 1.82, -1.97]);
  plate(g, 0.5, 0.5, 0.025, 0.03, m.walnut, [1.73, F + 2.2, -1.985]); atlas.attach(g, 'poster', 0.44, 0.44, [1.73, F + 2.2, -1.97]);
  const clock = group(g, 'Wall clock', [-2.88, F + 2.35, 0.25]); clock.rotation.y = Math.PI / 2;
  inked(upright(cylinder(clock, 0.21, 0.21, 0.05, m.frame, [0, 0, 0], true, 28)), m); atlas.disc(clock, 'clock', 0.18, [0, 0, 0.027]);

  // ---- Folding table in the middle: baskets, towels, detergent ------------------------------------------------
  const t = group(g, 'Folding table', [-0.6, F, 1.08]);
  box(t, 1.7, 0.06, 0.72, m.wood, [0, 0.86, 0]); box(t, 1.6, 0.1, 0.62, m.walnut, [0, 0.78, 0]);
  for (const [x, z] of [[-0.76, -0.28], [0.76, -0.28], [-0.76, 0.28], [0.76, 0.28]]) box(t, 0.07, 0.78, 0.07, m.walnut, [x, 0.39, z]);
  box(t, 1.5, 0.03, 0.54, m.woodLight, [0, 0.22, 0]);
  Basket(t, m, [-0.5, 0.89, -0.05], { mat: m.basketBlue });
  Basket(t, m, [0.55, 0.89, 0.05], { mat: m.basketPink, w: 0.42, d: 0.32, h: 0.22, turn: 0.2 });
  Towels(t, m, [0.0, 0.89, 0.05], [m.shirtWhite, m.shirtBlue, m.shirtWhite, m.shirtPink]);
  Towels(t, m, [0.25, 0.89, -0.2], [m.shirtYellow, m.shirtMint, m.shirtWhite], 0.15);
  Bottle(t, m, [-0.15, 0.89, -0.28], m.bottleBlue); Bottle(t, m, [-0.02, 0.89, -0.3], m.bottlePink, 0.85);
  Basket(t, m, [0.0, 0.235, 0.0], { mat: m.basketPink, w: 0.46, d: 0.34, h: 0.22, full: false });
  Towels(t, m, [-0.6, 0.235, 0.05], [m.shirtWhite, m.shirtWhite, m.shirtBlue]);

  // ---- Waiting corner: bench along the left wall, stools, magazine rack, a big plant -----------------------------
  const bench = group(g, 'Waiting bench', [-2.62, F, 0.85]); bench.rotation.y = Math.PI / 2;
  box(bench, 1.5, 0.06, 0.42, m.wood, [0, 0.44, 0]); for (const x of [-0.65, 0.65]) box(bench, 0.06, 0.41, 0.36, m.walnut, [x, 0.205, 0]);
  box(bench, 1.5, 0.3, 0.05, m.wood, [0, 0.75, -0.2]); for (const x of [-0.65, 0.65]) box(bench, 0.05, 0.36, 0.05, m.walnut, [x, 0.6, -0.2]);
  box(bench, 0.4, 0.07, 0.32, m.shirtBlue, [-0.35, 0.505, 0.02]);
  for (const [x, z, mat] of [[-1.85, 1.15, m.coral], [0.55, 1.6, m.frame]]) {
    const s = group(g, 'Stool', [x, F, z]); inked(cylinder(s, 0.17, 0.17, 0.05, mat, [0, 0.5, 0], true, 20), m);
    for (const a of [0.4, 2.5, 4.6]) rod(s, [Math.sin(a) * 0.14, 0, Math.cos(a) * 0.14], [Math.sin(a) * 0.1, 0.48, Math.cos(a) * 0.1], 0.016, m.walnut, 6);
  }
  const rack = group(g, 'Magazine rack', [-2.7, F, -0.45]); rack.rotation.y = Math.PI / 2;
  box(rack, 0.6, 0.9, 0.06, m.walnut, [0, 0.45, -0.1]); for (const y of [0.35, 0.7]) { box(rack, 0.6, 0.03, 0.16, m.wood, [0, y, 0]); box(rack, 0.6, 0.12, 0.02, m.wood, [0, y + 0.06, 0.07]); }
  for (const y of [0.37, 0.72]) { const mg = atlas.attach(rack, 'mag', 0.54, 0.27, [0, y + 0.13, 0.0]); mg.rotation.x = -0.25; }
  plant(g, m, [-2.6, F, -1.75], { r: 0.2, h: 0.34, kind: 'leafy' });
  // back counter under the posters: baskets waiting, towels, a little sink
  const bc = group(g, 'Back counter', [-1.05, F, -1.72]);
  box(bc, 2.6, 0.82, 0.5, m.wood, [0, 0.41, 0]); box(bc, 2.7, 0.05, 0.56, m.walnut, [0, 0.845, 0]);
  for (let i = 0; i < 4; i++) plate(bc, 0.56, 0.6, 0.02, 0.03, m.woodLight, [-0.96 + i * 0.64, 0.42, 0.26]);
  Basket(bc, m, [-0.8, 0.87, 0], { mat: m.basketPink, w: 0.44, d: 0.32, h: 0.22 }); Basket(bc, m, [-0.25, 0.87, 0.02], { mat: m.basketBlue, w: 0.44, d: 0.32, h: 0.22, full: false });
  Towels(bc, m, [0.3, 0.87, 0], [m.shirtWhite, m.shirtPink, m.shirtWhite, m.shirtBlue]);
  box(bc, 0.5, 0.06, 0.36, m.steel, [0.95, 0.85, 0]); rod(bc, [0.95, 0.88, -0.15], [0.95, 1.1, -0.15], 0.015, m.chrome, 8); rod(bc, [0.95, 1.1, -0.15], [0.95, 1.1, -0.04], 0.012, m.chrome, 6);
  plant(g, m, [2.55, F, -0.95], { r: 0.15, h: 0.26, kind: 'bush' });

  // ---- Right wall: detergent shelves, the coin changer and a clothes rail on wheels ------------------------------
  for (const [y, seed] of [[1.45, 1], [1.95, 2]]) {
    const s = group(g, 'Detergent shelf', [2.78, F + y, -0.35]); s.rotation.y = -Math.PI / 2;
    box(s, 1.1, 0.035, 0.24, m.wood, [0, 0, 0]); for (const x of [-0.45, 0.45]) box(s, 0.03, 0.12, 0.18, m.walnut, [x, -0.08, -0.02]);
    const r = rng(seed); for (let i = 0; i < 6; i++) Bottle(s, m, [-0.42 + i * 0.17, 0.018, 0.0], [m.bottleBlue, m.bottlePink, m.bottleGreen, m.bottleYellow][Math.floor(r() * 4)], 0.8 + r() * 0.25);
  }
  const ch = group(g, 'Coin changer', [2.62, F, 0.42]); ch.rotation.y = -Math.PI / 2;
  plate(ch, 0.52, 1.3, 0.42, 0.04, m.steel, [0, 0.65, 0]);
  box(ch, 0.36, 0.22, 0.012, m.screenRun, [0, 1.05, 0.215], false); box(ch, 0.2, 0.03, 0.02, m.ink, [0, 0.8, 0.22], false);
  box(ch, 0.24, 0.1, 0.06, m.steelDark, [0, 0.45, 0.22]); atlas.attach(ch, 'price', 0.3, 0.15, [0, 1.25, 0.212]);
  const cr = group(g, 'Clothes rail', [1.15, F, 0.75]);
  for (const x of [-0.5, 0.5]) { rod(cr, [x, 0.08, 0], [x, 1.55, 0], 0.016, m.chrome, 8); box(cr, 0.06, 0.03, 0.4, m.steelDark, [x, 0.06, 0]); for (const z of [-0.17, 0.17]) inked(upright(cylinder(cr, 0.035, 0.035, 0.03, m.rubber, [x, 0.035, z], true, 12)), m); }
  rod(cr, [-0.5, 1.55, 0], [0.5, 1.55, 0], 0.016, m.chrome, 8);
  [m.shirtBlue, m.shirtPink, m.shirtWhite, m.shirtYellow].forEach((c, i) => { const x = -0.33 + i * 0.22; tube(cr, [[x - 0.12, 1.42, 0], [x, 1.53, 0], [x + 0.12, 1.42, 0]], 0.006, m.chrome); box(cr, 0.04, 0.5, 0.3, c, [x, 1.17, 0]); });

  // ---- three warm pendant lamps over the table ----------------------------------------------------------------
  for (const [x, z] of [[-1.3, 1.08], [-0.6, 1.08], [0.1, 1.08], [-0.85, -0.35], [0.6, -0.35]]) {
    rod(g, [x, G.TOP, z], [x, G.TOP - 0.6, z], 0.006, m.ink, 4);
    inked(cone(g, 0.17, 0.15, m.frame, [x, G.TOP - 0.67, z], true, 20), m);
    sphere(g, [0.05, 0.05, 0.05], m.glow, [x, G.TOP - 0.75, z], [10, 6]);
  }
  return { group: g, live };
}
