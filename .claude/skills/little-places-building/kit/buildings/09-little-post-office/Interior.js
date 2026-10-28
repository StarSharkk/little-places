import * as THREE from 'three';
import { group, box, plate, rod, tube, cylinder, sphere, cone } from './primitives.js';
import { G, slab, hallShape, rectShape, inked, upright } from './Shell.js';
import { plant } from '../shared/props.js';
import { Parcel } from './Props.js';

// Inside: a wooden floor, the service counter with its sorting cabinet behind, PO boxes, stamps and postcards in the
// glass hall, a writing desk for forms, parcels waiting to go, warm pendant lamps.
export function Interior(root, m, atlas) {
  const { FLOOR: F, MID, F2, HALL, MAIN, TOP, TOWER } = G, g = group(root, 'Post office interior'); g.userData.noShadow = true;   // inside the walls
  slab(g, hallShape(0.15, 0), F, 0.015, m.floorWood, false); slab(g, rectShape(MAIN.x0, MAIN.x1 - 0.15, MAIN.z0 + 0.15, MAIN.z1 - 0.15), F, 0.015, m.floorWood, false);
  for (let x = HALL.x0 + 0.6; x < MAIN.x1 - 0.2; x += 0.32) {
    const z1 = x < HALL.x0 + HALL.R ? (HALL.z1 - HALL.R) + Math.sqrt(Math.max(0, (HALL.R - 0.25) ** 2 - (x - (HALL.x0 + HALL.R)) ** 2)) : MAIN.z1 - 0.2;
    if (z1 > MAIN.z0 + 0.3) box(g, 0.012, 0.004, z1 - MAIN.z0 - 0.25, m.walnut, [x, F + 0.017, (MAIN.z0 + 0.2 + z1) / 2]);
  }
  // ---- Service counter facing the entrance: register, parcel scale, stamp pad, letter tray, bell ---------------------
  const c = group(g, 'Service counter', [0.9, F, 0.3]);
  box(c, 2.1, 0.92, 0.6, m.wood, [0, 0.46, 0]); box(c, 2.2, 0.05, 0.7, m.walnut, [0, 0.945, 0.02]); box(c, 2.14, 0.08, 0.62, m.walnut, [0, 0.04, 0]);
  for (let i = 0; i < 3; i++) plate(c, 0.6, 0.6, 0.02, 0.03, m.woodLight, [-0.68 + i * 0.68, 0.46, 0.305]);
  atlas.attach(c, 'counter', 0.52, 0.26, [0, 0.46, 0.318]);
  const reg = group(c, 'Register', [-0.6, 0.97, -0.08]);
  plate(reg, 0.34, 0.1, 0.28, 0.03, m.iron, [0, 0.05, 0]); const sc = box(reg, 0.28, 0.2, 0.03, m.iron, [0, 0.22, -0.08]); sc.rotation.x = -0.3;
  box(reg, 0.24, 0.15, 0.005, m.signGlow, [0, 0.225, -0.062], false).rotation.x = -0.3;
  const scale = group(c, 'Parcel scale', [0.15, 0.97, 0.05]);
  box(scale, 0.36, 0.05, 0.3, m.steel, [0, 0.025, 0]); box(scale, 0.32, 0.015, 0.26, m.chrome, [0, 0.058, 0]); box(scale, 0.16, 0.08, 0.03, m.steelDark, [0, 0.04, 0.17]); box(scale, 0.12, 0.04, 0.005, m.signGlow, [0, 0.045, 0.186], false);
  Parcel(scale, m, atlas, [0, 0.066, 0], [0.24, 0.14, 0.18], 0.2);
  box(c, 0.16, 0.025, 0.1, m.iron, [0.6, 0.982, 0.05]); box(c, 0.13, 0.012, 0.08, m.postRed, [0.6, 0.998, 0.05], false);
  const stamp = group(c, 'Rubber stamp', [0.78, 0.97, 0.05]); cylinder(stamp, 0.025, 0.03, 0.06, m.walnut, [0, 0.07, 0], true, 10); cylinder(stamp, 0.035, 0.035, 0.03, m.iron, [0, 0.015, 0], true, 10);
  const tray = group(c, 'Letter tray', [-0.15, 0.97, -0.12]); box(tray, 0.36, 0.06, 0.26, m.woodLight, [0, 0.03, 0]);
  for (let i = 0; i < 4; i++) box(tray, 0.3, 0.008, 0.2, i % 2 ? m.paper : m.label, [0.01 * i, 0.04 + i * 0.01, 0], false);
  inked(cone(c, 0.05, 0.05, m.brass, [0.95, 1.0, 0.18], false, 14), m);
  plant(c, m, [-0.95, 0.97, 0.12], { r: 0.07, h: 0.1, kind: 'flowers' });
  // ---- Sorting cabinet behind the counter: pigeonholes with letters ------------------------------------------------
  const sc2 = group(g, 'Sorting cabinet', [0.9, F, MAIN.z0 + 0.38]);
  box(sc2, 2.2, 2.0, 0.04, m.walnut, [0, 1.0, -0.15]); box(sc2, 2.2, 0.9, 0.36, m.wood, [0, 0.45, 0]);
  const cols = 7, rows = 5, cw = 2.1 / cols;
  for (let k = 0; k <= cols; k++) box(sc2, 0.02, 1.0, 0.32, m.wood, [-1.05 + k * cw, 1.4, -0.0]);
  for (let r = 0; r <= rows; r++) box(sc2, 2.12, 0.02, 0.32, m.wood, [0, 0.9 + r * 0.2, 0]);
  let s = 3; const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) if (rnd() > 0.35) for (let i = 0; i < 1 + Math.floor(rnd() * 3); i++) box(sc2, cw * 0.7, 0.012, 0.22, [m.paper, m.label, m.kraftLight][(r + k + i) % 3], [-1.05 + (k + 0.5) * cw, 0.92 + r * 0.2 + i * 0.014, 0.02], false);
  // ---- Glass hall: PO boxes on the back wall, stamp board and clock on the left wall, postcard spinner, writing desk ------
  const po = group(g, 'PO boxes', [-2.25, F, HALL.z0 + 0.3]);
  box(po, 2.0, 1.75, 0.36, m.wood, [0, 0.875, 0]); box(po, 2.06, 0.05, 0.4, m.walnut, [0, 1.775, 0]);
  atlas.attach(po, 'pobox', 1.84, 0.92, [0, 1.15, 0.183]); box(po, 1.9, 0.5, 0.01, m.woodLight, [0, 0.38, 0.183]);
  const sb = group(g, 'Stamp display', [HALL.x0 + 0.13, F + 1.55, -1.0]); sb.rotation.y = Math.PI / 2;
  plate(sb, 1.0, 0.76, 0.04, 0.03, m.walnut, [0, 0, 0]); atlas.attach(sb, 'stamps', 0.92, 0.69, [0, 0, 0.022]);
  const ck = group(g, 'Hall clock', [-2.25, F + 2.4, HALL.z0 + 0.13]);
  inked(upright(cylinder(ck, 0.2, 0.2, 0.05, m.walnut, [0, 0, 0], false, 28)), m); atlas.disc(ck, 'clock', 0.17, [0, 0, 0.027]);
  const sp = group(g, 'Postcard spinner', [-2.75, F, 0.55]); sp.rotation.y = 0.4;
  cylinder(sp, 0.18, 0.2, 0.04, m.steelDark, [0, 0.02, 0], true, 16); rod(sp, [0, 0, 0], [0, 1.6, 0], 0.016, m.steelDark, 8);
  for (const y of [0.6, 0.98, 1.36]) for (let f = 0; f < 4; f++) { const face = group(sp, 'Cards', [0, y, 0]); face.rotation.y = f * Math.PI / 2; box(face, 0.3, 0.012, 0.05, m.steel, [0, -0.17, 0.12], false); atlas.attach(face, 'postcards', 0.24, 0.34, [0, 0, 0.13]).rotation.x = -0.12; }
  const desk = group(g, 'Writing desk', [-1.55, F, 1.05]);
  box(desk, 1.1, 0.05, 0.5, m.wood, [0, 1.02, 0]); for (const x of [-0.48, 0.48]) box(desk, 0.06, 1.0, 0.44, m.walnut, [x, 0.5, 0]);
  box(desk, 1.0, 0.03, 0.4, m.woodLight, [0, 0.3, 0]);
  for (let i = 0; i < 3; i++) box(desk, 0.2, 0.004, 0.28, m.paper, [-0.3 + i * 0.28, 1.048 + i * 0.002, 0], false);
  for (const x of [-0.3, 0.25]) { rod(desk, [x + 0.12, 1.05, -0.1], [x + 0.02, 1.06, 0.05], 0.007, m.ink, 4); tube(desk, [[x + 0.12, 1.05, -0.1], [x + 0.2, 1.03, -0.2], [x + 0.18, 1.04, -0.24]], 0.003, m.steelDark); }
  box(desk, 0.36, 0.32, 0.18, m.woodLight, [0, 1.2, -0.17]); for (let i = 0; i < 3; i++) box(desk, 0.1, 0.22, 0.02, [m.paper, m.label, m.kraftLight][i], [-0.11 + i * 0.11, 1.26, -0.1], false);
  // ---- Parcels waiting by the right wall, tape, bubble wrap, the postal banner and a big plant ----------------------
  [[1.95, 0, -1.0, [0.5, 0.36, 0.4], 0.1], [1.92, 0.36, -1.02, [0.38, 0.26, 0.32], -0.2], [1.6, 0, -0.95, [0.32, 0.22, 0.28], 0.3], [1.98, 0, -0.45, [0.4, 0.3, 0.34], -0.1]].forEach(([x, y, z, size, t]) => Parcel(g, m, atlas, [x, F + y, z], size, t));
  const tp = cylinder(g, 0.07, 0.07, 0.05, m.tape, [1.62, F + 0.25, -0.95], true, 16); tp.rotation.x = Math.PI / 2;
  const bw = cylinder(g, 0.13, 0.13, 0.6, m.paper, [2.05, F + 0.13, 0.25], true, 16); bw.rotation.z = Math.PI / 2;
  const flag = atlas.attach(g, 'flag', 0.5, 0.75, [-0.35, F + 2.15, MAIN.z0 + 0.13]);
  rod(g, [-0.65, F + 2.55, MAIN.z0 + 0.15], [-0.05, F + 2.55, MAIN.z0 + 0.15], 0.012, m.brass, 6);
  plant(g, m, [HALL.x0 + 0.45, F, -1.55], { r: 0.2, h: 0.34, kind: 'leafy' });
  // ---- warm pendant lamps ----------------------------------------------------------------------------------------
  const pendant = (x, y, z) => {
    rod(g, [x, y, z], [x, y - 0.62, z], 0.006, m.ink, 4);
    inked(cone(g, 0.17, 0.15, m.frame, [x, y - 0.69, z], false, 20), m);
    sphere(g, [0.05, 0.05, 0.05], m.glow, [x, y - 0.78, z], [10, 6]);
  };
  for (const [x, z] of [[-2.4, 0.6], [-1.3, 0.95], [0.4, 0.85], [1.4, 0.85]]) pendant(x, MID, z);
  Upstairs(g, m, atlas);
  return g;
}

// Upstairs: the floor slab between the storeys, a sorting room behind the curved glass, and the postmaster's office
// behind the two front windows. Kept light: simple boxes, the same woods and papers as downstairs.
function Upstairs(p, m, atlas) {
  const { MID, F2, TOP, HALL, MAIN, TOWER } = G, g = group(p, 'Upstairs');
  slab(g, hallShape(0.1, 0), MID, F2 - MID - 0.015, m.cream, false); slab(g, rectShape(MAIN.x0, MAIN.x1 - 0.1, MAIN.z0 + 0.1, MAIN.z1 - 0.1), MID, F2 - MID - 0.015, m.cream, false);
  slab(g, hallShape(0.15, 0), F2 - 0.015, 0.015, m.floorWood, false); slab(g, rectShape(MAIN.x0, MAIN.x1 - 0.15, MAIN.z0 + 0.15, MAIN.z1 - 0.15), F2 - 0.015, 0.015, m.floorWood, false);
  // ---- sorting room in the hall: a long table with bundles, pigeonholes on the back wall, mail sacks --------------
  const sr = group(g, 'Sorting room', [-2.35, F2, 0]);
  const tb = group(sr, 'Sorting table', [0, 0, 0.1]);
  box(tb, 1.7, 0.05, 0.8, m.wood, [0, 0.88, 0]); for (const [x, z] of [[-0.78, -0.33], [0.78, -0.33], [-0.78, 0.33], [0.78, 0.33]]) box(tb, 0.06, 0.86, 0.06, m.walnut, [x, 0.43, z]);
  box(tb, 1.6, 0.03, 0.7, m.woodLight, [0, 0.25, 0]);
  for (const [x, z, n] of [[-0.55, -0.1, 4], [-0.15, 0.15, 6], [0.3, -0.12, 3], [0.6, 0.18, 5]]) for (let i = 0; i < n; i++) box(tb, 0.22, 0.012, 0.15, i % 2 ? m.paper : m.label, [x + (i % 2) * 0.01, 0.912 + i * 0.012, z], false);
  box(tb, 0.36, 0.1, 0.24, m.kraftLight, [0.05, 0.955, -0.2]);
  const ph = group(sr, 'Pigeonholes', [-0.2, 0, HALL.z0 + 0.32]);
  box(ph, 1.8, 1.3, 0.04, m.walnut, [0, 0.65, -0.12]);
  for (let k = 0; k <= 6; k++) box(ph, 0.02, 0.9, 0.26, m.wood, [-0.9 + k * 0.3, 0.75, 0]);
  for (let r = 0; r <= 3; r++) box(ph, 1.82, 0.02, 0.26, m.wood, [0, 0.3 + r * 0.3, 0]);
  box(ph, 1.84, 0.3, 0.3, m.wood, [0, 0.15, 0]);
  let s = 11; const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  for (let r = 0; r < 3; r++) for (let k = 0; k < 6; k++) if (rnd() > 0.3) box(ph, 0.2, 0.012 + rnd() * 0.05, 0.2, [m.paper, m.label, m.kraftLight][(r + k) % 3], [-0.75 + k * 0.3, 0.33 + r * 0.3, 0.02], false);
  for (const [x, z, sc] of [[-1.05, -0.95, 1], [-0.8, -1.2, 0.8]]) { inked(sphere(sr, [0.22 * sc, 0.3 * sc, 0.2 * sc], m.paper, [x, 0.3 * sc, z], [10, 7]), m); box(sr, 0.06, 0.06, 0.06, m.kraft, [x, 0.6 * sc, z], false); }
  // ---- the office behind the front windows: desk with a lamp and papers, a chair, filing cabinet, bookshelf ---------
  const of = group(g, 'Upstairs office', [0, F2, 0]);
  const desk = group(of, 'Office desk', [1.5, 0, -0.35]); desk.rotation.y = -Math.PI / 2;
  box(desk, 1.2, 0.05, 0.6, m.wood, [0, 0.76, 0]); box(desk, 0.4, 0.74, 0.56, m.woodLight, [0.38, 0.37, 0]); for (const z of [-0.26, 0.26]) box(desk, 0.05, 0.74, 0.05, m.walnut, [-0.55, 0.37, z]);
  for (let i = 0; i < 3; i++) box(desk, 0.3, 0.012, 0.004, m.walnut, [0.38, 0.2 + i * 0.22, 0.282], false);
  for (let i = 0; i < 4; i++) box(desk, 0.22, 0.006, 0.3, m.paper, [-0.2 + i * 0.03, 0.788 + i * 0.006, 0.05], false);
  const lamp = group(desk, 'Desk lamp', [0.42, 0.785, -0.15]);
  cylinder(lamp, 0.07, 0.08, 0.02, m.frame, [0, 0.01, 0], false, 12); rod(lamp, [0, 0.02, 0], [0.04, 0.32, 0], 0.01, m.frame, 4);
  inked(cone(lamp, 0.09, 0.1, m.frame, [0.06, 0.34, 0.05], false, 14), m); sphere(lamp, [0.035, 0.035, 0.035], m.glow, [0.06, 0.29, 0.05], [8, 5]);
  const chair = group(desk, 'Chair', [0, 0, 0.55]); box(chair, 0.42, 0.05, 0.4, m.walnut, [0, 0.45, 0]); box(chair, 0.42, 0.45, 0.04, m.walnut, [0, 0.7, 0.18]); for (const [x, z] of [[-0.18, -0.16], [0.18, -0.16], [-0.18, 0.16], [0.18, 0.16]]) box(chair, 0.04, 0.45, 0.04, m.walnut, [x, 0.22, z]);
  const fc = group(of, 'Filing cabinet', [1.95, 0, MAIN.z0 + 0.35]);
  box(fc, 0.5, 1.0, 0.55, m.steel, [0, 0.5, 0]); for (let i = 0; i < 3; i++) { box(fc, 0.44, 0.28, 0.02, m.chrome, [0, 0.18 + i * 0.31, 0.28], false); box(fc, 0.12, 0.025, 0.02, m.steelDark, [0, 0.24 + i * 0.31, 0.295], false); }
  Parcel(fc, m, atlas, [0, 1.0, 0], [0.34, 0.2, 0.3], 0.2, false);
  const bs = group(of, 'Bookshelf', [-0.05, 0, MAIN.z0 + 0.25]);
  box(bs, 1.1, 1.45, 0.04, m.walnut, [0, 0.725, -0.13]); for (const x of [-0.55, 0.55]) box(bs, 0.04, 1.45, 0.3, m.walnut, [x, 0.725, 0]);
  const cols = [m.stampBlue, m.postRed, m.stampGreen, m.shirtYellow, m.kraft, m.paper];
  box(bs, 1.1, 0.03, 0.3, m.wood, [0, 1.43, 0]);
  for (let r = 0; r < 3; r++) { box(bs, 1.1, 0.03, 0.3, m.wood, [0, 0.05 + r * 0.46, 0]); for (let i = 0; i < 7; i++) { if ((r * 7 + i) % 5 === 4) continue; const h = 0.26 + ((r + i) % 3) * 0.04; box(bs, 0.1, h, 0.22, cols[(r * 3 + i) % cols.length], [-0.42 + i * 0.13, 0.07 + r * 0.46 + h / 2, 0.01], false); } }
  [[-0.35, 0, 0.7, [0.44, 0.3, 0.36], 0.2], [-0.32, 0.3, 0.68, [0.32, 0.22, 0.28], -0.3]].forEach(([x, y, z, size, t]) => Parcel(of, m, atlas, [x, y, z], size, t));
  plant(of, m, [2.0, 0, 0.9], { r: 0.17, h: 0.3, kind: 'leafy' });
  // ceiling lamps upstairs
  for (const [x, z] of [[-2.35, 0.1], [1.1, -0.4]]) { rod(g, [x, TOP, z], [x, TOP - 0.2, z], 0.006, m.ink, 4); inked(cone(g, 0.15, 0.13, m.frame, [x, TOP - 0.26, z], false, 18), m); sphere(g, [0.045, 0.045, 0.045], m.glow, [x, TOP - 0.34, z], [8, 5]); }
  return g;
}
