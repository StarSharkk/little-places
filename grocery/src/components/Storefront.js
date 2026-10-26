import * as THREE from "three";
import { group, box, rod, extrusion, sign } from "./primitives.js";
export function Storefront(parent, m, atlas, c) {
  const g = group(parent, [0, 0.18, c.depth / 2], 0, "Storefront");
  // Two solid jambs, a real opening, and recessed interior shelves.
  for (const x of [-2.12, 2.12]) {
    box(g, 0.32, 2.75, 0.32, m.trim, [x, 1.35, 0]);
    for (let y = 0.15; y < 2.7; y += 0.27)
      box(g, 0.33, 0.012, 0.34, m.steel, [x, y, 0], false);
  }
  box(g, 4.45, 0.16, 0.64, m.concrete, [0, 0.02, 0.18]);
  box(g, 3.96, 2.15, 0.12, m.dark, [0, 1.15, -0.64]);
  atlas.attach(g, "interior", 3.85, 2.05, [0, 1.15, -0.57]);
  const shutter = group(g, [0, 0.12, 0.02], 0, "Roller shutter");
  box(shutter, 3.91, 2.11, 0.06, m.steel, [0, 1.055, 0]);
  atlas.attach(shutter, "shutter", 3.89, 2.09, [0, 1.055, 0.039]);
  box(shutter, 3.94, 0.075, 0.13, m.ink, [0, 0.03, 0.02]);
  for (const x of [-1.99, 1.99])
    box(g, 0.075, 2.26, 0.14, m.steel, [x, 1.2, 0.04]);
  // Reusable roll-up assembly keeps the panel scaling inside its housing.
  const housing = group(g, [0, 2.36, 0.06]);
  box(housing, 4.14, 0.22, 0.25, m.trim);
  const canopy = group(g, [0, 2.57, 0.05], 0, "Red fabric canopy");
  const profile = new THREE.Shape();
  profile.moveTo(0, 0);
  profile.lineTo(0.91, -0.39);
  profile.lineTo(0.91, -0.49);
  profile.lineTo(0, -0.1);
  profile.closePath();
  const awning = extrusion(canopy, profile, 4.52, m.red);
  awning.rotation.y = -Math.PI / 2;
  awning.position.x = 2.26;
  const art = atlas.attach(canopy, "canopy", 4.39, 0.96, [0, -0.2, 0.455]);
  art.rotation.x = -Math.PI / 2 + Math.atan(0.39 / 0.91);
  box(canopy, 4.55, 0.16, 0.09, m.redDark, [0, -0.47, 0.93]);
  const lip = atlas.attach(canopy, "canopy", 4.42, 0.14, [0, -0.47, 0.981]);
  for (const x of [-2.15, 2.15])
    rod(canopy, [x, -0.7, 0], [x, -0.44, 0.86], 0.023, m.steel);
  for (let x = -2.2; x < 2.3; x += 0.52)
    rod(canopy, [x, -0.01, 0.02], [x, -0.4, 0.91], 0.006, m.redDark, false);
  sign(g, atlas, "shop", 4.39, 0.56, [0, 3.0, 0.48], 0, m.steel);
  for (const x of [-1.8, 1.8]) {
    rod(g, [x, 3.37, 0.06], [x, 3.41, 0.28], 0.017, m.ink);
    box(g, 0.22, 0.08, 0.19, m.trim, [x, 3.38, 0.27]);
  }
  sign(g, atlas, "vertical", 0.43, 2.12, [2.3, 2.5, 0.45], 0, m.steel);
  box(g, 0.08, 2.3, 0.45, m.steel, [2.3, 2.5, 0.17]);
  sign(g, atlas, "posterGold", 0.32, 0.79, [-2.12, 1.25, 0.19], 0, m.trim);
  sign(g, atlas, "hours", 0.32, 0.32, [2.12, 1.35, 0.19], 0, m.trim);
  return {
    group: g,
    shutter,
    setOpen(amount) {
      shutter.scale.y = 1 - amount * 0.94;
      shutter.position.y = 0.12 + 2.11 * amount * 0.94;
    },
  };
}
