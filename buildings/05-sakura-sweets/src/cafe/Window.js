// Windows: opening paths for the wall panel + surround, sill, sash, glass, shutters and flower boxes.
import * as THREE from 'three';
import { extrude, rectPath, archPath, polyPath } from './kit.js';

export const WIN = {
  displayY0: 0.98, displayY1: 2.78,
  upperY0: 3.95, upperY1: 5.85,
};

export function openingPath(spec) {
  if (spec.kind === 'arch') return archPath(THREE.Path, spec.u, spec.y0, spec.u + spec.w, spec.y1, spec.w / 2);
  return rectPath(THREE.Path, spec.u, spec.y0, spec.u + spec.w, spec.y1);
}

// Blossom cluster used by window boxes and planters. Local origin at the soil line.
export function flowerTuft(kit, parent, x, y, z, width, o = {}) {
  const n = Math.max(3, Math.round(width / 0.17));
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0 : i / (n - 1) - 0.5;
    const px = x + t * (width - 0.14);
    kit.blob(parent, 'leaf', 0.1, [px, y + 0.05, z + (i % 2 ? 0.02 : -0.02)], { seg: 10 });
    kit.blob(parent, o.flower || 'flower', 0.075, [px + (i % 2 ? 0.04 : -0.03), y + 0.15 + (i % 3) * 0.03, z + 0.03], { seg: 10 });
  }
}

export function addWindow(kit, f, spec) {
  const g = f.g;
  const { u, w, y0, y1 } = spec;
  if (spec.kind === 'arch') archWindow(kit, g, spec);
  else displayWindow(kit, g, spec);
}

function displayWindow(kit, g, { u, w, y0, y1, bulkhead = true }) {
  const m = 0.14, cx = u + w / 2, h = y1 - y0;
  // surround
  const outer = rectPath(THREE.Shape, u - m, y0 - 0.02, u + w + m, y1 + m);
  outer.holes.push(rectPath(THREE.Path, u, y0, u + w, y1));
  kit.part(g, 'trim', extrude(outer, 0.08, 0.012), { line: 'mid' });
  // lintel with keystone
  kit.part(g, 'trim', new THREE.BoxGeometry(w + 0.62, 0.17, 0.15), { p: [cx, y1 + m + 0.085, 0.075], line: 'mid' });
  const ks = polyPath(THREE.Shape, [[-0.15, 0], [0.15, 0], [0.1, 0.34], [-0.1, 0.34]]);
  kit.part(g, 'stone', extrude(ks, 0.19, 0.01), { p: [cx, y1 + m - 0.08, 0], line: 'mid' });
  // sill + corbels
  kit.part(g, 'trim', new THREE.BoxGeometry(w + 0.4, 0.1, 0.3), { p: [cx, y0 - 0.1, 0.15], line: 'mid' });
  for (const sx of [-1, 1]) kit.part(g, 'stone', new THREE.BoxGeometry(0.09, 0.15, 0.2), { p: [cx + sx * (w / 2 - 0.05), y0 - 0.25, 0.1], line: 'thin' });

  // interior backdrop + glass
  kit.part(g, 'interior', new THREE.PlaneGeometry(w, h), { p: [cx, (y0 + y1) / 2, -0.29], line: 'none' });
  kit.part(g, 'glass', new THREE.PlaneGeometry(w, h), { p: [cx, (y0 + y1) / 2, -0.15], line: 'none' });
  // sash bars: frame, two mullions, transom
  const bar = 0.06, bz = -0.12, bd = 0.07;
  const bars = [
    [w, bar, cx, y0 + bar / 2], [w, bar, cx, y1 - bar / 2],
    [bar, h, u + bar / 2, (y0 + y1) / 2], [bar, h, u + w - bar / 2, (y0 + y1) / 2],
    [bar, h, u + w / 3, (y0 + y1) / 2], [bar, h, u + (2 * w) / 3, (y0 + y1) / 2],
    [w, bar, cx, y1 - 0.5],
  ];
  for (const [bw, bh, bx, by] of bars) kit.part(g, 'trim', new THREE.BoxGeometry(bw, bh, bd), { p: [bx, by, bz], line: 'thin' });
  // glass highlights (two slanted strokes on the bigger panes)
  const hl = (x, y, ww, hh, sk) => polyPath(THREE.Shape, [[x, y], [x + ww, y], [x + ww + sk, y + hh], [x + sk, y + hh]]);
  const hs = h * 0.5;
  for (const [px, ww] of [[u + 0.14, 0.07], [u + w / 3 + 0.14, 0.07], [u + (2 * w) / 3 + 0.14, 0.07]]) {
    kit.part(g, 'glassHi', new THREE.ShapeGeometry(hl(px, y0 + 0.2, ww, hs - 0.15, 0.22)), { p: [0, 0, -0.14], line: 'none' });
    kit.part(g, 'glassHi', new THREE.ShapeGeometry(hl(px + 0.13, y0 + 0.2, 0.025, hs - 0.15, 0.22)), { p: [0, 0, -0.14], line: 'none' });
  }
  // bulkhead panel under the window
  if (bulkhead) {
    const by0 = 0.5, by1 = y0 - 0.02;
    const pw = w + 0.28 + 0.1;
    const panel = rectPath(THREE.Shape, u - 0.19, by0 + 0.0, u - 0.19 + pw, by1);
    panel.holes.push(rectPath(THREE.Path, u - 0.19 + 0.07, by0 + 0.07, u - 0.19 + pw - 0.07, by1 - 0.07));
    kit.part(g, 'trim', extrude(panel, 0.06, 0.008), { line: 'mid' });
    kit.part(g, 'wallDeep', new THREE.BoxGeometry(pw - 0.14, by1 - by0 - 0.14, 0.03), { p: [u - 0.19 + pw / 2, (by0 + by1) / 2, 0.015], line: 'thin' });
  }
}

function archWindow(kit, g, { u, w, y0, y1, shutters = true, box = true, hood = true }) {
  const m = 0.14, cx = u + w / 2, h = y1 - y0, r = w / 2;
  // surround ring (arched)
  const outer = archPath(THREE.Shape, u - m, y0 - 0.02, u + w + m, y1 + m, r + m);
  outer.holes.push(archPath(THREE.Path, u, y0, u + w, y1, r));
  kit.part(g, 'trim', extrude(outer, 0.08, 0.012), { line: 'mid' });
  // keystone
  kit.part(g, 'stone', extrude(polyPath(THREE.Shape, [[-0.12, 0], [0.12, 0], [0.08, 0.3], [-0.08, 0.3]]), 0.14, 0.01), { p: [cx, y1 + m - 0.1, 0.0], line: 'mid' });
  // sill
  kit.part(g, 'trim', new THREE.BoxGeometry(w + 0.46, 0.1, 0.3), { p: [cx, y0 - 0.1, 0.15], line: 'mid' });
  for (const sx of [-1, 1]) kit.part(g, 'stone', new THREE.BoxGeometry(0.09, 0.14, 0.2), { p: [cx + sx * (w / 2 - 0.02), y0 - 0.24, 0.1], line: 'thin' });

  // glazing
  const gShape = archPath(THREE.Shape, u, y0, u + w, y1, r);
  const gGeo = new THREE.ShapeGeometry(gShape, 24);
  kit.part(g, 'interior', gGeo, { p: [0, 0, -0.29], line: 'none' });
  kit.part(g, 'glass', gGeo.clone(), { p: [0, 0, -0.15], line: 'none' });
  const bar = 0.05, bz = -0.12;
  kit.part(g, 'trim', new THREE.BoxGeometry(bar, h - r, 0.06), { p: [cx, y0 + (h - r) / 2, bz], line: 'thin' });
  kit.part(g, 'trim', new THREE.BoxGeometry(w, bar, 0.06), { p: [cx, y0 + (h - r) * 0.58, bz], line: 'thin' });
  kit.part(g, 'trim', new THREE.BoxGeometry(w, bar, 0.06), { p: [cx, y0 + (h - r), bz], line: 'thin' });
  kit.part(g, 'trim', new THREE.BoxGeometry(bar, r, 0.06), { p: [cx, y1 - r / 2, bz], line: 'thin' });
  // frame ring on the glass edge
  const fr = archPath(THREE.Shape, u, y0, u + w, y1, r);
  fr.holes.push(archPath(THREE.Path, u + 0.05, y0 + 0.05, u + w - 0.05, y1 - 0.05, r - 0.05));
  kit.part(g, 'trim', extrude(fr, 0.06), { p: [0, 0, -0.16], line: 'thin' });
  // highlights
  const hl = (x, y, ww, hh, sk) => polyPath(THREE.Shape, [[x, y], [x + ww, y], [x + ww + sk, y + hh], [x + sk, y + hh]]);
  kit.part(g, 'glassHi', new THREE.ShapeGeometry(hl(u + 0.12, y0 + 0.2, 0.07, 0.42, 0.14)), { p: [0, 0, -0.145], line: 'none' });
  kit.part(g, 'glassHi', new THREE.ShapeGeometry(hl(u + 0.25, y0 + 0.2, 0.025, 0.42, 0.14)), { p: [0, 0, -0.145], line: 'none' });

  if (shutters) {
    const sw = 0.4;
    for (const side of [-1, 1]) {
      const x0 = side < 0 ? u - m - sw - 0.015 : u + w + m + 0.015;
      const top = y0 + h * 0.82;
      const leaf = extrude(rectPath(THREE.Shape, x0, y0 - 0.02, x0 + sw, top), 0.055, 0.008);
      kit.part(g, 'shutter', leaf, { p: [0, 0, 0.0], line: 'mid' });
      const lines = [];
      for (let y = y0 + 0.12; y < top - 0.06; y += 0.115) {
        lines.push(x0 + 0.05, y, 0.062, x0 + sw - 0.05, y, 0.062);
      }
      kit.seg(g, 'thin', lines);
      kit.part(g, 'trim', new THREE.BoxGeometry(0.03, top - y0 - 0.08, 0.02), { p: [x0 + sw / 2, (y0 + top) / 2 - 0.0, 0.065], line: 'none' });
    }
  }
  if (box) {
    const bw = w + 0.3, by = y0 - 0.36;
    kit.part(g, 'coral', new THREE.BoxGeometry(bw, 0.2, 0.3), { p: [cx, by, 0.2], line: 'mid' });
    kit.part(g, 'trim', new THREE.BoxGeometry(bw + 0.04, 0.035, 0.34), { p: [cx, by + 0.1, 0.2], line: 'thin' });
    for (const sx of [-1, 1]) kit.beam(g, 'ink', [cx + sx * (bw / 2 - 0.1), by - 0.1, 0.05], [cx + sx * (bw / 2 - 0.1), by - 0.1, 0.32], 0.035, 0.035, { line: 'none' });
    flowerTuft(kit, g, cx, by + 0.1, 0.2, bw - 0.1);
  }
}

// round (oculus) window for gables
export function addOculus(kit, g, cx, cy, r) {
  const ring = new THREE.Shape(); ring.absarc(0, 0, r + 0.15, 0, Math.PI * 2, false);
  const hole = new THREE.Path(); hole.absarc(0, 0, r, 0, Math.PI * 2, true);
  ring.holes.push(hole);
  kit.part(g, 'trim', extrude(ring, 0.08, 0.01, 40), { p: [cx, cy, 0], line: 'mid' });
  const disc = new THREE.CircleGeometry(r, 40);
  kit.part(g, 'interior', disc, { p: [cx, cy, -0.25], line: 'none' });
  kit.part(g, 'glass', disc.clone(), { p: [cx, cy, -0.14], line: 'none' });
  kit.part(g, 'trim', new THREE.BoxGeometry(2 * r, 0.05, 0.06), { p: [cx, cy, -0.11], line: 'thin' });
  kit.part(g, 'trim', new THREE.BoxGeometry(0.05, 2 * r, 0.06), { p: [cx, cy, -0.11], line: 'thin' });
  const ringIn = new THREE.Shape(); ringIn.absarc(0, 0, r, 0, Math.PI * 2, false);
  const hIn = new THREE.Path(); hIn.absarc(0, 0, r - 0.05, 0, Math.PI * 2, true); ringIn.holes.push(hIn);
  kit.part(g, 'trim', extrude(ringIn, 0.06, 0, 40), { p: [cx, cy, -0.15], line: 'thin' });
}
