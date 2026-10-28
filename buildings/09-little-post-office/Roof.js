import * as THREE from 'three';
import { group, box, plate, rod, tube, cylinder, sphere, cone, ring, mesh } from './primitives.js';
import { G, ROOF_Y, slab, hallShape, rectShape, inked, upright } from './Shell.js';
import { plant } from '../shared/props.js';
import { vine } from './Props.js';

// Roofs that see-through lifts: the hall's curved green roof, the garden on the main block behind the tower, the
// clock tower on the façade, and the wing's low roof.
export function Roofs(root, m, atlas) {
  const { TOP, F2, HALL, MAIN, WING, TOWER, FLOOR } = G, g = group(root, 'Roofs and clock tower');
  // ---- hall: a cream cornice, then green bands stepping in and up along the curve ----------------------------------
  slab(g, hallShape(-0.12, 0), TOP, 0.12, m.cream);
  for (let k = 0; k < 4; k++) slab(g, hallShape(-0.26 + k * 0.24, 0), TOP + 0.12 + k * 0.1, 0.1, m.roof);
  slab(g, hallShape(0.72, 0), TOP + 0.52, 0.02, m.cream, false);
  // ---- main block: cornice, mint fascia, garden deck, parapet with a cap, green railing ---------------------------
  const mx0 = MAIN.x0, mx1 = MAIN.x1, mz0 = MAIN.z0, mz1 = MAIN.z1;
  slab(g, rectShape(mx0, mx1 + 0.12, mz0 - 0.12, mz1 + 0.12), TOP, 0.12, m.cream);
  slab(g, rectShape(mx0, mx1 + 0.06, mz0 - 0.06, mz1 + 0.06), TOP + 0.12, 0.06, m.frame);
  slab(g, rectShape(mx0, mx1 - 0.15, mz0 + 0.15, mz1 - 0.15), TOP + 0.18, 0.02, m.deck, false);
  const pt = 0.15, ph = 0.34, py = TOP + 0.18;
  const tl = G.TOWER.cx - G.TOWER.r + 0.1, tr = G.TOWER.cx + G.TOWER.r - 0.1;
  box(g, tl - mx0, ph, pt, m.wall, [(mx0 + tl) / 2, py + ph / 2, mz1 - pt / 2]); box(g, mx1 - tr, ph, pt, m.wall, [(tr + mx1) / 2, py + ph / 2, mz1 - pt / 2]);
  box(g, mx1 - mx0, ph, pt, m.wall, [(mx0 + mx1) / 2, py + ph / 2, mz0 + pt / 2]);
  box(g, pt, ph, mz1 - mz0 - 2 * pt, m.wall, [mx1 - pt / 2, py + ph / 2, (mz0 + mz1) / 2]);
  for (const [w, d, x, z] of [[tl - mx0 + 0.02, pt + 0.06, (mx0 + tl) / 2, mz1 - pt / 2], [mx1 - tr + 0.02, pt + 0.06, (tr + mx1) / 2, mz1 - pt / 2], [mx1 - mx0 + 0.04, pt + 0.06, (mx0 + mx1) / 2, mz0 + pt / 2], [pt + 0.06, mz1 - mz0, mx1 - pt / 2, (mz0 + mz1) / 2]]) box(g, w, 0.04, d, m.cream, [x, py + ph + 0.02, z]);
  const ry = py + ph + 0.04, run = (a, b) => {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(2, Math.round(len / 0.5));
    for (let i = 0; i <= n; i++) { const t = i / n; box(g, 0.035, 0.46, 0.035, m.rail, [a[0] + (b[0] - a[0]) * t, ry + 0.23, a[1] + (b[1] - a[1]) * t]); }
    for (const y of [0.22, 0.46]) rod(g, [a[0], ry + y, a[1]], [b[0], ry + y, b[1]], y > 0.3 ? 0.017 : 0.011, m.rail, 6);
  };
  // the tower interrupts the front railing; the garden is closed on the hall side by a railing of its own
  const { cx, cz, r, base, top } = TOWER, fz = mz1 - pt / 2;
  run([cx + r + 0.04, fz], [mx1 - pt / 2, fz]); run([mx1 - pt / 2, fz], [mx1 - pt / 2, mz0 + pt / 2]); run([mx1 - pt / 2, mz0 + pt / 2], [mx0 + 0.07, mz0 + pt / 2]);
  run([mx0 + 0.07, mz0 + pt / 2], [mx0 + 0.07, fz]); run([mx0 + 0.07, fz], [cx - r - 0.04, fz]);
  // garden behind the tower: a gabled glass skylight, wooden planters with flowers, potted plants, an air unit
  const sk = group(g, 'Skylight', [1.25, ROOF_Y, -0.95]);
  box(sk, 1.1, 0.24, 0.85, m.frame, [0, 0.12, 0]); box(sk, 1.16, 0.04, 0.91, m.cream, [0, 0.26, 0]);
  const gable = new THREE.Shape(); gable.moveTo(-0.42, 0); gable.lineTo(0.42, 0); gable.lineTo(0, 0.32); gable.closePath();
  const gl = new THREE.Mesh(new THREE.ExtrudeGeometry(gable, { depth: 1.0, bevelEnabled: false }), m.glass); gl.geometry.translate(0, 0, -0.5); gl.rotation.y = Math.PI / 2; gl.position.set(0, 0.28, 0); gl.userData.outline = false; sk.add(gl);
  for (const s of [-1, 1]) for (const x of [-0.5, 0.5]) rod(sk, [x, 0.28, s * 0.42], [x, 0.6, 0], 0.018, m.frame, 6);
  rod(sk, [-0.52, 0.6, 0], [0.52, 0.6, 0], 0.02, m.frame, 6); rod(sk, [0, 0.28, 0.42], [0, 0.6, 0], 0.012, m.frame, 4); rod(sk, [0, 0.28, -0.42], [0, 0.6, 0], 0.012, m.frame, 4);
  for (const [x, z, len, turn] of [[-0.05, 0.55, 1.2, Math.PI / 2], [mx1 - 0.45, 0.3, 1.4, Math.PI / 2]]) {
    const pb = group(g, 'Planter box', [x, ROOF_Y, z]); pb.rotation.y = turn;
    box(pb, len, 0.28, 0.3, m.wood, [0, 0.14, 0]); box(pb, len + 0.04, 0.04, 0.34, m.walnut, [0, 0.29, 0]);
    for (let i = 0; i < 3; i++) box(pb, len + 0.004, 0.01, 0.304, m.walnut, [0, 0.07 + i * 0.07, 0], false);
    const n = Math.round(len / 0.24);
    for (let i = 0; i < n; i++) { const px = -len / 2 + 0.12 + (i / (n - 1)) * (len - 0.24); inked(sphere(pb, [0.12, 0.1, 0.12], i % 2 ? m.leaf : m.leafLight, [px, 0.38, (i % 2 - 0.5) * 0.05], [9, 6]), m); sphere(pb, [0.045, 0.04, 0.045], [m.blossom, m.shirtYellow, m.paper][i % 3], [px + 0.04, 0.48, 0.06], [7, 5]); }
  }
  plant(g, m, [-0.05, ROOF_Y, -1.55], { r: 0.18, h: 0.28, kind: 'leafy' });
  plant(g, m, [2.0, ROOF_Y, -1.5], { r: 0.15, h: 0.24, kind: 'flowers' });
  plant(g, m, [-2.6, TOP + 0.54, -0.9], { r: 0.15, h: 0.22, kind: 'bush' });
  for (const [x, len, s] of [[-0.35, 0.42, 1], [-0.1, 0.6, 2], [1.95, 0.5, 3]]) vine(g, m, [x, py + ph + 0.02, mz1 + 0.02], [x + 0.04, py + ph - len, mz1 + 0.1], 5, s);
  const ac = group(g, 'Air unit', [0.55, ROOF_Y, -1.5]);
  plate(ac, 0.8, 0.52, 0.48, 0.05, m.steel, [0, 0.26, 0]);
  inked(upright(cylinder(ac, 0.17, 0.17, 0.02, m.steelDark, [0.12, 0.26, 0.25], false, 24)), m);
  for (let i = -2; i <= 2; i++) box(ac, 0.3, 0.012, 0.006, m.steel, [0.12, 0.26 + i * 0.055, 0.262], false);
  for (const x of [-0.3, 0.3]) box(ac, 0.07, 0.05, 0.48, m.steelDark, [x, 0.025, 0]);
  // ---- the clock tower: a round tower half set into the façade over the door, carried on a stepped corbel that
  // grows out of the floor band. Ribs, slit windows, the 〒 badge upstairs, the clock above the roof, a red domed cap.
  const tw = group(g, 'Clock tower');
  const front = (rad, h, y0, mat, outline = true) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad, h, 32, 1, false, -Math.PI / 2, Math.PI), mat); c.position.set(cx, y0 + h / 2, cz); c.userData.outline = outline; tw.add(c); return c; };
  front(0.42, 0.12, base - 0.34, m.cream); front(0.6, 0.11, base - 0.22, m.cream); front(r + 0.08, 0.11, base - 0.11, m.frame);
  const body = cylinder(tw, r, r, top - base, m.wall, [cx, (base + top) / 2, cz], false, 40); inked(body, m);
  for (const [y, h, rad, mat] of [[base, 0.12, r + 0.05, m.cream], [TOP - 0.02, 0.16, r + 0.08, m.cream], [TOP + 0.14, 0.05, r + 0.04, m.frame], [top - 0.32, 0.06, r + 0.03, m.frame], [top - 0.26, 0.2, r + 0.12, m.cream]]) cylinder(tw, rad, rad, h, mat, [cx, y + h / 2, cz], true, 40);
  // ribs on the round: four towards the street, four towards the back (above the roof)
  for (const a of [-1.2, -0.5, 0.5, 1.2]) { const rb = box(tw, 0.08, top - base - 0.5, 0.05, m.wall2, [cx + Math.sin(a) * (r + 0.015), (base + top - 0.4) / 2 + 0.05, cz + Math.cos(a) * (r + 0.015)]); rb.rotation.y = a; }
  for (const a of [Math.PI - 1.0, Math.PI, Math.PI + 1.0]) { const rb = box(tw, 0.08, top - TOP - 0.55, 0.05, m.wall2, [cx + Math.sin(a) * (r + 0.015), (TOP + top) / 2 - 0.1, cz + Math.cos(a) * (r + 0.015)]); rb.rotation.y = a; }
  // slit windows between the ribs, upstairs and in the belfry
  for (const [a, y, h] of [[-0.85, F2 + 0.85, 0.8], [0.85, F2 + 0.85, 0.8], [-0.85, TOP + 0.95, 0.7], [0.85, TOP + 0.95, 0.7], [Math.PI - 0.5, TOP + 0.95, 0.7], [Math.PI + 0.5, TOP + 0.95, 0.7]]) {
    const o = group(tw, 'Slit window', [cx + Math.sin(a) * r, y, cz + Math.cos(a) * r]); o.rotation.y = a;
    box(o, 0.16, h + 0.12, 0.06, m.frame, [0, 0, 0.01]); box(o, 0.08, h, 0.02, m.signGlow, [0, 0, 0.04], false);
  }
  // the 〒 badge on a short drum at the upstairs level
  const badge = group(tw, 'Post mark', [cx, F2 + 0.85, cz + r - 0.12]);
  inked(upright(cylinder(badge, 0.36, 0.36, 0.22, m.cream, [0, 0, 0.11], true, 32)), m); atlas.disc(badge, 'mark', 0.31, [0, 0, 0.225]);
  // the clock above the roof line: walnut drum, cream ring, printed dial, hands and a brass centre
  const ck = group(tw, 'Tower clock', [cx, top - 1.05, cz + r - 0.24]);
  inked(upright(cylinder(ck, 0.52, 0.52, 0.32, m.walnut, [0, 0, 0.1], true, 40)), m);
  upright(cylinder(ck, 0.46, 0.46, 0.04, m.cream, [0, 0, 0.27], false, 40));
  atlas.disc(ck, 'clock', 0.43, [0, 0, 0.293]);
  const hand = (len, wid, angle, z) => { const h = box(ck, wid, len, 0.012, m.ink, [Math.sin(angle) * len / 2, Math.cos(angle) * len / 2, z], false); h.rotation.z = -angle; };
  hand(0.23, 0.035, Math.PI * 2 * (10 / 12 + 10 / 720), 0.3); hand(0.34, 0.025, Math.PI * 2 * (10 / 60), 0.31);
  upright(cylinder(ck, 0.035, 0.035, 0.03, m.brass, [0, 0, 0.32], false, 12));
  // red rounded cap: a deep rim, a low dome, a finial and two thin masts
  cylinder(tw, r + 0.14, r + 0.14, 0.14, m.cap, [cx, top + 0.01, cz], true, 40);
  inked(sphere(tw, [r + 0.06, 0.48, r + 0.06], m.cap, [cx, top + 0.08, cz], [28, 12]), m);
  sphere(tw, [0.07, 0.07, 0.07], m.brass, [cx, top + 0.6, cz], [10, 6]);
  for (const [dx, h] of [[-0.25, 0.85], [0.22, 0.62]]) { rod(tw, [cx + dx, top + 0.4, cz], [cx + dx, top + 0.4 + h, cz], 0.016, m.iron, 6); sphere(tw, [0.035, 0.035, 0.035], m.iron, [cx + dx, top + 0.4 + h, cz], [8, 6]); }
  // ---- wing: cream cornice and two green bands, lower than everything else ------------------------------------------
  const wy = FLOOR + WING.h;
  slab(g, rectShape(WING.x0, WING.x1 + 0.12, WING.z0 - 0.12, WING.z1 + 0.12), wy, 0.1, m.cream);
  slab(g, rectShape(WING.x0, WING.x1 + 0.06, WING.z0 - 0.06, WING.z1 + 0.06), wy + 0.1, 0.1, m.roof);
  slab(g, rectShape(WING.x0, WING.x1 - 0.2, WING.z0 + 0.2, WING.z1 - 0.2), wy + 0.2, 0.1, m.roof);
  return g;
}
