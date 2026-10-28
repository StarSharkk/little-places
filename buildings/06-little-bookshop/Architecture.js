import * as THREE from 'three';
import { group, box, plate, rod, tube, sphere, cylinder, cone, mesh, cached, rectPath, discPath, extrudeShape, wallWithHoles } from './primitives.js';

// Shared measurements (metres). The shop sits on a raised floor; a wooden deck runs along its right side.
export const G = {
  GROUND: 0.155, FLOOR: 0.505, X0: -2.9, X1: 2.9, Z0: -1.9, Z1: 1.7, T: 0.2,
  TOP: 3.65, TERRACE: 3.85, DECK_X1: 4.83,
  WIN: { x0: -2.45, x1: 1.75, y0: 0.55, y1: 2.45 },   // front window, local to the floor
  DOOR: 0.6,                                         // half-width of the double door
};
const H = G.TOP - G.FLOOR;

// stone skirting + cream wainscot + frame-coloured rail on any wall face (local +z outward, face at z = t)
function dado(g, m, len, t, x = 0) {
  box(g, len, 0.12, 0.04, m.stone, [x, 0.06, t + 0.02]);
  box(g, len - 0.02, 0.42, 0.025, m.cream, [x, 0.33, t + 0.0125]);
  box(g, len + 0.01, 0.05, 0.045, m.frame, [x, 0.565, t + 0.022]);
}
function cornerPost(g, m, x, z) { box(g, 0.16, H + 0.02, 0.16, m.cream, [x, G.FLOOR + H / 2, z]); }

export function WallLamp(p, m, pos, out = 0.22) {
  const l = group(p, 'Wall lamp', pos);
  plate(l, 0.11, 0.16, 0.03, 0.02, m.walnut, [0, 0, 0.015]);
  tube(l, [[0, 0, 0.03], [0, 0.06, 0.1], [0, 0.07, out - 0.05], [0, 0.03, out]], 0.012, m.walnut);
  cone(l, 0.085, 0.09, m.frame, [0, 0.01, out], true, 14);
  sphere(l, [0.04, 0.03, 0.04], m.glow, [0, -0.04, out], [10, 6]);
  return l;
}

// ---- the front façade (window, sign, lamps) is what see-through lifts away; side and back walls stay ---------
export function Shell(root, m, atlas) {
  const g = group(root, 'Removable façade');
  const { X0, X1, Z0, Z1, T, FLOOR, WIN } = G;
  // front façade
  const f = group(g, 'Front façade', [0, FLOOR, Z1 - T / 2]);
  wallWithHoles(f, X1 - X0, H, T, [rectPath(THREE.Path, WIN.x0, WIN.y0, WIN.x1, WIN.y1)], m.wall, [0, 0, 0]);
  const t = T / 2;
  dado(f, m, X1 - X0 - 0.3, t);
  // window: thick frame, four lights below a transom row, cream glazing beads
  const ww = WIN.x1 - WIN.x0, wcx = (WIN.x0 + WIN.x1) / 2, wcy = (WIN.y0 + WIN.y1) / 2, wh = WIN.y1 - WIN.y0;
  const ring = rectPath(THREE.Shape, WIN.x0 - 0.12, WIN.y0 - 0.06, WIN.x1 + 0.12, WIN.y1 + 0.12); ring.holes.push(rectPath(THREE.Path, WIN.x0, WIN.y0, WIN.x1, WIN.y1));
  extrudeShape(f, ring, 0.1, m.frame, [0, 0, t + 0.03]);
  const tr = WIN.y1 - 0.5;
  for (let k = 1; k < 4; k++) box(f, 0.07, wh, 0.11, m.frame, [WIN.x0 + (ww * k) / 4, wcy, 0.01]);
  box(f, ww, 0.07, 0.11, m.frame, [wcx, tr, 0.01]);
  for (let k = 0; k < 4; k++) box(f, 0.035, 0.46, 0.08, m.cream, [WIN.x0 + (ww * (k + 0.5)) / 4, (tr + WIN.y1) / 2, 0.01], false);
  for (let k = 0; k < 4; k++) { const x = WIN.x0 + (ww * (k + 0.5)) / 4; const s = box(f, 0.022, 0.62, 0.008, m.reflection, [x - 0.25, WIN.y0 + 0.75, -0.02], false); s.rotation.z = -0.22; }
  box(f, ww, wh, 0.012, m.glass, [wcx, wcy, -0.04], false);
  plate(f, ww + 0.36, 0.08, 0.3, 0.03, m.cream, [wcx, WIN.y0 - 0.1, t + 0.13]);
  for (const x of [WIN.x0 + 0.3, wcx, WIN.x1 - 0.3]) box(f, 0.09, 0.1, 0.14, m.cream, [x, WIN.y0 - 0.2, t + 0.07]);
  // sign: walnut-rimmed cream board reading “bookstore”, lit by two gooseneck lamps from the cornice
  const sx = -0.35, sy = H - 0.33;
  plate(f, 3.84, 0.66, 0.08, 0.07, m.walnut, [sx, sy, t + 0.04]);
  plate(f, 3.7, 0.54, 0.12, 0.05, m.cream, [sx, sy, t + 0.07]);
  atlas.attach(f, 'sign', 3.36, 0.53, [sx, sy, t + 0.132]);
  // the lamps sit off the ends of the lettering so they never cross it
  for (const lx of [sx - 1.55, sx + 1.55]) {
    tube(f, [[lx, H + 0.06, t + 0.08], [lx, H + 0.2, t + 0.25], [lx, H + 0.14, t + 0.42], [lx, H + 0.04, t + 0.46]], 0.014, m.walnut);
    const shade = cone(f, 0.09, 0.12, m.walnut, [lx, H, t + 0.46], true, 14); shade.rotation.x = 0.5;
    sphere(f, [0.035, 0.035, 0.035], m.glow, [lx, H - 0.05, t + 0.49], [8, 6]);
  }
  // pier right of the window: a framed poster and the opening hours
  plate(f, 0.5, 0.7, 0.03, 0.03, m.walnut, [2.33, 1.45, t + 0.015]); atlas.attach(f, 'poster2', 0.44, 0.64, [2.33, 1.45, t + 0.032]);
  plate(f, 0.42, 0.22, 0.02, 0.02, m.cream, [2.33, 0.88, t + 0.01]); atlas.attach(f, 'hours', 0.38, 0.19, [2.33, 0.88, t + 0.022]);
  for (const x of [X0 + 0.08, X1 - 0.08]) cornerPost(g, m, x, Z1 - 0.06);
  return g;
}

// ---- left and back walls, lined inside with warm plaster ---------------------------------------------------
export function SideWalls(root, m) {
  const g = group(root, 'Side and back walls');
  const { X0, X1, Z0, Z1, T, FLOOR } = G, t = T / 2;
  // left wall: a round window with a cream surround
  const l = group(g, 'Left wall', [X0 + T / 2, FLOOR, -0.1]); l.rotation.y = -Math.PI / 2;
  wallWithHoles(l, Z1 - Z0, H, T, [discPath(THREE.Path, 0, 1.75, 0.42, true)], m.wall, [0, 0, 0]);
  dado(l, m, Z1 - Z0 - 0.3, t);
  const orb = discPath(THREE.Shape, 0, 1.75, 0.54); orb.holes.push(discPath(THREE.Path, 0, 1.75, 0.42, true));
  extrudeShape(l, orb, 0.08, m.cream, [0, 0, t + 0.04]);
  for (const r of [0, Math.PI / 2]) { const b = box(l, 0.84, 0.05, 0.06, m.frame, [0, 1.75, 0.0], false); b.rotation.z = r; }
  box(l, 0.84, 0.84, 0.012, m.glass, [0, 1.75, -0.03], false);
  wallWithHoles(l, Z1 - Z0 - 0.4, H, 0.02, [discPath(THREE.Path, 0, 1.75, 0.42, true)], m.interior, [0, 0, -t - 0.011]);
  // back wall with a downpipe
  const b = group(g, 'Back wall', [0, FLOOR, Z0 + T / 2]); b.rotation.y = Math.PI;
  box(b, X1 - X0, H, T, m.wall, [0, H / 2, 0]); dado(b, m, X1 - X0 - 0.3, t);
  box(b, X1 - X0 - 0.4, H, 0.02, m.interior, [0, H / 2, -t - 0.011], false);
  rod(g, [X1 - 0.3, G.TOP - 0.05, Z0 - 0.08], [X1 - 0.3, G.GROUND + 0.1, Z0 - 0.08], 0.04, m.frame, 10);
  for (const x of [X0 + 0.08, X1 - 0.08]) cornerPost(g, m, x, Z0 + 0.06);
  return g;
}

// ---- right side: the glazed shopfront with a double door, kept when see-through is on -------------------------
export function Storefront(root, m, atlas) {
  const { X1, Z0, Z1, T, FLOOR, DOOR } = G;
  const r = group(root, 'Glazed shopfront', [X1 - T / 2, FLOOR, (Z0 + Z1) / 2]); r.rotation.y = Math.PI / 2;
  const len = Z1 - Z0, OW = 1.45, OH = 2.6, t = T / 2;
  wallWithHoles(r, len, H, T, [rectPath(THREE.Path, -OW, 0, OW, OH)], m.wall, [0, 0, 0]);
  for (const s of [-1, 1]) dado(r, m, len / 2 - OW - 0.02, t, s * (len / 4 + OW / 2));
  // frame: posts, transom bar, sill bars; glazing in the side lights and over the door
  for (const x of [-OW, -DOOR, DOOR, OW]) box(r, 0.09, OH, 0.14, m.frame, [x + (x === -OW ? 0.045 : x === OW ? -0.045 : 0), OH / 2, 0.02]);
  box(r, OW * 2, 0.09, 0.14, m.frame, [0, OH - 0.045, 0.02]);
  box(r, OW * 2, 0.07, 0.14, m.frame, [0, 2.25, 0.02]);
  for (const s of [-1, 1]) {
    box(r, OW - DOOR, 0.09, 0.14, m.frame, [s * (OW + DOOR) / 2, 0.045, 0.02]);
    box(r, 0.035, 2.2, 0.08, m.cream, [s * (OW + DOOR) / 2, 1.13, 0.0], false);
    box(r, OW - DOOR - 0.08, 2.2, 0.012, m.glass, [s * (OW + DOOR) / 2, 1.13, -0.02], false);
    const ref = box(r, 0.022, 0.7, 0.008, m.reflection, [s * (OW + DOOR) / 2 - 0.15, 1.3, -0.01], false); ref.rotation.z = -0.22;
  }
  box(r, OW * 2 - 0.1, 0.3, 0.012, m.glass, [0, 2.42, -0.02], false);
  for (const x of [-0.3, 0.3]) box(r, 0.03, 0.3, 0.06, m.cream, [x, 2.42, 0.0], false);
  box(r, OW * 2 + 0.2, 0.06, 0.3, m.stone, [0, 0.03, t + 0.09]); // threshold
  // lamps either side, hours card
  WallLamp(r, m, [-OW - 0.2, 2.3, t]); WallLamp(r, m, [OW + 0.2, 2.3, t]);
  // double door: each leaf turns on its own hinge and swings out onto the deck
  const leaf = (side) => {
    const hinge = group(r, side < 0 ? 'Bookshop door hinge (left)' : 'Bookshop door hinge (right)', [side * DOOR, 0.02, 0.0]);
    const lf = group(hinge, 'Open the bookshop door'); lf.userData.action = 'booksDoor';
    const w = DOOR - 0.03, d = -side;            // leaf runs from the hinge towards the middle
    for (const x of [0.04, w - 0.04]) box(lf, 0.075, 2.18, 0.07, m.frame, [d * x, 1.1, 0]);
    for (const y of [0.06, 0.62, 2.15]) box(lf, w, 0.09, 0.07, m.frame, [d * w / 2, y, 0]);
    box(lf, w - 0.12, 1.45, 0.01, m.glass, [d * w / 2, 1.38, 0], false);
    plate(lf, w - 0.14, 0.42, 0.04, 0.03, m.frame, [d * w / 2, 0.34, 0.03]);
    box(lf, w - 0.06, 0.1, 0.012, m.brass, [d * w / 2, 0.12, 0.04]);
    rod(lf, [d * (w - 0.1), 1.0, 0.07], [d * (w - 0.1), 1.35, 0.07], 0.02, m.brass, 10);
    for (const y of [1.02, 1.33]) rod(lf, [d * (w - 0.1), y, 0.03], [d * (w - 0.1), y, 0.07], 0.014, m.brass, 8);
    for (const y of [0.3, 1.1, 1.9]) cylinder(lf, 0.018, 0.018, 0.13, m.brass, [d * 0.0, y, 0.02], false, 8);
    if (side > 0) { tube(lf, [[d * 0.12, 1.75, 0.045], [d * w / 2, 1.9, 0.045], [d * (w - 0.12), 1.75, 0.045]], 0.006, m.walnut); plate(lf, 0.38, 0.19, 0.02, 0.02, m.cream, [d * w / 2, 1.62, 0.05]); atlas.attach(lf, 'open', 0.36, 0.17, [d * w / 2, 1.62, 0.062]); }
    return { hinge, leaf: lf };
  };
  const doors = [leaf(-1), leaf(1)];
  return { group: r, doors };
}

// ---- raised plinth, side deck with steps and a low wall, and the cream awning over the deck --------------------
export function Base(root, m, atlas) {
  const { GROUND, FLOOR, X0, X1, Z0, Z1, DECK_X1 } = G;
  const g = group(root, 'Plinth and deck');
  box(g, X1 - X0 + 0.08, FLOOR - GROUND, Z1 - Z0 + 0.08, m.stone, [(X0 + X1) / 2, (FLOOR + GROUND) / 2, (Z0 + Z1) / 2]);
  box(g, X1 - X0 + 0.12, 0.04, Z1 - Z0 + 0.12, m.cream, [(X0 + X1) / 2, FLOOR - 0.02, (Z0 + Z1) / 2]);
  // deck: light planks with walnut nosing
  const dx0 = X1 + 0.04, dw = DECK_X1 - dx0, dcx = (dx0 + DECK_X1) / 2;
  box(g, dw, FLOOR - GROUND - 0.04, Z1 - Z0, m.walnut, [dcx, (FLOOR + GROUND - 0.04) / 2, (Z0 + Z1) / 2]);
  box(g, dw + 0.02, 0.04, Z1 - Z0 + 0.02, m.woodLight, [dcx, FLOOR - 0.02, (Z0 + Z1) / 2]);
  for (let z = Z0 + 0.22; z < Z1 - 0.05; z += 0.22) rod(g, [dx0 + 0.02, FLOOR + 0.002, z], [DECK_X1 - 0.2, FLOOR + 0.002, z], 0.005, m.wood, 4);
  // low wall along the open edge, with the BOOKS plaque facing the street
  const lw = 0.18, lx = DECK_X1 - lw / 2;
  box(g, lw, 0.62, Z1 - Z0, m.wall, [lx, FLOOR + 0.31, (Z0 + Z1) / 2]);
  box(g, lw + 0.06, 0.05, Z1 - Z0 + 0.04, m.cream, [lx, FLOOR + 0.645, (Z0 + Z1) / 2]);
  box(g, lw + 0.04, 0.1, Z1 - Z0 + 0.02, m.stone, [lx, GROUND + 0.05, (Z0 + Z1) / 2]);
  const pl = group(g, 'BOOKS plaque', [DECK_X1 + 0.005, FLOOR + 0.12, 0.75]); pl.rotation.y = Math.PI / 2;
  plate(pl, 0.98, 0.5, 0.04, 0.04, m.walnut, [0, 0, 0.02]); atlas.attach(pl, 'books', 0.9, 0.42, [0, 0, 0.042]);
  // three treads up from the pavement, each a solid block with a walnut nosing and a plank line
  const sx0 = X1 + 0.12, sx1 = DECK_X1 - lw - 0.02, sw = sx1 - sx0, scx = (sx0 + sx1) / 2, rise = (FLOOR - GROUND) / 4;
  for (let i = 0; i < 3; i++) {
    const top = FLOOR - rise * (i + 1), z0 = Z1 + i * 0.32;
    box(g, sw, top - GROUND, 0.32, m.woodLight, [scx, (top + GROUND) / 2, z0 + 0.16]);
    box(g, sw + 0.02, 0.03, 0.05, m.walnut, [scx, top - 0.015, z0 + 0.32 - 0.02]);
    rod(g, [sx0 + 0.04, top + 0.002, z0 + 0.15], [sx1 - 0.04, top + 0.002, z0 + 0.15], 0.004, m.wood, 4);
  }
  return g;
}

export function Awning(root, m) {
  const { X1, Z0, Z1, FLOOR } = G;
  const g = group(root, 'Cream awning', [X1, FLOOR + 2.78, (Z0 + Z1) / 2]);
  const len = 3.2, out = 1.6, drop = 0.42, th = 0.06;
  // canopy: a softly bowed profile extruded along the wall, with a frame-coloured piping on the edge
  const prof = new THREE.Shape();
  prof.moveTo(0, 0); prof.bezierCurveTo(out * 0.4, 0, out * 0.75, -drop * 0.45, out, -drop);
  prof.lineTo(out, -drop - th); prof.bezierCurveTo(out * 0.75, -drop * 0.45 - th, out * 0.4, -th, 0, -th); prof.closePath();
  // striped like every awning in the series: cream and coral bands, each extruded along the wall
  const n = 14, sw = len / n;
  for (let i = 0; i < n; i++) extrudeShape(g, prof, sw, i % 2 ? m.cream : m.coral, [0, 0, -len / 2 + sw * (i + 0.5)]);
  // scalloped valance, one scallop per stripe
  for (let i = 0; i < n; i++) {
    const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(sw, 0); s.lineTo(sw, -0.14); s.absarc(sw / 2, -0.14, sw / 2, 0, -Math.PI, true); s.lineTo(0, 0);
    const v = extrudeShape(g, s, 0.03, i % 2 ? m.cream : m.coral, [out + 0.01, -drop - th + 0.02, -len / 2 + (i + 1) * sw]); v.rotation.y = Math.PI / 2;
  }
  box(g, 0.035, 0.04, len + 0.02, m.frame, [out + 0.02, -drop - th + 0.03, 0]);
  box(g, 0.08, 0.1, len + 0.1, m.frame, [0.04, 0.0, 0]);
  for (const z of [-len / 2 + 0.1, 0, len / 2 - 0.1]) { rod(g, [0.04, -0.42, z], [out - 0.05, -drop - 0.02, z], 0.016, m.walnut, 8); tube(g, [[0.04, -0.3, z], [0.25, -0.18, z], [0.5, -0.12, z]], 0.008, m.walnut); }
  return g;
}
