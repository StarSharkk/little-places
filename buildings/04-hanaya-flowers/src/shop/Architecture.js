import * as THREE from 'three';
import { group, box, plate, rod, tube, sphere, ring, cylinder, mesh, cached, archPath, rectPath, discPath, extrudeShape, wallWithHoles } from './primitives.js';
import { planterBox, MIXES } from './Flowers.js';

export const FLOOR = 0.27;       // top of the interior floor
export const WALL_Y = 0.26;      // base of all wall slabs
export const WALL_H = 2.92;      // wall height (top at 3.18)
const T = 0.2;                   // wall thickness

// ---- an arched window in any wall's local frame (outer face at z = +T/2) ---------------------------
export function ArchWindow(parent, m, { cx, w, y0, yTop, box: withBox = true, muntins = true }) {
  const rise = w / 2, z = T / 2;
  const g = group(parent, 'Arched window');
  const outer = archPath(THREE.Shape, cx, w + 0.22, y0 - 0.04, yTop + 0.11, rise + 0.11);
  outer.holes.push(archPath(THREE.Path, cx, w, y0, yTop, rise));
  extrudeShape(g, outer, 0.06, m.trim, [0, WALL_Y, z + 0.015]);
  // keystone
  box(g, 0.14, 0.2, 0.1, m.cream, [cx, WALL_Y + yTop + 0.11, z + 0.03]);
  // glass with a soft interior wash
  const glassShape = archPath(THREE.Shape, cx, w, y0, yTop, rise);
  extrudeShape(g, glassShape, 0.012, m.glass, [0, WALL_Y, -0.02], false);
  if (muntins) {
    box(g, 0.04, yTop - rise - y0, 0.05, m.cream, [cx, WALL_Y + y0 + (yTop - rise - y0) / 2, 0.0], false);
    box(g, w, 0.04, 0.05, m.cream, [cx, WALL_Y + y0 + (yTop - rise - y0) * 0.55, 0.0], false);
    box(g, w, 0.04, 0.05, m.cream, [cx, WALL_Y + yTop - rise, 0.0], false);
    box(g, 0.04, rise, 0.05, m.cream, [cx, WALL_Y + yTop - rise / 2, 0.0], false);
    const s = box(g, 0.025, 0.55, 0.012, m.reflection, [cx - w * 0.22, WALL_Y + y0 + 0.5, 0.012], false); s.rotation.z = -0.2;
  }
  // sill
  box(g, w + 0.34, 0.07, 0.26, m.cream, [cx, WALL_Y + y0 - 0.075, z + 0.09]);
  if (withBox) planterBox(g, m, [cx, WALL_Y + y0 - 0.045, z + 0.09], w + 0.06, 'pastel');
  return g;
}

// ---- side and rear walls (all removable in see-through mode) ------------------------------------------
export function Shell(root, m, atlas) {
  const g = group(root, 'Removable upper walls');
  const wall = (name, w, pos, ry, windows) => {
    const holes = windows.map(({ cx, wd, y0, yTop }) => archPath(THREE.Path, cx, wd, y0, yTop, wd / 2));
    const slab = group(g, name, pos); slab.rotation.y = ry;
    wallWithHoles(slab, w, WALL_H, T, holes, m.wall, [0, WALL_Y, 0]);
    for (const { cx, wd, y0, yTop } of windows) ArchWindow(slab, m, { cx, w: wd, y0, yTop });
    // skirting + corner strips so the long plain walls still read as built, not extruded
    box(slab, w, 0.15, 0.06, m.cream, [0, WALL_Y + 0.075, T / 2 + 0.03]);
    box(slab, w - 0.2, 0.05, 0.05, m.cream, [0, WALL_Y + 0.17, T / 2 + 0.025], false);
    for (const sx of [-1, 1]) box(slab, 0.09, WALL_H - 0.2, 0.05, m.cream, [sx * (w / 2 - 0.06), WALL_Y + WALL_H / 2, T / 2 + 0.025]);
    return slab;
  };
  // right wall (two tall arched windows), rotated so local +z faces +x. Local +x runs towards -z.
  wall('Right wall', 3.4, [2.8, 0, 0], Math.PI / 2, [{ cx: -0.85, wd: 0.9, y0: 0.78, yTop: 2.3 }, { cx: 0.62, wd: 0.9, y0: 0.78, yTop: 2.3 }]);
  wall('Back wall', 5.8, [0, 0, -1.7], Math.PI, [{ cx: -1.4, wd: 0.95, y0: 0.78, yTop: 2.3 }, { cx: 1.4, wd: 0.95, y0: 0.78, yTop: 2.3 }]);
  wall('Left wall', 3.4, [-2.8, 0, 0], -Math.PI / 2, [{ cx: 0.2, wd: 0.95, y0: 0.78, yTop: 2.3 }]);
  // side plaque on the right wall (part of the removable shell)
  const plaque = group(g, 'Side plaque', [2.915, 3.0, 0.35]); plaque.rotation.y = Math.PI / 2;
  plate(plaque, 2.1, 0.34, 0.05, 0.05, m.cream); atlas.attach(plaque, 'side', 2.01, 0.29, [0, 0, 0.03]);
  // cornice band that ties the walls into the roof slab
  box(g, 6.0, 0.1, 0.1, m.cream, [0, 3.13, -1.8]); box(g, 0.1, 0.1, 3.7, m.cream, [-2.9, 3.13, 0]); box(g, 0.1, 0.1, 3.7, m.cream, [2.9, 3.13, 0]);
  return g;
}

// ---- scalloped, striped canopies --------------------------------------------------------------------
// Flat canopy: stripes follow a softly bowed profile and each ends in its own valance.
export function Awning(root, m, { x, width, y, z = 1.82, drop = 0.42, out = 0.74, count }) {
  const g = group(root, 'Striped canopy');
  const n = count ?? Math.round(width / 0.19), sw = width / n;
  const prof = new THREE.Shape();
  prof.moveTo(0, y); prof.bezierCurveTo(out * 0.35, y, out * 0.75, y - drop * 0.5, out, y - drop);
  prof.lineTo(out, y - drop - 0.045); prof.bezierCurveTo(out * 0.75, y - drop * 0.5 - 0.045, out * 0.35, y - 0.045, 0, y - 0.045); prof.closePath();
  for (let i = 0; i < n; i++) {
    const mat = i % 2 ? m.cream : m.accent;
    const geo = new THREE.ExtrudeGeometry(prof, { depth: sw, steps: 1, bevelEnabled: false, curveSegments: 8 });
    const o = mesh(g, geo, mat); o.rotation.y = -Math.PI / 2; o.position.set(x + (i + 1) * sw, 0, z);
    // scalloped valance
    const v = new THREE.Shape(); v.moveTo(0, 0); v.lineTo(sw, 0); v.lineTo(sw, -0.14); v.absarc(sw / 2, -0.14, sw / 2, 0, -Math.PI, true); v.lineTo(0, 0);
    const vg = new THREE.ExtrudeGeometry(v, { depth: 0.035, bevelEnabled: false, curveSegments: 8 });
    mesh(g, vg, mat, [x + i * sw, y - drop - 0.01, z + out - 0.015]);
  }
  for (const sx of [x + 0.08, x + width - 0.08]) rod(g, [sx, y - 0.04, z + 0.02], [sx, y - drop - 0.05, z + out - 0.03], 0.02, m.ink);
  return g;
}

// A half-cone "shell" hood over an arched door: wedges radiate from a point on the wall.
export function ShellHood(root, m, { cx, y, z = 1.82, radius = 0.78, depth = 0.62, drop = 0.3, wedges = 10 }) {
  const g = group(root, 'Shell hood');
  const apex = new THREE.Vector3(cx, y, z);
  const rim = i => { const a = -Math.PI / 2 + (i / wedges) * Math.PI; return new THREE.Vector3(cx + Math.sin(a) * radius, y - drop, z + Math.cos(a) * depth); };
  const tmp = new THREE.Vector3();
  for (let i = 0; i < wedges; i++) {
    const a = rim(i), b = rim(i + 1), t = 0.04;
    const n = tmp.clone().crossVectors(b.clone().sub(a), apex.clone().sub(a)).normalize().multiplyScalar(-t); // faces outward/up
    const tri = [apex, a, b];
    const pos = [];
    const top = tri.map(v => v.clone());
    const bot = tri.map(v => v.clone().addScaledVector(n, -1));
    const quad = (p, q, r, s) => pos.push(...p.toArray(), ...q.toArray(), ...r.toArray(), ...p.toArray(), ...r.toArray(), ...s.toArray());
    pos.push(...top[0].toArray(), ...top[1].toArray(), ...top[2].toArray());
    pos.push(...bot[0].toArray(), ...bot[2].toArray(), ...bot[1].toArray());
    quad(top[0], bot[0], bot[1], top[1]); quad(top[1], bot[1], bot[2], top[2]); quad(top[2], bot[2], bot[0], top[0]);
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.computeVertexNormals();
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(new Array((pos.length / 3) * 2).fill(0), 2));
    // make sure normals point outward from the wedge centre; flip if needed
    const mat = i % 2 ? m.cream : m.accent;
    mesh(g, geo, mat);
    // valance flap along the rim
    const mid = a.clone().add(b).multiplyScalar(0.5), len = a.distanceTo(b);
    const flap = mesh(g, cached(`flap:${len.toFixed(3)}`, () => new THREE.BoxGeometry(len * 1.0, 0.13, 0.03)), mat, [mid.x, mid.y - 0.075, mid.z]);
    flap.rotation.y = Math.atan2(-(b.z - a.z), b.x - a.x) + 0;
    flap.userData.outline = true;
  }
  rod(g, [cx, y - 0.05, z + 0.02], [cx, y - drop - 0.02, z + depth - 0.03], 0.02, m.ink);
  return g;
}

// ---- storefront -------------------------------------------------------------------------------------------
export const DOOR = { cx: -1.95, w: 1.16, y0: 0.03, yTop: 2.2 };
export const WINDOW = { x0: -0.9, x1: 2.3, y0: 0.58, y1: 2.12 };

export function Storefront(root, m, atlas) {
  const g = group(root, 'Storefront', [0, 0, 1.71]);
  const holes = [
    archPath(THREE.Path, DOOR.cx, DOOR.w, DOOR.y0, DOOR.yTop, DOOR.w / 2),
    rectPath(THREE.Path, WINDOW.x0, WINDOW.y0, WINDOW.x1, WINDOW.y1),
  ];
  wallWithHoles(g, 5.8, WALL_H, 0.22, holes, m.wall, [0, WALL_Y, 0]);
  const zf = 0.11;

  // door surround: double moulding
  const { cx, w, y0, yTop } = DOOR;
  const r1 = archPath(THREE.Shape, cx, w + 0.2, y0, yTop + 0.1, w / 2 + 0.1); r1.holes.push(archPath(THREE.Path, cx, w, y0, yTop, w / 2));
  extrudeShape(g, r1, 0.07, m.trim, [0, WALL_Y, zf + 0.02]);
  const r2 = archPath(THREE.Shape, cx, w + 0.44, y0, yTop + 0.22, w / 2 + 0.22); r2.holes.push(archPath(THREE.Path, cx, w + 0.2, y0, yTop + 0.1, w / 2 + 0.1));
  extrudeShape(g, r2, 0.045, m.cream, [0, WALL_Y, zf + 0.0]);
  box(g, 0.17, 0.24, 0.09, m.cream, [cx, WALL_Y + yTop + 0.18, zf + 0.04]);

  // display window frame, mullions, transom, sill and bulkhead panels
  const { x0, x1, y0: wy0, y1: wy1 } = WINDOW, ww = x1 - x0, wcx = (x0 + x1) / 2;
  const frame = rectPath(THREE.Shape, x0 - 0.12, wy0 - 0.12, x1 + 0.12, wy1 + 0.12); frame.holes.push(rectPath(THREE.Path, x0, wy0, x1, wy1));
  extrudeShape(g, frame, 0.07, m.trim, [0, WALL_Y, zf + 0.02]);
  for (const mx of [x0 + ww / 3, x0 + (ww * 2) / 3]) box(g, 0.075, wy1 - wy0, 0.1, m.trim, [mx, WALL_Y + (wy0 + wy1) / 2, 0.02]);
  box(g, ww, 0.07, 0.1, m.trim, [wcx, WALL_Y + wy1 - 0.4, 0.02]);
  box(g, ww + 0.5, 0.09, 0.3, m.cream, [wcx, WALL_Y + wy0 - 0.17, zf + 0.12]);
  for (const bx of [x0 + ww / 6, wcx, x1 - ww / 6]) plate(g, ww / 3 - 0.2, 0.3, 0.02, 0.035, m.cream, [bx, WALL_Y + 0.36, zf + 0.02]);
  // two slanted reflections per bay
  for (const rx of [x0 + 0.35, x0 + ww / 3 + 0.35, x0 + (ww * 2) / 3 + 0.35]) { const s = box(g, 0.025, 0.7, 0.01, m.reflection, [rx, WALL_Y + wy1 - 0.75, 0.04], false); s.rotation.z = -0.2; }
  // piers get a vertical relief strip so the long wall isn't flat
  for (const px of [-2.74, 2.74]) box(g, 0.09, WALL_H - 0.2, 0.05, m.cream, [px, WALL_Y + WALL_H / 2, zf + 0.0]);

  // glazing groups (kept dynamic so see-through can drop them)
  const glass = group(root, 'Window glazing');
  box(glass, ww, wy1 - wy0, 0.012, m.glass, [wcx, WALL_Y + (wy0 + wy1) / 2, 1.71 + 0.03], false);

  // canopies: flat awning over the window, shell hood over the door
  Awning(root, m, { x: x0 - 0.2, width: ww + 0.4, y: 2.72, z: 1.82, drop: 0.46, out: 0.76 });
  ShellHood(root, m, { cx, y: 2.78, z: 1.82, radius: 0.8, depth: 0.66, drop: 0.26 });

  // brand sign above the openings
  plate(root, 5.34, 0.4, 0.1, 0.05, m.cream, [0, 2.965, 1.865]);
  atlas.attach(root, 'brand', 5.14, 0.343, [0, 2.965, 1.916]);

  const door = Door(root, m, atlas);
  return { door, glass };
}

export function Door(root, m, atlas) {
  const { cx, w } = DOOR;
  const hinge = group(root, 'Flower shop door hinge', [cx - w / 2 + 0.03, FLOOR + 0.02, 1.62]);
  const leaf = group(hinge, 'Open the flower shop door'); leaf.userData.action = 'flowerDoor';
  const lw = w - 0.06, lh = DOOR.yTop - DOOR.y0 - 0.04;
  const shape = archPath(THREE.Shape, lw / 2, lw, 0, lh, lw / 2);
  const gw = lw - 0.3, gy0 = 0.95, gtop = lh - 0.16;
  shape.holes.push(archPath(THREE.Path, lw / 2, gw, gy0, gtop, gw / 2));
  extrudeShape(leaf, shape, 0.08, m.trim, [0, 0, 0]);
  // glazing + bars
  extrudeShape(leaf, archPath(THREE.Shape, lw / 2, gw, gy0, gtop, gw / 2), 0.01, m.glass, [0, 0, 0], false);
  box(leaf, 0.035, gtop - gy0 - gw / 2, 0.05, m.cream, [lw / 2, gy0 + (gtop - gy0 - gw / 2) / 2, 0], false);
  box(leaf, gw, 0.035, 0.05, m.cream, [lw / 2, gy0 + (gtop - gy0 - gw / 2) * 0.5, 0], false);
  box(leaf, gw, 0.035, 0.05, m.cream, [lw / 2, gtop - gw / 2, 0], false);
  // lower panel + kick plate
  plate(leaf, lw - 0.3, 0.62, 0.04, 0.04, m.accent, [lw / 2, 0.52, 0.045]);
  plate(leaf, lw - 0.12, 0.16, 0.03, 0.03, m.cream, [lw / 2, 0.12, 0.045]);
  // brass pull
  rod(leaf, [lw - 0.12, 0.9, 0.1], [lw - 0.12, 1.28, 0.1], 0.024, m.yellow, 10);
  rod(leaf, [lw - 0.12, 0.92, 0.04], [lw - 0.12, 0.92, 0.1], 0.016, m.yellow, 8);
  rod(leaf, [lw - 0.12, 1.26, 0.04], [lw - 0.12, 1.26, 0.1], 0.016, m.yellow, 8);
  // flower wreath on the lower panel
  const wreath = group(leaf, 'Wreath', [lw / 2, 0.55, 0.095]);
  ring(wreath, 0.17, 0.035, m.leaf, [0, 0, 0]);
  for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; sphere(wreath, [0.05, 0.05, 0.05], [m.pink, m.white, m.coral, m.yellow][i % 4], [Math.cos(a) * 0.17, Math.sin(a) * 0.17, 0.03], [8, 6]); }
  sphere(wreath, [0.04, 0.026, 0.02], m.accent, [-0.05, -0.17, 0.05], [8, 5]); sphere(wreath, [0.04, 0.026, 0.02], m.accent, [0.05, -0.17, 0.05], [8, 5]);
  // little OPEN card
  tube(leaf, [[lw / 2 - 0.2, gy0 + 0.35, 0.06], [lw / 2, gy0 + 0.52, 0.06], [lw / 2 + 0.2, gy0 + 0.35, 0.06]], 0.007, m.ink);
  plate(leaf, 0.34, 0.17, 0.02, 0.02, m.cream, [lw / 2, gy0 + 0.22, 0.07]);
  atlas.attach(leaf, 'open', 0.32, 0.15, [lw / 2, gy0 + 0.22, 0.082]);
  // hinges
  for (const y of [0.3, 1.1, 1.9]) cylinder(leaf, 0.02, 0.02, 0.14, m.ink, [-0.005, y, 0.0], false, 8);
  return { hinge, leaf };
}
