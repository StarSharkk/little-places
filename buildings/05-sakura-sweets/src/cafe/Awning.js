// Striped shop awning: sloped slats, scalloped valance, side cheeks and iron arms.
import * as THREE from 'three';
import { extrude } from './kit.js';

export function addAwning(kit, g, { u, w, y, depth = 0.9, drop = 0.5, stripe = 0.22, valance = 0.24 }) {
  const n = Math.max(2, Math.round(w / stripe));
  const sw = w / n;
  const slope = Math.hypot(depth, drop);
  const alpha = Math.atan2(drop, depth);
  for (let i = 0; i < n; i++) {
    const role = i % 2 === 0 ? 'awning' : 'cream';
    const x = u + (i + 0.5) * sw;
    kit.part(g, role, new THREE.BoxGeometry(sw, 0.05, slope), { p: [x, y - drop / 2, depth / 2], r: [alpha, 0, 0], line: 'thin' });
    // scalloped valance flap
    const s = new THREE.Shape();
    s.moveTo(0, 0); s.lineTo(sw, 0); s.lineTo(sw, -valance);
    s.absarc(sw / 2, -valance, sw / 2, 0, -Math.PI, true);
    s.lineTo(0, 0);
    kit.part(g, role, extrude(s, 0.035, 0, 14), { p: [u + i * sw, y - drop, depth - 0.005], line: 'thin' });
  }
  // side cheeks
  const tri = new THREE.Shape();
  tri.moveTo(0, 0); tri.lineTo(depth, -drop); tri.lineTo(0, -drop - 0.03); tri.closePath();
  for (const side of [0, 1]) {
    const geo = extrude(tri, 0.03);
    geo.rotateY(-Math.PI / 2);
    kit.part(g, 'cream', geo, { p: [u + (side ? w + 0.03 : 0.0), y, 0.0], line: 'thin' });
  }
  // top flashing at the wall and iron arms
  kit.part(g, 'ink', new THREE.BoxGeometry(w + 0.06, 0.05, 0.05), { p: [u + w / 2, y + 0.01, 0.025], line: 'none' });
  for (const x of [u + 0.12, u + w - 0.12]) {
    kit.rod(g, 'ink', [x, y - 0.03, 0.02], [x, y - drop - 0.02, depth - 0.02], 0.014, { line: 'none' });
  }
}
