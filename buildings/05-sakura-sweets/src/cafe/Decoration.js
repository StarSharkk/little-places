// Props & street dressing. Every item has a job: furniture serves the terrace, lamps flank the door,
// planters soften corners. Positions are authored, not scattered (only the ivy leaves are jittered, with a fixed seed).
import * as THREE from 'three';
import { extrude, rectPath, roundRectPath, canvasTexture } from './kit.js';
import { flowerTuft } from './Window.js';
import { SHOPS } from './config.js';

const SERIF = '"Playfair Display", "Didot", Georgia, serif';

function rng(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const at = (parent, x, y, z, ry = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; parent.add(g); return g; };
const basicTex = tex => {
  const m = new THREE.MeshBasicMaterial({ map: tex });
  m.polygonOffset = true; m.polygonOffsetFactor = -1; m.polygonOffsetUnits = -1;
  return m;
};

// outlined smooth tube (hull outline gives it a constant-width contour)
function tube(kit, parent, role, a, b, r, seg = 8) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const g = new THREE.CylinderGeometry(r, r, A.distanceTo(B), seg, 1);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize()));
  g.translate(...A.clone().add(B).multiplyScalar(0.5).toArray());
  kit.part(parent, role, g, { line: 'none' });
  kit.hull(parent, g);
}

// ---- pots & plants -------------------------------------------------------------------
function pot(kit, parent, x, z, { r = 0.26, h = 0.36, role = 'coral', y = 0, plants = 'flowers', flower = 'flower' } = {}) {
  const pts = [[0, 0], [r * 0.66, 0], [r * 0.74, 0.015], [r * 0.98, h * 0.84], [r * 1.1, h * 0.84], [r * 1.1, h], [r * 0.98, h]].map(([a, b]) => new THREE.Vector2(a, b));
  const body = new THREE.LatheGeometry(pts, 22);
  kit.part(parent, role, body, { p: [x, y, z], line: 'thin', angle: 40 });
  kit.part(parent, 'soil', new THREE.CylinderGeometry(r * 0.96, r * 0.96, 0.02, 20), { p: [x, y + h - 0.03, z], line: 'none' });
  const top = y + h;
  if (plants === 'flowers') {
    const n = 6;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      kit.blob(parent, 'leaf', 0.12, [x + Math.cos(a) * r * 0.55, top + 0.09 + (i % 2) * 0.03, z + Math.sin(a) * r * 0.55], { seg: 10 });
    }
    kit.blob(parent, 'leaf', 0.15, [x, top + 0.14, z], { seg: 10 });
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + 0.4;
      const rr = i === 6 ? 0 : r * 0.5;
      kit.blob(parent, flower, 0.075, [x + Math.cos(a) * rr, top + 0.24 + (i % 3) * 0.04, z + Math.sin(a) * rr], { seg: 10 });
    }
  } else {
    kit.blob(parent, 'leaf', r * 0.95, [x, top + r * 0.55, z], { seg: 14, s: [1, 1.05, 1] });
    kit.blob(parent, 'leaf', r * 0.6, [x + r * 0.35, top + r * 1.15, z - r * 0.1], { seg: 12 });
  }
}

function ivy(kit, parent, x, yb, yt, z, drift, seed) {
  const R = rng(seed);
  const steps = Math.round((yt - yb) / 0.2);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const cx = x + Math.sin(t * 5.2) * 0.14 + drift * t;
    const y = yb + t * (yt - yb);
    const n = 1 + Math.floor(R() * 2);
    for (let k = 0; k < n; k++) {
      const role = R() > 0.45 ? 'leaf' : 'mint';
      kit.blob(parent, role, 0.085 + R() * 0.07, [cx + (R() - 0.5) * 0.3, y + (R() - 0.5) * 0.12, z + R() * 0.05], { seg: 8 });
    }
    if (i % 4 === 2) kit.blob(parent, 'sakura', 0.05, [cx + 0.1, y, z + 0.1], { seg: 8 });
  }
}

// ---- furniture --------------------------------------------------------------------------
function chair(kit, parent, x, z, ry, role = 'door') {
  const g = at(parent, x, 0, z, ry);
  kit.part(g, role, new THREE.CylinderGeometry(0.19, 0.19, 0.04, 20), { p: [0, 0.46, 0], line: 'thin' });
  kit.part(g, 'cream', new THREE.CylinderGeometry(0.15, 0.15, 0.03, 18), { p: [0, 0.505, 0], line: 'thin' });
  for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    kit.rod(g, 'ink', [sx * 0.11, 0.44, sz * 0.11], [sx * 0.17, 0, sz * 0.17], 0.012, { seg: 5, line: 'none' });
  }
  for (const [y, tube] of [[0.62, 0.016], [0.72, 0.016]]) {
    const arc = new THREE.TorusGeometry(0.19, tube, 5, 14, Math.PI * 0.82);
    arc.rotateZ(Math.PI + Math.PI * 0.09);
    arc.rotateX(Math.PI / 2);
    kit.part(g, role, arc, { p: [0, y, 0], line: 'none' });
  }
  for (const a of [-0.28, 0, 0.28]) {
    const ang = Math.PI * 1.5 + a * Math.PI * 0.8;
    kit.rod(g, role, [Math.cos(ang) * 0.19, 0.48, -Math.sin(-ang) * 0.19 * 1], [Math.cos(ang) * 0.19, 0.72, -Math.sin(-ang) * 0.19], 0.011, { seg: 5, line: 'none' });
  }
}

function cup(kit, parent, x, y, z, role = 'cream') {
  kit.part(parent, 'coral', new THREE.CylinderGeometry(0.1, 0.085, 0.014, 18), { p: [x, y + 0.007, z], line: 'thin' });
  kit.part(parent, role, new THREE.CylinderGeometry(0.058, 0.04, 0.07, 14), { p: [x, y + 0.05, z], line: 'thin' });
  kit.part(parent, 'soil', new THREE.CircleGeometry(0.05, 14).rotateX(-Math.PI / 2), { p: [x, y + 0.084, z], line: 'none' });
  const h = new THREE.TorusGeometry(0.025, 0.007, 5, 10, Math.PI);
  h.rotateZ(-Math.PI / 2);
  kit.part(parent, role, h, { p: [x + 0.058, y + 0.05, z], line: 'none' });
}

function bistro(kit, parent, x, z, variant) {
  const g = at(parent, x, 0, z);
  kit.part(g, 'cream', new THREE.CylinderGeometry(0.44, 0.44, 0.04, 30), { p: [0, 0.74, 0], line: 'mid' });
  kit.part(g, 'coral', new THREE.CylinderGeometry(0.41, 0.41, 0.03, 30), { p: [0, 0.705, 0], line: 'thin' });
  kit.rod(g, 'ink', [0, 0.05, 0], [0, 0.7, 0], 0.028, { seg: 8, line: 'none' });
  kit.part(g, 'ink', new THREE.CylinderGeometry(0.22, 0.25, 0.04, 20), { p: [0, 0.02, 0], line: 'none' });
  kit.part(g, 'ink', new THREE.CylinderGeometry(0.05, 0.05, 0.06, 10), { p: [0, 0.62, 0], line: 'none' });
  const top = 0.76;
  if (variant === 0) {
    cup(kit, g, 0.11, top, 0.06);
    // small bud vase
    kit.part(g, 'sky', new THREE.CylinderGeometry(0.03, 0.04, 0.1, 12), { p: [-0.17, top + 0.05, -0.05], line: 'thin' });
    kit.rod(g, 'leaf', [-0.17, top + 0.1, -0.05], [-0.17, top + 0.2, -0.05], 0.007, { seg: 4, line: 'none' });
    kit.blob(g, 'sakura', 0.045, [-0.17, top + 0.22, -0.05], { seg: 9 });
    kit.blob(g, 'cream', 0.032, [-0.13, top + 0.19, -0.04], { seg: 8 });
  } else {
    kit.part(g, 'wood', new THREE.BoxGeometry(0.34, 0.018, 0.22), { p: [0, top + 0.009, 0], line: 'thin' });
    cup(kit, g, -0.09, top + 0.018, 0.0, 'mint');
    cup(kit, g, 0.09, top + 0.018, 0.03, 'cream');
    kit.part(g, 'cream', new THREE.CylinderGeometry(0.08, 0.07, 0.012, 16), { p: [0.2, top + 0.006, -0.2], line: 'thin' });
    [['sakura', -0.015], ['yellow', 0.03], ['mint', 0.075]].forEach(([c, dx], i) =>
      kit.blob(g, c, 0.034, [0.2 + dx - 0.02, top + 0.032, -0.2 + (i % 2) * 0.02], { seg: 8, s: [1, 0.7, 1] }));
  }
}

// ---- lights -------------------------------------------------------------------------------
function wallLamp(kit, g, u, y, out = 0.3) {
  kit.part(g, 'ink', new THREE.BoxGeometry(0.1, 0.24, 0.035), { p: [u, y, 0.0175], line: 'none' });
  kit.beam(g, 'ink', [u, y + 0.02, 0.03], [u, y + 0.02, out], 0.035, 0.035, { line: 'none' });
  const sc = new THREE.TorusGeometry(0.1, 0.011, 5, 12, Math.PI * 1.2);
  kit.part(g, 'ink', sc, { p: [u, y - 0.08, 0.1], r: [0, Math.PI / 2, Math.PI * 0.45], line: 'none' });
  kit.part(g, 'yellow', new THREE.CylinderGeometry(0.085, 0.065, 0.2, 6), { p: [u, y - 0.1, out], line: 'thin' });
  kit.part(g, 'ink', new THREE.ConeGeometry(0.12, 0.09, 6), { p: [u, y + 0.045, out], line: 'thin' });
  kit.part(g, 'ink', new THREE.CylinderGeometry(0.07, 0.07, 0.025, 6), { p: [u, y - 0.21, out], line: 'none' });
  kit.blob(g, 'ink', 0.025, [u, y + 0.11, out], { seg: 8 });
}

function streetLamp(kit, parent, x, z) {
  const g = at(parent, x, 0, z);
  const pts = [[0, 0], [0.2, 0], [0.2, 0.08], [0.12, 0.14], [0.085, 0.4], [0.06, 0.5]].map(([a, b]) => new THREE.Vector2(a, b));
  kit.part(g, 'ink', new THREE.LatheGeometry(pts, 14), { line: 'none' });
  tube(kit, g, 'ink', [0, 0.45, 0], [0, 3.35, 0], 0.045, 10);
  kit.part(g, 'ink', new THREE.TorusGeometry(0.075, 0.02, 6, 12), { p: [0, 1.0, 0], r: [Math.PI / 2, 0, 0], line: 'none' });
  kit.part(g, 'ink', new THREE.TorusGeometry(0.075, 0.02, 6, 12), { p: [0, 2.7, 0], r: [Math.PI / 2, 0, 0], line: 'none' });
  kit.part(g, 'ink', new THREE.CylinderGeometry(0.24, 0.1, 0.07, 6), { p: [0, 3.38, 0], line: 'thin' });
  kit.part(g, 'yellow', new THREE.CylinderGeometry(0.26, 0.17, 0.5, 6), { p: [0, 3.65, 0], line: 'mid' });
  const cap = new THREE.ConeGeometry(0.34, 0.26, 6);
  kit.part(g, 'ink', cap, { p: [0, 4.03, 0], line: 'thin' });
  kit.blob(g, 'ink', 0.05, [0, 4.2, 0], { seg: 8 });
  // flower basket on a bracket
  kit.beam(g, 'ink', [0, 2.3, 0], [0.3, 2.3, 0], 0.03, 0.03, { line: 'none' });
  kit.part(g, 'wood', new THREE.SphereGeometry(0.17, 14, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), { p: [0.33, 2.15, 0], line: 'thin' });
  flowerTuft(kit, g, 0.33, 2.15, 0, 0.3);
  return g;
}

// ---- iron fence ------------------------------------------------------------------------------
function fence(kit, parent, x0, x1, z) {
  const g = at(parent, 0, 0, z);
  const posts = Math.round((x1 - x0) / 0.9);
  const step = (x1 - x0) / posts;
  for (let i = 0; i <= posts; i++) {
    const x = x0 + i * step;
    kit.part(g, 'ink', new THREE.BoxGeometry(0.06, 0.8, 0.06), { p: [x, 0.4, 0], line: 'none' });
    kit.blob(g, 'ink', 0.05, [x, 0.84, 0], { seg: 8 });
    kit.part(g, 'ink', new THREE.CylinderGeometry(0.06, 0.06, 0.03, 8), { p: [x, 0.04, 0], line: 'none' });
  }
  for (const y of [0.72, 0.4, 0.12]) kit.beam(g, 'ink', [x0, y, 0], [x1, y, 0], 0.03, 0.03, { line: 'none' });
  const n = Math.round((x1 - x0) / 0.22);
  for (let i = 0; i < n; i++) {
    const x = x0 + (i + 0.5) * ((x1 - x0) / n);
    kit.rod(g, 'ink', [x, 0.1, 0], [x, 0.72, 0], 0.01, { seg: 4, line: 'none' });
    kit.part(g, 'ink', new THREE.ConeGeometry(0.022, 0.09, 4), { p: [x, 0.77, 0], line: 'none' });
  }
  // planters hanging between posts
  const mid = x0 + step * 2.5;
  for (const px of [mid, mid + step * 2, mid + step * 4]) {
    kit.part(g, 'coral', new THREE.BoxGeometry(0.6, 0.18, 0.2), { p: [px, 0.82, 0.0], line: 'mid' });
    flowerTuft(kit, g, px, 0.91, 0.0, 0.54);
  }
  return g;
}

// ---- blossom tree in a tub -----------------------------------------------------------------
function blossomTree(kit, parent, x, z, sc = 1) {
  const g = at(parent, x, 0, z);
  g.scale.setScalar(sc);
  const pts = [[0, 0], [0.5, 0], [0.56, 0.05], [0.7, 0.62], [0.78, 0.62], [0.78, 0.72], [0.68, 0.72]].map(([a, b]) => new THREE.Vector2(a, b));
  kit.part(g, 'woodDark', new THREE.LatheGeometry(pts, 26), { line: 'thin', angle: 40 });
  kit.part(g, 'cream', new THREE.LatheGeometry([[0.66, 0.34], [0.738, 0.34], [0.745, 0.4], [0.67, 0.4]].map(([a, b]) => new THREE.Vector2(a, b)), 26), { line: 'none' });
  kit.part(g, 'soil', new THREE.CylinderGeometry(0.66, 0.66, 0.02, 24), { p: [0, 0.69, 0], line: 'none' });
  // trunk and branches
  const curve = new THREE.CatmullRomCurve3([[0, 0.68, 0], [0.04, 1.1, 0.03], [-0.1, 1.55, -0.02], [-0.02, 2.0, 0.03], [0.12, 2.35, 0]].map(p => new THREE.Vector3(...p)));
  const trunk = new THREE.TubeGeometry(curve, 18, 0.075, 8, false);
  kit.part(g, 'woodDark', trunk, { line: 'none' });
  kit.hull(g, trunk);
  const branch = (pts2, r) => {
    const gg = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts2.map(p => new THREE.Vector3(...p))), 10, r, 6, false);
    kit.part(g, 'woodDark', gg, { line: 'none' });
    kit.hull(g, gg);
  };
  branch([[-0.08, 1.45, 0], [-0.4, 1.75, 0.1], [-0.72, 1.95, 0.12]], 0.04);
  branch([[0.0, 1.9, 0.02], [0.4, 2.1, -0.1], [0.78, 2.18, -0.12]], 0.04);
  branch([[0.02, 1.1, 0.0], [0.34, 1.35, 0.2], [0.58, 1.5, 0.3]], 0.032);
  // canopy: layered blossom clusters
  const C = [
    [0.1, 2.55, 0.0, 0.7], [-0.62, 2.2, 0.12, 0.52], [0.82, 2.3, -0.1, 0.55], [-0.3, 2.78, -0.2, 0.46], [0.5, 2.82, 0.26, 0.44],
    [-0.8, 1.95, 0.2, 0.38], [0.62, 1.58, 0.3, 0.33], [0.2, 2.2, 0.38, 0.4], [-0.15, 2.45, 0.4, 0.34],
  ];
  for (const [cx, cy, cz, r] of C) kit.blob(g, 'sakura', r, [cx, cy, cz], { seg: 16, s: [1, 0.86, 1] });
  // petal accents on the near side of each cluster
  const R = rng(7);
  for (const [cx, cy, cz, r] of C) {
    for (let i = 0; i < 3; i++) {
      const a = R() * Math.PI * 0.8 + 0.2, b = R() * 0.9 + 0.1;
      kit.blob(g, 'cream', 0.045, [cx + Math.cos(a) * r * 0.78, cy + (b - 0.4) * r * 0.5, cz + Math.sin(a) * r * 0.78 + r * 0.25], { seg: 6 });
    }
  }
  // fallen petals
  const P = rng(21);
  for (let i = 0; i < 16; i++) {
    const a = P() * 6.28, d = 0.9 + P() * 0.9;
    const m = new THREE.CircleGeometry(0.035 + P() * 0.02, 6);
    m.rotateX(-Math.PI / 2);
    kit.part(g, 'sakura', m, { p: [Math.cos(a) * d, 0.012, Math.sin(a) * d], r: [0, P() * 3, 0], line: 'none' });
  }
}

// ---- bicycle (local frame of a façade, wheel plane parallel to the wall) ------------------------
function bicycle(kit, g, u, z) {
  const R = 0.34, wb = 1.02;
  const rear = [u - wb / 2, R, z], front = [u + wb / 2, R, z];
  for (const c of [rear, front]) {
    kit.part(g, 'ink', new THREE.TorusGeometry(R, 0.022, 6, 28), { p: c, line: 'none' });
    kit.part(g, 'trim', new THREE.TorusGeometry(R - 0.045, 0.01, 5, 24), { p: c, line: 'none' });
    const spokes = [];
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; spokes.push(c[0], c[1], c[2], c[0] + Math.cos(a) * (R - 0.04), c[1] + Math.sin(a) * (R - 0.04), c[2]); }
    kit.seg(g, 'thin', spokes);
    kit.part(g, 'yellow', new THREE.CylinderGeometry(0.03, 0.03, 0.06, 10).rotateX(Math.PI / 2), { p: c, line: 'none' });
  }
  const bb = [u - 0.06, 0.3, z], seat = [u - 0.22, 0.78, z], head = [u + 0.3, 0.8, z];
  const frame = 'sky';
  tube(kit, g, frame, rear, bb, 0.018, 6);
  tube(kit, g, frame, rear, seat, 0.018, 6);
  tube(kit, g, frame, bb, seat, 0.02, 6);
  tube(kit, g, frame, seat, head, 0.018, 6);
  tube(kit, g, frame, bb, head, 0.022, 6);
  tube(kit, g, frame, head, front, 0.018, 6);
  tube(kit, g, 'ink', [head[0], head[1], head[2]], [head[0] - 0.08, head[1] + 0.18, head[2]], 0.012, 5);
  tube(kit, g, 'ink', [head[0] - 0.08, head[1] + 0.18, z - 0.2], [head[0] - 0.08, head[1] + 0.18, z + 0.2], 0.012, 5);
  kit.part(g, 'coral', new THREE.BoxGeometry(0.2, 0.05, 0.1), { p: [seat[0] - 0.02, seat[1] + 0.04, z], line: 'thin' });
  // front basket with flowers
  kit.part(g, 'wood', new THREE.CylinderGeometry(0.15, 0.12, 0.17, 12, 1, true), { p: [front[0] + 0.0, 0.92, z], line: 'thin' });
  kit.part(g, 'wood', new THREE.CylinderGeometry(0.12, 0.12, 0.012, 12), { p: [front[0], 0.84, z], line: 'none' });
  flowerTuft(kit, g, front[0], 0.96, z, 0.26);
  // kickstand
  tube(kit, g, 'ink', [u - 0.05, 0.3, z], [u + 0.1, 0.0, z - 0.14], 0.01, 4);
  kit.part(g, 'ink', new THREE.CylinderGeometry(0.04, 0.04, 0.012, 8), { p: [u + 0.1, 0.0, z - 0.14], line: 'none' });
}

function bird(kit, parent, x, y, z, ry, role = 'sakura') {
  const g = at(parent, x, y, z, ry);
  kit.blob(g, role, 0.1, [0, 0.09, 0], { seg: 10, s: [1.25, 0.9, 0.9] });
  kit.blob(g, role, 0.062, [0.11, 0.19, 0], { seg: 10 });
  kit.part(g, 'yellow', new THREE.ConeGeometry(0.022, 0.06, 6).rotateZ(-Math.PI / 2), { p: [0.19, 0.19, 0], line: 'none' });
  kit.part(g, 'ink', new THREE.CircleGeometry(0.01, 6), { p: [0.14, 0.21, 0.057], line: 'none' });
  kit.part(g, 'ink', new THREE.ConeGeometry(0.04, 0.17, 3).rotateZ(Math.PI / 2 + 0.25), { p: [-0.22, 0.1, 0], line: 'none' });
  for (const sz of [-0.03, 0.03]) kit.rod(g, 'yellow', [0.0, 0.03, sz], [0.0, -0.0, sz], 0.007, { seg: 4, line: 'none' });
}

// ---- chalkboard A-frame (clickable) --------------------------------------------------------------
function chalkboard(kit, parent, x, z, ry, textures, board) {
  const grp = at(parent, x, 0, z, ry);
  grp.name = 'blackboard';
  grp.userData.dynamic = true; grp.userData.tag = 'board'; grp.userData.action = 'menu';
  const w = 0.62, h = 0.92, tilt = 0.2;
  const front = new THREE.Group(); front.position.set(0, 0.0, 0.24); front.rotation.x = -tilt; grp.add(front);
  const back = new THREE.Group(); back.position.set(0, 0.0, -0.24); back.rotation.x = tilt; grp.add(back);
  for (const f of [front, back]) {
    const ring = roundRectPath(THREE.Shape, -w / 2 - 0.05, 0.04, w / 2 + 0.05, h + 0.12, 0.03);
    ring.holes.push(roundRectPath(THREE.Path, -w / 2, 0.1, w / 2, h + 0.06, 0.015));
    kit.part(f, 'wood', extrude(ring, 0.06, 0.008), { p: [0, 0, 0], line: 'mid' });
    kit.part(f, 'chalk', new THREE.BoxGeometry(w, h - 0.04, 0.05), { p: [0, 0.08 + (h - 0.04) / 2, 0.0], line: 'none' });
  }
  kit.part(front, 'wood', new THREE.BoxGeometry(w + 0.06, 0.035, 0.1), { p: [0, 0.05, 0.07], line: 'thin' });
  kit.part(front, 'cream', new THREE.BoxGeometry(0.06, 0.014, 0.014), { p: [-0.12, 0.078, 0.08], line: 'none' });
  const tex = canvasTexture(512, 780, (ctx, W, H) => {
    ctx.fillStyle = '#2f3b37'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(247,243,233,.9)'; ctx.fillStyle = 'rgba(247,243,233,.95)'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.textAlign = 'center'; ctx.font = `700 76px ${SERIF}`;
    ctx.fillText(board.title, W / 2, 100);
    ctx.font = `italic 500 40px ${SERIF}`; ctx.fillStyle = '#EFA8C4'; ctx.fillText(board.tagline, W / 2, 150);
    ctx.strokeStyle = '#F6C445'; ctx.lineWidth = 7;
    if (board.icon === 'cake') {
      // slice-of-cake doodle: sponge, cream layer, strawberry
      ctx.beginPath(); ctx.moveTo(176, 300); ctx.lineTo(336, 300); ctx.lineTo(336, 232); ctx.lineTo(176, 270); ctx.closePath(); ctx.stroke();
      ctx.strokeStyle = '#EFA8C4'; ctx.beginPath(); ctx.moveTo(180, 284); ctx.lineTo(332, 266); ctx.stroke();
      ctx.strokeStyle = '#EF745F'; ctx.beginPath(); ctx.arc(300, 214, 18, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = '#9AD5B6'; ctx.beginPath(); ctx.moveTo(300, 196); ctx.lineTo(306, 182); ctx.stroke();
    } else {
      // cup doodle
      ctx.beginPath(); ctx.moveTo(190, 214); ctx.lineTo(322, 214); ctx.quadraticCurveTo(318, 304, 256, 304); ctx.quadraticCurveTo(194, 304, 190, 214); ctx.stroke();
      ctx.beginPath(); ctx.arc(330, 244, 24, -1.3, 1.4); ctx.stroke();
      ctx.strokeStyle = '#9AD5B6';
      for (const x of [222, 256, 290]) { ctx.beginPath(); ctx.moveTo(x, 190); ctx.bezierCurveTo(x - 14, 168, x + 14, 156, x, 130); ctx.stroke(); }
    }
    ctx.fillStyle = 'rgba(247,243,233,.95)'; ctx.textAlign = 'left';
    const rows = board.rows;
    ctx.font = `600 40px ${SERIF}`;
    rows.forEach(([n, p], i) => {
      const y = 400 + i * 66;
      ctx.textAlign = 'left'; ctx.fillText(n, 56, y);
      ctx.textAlign = 'right'; ctx.fillText(p, W - 56, y);
      ctx.setLineDash([2, 10]); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(247,243,233,.55)';
      ctx.beginPath(); ctx.moveTo(56, y + 16); ctx.lineTo(W - 56, y + 16); ctx.stroke(); ctx.setLineDash([]);
    });
    ctx.strokeStyle = '#EF745F'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(130, 740); ctx.bezierCurveTo(190, 716, 320, 764, 382, 734); ctx.stroke();
  });
  textures.push(tex);
  const plane = new THREE.PlaneGeometry(w, h - 0.05);
  kit.part(front, 'chalk', plane, { p: [0, 0.08 + (h - 0.04) / 2, 0.028], material: basicTex(tex), keep: true, line: 'none' });
  // hinge
  kit.part(grp, 'ink', new THREE.CylinderGeometry(0.018, 0.018, w + 0.14, 8).rotateZ(Math.PI / 2), { p: [0, h * Math.cos(tilt) + 0.05, 0.0], line: 'none' });
  return grp;
}

export function buildDecoration(kit, group, cfg, G, frames, ctx) {
  const d = cfg.decorationDensity;
  const out = { pickables: [], casters: [], textures: [] };
  if (d <= 0) return out;
  const { L, C, R, B } = frames;
  const Xf = cfg.Xf, Zf = cfg.Zf;

  // entrance: lamps on the quoin faces flank the door, pots on the pavement
  wallLamp(kit, C.g, 0.14, 2.35, 0.3);
  wallLamp(kit, C.g, C.len - 0.14, 2.35, 0.3);
  wallLamp(kit, L.g, 3.075, 2.4, 0.3);
  // doormat inside the portal
  kit.part(C.g, 'coral', new THREE.BoxGeometry(0.8, 0.025, 0.5), { p: [C.len / 2, 0.5125, 0.02], line: 'thin' });
  kit.part(C.g, 'cream', new THREE.BoxGeometry(0.7, 0.028, 0.06), { p: [C.len / 2, 0.514, 0.02], line: 'none' });

  // chalkboard right of the steps (faces along the chamfer normal)
  const bx = C.origin[0] + 2.05 * Math.SQRT1_2 + 0.9 * Math.SQRT1_2;
  const bz = C.origin[2] - 2.05 * Math.SQRT1_2 + 0.9 * Math.SQRT1_2;
  const board = chalkboard(kit, group, bx, bz, Math.PI / 4 + 0.08, out.textures, SHOPS[cfg.shop].board);
  out.pickables.push(board);

  // flower pots flanking the entrance
  const pw = (u, zz) => [C.origin[0] + u * Math.SQRT1_2 + zz * Math.SQRT1_2, C.origin[2] - u * Math.SQRT1_2 + zz * Math.SQRT1_2];
  { const [px, pz] = pw(-0.32, 0.55); pot(kit, group, px, pz, { r: 0.27, h: 0.42, role: 'coral' }); }
  { const [px, pz] = pw(-0.62, 1.2); pot(kit, group, px, pz, { r: 0.2, h: 0.28, role: 'mint', plants: 'bush' }); }

  if (d >= 0.5) {
    // terrace: two bistro sets in front of the long façade
    bistro(kit, group, -3.35, 4.0, 0);
    chair(kit, group, -4.02, 4.1, Math.PI / 2 - 0.1);
    chair(kit, group, -3.05, 4.62, Math.PI + 0.35);
    bistro(kit, group, -0.55, 4.1, 1);
    chair(kit, group, -1.22, 4.18, Math.PI / 2 + 0.12);
    chair(kit, group, -0.4, 3.52, -0.18);
    out.casters.push([[-3.35, 0.8, 4.0], [-0.55, 0.8, 4.1]]);
  }

  if (d >= 0.8) {
    // fence closing the terrace + street lamp
    fence(kit, group, -6.9, 0.2, 5.05);
    streetLamp(kit, group, -7.3, 4.75);
    out.casters.push([[-7.3, 0, 4.75], [-7.3, 4.2, 4.75], [-7.0, 4.2, 4.75], [-7.6, 4.2, 4.75]]);

    // blossom tree to the right of the façade
    blossomTree(kit, group, 5.2, -2.5, 0.8);
    out.casters.push([[5.2, 0, -2.5], [4.5, 2.4, -2.5], [5.9, 2.4, -2.5], [5.2, 3.1, -2.1], [5.2, 3.1, -2.9]]);

    // R façade: bicycle, number plate
    bicycle(kit, R.g, 2.95, 0.6);
    // house number plaque
    const numTex = canvasTexture(256, 192, (ctx, W, H) => {
      ctx.fillStyle = '#252525'; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#F7F3E9'; ctx.lineWidth = 8; ctx.strokeRect(14, 14, W - 28, H - 28);
      ctx.fillStyle = '#F7F3E9'; ctx.font = `700 110px ${SERIF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('12', W / 2, H / 2 + 8);
    });
    out.textures.push(numTex);
    kit.part(R.g, 'ink', new THREE.BoxGeometry(0.3, 0.23, 0.03), { p: [2.88, 1.75, 0.015], line: 'thin' });
    kit.part(R.g, 'ink', new THREE.PlaneGeometry(0.28, 0.21), { p: [2.88, 1.75, 0.032], material: basicTex(numTex), keep: true, line: 'none' });

    // hanging basket on a wrought bracket between the upper windows
    const hb = (u, y) => {
      const g = L.g;
      kit.beam(g, 'ink', [u, y, 0.02], [u, y, 0.42], 0.03, 0.03, { line: 'none' });
      kit.rod(g, 'ink', [u, y - 0.01, 0.05], [u, y - 0.2, 0.0], 0.012, { seg: 4, line: 'none' });
      kit.part(g, 'ink', new THREE.TorusGeometry(0.07, 0.01, 5, 10, Math.PI * 1.2), { p: [u, y - 0.08, 0.12], r: [0, Math.PI / 2, 0.4], line: 'none' });
      kit.rod(g, 'ink', [u, y, 0.42], [u - 0.14, y - 0.25, 0.42], 0.006, { seg: 4, line: 'none' });
      kit.rod(g, 'ink', [u, y, 0.42], [u + 0.14, y - 0.25, 0.42], 0.006, { seg: 4, line: 'none' });
      kit.part(g, 'wood', new THREE.SphereGeometry(0.17, 14, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), { p: [u, y - 0.27, 0.42], line: 'thin' });
      flowerTuft(kit, g, u, y - 0.27, 0.42, 0.3);
    };
    hb(3.075, 4.95);

    // ivy + trellis on the annex front, birds on the ridge
    const A = ctx.annex;
    if (A) {
      const f = A.frames.front.g;
      for (const ux of [0.12, 0.3]) kit.rod(f, 'ink', [ux, 0.5, 0.05], [ux, 3.5, 0.05], 0.01, { seg: 4, line: 'none' });
      for (let y = 0.9; y < 3.5; y += 0.5) kit.beam(f, 'ink', [0.06, y, 0.05], [0.36, y, 0.05], 0.014, 0.014, { line: 'none' });
      ivy(kit, f, 0.22, 0.6, 3.45, 0.1, 0.05, 11);
      // brass plaque
      kit.part(f, 'ink', new THREE.BoxGeometry(0.34, 0.2, 0.03), { p: [2.05, 1.8, 0.015], line: 'thin' });
    }
    bird(kit, group, -1.85, G.Hr + 0.07, G.zr, 0, 'sakura');
    bird(kit, group, -1.4, G.Hr + 0.07, G.zr + 0.02, Math.PI + 0.2, 'sky');
  }
  return out;
}
