// Gable roof with real thickness, fascia + rake boards, ridge cap, tile courses, chimney and dormer.
import * as THREE from 'three';
import { extrude, polyPath, shearY, archPath, rectPath } from './kit.js';

export function buildRoof(kit, root, cfg, G) {
  const { Xb, Xf, Zb, Zf, chamfer: c, overhang: e, roofSlope: s, eaveH: H } = cfg;
  const { zr, Hr } = G;
  const t = 0.17;
  const k2 = Math.SQRT2;
  const zA = Zf - c + e * (k2 - 1);        // chamfer cut meets the right rake
  const xB = Xf - c + e * (k2 - 1);        // chamfer cut meets the front eave
  const x0 = -Xb - e, x1 = Xf + e;
  const zFront = Zf + e, zBack = -Zb - e;

  const slab = (pts, b, cc) => {
    const g = extrude(polyPath(THREE.Shape, pts.map(([x, z]) => [x, -z])), t, 0.02);
    g.rotateX(-Math.PI / 2);
    shearY(g, 0, b, cc);
    return g;
  };
  // front slope (with chamfer cut) and back slope
  const front = slab([[x0, zr + 0.02], [x1, zr + 0.02], [x1, zA], [xB, zFront], [x0, zFront]], -s, H + s * Zf - t);
  const back = slab([[x0, zBack], [x1, zBack], [x1, zr - 0.02], [x0, zr - 0.02]], s, H + s * Zb - t);
  kit.part(root, 'roof', front, { line: 'outer', angle: 25 });
  kit.part(root, 'roof', back, { line: 'outer', angle: 25 });

  const yF = z => H + s * (Zf - z);          // front plane top
  const yB = z => H + s * (z + Zb);          // back plane top

  // ridge cap
  const rs = new THREE.Shape();
  rs.moveTo(-0.24, 0); rs.lineTo(0.24, 0); rs.lineTo(0.12, 0.2); rs.lineTo(-0.12, 0.2); rs.closePath();
  const ridge = extrude(rs, x1 - x0 + 0.16, 0.015);
  ridge.rotateY(Math.PI / 2);
  ridge.translate(x0 - 0.08, Hr - 0.12, zr);
  kit.part(root, 'roofDark', ridge, { line: 'mid', angle: 30 });

  // fascia boards (cream) hugging the slab edges, rake boards on both gables
  const fh = t + 0.13, ft = 0.07;
  const fas = (a, b, ya, yb, up) => kit.beam(root, 'trim', [a[0], ya - fh / 2, a[1]], [b[0], yb - fh / 2, b[1]], fh, ft, { up, line: 'mid', angle: 30 });
  // front eave
  fas([x0, zFront + ft / 2], [xB, zFront + ft / 2], yF(zFront), yF(zFront));
  // chamfer-cut eave
  const dxy = 0.035 * Math.SQRT1_2;
  fas([xB + dxy, zFront + dxy], [x1 + dxy, zA + dxy], yF(zFront), yF(zA));
  // right rake (front half, with the chamfer end) and back half
  fas([x1 + ft / 2, zA], [x1 + ft / 2, zr], yF(zA), Hr, [0, 1, 0]);
  fas([x1 + ft / 2, zr], [x1 + ft / 2, zBack], Hr, yB(zBack), [0, 1, 0]);
  // left rake
  fas([x0 - ft / 2, zFront], [x0 - ft / 2, zr], yF(zFront), Hr, [0, 1, 0]);
  fas([x0 - ft / 2, zr], [x0 - ft / 2, zBack], Hr, yB(zBack), [0, 1, 0]);
  // back eave
  fas([x0, zBack - ft / 2], [x1, zBack - ft / 2], yB(zBack), yB(zBack));

  // gable finials
  for (const x of [x0 - 0.02, x1 + 0.02]) {
    kit.part(root, 'roofDark', new THREE.ConeGeometry(0.07, 0.3, 8), { p: [x, Hr + 0.1, zr], line: 'thin' });
    kit.blob(root, 'yellow', 0.075, [x, Hr - 0.02, zr], { seg: 10 });
  }

  // tile courses (hatch lines) with staggered ticks
  const course = 0.42, tick = 0.56;
  const xEnd = z => Math.min(x1, (Xf + Zf - c + e * k2) - z);
  const addTiles = (zStart, zEnd, yAt, frontSide) => {
    const lines = [];
    const dir = Math.sign(zEnd - zStart);
    const n = Math.floor(Math.abs(zEnd - zStart) / course);
    for (let k = 0; k <= n; k++) {
      const z = zStart + dir * k * course;
      const xe = frontSide ? xEnd(z) : x1;
      if (k > 0) lines.push(x0 + 0.05, yAt(z) + 0.028, z, xe - 0.05, yAt(z) + 0.028, z);
      const zn = z + dir * course;
      if (k === n && Math.abs(zEnd - z) < course * 0.9) continue;
      const stag = (k % 2) * tick * 0.5;
      for (let x = x0 + 0.3 + stag; x < xe - 0.1; x += tick) {
        lines.push(x, yAt(z) + 0.028, z, x, yAt(zn) + 0.028, zn);
      }
    }
    kit.seg(root, 'hatch', lines);
  };
  addTiles(zr + 0.0, zFront - 0.1, yF, true);
  addTiles(zr, zBack + 0.1, yB, false);

  buildChimney(kit, root, cfg, G, yF, yB);
  buildDormer(kit, root, cfg, G, yF);
}

function buildChimney(kit, root, cfg, G, yF, yB) {
  const { zr, Hr } = G;
  const cx = cfg.chimneyX;
  const g = new THREE.Group();
  g.position.set(cx, 0, zr);
  root.add(g);
  const w = 0.82, d = 0.74;
  const yb = Hr - 1.3, yt = Hr + 1.05;
  kit.part(g, 'brick', new THREE.BoxGeometry(w, yt - yb, d), { p: [0, (yb + yt) / 2, 0], line: 'mid' });
  // brick courses
  const lines = [];
  for (let y = yb + 0.26; y < yt - 0.1; y += 0.26) {
    lines.push(-w / 2, y, d / 2 + 0.003, w / 2, y, d / 2 + 0.003);
    lines.push(w / 2 + 0.003, y, d / 2, w / 2 + 0.003, y, -d / 2);
  }
  kit.seg(g, 'hatch', lines);
  // cap + pots
  kit.part(g, 'trim', extrude(rectPath(THREE.Shape, -0.5, -0.46, 0.5, 0.46), 0.1, 0.012).rotateX(-Math.PI / 2), { p: [0, yt, 0], line: 'mid' });
  kit.part(g, 'trim', extrude(rectPath(THREE.Shape, -0.43, -0.4, 0.43, 0.4), 0.08).rotateX(-Math.PI / 2), { p: [0, yt - 0.1, 0], line: 'thin' });
  for (const px of [-0.2, 0.2]) {
    kit.part(g, 'coral', new THREE.CylinderGeometry(0.1, 0.12, 0.3, 14), { p: [px, yt + 0.25, 0], line: 'thin' });
    kit.part(g, 'coral', new THREE.CylinderGeometry(0.135, 0.135, 0.06, 14), { p: [px, yt + 0.43, 0], line: 'thin' });
  }
  // intersections with the roof slopes
  const zf = d / 2, y1 = yF(zr + zf);
  kit.seg(root, 'mid', [
    cx - w / 2, y1 + 0.03, zr + zf, cx + w / 2, y1 + 0.03, zr + zf,
    cx + w / 2, y1 + 0.03, zr + zf, cx + w / 2, Hr + 0.03, zr,
  ]);
}

function buildDormer(kit, root, cfg, G, yF) {
  const { roofSlope: s } = cfg;
  const zd = 1.7;                // front wall plane
  const yb = yF(zd) - 0.06;
  const g = new THREE.Group();
  g.position.set(cfg.dormerX, 0, zd);
  root.add(g);
  const hw = 0.66, wallH = 1.1, depth = 1.9, peak = 0.46;

  // front wall with arched window opening
  const sh = polyPath(THREE.Shape, [[-hw, 0], [hw, 0], [hw, wallH], [0, wallH + peak], [-hw, wallH]]);
  const win = archPath(THREE.Path, -0.31, 0.22, 0.31, 0.98, 0.31);
  sh.holes.push(win);
  const front = extrude(sh, 0.16, 0.012);
  front.translate(0, 0, -0.16);
  kit.part(g, 'wall', front, { p: [0, yb, 0], line: 'mid', angle: 40 });
  // cheeks (side walls)
  for (const sx of [-1, 1]) {
    kit.part(g, 'wall', new THREE.BoxGeometry(0.1, wallH, depth), { p: [sx * (hw - 0.05), yb + wallH / 2, -depth / 2 - 0.0], line: 'mid' });
  }
  // glass & sash
  const gl = new THREE.ShapeGeometry(archPath(THREE.Shape, -0.31, 0.22, 0.31, 0.98, 0.31), 20);
  kit.part(g, 'interior', gl, { p: [0, yb, -0.1], line: 'none' });
  kit.part(g, 'glass', gl.clone(), { p: [0, yb, -0.06], line: 'none' });
  kit.part(g, 'trim', new THREE.BoxGeometry(0.04, 0.76, 0.05), { p: [0, yb + 0.6, -0.04], line: 'thin' });
  kit.part(g, 'trim', new THREE.BoxGeometry(0.62, 0.04, 0.05), { p: [0, yb + 0.62, -0.04], line: 'thin' });
  // arch surround
  const ring = archPath(THREE.Shape, -0.43, 0.14, 0.43, 1.06, 0.43);
  ring.holes.push(archPath(THREE.Path, -0.31, 0.22, 0.31, 0.98, 0.31));
  kit.part(g, 'trim', extrude(ring, 0.05, 0.008), { p: [0, yb - 0.08, 0.0], line: 'thin' });
  // sill
  kit.part(g, 'trim', new THREE.BoxGeometry(0.86, 0.07, 0.2), { p: [0, yb + 0.15, 0.08], line: 'thin' });

  // little gable roof (two boards) + rake trim
  const ang = Math.atan2(peak, hw);
  const len = Math.hypot(hw, peak) + 0.16;
  for (const sx of [-1, 1]) {
    const piece = new THREE.Group();
    piece.position.set(sx * (hw / 2 + 0.02), yb + wallH + peak / 2 + 0.06, 0.0);
    piece.rotation.z = -sx * ang;
    g.add(piece);
    kit.part(piece, 'roof', new THREE.BoxGeometry(len, 0.07, depth + 0.28), { p: [sx * 0.05, 0, -depth / 2 + 0.14], line: 'mid' });
    kit.part(piece, 'trim', new THREE.BoxGeometry(len, 0.12, 0.05), { p: [sx * 0.05, -0.06, 0.16], line: 'thin' });
  }
  kit.part(g, 'roofDark', new THREE.BoxGeometry(0.1, 0.1, depth + 0.28), { p: [0, yb + wallH + peak + 0.06, -depth / 2 + 0.14], line: 'thin' });
  // base intersection line on the roof
  kit.seg(root, 'mid', [cfg.dormerX - hw, yb + 0.004, zd + 0.0, cfg.dormerX + hw, yb + 0.004, zd + 0.0]);
}
