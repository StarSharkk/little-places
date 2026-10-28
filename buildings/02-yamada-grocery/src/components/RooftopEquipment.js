import * as THREE from "three";
import { group, box, cyl, rod, tube, sign } from "./primitives.js";
export function AirUnit(
  parent,
  m,
  atlas,
  pos = [0, 0, 0],
  rotation = 0,
  scale = 1,
) {
  const g = group(parent, pos, rotation, "Outdoor air conditioner");
  g.scale.setScalar(scale);
  box(g, 1.02, 0.65, 0.43, m.trim, [0, 0.33, 0]);
  atlas.attach(g, "hvac", 0.96, 0.58, [0, 0.33, 0.223]);
  for (const x of [-0.37, 0.37]) {
    box(g, 0.09, 0.13, 0.62, m.steel, [x, -0.06, 0.02]);
    rod(g, [x, 0.1, -0.25], [x, -0.15, 0.2], 0.015, m.steel);
  }
  tube(
    g,
    [
      [0.51, 0.37, -0.12],
      [0.64, 0.37, -0.12],
      [0.64, -0.15, -0.1],
      [0.68, -0.22, -0.3],
    ],
    0.025,
    m.trim,
  );
  return g;
}
export function RooftopEquipment(parent, m, atlas, c) {
  const y = c.height;
  const g = group(parent, [0, y, 0], 0, "Rooftop equipment");
  box(g, c.width + 0.16, 0.13, c.depth + 0.16, m.trim, [0, 0.04, 0]);
  box(g, c.width - 0.28, 0.035, c.depth - 0.28, m.roof, [0, 0.12, 0]);
  for (const x of [-c.width / 2, c.width / 2]) {
    box(g, 0.13, 0.32, c.depth + 0.1, m.trim, [x, 0.18, 0]);
    for (let z = -1.7; z <= 1.8; z += 0.7)
      rod(g, [x, 0.31, z], [x, 0.84, z], 0.021, m.steel);
    rod(g, [x, 0.84, -1.8], [x, 0.84, 1.8], 0.025, m.steel);
    rod(g, [x, 0.55, -1.8], [x, 0.55, 1.8], 0.014, m.steel);
  }
  for (const z of [-c.depth / 2, c.depth / 2]) {
    box(g, c.width, 0.32, 0.12, m.trim, [0, 0.18, z]);
    for (let x = -2.1; x < 2.2; x += 0.7)
      rod(g, [x, 0.3, z], [x, 0.84, z], 0.02, m.steel);
    rod(g, [-2.25, 0.84, z], [2.25, 0.84, z], 0.025, m.steel);
    rod(g, [-2.25, 0.55, z], [2.25, 0.55, z], 0.014, m.steel);
  }
  // Offset utility room gives the rooftop its asymmetrical silhouette.
  box(g, 1.4, 1.43, 1.22, m.wall, [-1.24, 0.84, -0.82]);
  box(g, 1.55, 0.14, 1.38, m.trim, [-1.24, 1.61, -0.82]);
  box(g, 0.65, 1.18, 0.045, m.steel, [-1.25, 0.75, -0.19]);
  box(g, 0.56, 0.04, 0.055, m.ink, [-1.25, 0.96, -0.16]);
  box(g, 0.045, 0.18, 0.055, m.ink, [-1.04, 0.67, -0.14]);
  for (let i = 0; i < 5; i++)
    box(g, 0.43, 0.018, 0.025, m.ink, [-1.25, 0.26 + i * 0.07, -0.15], false);
  // Twin condenser units on a braced steel rack.
  const rack = group(g, [0.74, 0.2, 0.13]);
  for (const x of [-0.55, 0.55])
    for (const z of [-0.29, 0.29])
      rod(rack, [x, 0, z], [x, 1.72, z], 0.025, m.steel);
  for (const y of [0.2, 1.0]) {
    box(rack, 1.21, 0.06, 0.72, m.steel, [0, y, 0]);
    AirUnit(rack, m, atlas, [0, y + 0.08, 0]);
  }
  rod(rack, [-0.55, 0.2, -0.3], [0.55, 1.6, -0.3], 0.018, m.steel);
  // Bent ductwork is actual curved tubing, not a flat silhouette.
  tube(
    g,
    [
      [1.38, 0.25, -0.82],
      [1.38, 0.88, -0.82],
      [1.6, 1.1, -0.82],
      [1.96, 1.1, -0.82],
    ],
    0.13,
    m.steel,
  );
  cyl(g, 0.21, 0.19, 0.08, m.trim, [1.96, 1.12, -0.82]);
  cyl(g, 0.22, 0.17, 0.52, m.steel, [-0.2, 0.4, -1.25]);
  cyl(g, 0.29, 0.29, 0.08, m.trim, [-0.2, 0.69, -1.25]);
  rod(g, [-1.84, 0.2, -1.15], [-1.84, 2.35, -1.15], 0.017, m.steel);
  for (const y of [1.94, 2.17]) {
    rod(g, [-2.25, y, -1.15], [-1.4, y, -1.15], 0.014, m.steel);
    for (const x of [-2.16, -1.9, -1.65, -1.46])
      rod(g, [x, y, -1.45], [x, y, -0.85], 0.011, m.steel);
  }
  // Rooftop service conduits and small electrical cabinet.
  box(g, 0.36, 0.5, 0.22, m.steel, [1.7, 0.4, 1.3]);
  tube(
    g,
    [
      [1.7, 0.2, 1.3],
      [1, 0.18, 1.3],
      [1, 0.18, 0.2],
    ],
    0.028,
    m.ink,
  );
  return g;
}
