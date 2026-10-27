import * as THREE from 'three';
import { group, box, plate, rod, tube, sphere, cone, cylinder, ring, extrudeShape, mesh } from './primitives.js';
import { planterBox, pot, bunch, MIXES, bucket, wateringCan, stem } from './Flowers.js';

// Terrace roof with a glasshouse on top — the signature of this little place (the bakery wears a cake).
export const TERRACE_Y = 3.56;
const GH = { x: -0.3, z: -0.15, L: 3.7, D: 2.2, sill: 0.38, wall: 0.9, rise: 0.85, bays: 4 };
const EAVE_Y = TERRACE_Y + GH.sill + GH.wall;       // 4.84
const RIDGE_Y = EAVE_Y + GH.rise;                   // 5.69
const SLOPE = Math.atan2(GH.rise, GH.D / 2);        // radians
const SLOPE_LEN = Math.hypot(GH.rise, GH.D / 2);
export const GLASSHOUSE = { ...GH, EAVE_Y, RIDGE_Y, SLOPE, SLOPE_LEN };

// a thin bar lying on a roof slope (side = +1 front / -1 back), centred at bay x
function slopeBar(g, m, mat, x, side, w, t = 0.05, outline = true) {
  const b = box(g, w, t, SLOPE_LEN, mat, [x, GH.sill + GH.wall + GH.rise / 2, side * GH.D / 4], outline);
  b.rotation.x = side * SLOPE; return b;
}

export function Roof(root, m, atlas) {
  const g = group(root, 'Lift-off terrace roof and glasshouse');
  const trim = plate(g, 6.08, 3.85, 0.16, 0.22, m.cream, [0, 3.25, 0]); trim.rotation.x = -Math.PI / 2;
  const top = plate(g, 6.04, 3.8, 0.24, 0.24, m.roof, [0, 3.44, 0]); top.rotation.x = -Math.PI / 2;
  const inset = plate(g, 5.77, 3.54, 0.035, 0.2, m.roof, [0, TERRACE_Y + 0.0175, 0]); inset.rotation.x = -Math.PI / 2;

  // low parapet with a cap, a tile-like course on the terrace and flower boxes hung over the front edge
  const py = TERRACE_Y + 0.12;
  box(g, 6.0, 0.24, 0.1, m.cream, [0, py, 1.87]); box(g, 6.0, 0.24, 0.1, m.cream, [0, py, -1.87]);
  for (const x of [-2.95, 2.95]) box(g, 0.1, 0.24, 3.84, m.cream, [x, py, 0]);
  box(g, 6.12, 0.04, 0.16, m.trim, [0, py + 0.14, 1.87]); box(g, 6.12, 0.04, 0.16, m.trim, [0, py + 0.14, -1.87]);
  for (const x of [-2.95, 2.95]) box(g, 0.16, 0.04, 3.96, m.trim, [x, py + 0.14, 0]);
  const front = [[-2.0, 'spring'], [0.05, 'rose'], [2.05, 'pastel']];
  for (const [x, mix] of front) { const b = planterBox(g, m, [x, py + 0.16, 1.97], 1.5, mix); }
  const side = planterBox(g, m, [3.04, py + 0.16, 0.5], 1.2, 'field'); side.rotation.y = Math.PI / 2;
  const side2 = planterBox(g, m, [3.04, py + 0.16, -0.95], 1.2, 'sun'); side2.rotation.y = Math.PI / 2;

  // terrace life: pots, watering can, a tiny bench
  pot(g, m, [2.35, TERRACE_Y, -1.2], { r: 0.2, h: 0.3, colour: 'terracotta', plant: 'flowers', mix: 'tulips' });
  pot(g, m, [2.55, TERRACE_Y, -0.45], { r: 0.16, h: 0.24, colour: 'cream', plant: 'bush' });
  pot(g, m, [-2.55, TERRACE_Y, 1.25], { r: 0.22, h: 0.32, colour: 'terracotta', plant: 'fern' });
  wateringCan(g, m, [-2.55, TERRACE_Y, -1.15], 0.6);
  const bench = group(g, 'Roof bench', [1.25, TERRACE_Y, 1.35]);
  box(bench, 1.1, 0.07, 0.34, m.woodLight, [0, 0.42, 0]); for (const x of [-0.46, 0.46]) box(bench, 0.07, 0.4, 0.3, m.wood, [x, 0.2, 0]);
  box(bench, 1.1, 0.34, 0.05, m.woodLight, [0, 0.62, -0.15]);
  for (const x of [-0.25, 0.25]) sphere(bench, [0.12, 0.05, 0.1], m.pink, [x, 0.5, 0.0], [8, 5]);

  buildGlasshouse(g, m);
  return g;
}

function buildGlasshouse(root, m) {
  const g = group(root, 'Glasshouse', [GH.x, TERRACE_Y, GH.z]);
  const gy = 0; // local to terrace
  // low masonry sill in the trim colour + a stone cap
  box(g, GH.L, GH.sill, GH.D, m.trim, [0, GH.sill / 2, 0]);
  box(g, GH.L + 0.1, 0.05, GH.D + 0.1, m.cream, [0, GH.sill + 0.0, 0]);
  const wy = GH.sill + GH.wall / 2 + 0.025;
  // glass walls
  box(g, GH.L, GH.wall, 0.012, m.glass, [0, wy, GH.D / 2], false); box(g, GH.L, GH.wall, 0.012, m.glass, [0, wy, -GH.D / 2], false);
  box(g, 0.012, GH.wall, GH.D, m.glass, [GH.L / 2, wy, 0], false); box(g, 0.012, GH.wall, GH.D, m.glass, [-GH.L / 2, wy, 0], false);
  // posts: every bay on the long sides, thirds on the ends
  const bayW = GH.L / GH.bays, eave = GH.sill + GH.wall + 0.0;
  for (let i = 0; i <= GH.bays; i++) for (const z of [-GH.D / 2, GH.D / 2]) box(g, 0.07, GH.wall, 0.07, m.frame, [-GH.L / 2 + i * bayW, wy, z]);
  for (const x of [-GH.L / 2, GH.L / 2]) for (const z of [-GH.D / 6, GH.D / 6]) box(g, 0.06, GH.wall, 0.06, m.frame, [x, wy, z]);
  // mid rails (a glazing bar around the walls at half height)
  const rail = (w, d, p) => box(g, w, 0.045, d, m.frame, p, false);
  rail(GH.L, 0.05, [0, wy + 0.1, GH.D / 2]); rail(GH.L, 0.05, [0, wy + 0.1, -GH.D / 2]); rail(0.05, GH.D, [GH.L / 2, wy + 0.1, 0]); rail(0.05, GH.D, [-GH.L / 2, wy + 0.1, 0]);
  // eave beams + gutters
  const ey = eave + 0.02;
  box(g, GH.L + 0.12, 0.08, 0.09, m.frame, [0, ey, GH.D / 2]); box(g, GH.L + 0.12, 0.08, 0.09, m.frame, [0, ey, -GH.D / 2]);
  box(g, 0.09, 0.08, GH.D, m.frame, [GH.L / 2, ey, 0]); box(g, 0.09, 0.08, GH.D, m.frame, [-GH.L / 2, ey, 0]);
  box(g, GH.L + 0.2, 0.05, 0.07, m.accent, [0, ey - 0.05, GH.D / 2 + 0.06]);

  // roof: rafters at each post, glass panes in every bay except the vent bay (which is its own moving part)
  const ridge = box(g, GH.L + 0.1, 0.07, 0.08, m.frame, [0, eave + GH.rise + 0.03, 0]);
  for (let i = 0; i <= GH.bays; i++) {
    const x = -GH.L / 2 + i * bayW;
    for (const side of [1, -1]) { const r = slopeBar(g, m, m.frame, x, side, 0.06, 0.06); r.position.y = eave + GH.rise / 2 + 0.03; }
  }
  for (let i = 0; i < GH.bays; i++) {
    const x = -GH.L / 2 + (i + 0.5) * bayW;
    slopeBar(g, m, m.glass, x, -1, bayW - 0.05, 0.012, false).position.y += 0.03;
    if (i !== 1) slopeBar(g, m, m.glass, x, 1, bayW - 0.05, 0.012, false).position.y += 0.03;
  }
  // end gables: triangular glass, with a central post and a rose-window style ring
  for (const sx of [-1, 1]) {
    const tri = new THREE.Shape(); tri.moveTo(-GH.D / 2, 0); tri.lineTo(GH.D / 2, 0); tri.lineTo(0, GH.rise); tri.closePath();
    const t = extrudeShape(g, tri, 0.012, m.glass, [sx * GH.L / 2, eave + 0.03, 0], false); t.rotation.y = Math.PI / 2;
    box(g, 0.06, GH.rise, 0.06, m.frame, [sx * GH.L / 2, eave + GH.rise / 2, 0]);
    const rr = ring(g, 0.2, 0.02, m.frame, [sx * GH.L / 2, eave + 0.38, 0]); rr.rotation.y = Math.PI / 2;
    sphere(g, [0.05, 0.05, 0.05], m.accent, [sx * (GH.L / 2 + 0.01), eave + 0.38, 0], [8, 6]);
  }
  // finials: small bud on each ridge end
  for (const sx of [-1, 1]) { cylinder(g, 0.014, 0.014, 0.2, m.ink, [sx * (GH.L / 2 + 0.06), eave + GH.rise + 0.08, 0], false, 6); sphere(g, [0.07, 0.07, 0.07], m.accent, [sx * (GH.L / 2 + 0.06), eave + GH.rise + 0.22, 0], [10, 7]); }

  // inside: tiered benches and a hanging basket (seen through the glass)
  const bench = (z, y, mix, n) => {
    box(g, GH.L - 0.5, 0.06, 0.45, m.woodLight, [0, y, z]);
    for (const x of [-GH.L / 2 + 0.4, GH.L / 2 - 0.4]) box(g, 0.07, y - GH.sill, 0.4, m.wood, [x, GH.sill + (y - GH.sill) / 2, z]);
    for (let i = 0; i < n; i++) {
      const x = -GH.L / 2 + 0.55 + (i / (n - 1)) * (GH.L - 1.1);
      const plantKinds = ['flowers', 'bush', 'flowers', 'fern'];
      pot(g, m, [x, y + 0.03, z], { r: 0.15, h: 0.2, colour: i % 2 ? 'terracotta' : 'cream', plant: plantKinds[i % 4], mix });
    }
  };
  bench(-0.75, GH.sill + 0.42, 'tulips', 6);
  bench(-0.2, GH.sill + 0.12, 'spring', 6);
  bench(0.62, GH.sill + 0.0, 'pastel', 5);
  // a hanging planter under the ridge
  rod(g, [0.5, eave + GH.rise + 0.02, 0.0], [0.5, eave + 0.45, 0.0], 0.008, m.ink, 4);
  cylinder(g, 0.2, 0.14, 0.17, m.terracotta, [0.5, eave + 0.38, 0.0], true, 16);
  for (let i = 0; i < 6; i++) { const a = i * 1.05; sphere(g, [0.07, 0.07, 0.07], i % 2 ? m.leaf : m.leafLight, [0.5 + Math.cos(a) * 0.14, eave + 0.3 - (i % 3) * 0.07, Math.sin(a) * 0.14], [8, 6]); }
  return g;
}

// The hinged vent pane: one bay of the front slope that tilts open along the ridge.
export function Vent(root, m) {
  const x = GH.x - GH.L / 2 + 1.5 * (GH.L / GH.bays);
  const hinge = group(root, 'Glasshouse vent hinge', [x, TERRACE_Y + GH.sill + GH.wall + GH.rise + 0.03, GH.z]);
  const leaf = group(hinge, 'Open the glasshouse vent'); leaf.userData.action = 'flowerVent';
  leaf.rotation.x = SLOPE;
  const bw = GH.L / GH.bays - 0.05;
  box(leaf, bw, 0.012, SLOPE_LEN, m.glass, [0, 0, SLOPE_LEN / 2 + 0.0], false);
  for (const sx of [-1, 1]) box(leaf, 0.05, 0.06, SLOPE_LEN, m.frame, [sx * (bw / 2 - 0.02), 0, SLOPE_LEN / 2]);
  box(leaf, bw, 0.06, 0.05, m.frame, [0, 0, SLOPE_LEN - 0.025]);
  box(leaf, 0.04, 0.05, SLOPE_LEN, m.frame, [0, 0, SLOPE_LEN / 2], false);
  sphere(leaf, [0.04, 0.04, 0.04], m.accent, [0, 0.04, SLOPE_LEN - 0.1], [8, 6]);
  return { hinge, leaf };
}
