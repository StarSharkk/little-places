import * as THREE from "three";
import {
  box,
  cylinder,
  ball,
  rod,
  label,
  group,
  arch,
  extrude,
  part,
} from "./primitives.js";
import { Window } from "./architecture.js";
export function FlowerPot(p, m, pos, scale = 1, flowers = false) {
  const g = group(p, pos);
  g.scale.setScalar(scale);
  cylinder(g, 0.21, 0.15, 0.38, m.accent, [0, 0.19, 0]);
  cylinder(g, 0.24, 0.24, 0.07, m.trim, [0, 0.38, 0]);
  cylinder(g, 0.19, 0.19, 0.025, m.soil, [0, 0.415, 0]);
  for (let i = 0; i < 5; i++) {
    const angle = i * 2.4;
    const x = Math.cos(angle) * 0.14,
      z = Math.sin(angle) * 0.14,
      y = 0.61 + Math.sin(i * 2) * 0.07;
    rod(g, [0, 0.4, 0], [x, y, z], 0.014, m.leaf);
    const leaf = ball(g, 0.11, m.leaf, [x, y - 0.04, z]);
    leaf.scale.set(0.7, 1.5, 0.7);
    if (flowers) {
      for (let j = 0; j < 5; j++) {
        const a = j * Math.PI * 0.4;
        ball(g, 0.047, m.flower, [
          x + Math.cos(a) * 0.06,
          y + 0.1 + Math.sin(a) * 0.06,
          z,
        ]);
      }
      ball(g, 0.025, m.gold, [x, y + 0.1, z + 0.035]);
    }
  }
  return g;
}
export function FlowerBox(p, m, pos, width = 1.25, rotation = 0) {
  const g = group(p, pos, rotation);
  box(g, width, 0.23, 0.29, m.door, [0, 0, 0]);
  box(g, width + 0.06, 0.055, 0.34, m.trim, [0, 0.13, 0]);
  for (const x of [-width * 0.32, width * 0.32]) {
    rod(g, [x, -0.14, -0.11], [x, -0.33, -0.11], 0.018, m.ink);
    rod(g, [x, -0.33, -0.11], [x, -0.14, 0.15], 0.018, m.ink);
  }
  for (let i = 0; i < 5; i++) {
    const x = ((i - 2) * width) / 6;
    ball(g, 0.14, m.leaf, [x, 0.22, 0.02]);
    ball(g, 0.085, i % 2 ? m.flower : m.accent, [x + 0.03, 0.34, 0.02]);
    ball(g, 0.027, m.gold, [x + 0.03, 0.36, 0.09]);
  }
  return g;
}
export function Lamp(p, m, pos, rotation = 0) {
  const g = group(p, pos, rotation);
  box(g, 0.13, 0.3, 0.08, m.ink, [0, 0, 0]);
  rod(g, [0, 0, 0.04], [0, 0.14, 0.35], 0.025, m.ink);
  box(g, 0.21, 0.33, 0.2, m.gold, [0, 0.15, 0.35]);
  box(g, 0.26, 0.05, 0.25, m.ink, [0, -0.04, 0.35]);
  cylinder(g, 0.015, 0.2, 0.16, m.ink, [0, 0.4, 0.35], 4);
  for (const x of [-0.105, 0.105])
    for (const z of [0.25, 0.45])
      rod(g, [x, -0.03, z], [x, 0.31, z], 0.014, m.ink);
  ball(g, 0.035, m.gold, [0, 0.5, 0.35]);
  return g;
}
export function Cup(p, m, pos, scale = 1) {
  const g = group(p, pos);
  g.scale.setScalar(scale);
  cylinder(g, 0.11, 0.11, 0.023, m.trim, [0, 0.012, 0]);
  cylinder(g, 0.072, 0.052, 0.12, m.trim, [0, 0.08, 0]);
  cylinder(g, 0.059, 0.059, 0.008, m.soil, [0, 0.143, 0]);
  const handle = part(
    g,
    new THREE.TorusGeometry(0.043, 0.012, 5, 12),
    m.trim,
    [0.083, 0.085, 0],
  );
  handle.rotation.y = 0;
  return g;
}
export function Table(p, m, pos) {
  const g = group(p, pos);
  cylinder(g, 0.5, 0.5, 0.065, m.trim, [0, 0.76, 0], 32);
  cylinder(g, 0.045, 0.065, 0.7, m.ink, [0, 0.37, 0], 10);
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3;
    rod(
      g,
      [0, 0.16, 0],
      [Math.cos(a) * 0.3, 0.04, Math.sin(a) * 0.3],
      0.025,
      m.ink,
    );
  }
  cylinder(g, 0.21, 0.21, 0.018, m.gold, [0.12, 0.807, 0.04], 24);
  Cup(g, m, [0.12, 0.817, 0.04]);
  Cup(g, m, [-0.17, 0.8, -0.19], 0.8);
  const plate = cylinder(g, 0.13, 0.13, 0.02, m.trim, [-0.19, 0.81, 0.19]);
  const pastry = part(
    g,
    new THREE.TorusGeometry(0.075, 0.036, 5, 10, Math.PI * 1.5),
    m.wall,
    [-0.19, 0.85, 0.19],
  );
  pastry.rotation.x = -Math.PI / 2;
  return g;
}
export function Chair(p, m, pos, rotation = 0) {
  const g = group(p, pos, rotation);
  cylinder(g, 0.22, 0.23, 0.055, m.door, [0, 0.44, 0], 20);
  for (const x of [-0.15, 0.15])
    for (const z of [-0.13, 0.13])
      rod(g, [x, 0.43, z], [x * 1.35, 0.02, z * 1.35], 0.019, m.ink);
  for (const x of [-0.18, 0.18])
    rod(g, [x, 0.42, -0.13], [x, 0.95, -0.13], 0.02, m.ink);
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.18, 0.69, -0.13),
    new THREE.Vector3(-0.18, 0.94, -0.13),
    new THREE.Vector3(0, 1.04, -0.17),
    new THREE.Vector3(0.18, 0.94, -0.13),
    new THREE.Vector3(0.18, 0.69, -0.13),
  ]);
  part(g, new THREE.TubeGeometry(curve, 20, 0.025, 6, false), m.ink);
  box(g, 0.31, 0.13, 0.045, m.door, [0, 0.85, -0.14]);
  return g;
}
export function Blackboard(p, m, pos) {
  const g = group(p, pos, -0.13);
  for (const z of [-0.2, 0.2]) {
    const panel = group(g, [0, 0.08, z]);
    panel.rotation.x = z > 0 ? -0.16 : 0.16;
    box(panel, 0.64, 0.98, 0.065, m.roof, [0, 0.49, 0]);
    if (z > 0) {
      box(panel, 0.53, 0.82, 0.02, m.ink, [0, 0.5, 0.045]);
      label(panel, "TODAY", 0.47, 0.16, [0, 0.79, 0.061], "#F7F3E9", null, 150);
      label(
        panel,
        "COFFEE",
        0.43,
        0.12,
        [0, 0.59, 0.063],
        "#F7F3E9",
        null,
        135,
      );
      label(
        panel,
        "& CROISSANTS",
        0.45,
        0.1,
        [0, 0.44, 0.063],
        "#F7F3E9",
        null,
        98,
      );
      label(
        panel,
        "made with love",
        0.43,
        0.1,
        [0, 0.24, 0.063],
        "#F6C445",
        null,
        105,
      );
    }
  }
  rod(g, [-0.34, 0.45, -0.25], [-0.34, 0.45, 0.25], 0.013, m.ink);
  return g;
}
function Tree(p, m, pos) {
  const g = group(p, pos);
  g.name = "Potted Sakura";
  cylinder(g, 0.5, 0.36, 0.66, m.trim, [0, 0.33, 0], 12);
  cylinder(g, 0.53, 0.53, 0.1, m.accent, [0, 0.67, 0], 12);
  cylinder(g, 0.46, 0.46, 0.03, m.soil, [0, 0.73, 0]);
  rod(g, [0, 0.7, 0], [0.02, 2.7, 0], 0.065, m.roof);
  const tips = [
    [-0.62, 2.6, 0.03],
    [0.46, 3.02, 0.1],
    [0.18, 2.71, 0.51],
    [-0.19, 3.3, -0.19],
    [0.6, 2.61, -0.36],
  ];
  for (const t of tips) {
    rod(g, [0.02, 1.6, 0], t, 0.035, m.roof);
    for (let j = 0; j < 5; j++) {
      const a = j * 2.4;
      const b = ball(g, 0.31 + (j % 2) * 0.07, m.flower, [
        t[0] + Math.cos(a) * 0.24,
        t[1] + Math.sin(j * 2) * 0.21,
        t[2] + Math.sin(a) * 0.24,
      ]);
      b.scale.y = 0.85;
    }
    ball(g, 0.22, m.trim, [t[0] - 0.1, t[1] + 0.18, t[2] + 0.13]);
  }
  return g;
}
export function addDecorations(root, m, c) {
  const { width: w, depth: d, height: h, roofRise: r } = c;
  const g = group(root);
  g.name = "Architectural details and street furniture";
  // Foundation: the pavement is a compact street corner, with an open forecourt.
  box(g, w + 2.15, 0.15, d + 3.45, m.paving, [0.28, -0.065, 0.75]);
  box(g, w + 2.25, 0.1, d + 3.55, m.trim, [0.28, -0.13, 0.75]);
  for (let x = -3.5; x <= 4; x += 0.57) {
    box(g, 0.52, 0.1, 0.27, m.trim, [x, -0.015, 4.43]);
    box(g, 0.52, 0.1, 0.27, m.trim, [x, -0.015, -2.94]);
  }
  for (let z = -2.65; z < 4.4; z += 0.55) {
    box(g, 0.25, 0.1, 0.5, m.trim, [4.3, -0.015, z]);
    box(g, 0.25, 0.1, 0.5, m.trim, [-3.74, -0.015, z]);
  }
  // Restrained expansion joints, not a dense checkerboard.
  for (let z = -2.7; z < 4.3; z += 0.9)
    rod(g, [-3.6, 0.018, z], [4.15, 0.018, z], 0.004, m.soil);
  for (let x = -3.4; x < 4.1; x += 1.3)
    rod(g, [x, 0.018, -2.7], [x, 0.018, 4.3], 0.004, m.soil);
  // Roof seams follow the actual pitched plane, spaced like standing-seam roofing.
  for (let x = -w / 2 + 0.18; x < w / 2; x += 0.48)
    for (const sign of [-1, 1])
      rod(
        g,
        [x, h + r + 0.365, 0],
        [x, h + 0.365, sign * (d / 2 + 0.32)],
        0.009,
        m.roofLine,
      ).userData.outline = false;
  // Front dormer, with a true extruded gable, roof and inset glazing.
  const dormer = group(g, [-1.18, h + 0.77, 1.05]);
  box(dormer, 1.26, 0.78, 0.9, m.trim, [0, 0.3, 0]);
  const tri = new THREE.Shape();
  tri.moveTo(-0.69, 0);
  tri.lineTo(0.69, 0);
  tri.lineTo(0, 0.54);
  tri.closePath();
  extrude(dormer, tri, 1.04, m.wall, [0, 0.69, -0.5]);
  for (const side of [-1, 1]) {
    const panel = box(dormer, 0.89, 0.11, 1.18, m.roof, [
      side * 0.35,
      0.96,
      0.03,
    ]);
    panel.rotation.z = -side * 0.66;
    rod(dormer, [side * 0.74, 0.71, 0.63], [0, 1.27, 0.63], 0.04, m.trim);
  }
  Window(dormer, m, { y: 0.04, z: 0.49, w: 0.67, h: 0.86 });
  // Chimney and its cream cap.
  box(g, 0.58, 1.45, 0.57, m.accent, [1.9, h + r + 0.16, -0.75]);
  box(g, 0.73, 0.12, 0.72, m.trim, [1.9, h + r + 0.91, -0.75]);
  box(g, 0.48, 0.015, 0.46, m.ink, [1.9, h + r + 0.98, -0.75]);
  for (let i = 0; i < 6; i++) {
    box(g, 0.59, 0.025, 0.58, m.trim, [1.9, h + r - 0.42 + i * 0.21, -0.75]);
  }
  // Small finials, brackets, gutters and a working-looking rainwater pipe.
  for (const x of [-w / 2 - 0.2, w / 2 + 0.2]) {
    rod(g, [x, h + r + 0.4, 0], [x, h + r + 0.65, 0], 0.025, m.ink);
    ball(g, 0.055, m.gold, [x, h + r + 0.67, 0]);
  }
  for (let x = -2.65; x < 3; x += 0.65)
    for (const z of [-d / 2 - 0.13, d / 2 + 0.13]) {
      box(g, 0.13, 0.23, 0.2, m.trim, [x, h - 0.13, z]);
      rod(
        g,
        [x, h - 0.35, z - 0.05 * Math.sign(z)],
        [x, h - 0.08, z + 0.2 * Math.sign(z)],
        0.035,
        m.trim,
      );
    }
  rod(
    g,
    [w / 2 + 0.13, 0.12, -d / 2 + 0.18],
    [w / 2 + 0.13, h - 0.1, -d / 2 + 0.18],
    0.055,
    m.roof,
  );
  for (const y of [0.4, 1.6, 2.8, 4.1])
    box(g, 0.15, 0.06, 0.2, m.ink, [w / 2 + 0.13, y, -d / 2 + 0.18]);
  // Round hanging sign: perpendicular to the shopfront and visible from the side.
  const sign = group(g, [w / 2 - 0.15, 3.33, d / 2 + 0.18]);
  rod(sign, [0, 0.5, 0], [0, 0.5, 0.93], 0.03, m.ink);
  rod(sign, [0, 0.49, 0.08], [0, 0.75, 0], 0.025, m.ink);
  for (const z of [0.37, 0.77])
    rod(sign, [0, 0.5, z], [0, 0.3, z], 0.014, m.ink);
  const disk = cylinder(sign, 0.35, 0.35, 0.09, m.trim, [0, -0.04, 0.57], 32);
  disk.rotation.z = Math.PI / 2;
  const ring = part(
    sign,
    new THREE.TorusGeometry(0.31, 0.012, 5, 40),
    m.roof,
    [0.053, -0.04, 0.57],
  );
  ring.rotation.y = Math.PI / 2;
  const text = label(
    sign,
    "S",
    0.36,
    0.4,
    [0.06, -0.04, 0.57],
    "#A65F48",
    null,
    650,
  );
  text.rotation.y = Math.PI / 2;
  for (const x of [-0.95, 0.95]) Lamp(g, m, [x, 2.15, d / 2 + 0.2]);
  label(
    g,
    "Nº 18",
    0.33,
    0.18,
    [0.94, 1.63, d / 2 + 0.255],
    "#252525",
    "#F7F3E9",
    165,
  );
  // Side-wall medallion and address plaque.
  const medallion = cylinder(
    g,
    0.32,
    0.32,
    0.06,
    m.trim,
    [w / 2 + 0.1, h + 0.65, 0],
    40,
  );
  medallion.rotation.z = Math.PI / 2;
  const floral = label(
    g,
    "✳",
    0.45,
    0.45,
    [w / 2 + 0.14, h + 0.65, 0],
    "#A65F48",
    null,
    700,
  );
  floral.rotation.y = Math.PI / 2;
  const plaque = group(g, [w / 2 + 0.16, 3.1, 0], Math.PI / 2);
  box(plaque, 1.6, 0.26, 0.06, m.door);
  label(
    plaque,
    "RUE DES FLEURS",
    1.43,
    0.19,
    [0, 0, 0.04],
    "#252525",
    null,
    91,
  );
  // Flower boxes and small wrought-iron balcony guards.
  for (const x of c.upperWindows) {
    FlowerBox(g, m, [x, 3.62, d / 2 + 0.34], 1.17);
    for (const sx of [-0.65, 0.65])
      rod(
        g,
        [x + sx, 3.68, d / 2 + 0.42],
        [x + sx, 4.06, d / 2 + 0.42],
        0.015,
        m.ink,
      );
    rod(
      g,
      [x - 0.65, 4.06, d / 2 + 0.42],
      [x + 0.65, 4.06, d / 2 + 0.42],
      0.018,
      m.ink,
    );
  }
  for (const z of [-1, 1])
    FlowerBox(g, m, [w / 2 + 0.34, 3.62, z], 1.1, Math.PI / 2);
  if (c.decorationDensity > 0) {
    Blackboard(g, m, [-1, 0, 3.17]);
    Table(g, m, [2.27, 0, 3.3]);
    Chair(g, m, [3.03, 0, 3.4], -Math.PI / 2);
    Chair(g, m, [1.75, 0, 4.03], Math.PI * 0.8);
    FlowerPot(g, m, [-0.9, 0.03, 2.5], 0.8, true);
    FlowerPot(g, m, [0.98, 0.03, 2.46], 0.8, true);
    Tree(g, m, [3.69, 0, -1.35]);
    FlowerPot(g, m, [-3.25, 0, 2.4], 1.35, true);
    // A second, smaller bistro spot on the quieter side of the building.
    if (c.decorationDensity > 0.6) {
      Table(g, m, [3.7, 0, 1.35]);
      Chair(g, m, [3.65, 0, 0.52], 0);
    }
  }
  // Interior counter, pastry display and shelves visible through the open doorway.
  box(g, 2.1, 0.87, 0.5, m.door, [-0.6, 0.77, -0.6]);
  box(g, 2.25, 0.08, 0.66, m.trim, [-0.6, 1.24, -0.6]);
  for (let i = 0; i < 3; i++) Cup(g, m, [-1.2 + i * 0.4, 1.29, -0.55]);
  for (const y of [1.65, 2.15]) {
    box(g, 1.7, 0.08, 0.28, m.trim, [-1, y, -1.75]);
    for (let i = 0; i < 4; i++)
      cylinder(g, 0.07, 0.07, 0.2, i % 2 ? m.accent : m.door, [
        -1.6 + i * 0.36,
        y + 0.14,
        -1.75,
      ]);
  }
  // An espalier is anchored to the left corner, keeping the entry clear.
  rod(g, [-3.07, 0.3, 1.63], [-3.1, 2.6, 1.65], 0.025, m.roof);
  for (let i = 0; i < 9; i++) {
    const y = 0.7 + i * 0.2;
    const x = -3.08 - Math.sin(i * 2.3) * 0.13;
    ball(g, 0.12, m.leaf, [x, y, 1.65]);
    if (i % 3 === 0) ball(g, 0.065, m.flower, [x - 0.05, y + 0.05, 1.73]);
  }
  return g;
}
