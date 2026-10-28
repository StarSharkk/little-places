import * as THREE from 'three';
import { group, box, plate, rod, tube, sphere, cylinder, cone, mesh } from './primitives.js';
import { G } from './Architecture.js';

// Roof slab with a layered cornice, a low parapet and a walnut railing: a small reading terrace on top.
export function Roof(root, m, atlas, extras) {
  const { X0, X1, Z0, Z1, TOP, TERRACE } = G;
  const g = group(root, 'Rooftop reading terrace');
  const w = X1 - X0, d = Z1 - Z0, cx = (X0 + X1) / 2, cz = (Z0 + Z1) / 2;
  box(g, w + 0.06, 0.05, d + 0.06, m.frame, [cx, TOP + 0.025, cz]);
  box(g, w + 0.2, 0.15, d + 0.2, m.cream, [cx, TOP + 0.125, cz]);
  box(g, w + 0.24, 0.04, d + 0.24, m.cream, [cx, TERRACE - 0.03, cz]);
  box(g, w - 0.1, 0.012, d - 0.1, m.deck, [cx, TERRACE - 0.004, cz], false);  // terrace floor in the deck colour
  // terrace floor: cream tiles with soft joints
  for (let x = X0 + 0.5; x < X1 - 0.2; x += 0.5) rod(g, [x, TERRACE + 0.002, Z0 + 0.15], [x, TERRACE + 0.002, Z1 - 0.15], 0.004, m.stone, 4);
  for (let z = Z0 + 0.5; z < Z1 - 0.2; z += 0.5) rod(g, [X0 + 0.15, TERRACE + 0.002, z], [X1 - 0.15, TERRACE + 0.002, z], 0.004, m.stone, 4);
  // parapet (building colour) with a cream cap
  const ph = 0.32, pt = 0.14, py = TERRACE + ph / 2;
  box(g, w, ph, pt, m.wall, [cx, py, Z1 - pt / 2]); box(g, w, ph, pt, m.wall, [cx, py, Z0 + pt / 2]);
  box(g, pt, ph, d - 2 * pt, m.wall, [X0 + pt / 2, py, cz]); box(g, pt, ph, d - 2 * pt, m.wall, [X1 - pt / 2, py, cz]);
  const cap = (len, depth, pos) => box(g, len, 0.04, depth, m.cream, pos);
  cap(w + 0.04, pt + 0.06, [cx, TERRACE + ph + 0.02, Z1 - pt / 2]); cap(w + 0.04, pt + 0.06, [cx, TERRACE + ph + 0.02, Z0 + pt / 2]);
  cap(pt + 0.06, d, [X0 + pt / 2, TERRACE + ph + 0.02, cz]); cap(pt + 0.06, d, [X1 - pt / 2, TERRACE + ph + 0.02, cz]);
  // walnut railing on the street sides (front and right) and the left end
  const ry = TERRACE + ph + 0.04, rh = 0.5;
  const rail = (a, b) => {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(2, Math.round(len / 0.7));
    for (let i = 0; i <= n; i++) { const t = i / n; box(g, 0.06, rh, 0.06, m.walnut, [a[0] + (b[0] - a[0]) * t, ry + rh / 2, a[1] + (b[1] - a[1]) * t]); }
    const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], along = Math.abs(b[0] - a[0]) > 0.01;
    box(g, along ? len + 0.06 : 0.07, 0.05, along ? 0.07 : len + 0.06, m.walnut, [mid[0], ry + rh, mid[1]]);
    rod(g, [a[0], ry + rh * 0.45, a[1]], [b[0], ry + rh * 0.45, b[1]], 0.014, m.walnut, 6);
  };
  rail([X0 + pt / 2, Z1 - pt / 2], [X1 - pt / 2, Z1 - pt / 2]);
  rail([X1 - pt / 2, Z1 - pt / 2], [X1 - pt / 2, Z0 + pt / 2]);
  rail([X0 + pt / 2, Z0 + pt / 2], [X0 + pt / 2, Z1 - pt / 2]);
  if (extras) extras(g);
  return g;
}
