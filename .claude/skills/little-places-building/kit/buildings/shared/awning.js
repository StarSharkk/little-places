import * as THREE from 'three';
import { group, box, rod, extrudeShape } from './primitives.js';
// The series' striped awning (SKILL.md → awnings are always striped): two-colour bands, one scallop per stripe on the
// valance, side cheeks, a walnut head rail and two iron arms. Origin at the top of the head rail on the wall face,
// sloping out along +z. Materials: m.awning (or m.accent) and m.stripe for the bands, m.walnut, m.iron.
export function Awning(p, m, { len, out = 0.8, drop = 0.42, pos = [0, 0, 0], colour = m.awning ?? m.accent, stripe = m.stripe }) {
  const g = group(p, 'Striped awning', pos);
  const n = Math.max(5, Math.round(len / 0.24)), sw = len / n, slope = Math.atan2(drop, out), L = Math.hypot(out, drop);
  for (let i = 0; i < n; i++) {
    const x = -len / 2 + sw * (i + 0.5), mat = i % 2 ? stripe : colour;
    box(g, sw + 0.002, 0.03, L, mat, [x, -drop / 2, out / 2]).rotation.x = slope;
    const v = new THREE.Shape(); v.moveTo(-sw / 2, 0); v.lineTo(sw / 2, 0); v.lineTo(sw / 2, -0.11); v.absarc(0, -0.11, sw / 2, 0, -Math.PI, true); v.lineTo(-sw / 2, 0);
    extrudeShape(g, v, 0.025, mat, [x, -drop + 0.01, out + 0.005], false);
  }
  for (const s of [-1, 1]) {
    const cheek = new THREE.Shape(); cheek.moveTo(0, 0); cheek.lineTo(out, -drop); cheek.lineTo(out, -drop - 0.11); cheek.lineTo(0, -0.05); cheek.closePath();
    extrudeShape(g, cheek, 0.025, colour, [s * (len / 2 + 0.013), 0, 0]).rotation.y = -Math.PI / 2;
  }
  box(g, len + 0.08, 0.08, 0.08, m.walnut, [0, 0, 0.04]);
  for (const x of [-len / 2 + 0.08, len / 2 - 0.08]) rod(g, [x, -0.38, 0.02], [x, -drop + 0.02, out - 0.05], 0.014, m.iron, 6);
  return g;
}
