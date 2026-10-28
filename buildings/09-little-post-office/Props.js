import * as THREE from 'three';
import { group, box, plate, rod, tube, cylinder, sphere, cone, ring, mesh, cached } from './primitives.js';
import { G, inked, upright } from './Shell.js';
import { ABoard } from './ABoard.js';
import { plant, Bicycle, Bench, CherryTree, StreetLamp } from '../shared/props.js';

// A trailing vine: stem with leaves along it
export function vine(p, m, a, b, leaves = 6, seed = 0) {
  const mid = [(a[0] + b[0]) / 2 + 0.04 * Math.cos(seed), (a[1] + b[1]) / 2, (a[2] + b[2]) / 2 + 0.04 * Math.sin(seed)];
  tube(p, [a, mid, b], 0.008, m.leafDeep);
  const c = new THREE.CatmullRomCurve3([a, mid, b].map(v => new THREE.Vector3(...v)));
  for (let i = 1; i <= leaves; i++) { const v = c.getPoint(i / (leaves + 0.3)); sphere(p, [0.055, 0.035, 0.055], (i + seed) % 2 ? m.leaf : m.leafLight, [v.x + (i % 2 ? 0.03 : -0.03), v.y, v.z], [6, 4]); }
}
// A parcel: kraft box, a band of tape, a printed label
export function Parcel(p, m, atlas, pos, [w, h, d] = [0.3, 0.2, 0.24], turn = 0, labelled = true) {
  const g = group(p, 'Parcel', pos); g.rotation.y = turn;
  box(g, w, h, d, m.kraft, [0, h / 2, 0]);
  box(g, w + 0.004, 0.004, 0.05, m.tape, [0, h + 0.001, 0], false); box(g, 0.05, h + 0.004, d + 0.004, m.tape, [0, h / 2, 0], false);
  if (labelled) atlas.attach(g, 'label', w * 0.42, h * 0.42, [-w * 0.18, h * 0.55, d / 2 + 0.003]);
  return g;
}

// ---- the red post box (interactive) -------------------------------------------------------------------------------
// Local origin on the ground, slot facing +z. The slot is a dark recess with a little flap that swings in.
const MB = { r: 0.28, h: 1.02, base: 0.12, slotY: 0.96 };
function PostBox(p, m, atlas, pos) {
  const { r, h, base, slotY } = MB, root = group(p, 'Post box', pos);
  const body = group(root, 'Send a letter'); body.userData.action = 'postLetter';
  box(body, 0.62, base, 0.62, m.iron, [0, base / 2, 0]); box(body, 0.66, 0.03, 0.66, m.steelDark, [0, base + 0.015, 0]);
  inked(cylinder(body, r, r * 1.02, h, m.postRed, [0, base + h / 2, 0], false, 28), m);
  inked(upright(ring(body, r + 0.012, 0.02, m.postDark, [0, base + 0.08, 0], 28, 6)), m);
  inked(upright(ring(body, r + 0.015, 0.028, m.postDark, [0, base + h, 0], 28, 6)), m);
  inked(sphere(body, [r + 0.02, 0.2, r + 0.02], m.postRed, [0, base + h + 0.01, 0], [20, 10]), m);
  // slot with a hood, POST band, 〒 mark, collection door with a keyhole and handle
  box(body, 0.3, 0.04, 0.06, m.slot, [0, slotY, r - 0.015], false);
  box(body, 0.36, 0.03, 0.08, m.postDark, [0, slotY + 0.045, r + 0.0]);
  atlas.band(body, 'post', r + 0.004, 0.13, 1.5, [0, slotY - 0.13, 0]);
  atlas.disc(body, 'mark', 0.1, [0, slotY - 0.33, r + 0.004]);
  const door = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.006, r + 0.006, 0.36, 20, 1, true, -0.55, 1.1), m.postDark); door.position.set(0, base + 0.27, 0); door.userData.outline = false; body.add(door);
  upright(cylinder(body, 0.018, 0.018, 0.02, m.brass, [0, base + 0.36, r + 0.012], false, 10)); box(body, 0.012, 0.03, 0.006, m.ink, [0, base + 0.36, r + 0.024], false);
  box(body, 0.12, 0.025, 0.03, m.brass, [0, base + 0.2, r + 0.015]);
  // moving parts: the slot flap and the letter
  const flapHinge = group(root, 'Slot flap hinge', [0, slotY + 0.02, r - 0.005]); const flap = group(flapHinge, 'Slot flap');
  box(flap, 0.28, 0.04, 0.01, m.postDark, [0, -0.02, 0]);
  const letter = group(root, 'Letter', [0, 1.25, 0.85]);
  box(letter, 0.24, 0.008, 0.16, m.paper, [0, 0, 0]); const face = atlas.attach(letter, 'envelope', 0.23, 0.15, [0, 0.005, 0]); face.rotation.x = -Math.PI / 2;
  return { root, body, flapHinge, flap, letter };
}

// ---- the parcel cart (interactive) and its travelling parcel ----------------------------------------------------
function ParcelCart(p, m, atlas, pos, turn) {
  const root = group(p, 'Parcel cart', pos); root.rotation.y = turn;
  const cart = group(root, 'Deliver a parcel'); cart.userData.action = 'postParcel';
  box(cart, 0.86, 0.05, 0.54, m.steel, [0, 0.22, 0]); box(cart, 0.9, 0.025, 0.58, m.steelDark, [0, 0.19, 0]);
  for (const [x, z] of [[-0.34, -0.22], [0.34, -0.22], [-0.34, 0.22], [0.34, 0.22]]) { const w = cylinder(cart, 0.08, 0.08, 0.045, m.iron, [x, 0.08, z], true, 16); w.rotation.x = Math.PI / 2; inked(w, m); box(cart, 0.04, 0.1, 0.04, m.steelDark, [x, 0.15, z]); }
  for (const z of [-0.24, 0.24]) rod(cart, [-0.43, 0.24, z], [-0.48, 1.05, z], 0.018, m.iron, 8);
  rod(cart, [-0.48, 1.05, -0.24], [-0.48, 1.05, 0.24], 0.022, m.iron, 8);
  Parcel(cart, m, atlas, [0.08, 0.245, 0.0], [0.62, 0.3, 0.46], 0.05);
  Parcel(cart, m, atlas, [-0.05, 0.545, -0.04], [0.42, 0.24, 0.34], -0.1);
  Parcel(cart, m, atlas, [0.3, 0.545, 0.1], [0.24, 0.16, 0.2], 0.3, false);
  // the parcel that will be delivered sits on top of the stack (its own group, so it can travel)
  // (a child of the street group, not the cart, so its path can be written in building coordinates)
  const [lx, ly, lz] = [-0.05, 0.785, -0.02], parcel = group(p, 'Travelling parcel', [pos[0] + lx * Math.cos(turn) + lz * Math.sin(turn), pos[1] + ly, pos[2] - lx * Math.sin(turn) + lz * Math.cos(turn)]);
  parcel.rotation.y = turn;
  Parcel(parcel, m, atlas, [0, 0, 0], [0.28, 0.18, 0.22], 0.15);
  return { root, cart, parcel };
}

export function StreetDetails(root, m, atlas) {
  const { GROUND: Y, FLOOR: F, PWIN, WING } = G, g = group(root, 'Life around the post office');
  // lamp post with a red postal flag
  const lamp = StreetLamp(g, m, [-4.7, Y, 2.95]);
  rod(lamp, [0, 2.1, 0], [0.5, 2.1, 0], 0.016, m.iron, 6);
  const flag = atlas.attach(lamp, 'flag', 0.36, 0.54, [0.32, 1.8, 0.02]); flag.rotation.y = 0.15;
  Bench(g, m, [-2.35, Y, 3.05], 0);
  Parcel(g, m, atlas, [-1.9, Y + 0.47, 3.0], [0.26, 0.16, 0.2], 0.3);
  ABoard(g, m, atlas, [-3.55, Y, 3.4], 0.3);
  CherryTree(g, m, [-4.6, Y, -1.0]);
  let s = 7; const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < 16; i++) { const a = r() * 6.28, d = 0.6 + r() * 1.4; const pt = cylinder(g, 0.03 + r() * 0.015, 0.03, 0.004, i % 3 ? m.blossom : m.blossomDeep, [-4.4 + Math.cos(a) * d * 0.6, Y + 0.004, -0.3 + Math.sin(a) * d], false, 6); pt.rotation.y = r() * 3; }
  plant(g, m, [-4.55, Y, 1.55], { r: 0.18, h: 0.3, kind: 'bush' });
  plant(g, m, [-0.45, Y, 2.5], { r: 0.15, h: 0.24, kind: 'flowers' });
  plant(g, m, [5.0, Y, 1.95], { r: 0.18, h: 0.3, kind: 'leafy' });
  plant(g, m, [5.0, Y, -1.75], { r: 0.17, h: 0.28, kind: 'bush' });
  const pl = group(g, 'Planter', [-3.0, Y, 2.35]); pl.rotation.y = -0.6;
  box(pl, 0.9, 0.3, 0.3, m.wood, [0, 0.15, 0]); box(pl, 0.94, 0.04, 0.34, m.walnut, [0, 0.31, 0]);
  for (let i = 0; i < 4; i++) { const x = -0.33 + i * 0.22; inked(sphere(pl, [0.12, 0.1, 0.12], i % 2 ? m.leaf : m.leafLight, [x, 0.4, 0], [9, 6]), m); sphere(pl, [0.045, 0.04, 0.045], i % 2 ? m.blossom : m.shirtYellow, [x + 0.04, 0.5, 0.06], [7, 5]); }
  // postcard display case on the wing front, below its lamp
  const pc = group(g, 'Postcard display', [2.62, F + 0.95, WING.z1 + 0.06]);
  plate(pc, 0.52, 0.74, 0.1, 0.03, m.walnut, [0, 0, 0]); atlas.attach(pc, 'postcards', 0.42, 0.64, [0, 0, 0.052]);
  box(pc, 0.44, 0.66, 0.01, m.glass, [0, 0, 0.058], false);
  // the delivery bicycle on the right, side-on to the camera, with letters in the basket and parcels on a rear rack
  // side-on to the default camera (turned to its 25° azimuth), on the front-right pavement
  const bike = Bicycle(g, m, [4.55, Y, 3.05], 25 * Math.PI / 180, 'letters');
  box(bike, 0.36, 0.025, 0.3, m.iron, [-0.62, 0.8, 0]); for (const z of [-0.13, 0.13]) rod(bike, [-0.75, 0.8, z], [-0.52, 0.33, z * 0.3], 0.01, m.iron, 4);
  Parcel(bike, m, atlas, [-0.62, 0.81, 0], [0.3, 0.16, 0.24], 0.0); Parcel(bike, m, atlas, [-0.6, 0.97, 0.02], [0.2, 0.12, 0.16], 0.3, false);
  // drain grate and a manhole cover
  box(g, 0.6, 0.012, 0.24, m.iron, [-1.3, Y + 0.006, 3.6], false);
  for (let i = 0; i < 6; i++) box(g, 0.012, 0.014, 0.2, m.steelDark, [-1.55 + i * 0.1, Y + 0.008, 3.6], false);
  inked(cylinder(g, 0.3, 0.3, 0.016, m.steelDark, [1.0, Y + 0.008, 3.55], false, 28), m);
  for (let i = 0; i < 4; i++) box(g, 0.46 - i * 0.08, 0.004, 0.02, m.iron, [1.0, Y + 0.018, 3.44 + i * 0.075], false);
  const post = PostBox(g, m, atlas, [2.1, Y, 2.95]);
  const cart = ParcelCart(g, m, atlas, [3.15, Y, 2.45], 0.05);
  return { group: g, post, cart };
}
export { MB };
