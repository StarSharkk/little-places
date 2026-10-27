// Footprint, façade frames, wall panels with true openings, plinth, string course, cornice, quoins.
import * as THREE from 'three';
import { extrude, insetPolygon, polyPath, rectPath, archPath } from './kit.js';

export function makeGeometry(cfg) {
  const { Xb, Xf, Zb, Zf, chamfer: c, eaveH: H, roofSlope: s } = cfg;
  const zr = (Zf - Zb) / 2;
  const Hr = H + s * ((Zf + Zb) / 2);
  const roofY = z => (z >= zr ? H + s * (Zf - z) : H + s * (z + Zb));
  // CCW footprint in (x,z)
  const foot = [[-Xb, -Zb], [Xf, -Zb], [Xf, Zf - c], [Xf - c, Zf], [-Xb, Zf]];
  return { zr, Hr, roofY, foot, H, s };
}

// A façade frame: local +z is outward, local +x runs towards screen-right, origin at the façade's left end.
export function makeFrame(root, name, origin, ry, len, T) {
  const g = new THREE.Group();
  g.name = `facade-${name}`;
  g.position.set(...origin);
  g.rotation.y = ry;
  root.add(g);
  return { name, g, len, T, ry, origin };
}

export function makeFrames(root, cfg) {
  const { Xb, Xf, Zb, Zf, chamfer: c, wallT, portalT } = cfg;
  const P = Math.PI;
  return {
    L: makeFrame(root, 'L', [-Xb, 0, Zf], 0, Xb + Xf - c, wallT),
    C: makeFrame(root, 'C', [Xf - c, 0, Zf], P / 4, c * Math.SQRT2, portalT),
    R: makeFrame(root, 'R', [Xf, 0, Zf - c], P / 2, Zf - c + Zb, wallT),
    B: makeFrame(root, 'B', [Xf, 0, -Zb], P, Xf + Xb, wallT),
    W: makeFrame(root, 'W', [-Xb, 0, -Zb], -P / 2, Zf + Zb, wallT),
  };
}

// local point -> parent coords
export function toWorld(f, u, y, z = 0) {
  const v = new THREE.Vector3(u, y, z).applyEuler(new THREE.Euler(0, f.ry, 0));
  return [v.x + f.origin[0], y, v.z + f.origin[2]];
}

// wall slab for one façade: outline polygon (local u,y) with openings, outer face on z = 0
export function wallPanel(kit, f, outer, holes) {
  const shape = polyPath(THREE.Shape, outer);
  for (const h of holes) shape.holes.push(h);
  const geo = extrude(shape, f.T);
  geo.translate(0, 0, -f.T);
  return kit.part(f.g, 'wall', geo, { line: 'outer', angle: 40 });
}

function topProfile(fname, f, G, cfg) {
  const { H, s, zr, Hr } = G;
  const { Zf, Zb, chamfer: c } = cfg;
  switch (fname) {
    case 'C': return [[f.len, H + s * c], [0, H]];
    case 'R': { const ur = Zf - c - zr; return [[f.len, H], [ur, Hr], [0, H + s * c]]; }
    case 'W': { const ur = zr + Zb; return [[f.len, H], [ur, Hr], [0, H]]; }
    default: return [[f.len, H], [0, H]];
  }
}

export function buildWalls(kit, root, frames, G, cfg, holesFor) {
  const { plinthH, wallT, portalT } = cfg;

  for (const [name, f] of Object.entries(frames)) {
    wallPanel(kit, f, [[0, 0], [f.len, 0], ...topProfile(name, f, G, cfg)], holesFor(name, f));
  }

  // solid core filling the hollow behind the panels
  const dists = [wallT, wallT, portalT, wallT, wallT].map(d => d - 0.01);
  const inset = insetPolygon(G.foot, dists);
  const coreShape = polyPath(THREE.Shape, inset.map(([x, z]) => [x, -z]));
  const core = extrude(coreShape, G.H + 0.02);
  core.rotateX(-Math.PI / 2);
  kit.part(root, 'wallDeep', core, { line: 'none' });

  // plinth
  const out = insetPolygon(G.foot, G.foot.map(() => -0.1));
  const pl = extrude(polyPath(THREE.Shape, out.map(([x, z]) => [x, -z])), plinthH, 0.025);
  pl.rotateX(-Math.PI / 2);
  kit.part(root, 'stone', pl, { line: 'outer' });
  // plinth cap moulding
  const out2 = insetPolygon(G.foot, G.foot.map(() => -0.16));
  const cap = extrude(polyPath(THREE.Shape, out2.map(([x, z]) => [x, -z])), 0.07);
  cap.rotateX(-Math.PI / 2);
  cap.translate(0, plinthH - 0.07, 0);
  kit.part(root, 'trim', cap, { line: 'mid' });

  // string course between storeys
  const bandOut = insetPolygon(G.foot, G.foot.map(() => -0.1));
  const band = extrude(polyPath(THREE.Shape, bandOut.map(([x, z]) => [x, -z])), 0.2, 0.02);
  band.rotateX(-Math.PI / 2);
  band.translate(0, cfg.bandY, 0);
  kit.part(root, 'trim', band, { line: 'mid' });
  const bandL = insetPolygon(G.foot, G.foot.map(() => -0.14));
  const bandLip = extrude(polyPath(THREE.Shape, bandL.map(([x, z]) => [x, -z])), 0.05);
  bandLip.rotateX(-Math.PI / 2);
  bandLip.translate(0, cfg.bandY + 0.2, 0);
  kit.part(root, 'stone', bandLip, { line: 'thin' });

  // cornice (two layers) under the roof
  const c1 = insetPolygon(G.foot, G.foot.map(() => -0.16));
  const cor1 = extrude(polyPath(THREE.Shape, c1.map(([x, z]) => [x, -z])), 0.16);
  cor1.rotateX(-Math.PI / 2);
  cor1.translate(0, G.H - 0.3, 0);
  kit.part(root, 'trim', cor1, { line: 'mid' });
  const c2 = insetPolygon(G.foot, G.foot.map(() => -0.26));
  const cor2 = extrude(polyPath(THREE.Shape, c2.map(([x, z]) => [x, -z])), 0.14, 0.02);
  cor2.rotateX(-Math.PI / 2);
  cor2.translate(0, G.H - 0.14, 0);
  kit.part(root, 'trim', cor2, { line: 'mid' });

  // modillions (cornice brackets) on the two visible street fronts
  const bg = new THREE.BoxGeometry(0.15, 0.22, 0.12);
  for (const name of ['L', 'C']) {
    const f = frames[name];
    const step = 0.4;
    const n = Math.floor((f.len - 0.2) / step);
    const off = (f.len - n * step) / 2 + step / 2 - step / 2 + 0.0;
    for (let i = 0; i <= n; i++) {
      const u = (f.len - n * step) / 2 + i * step;
      kit.part(f.g, 'stone', bg, { p: [u, G.H - 0.41, 0.13], line: 'thin' });
    }
  }

  // corner quoins: alternating blocks that wrap each vertical arris
  const corners = [
    ['W', 'L'], ['L', 'C'], ['C', 'R'], ['R', 'B'], ['B', 'W'],
  ];
  const rowH = 0.5, y0 = plinthH + 0.03;
  corners.forEach(([a, b], ci) => {
    const fa = frames[a], fb = frames[b];
    const top = (a === 'R' || a === 'B' || b === 'R' || b === 'B') ? G.H - 0.6 : G.H - 0.6;
    for (let y = y0, row = 0; y + rowH <= top; y += rowH + 0.02, row++) {
      const wideA = row % 2 === 0;
      const wa = wideA ? 0.62 : 0.36, wb = wideA ? 0.36 : 0.62;
      const ga = new THREE.BoxGeometry(wa, rowH, 0.07);
      const gb = new THREE.BoxGeometry(wb, rowH, 0.07);
      kit.part(fa.g, 'trim', ga, { p: [fa.len - wa / 2 + 0.0, y + rowH / 2, 0.035 - 0.004], line: 'thin' });
      kit.part(fb.g, 'trim', gb, { p: [wb / 2, y + rowH / 2, 0.035 - 0.004], line: 'thin' });
    }
  });
}
