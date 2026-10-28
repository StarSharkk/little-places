import * as THREE from 'three';
import { group, box, plate, rod, tube, cylinder, sphere, cone, ring, mesh, rectPath, discPath, extrudeShape, wallWithHoles } from './primitives.js';
import { hull } from './outline.js';
import { Washer } from './Washer.js';

// Shared measurements (metres). The shop is a rectangle whose front-right corner (+x +z) is a quarter circle of glass.
export const G = {
  GROUND: 0.155, FLOOR: 0.405, X0: -3.1, X1: 3.1, Z0: -2.2, Z1: 2.2, T: 0.2, R: 1.4, TOP: 3.505,
  WIN: { x0: -2.75, x1: 0.05, y0: 0.5, y1: 2.35 },     // front window (world x, height above the floor)
  DOOR: { x0: 0.35, x1: 1.55, h: 2.2 },                  // double glass door
};
export const H = G.TOP - G.FLOOR;
export const ROOF_Y = G.TOP + 0.2;                       // top of the roof deck
const upright = (o) => ((o.rotation.x = Math.PI / 2), o);   // turn before inking: the ink copy takes the transform it has
const inked = (o, m) => (hull(o, m.hull), o);

// ---- plan shapes: everything that follows the rounded corner is built from these ---------------------------
// Shapes are drawn in plan with shape-y = −world z, then extruded upwards (rotateX −90°).
export function planShape(inset = 0, { x0 = G.X0, x1 = G.X1, z0 = G.Z0, z1 = G.Z1, R = G.R } = {}, Type = THREE.Shape) {
  const a = x0 + inset, b = x1 - inset, c = z0 + inset, d = z1 - inset, r = Math.max(0.05, R - inset), s = new Type();
  s.moveTo(a, -c); s.lineTo(b, -c); s.lineTo(b, -(d - r)); s.absarc(b - r, -(d - r), r, 0, -Math.PI / 2, true); s.lineTo(a, -d); s.closePath();
  return s;
}
export function slab(parent, shape, y0, height, mat, outline = true) {
  const g = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false, curveSegments: 24 }); g.rotateX(-Math.PI / 2); g.translate(0, y0, 0);
  return mesh(parent, g, mat, [0, 0, 0], outline);
}
// a band following the plan outline: outer outline grown by `out`, hole = outline shrunk by `inn`
export function band(parent, out, inn, y0, height, mat, outline = true, opts) {
  const s = planShape(-out, opts); s.holes.push(planShape(inn, opts, THREE.Path)); return slab(parent, s, y0, height, mat, outline);
}
// a curved strip on the corner arc only (angles 0 = +x, π/2 = +z), from radius r0 to r1
function arcStrip(parent, r0, r1, y0, height, mat, outline = true, a0 = 0, a1 = Math.PI / 2) {
  const cx = G.X1 - G.R, cz = G.Z1 - G.R, s = new THREE.Shape();
  s.absarc(cx, -cz, r1, -a0, -a1, true); s.absarc(cx, -cz, r0, -a1, -a0, false); s.closePath();
  return slab(parent, s, y0, height, mat, outline);
}
export function rng(seed) { return () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
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
  for (const [a, b] of [...gaps, [w / 2, w / 2]]) { if (a - x > 0.05) { box(g, a - x, 0.36, 0.04, m.wallShade, [(x + a) / 2, 0.18, t + 0.02]); box(g, a - x, 0.04, 0.055, m.cream, [(x + a) / 2, 0.37, t + 0.027]); } x = b; }
}
export function WallLamp(p, m, pos, out = 0.3) {
  const l = group(p, 'Wall lamp', pos);
  plate(l, 0.12, 0.18, 0.03, 0.03, m.iron, [0, 0, 0.015]);
  tube(l, [[0, 0, 0.03], [0, 0.1, 0.12], [0, 0.1, out - 0.06], [0, 0.04, out]], 0.014, m.iron);
  cone(l, 0.11, 0.12, m.iron, [0, 0.0, out], true, 16);
  inked(sphere(l, [0.055, 0.05, 0.055], m.glow, [0, -0.07, out], [12, 8]), m);
  return l;
}
// Striped canopy (skill rule: every awning is striped): bands, one scallop per stripe, side cheeks, iron arms.
export function Awning(p, m, { len, out = 0.95, drop = 0.48, pos, turn = 0 }) {
  const g = group(p, 'Striped awning', pos); g.rotation.y = turn;
  const n = Math.max(5, Math.round(len / 0.26)), sw = len / n, slope = Math.atan2(drop, out), L = Math.hypot(out, drop);
  for (let i = 0; i < n; i++) {
    const x = -len / 2 + sw * (i + 0.5), mat = i % 2 ? m.stripe : m.awning;
    const b = box(g, sw + 0.002, 0.03, L, mat, [x, -drop / 2, out / 2]); b.rotation.x = slope;
    const v = new THREE.Shape(); v.moveTo(-sw / 2, 0); v.lineTo(sw / 2, 0); v.lineTo(sw / 2, -0.12); v.absarc(0, -0.12, sw / 2, 0, -Math.PI, true); v.lineTo(-sw / 2, 0);
    extrudeShape(g, v, 0.025, mat, [x, -drop + 0.01, out + 0.005], false);
  }
  for (const s of [-1, 1]) {
    const cheek = new THREE.Shape(); cheek.moveTo(0, 0); cheek.lineTo(out, -drop); cheek.lineTo(out, -drop - 0.12); cheek.lineTo(0, -0.05); cheek.closePath();
    const c = extrudeShape(g, cheek, 0.025, m.awning, [s * (len / 2 + 0.013), 0, 0]); c.rotation.y = -Math.PI / 2;
  }
  box(g, len + 0.08, 0.08, 0.08, m.walnut, [0, 0.0, 0.04]);
  for (const x of [-len / 2 + 0.08, len / 2 - 0.08]) rod(g, [x, -0.42, 0.02], [x, -drop + 0.02, out - 0.05], 0.014, m.iron, 6);
  return g;
}

// ---- the removable front: shop window, sign, awning, the curved glass corner (see-through lifts it) ------------
export function Facade(root, m, atlas) {
  const { X0, X1, Z1, T, R, FLOOR, WIN, DOOR } = G, t = T / 2, f = group(root, 'Front and glass corner');
  // flat front wall from the left corner to where the curve starts; its local x is world x − cx
  const len = X1 - R - X0, cx = (X0 + X1 - R) / 2, front = group(f, 'Front wall', [cx, FLOOR, Z1 - t]);
  const L = r => [r[0] - cx, r[1], r[2] - cx, r[3]];
  const winR = L([WIN.x0, WIN.y0, WIN.x1, WIN.y1]), doorR = L([DOOR.x0, 0, DOOR.x1, DOOR.h]), transR = L([DOOR.x0 + 0.06, DOOR.h + 0.1, DOOR.x1 - 0.06, DOOR.h + 0.28]);
  wallWithHoles(front, len, H, T, [winR, doorR, transR].map(r => rectPath(THREE.Path, ...r)), m.wall);
  skirting(front, m, len - 0.02, t, [[doorR[0], doorR[2]]]);
  frameRing(front, m, winR, t); frameRing(front, m, doorR, t, 0.1, 0.07); frameRing(front, m, transR, t, 0.08, 0.05); pane(front, m, transR);
  const ww = winR[2] - winR[0];
  for (let k = 1; k < 3; k++) box(front, 0.07, winR[3] - winR[1], 0.12, m.frame, [winR[0] + (ww * k) / 3, (winR[1] + winR[3]) / 2, 0]);
  box(front, ww, 0.07, 0.12, m.frame, [(winR[0] + winR[2]) / 2, winR[3] - 0.45, 0]);
  for (let k = 0; k < 3; k++) pane(front, m, [winR[0] + (ww * k) / 3, winR[1], winR[0] + (ww * (k + 1)) / 3, winR[3]]);
  plate(front, ww + 0.34, 0.08, 0.3, 0.03, m.cream, [(winR[0] + winR[2]) / 2, winR[1] - 0.12, t + 0.12]);
  Awning(front, m, { len: ww - 0.1, pos: [(winR[0] + winR[2]) / 2 + 0.05, winR[3] + 0.12, t], out: 0.9, drop: 0.46 });
  // raised name board across the front fascia
  // it sits between the awning and the cornice, and stops short of the door transom
  const sy = H - 0.3, sx = -0.55;
  plate(front, 3.5, 0.6, 0.1, 0.08, m.frame, [sx, sy, t + 0.05]);
  plate(front, 3.38, 0.48, 0.14, 0.06, m.cream, [sx, sy, t + 0.08]);
  atlas.attach(front, 'sign', 3.12, 0.52, [sx, sy, t + 0.152]);
  // OPEN card and price list beside the door, lamp over it
  plate(front, 0.3, 0.42, 0.03, 0.02, m.walnut, [doorR[0] - 0.17, 1.45, t + 0.015]); atlas.attach(front, 'hours', 0.27, 0.38, [doorR[0] - 0.17, 1.45, t + 0.032]);
  WallLamp(front, m, [doorR[2] + 0.02, 2.75, t], 0.28);
  // vertical COIN LAUNDRY light box sticking out from the left corner
  const lb = group(front, 'Coin laundry light box', [-len / 2 + 0.1, 2.0, t + 0.42]);
  rod(lb, [0, 0.62, -0.42], [0, 0.62, -0.02], 0.016, m.iron, 6); rod(lb, [0, -0.42, -0.42], [0, -0.42, -0.02], 0.016, m.iron, 6);
  plate(lb, 0.1, 1.06, 0.5, 0.04, m.frame, [0, 0.1, 0]).rotation.y = Math.PI / 2;
  box(lb, 0.104, 0.96, 0.42, m.signGlow, [0, 0.1, 0], false);
  for (const s of [-1, 1]) atlas.attach(lb, 'coin', 0.4, 0.92, [s * 0.054, 0.1, 0], s * Math.PI / 2);
  // ---- the curved glass corner: dado and head bands in the wall colour, mint posts and rails, glass panes ----
  const arcY = (y, h, mat, r0 = R - T, r1 = R, outline = true) => arcStrip(f, r0, r1, FLOOR + y, h, mat, outline);
  arcY(0, 0.5, m.wall); arcY(0, 0.36, m.wallShade, R - 0.005, R + 0.035); arcY(0.36, 0.04, m.cream, R - 0.005, R + 0.055);
  arcY(2.42, H - 2.42, m.wall);
  arcY(0.5, 0.08, m.frame, R - T + 0.02, R + 0.04); arcY(2.34, 0.08, m.frame, R - T + 0.02, R + 0.04);
  const ccx = X1 - R, ccz = Z1 - R, n = 5;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI / 2; box(f, 0.08, 1.84, 0.12, m.frame, [ccx + Math.cos(a) * (R - 0.06), FLOOR + 1.46, ccz + Math.sin(a) * (R - 0.06)]).rotation.y = Math.PI / 2 - a;
    if (i === n) break;
    const am = ((i + 0.5) / n) * Math.PI / 2, chord = 2 * (R - 0.08) * Math.sin(Math.PI / 4 / n);
    const p = box(f, chord, 1.76, 0.012, m.glass, [ccx + Math.cos(am) * (R - 0.08), FLOOR + 1.46, ccz + Math.sin(am) * (R - 0.08)], false); p.rotation.y = Math.PI / 2 - am;
    const s = box(f, 0.02, 0.6, 0.006, m.reflection, [ccx + Math.cos(am) * (R - 0.06), FLOOR + 1.6, ccz + Math.sin(am) * (R - 0.06)], false); s.rotation.set(0, Math.PI / 2 - am, -0.25);
  }
  // the fascia runs on round the corner: a small COIN LAUNDRY box on the curve
  const am = Math.PI / 4, cb = group(f, 'Corner sign', [ccx + Math.cos(am) * (R + 0.08), FLOOR + 2.85, ccz + Math.sin(am) * (R + 0.08)]); cb.rotation.y = am;
  plate(cb, 0.84, 0.44, 0.1, 0.05, m.frame, [0, 0, 0]); box(cb, 0.76, 0.36, 0.105, m.signGlow, [0, 0, 0], false);
  atlas.attach(cb, 'coinWide', 0.72, 0.34, [0, 0, 0.056]);
  for (const x of [X0 + 0.08]) box(f, 0.18, H + 0.02, 0.18, m.cream, [x, FLOOR + H / 2, Z1 - 0.07]);
  return f;
}

// Double glass door: each leaf on its own hinge, swinging out onto the step. Stays when the front is lifted.
export function Doors(root, m, atlas) {
  const { Z1, T, FLOOR, DOOR } = G, w = (DOOR.x1 - DOOR.x0) / 2 - 0.02;
  const leaf = (side) => {
    const x = side < 0 ? DOOR.x0 + 0.01 : DOOR.x1 - 0.01, d = -side;           // leaf runs from its hinge to the middle
    const hinge = group(root, side < 0 ? 'Laundry door hinge (left)' : 'Laundry door hinge (right)', [x, FLOOR + 0.01, Z1 - T / 2]);
    const lf = group(hinge, 'Open the laundry door'); lf.userData.action = 'laundryDoor';
    for (const px of [0.04, w - 0.04]) box(lf, 0.075, DOOR.h - 0.03, 0.06, m.frame, [d * px, (DOOR.h - 0.03) / 2, 0]);
    for (const y of [0.06, DOOR.h - 0.07]) box(lf, w, 0.1, 0.06, m.frame, [d * w / 2, y, 0]);
    box(lf, w - 0.12, DOOR.h - 0.26, 0.01, m.glass, [d * w / 2, DOOR.h / 2, 0], false);
    rod(lf, [d * (w - 0.1), 0.85, 0.06], [d * (w - 0.1), 1.35, 0.06], 0.018, m.chrome, 10);
    for (const y of [0.88, 1.32]) rod(lf, [d * (w - 0.1), y, 0.02], [d * (w - 0.1), y, 0.06], 0.012, m.chrome, 6);
    if (side > 0) { tube(lf, [[d * 0.1, 1.86, 0.035], [d * w / 2, 1.98, 0.035], [d * (w - 0.1), 1.86, 0.035]], 0.005, m.iron); plate(lf, 0.36, 0.2, 0.02, 0.02, m.cream, [d * w / 2, 1.72, 0.04]); atlas.attach(lf, 'open', 0.33, 0.17, [d * w / 2, 1.72, 0.052]); }
    return { hinge, leaf: lf };
  };
  return [leaf(-1), leaf(1)];
}

// ---- side and back walls (they stay when the front is lifted) -------------------------------------------------
export function SideWalls(root, m, atlas) {
  const { X0, X1, Z0, Z1, T, R, FLOOR } = G, t = T / 2, g = group(root, 'Side and back walls');
  // right wall, from the back corner to where the curve begins; local x = −world z
  const rl = Z1 - R - Z0, rc = (Z0 + Z1 - R) / 2, r = group(g, 'Right wall', [X1 - t, FLOOR, rc]); r.rotation.y = Math.PI / 2;
  const wr = [rc + 1.0, 1.15, rc + 1.95, 2.25];                         // world z −1.95 … −1.0
  wallWithHoles(r, rl, H, T, [rectPath(THREE.Path, ...wr)], m.wall); skirting(r, m, rl - 0.02, t);
  frameRing(r, m, wr, t); pane(r, m, wr); box(r, 0.06, wr[3] - wr[1], 0.1, m.frame, [(wr[0] + wr[2]) / 2, (wr[1] + wr[3]) / 2, 0]);
  wallWithHoles(r, rl - 0.4, H, 0.02, [rectPath(THREE.Path, ...wr)], m.interior, [0, 0, -t - 0.011]);
  WallLamp(r, m, [wr[0] - 0.45, 2.55, t], 0.26);
  // left wall: two high windows; back wall: back door, a small window, downpipe and the ladder to the roof
  const ll = Z1 - Z0, l = group(g, 'Left wall', [X0 + t, FLOOR, (Z0 + Z1) / 2]); l.rotation.y = -Math.PI / 2;
  const lw = [[-1.5, 1.4, -0.5, 2.3], [0.4, 1.4, 1.4, 2.3]];
  wallWithHoles(l, ll, H, T, lw.map(w => rectPath(THREE.Path, ...w)), m.wall); skirting(l, m, ll - 0.02, t);
  for (const w of lw) { frameRing(l, m, w, t, 0.08, 0.07); pane(l, m, w); }
  wallWithHoles(l, ll - 0.4, H, 0.02, lw.map(w => rectPath(THREE.Path, ...w)), m.interior, [0, 0, -t - 0.011]);
  const bl = X1 - X0, b = group(g, 'Back wall', [0, FLOOR, Z0 + t]); b.rotation.y = Math.PI;
  const bd = [-2.3, 0, -1.4, 2.1], bw = [0.6, 1.5, 1.4, 2.2];
  wallWithHoles(b, bl, H, T, [bd, bw].map(w => rectPath(THREE.Path, ...w)), m.wall); skirting(b, m, bl - 0.02, t, [[bd[0], bd[2]]]);
  frameRing(b, m, bd, t, 0.1, 0.07); box(b, 0.86, 2.06, 0.06, m.frame, [-1.85, 1.05, 0.0]); plate(b, 0.5, 0.5, 0.03, 0.04, m.cream, [-1.85, 1.55, 0.04]);
  frameRing(b, m, bw, t, 0.08, 0.07); pane(b, m, bw);
  box(b, bl - 0.4, H, 0.02, m.interior, [0, H / 2, -t - 0.011], false);
  // the back of a laundry: round dryer exhaust hoods in a row, an air unit on brackets, a notice board
  for (const [x, y] of [[-1.05, 1.9], [-0.35, 1.9], [-1.05, 2.55], [-0.35, 2.55]]) {
    const v = group(b, 'Dryer vent', [x, y, t]);
    inked(upright(cylinder(v, 0.13, 0.13, 0.06, m.steel, [0, 0, 0.03], false, 18)), m);    // the ink shell is its outline
    const hood = cylinder(v, 0.15, 0.15, 0.16, m.steel, [0, 0.02, 0.12], false, 18); hood.rotation.x = Math.PI / 2 - 0.5; hood.scale.set(1, 1, 0.55); inked(hood, m);
    box(v, 0.2, 0.012, 0.012, m.steelDark, [0, -0.1, 0.17], false);
  }
  const au = group(b, 'Wall air unit', [1.85, 0.55, t]);
  for (const x of [-0.35, 0.35]) { box(au, 0.04, 0.04, 0.42, m.steelDark, [x, 0, 0.21]); rod(au, [x, -0.22, 0.02], [x, 0, 0.4], 0.012, m.steelDark, 6); }
  plate(au, 0.85, 0.58, 0.32, 0.04, m.steel, [0, 0.31, 0.22]);
  inked(upright(cylinder(au, 0.19, 0.19, 0.02, m.steelDark, [0.14, 0.31, 0.385], true, 24)), m);
  for (let i = -2; i <= 2; i++) box(au, 0.36, 0.012, 0.006, m.steel, [0.14, 0.31 + i * 0.06, 0.4], false);
  tube(au, [[-0.3, 0.2, 0.22], [-0.42, 0.1, 0.12], [-0.45, 1.2, 0.04]], 0.02, m.cream);
  plate(b, 0.7, 0.5, 0.03, 0.03, m.walnut, [0.95, 1.45, t + 0.015]); atlas.attach(b, 'howto', 0.62, 0.42, [0.95, 1.45, t + 0.032]);
  rod(g, [X0 + 0.3, G.TOP + 0.15, Z0 - 0.08], [X0 + 0.3, G.GROUND + 0.1, Z0 - 0.08], 0.045, m.frame, 10);
  const lad = group(g, 'Roof ladder', [X1 - 0.75, G.GROUND, Z0 - 0.16]);
  for (const x of [-0.22, 0.22]) rod(lad, [x, 0, 0], [x, ROOF_Y + 0.8 - G.GROUND, 0], 0.022, m.rail, 8);
  for (let y = 0.35; y < ROOF_Y + 0.7 - G.GROUND; y += 0.3) rod(lad, [-0.22, y, 0], [0.22, y, 0], 0.015, m.rail, 6);
  for (const [x, z] of [[X0 + 0.07, Z0 + 0.07], [X1 - 0.07, Z0 + 0.07]]) box(g, 0.18, H + 0.02, 0.18, m.cream, [x, FLOOR + H / 2, z]);
  return g;
}

// ---- plinth with the rounded corner, and the door step -------------------------------------------------------
export function Base(root, m) {
  const { GROUND, FLOOR, DOOR, Z1 } = G, g = group(root, 'Plinth');
  slab(g, planShape(-0.04), GROUND, FLOOR - GROUND - 0.04, m.stone);
  slab(g, planShape(-0.07), FLOOR - 0.04, 0.04, m.cream);
  const cx = (DOOR.x0 + DOOR.x1) / 2;
  box(g, DOOR.x1 - DOOR.x0 + 0.5, (FLOOR - GROUND) / 2, 0.4, m.stone, [cx, GROUND + (FLOOR - GROUND) / 4, Z1 + 0.25]);
  box(g, DOOR.x1 - DOOR.x0 + 0.52, 0.03, 0.04, m.walnut, [cx, GROUND + (FLOOR - GROUND) / 2 - 0.015, Z1 + 0.43]);
  return g;
}

// ---- roof terrace: deck, parapet with a green rail, the giant washer sign, a drying platform, plants, plant room ----
export function Roof(root, m, atlas, plant) {
  const { TOP } = G, g = group(root, 'Roof terrace');
  slab(g, planShape(-0.08), TOP, 0.12, m.cream);                       // cornice
  slab(g, planShape(-0.03), TOP + 0.12, 0.06, m.frame);                 // mint fascia band
  slab(g, planShape(0.1), TOP + 0.18, 0.02, m.deck, false);              // deck in the theme colour
  band(g, 0, 0.16, TOP + 0.18, 0.34, m.wall);                            // parapet
  band(g, 0.03, 0.19, TOP + 0.52, 0.04, m.cream);                        // its cap
  // green metal rail along the parapet, following the curve
  const rail = [], { X0, X1, Z0, Z1, R } = G, e = 0.08, ry = TOP + 0.56;
  const push = (x, z) => rail.push([x, z]);
  for (let x = X0 + e; x <= X1 - R; x += 0.55) push(x, Z1 - e);
  for (let i = 0; i <= 6; i++) { const a = Math.PI / 2 - (i / 6) * Math.PI / 2; push(X1 - R + Math.cos(a) * (R - e), Z1 - R + Math.sin(a) * (R - e)); }
  for (let z = Z1 - R - 0.5; z >= Z0 + e; z -= 0.55) push(X1 - e, z);
  for (let x = X1 - e - 0.55; x >= X0 + e; x -= 0.55) push(x, Z0 + e);
  for (let z = Z0 + e + 0.55; z < Z1 - e; z += 0.55) push(X0 + e, z);
  for (const [x, z] of rail) box(g, 0.035, 0.46, 0.035, m.rail, [x, ry + 0.23, z]);
  const top = rail.map(([x, z]) => [x, ry + 0.46, z]), mid = rail.map(([x, z]) => [x, ry + 0.22, z]);
  tube(g, [...top, top[0]], 0.016, m.rail); tube(g, [...mid, mid[0]], 0.01, m.rail);
  // the giant washer: the laundry's signature, turned to face the default camera, on a mint plinth
  const sg = group(g, 'Giant washer sign', [-1.45, ROOF_Y, 0.35]); sg.rotation.y = 25 * Math.PI / 180;
  box(sg, 1.75, 0.22, 1.25, m.frame, [0, 0.11, 0]); box(sg, 1.82, 0.04, 1.32, m.cream, [0, 0.24, 0]);
  const W = Washer(sg, m, { pos: [0, 0.26, 0], w: 1.5, h: 1.62, d: 1.05, r: 0.42, doorY: 0.74, body: m.washCream, solid: true, glass: m.roofGlass, name: 'Rooftop washer' });
  box(W.group, 1.42, 1.0, 0.02, m.washBlue, [0, 0.62, 0.53], true);                      // blue front panel
  inked(ring(W.group, 0.5, 0.05, m.washCream, [0, 0.74, 0.545]), m);                        // cream bezel round the porthole
  plate(W.group, 0.42, 0.13, 0.05, 0.03, m.washCream, [-0.42, 1.18, 0.55]); box(W.group, 0.16, 0.02, 0.02, m.steelDark, [-0.42, 1.16, 0.578], false);  // detergent drawer
  inked(tube(sg, [[-0.7, 0.9, -0.45], [-0.95, 0.75, -0.5], [-1.0, 0.3, -0.42]], 0.035, m.steelDark), m);                    // the hose down to the plinth
  for (let i = 0; i < 5; i++) sphere(W.group, [0.07, 0.07, 0.04], m.paper, [0.12 + (i % 3) * 0.1 - 0.1, 0.62 + i * 0.07, 0.62], [10, 7]);  // bubbles on the glass
  // a little water tank on top, with legs and a pipe
  const tk = group(sg, 'Water tank', [0.35, 1.88, -0.2]);
  for (const [x, z] of [[-0.14, -0.14], [0.14, -0.14], [-0.14, 0.14], [0.14, 0.14]]) box(tk, 0.04, 0.2, 0.04, m.steelDark, [x, 0.1, z]);
  inked(cylinder(tk, 0.22, 0.22, 0.42, m.steel, [0, 0.41, 0], true, 24), m); inked(cone(tk, 0.23, 0.12, m.steel, [0, 0.68, 0], true, 24), m);
  tube(tk, [[0.2, 0.3, 0], [0.32, 0.25, 0], [0.34, -0.1, 0.05]], 0.02, m.steelDark);
  // wooden drying platform with two lines of clothes
  const dp = group(g, 'Drying platform', [1.45, ROOF_Y, -1.15]);
  box(dp, 2.2, 0.12, 1.3, m.wood, [0, 0.06, 0]); for (let i = 0; i < 6; i++) box(dp, 0.012, 0.125, 1.3, m.walnut, [-0.95 + i * 0.38, 0.06, 0], false);
  for (const x of [-1.0, 1.0]) for (const z of [-0.45, 0.35]) box(dp, 0.06, 1.35, 0.06, m.walnut, [x, 0.12 + 0.675, z]);
  const r = rng(4), shirts = [m.shirtPink, m.shirtBlue, m.shirtWhite, m.shirtYellow, m.shirtMint, m.shirtPink];
  for (const z of [-0.45, 0.35]) {
    rod(dp, [-1.0, 1.4, z], [1.0, 1.4, z], 0.006, m.ink, 4);
    for (let i = 0; i < 5; i++) {
      const x = -0.8 + i * 0.4, mat = shirts[(i + (z > 0 ? 2 : 0)) % shirts.length], tall = 0.34 + r() * 0.12;
      const c = box(dp, 0.28, tall, 0.012, mat, [x, 1.4 - tall / 2, z]); c.rotation.z = (r() - 0.5) * 0.08;
      box(dp, 0.02, 0.05, 0.02, m.woodLight, [x - 0.1, 1.4, z], false); box(dp, 0.02, 0.05, 0.02, m.woodLight, [x + 0.1, 1.4, z], false);
    }
  }
  // plant room: air unit, vent pipe with a cowl, a drain gutter
  const ac = group(g, 'Air unit', [-2.35, ROOF_Y, -1.55]);
  plate(ac, 0.9, 0.6, 0.55, 0.05, m.steel, [0, 0.3, 0]);
  inked(upright(cylinder(ac, 0.2, 0.2, 0.02, m.steelDark, [0.15, 0.3, 0.28], true, 28)), m);
  for (let i = -2; i <= 2; i++) box(ac, 0.38, 0.012, 0.006, m.steel, [0.15, 0.3 + i * 0.065, 0.295], false);
  for (const x of [-0.33, 0.33]) box(ac, 0.08, 0.05, 0.55, m.steelDark, [x, 0.025, 0]);
  const vp = group(g, 'Vent pipe', [-0.55, ROOF_Y, -1.7]);
  inked(cylinder(vp, 0.08, 0.08, 0.8, m.steel, [0, 0.4, 0], true, 18), m); inked(cone(vp, 0.15, 0.14, m.steel, [0, 0.9, 0], true, 18), m);
  // plants: big pots at the corners, a planter along the front, a vine tumbling over the parapet
  plant(g, m, [-2.7, ROOF_Y, 1.75], { r: 0.2, h: 0.3, kind: 'leafy' });
  plant(g, m, [0.3, ROOF_Y, 1.75], { r: 0.16, h: 0.24, kind: 'flowers' });
  plant(g, m, [2.55, ROOF_Y, 0.25], { r: 0.17, h: 0.26, kind: 'bush' });
  plant(g, m, [0.15, ROOF_Y, -1.75], { r: 0.15, h: 0.22, kind: 'bush' });
  const pb = group(g, 'Front planter', [-0.95, ROOF_Y, 1.82]);
  box(pb, 1.3, 0.26, 0.28, m.wood, [0, 0.13, 0]); box(pb, 1.34, 0.04, 0.32, m.walnut, [0, 0.27, 0]);
  for (let i = 0; i < 6; i++) { const x = -0.55 + i * 0.22; inked(sphere(pb, [0.11, 0.09, 0.11], i % 2 ? m.leaf : m.leafLight, [x, 0.34, 0], [9, 6]), m); sphere(pb, [0.04, 0.035, 0.04], i % 2 ? m.blossom : m.shirtYellow, [x + 0.03, 0.44, 0.05], [8, 5]); }
  return g;
}
