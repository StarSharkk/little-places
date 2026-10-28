import * as THREE from 'three';
import { group, box, plate, rod, tube, cylinder, sphere, cone, mesh, rectPath, discPath, extrudeShape, wallWithHoles } from './primitives.js';
import { hull } from './outline.js';

// Shared measurements (metres). Front façade faces +z, the takeaway window +x.
export const G = {
  GROUND: 0.155, FLOOR: 0.405, X0: -2.9, X1: 2.9, Z0: -1.9, Z1: 1.9, T: 0.2, TOP: 3.55,
  WIN: { x0: -2.5, x1: 0.9, y0: 0.5, y1: 2.4 },        // front window, local to the floor
  DOOR: { x0: 1.35, x1: 2.25, h: 2.2 },
};
export const H = G.TOP - G.FLOOR;
export const ROOF_Y = G.TOP + 0.19;                     // top of the roof membrane

export function rng(seed) {
  return () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const upright = (o) => ((o.rotation.x = Math.PI / 2), o);   // turn before inking: the ink copy takes the transform it has
const inked = (mesh, m) => (hull(mesh, m.hull), mesh);

// Scattered brick faces on a plastered wall (local +z outward, face at z = t), avoiding openings.
function bricks(g, m, { w, h, t, holes = [], seed = 1, n = 20 }) {
  const r = rng(seed);
  for (let placed = 0, tries = 0; placed < n && tries < n * 10; tries++) {
    const x = (r() - 0.5) * (w - 0.5), y = 0.5 + r() * (h - 0.8);
    if (holes.some(([a, b, c, d]) => x > a - 0.25 && x < c + 0.25 && y > b - 0.15 && y < d + 0.15)) continue;
    box(g, 0.26, 0.085, 0.022, m.wallShade, [x, y, t + 0.011]);
    if (r() < 0.6) box(g, 0.26, 0.085, 0.022, m.wallShade, [x + (r() < 0.5 ? 0.14 : -0.14), y + 0.105, t + 0.011]);
    placed++;
  }
}
// stone skirting along a wall face, split around door openings ([x0, x1] pairs)
function skirting(g, m, w, t, gaps = []) {
  let x = -w / 2;
  for (const [a, b] of [...gaps, [w / 2, w / 2]]) { if (a - x > 0.05) box(g, a - x, 0.3, 0.04, m.stone, [(x + a) / 2, 0.15, t + 0.02]); x = b; }
}
function frameRing(g, m, [x0, y0, x1, y1], t, d = 0.1, rim = 0.09) {
  const s = rectPath(THREE.Shape, x0 - rim, y0 - rim, x1 + rim, y1 + rim); s.holes.push(rectPath(THREE.Path, x0, y0, x1, y1));
  extrudeShape(g, s, d, m.frame, [0, 0, t + d / 2 - 0.02]);
}
function pane(g, m, [x0, y0, x1, y1], z = -0.03) {
  box(g, x1 - x0, y1 - y0, 0.012, m.glass, [(x0 + x1) / 2, (y0 + y1) / 2, z], false);
  const s = box(g, 0.022, Math.min(0.7, (y1 - y0) * 0.5), 0.006, m.reflection, [x0 + (x1 - x0) * 0.3, y0 + (y1 - y0) * 0.55, z + 0.012], false); s.rotation.z = -0.25;
}

export function WallLamp(p, m, pos, out = 0.3) {
  const l = group(p, 'Wall lamp', pos);
  plate(l, 0.12, 0.18, 0.03, 0.03, m.iron, [0, 0, 0.015]);
  tube(l, [[0, 0, 0.03], [0, 0.1, 0.12], [0, 0.1, out - 0.06], [0, 0.04, out]], 0.014, m.iron);
  cone(l, 0.11, 0.12, m.iron, [0, 0.0, out], true, 16);
  inked(sphere(l, [0.055, 0.05, 0.055], m.glow, [0, -0.07, out], [12, 8]), m);
  return l;
}

// Striped canopy: alternating coral and cream bands sloping out from the wall, a scalloped valance, side cheeks.
export function Awning(p, m, { len, out = 0.95, drop = 0.48, pos, turn = 0, n }) {
  const g = group(p, 'Striped awning', pos); g.rotation.y = turn;
  const stripes = n ?? Math.max(5, Math.round(len / 0.26)), sw = len / stripes, slope = Math.atan2(drop, out), L = Math.hypot(out, drop);
  for (let i = 0; i < stripes; i++) {
    const x = -len / 2 + sw * (i + 0.5), mat = i % 2 ? m.stripe : m.coral;
    const b = box(g, sw + 0.002, 0.03, L, mat, [x, -drop / 2, out / 2]); b.rotation.x = slope;
    const v = new THREE.Shape(); v.moveTo(-sw / 2, 0); v.lineTo(sw / 2, 0); v.lineTo(sw / 2, -0.13); v.absarc(0, -0.13, sw / 2, 0, -Math.PI, true); v.lineTo(-sw / 2, 0);
    extrudeShape(g, v, 0.025, mat, [x, -drop + 0.01, out + 0.005], false);
  }
  for (const s of [-1, 1]) {
    const cheek = new THREE.Shape(); cheek.moveTo(0, 0); cheek.lineTo(out, -drop); cheek.lineTo(out, -drop - 0.13); cheek.lineTo(0, -0.05); cheek.closePath();
    const c = extrudeShape(g, cheek, 0.025, m.coral, [s * (len / 2 + 0.013), 0, 0]); c.rotation.y = -Math.PI / 2;
  }
  box(g, len + 0.08, 0.08, 0.08, m.walnut, [0, 0.0, 0.04]);
  for (const x of [-len / 2 + 0.08, len / 2 - 0.08]) rod(g, [x, -0.42, 0.02], [x, -drop + 0.02, out - 0.05], 0.014, m.iron, 6);
  return g;
}

// ---- front façade: the part see-through lifts away (window, sign, awning, emblem, lamp) -------------------
export function Facade(root, m, atlas) {
  const { X0, X1, Z1, T, FLOOR, WIN, DOOR } = G, t = T / 2, w = X1 - X0;
  const f = group(root, 'Front façade', [0, FLOOR, Z1 - t]);
  const winR = [WIN.x0, WIN.y0, WIN.x1, WIN.y1], doorR = [DOOR.x0, 0, DOOR.x1, DOOR.h], transR = [DOOR.x0 + 0.06, DOOR.h + 0.14, DOOR.x1 - 0.06, DOOR.h + 0.44];
  wallWithHoles(f, w, H, T, [winR, doorR, transR].map(r => rectPath(THREE.Path, ...r)), m.wall);
  skirting(f, m, w - 0.02, t, [[DOOR.x0, DOOR.x1]]);
  bricks(f, m, { w, h: H - 0.3, t, holes: [winR, [DOOR.x0, 0, DOOR.x1, DOOR.h + 0.5], [-2.9, 2.55, 1.4, 3.2]], seed: 3, n: 14 });
  // shop window: thick mint frame, two mullions and a transom, glazing, a cream sill
  frameRing(f, m, winR, t);
  for (const x of [WIN.x0 + (WIN.x1 - WIN.x0) / 3, WIN.x0 + 2 * (WIN.x1 - WIN.x0) / 3]) box(f, 0.07, WIN.y1 - WIN.y0, 0.12, m.frame, [x, (WIN.y0 + WIN.y1) / 2, 0]);
  box(f, WIN.x1 - WIN.x0, 0.07, 0.12, m.frame, [(WIN.x0 + WIN.x1) / 2, WIN.y1 - 0.42, 0]);
  for (let k = 0; k < 3; k++) { const a = WIN.x0 + k * (WIN.x1 - WIN.x0) / 3; pane(f, m, [a, WIN.y0, a + (WIN.x1 - WIN.x0) / 3, WIN.y1]); }
  plate(f, WIN.x1 - WIN.x0 + 0.34, 0.08, 0.3, 0.03, m.cream, [(WIN.x0 + WIN.x1) / 2, WIN.y0 - 0.12, t + 0.12]);
  // door surround and its little transom
  frameRing(f, m, doorR, t, 0.1, 0.08); frameRing(f, m, transR, t, 0.08, 0.06); pane(f, m, transR);
  // striped awning over the window
  Awning(f, m, { len: WIN.x1 - WIN.x0 + 0.4, pos: [(WIN.x0 + WIN.x1) / 2, WIN.y1 + 0.42, t], out: 1.0, drop: 0.5 });
  // name board on the parapet line, round pizza emblem above the door, lamp beside it
  const sy = H + 0.12, sx = -0.7;
  plate(f, 4.3, 0.78, 0.08, 0.06, m.walnut, [sx, sy, t + 0.06]);
  plate(f, 4.16, 0.66, 0.1, 0.05, m.cream, [sx, sy, t + 0.1]);
  atlas.attach(f, 'sign', 3.95, 0.66, [sx, sy, t + 0.152]);
  const e = group(f, 'Pizza emblem', [2.15, sy + 0.02, t + 0.1]);
  const ring = cylinder(e, 0.36, 0.36, 0.08, m.coral, [0, 0, 0], true, 32); ring.rotation.x = Math.PI / 2; hull(ring, m.hull);
  atlas.disc(e, 'emblem', 0.33, [0, 0, 0.042], false);
  WallLamp(f, m, [2.62, 2.45, t], 0.32);
  // poster and hours on the pier left of the door
  plate(f, 0.34, 0.46, 0.03, 0.02, m.walnut, [1.12, 1.5, t + 0.015]); atlas.attach(f, 'poster', 0.3, 0.42, [1.12, 1.5, t + 0.032]);
  plate(f, 0.34, 0.17, 0.02, 0.02, m.cream, [1.12, 1.0, t + 0.01]); atlas.attach(f, 'hours', 0.32, 0.16, [1.12, 1.0, t + 0.022]);
  return f;
}

// The door stays put when the façade is lifted; it turns on its own hinge and opens outwards.
export function Door(root, m, atlas) {
  const { Z1, T, FLOOR, DOOR } = G, w = DOOR.x1 - DOOR.x0 - 0.04;
  const hinge = group(root, 'Pizzeria door hinge', [DOOR.x0 + 0.02, FLOOR + 0.01, Z1 - T / 2]);
  const leaf = group(hinge, 'Open the pizzeria door'); leaf.userData.action = 'pizzaDoor';
  box(leaf, w, DOOR.h - 0.03, 0.06, m.door, [w / 2, (DOOR.h - 0.03) / 2, 0]);
  box(leaf, w - 0.24, 0.62, 0.012, m.doorGlass, [w / 2, 1.55, 0.034], false);
  box(leaf, 0.03, 0.62, 0.02, m.door, [w / 2, 1.55, 0.04], false); box(leaf, w - 0.24, 0.03, 0.02, m.door, [w / 2, 1.55, 0.04], false);
  for (const y of [0.36, 0.92]) plate(leaf, w - 0.24, 0.36, 0.03, 0.03, m.door, [w / 2, y, 0.04]);
  rod(leaf, [w - 0.1, 1.0, 0.075], [w - 0.1, 1.24, 0.075], 0.016, m.brass, 8);
  for (const y of [1.02, 1.22]) rod(leaf, [w - 0.1, y, 0.03], [w - 0.1, y, 0.075], 0.012, m.brass, 6);
  tube(leaf, [[w / 2 - 0.15, 1.38, 0.045], [w / 2, 1.5, 0.045], [w / 2 + 0.15, 1.38, 0.045]], 0.005, m.iron);
  plate(leaf, 0.42, 0.24, 0.02, 0.02, m.cream, [w / 2, 1.25, 0.05]); atlas.attach(leaf, 'open', 0.38, 0.2, [w / 2, 1.25, 0.062]);
  return { hinge, leaf };
}

// ---- right side: takeaway window with a ledge of pizza boxes; left and back walls --------------------------
export function SideWalls(root, m, atlas) {
  const { X0, X1, Z0, Z1, T, FLOOR } = G, t = T / 2, len = Z1 - Z0;
  const g = group(root, 'Side walls');
  // right wall, local x = −world z
  const r = group(g, 'Right wall', [X1 - t, FLOOR, (Z0 + Z1) / 2]); r.rotation.y = Math.PI / 2;
  const take = [-1.15, 0.95, 0.1, 2.1];
  wallWithHoles(r, len, H, T, [rectPath(THREE.Path, ...take), discPath(THREE.Path, 1.1, 1.95, 0.3, true)], m.wall);
  skirting(r, m, len - 0.02, t); bricks(r, m, { w: len, h: H - 0.3, t, holes: [take, [0.75, 1.6, 1.45, 2.3]], seed: 5, n: 10 });
  wallWithHoles(r, len - 0.4, H, 0.02, [rectPath(THREE.Path, ...take), discPath(THREE.Path, 1.1, 1.95, 0.3, true)], m.interior, [0, 0, -t - 0.011]);
  frameRing(r, m, take, t);
  box(r, 0.62, 1.1, 0.03, m.frame, [-0.84, 1.52, -0.02], false); pane(r, m, [-0.53, take[1], take[2], take[3]]);
  const port = discPath(THREE.Shape, 1.1, 1.95, 0.38); port.holes.push(discPath(THREE.Path, 1.1, 1.95, 0.3, true));
  extrudeShape(r, port, 0.08, m.frame, [0, 0, t + 0.03]); box(r, 0.6, 0.6, 0.012, m.glass, [1.1, 1.95, -0.03], false);
  // ledge with brackets
  box(r, 1.55, 0.06, 0.42, m.walnut, [-0.52, 0.95, t + 0.2]);
  for (const x of [-1.1, 0.06]) { const b = new THREE.Shape(); b.moveTo(0, 0); b.lineTo(0.3, 0); b.lineTo(0, -0.3); b.closePath(); const s = extrudeShape(r, b, 0.04, m.walnut, [x, 0.92, t]); s.rotation.y = -Math.PI / 2; }
  Awning(r, m, { len: 1.75, pos: [-0.52, 2.55, t], out: 0.8, drop: 0.4 });
  // hanging blade sign near the front corner
  rod(r, [-1.72, 2.72, t], [-1.72, 2.72, t + 0.62], 0.016, m.iron, 6);
  const bl = group(r, 'Blade sign', [-1.72, 2.4, t + 0.38]);
  for (const z of [-0.18, 0.18]) rod(bl, [0, 0.32, z], [0, 0.2, z], 0.006, m.iron, 4);
  const board = box(bl, 0.03, 0.36, 0.56, m.cream, [0, 0, 0]);
  atlas.attach(bl, 'blade', 0.52, 0.27, [0.017, 0, 0], Math.PI / 2); atlas.attach(bl, 'blade', 0.52, 0.27, [-0.017, 0, 0], -Math.PI / 2);
  WallLamp(r, m, [1.1, 2.6, t], 0.28);
  // left wall, local x = world z: one window towards the street
  const l = group(g, 'Left wall', [X0 + t, FLOOR, (Z0 + Z1) / 2]); l.rotation.y = -Math.PI / 2;
  const lw = [0.2, 1.0, 1.2, 2.2];
  wallWithHoles(l, len, H, T, [rectPath(THREE.Path, ...lw)], m.wall); skirting(l, m, len - 0.02, t);
  bricks(l, m, { w: len, h: H - 0.3, t, holes: [lw], seed: 7, n: 10 }); frameRing(l, m, lw, t); pane(l, m, lw);
  box(l, 0.06, 1.2, 0.1, m.frame, [0.7, 1.6, 0]);
  wallWithHoles(l, len - 0.4, H, 0.02, [rectPath(THREE.Path, ...lw)], m.interior, [0, 0, -t - 0.011]);
  // back wall with a downpipe
  const b = group(g, 'Back wall', [0, FLOOR, Z0 + t]); b.rotation.y = Math.PI;
  box(b, X1 - X0, H, T, m.wall, [0, H / 2, 0]); skirting(b, m, X1 - X0 - 0.02, t); bricks(b, m, { w: X1 - X0, h: H - 0.3, t, seed: 9, n: 12 });
  box(b, X1 - X0 - 0.4, H, 0.02, m.interior, [0, H / 2, -t - 0.011], false);
  rod(g, [X0 + 0.25, G.TOP + 0.1, Z0 - 0.08], [X0 + 0.25, G.GROUND + 0.1, Z0 - 0.08], 0.045, m.frame, 10);
  // corner piers in cream stone
  for (const x of [X0 + 0.07, X1 - 0.07]) for (const z of [Z0 + 0.07, Z1 - 0.07]) box(g, 0.18, H + 0.02, 0.18, m.cream, [x, FLOOR + H / 2, z]);
  return { group: g, right: r };
}

// ---- plinth and the door step ----------------------------------------------------------------------
export function Base(root, m) {
  const { GROUND, FLOOR, X0, X1, Z0, Z1, DOOR } = G, g = group(root, 'Plinth');
  box(g, X1 - X0 + 0.08, FLOOR - GROUND, Z1 - Z0 + 0.08, m.stone, [(X0 + X1) / 2, (FLOOR + GROUND) / 2, (Z0 + Z1) / 2]);
  box(g, X1 - X0 + 0.12, 0.04, Z1 - Z0 + 0.12, m.cream, [(X0 + X1) / 2, FLOOR - 0.02, (Z0 + Z1) / 2]);
  const cx = (DOOR.x0 + DOOR.x1) / 2;
  box(g, DOOR.x1 - DOOR.x0 + 0.4, (FLOOR - GROUND) / 2, 0.36, m.stone, [cx, GROUND + (FLOOR - GROUND) / 4, Z1 + 0.22]);
  box(g, DOOR.x1 - DOOR.x0 + 0.42, 0.03, 0.04, m.walnut, [cx, GROUND + (FLOOR - GROUND) / 2 - 0.015, Z1 + 0.38]);
  return g;
}

// ---- roof: parapet, membrane, chimney, air unit, plants and the giant slice on a little stand ----------------
export function Roof(root, m, atlas, plant) {
  const { X0, X1, Z0, Z1, TOP } = G, w = X1 - X0, d = Z1 - Z0, cx = (X0 + X1) / 2, cz = (Z0 + Z1) / 2;
  const g = group(root, 'Roof');
  box(g, w + 0.12, 0.17, d + 0.12, m.cream, [cx, TOP + 0.085, cz]);
  box(g, w - 0.2, 0.02, d - 0.2, m.roof, [cx, ROOF_Y - 0.01, cz], false);
  const ph = 0.36, pt = 0.16, py = TOP + 0.17 + ph / 2;
  box(g, w + 0.12, ph, pt, m.wall, [cx, py, Z1 - pt / 2 + 0.06]); box(g, w + 0.12, ph, pt, m.wall, [cx, py, Z0 + pt / 2 - 0.06]);
  box(g, pt, ph, d - 2 * pt + 0.12, m.wall, [X0 + pt / 2 - 0.06, py, cz]); box(g, pt, ph, d - 2 * pt + 0.12, m.wall, [X1 - pt / 2 + 0.06, py, cz]);
  const capY = TOP + 0.17 + ph + 0.025;
  box(g, w + 0.2, 0.05, pt + 0.06, m.cream, [cx, capY, Z1 - pt / 2 + 0.06]); box(g, w + 0.2, 0.05, pt + 0.06, m.cream, [cx, capY, Z0 + pt / 2 - 0.06]);
  box(g, pt + 0.06, 0.05, d, m.cream, [X0 + pt / 2 - 0.06, capY, cz]); box(g, pt + 0.06, 0.05, d, m.cream, [X1 - pt / 2 + 0.06, capY, cz]);
  // oven chimney in brick red with a cream cap and a clay pot
  const ch = group(g, 'Oven chimney', [2.05, ROOF_Y, -1.2]);
  box(ch, 0.62, 1.45, 0.62, m.brickRed, [0, 0.725, 0]);
  for (let i = 0; i < 6; i++) box(ch, 0.633, 0.012, 0.633, m.wallShade, [0, 0.2 + i * 0.22, 0], false);
  box(ch, 0.74, 0.08, 0.74, m.cream, [0, 1.49, 0]); box(ch, 0.66, 0.06, 0.66, m.cream, [0, 1.56, 0]);
  inked(cylinder(ch, 0.13, 0.15, 0.24, m.terracotta, [0, 1.71, 0], true, 20), m);
  // air unit with a fan grille
  const ac = group(g, 'Air unit', [0.55, ROOF_Y, -1.25]); ac.rotation.y = 0.1;
  plate(ac, 0.95, 0.62, 0.62, 0.05, m.steel, [0, 0.31, 0]);
  inked(upright(cylinder(ac, 0.22, 0.22, 0.02, m.steelDark, [0.15, 0.31, 0.315], true, 28)), m);
  for (let i = -2; i <= 2; i++) box(ac, 0.42, 0.012, 0.006, m.steel, [0.15, 0.31 + i * 0.07, 0.33], false);
  for (let i = 0; i < 5; i++) box(ac, 0.012, 0.42, 0.006, m.steelDark, [-0.36 + i * 0.03, 0.33, 0.315], false);
  for (const x of [-0.35, 0.35]) box(ac, 0.08, 0.06, 0.62, m.steelDark, [x, 0.03, 0]);
  // plants at the front corners of the roof, the left one tumbling over the parapet
  plant(g, m, [-2.45, ROOF_Y, 1.35], { r: 0.2, h: 0.32, kind: 'leafy' });
  plant(g, m, [2.45, ROOF_Y, 1.4], { r: 0.16, h: 0.26, kind: 'bush' });
  plant(g, m, [-2.5, ROOF_Y, -1.4], { r: 0.15, h: 0.24, kind: 'flowers' });
  RooftopSlice(g, m);
  return g;
}

// The giant pizza slice: cheese with melted drips along its lower edge, a thick crust, pepperoni and basil,
// drawn in dark-brown ink and set on a plank between two short posts.
function RooftopSlice(g, m) {
  // turned to face the default camera (azimuth 25°) instead of showing its edge
  const s = group(g, 'Rooftop pizza sign', [-0.55, ROOF_Y, -0.25]); s.rotation.y = 25 * Math.PI / 180;
  const postH = 0.62, barY = postH + 0.08;
  for (const x of [-0.85, 0.85]) { box(s, 0.12, postH, 0.12, m.walnut, [x, postH / 2, 0]); box(s, 0.2, 0.05, 0.2, m.walnut, [x, 0.025, 0]); }
  box(s, 2.4, 0.08, 0.26, m.wood, [0, postH + 0.04, 0]);
  const R = 2.35, A = 0.9, inner = R - 0.24;               // radius and opening angle of the slice
  const piece = group(s, 'Pizza slice', [-1.15, barY, 0.06]); piece.rotation.z = 0.06;
  // cheese: wedge from the tip with three rounded drips hanging below the lower edge
  const cheese = new THREE.Shape(); cheese.moveTo(0, 0);
  for (const [x, len] of [[0.55, 0.22], [1.05, 0.32], [1.6, 0.2]]) { cheese.lineTo(x - 0.09, 0); cheese.lineTo(x - 0.09, -len); cheese.absarc(x, -len, 0.09, Math.PI, 0, false); cheese.lineTo(x + 0.09, 0); }
  cheese.lineTo(inner, 0); cheese.absarc(0, 0, inner, 0, A, false); cheese.lineTo(0, 0);
  const crust = new THREE.Shape(); crust.absarc(0, 0, R, 0, A, false); crust.absarc(0, 0, inner - 0.02, A, 0, true); crust.closePath();
  const slab = (shape, depth, mat, z) => {
    const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSize: 0.035, bevelThickness: 0.035, bevelSegments: 2, curveSegments: 20 });
    geo.translate(0, 0, -depth / 2);
    const o = mesh(piece, geo, mat, [0, 0, z], false); hull(o, m.pizzaInk); return o;
  };
  slab(cheese, 0.12, m.cheese, 0);
  slab(crust, 0.2, m.crust, 0);
  tube(piece, cheese.getSpacedPoints(90).filter(p => p.x > 0.02 || p.y > 0.02).map(p => [p.x, p.y, 0.098]), 0.008, m.pizzaLine);
  // toppings: pepperoni discs with a darker centre, basil leaves
  for (const [a, rr, size] of [[0.22, 0.75, 0.2], [0.55, 1.15, 0.22], [0.25, 1.55, 0.21], [0.62, 1.75, 0.19], [0.4, 0.45, 0.14]]) {
    const p = [Math.cos(a) * rr, Math.sin(a) * rr, 0.1];
    const disc = cylinder(piece, size, size, 0.04, m.pepperoni, p, false, 28); disc.rotation.x = Math.PI / 2; hull(disc, m.pizzaInk);
    sphere(piece, [size * 0.22, size * 0.16, 0.01], m.tomato, [p[0] + size * 0.3, p[1] + size * 0.25, 0.122], [8, 6]);
  }
  for (const [a, rr, rot] of [[0.45, 1.4, 0.6], [0.7, 1.0, -0.4], [0.15, 1.95, 1.2]]) {
    const leaf = sphere(piece, [0.16, 0.08, 0.025], m.basil, [Math.cos(a) * rr, Math.sin(a) * rr, 0.115], [12, 8]); leaf.rotation.z = rot; hull(leaf, m.pizzaInk);
  }
  return s;
}
