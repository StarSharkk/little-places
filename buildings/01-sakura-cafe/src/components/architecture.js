import * as THREE from "three";
import {
  box,
  arch,
  group,
  extrude,
  rod,
  cylinder,
  label,
} from "./primitives.js";
export function Roof(parent, m, c) {
  const { width: w, depth: d, height: h, roofRise: r } = c;
  const g = group(parent);
  g.name = "Roof";
  const shape = new THREE.Shape();
  shape.moveTo(-d / 2 - 0.32, 0);
  shape.lineTo(0, r);
  shape.lineTo(d / 2 + 0.32, 0);
  shape.lineTo(d / 2 + 0.32, -0.18);
  shape.lineTo(0, r - 0.2);
  shape.lineTo(-d / 2 - 0.32, -0.18);
  shape.closePath();
  const roof = extrude(g, shape, w + 0.55, m.roof);
  roof.rotation.y = Math.PI / 2;
  roof.position.set(-w / 2 - 0.275, h + 0.35, 0);
  for (const z of [-d / 2 - 0.26, d / 2 + 0.26]) {
    box(g, w + 0.72, 0.16, 0.22, m.trim, [0, h + 0.28, z]);
    box(g, w + 0.4, 0.14, 0.26, m.trim, [0, h + 0.08, z * 0.95]);
  }
  rod(
    g,
    [-w / 2 - 0.34, h + r + 0.37, 0],
    [w / 2 + 0.34, h + r + 0.37, 0],
    0.075,
    m.trim,
  );
  // Solid triangular gables underneath the overhanging roof.
  const triangle = new THREE.Shape();
  triangle.moveTo(-d / 2, 0);
  triangle.lineTo(d / 2, 0);
  triangle.lineTo(0, r - 0.15);
  triangle.closePath();
  for (const x of [-w / 2, w / 2 - 0.12]) {
    const panel = extrude(g, triangle, 0.12, m.wall);
    panel.rotation.y = Math.PI / 2;
    panel.position.set(x, h + 0.3, 0);
  }
  return g;
}
export function Window(
  parent,
  m,
  {
    x = 0,
    y = 0,
    z = 0,
    w = 1.25,
    h = 1.72,
    rotation = 0,
    shutters = false,
  } = {},
) {
  const g = group(parent, [x, y, z], rotation);
  g.name = "Window";
  arch(g, w + 0.21, h + 0.16, 0.11, m.trim, [0, -0.06, 0]);
  arch(g, w, h, 0.13, m.ink, [0, 0, 0.05]);
  arch(g, w - 0.12, h - 0.13, 0.05, m.glass, [0, 0.06, 0.19]);
  box(g, 0.055, h - 0.16, 0.07, m.trim, [0, h / 2, 0.26]);
  box(g, w - 0.12, 0.055, 0.07, m.trim, [0, h - w / 2 - 0.03, 0.26]);
  box(g, w - 0.1, 0.055, 0.07, m.trim, [0, 0.5, 0.26]);
  box(g, w + 0.32, 0.13, 0.36, m.trim, [0, 0, 0.17]);
  box(g, w + 0.15, 0.08, 0.22, m.trim, [0, -0.12, 0.1]);
  // Angled cream reflection strips sit inside the glazing.
  const shine = box(g, 0.045, h * 0.47, 0.012, m.reflection, [
    -w * 0.26,
    h * 0.49,
    0.255,
  ]);
  shine.rotation.z = -0.23;
  if (shutters)
    for (const side of [-1, 1]) {
      box(g, 0.29, h - 0.1, 0.09, m.door, [side * (w / 2 + 0.27), h / 2, 0.05]);
      for (let i = 0; i < 7; i++)
        box(g, 0.23, 0.025, 0.03, m.trim, [
          side * (w / 2 + 0.27),
          0.18 + i * 0.18,
          0.11,
        ]);
    }
  return g;
}
export function Door(parent, m, c) {
  const g = group(parent, [c.doorX, 0.3, c.depth / 2 + 0.03]);
  g.name = "Door surround";
  arch(g, 1.52, 2.55, 0.18, m.trim, [0, 0, 0]);
  arch(g, 1.28, 2.38, 0.2, m.ink, [0, 0.03, 0.04]);
  arch(g, 1.12, 2.26, 0.03, m.glass, [0, 0.08, 0.25]);
  box(g, 1.18, 0.09, 0.12, m.trim, [0, 1.87, 0.3]);
  for (const x of [-0.35, 0, 0.35])
    rod(
      g,
      [x, 1.92, 0.31],
      [x, 2.15 + (0.35 - Math.abs(x)) * 0.4, 0.31],
      0.018,
      m.trim,
    );
  const hinge = group(g, [-0.56, 0.08, 0.28]);
  hinge.name = "Door hinge";
  const leaf = group(hinge, [0.56, 0, 0]);
  box(leaf, 1.12, 1.76, 0.1, m.door, [0, 0.88, 0]);
  box(leaf, 0.9, 1.1, 0.035, m.ink, [0, 1.08, 0.063]);
  const glass = box(leaf, 0.79, 0.99, 0.025, m.doorGlass, [0, 1.08, 0.09]);
  box(leaf, 0.84, 0.36, 0.035, m.trim, [0, 0.25, 0.07]);
  box(leaf, 0.7, 0.25, 0.025, m.door, [0, 0.25, 0.095]);
  box(leaf, 0.04, 1.02, 0.035, m.trim, [0, 1.08, 0.12]);
  rod(leaf, [0.36, 0.8, 0.16], [0.36, 1.03, 0.16], 0.027, m.gold);
  box(leaf, 0.1, 0.3, 0.025, m.gold, [0.36, 0.91, 0.085]);
  label(leaf, "OPEN", 0.46, 0.16, [0, 1.21, 0.14], "#252525", "#F7F3E9", 160);
  leaf.userData.action = "door";
  return { hinge, leaf };
}
export function Awning(
  parent,
  m,
  { x = 0, z = 2.3, y = 2.65, w = 1.9, rotation = 0 } = {},
) {
  const g = group(parent, [x, y, z], rotation);
  g.name = "Awning";
  const count = 9,
    sw = w / count;
  for (let i = 0; i < count; i++) {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0.3);
    shape.quadraticCurveTo(0.43, 0.27, 0.77, -0.1);
    shape.lineTo(0.77, -0.18);
    shape.quadraticCurveTo(0.4, 0.18, 0, 0.21);
    shape.closePath();
    const stripe = extrude(g, shape, sw, i % 2 ? m.trim : m.accent);
    stripe.rotation.y = -Math.PI / 2;
    stripe.position.set(-w / 2 + (i + 1) * sw, 0, 0);
    const flap = arch(
      group(g),
      sw,
      0.23,
      0.035,
      i % 2 ? m.trim : m.accent,
      [0, 0, 0],
    );
    flap.rotation.z = Math.PI;
    flap.position.set(-w / 2 + (i + 0.5) * sw, -0.12, 0.79);
  }
  for (const side of [-1, 1])
    rod(
      g,
      [(side * w) / 2, -0.5, 0.03],
      [(side * w) / 2, -0.12, 0.77],
      0.025,
      m.ink,
    );
  return g;
}
export function Sign(parent, m, c) {
  const g = group(parent, [0, 3.16, c.depth / 2 + 0.18]);
  g.name = "Sakura sign";
  box(g, 4.96, 0.54, 0.16, m.ink);
  box(g, 4.81, 0.42, 0.06, m.trim, [0, 0, 0.1]);
  label(
    g,
    "S A K U R A  C A F É",
    4.5,
    0.35,
    [0, 0.015, 0.139],
    "#252525",
    null,
    69,
  );
  g.userData.action = "menu";
  return g;
}
