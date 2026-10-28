import * as THREE from "three";
import {
  group,
  box,
  cyl,
  sphere,
  rod,
  tube,
  extrusion,
  roundedShape,
  sign,
  mesh,
} from "./primitives.js";
import { FruitCrateContents } from './Merchandise.js';
export function Bottle(p, m, atlas, pos, scale = 1) {
  const g = group(p, pos, 0, "Grocery beverage bottle");
  g.scale.setScalar(scale);
  cyl(g, 0.065, 0.065, 0.26, m.bottle, [0, 0.13, 0], 10);
  cyl(g, 0.028, 0.065, 0.07, m.bottle, [0, 0.295, 0], 10);
  cyl(g, 0.027, 0.027, 0.11, m.bottle, [0, 0.38, 0], 10);
  cyl(g, 0.031, 0.031, 0.035, m.paper, [0, 0.447, 0], 10);
  atlas.attach(g, "bottleLabel", 0.105, 0.14, [0, 0.16, 0.066]);
  return g;
}
export function Crate(p, m, atlas, pos, full = false, color = m.red) {
  const g = group(p, pos, 0, "Beverage crate");
  box(g, 0.65, 0.06, 0.46, color, [0, 0.03, 0]);
  for (const z of [-0.23, 0.23]) {
    box(g, 0.65, 0.07, 0.04, color, [0, 0.31, z]);
    box(g, 0.65, 0.1, 0.04, color, [0, 0.13, z]);
    for (let x = -0.3; x < 0.33; x += 0.15)
      box(g, 0.025, 0.28, 0.04, color, [x, 0.17, z]);
  }
  for (const x of [-0.325, 0.325]) box(g, 0.04, 0.3, 0.46, color, [x, 0.17, 0]);
  atlas.attach(g, "crate", 0.33, 0.1, [0, 0.15, 0.253]);
  if (full) FruitCrateContents(g,m);
  return g;
}
function Plant(p, m, pos, scale = 1) {
  const g = group(p, pos, 0, "Potted plant");
  g.scale.setScalar(scale);
  cyl(g, 0.21, 0.15, 0.38, m.blue, [0, 0.19, 0]);
  cyl(g, 0.23, 0.23, 0.055, m.trim, [0, 0.38, 0]);
  cyl(g, 0.19, 0.19, 0.012, m.soil, [0, 0.414, 0]);
  for (let i = 0; i < 9; i++) {
    const a = i * 2.4;
    const h = 0.5 + (i % 3) * 0.18;
    rod(
      g,
      [0, 0.4, 0],
      [Math.sin(a) * 0.18, h, Math.cos(a) * 0.18],
      0.01,
      m.green,
      false,
    );
    const leaf = sphere(g, 0.12, m.leaf, [
      Math.sin(a) * 0.2,
      h,
      Math.cos(a) * 0.2,
    ]);
    leaf.scale.set(0.5, 1.65, 0.75);
    leaf.rotation.z = Math.sin(a) * 0.8;
  }
  return g;
}
function Cone(p, m, pos) {
  const g = group(p, pos, 0, "Traffic cone");
  box(g, 0.35, 0.045, 0.35, m.ink, [0, 0.023, 0]);
  cyl(g, 0.025, 0.15, 0.49, m.orange, [0, 0.285, 0], 16);
  cyl(g, 0.072, 0.096, 0.095, m.trim, [0, 0.285, 0], 16);
  cyl(g, 0.038, 0.054, 0.065, m.trim, [0, 0.425, 0], 16);
  return g;
}
export function StreetProps(parent, m, atlas, c) {
  const g = group(
    parent,
    [0, 0, 0],
    0,
    "Street props and standalone presentation base",
  );
  // A new, self-contained base. No existing road scene is read or modified.
  const plinth = extrusion(
    g,
    roundedShape(8.2, 7.4, 0.32),
    0.28,
    m.concrete,
    [0.45, -0.33, 0.4],
  );
  plinth.rotation.x = -Math.PI / 2;
  const road = extrusion(
    g,
    roundedShape(8.16, 7.36, 0.31),
    0.035,
    m.asphalt,
    [0.45, -0.04, 0.4],
  );
  road.rotation.x = -Math.PI / 2;
  const sidewalk = extrusion(
    g,
    roundedShape(7.12, 6.32, 0.38),
    0.22,
    m.curb,
    [0.04, 0, -0.05],
  );
  sidewalk.rotation.x = -Math.PI / 2;
  for (let z = -2.7; z < 3.05; z += 0.55)
    box(g, 6.8, 0.007, 0.012, m.concrete, [0.04, 0.227, z], false);
  for (let x = -3.2; x < 3.6; x += 0.55)
    box(g, 0.012, 0.007, 5.95, m.concrete, [x, 0.227, -0.05], false);
  for (let x = -3.2; x < 3.6; x += 0.53)
    box(g, 0.49, 0.08, 0.19, m.trim, [x, 0.19, 3.05]);
  for (let z = -2.8; z < 3.05; z += 0.53)
    box(g, 0.18, 0.08, 0.49, m.trim, [3.51, 0.19, z]);
  // Tactile paving follows the two public edges, with a turning tile at the corner.
  for (let x = -2.9; x < 3.4; x += 0.36) {
    box(g, 0.34, 0.025, 0.32, m.yellow, [x, 0.239, 2.74], false);
    for (let i = 0; i < 3; i++)
      box(
        g,
        0.022,
        0.012,
        0.25,
        m.paper,
        [x - 0.09 + i * 0.09, 0.257, 2.74],
        false,
      );
  }
  for (let z = -2.5; z < 2.74; z += 0.36) {
    box(g, 0.32, 0.025, 0.34, m.yellow, [3.28, 0.239, z], false);
    for (let i = 0; i < 3; i++)
      box(
        g,
        0.25,
        0.012,
        0.022,
        m.paper,
        [3.28, 0.257, z - 0.09 + i * 0.09],
        false,
      );
  }
  // White road marks and a compact drain, all correctly oriented on the ground.
  for (let x = -1.4; x < 1.5; x += 0.55)
    box(g, 0.3, 0.008, 0.63, m.line, [x, 0.004, 3.56], false);
  box(g, 0.065, 0.008, 4.4, m.line, [3.95, 0.004, -0.1], false);
  const mark = atlas.attach(g, "streetMark", 1.25, 0.54, [-2.6, 0.008, 3.4]);
  mark.rotation.x = -Math.PI / 2;
  for (const pos of [
    [1.95, 0.025, 3.25],
    [3.78, 0.025, 0.6],
  ]) {
    const drain = group(g, pos);
    box(drain, 0.58, 0.025, 0.23, m.ink);
    for (let i = 0; i < 8; i++)
      box(
        drain,
        0.022,
        0.02,
        0.18,
        m.steel,
        [-0.24 + i * 0.067, 0.02, 0],
        false,
      );
  }
  cyl(g, 0.3, 0.3, 0.014, m.ink, [-1.95, 0.015, 3.2], 32);
  for (let i = -2; i <= 2; i++)
    box(g, 0.37, 0.006, 0.012, m.steel, [-1.95, 0.026, 3.2 + i * 0.065], false);
  // Front goods belong to the storefront and leave the central shutter accessible.
  Crate(g, m, atlas, [-1.46, 0.23, 2.26], true);
  Crate(g, m, atlas, [-1.46, 0.57, 2.26], true);
  Crate(g, m, atlas, [-0.75, 0.23, 2.13], false, m.yellow);
  Plant(g, m, [-2.55, 0.23, 1.97], 1.15);
  Plant(g, m, [0.14, 0.23, 2.11], 0.85);
  box(g, 0.4, 0.35, 0.38, m.paper, [0.63, 0.4, 2.08]);
  box(g, 0.42, 0.025, 0.4, m.wood, [0.63, 0.585, 2.08]);
  box(g, 0.045, 0.36, 0.382, m.trim, [0.63, 0.4, 2.08], false);
  // Twin-hole recycling station, next to the vending machines.
  const bin = group(g, [2.92, 0.23, 1.62], Math.PI / 2, "Recycling station");
  box(bin, 0.49, 0.75, 0.45, m.trim, [0, 0.375, 0]);
  const lid = box(bin, 0.54, 0.14, 0.49, m.blue, [0, 0.82, 0]);
  lid.rotation.x = 0.12;
  for (const x of [-0.13, 0.13]) {
    const hole = cyl(bin, 0.08, 0.08, 0.012, m.ink, [x, 0.856, 0.1], 20);
    hole.rotation.x = 0.12;
  }
  sign(bin, atlas, "citrus", 0.35, 0.45, [0, 0.39, 0.233], 0);
  Cone(g, m, [-2.9, 0.02, 3.4]);
  Cone(g, m, [2.79, 0.02, 3.4]);
  // Red pedestrian rails have posts, feet and a middle bar.
  for (const [x, z, w] of [
    [-2.5, 2.97, 0.98],
    [1.65, 2.97, 0.93],
  ]) {
    for (const sx of [-w / 2, w / 2]) {
      rod(g, [x + sx, 0.23, z], [x + sx, 0.99, z], 0.025, m.red);
      cyl(g, 0.072, 0.072, 0.04, m.ink, [x + sx, 0.25, z]);
    }
    rod(g, [x - w / 2, 0.99, z], [x + w / 2, 0.99, z], 0.027, m.red);
    rod(g, [x - w / 2, 0.59, z], [x + w / 2, 0.59, z], 0.018, m.trim);
  }
  // Utility pole: service cabinet, ceramic insulators, crossarms and bundled sagging wires.
  const pole = group(g, [3.06, 0.23, -2.45], 0, "Utility pole");
  cyl(pole, 0.095, 0.14, 9.2, m.concrete, [0, 4.6, 0], 16);
  cyl(pole, 0.15, 0.15, 1.25, m.ink, [0, 0.63, 0], 16);
  for (let y = 0.25; y < 1.2; y += 0.28)
    cyl(pole, 0.154, 0.154, 0.13, m.yellow, [0, y, 0], 16);
  box(pole, 0.32, 0.58, 0.24, m.steel, [0.15, 3.5, 0.05]);
  for (let y = 1.7; y < 8.8; y += 0.47) {
    rod(pole, [-0.1, y, 0], [-0.24, y, 0], 0.018, m.steel);
    rod(pole, [0.1, y + 0.23, 0], [0.24, y + 0.23, 0], 0.018, m.steel);
  }
  for (const y of [8.45, 9.02]) {
    rod(pole, [-0.6, y, 0], [0.65, y, 0], 0.035, m.steel);
    for (const x of [-0.51, -0.18, 0.18, 0.51]) {
      cyl(pole, 0.055, 0.055, 0.12, m.trim, [x, y + 0.11, 0], 8);
      rod(pole, [x, y + 0.15, 0], [x, y + 0.28, 0], 0.012, m.ink);
    }
  }
  sign(pole, atlas, "electric", 0.33, 1.13, [0, 5.75, 0.16], 0, m.steel);
  sign(pole, atlas, "upperSign", 0.35, 1.2, [0.2, 4.3, 0.16], 0, m.steel);
  for (let i = 0; i < 5; i++) {
    const z = -2.45 + (i - 2) * 0.16;
    const start = [3.06, 9.35 + i * 0.045, z];
    const mid = [0, 8.85 + i * 0.045, z - 0.24];
    const end = [-3.3, 9.55 + i * 0.045, z - 0.4];
    tube(g, [start, mid, end], i === 0 ? 0.019 : 0.01, m.ink);
  }
  // The far cable ends terminate on a second service pole, rather than floating in space.
  cyl(g, 0.06, 0.09, 9.2, m.steel, [-3.3, 4.83, -2.85], 12);
  rod(g, [-3.3, 9.43, -3.25], [-3.3, 9.43, -2.45], 0.028, m.steel);
  for (let i = 0; i < 5; i++) {
    cyl(
      g,
      0.035,
      0.035,
      0.14,
      m.trim,
      [-3.3, 9.5 + i * 0.045, -2.85 + (i - 2) * 0.16],
      8,
    );
  }
  tube(
    g,
    [
      [3.06, 7.1, -2.45],
      [1.3, 6.5, -2.25],
      [-1.9, 7.55, -1.93],
    ],
    0.012,
    m.ink,
  );
  const traffic = group(g, [-3.05, 0.23, -0.3]);
  rod(traffic, [0, 0, 0], [0, 2.75, 0], 0.025, m.steel);
  const plate = cyl(traffic, 0.25, 0.25, 0.04, m.trim, [0, 2.58, 0], 32);
  plate.rotation.x = Math.PI / 2;
  atlas.attach(traffic, "noParking", 0.45, 0.45, [0, 2.58, 0.026]);
  return g;
}

export function ShopAccents(parent, m, atlas) {
  const g = group(parent, [0, 0.23, 0], 0, "Small shop fittings");
  // A wall-mounted extinguisher with hose and an enamel safety plate.
  cyl(g, 0.075, 0.075, 0.42, m.red, [-1.94, 0.57, 2.07], 12);
  box(g, 0.11, 0.05, 0.11, m.ink, [-1.94, 0.8, 2.07]);
  tube(
    g,
    [
      [-1.89, 0.8, 2.07],
      [-1.78, 0.72, 2.07],
      [-1.8, 0.46, 2.07],
    ],
    0.012,
    m.ink,
  );
  box(g, 0.095, 0.13, 0.01, m.paper, [-1.94, 0.6, 2.146]);
  // Vent grille, switch boxes and exposed conduits beside the front entry.
  box(g, 0.19, 0.26, 0.13, m.steel, [1.99, 1.12, 2.05]);
  box(g, 0.1, 0.14, 0.025, m.trim, [1.99, 1.12, 2.128]);
  tube(
    g,
    [
      [1.99, 1, 2.05],
      [1.99, 0.5, 2.05],
      [1.85, 0.4, 2.05],
    ],
    0.014,
    m.steel,
  );
  const poster = sign(
    g,
    atlas,
    "posterBlue",
    0.26,
    0.56,
    [2.45, 1.1, 1.5],
    Math.PI / 2,
    m.trim,
  );
  // Shop security light and small articulated camera on the side wall.
  rod(g, [2.35, 3.44, 1.6], [2.67, 3.5, 1.6], 0.018, m.steel);
  const camera = box(g, 0.24, 0.11, 0.12, m.trim, [2.67, 3.5, 1.6]);
  camera.rotation.z = -0.2;
  box(g, 0.01, 0.07, 0.08, m.dark, [2.797, 3.48, 1.6]);
  // Two small utility labels and a high projecting neighbourhood sign.
  sign(
    g,
    atlas,
    "upperSign",
    0.37,
    1.4,
    [2.48, 6.0, -1.73],
    Math.PI / 2,
    m.steel,
  );
  return g;
}
