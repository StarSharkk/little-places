import * as THREE from 'three';
// Template copy of buildings/06-little-bookshop/primitives.js. Copy into buildings/NN-name/ and keep in step with it.
// Same construction vocabulary as the other Little Places buildings: cached geometry + outline flag.
const cache = new Map();
export const cached = (key, make) => { if (!cache.has(key)) cache.set(key, make()); return cache.get(key); };
export function group(parent, name, pos = [0, 0, 0]) { const g = new THREE.Group(); g.name = name; g.position.set(...pos); parent.add(g); return g; }
export function mesh(parent, geo, mat, pos = [0, 0, 0], outline = true) { const m = new THREE.Mesh(geo, mat); m.position.set(...pos); m.userData.outline = outline; parent.add(m); return m; }
export function box(p, w, h, d, m, pos = [0, 0, 0], outline = true) { return mesh(p, cached(`box:${w}:${h}:${d}`, () => new THREE.BoxGeometry(w, h, d)), m, pos, outline); }
export function rounded(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
export function plate(p, w, h, d, r, m, pos = [0, 0, 0]) {
  const geo = cached(`plate:${w}:${h}:${d}:${r}`, () => { const g = new THREE.ExtrudeGeometry(rounded(w, h, r), { depth: d, bevelEnabled: false, curveSegments: 12, steps: 1 }); g.translate(0, 0, -d / 2); return g; });
  return mesh(p, geo, m, pos);
}
export function cylinder(p, rt, rb, h, m, pos = [0, 0, 0], outline = true, seg = 24) { return mesh(p, cached(`c:${rt}:${rb}:${h}:${seg}`, () => new THREE.CylinderGeometry(rt, rb, h, seg)), m, pos, outline); }
export function rod(p, a, b, r, m, seg = 6) {
  const av = new THREE.Vector3(...a), bv = new THREE.Vector3(...b);
  const q = cylinder(p, r, r, av.distanceTo(bv), m, av.clone().add(bv).multiplyScalar(0.5).toArray(), false, seg);
  q.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), bv.sub(av).normalize());
  return q;
}
export function tube(p, points, r, m, closed = false) {
  const c = new THREE.CatmullRomCurve3(points.map(v => new THREE.Vector3(...v)), closed);
  return mesh(p, new THREE.TubeGeometry(c, Math.max(16, points.length * 3), r, 6, closed), m, [0, 0, 0], false);
}
export function sphere(p, scale, m, pos = [0, 0, 0], seg = [20, 14]) {
  const o = mesh(p, cached(`sphere:${seg}`, () => new THREE.SphereGeometry(1, ...seg)), m, pos, false);
  o.scale.set(...scale); return o;
}
export function ring(p, r, t, m, pos = [0, 0, 0]) { return mesh(p, cached(`ring:${r}:${t}`, () => new THREE.TorusGeometry(r, t, 10, 40)), m, pos, false); }
export function cone(p, r, h, m, pos = [0, 0, 0], outline = false, seg = 16) { return mesh(p, cached(`cone:${r}:${h}:${seg}`, () => new THREE.ConeGeometry(r, h, seg)), m, pos, outline); }

// ---- arches and panels with real openings ---------------------------------------------------
// Opening centred on x = cx. Rect bottom at y0, straight sides up to (yTop - rise), then a half-ellipse.
export function archPath(Type, cx, w, y0, yTop, rise) {
  const s = new Type(), x0 = cx - w / 2, x1 = cx + w / 2;
  s.moveTo(x0, y0); s.lineTo(x1, y0); s.lineTo(x1, yTop - rise);
  s.absellipse(cx, yTop - rise, w / 2, rise, 0, Math.PI, false, 0);
  s.closePath(); return s;
}
export function rectPath(Type, x0, y0, x1, y1) { const s = new Type(); s.moveTo(x0, y0); s.lineTo(x1, y0); s.lineTo(x1, y1); s.lineTo(x0, y1); s.closePath(); return s; }
export function discPath(Type, cx, cy, r, hole = false) { const s = new Type(); s.absarc(cx, cy, r, 0, Math.PI * 2, hole); return s; }
export function extrudeShape(parent, shape, depth, m, pos = [0, 0, 0], outline = true, bevel = 0) {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 1, curveSegments: 24, steps: 1 });
  g.translate(0, 0, -depth / 2);
  return mesh(parent, g, m, pos, outline);
}
// Wall slab from x∈[-w/2,w/2], y∈[0,h]; `holes` are THREE.Path openings in the same coordinates.
export function wallWithHoles(parent, w, h, d, holes, m, pos = [0, 0, 0]) {
  const s = rectPath(THREE.Shape, -w / 2, 0, w / 2, h);
  for (const hole of holes) s.holes.push(hole);
  return extrudeShape(parent, s, d, m, pos, true);
}
// Frame ring around an opening: outer = opening grown by `grow` (same builder), inner = the opening.
export function frameAround(parent, outerShape, innerPath, depth, m, pos = [0, 0, 0]) {
  outerShape.holes.push(innerPath);
  return extrudeShape(parent, outerShape, depth, m, pos, true);
}

// The collection's illustrated ground (shared with the café and the bakery): paved slab, trim course,
// a ring of curb stones and restrained expansion joints.
export function PavedBase(p, m, { w, d, cx = 0, cz = 0, top = 0.155 }) {
  const g = group(p, 'Paved forecourt');
  box(g, w, 0.15, d, m.paving, [cx, top - 0.075, cz]);
  box(g, w + 0.1, 0.1, d + 0.1, m.cream, [cx, top - 0.2, cz]);
  const y = top - 0.025;
  for (let x = cx - w / 2 + 0.3; x <= cx + w / 2 - 0.29; x += 0.57) { box(g, 0.52, 0.1, 0.27, m.cream, [x, y, cz + d / 2 - 0.135]); box(g, 0.52, 0.1, 0.27, m.cream, [x, y, cz - d / 2 + 0.135]); }
  for (let z = cz - d / 2 + 0.55; z < cz + d / 2 - 0.4; z += 0.55) { box(g, 0.25, 0.1, 0.5, m.cream, [cx + w / 2 - 0.125, y, z]); box(g, 0.25, 0.1, 0.5, m.cream, [cx - w / 2 + 0.125, y, z]); }
  for (let z = cz - d / 2 + 0.75; z < cz + d / 2 - 0.3; z += 0.9) rod(g, [cx - w / 2 + 0.27, top + 0.003, z], [cx + w / 2 - 0.27, top + 0.003, z], 0.004, m.joint, 4);
  for (let x = cx - w / 2 + 0.8; x < cx + w / 2 - 0.3; x += 1.3) rod(g, [x, top + 0.003, cz - d / 2 + 0.27], [x, top + 0.003, cz + d / 2 - 0.27], 0.004, m.joint, 4);
  return g;
}
