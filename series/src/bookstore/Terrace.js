import * as THREE from 'three';
import { group, box, plate, rod, tube, sphere, cylinder, cone } from './primitives.js';
import { G } from './Architecture.js';
import { stack, faceOut, plant, vine } from './Books.js';
import { Mug } from './Interior.js';

// Furniture for the rooftop reading terrace (local to the roof group, terrace floor at y = TERRACE).
export function Terrace(g, m, atlas) {
  const T = G.TERRACE, B = m.booksOut;
  // striped outdoor rug under the table
  box(g, 1.9, 0.012, 1.4, m.rug, [0.65, T + 0.006, 0.2], false);
  for (let i = 0; i < 5; i++) box(g, 1.9, 0.013, 0.08, m.cream, [0.65, T + 0.007, -0.32 + i * 0.26], false);

  // round café table with coffee, books and a jam-jar of flowers; two chairs, one with a blanket
  const table = group(g, 'Terrace table', [0.65, T, 0.2]);
  cylinder(table, 0.34, 0.34, 0.035, m.cream, [0, 0.72, 0], true, 28);
  rod(table, [0, 0, 0], [0, 0.71, 0], 0.025, m.walnut, 8);
  for (const a of [0.4, 2.5, 4.6]) rod(table, [0, 0.04, 0], [Math.sin(a) * 0.26, 0.005, Math.cos(a) * 0.26], 0.018, m.walnut, 6);
  Mug(table, m, [0.14, 0.738, 0.12], m.cream); Mug(table, m, [-0.18, 0.738, -0.1], m.blue);
  for (const [x, z] of [[0.14, 0.12], [-0.18, -0.1]]) cylinder(table, 0.06, 0.06, 0.005, m.paper, [x, 0.739, z], false, 14);
  stack(table, m, B, [0.08, 0.738, -0.14], 3, 81, 0.5);
  const jar = group(table, 'Flowers', [-0.12, 0.738, 0.15]);
  cylinder(jar, 0.04, 0.04, 0.1, m.glass, [0, 0.05, 0], false, 12);
  for (let i = 0; i < 5; i++) { const a = i * 1.26; rod(jar, [0, 0.02, 0], [Math.cos(a) * 0.04, 0.17, Math.sin(a) * 0.04], 0.004, m.leafDeep, 4); sphere(jar, [0.025, 0.02, 0.025], [m.coral, m.yellow, m.paper, m.coral, m.blue][i], [Math.cos(a) * 0.04, 0.18, Math.sin(a) * 0.04], [7, 5]); }
  Chair(g, m, [-0.02, T, 0.3], Math.PI / 2 + 0.2, m.coral, true);
  Chair(g, m, [1.32, T, 0.05], -Math.PI / 2 - 0.15, m.blue, false);

  // writing desk against the back parapet with the vintage typewriter, a desk lamp and a stack of books
  const desk = group(g, 'Writing desk', [-1.3, T, -1.38]);
  box(desk, 1.15, 0.045, 0.56, m.walnut, [0, 0.74, 0]);
  box(desk, 1.08, 0.12, 0.5, m.wood, [0, 0.66, 0]);
  for (const [x, z] of [[-0.52, -0.23], [0.52, -0.23], [-0.52, 0.23], [0.52, 0.23]]) box(desk, 0.05, 0.72, 0.05, m.walnut, [x, 0.36, z]);
  for (const x of [-0.27, 0.27]) { plate(desk, 0.36, 0.08, 0.02, 0.015, m.woodLight, [x, 0.66, 0.255]); sphere(desk, [0.015, 0.015, 0.015], m.brass, [x, 0.66, 0.27], [6, 4]); }
  Typewriter(desk, m, atlas, [0.02, 0.765, 0.02], 0.12);
  stack(desk, m, B, [-0.4, 0.765, -0.08], 4, 82, -0.2);
  const lamp = group(desk, 'Desk lamp', [0.42, 0.765, -0.12]);
  cylinder(lamp, 0.07, 0.08, 0.025, m.brass, [0, 0.012, 0], true, 14);
  tube(lamp, [[0, 0.02, 0], [0, 0.28, 0.02], [0.05, 0.4, 0.08], [0.1, 0.38, 0.14]], 0.01, m.brass);
  const shade = cone(lamp, 0.08, 0.12, m.typewriter, [0.11, 0.36, 0.15], true, 14); shade.rotation.x = 0.6;
  sphere(lamp, [0.035, 0.03, 0.035], m.glow, [0.12, 0.31, 0.18], [8, 6]);
  plate(desk, 0.14, 0.2, 0.012, 0.01, m.paper, [0.3, 0.772, 0.15]).rotation.x = -Math.PI / 2;
  Chair(g, m, [-1.25, T, -0.82], Math.PI + 0.1, m.yellow, false);

  // greenery: a tall plant, potted bushes, a flower box along the front parapet, vines trailing over it
  plant(g, m, [2.42, T, -1.4], { r: 0.2, h: 0.36, pot: m.terracotta, kind: 'tall' });
  plant(g, m, [2.08, T, -1.48], { r: 0.13, h: 0.2, pot: m.cream, kind: 'bush' });
  plant(g, m, [-2.4, T, 1.18], { r: 0.18, h: 0.3, pot: m.terracotta, kind: 'bush' });
  plant(g, m, [-2.42, T, -1.42], { r: 0.15, h: 0.24, pot: m.cream, kind: 'trailing' });
  const fb = group(g, 'Flower box', [-1.05, T, 1.38]);
  box(fb, 1.6, 0.26, 0.26, m.wood, [0, 0.13, 0]); box(fb, 1.64, 0.035, 0.3, m.walnut, [0, 0.27, 0]);
  for (let i = 0; i < 9; i++) {
    const x = -0.7 + i * 0.175;
    sphere(fb, [0.1, 0.08, 0.1], i % 2 ? m.leaf : m.leafLight, [x, 0.33, (i % 2 - 0.5) * 0.06], [9, 6]);
    rod(fb, [x, 0.3, 0], [x + 0.02, 0.46 + (i % 3) * 0.04, 0.01], 0.006, m.leafDeep, 4);
    sphere(fb, [0.045, 0.035, 0.045], [m.coral, m.yellow, m.paper][i % 3], [x + 0.02, 0.47 + (i % 3) * 0.04, 0.01], [8, 5]);
  }
  // book crate and a folded blanket by the right railing
  const crate = group(g, 'Book crate', [2.25, T, 1.05]); crate.rotation.y = -0.4;
  for (const s of [-1, 1]) { box(crate, 0.52, 0.28, 0.025, m.woodLight, [0, 0.14, s * 0.17]); box(crate, 0.025, 0.28, 0.32, m.woodLight, [s * 0.25, 0.14, 0]); }
  box(crate, 0.5, 0.02, 0.32, m.wood, [0, 0.01, 0]);
  for (let i = 0; i < 9; i++) { const h = 0.2 + ((i * 37) % 7) * 0.012; box(crate, 0.045, h, 0.24, B[(i * 5 + 2) % B.length], [-0.21 + i * 0.05, 0.02 + h / 2, 0.01], false); }
  for (let i = 0; i < 3; i++) box(g, 0.42, 0.045, 0.32, i % 2 ? m.cream : m.coral, [2.3, T + 0.022 + i * 0.045, 0.45], i === 2);
  // a little rooftop hatch with a brass ring
  const hatch = group(g, 'Roof hatch', [1.78, T, -1.25]);
  box(hatch, 0.66, 0.16, 0.66, m.frame, [0, 0.08, 0]); box(hatch, 0.7, 0.04, 0.7, m.cream, [0, 0.18, 0]);
  const ringM = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.008, 6, 16), m.brass); ringM.position.set(0, 0.205, 0.2); ringM.rotation.x = Math.PI / 2; hatch.add(ringM);

  // string lights between the railing posts, front and right
  const ry = T + 0.32 + 0.04 + 0.5, { X0, X1, Z0, Z1 } = G, e = 0.07;
  const strand = (a, b) => {
    const pts = [], n = 12;
    for (let i = 0; i <= n; i++) { const t = i / n; pts.push([a[0] + (b[0] - a[0]) * t, ry + 0.03 - Math.sin(t * Math.PI) * 0.16, a[1] + (b[1] - a[1]) * t]); }
    tube(g, pts, 0.004, m.ink);
    for (let i = 1; i < n; i++) sphere(g, [0.026, 0.034, 0.026], m.glow, [pts[i][0], pts[i][1] - 0.035, pts[i][2]], [8, 6]);
  };
  strand([X0 + e, Z1 - e], [(X0 + X1) / 2, Z1 - e]); strand([(X0 + X1) / 2, Z1 - e], [X1 - e, Z1 - e]);
  strand([X1 - e, Z1 - e], [X1 - e, (Z0 + Z1) / 2]); strand([X1 - e, (Z0 + Z1) / 2], [X1 - e, Z0 + e]);

  // vines hanging over the front cornice from the flower box
  for (const [x, len, s] of [[-1.75, 0.3, 1], [-1.3, 0.42, 2], [-0.75, 0.22, 3], [-0.35, 0.36, 4]]) {
    vine(g, m, [x, T + 0.36, Z1 - 0.02], [x + 0.03, T + 0.3, Z1 + 0.16], 2, s, 0.01, 1.2);
    vine(g, m, [x + 0.03, T + 0.3, Z1 + 0.16], [x + 0.05, T + 0.1 - len, Z1 + 0.17], 3 + s % 3, s, 0.02, 1.2);
  }
  return g;
}

function Chair(p, m, pos, turn, seat, blanket) {
  const g = group(p, 'Terrace chair', pos); g.rotation.y = turn;
  cylinder(g, 0.19, 0.19, 0.035, seat, [0, 0.46, 0], true, 20);
  for (const [x, z] of [[-0.13, -0.13], [0.13, -0.13], [-0.13, 0.13], [0.13, 0.13]]) rod(g, [x * 1.1, 0, z * 1.1], [x * 0.8, 0.45, z * 0.8], 0.016, m.walnut, 6);
  tube(g, [[-0.14, 0.46, -0.12], [-0.15, 0.72, -0.17], [0, 0.8, -0.2], [0.15, 0.72, -0.17], [0.14, 0.46, -0.12]], 0.016, m.walnut);
  for (const x of [-0.06, 0.06]) rod(g, [x, 0.47, -0.14], [x, 0.76, -0.19], 0.009, m.walnut, 4);
  if (blanket) {
    // a checked blanket over the backrest
    box(g, 0.36, 0.3, 0.025, m.coral, [0, 0.66, -0.22]).rotation.x = 0.15;
    box(g, 0.36, 0.025, 0.12, m.coral, [0, 0.8, -0.16]);
    for (const x of [-0.12, 0, 0.12]) box(g, 0.022, 0.302, 0.027, m.cream, [x, 0.66, -0.22], false).rotation.x = 0.15;
    for (const y of [0.56, 0.68]) box(g, 0.362, 0.022, 0.027, m.cream, [0, y, -0.22 + (y - 0.66) * 0.15], false);
  }
  return g;
}

function Typewriter(p, m, atlas, pos, turn) {
  const g = group(p, 'Vintage typewriter', pos); g.rotation.y = turn;
  // body: a low wedge in green enamel with a darker base
  box(g, 0.44, 0.04, 0.34, m.walnut, [0, 0.02, 0]);
  const shape = new THREE.Shape(); shape.moveTo(-0.17, 0); shape.lineTo(0.15, 0); shape.lineTo(0.15, 0.06); shape.lineTo(-0.05, 0.15); shape.lineTo(-0.17, 0.15); shape.closePath();
  const body = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.4, bevelEnabled: false }), m.typewriter);
  body.geometry.translate(0, 0, -0.2); body.rotation.y = -Math.PI / 2; body.position.set(0, 0.04, 0); body.userData.outline = true; g.add(body);
  // three rows of round keys on the slope
  for (let r = 0; r < 3; r++) for (let i = 0; i < 9 - r; i++) {
    const z = 0.12 - r * 0.045, k = cylinder(g, 0.013, 0.013, 0.012, m.cream, [-0.15 + r * 0.015 + i * 0.036, 0.108 + (0.15 - z) * 0.45, z], false, 10);
    k.rotation.x = 0.42;
  }
  box(g, 0.2, 0.012, 0.03, m.cream, [0, 0.085, 0.16], false); // space bar
  // carriage: platen roller with knobs, a sheet of paper, the return lever
  const platen = cylinder(g, 0.035, 0.035, 0.46, m.ink, [0, 0.21, -0.1], true, 16); platen.rotation.z = Math.PI / 2;
  for (const s of [-1, 1]) { const k = cylinder(g, 0.028, 0.028, 0.03, m.walnut, [s * 0.245, 0.21, -0.1], true, 12); k.rotation.z = Math.PI / 2; }
  box(g, 0.44, 0.03, 0.06, m.typewriter, [0, 0.18, -0.08]);
  const paper = box(g, 0.22, 0.24, 0.004, m.paper, [0, 0.33, -0.12]); paper.rotation.x = -0.15;
  for (let i = 0; i < 5; i++) box(g, 0.15 - (i % 2) * 0.05, 0.006, 0.005, m.ink, [-0.02, 0.4 - i * 0.025, -0.116 + i * 0.004], false).rotation.x = -0.15;
  tube(g, [[-0.22, 0.22, -0.08], [-0.28, 0.25, -0.03], [-0.3, 0.25, 0.03]], 0.008, m.brass);
  return g;
}
