// Diorama base: road slab, raised paved sidewalk with a rounded street corner, tile joints,
// and a flat illustrated cast shadow that is re-projected whenever the (camera-bound) light turns.
import * as THREE from 'three';
import { extrude, roundRectPath } from './kit.js';

function convexHull(pts) {
  const p = pts.map(v => [v[0], v[1]]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return p;
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [];
  for (const q of p) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  const up = [];
  for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  lo.pop(); up.pop();
  return lo.concat(up);
}

// Sutherland–Hodgman against a convex CCW polygon
function clip(poly, clipper) {
  let out = poly;
  for (let i = 0; i < clipper.length && out.length; i++) {
    const a = clipper[i], b = clipper[(i + 1) % clipper.length];
    const inside = p => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]) >= 0;
    const inter = (p, q) => {
      const d1x = q[0] - p[0], d1y = q[1] - p[1], d2x = b[0] - a[0], d2y = b[1] - a[1];
      const t = ((a[0] - p[0]) * d2y - (a[1] - p[1]) * d2x) / (d1x * d2y - d1y * d2x);
      return [p[0] + d1x * t, p[1] + d1y * t];
    };
    const input = out; out = [];
    for (let j = 0; j < input.length; j++) {
      const cur = input[j], prev = input[(j + input.length - 1) % input.length];
      if (inside(cur)) { if (!inside(prev)) out.push(inter(prev, cur)); out.push(cur); }
      else if (inside(prev)) out.push(inter(prev, cur));
    }
  }
  return out;
}

export function buildGround(kit, root, cfg) {
  const { x0, x1, z0, z1 } = cfg.plate;
  const sx1 = x1 - 1.35, sz1 = z1 - 1.15;            // sidewalk extent; the rest is road
  const R = 1.5;

  // road slab
  kit.part(root, 'road', new THREE.BoxGeometry(x1 - x0, 0.42, z1 - z0), { p: [(x0 + x1) / 2, -0.14 - 0.21, (z0 + z1) / 2], line: 'outer' });
  // sidewalk: rect with rounded front-right corner. shape y = -z
  const sh = new THREE.Shape();
  sh.moveTo(x0, -z0); sh.lineTo(sx1, -z0); sh.lineTo(sx1, -(sz1 - R));
  sh.absarc(sx1 - R, -(sz1 - R), R, 0, -Math.PI / 2, true);
  sh.lineTo(x0, -sz1); sh.closePath();
  const sw = extrude(sh, 0.14, 0.01, 20);
  sw.rotateX(-Math.PI / 2);
  sw.translate(0, -0.14, 0);
  kit.part(root, 'pave', sw, { line: 'outer', angle: 40 });
  // curb highlight strip (inner edge line)
  // road markings: dashed centre line in the front strip and the right strip
  const dash = [];
  const zc = (sz1 + z1) / 2, xc = (sx1 + x1) / 2;
  for (let x = x0 + 0.6; x < sx1 - 1.2; x += 1.5) dash.push(x, -0.138, zc, x + 0.8, -0.138, zc);
  for (let z = z0 + 0.6; z < sz1 - 1.6; z += 1.5) dash.push(xc, -0.138, z, xc, -0.138, z + 0.8);
  kit.seg(root, 'mid', dash);

  // sidewalk polygon (convex CCW in x,z) for shadow clipping and tile culling
  const poly = [[x0, z0], [sx1, z0], [sx1, sz1 - R]];
  for (let i = 1; i <= 10; i++) { const a = (i / 10) * (Math.PI / 2); poly.push([sx1 - R + Math.cos(a) * R, sz1 - R + Math.sin(a) * R]); }
  poly.push([x0, sz1]);
  const inside = (x, z) => {
    if (x < x0 || x > sx1 || z < z0 || z > sz1) return false;
    const cx = sx1 - R, cz = sz1 - R;
    return !(x > cx && z > cz && Math.hypot(x - cx, z - cz) > R - 0.04);
  };

  // tile joints
  const tile = 1.2, soft = [];
  const push = (ax, az, bx, bz) => {
    const n = Math.ceil(Math.hypot(bx - ax, bz - az) / 0.25);
    for (let i = 0; i < n; i++) {
      const t0 = i / n, t1 = (i + 1) / n;
      const px = ax + (bx - ax) * t0, pz = az + (bz - az) * t0, qx = ax + (bx - ax) * t1, qz = az + (bz - az) * t1;
      if (inside(px, pz) && inside(qx, qz)) soft.push(px, 0.004, pz, qx, 0.004, qz);
    }
  };
  for (let x = x0 + tile; x < sx1; x += tile) push(x, z0, x, sz1);
  for (let z = z0 + tile; z < sz1; z += tile) push(x0, z, sx1, z);
  kit.seg(root, 'soft', soft);

  // ---- cast shadow ---------------------------------------------------------------------
  const CAP = 1200;
  const posAttr = new THREE.BufferAttribute(new Float32Array(CAP * 3), 3);
  posAttr.setUsage(THREE.DynamicDrawUsage);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', posAttr);
  const mat = new THREE.MeshBasicMaterial({ color: '#BFCBE0', side: THREE.DoubleSide });
  mat.polygonOffset = true; mat.polygonOffsetFactor = -2; mat.polygonOffsetUnits = -2;
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = -1;
  mesh.name = 'ground-shadow';
  mesh.userData.baked = true;
  root.add(mesh);
  const casters = [];

  // `layers` lets a host lay the shadow at several heights, e.g. on the sidewalk (clipped to it)
  // and under the slab (unclipped) so it continues beyond the base like the other buildings.
  function update(lx, ly, lz, length = 0.45, { layers = [{ clip: true, y: 0.003 }] } = {}) {
    // light dir toward the sun (world); shadows run opposite, stylised shorter
    const k = length / ly;
    let n = 0;
    const arr = posAttr.array;
    for (const layer of layers) for (const pts of casters) {
      const proj = pts.map(([px, py, pz]) => [px - py * lx * k, pz - py * lz * k]);
      let hull = convexHull(proj);
      if (hull.length < 3) continue;
      if (layer.clip) hull = clip(hull, poly);
      for (let i = 1; i + 1 < hull.length && n + 3 <= CAP; i++) {
        for (const q of [hull[0], hull[i], hull[i + 1]]) { arr[n * 3] = q[0]; arr[n * 3 + 1] = layer.y; arr[n * 3 + 2] = q[1]; n++; }
      }
    }
    geo.setDrawRange(0, n);
    posAttr.needsUpdate = true;
  }

  return { casters, update, inside, shadowMat: mat };
}
