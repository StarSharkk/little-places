// Arched corner entrance: double moulded surround, steps, glazed door leaf on a hinge, mini interior.
import * as THREE from 'three';
import { extrude, rectPath, archPath, roundRectPath, polyPath, canvasTexture } from './kit.js';

export const DOOR = { w: 1.2, y0: 0.5, y1: 3.05 };

export function doorOpening(f) {
  const u = (f.len - DOOR.w) / 2;
  return { u, w: DOOR.w, y0: DOOR.y0, y1: DOOR.y1, kind: 'arch' };
}

export function buildDoor(kit, f) {
  const g = f.g;
  const o = doorOpening(f);
  const { u, w, y0, y1 } = o;
  const cx = u + w / 2, r = w / 2, T = f.T;

  // double surround: outer stone moulding, inner cream frame
  const ring2 = archPath(THREE.Shape, u - 0.1, y0, u + w + 0.1, y1 + 0.1, r + 0.1);
  ring2.holes.push(archPath(THREE.Path, u, y0, u + w, y1, r));
  kit.part(g, 'trim', extrude(ring2, 0.17, 0.014), { line: 'mid' });
  const ring1 = archPath(THREE.Shape, u - 0.25, y0, u + w + 0.25, y1 + 0.25, r + 0.25);
  ring1.holes.push(archPath(THREE.Path, u - 0.1, y0, u + w + 0.1, y1 + 0.1, r + 0.1));
  kit.part(g, 'stone', extrude(ring1, 0.1, 0.014), { line: 'mid' });
  // keystone + imposts
  kit.part(g, 'trim', extrude(polyPath(THREE.Shape, [[-0.16, 0], [0.16, 0], [0.11, 0.42], [-0.11, 0.42]]), 0.21, 0.012), { p: [cx, y1 + 0.02, 0], line: 'mid' });
  for (const sx of [-1, 1]) {
    kit.part(g, 'stone', new THREE.BoxGeometry(0.2, 0.09, 0.2), { p: [cx + sx * (r + 0.17), y1 - r - 0.05, 0.1], line: 'thin' });
  }

  // steps (two risers in front of the plinth ledge)
  const steps = [[1.9, 0.1, 0.42, 0.33], [2.2, 0.52, 0.4, 0.165]]; // [width, z start, depth, top]
  for (const [sw, zs, sd, top] of steps) {
    const st = extrude(rectPath(THREE.Shape, -sw / 2, 0, sw / 2, top), sd, 0.012);
    kit.part(g, 'stone', st, { p: [cx, 0, zs], line: 'mid' });
  }

  // door leaf pivots on its left hinge, recessed in the portal
  const wl = w - 0.08, hl = y1 - y0 - 0.03;
  const pivot = new THREE.Group();
  pivot.name = 'door';
  pivot.position.set(u + 0.04, y0 + 0.02, -0.3);
  pivot.userData.dynamic = true;
  pivot.userData.tag = 'door';
  pivot.userData.action = 'door';
  g.add(pivot);

  const leafShape = archPath(THREE.Shape, 0, 0, wl, hl, wl / 2);
  const glassTop = hl - 0.17, glassBot = 1.06;
  leafShape.holes.push(archPath(THREE.Path, 0.15, glassBot, wl - 0.15, glassTop, (wl - 0.3) / 2));
  const leaf = extrude(leafShape, 0.1, 0.01);
  leaf.translate(0, 0, -0.05);
  kit.part(pivot, 'door', leaf, { line: 'mid', angle: 40 });

  // lower raised panel framed in cream
  const panelRing = roundRectPath(THREE.Shape, 0.11, 0.13, wl - 0.11, 0.9, 0.03);
  panelRing.holes.push(roundRectPath(THREE.Path, 0.18, 0.2, wl - 0.18, 0.83, 0.02));
  kit.part(pivot, 'trim', extrude(panelRing, 0.04, 0.006), { p: [0, 0, 0.045], line: 'thin' });
  kit.part(pivot, 'door', extrude(roundRectPath(THREE.Shape, 0.18, 0.2, wl - 0.18, 0.83, 0.02), 0.025, 0.006), { p: [0, 0, 0.045], line: 'thin' });
  // glass + glazing bars
  const gs = archPath(THREE.Shape, 0.15, glassBot, wl - 0.15, glassTop, (wl - 0.3) / 2);
  kit.part(pivot, 'glass', new THREE.ShapeGeometry(gs, 24), { p: [0, 0, 0.0], line: 'none' });
  const gw = wl - 0.3, gcx = wl / 2, gh = glassTop - glassBot, gr = gw / 2;
  kit.part(pivot, 'trim', new THREE.BoxGeometry(0.045, gh - gr, 0.06), { p: [gcx, glassBot + (gh - gr) / 2, 0.0], line: 'thin' });
  kit.part(pivot, 'trim', new THREE.BoxGeometry(gw, 0.045, 0.06), { p: [gcx, glassBot + (gh - gr) * 0.5, 0.0], line: 'thin' });
  kit.part(pivot, 'trim', new THREE.BoxGeometry(gw, 0.045, 0.06), { p: [gcx, glassTop - gr, 0.0], line: 'thin' });
  kit.part(pivot, 'trim', new THREE.BoxGeometry(0.045, gr, 0.06), { p: [gcx, glassTop - gr / 2, 0.0], line: 'thin' });
  const gring = archPath(THREE.Shape, 0.1, glassBot - 0.05, wl - 0.1, glassTop + 0.05, (wl - 0.2) / 2);
  gring.holes.push(archPath(THREE.Path, 0.15, glassBot, wl - 0.15, glassTop, (wl - 0.3) / 2));
  kit.part(pivot, 'trim', extrude(gring, 0.045, 0.006), { p: [0, 0, 0.045], line: 'thin' });
  // glass highlights
  const hl2 = (x, y, ww, hh, sk) => polyPath(THREE.Shape, [[x, y], [x + ww, y], [x + ww + sk, y + hh], [x + sk, y + hh]]);
  kit.part(pivot, 'glassHi', new THREE.ShapeGeometry(hl2(0.24, glassBot + 0.1, 0.06, 0.55, 0.16)), { p: [0, 0, 0.012], line: 'none' });
  kit.part(pivot, 'glassHi', new THREE.ShapeGeometry(hl2(0.34, glassBot + 0.1, 0.022, 0.55, 0.16)), { p: [0, 0, 0.012], line: 'none' });
  // handle + push plate + kick plate
  kit.rod(pivot, 'yellow', [wl - 0.13, 1.0, 0.11], [wl - 0.13, 1.5, 0.11], 0.024, { line: 'thin' });
  for (const y of [1.04, 1.46]) kit.rod(pivot, 'yellow', [wl - 0.13, y, 0.07], [wl - 0.13, y, 0.115], 0.018, { line: 'none' });
  kit.part(pivot, 'yellow', new THREE.BoxGeometry(0.2, 0.12, 0.012), { p: [wl - 0.13, 0.5, 0.062], line: 'thin' });
  // hinges
  for (const y of [0.35, 1.2, 2.0]) kit.part(pivot, 'ink', new THREE.CylinderGeometry(0.022, 0.022, 0.16, 8), { p: [0.0, y, 0.055], line: 'none' });

  // hanging OPEN tag
  const tagTex = canvasTexture(256, 128, (ctx, W, H) => {
    ctx.fillStyle = '#F7F3E9'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#252525'; ctx.lineWidth = 6; ctx.strokeRect(10, 10, W - 20, H - 20);
    ctx.fillStyle = '#EF745F'; ctx.font = '700 62px "Playfair Display", Georgia, serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('OPEN', W / 2, H / 2 + 4);
  });
  const tagMat = new THREE.MeshBasicMaterial({ map: tagTex });
  tagMat.polygonOffset = true; tagMat.polygonOffsetFactor = -1; tagMat.polygonOffsetUnits = -1;
  const tag = kit.part(pivot, 'trim', new THREE.PlaneGeometry(0.34, 0.17), { p: [wl / 2, 1.0 + 0.0, 0.058], material: tagMat, keep: true, line: 'thin' });
  tag.userData.tex = tagTex;

  return { pivot, tagTex, o, cx, steps };
}

// the little café inside the portal, visible through the glass or when the door is open
export function buildInterior(kit, f) {
  const g = f.g;
  const o = doorOpening(f);
  const { u, w, y0, y1 } = o;
  const cx = u + w / 2, T = f.T;
  const zb = -T + 0.012;
  const back = archPath(THREE.Shape, u, y0, u + w, y1, w / 2);
  kit.part(g, 'interior', new THREE.ShapeGeometry(back, 24), { p: [0, 0, zb], line: 'none' });
  // wainscot stripe on the back wall
  kit.part(g, 'mint', new THREE.PlaneGeometry(w, 0.85), { p: [cx, y0 + 0.425, zb + 0.004], line: 'none' });
  // counter
  kit.part(g, 'wood', new THREE.BoxGeometry(w - 0.12, 0.8, 0.36), { p: [cx, y0 + 0.4, zb + 0.2], line: 'mid' });
  kit.part(g, 'cream', new THREE.BoxGeometry(w - 0.04, 0.05, 0.42), { p: [cx, y0 + 0.825, zb + 0.2], line: 'mid' });
  // espresso machine + cups
  kit.part(g, 'coral', new THREE.BoxGeometry(0.34, 0.26, 0.24), { p: [cx - 0.22, y0 + 0.98, zb + 0.22], line: 'mid' });
  kit.part(g, 'yellow', new THREE.BoxGeometry(0.36, 0.05, 0.26), { p: [cx - 0.22, y0 + 1.13, zb + 0.22], line: 'thin' });
  for (const dx of [0.14, 0.3]) kit.part(g, 'cream', new THREE.CylinderGeometry(0.045, 0.036, 0.07, 12), { p: [cx + dx, y0 + 0.885, zb + 0.28], line: 'thin' });
  // shelf with jars
  kit.part(g, 'woodDark', new THREE.BoxGeometry(w - 0.2, 0.04, 0.16), { p: [cx, y0 + 1.5, zb + 0.09], line: 'thin' });
  [['mint', -0.34], ['coral', -0.16], ['cream', 0.02], ['yellow', 0.2], ['sakura', 0.38]].forEach(([c, dx], i) =>
    kit.part(g, c, new THREE.CylinderGeometry(0.055, 0.055, 0.14 + (i % 2) * 0.04, 12), { p: [cx + dx, y0 + 1.59 + (i % 2) * 0.02, zb + 0.09], line: 'thin' }));
  // pendant lamps
  for (const dx of [-0.26, 0.28]) {
    kit.rod(g, 'ink', [cx + dx, y1 - 0.5, zb + 0.28], [cx + dx, y0 + 1.95, zb + 0.28], 0.008, { line: 'none', seg: 4 });
    kit.part(g, 'yellow', new THREE.ConeGeometry(0.13, 0.13, 16, 1, true), { p: [cx + dx, y0 + 1.9, zb + 0.28], line: 'thin' });
    kit.blob(g, 'cream', 0.04, [cx + dx, y0 + 1.84, zb + 0.28], { seg: 8 });
  }
}
