import * as THREE from 'three';
import { group, box, plate, rod, tube, cylinder, sphere, cone, ring, mesh, rectPath, extrudeShape, wallWithHoles } from './primitives.js';
import { hull } from './outline.js';

// Measurements (metres). Plan, left to right: the glass hall (front-left corner a quarter circle), the main block with
// the entrance and the round clock tower standing out over it, and the lower parcel wing set back on the right.
// Hall and main block have two storeys: the tall shop floor up to MID, a floor slab, a low upstairs (F2 → TOP,
// about half the shop floor's height).
export const G = {
  GROUND: 0.155, FLOOR: 0.405, T: 0.2, MID: 3.905, F2: 4.105, TOP: 5.905,
  HALL: { x0: -3.8, x1: -0.6, z0: -2.0, z1: 2.0, R: 2.0 },
  MAIN: { x0: -0.6, x1: 2.3, z0: -2.0, z1: 2.0 },
  WING: { x0: 2.3, x1: 4.5, z0: -1.6, z1: 1.7, h: 2.45 },
  DOOR: { x0: 0.3, x1: 1.5, h: 2.1 },
  // round tower on the façade plane, centred over the door: half of it stands out in front of the upstairs wall
  TOWER: { cx: 0.9, cz: 2.0, r: 0.8, base: 3.96, top: 7.95 },
  PWIN: { x0: 2.95, x1: 3.95, y0: 0.95, y1: 1.75 },        // parcel window on the wing front, height above the floor
};
export const H = G.TOP - G.FLOOR, H1 = G.MID - G.FLOOR, H2 = G.TOP - G.F2;
export const ROOF_Y = G.TOP + 0.2;
export const upright = (o) => ((o.rotation.x = Math.PI / 2), o);   // turn before inking: the ink copy takes the transform it has
export const inked = (o, m) => (hull(o, m.hull), o);

// ---- plan shapes (shape-y = −world z), extruded upwards ---------------------------------------------------------
export function slab(parent, shape, y0, h, mat, outline = true) {
  const g = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false, curveSegments: 24 }); g.rotateX(-Math.PI / 2); g.translate(0, y0, 0);
  return mesh(parent, g, mat, [0, 0, 0], outline);
}
// the hall: a rectangle whose front-left corner is a quarter circle; `i` insets it, `right` moves its right edge
export function hallShape(i = 0, right = 0, Type = THREE.Shape) {
  const { x0, x1, z0, z1, R } = G.HALL, cx = x0 + R, cz = z1 - R, s = new Type();
  s.moveTo(x1 + right, -(z0 + i)); s.lineTo(x0 + i, -(z0 + i)); s.lineTo(x0 + i, -cz);
  s.absarc(cx, -cz, R - i, -Math.PI, -Math.PI / 2, false); s.lineTo(x1 + right, -(z1 - i)); s.closePath();
  return s;
}
export const rectShape = (x0, x1, z0, z1, Type = THREE.Shape) => { const s = new Type(); s.moveTo(x0, -z0); s.lineTo(x1, -z0); s.lineTo(x1, -z1); s.lineTo(x0, -z1); s.closePath(); return s; };
// a rounded rectangle in plan (the clock tower)
export function roundedPlan(cx, cz, w, d, r, Type = THREE.Shape) {
  const s = new Type(), x0 = cx - w / 2, x1 = cx + w / 2, z0 = cz - d / 2, z1 = cz + d / 2;
  s.moveTo(x0 + r, -z0); s.lineTo(x1 - r, -z0); s.absarc(x1 - r, -(z0 + r), r, Math.PI / 2, 0, true); s.lineTo(x1, -(z1 - r));
  s.absarc(x1 - r, -(z1 - r), r, 0, -Math.PI / 2, true); s.lineTo(x0 + r, -z1); s.absarc(x0 + r, -(z1 - r), r, -Math.PI / 2, -Math.PI, true);
  s.lineTo(x0, -(z0 + r)); s.absarc(x0 + r, -(z0 + r), r, Math.PI, Math.PI / 2, true); s.closePath();
  return s;
}
// a strip on the hall's curve between radii r0 and r1 (world angles π/2 → π)
function arcStrip(parent, r0, r1, y0, h, mat, outline = true) {
  const { x0, z1, R } = G.HALL, cx = x0 + R, cz = z1 - R, s = new THREE.Shape();
  s.absarc(cx, -cz, r1, -Math.PI, -Math.PI / 2, false); s.absarc(cx, -cz, r0, -Math.PI / 2, -Math.PI, true); s.closePath();
  return slab(parent, s, y0, h, mat, outline);
}
function frameRing(g, m, [x0, y0, x1, y1], t, d = 0.1, rim = 0.09) {
  const s = rectPath(THREE.Shape, x0 - rim, y0 - rim, x1 + rim, y1 + rim); s.holes.push(rectPath(THREE.Path, x0, y0, x1, y1));
  extrudeShape(g, s, d, m.frame, [0, 0, t + d / 2 - 0.02]);
}
function pane(g, m, [x0, y0, x1, y1], z = -0.03) {
  box(g, x1 - x0, y1 - y0, 0.012, m.glass, [(x0 + x1) / 2, (y0 + y1) / 2, z], false);
  const s = box(g, 0.022, Math.min(0.7, (y1 - y0) * 0.5), 0.006, m.reflection, [x0 + (x1 - x0) * 0.3, y0 + (y1 - y0) * 0.55, z + 0.012], false); s.rotation.z = -0.25;
}
function skirting(g, m, w, t, gaps = []) {
  let x = -w / 2;
  for (const [a, b] of [...gaps, [w / 2, w / 2]]) { if (a - x > 0.05) { box(g, a - x, 0.34, 0.04, m.wall2, [(x + a) / 2, 0.17, t + 0.02]); box(g, a - x, 0.04, 0.055, m.cream, [(x + a) / 2, 0.35, t + 0.027]); } x = b; }
}
export function WallLamp(p, m, pos, out = 0.3) {
  const l = group(p, 'Wall lamp', pos);
  plate(l, 0.12, 0.18, 0.03, 0.03, m.iron, [0, 0, 0.015]);
  tube(l, [[0, 0, 0.03], [0, 0.1, 0.12], [0, 0.1, out - 0.06], [0, 0.04, out]], 0.014, m.iron);
  cone(l, 0.11, 0.12, m.iron, [0, 0.0, out], true, 16);
  inked(sphere(l, [0.055, 0.05, 0.055], m.glow, [0, -0.07, out], [12, 8]), m);
  return l;
}
// Striped awning (skill rule): coral and cream bands, one scallop per stripe, cheeks, iron arms.
function Awning(p, m, { len, out = 0.8, drop = 0.42, pos }) {
  const g = group(p, 'Striped awning', pos);
  const n = Math.max(5, Math.round(len / 0.24)), sw = len / n, slope = Math.atan2(drop, out), L = Math.hypot(out, drop);
  for (let i = 0; i < n; i++) {
    const x = -len / 2 + sw * (i + 0.5), mat = i % 2 ? m.stripe : m.awning;
    const b = box(g, sw + 0.002, 0.03, L, mat, [x, -drop / 2, out / 2]); b.rotation.x = slope;
    const v = new THREE.Shape(); v.moveTo(-sw / 2, 0); v.lineTo(sw / 2, 0); v.lineTo(sw / 2, -0.11); v.absarc(0, -0.11, sw / 2, 0, -Math.PI, true); v.lineTo(-sw / 2, 0);
    extrudeShape(g, v, 0.025, mat, [x, -drop + 0.01, out + 0.005], false);
  }
  for (const s of [-1, 1]) {
    const cheek = new THREE.Shape(); cheek.moveTo(0, 0); cheek.lineTo(out, -drop); cheek.lineTo(out, -drop - 0.11); cheek.lineTo(0, -0.05); cheek.closePath();
    const c = extrudeShape(g, cheek, 0.025, m.awning, [s * (len / 2 + 0.013), 0, 0]); c.rotation.y = -Math.PI / 2;
  }
  box(g, len + 0.08, 0.08, 0.08, m.walnut, [0, 0, 0.04]);
  for (const x of [-len / 2 + 0.08, len / 2 - 0.08]) rod(g, [x, -0.38, 0.02], [x, -drop + 0.02, out - 0.05], 0.014, m.iron, 6);
  return g;
}

// ---- the removable front: two storeys of curved glass on the hall, the straight glazing beside it, and the main
// front (entrance, sign and awning below; two windows either side of the tower above) ----------------------------
// one storey of the curve, from y0: a low dado, slim frame rails, tall panes between few slim mullions, a head band
function curvedStorey(f, m, y0, h, { sill, head, n, transom = 0 }) {
  const { x0, z1, R } = G.HALL, cx = x0 + R, cz = z1 - R, T = G.T;
  arcStrip(f, R - T, R, y0, sill, m.wall); arcStrip(f, R - 0.005, R + 0.06, y0 + sill - 0.04, 0.04, m.cream);
  arcStrip(f, R - T + 0.04, R + 0.03, y0 + sill, 0.05, m.frame); arcStrip(f, R - T + 0.04, R + 0.03, y0 + head - 0.05, 0.05, m.frame);
  if (transom) arcStrip(f, R - 0.1, R + 0.02, y0 + transom, 0.035, m.frame, false);
  arcStrip(f, R - T, R, y0 + head, h - head, m.wall);
  const gh = head - sill - 0.1, gy = y0 + sill + 0.05 + gh / 2;
  for (let i = 0; i <= n; i++) {
    const a = Math.PI / 2 + (i / n) * Math.PI / 2;
    box(f, 0.05, gh, 0.08, m.frame, [cx + Math.cos(a) * (R - 0.05), gy, cz + Math.sin(a) * (R - 0.05)]).rotation.y = Math.PI / 2 - a;
    if (i === n) break;
    const am = Math.PI / 2 + ((i + 0.5) / n) * Math.PI / 2, chord = 2 * (R - 0.07) * Math.sin(Math.PI / 4 / n);
    box(f, chord, gh, 0.012, m.glass, [cx + Math.cos(am) * (R - 0.07), gy, cz + Math.sin(am) * (R - 0.07)], false).rotation.y = Math.PI / 2 - am;
    if (i % 2 === 0) { const s = box(f, 0.02, Math.min(0.8, gh * 0.4), 0.006, m.reflection, [cx + Math.cos(am) * (R - 0.04), gy + 0.1, cz + Math.sin(am) * (R - 0.04)], false); s.rotation.set(0, Math.PI / 2 - am, -0.25); }
  }
}
// the same storey on the straight run between the curve and the main block (local x along the run, z = wall centre)
function straightStorey(g, m, sl, h, { sill, head, transom = 0 }) {
  const T = G.T, t = T / 2;
  box(g, sl, sill, T, m.wall, [0, sill / 2, 0]); box(g, sl, 0.04, T + 0.12, m.cream, [0, sill - 0.02, 0.03]);
  box(g, sl, h - head, T, m.wall, [0, head + (h - head) / 2, 0]);
  for (const y of [sill + 0.025, head - 0.025]) box(g, sl, 0.05, 0.1, m.frame, [0, y, 0]);
  if (transom) box(g, sl, 0.035, 0.08, m.frame, [0, transom, 0], false);
  const gh = head - sill - 0.1;
  for (const x of [-sl / 2 + 0.03, sl / 2 - 0.03]) box(g, 0.05, gh, 0.08, m.frame, [x, sill + 0.05 + gh / 2, 0]);
  pane(g, m, [-sl / 2 + 0.05, sill + 0.05, sl / 2 - 0.05, head - 0.05], 0);
  return t;
}
export function Front(root, m, atlas) {
  const { FLOOR, MID, F2, T, HALL, MAIN, DOOR, TOWER } = G, t = T / 2, f = group(root, 'Glass hall and entrance front');
  const { x0, z1, R } = HALL, cx = x0 + R;
  // shop floor: nearly floor-to-ceiling glass with a transom; upstairs: a calmer band of glass under a deeper head
  const down = { sill: 0.3, head: 3.05, transom: 2.6, n: 5 }, up = { sill: 0.28, head: 1.4, n: 6 };
  curvedStorey(f, m, FLOOR, H1, down); curvedStorey(f, m, F2, H2, up);
  arcStrip(f, R - T, R, MID, F2 - MID, m.wall); arcStrip(f, R - 0.01, R + 0.09, MID - 0.02, 0.16, m.cream); arcStrip(f, R - 0.01, R + 0.05, MID + 0.14, 0.04, m.frame, false);
  const sl = HALL.x1 - cx;
  straightStorey(group(f, 'Hall front glazing', [(cx + HALL.x1) / 2, FLOOR, z1 - t]), m, sl, H1, down);
  straightStorey(group(f, 'Hall upstairs glazing', [(cx + HALL.x1) / 2, F2, z1 - t]), m, sl, H2, up);
  // main front, shop floor: wall with the door, a stepped door surround, posters, the convex sign and the awning
  const len = MAIN.x1 - MAIN.x0, mx = (MAIN.x0 + MAIN.x1) / 2, front = group(f, 'Entrance front', [mx, FLOOR, MAIN.z1 - t]);
  const doorR = [DOOR.x0 - mx, 0, DOOR.x1 - mx, DOOR.h], dc = (doorR[0] + doorR[2]) / 2;
  wallWithHoles(front, len, H1, T, [rectPath(THREE.Path, ...doorR)], m.wall);
  skirting(front, m, len - 0.02, t, [[doorR[0] - 0.14, doorR[2] + 0.14]]);
  frameRing(front, m, doorR, t, 0.1, 0.08);
  for (const x of [doorR[0] - 0.14, doorR[2] + 0.14]) { box(front, 0.12, DOOR.h + 0.1, 0.12, m.cream, [x, (DOOR.h + 0.1) / 2, t + 0.05]); box(front, 0.16, 0.08, 0.15, m.cream, [x, DOOR.h + 0.12, t + 0.06]); }
  plate(front, 0.36, 0.2, 0.02, 0.02, m.cream, [doorR[0] - 0.42, 1.15, t + 0.01]); atlas.attach(front, 'hours', 0.33, 0.17, [doorR[0] - 0.42, 1.15, t + 0.022]);
  plate(front, 0.5, 0.66, 0.03, 0.03, m.walnut, [doorR[2] + 0.44, 1.45, t + 0.015]); atlas.attach(front, 'poster', 0.44, 0.6, [doorR[2] + 0.44, 1.45, t + 0.032]);
  Awning(front, m, { len: DOOR.x1 - DOOR.x0 + 0.5, pos: [dc, DOOR.h + 0.08, t], out: 0.62, drop: 0.3 });
  // convex name sign under the tower's corbel: a curved cream board bowing out over the entrance
  const sy = 2.6, sr = 2.4, arc = 2 * Math.asin(1.1 / sr), sgn = group(front, 'Post office sign', [dc, sy, t + 0.18 - sr]);
  const ringShape = (r0, r1) => { const s = new THREE.Shape(); s.absarc(0, 0, r1, Math.PI / 2 - arc / 2, Math.PI / 2 + arc / 2, false); s.absarc(0, 0, r0, Math.PI / 2 + arc / 2, Math.PI / 2 - arc / 2, true); s.closePath(); return s; };
  const board = (r0, r1, h, y, mat) => { const e = new THREE.ExtrudeGeometry(ringShape(r0, r1), { depth: h, bevelEnabled: false, curveSegments: 28 }); e.rotateX(Math.PI / 2); e.translate(0, y + h / 2, 0); return mesh(sgn, e, mat); };
  board(sr - 0.1, sr, 0.5, 0, m.cream); board(sr - 0.08, sr + 0.035, 0.05, 0.25, m.frame); board(sr - 0.08, sr + 0.035, 0.05, -0.3, m.frame);
  atlas.band(sgn, 'sign', sr + 0.006, 0.42, arc * 0.96, [0, 0, 0]);
  WallLamp(front, m, [doorR[0] - 0.42, 1.85, t], 0.24);
  // the floor band between storeys: a cream course with a row of small blocks under it (the cornice the tower stands on)
  box(f, len, F2 - MID + 0.04, T + 0.18, m.cream, [mx, (MID + F2) / 2, MAIN.z1 - t + 0.04]); box(f, len, 0.04, T + 0.14, m.frame, [mx, MID - 0.04, MAIN.z1 - t + 0.03], false);
  for (let x = MAIN.x0 + 0.2; x < MAIN.x1 - 0.1; x += 0.24) if (Math.abs(x - TOWER.cx) > 0.5) box(f, 0.09, 0.08, 0.06, m.cream, [x, MID - 0.1, MAIN.z1 + 0.03], false);
  // upstairs: two tall windows either side of the tower, cream sills and lintels, a window box on the left one
  const upF = group(f, 'Upstairs front', [mx, F2, MAIN.z1 - t]);
  const wins = [[-0.38 - mx, 0.3, 0.02 - mx, 1.4], [1.78 - mx, 0.3, 2.12 - mx, 1.4]];
  wallWithHoles(upF, len, H2, T, wins.map(w => rectPath(THREE.Path, ...w)), m.wall);
  for (const w of wins) {
    frameRing(upF, m, w, t, 0.08, 0.06); pane(upF, m, w); box(upF, w[2] - w[0], 0.035, 0.06, m.frame, [(w[0] + w[2]) / 2, 1.05, 0], false);
    box(upF, w[2] - w[0] + 0.24, 0.05, 0.16, m.cream, [(w[0] + w[2]) / 2, w[1] - 0.09, t + 0.06]); box(upF, w[2] - w[0] + 0.2, 0.1, 0.1, m.cream, [(w[0] + w[2]) / 2, w[3] + 0.13, t + 0.04]);
  }
  const wb = group(upF, 'Window box', [(wins[0][0] + wins[0][2]) / 2, wins[0][1] - 0.28, t + 0.14]);
  box(wb, 0.5, 0.18, 0.16, m.wood, [0, 0.09, 0]);
  for (let i = 0; i < 3; i++) inked(sphere(wb, [0.1, 0.09, 0.08], i % 2 ? m.leaf : m.leafLight, [-0.15 + i * 0.15, 0.22, 0], [8, 5]), m);
  for (let i = 0; i < 3; i++) sphere(wb, [0.035, 0.035, 0.035], m.blossom, [-0.12 + i * 0.15, 0.3, 0.05], [6, 4]);
  for (const x of [MAIN.x0 + 0.08, MAIN.x1 - 0.08]) box(f, 0.2, H + 0.02, 0.2, m.cream, [x, FLOOR + H / 2, MAIN.z1 - 0.08]);
  return f;
}

// Double glass door, each leaf on its own hinge, swinging out over the step. Stays when the front is lifted.
export function Doors(root, m, atlas) {
  const { MAIN, T, FLOOR, DOOR } = G, w = (DOOR.x1 - DOOR.x0) / 2 - 0.02;
  const leaf = (side) => {
    const x = side < 0 ? DOOR.x0 + 0.01 : DOOR.x1 - 0.01, d = -side;
    const hinge = group(root, side < 0 ? 'Post office door hinge (left)' : 'Post office door hinge (right)', [x, FLOOR + 0.01, MAIN.z1 - T / 2]);
    const lf = group(hinge, 'Open the post office door'); lf.userData.action = 'postDoor';
    for (const px of [0.04, w - 0.04]) box(lf, 0.075, DOOR.h - 0.03, 0.06, m.walnut, [d * px, (DOOR.h - 0.03) / 2, 0]);
    for (const y of [0.06, DOOR.h - 0.07]) box(lf, w, 0.1, 0.06, m.walnut, [d * w / 2, y, 0]);
    box(lf, w, 0.32, 0.05, m.walnut, [d * w / 2, 0.22, 0]);
    box(lf, w - 0.12, DOOR.h - 0.5, 0.01, m.glass, [d * w / 2, DOOR.h / 2 + 0.12, 0], false);
    rod(lf, [d * (w - 0.1), 0.9, 0.06], [d * (w - 0.1), 1.3, 0.06], 0.018, m.brass, 10);
    for (const y of [0.93, 1.27]) rod(lf, [d * (w - 0.1), y, 0.02], [d * (w - 0.1), y, 0.06], 0.012, m.brass, 6);
    box(lf, 0.22, 0.03, 0.012, m.brass, [d * w / 2, 0.22, 0.03], false);
    return { hinge, leaf: lf };
  };
  return [leaf(-1), leaf(1)];
}

// ---- walls that stay: hall back and left, main back and right, the whole parcel wing ------------------------------
export function Walls(root, m, atlas) {
  const { FLOOR, T, HALL, MAIN, WING, PWIN } = G, t = T / 2, g = group(root, 'Walls');
  // back wall behind hall and main block
  const bl = MAIN.x1 - HALL.x0, b = group(g, 'Back wall', [(HALL.x0 + MAIN.x1) / 2, FLOOR, HALL.z0 + t]); b.rotation.y = Math.PI;
  const u0 = G.F2 - FLOOR + 0.3, u1 = u0 + 1.0;
  const bw = [[-0.4, 1.4, 0.6, 2.3], [1.4, 1.4, 2.4, 2.3], [-2.2, u0, -1.3, u1], [0.0, u0, 0.9, u1]];
  wallWithHoles(b, bl, H, T, bw.map(w => rectPath(THREE.Path, ...w)), m.wall); skirting(b, m, bl - 0.02, t);
  for (const w of bw) { frameRing(b, m, w, t, 0.08, 0.07); pane(b, m, w); }
  wallWithHoles(b, bl - 0.4, H, 0.02, bw.map(w => rectPath(THREE.Path, ...w)), m.interior, [0, 0, -t - 0.011]);
  box(b, bl, 0.16, 0.08, m.cream, [0, H1 + 0.1, t + 0.04]);
  plate(b, 1.0, 0.8, 0.04, 0.04, m.walnut, [-1.9, 1.5, t + 0.02]); atlas.attach(b, 'notice', 0.92, 0.72, [-1.9, 1.5, t + 0.042]);
  // hall left wall (straight part, behind the curve)
  const ll = HALL.R, l = group(g, 'Hall left wall', [HALL.x0 + t, FLOOR, HALL.z0 + ll / 2]); l.rotation.y = -Math.PI / 2;
  const lws = [[-0.5, 1.3, 0.5, 2.3], [-0.5, u0, 0.5, u1]];
  wallWithHoles(l, ll, H, T, lws.map(w => rectPath(THREE.Path, ...w)), m.wall); skirting(l, m, ll - 0.02, t);
  for (const lw of lws) { frameRing(l, m, lw, t, 0.08, 0.07); pane(l, m, lw); }
  box(l, ll, 0.16, 0.08, m.cream, [0, H1 + 0.1, t + 0.04]);
  wallWithHoles(l, ll - 0.2, H, 0.02, lws.map(w => rectPath(THREE.Path, ...w)), m.interior, [0, 0, -t - 0.011]);
  // main right wall: its lower half is hidden by the wing, upstairs it has a window and a lamp above the wing roof
  const r = group(g, 'Main right wall', [MAIN.x1 - t, FLOOR, 0]); r.rotation.y = Math.PI / 2;
  const rw = [-0.75, u0, 0.15, u1];
  wallWithHoles(r, MAIN.z1 - MAIN.z0, H, T, [rectPath(THREE.Path, ...rw)], m.wall); frameRing(r, m, rw, t, 0.08, 0.07); pane(r, m, rw);
  box(r, rw[2] - rw[0], 0.035, 0.06, m.frame, [(rw[0] + rw[2]) / 2, u0 + 0.7, 0], false);
  box(r, rw[2] - rw[0] + 0.24, 0.05, 0.16, m.cream, [(rw[0] + rw[2]) / 2, rw[1] - 0.09, t + 0.06]); box(r, rw[2] - rw[0] + 0.2, 0.1, 0.1, m.cream, [(rw[0] + rw[2]) / 2, rw[3] + 0.13, t + 0.04]);
  box(r, MAIN.z1 - MAIN.z0, 0.16, 0.08, m.cream, [0, H1 + 0.1, t + 0.04]);
  WallLamp(r, m, [0.7, u0 + 0.8, t], 0.24);
  rod(g, [HALL.x0 + 0.35, G.TOP + 0.1, HALL.z0 - 0.08], [HALL.x0 + 0.35, G.GROUND + 0.1, HALL.z0 - 0.08], 0.045, m.frame, 10);
  for (const [x, z] of [[HALL.x0 + 0.08, HALL.z0 + 0.08], [MAIN.x1 - 0.08, MAIN.z0 + 0.08]]) box(g, 0.2, H + 0.02, 0.2, m.cream, [x, FLOOR + H / 2, z]);
  // ---- parcel wing: lower, warmer wall, its own window with a flap, a service door on the side --------------------
  const W = group(g, 'Parcel wing'), HW = WING.h, wl = WING.x1 - WING.x0, wcx = (WING.x0 + WING.x1) / 2;
  const wf = group(W, 'Wing front', [wcx, FLOOR, WING.z1 - t]);
  const win = [PWIN.x0 - wcx, PWIN.y0, PWIN.x1 - wcx, PWIN.y1];
  wallWithHoles(wf, wl, HW, T, [rectPath(THREE.Path, ...win)], m.wall2); skirting(wf, m, wl - 0.02, t);
  frameRing(wf, m, win, t, 0.1, 0.08);
  plate(wf, win[2] - win[0] + 0.3, 0.07, 0.36, 0.03, m.stone, [(win[0] + win[2]) / 2, win[1] - 0.05, t + 0.14]);           // counter ledge
  // a small green metal canopy over the window, and the PARCEL COUNTER sign above it
  const cg = group(wf, 'Window canopy', [(win[0] + win[2]) / 2, win[3] + 0.25, t]);
  const cp = box(cg, win[2] - win[0] + 0.5, 0.04, 0.55, m.roof, [0, 0, 0.27]); cp.rotation.x = 0.28;
  for (const x of [-(win[2] - win[0]) / 2 - 0.2, (win[2] - win[0]) / 2 + 0.2]) rod(cg, [x, -0.25, 0.02], [x, -0.08, 0.52], 0.012, m.iron, 6);
  box(cg, win[2] - win[0] + 0.52, 0.06, 0.03, m.frame, [0, -0.08, 0.55]);
  plate(wf, 1.5, 0.3, 0.06, 0.04, m.frame, [(win[0] + win[2]) / 2, HW - 0.2, t + 0.03]); atlas.attach(wf, 'parcels', 1.4, 0.22, [(win[0] + win[2]) / 2, HW - 0.2, t + 0.062]);
  WallLamp(wf, m, [win[0] - 0.32, 1.95, t], 0.24);
  const wr = group(W, 'Wing right wall', [WING.x1 - t, FLOOR, (WING.z0 + WING.z1) / 2]); wr.rotation.y = Math.PI / 2;
  const sd = [-0.2, 0, 0.75, 2.1];
  wallWithHoles(wr, WING.z1 - WING.z0, HW, T, [rectPath(THREE.Path, ...sd)], m.wall2); skirting(wr, m, WING.z1 - WING.z0 - 0.02, t, [[sd[0], sd[2]]]);
  frameRing(wr, m, sd, t, 0.1, 0.07); box(wr, sd[2] - sd[0], sd[3], 0.06, m.frame, [(sd[0] + sd[2]) / 2, sd[3] / 2, 0]);
  for (const y of [0.55, 1.5]) plate(wr, sd[2] - sd[0] - 0.2, 0.6, 0.03, 0.03, m.roof, [(sd[0] + sd[2]) / 2, y, 0.04]);
  sphere(wr, [0.03, 0.03, 0.03], m.brass, [sd[2] - 0.1, 1.05, 0.06], [8, 6]);
  WallLamp(wr, m, [sd[2] + 0.35, 1.95, t], 0.24);
  rod(W, [WING.x1 + 0.08, FLOOR + HW + 0.1, WING.z0 + 0.25], [WING.x1 + 0.08, G.GROUND + 0.1, WING.z0 + 0.25], 0.04, m.frame, 10);
  const wb = group(W, 'Wing back wall', [wcx, FLOOR, WING.z0 + t]); wb.rotation.y = Math.PI;
  const bwin = [-0.45, 1.2, 0.45, 1.9];
  wallWithHoles(wb, wl, HW, T, [rectPath(THREE.Path, ...bwin)], m.wall2); skirting(wb, m, wl - 0.02, t); frameRing(wb, m, bwin, t, 0.08, 0.07); pane(wb, m, bwin);
  rod(W, [WING.x0 + 0.35, FLOOR + HW + 0.1, WING.z0 - 0.08], [WING.x0 + 0.35, G.GROUND + 0.1, WING.z0 - 0.08], 0.04, m.frame, 10);
  for (const [x, z] of [[WING.x1 - 0.08, WING.z1 - 0.08], [WING.x1 - 0.08, WING.z0 + 0.08]]) box(W, 0.18, HW + 0.02, 0.18, m.cream, [x, FLOOR + HW / 2, z]);
  // the wing's inside: parcel shelves just behind the window
  const ws = group(W, 'Parcel shelves', [PWIN.x0 + 0.5, FLOOR, WING.z1 - 0.75]); ws.userData.noShadow = true;
  for (const y of [0.9, 1.5]) box(ws, 1.4, 0.04, 0.5, m.wood, [0, y, 0]);
  for (const x of [-0.68, 0.68]) box(ws, 0.04, 1.9, 0.5, m.walnut, [x, 0.95, 0]);
  box(W, wl - 0.4, 0.02, WING.z1 - WING.z0 - 0.4, m.floorWood, [wcx, FLOOR + 0.01, (WING.z0 + WING.z1) / 2], false);
  // the window flap: hinged along the top of the opening, it swings out and up when a parcel arrives
  const flapHinge = group(W, 'Parcel window flap hinge', [(PWIN.x0 + PWIN.x1) / 2, FLOOR + PWIN.y1, WING.z1 - 0.06]);
  const flap = group(flapHinge, 'Parcel window flap');
  plate(flap, PWIN.x1 - PWIN.x0 - 0.02, PWIN.y1 - PWIN.y0 - 0.02, 0.035, 0.02, m.frame, [0, -(PWIN.y1 - PWIN.y0) / 2, 0]);
  for (let i = 0; i < 3; i++) box(flap, PWIN.x1 - PWIN.x0 - 0.1, 0.012, 0.012, m.cream, [0, -0.2 - i * 0.2, 0.02], false);
  box(flap, 0.18, 0.04, 0.03, m.brass, [0, -(PWIN.y1 - PWIN.y0) + 0.08, 0.03]);
  return { group: g, shelves: ws, flapHinge, flap };
}

// ---- plinth under the whole plan and the entrance steps -----------------------------------------------------------
export function Base(root, m) {
  const { GROUND, FLOOR, HALL, MAIN, WING, DOOR } = G, g = group(root, 'Plinth');
  slab(g, hallShape(-0.05, 0.05), GROUND, FLOOR - GROUND - 0.04, m.stone); slab(g, hallShape(-0.08, 0.05), FLOOR - 0.04, 0.04, m.cream);
  slab(g, rectShape(MAIN.x0, MAIN.x1 + 0.05, MAIN.z0 - 0.05, MAIN.z1 + 0.05), GROUND, FLOOR - GROUND - 0.04, m.stone); slab(g, rectShape(MAIN.x0, MAIN.x1 + 0.05, MAIN.z0 - 0.08, MAIN.z1 + 0.08), FLOOR - 0.04, 0.04, m.cream);
  slab(g, rectShape(WING.x0, WING.x1 + 0.05, WING.z0 - 0.05, WING.z1 + 0.05), GROUND, FLOOR - GROUND - 0.04, m.stone); slab(g, rectShape(WING.x0, WING.x1 + 0.08, WING.z0 - 0.08, WING.z1 + 0.08), FLOOR - 0.04, 0.04, m.cream);
  const cx = (DOOR.x0 + DOOR.x1) / 2, rise = (FLOOR - GROUND) / 2;
  // two treads: the lower one further out, the upper one against the door sill
  for (let i = 0; i < 2; i++) { const h = rise * (i + 1), z = MAIN.z1 + 0.16 + (1 - i) * 0.3; box(g, DOOR.x1 - DOOR.x0 + 0.9 - i * 0.2, h, 0.32, m.stone, [cx, GROUND + h / 2, z]); box(g, DOOR.x1 - DOOR.x0 + 0.92 - i * 0.2, 0.03, 0.04, m.walnut, [cx, GROUND + h - 0.015, z + 0.14]); }
  return g;
}
