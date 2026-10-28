import * as THREE from 'three';
// The ground a place stands on, in one of three edge styles (pick one per building, vary it between neighbours):
//   'curb'    — white paving inside a ring of cream curb stones (bakery, flowers, bookshop, pizzeria)
//   'rail'    — a clean outlined pavement edge, a pale-blue road with a dashed line along the public sides and a
//               short run of iron railing (after 05 Sakura Sweets)
//   'tactile' — a clean edge with yellow tactile paving along the public sides, then the road (after 02 Yamada Grocery)
// Units are metres; the pavement top is at `top` (0.155 by default). `corner` rounds the front-right (+x +z) corner.
// The road runs along `sides` ('front' = +z, 'right' = +x) and sits 0.14 below the pavement, like a real kerb.

const C = { paving: '#FBF7EB', joint: '#D8CBA9', cream: '#F4EAD6', road: '#CEDBEA', iron: '#2F3A36', tactile: '#F3CF76', dot: '#FBF5E8', ink: '#352F2A' };
let cache = null;
function materials() {
  if (cache) return cache;
  const gradient = new THREE.DataTexture(new Uint8Array([185, 222, 255]), 3, 1, THREE.RedFormat);
  gradient.minFilter = gradient.magFilter = THREE.NearestFilter; gradient.needsUpdate = true;
  cache = Object.fromEntries(Object.entries(C).map(([k, color]) => [k, new THREE.MeshToonMaterial({ color, gradientMap: gradient })]));
  cache.ink = new THREE.MeshBasicMaterial({ color: C.ink });
  return cache;
}
const box = (p, w, h, d, mat, pos, outline = false) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); o.position.set(...pos); o.userData.outline = outline; p.add(o); return o; };
// plan slab: rectangle x0…x1 × z0…z1 with a rounded +x +z corner, extruded from y0 up by h
function slab(p, { x0, x1, z0, z1, r = 0 }, y0, h, mat, outline = true) {
  const s = new THREE.Shape(); s.moveTo(x0, -z0); s.lineTo(x1, -z0);
  if (r > 0) { s.lineTo(x1, -(z1 - r)); s.absarc(x1 - r, -(z1 - r), r, 0, -Math.PI / 2, true); } else s.lineTo(x1, -z1);
  s.lineTo(x0, -z1); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false, curveSegments: 16 }); g.rotateX(-Math.PI / 2); g.translate(0, y0, 0);
  const o = new THREE.Mesh(g, mat); o.userData.outline = outline; p.add(o); return o;
}
// soft joints on the pavement: one thin strip per line, stopped short of the rounded corner
function joints(p, m, { x0, x1, z0, z1, r = 0 }, y, step = 1.2) {
  const cx = x1 - r, cz = z1 - r, reach = (u) => (r > 0 && u > cx - 1e-6 ? Math.sqrt(Math.max(0, r * r - (u - cx) ** 2)) : r) - 0.15;
  for (let x = x0 + step; x < x1 - 0.2; x += step) { const end = r > 0 && x > cx ? cz + reach(x) : z1 - 0.1; if (end > z0 + 0.2) box(p, 0.012, 0.004, end - z0 - 0.1, m.joint, [x, y, (z0 + 0.1 + end) / 2]); }
  for (let z = z0 + step; z < z1 - 0.2; z += step) { const end = r > 0 && z > cz ? cx + reach(z) : x1 - 0.1; if (end > x0 + 0.2) box(p, end - x0 - 0.1, 0.004, 0.012, m.joint, [(x0 + 0.1 + end) / 2, y, z]); }
}
// the road: an L along the public sides, with a dashed centre line on each straight run
function road(p, m, a, top, sides, width) {
  const y = top - 0.14, ext = { x0: a.x0, x1: a.x1 + (sides.includes('right') ? width : 0), z0: a.z0, z1: a.z1 + (sides.includes('front') ? width : 0) };
  slab(p, ext, y - 0.3, 0.3, m.road);
  const dash = (x, z, along) => box(p, along ? 0.7 : 0.07, 0.004, along ? 0.07 : 0.7, m.ink, [x, y + 0.004, z]);
  if (sides.includes('front')) for (let x = a.x0 + 0.6; x < a.x1 - (a.r || 0) - 0.4; x += 1.4) dash(x + 0.35, a.z1 + width / 2, true);
  if (sides.includes('right')) for (let z = a.z0 + 0.6; z < a.z1 - (a.r || 0) - 0.4; z += 1.4) dash(a.x1 + width / 2, z + 0.35, false);
  return { ...ext, y };
}
// a run of iron railing: posts with ball finials and two rails, following the given points
function rail(p, m, points, top, h = 0.78) {
  const pts = points.map(([x, z]) => new THREE.Vector3(x, top, z)), g = new THREE.Group(); g.name = 'Iron railing'; p.add(g);
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1], n = Math.max(1, Math.round(a.distanceTo(b) / 0.45));
    for (let k = 0; k <= n; k++) {
      if (i > 0 && k === 0) continue;
      const v = a.clone().lerp(b, k / n);
      box(g, 0.035, h, 0.035, m.iron, [v.x, top + h / 2, v.z], true);
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), m.iron); ball.position.set(v.x, top + h + 0.03, v.z); g.add(ball);
    }
    for (const y of [0.18, h - 0.06]) {
      const mid = a.clone().add(b).multiplyScalar(0.5), len = a.distanceTo(b), r = box(g, len, 0.03, 0.03, m.iron, [mid.x, top + y, mid.z], true);
      r.rotation.y = -Math.atan2(b.z - a.z, b.x - a.x);
    }
  }
  return g;
}
// yellow tactile tiles with rows of studs, along a straight run
function tactile(p, m, from, to, y, tile = 0.32) {
  const a = new THREE.Vector3(from[0], y, from[1]), b = new THREE.Vector3(to[0], y, to[1]), n = Math.max(1, Math.round(a.distanceTo(b) / (tile + 0.03))), turn = -Math.atan2(b.z - a.z, b.x - a.x);
  for (let i = 0; i < n; i++) {
    const v = a.clone().lerp(b, (i + 0.5) / n), t = box(p, tile, 0.02, tile, m.tactile, [v.x, y + 0.01, v.z], true); t.rotation.y = turn;
    for (let k = 0; k < 3; k++) { const d = box(p, 0.24, 0.012, 0.02, m.dot, [v.x, y + 0.024, v.z], false); d.rotation.y = turn + Math.PI / 2; d.position.x += Math.cos(turn) * (k - 1) * 0.09; d.position.z -= Math.sin(turn) * (k - 1) * 0.09; }
  }
}

/**
 * Builds the ground under a place and returns the floor rectangles its projected shadow should be laid on.
 * opts: { style, x0, x1, z0, z1, top = 0.155, corner = 0, sides = ['front','right'], width = 1.4, rails: [[[x,z]…], …] }
 */
export function streetEdge(parent, opts) {
  const m = materials(), { style = 'curb', top = 0.155, corner = 0, sides = ['front', 'right'], width = 1.4 } = opts;
  const g = new THREE.Group(); g.name = `Street edge (${style})`; parent.add(g);
  const a = { x0: opts.x0, x1: opts.x1, z0: opts.z0, z1: opts.z1, r: corner }, floors = [{ ...a, y: top + 0.004 }];
  if (style === 'curb') {
    // white slab, a cream trim course below and a ring of curb stones (the series' original base)
    slab(g, a, top - 0.15, 0.15, m.paving); slab(g, { ...a, x0: a.x0 - 0.05, x1: a.x1 + 0.05, z0: a.z0 - 0.05, z1: a.z1 + 0.05 }, top - 0.25, 0.1, m.cream);
    const y = top - 0.025;
    for (let x = a.x0 + 0.3; x <= a.x1 - 0.29 - a.r; x += 0.57) { box(g, 0.52, 0.1, 0.27, m.cream, [x, y, a.z1 - 0.135], true); box(g, 0.52, 0.1, 0.27, m.cream, [x, y, a.z0 + 0.135], true); }
    for (let z = a.z0 + 0.55; z < a.z1 - 0.4 - a.r; z += 0.55) { box(g, 0.25, 0.1, 0.5, m.cream, [a.x1 - 0.125, y, z], true); box(g, 0.25, 0.1, 0.5, m.cream, [a.x0 + 0.125, y, z], true); }
    joints(g, m, { ...a, x0: a.x0 + 0.27, x1: a.x1 - 0.27, z0: a.z0 + 0.27, z1: a.z1 - 0.27 }, top + 0.002, 1.1);
    return { group: g, floors };
  }
  // 'rail' and 'tactile': a clean, outlined pavement edge over the road
  slab(g, a, top - 0.14, 0.14, m.paving);
  joints(g, m, a, top + 0.002);
  // the shadow is laid on the road strips only — the part of the road under the pavement is never seen
  const rd = road(g, m, a, top, sides, width);
  if (sides.includes('front')) floors.push({ x0: a.x0, x1: rd.x1, z0: a.z1, z1: rd.z1, y: rd.y + 0.004 });
  if (sides.includes('right')) floors.push({ x0: a.x1, x1: rd.x1, z0: a.z0, z1: a.z1, y: rd.y + 0.004 });
  if (style === 'rail') for (const run of opts.rails || []) rail(g, m, run, top);
  if (style === 'tactile') {
    const inset = 0.3;
    if (sides.includes('front')) tactile(g, m, [a.x0 + 0.3, a.z1 - inset], [a.x1 - a.r - 0.1, a.z1 - inset], top);
    if (sides.includes('right')) tactile(g, m, [a.x1 - inset, a.z0 + 0.3], [a.x1 - inset, a.z1 - a.r - 0.1], top);
  }
  return { group: g, floors };
}
