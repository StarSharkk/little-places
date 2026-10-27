// Signage: the SAKURA CAFÉ fascia board (clickable) and a round vintage projecting sign.
import * as THREE from 'three';
import { extrude, roundRectPath, canvasTexture } from './kit.js';
import { SHOPS } from './config.js';

const SERIF = '"Playfair Display", "Didot", "Bodoni 72", Georgia, serif';

function sakura(ctx, x, y, r, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.fillStyle = '#EFA8C4';
  for (let i = 0; i < 5; i++) {
    ctx.save(); ctx.rotate((i * Math.PI * 2) / 5);
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-r * 0.62, -r * 0.35, -r * 0.5, -r * 1.05, -r * 0.08, -r * 0.86);
    ctx.lineTo(0, -r * 0.7); ctx.lineTo(r * 0.08, -r * 0.86);
    ctx.bezierCurveTo(r * 0.5, -r * 1.05, r * 0.62, -r * 0.35, 0, 0);
    ctx.fill(); ctx.restore();
  }
  ctx.fillStyle = '#F6C445'; ctx.beginPath(); ctx.arc(0, 0, r * 0.14, 0, 7); ctx.fill();
  ctx.restore();
}

function texMat(tex) {
  const m = new THREE.MeshBasicMaterial({ map: tex });
  m.polygonOffset = true; m.polygonOffsetFactor = -1; m.polygonOffsetUnits = -1;
  return m;
}

export function buildSign(kit, f, cfg) {
  const sub = SHOPS[cfg.shop].sub;
  const bw = 2.04, bh = 0.92;
  const cx = f.len / 2;
  const grp = new THREE.Group();
  grp.name = 'sign';
  grp.position.set(cx - bw / 2, 3.74, 0.0);
  grp.userData.dynamic = true;
  grp.userData.tag = 'sign';
  grp.userData.action = 'menu';
  f.g.add(grp);

  const frame = roundRectPath(THREE.Shape, -0.08, -0.08, bw + 0.08, bh + 0.08, 0.07);
  frame.holes.push(roundRectPath(THREE.Path, 0.0, 0.0, bw, bh, 0.04));
  kit.part(grp, 'trim', extrude(frame, 0.17, 0.014), { line: 'mid' });
  kit.part(grp, 'ink', extrude(roundRectPath(THREE.Shape, 0, 0, bw, bh, 0.04), 0.1), { p: [0, 0, 0.0], line: 'none' });
  // cap moulding + lower drip
  kit.part(grp, 'stone', new THREE.BoxGeometry(bw + 0.34, 0.07, 0.24), { p: [bw / 2, bh + 0.15, 0.1], line: 'mid' });
  kit.part(grp, 'stone', new THREE.BoxGeometry(bw + 0.2, 0.05, 0.2), { p: [bw / 2, -0.15, 0.09], line: 'thin' });
  for (const sx of [0.12, bw - 0.12]) kit.part(grp, 'stone', new THREE.BoxGeometry(0.1, 0.12, 0.17), { p: [sx, -0.2, 0.085], line: 'thin' });

  const tex = canvasTexture(1632, 736, (ctx, W, H) => {
    ctx.fillStyle = '#252525'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#F6C445'; ctx.lineWidth = 7;
    ctx.strokeRect(30, 30, W - 60, H - 60);
    ctx.lineWidth = 3; ctx.strokeStyle = '#F7F3E9';
    ctx.strokeRect(48, 48, W - 96, H - 96);
    ctx.fillStyle = '#F7F3E9';
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    // line 1: SAKURA, fitted to the board
    let size = 330;
    if ('letterSpacing' in ctx) ctx.letterSpacing = '10px';
    do { ctx.font = `700 ${size}px ${SERIF}`; size -= 6; } while (ctx.measureText('SAKURA').width > W - 220 && size > 80);
    ctx.fillText('SAKURA', W / 2 + 5, 345);
    // line 2: blossoms and rules either side of the shop word (CAFÉ / SWEETS…)
    ctx.fillStyle = '#F6C445';
    if ('letterSpacing' in ctx) ctx.letterSpacing = '26px';
    ctx.font = `700 150px ${SERIF}`;
    const half = ctx.measureText(sub).width / 2 + 70;
    ctx.fillText(sub, W / 2 + 13, 560);
    sakura(ctx, W / 2 - half, 515, 54, 0.2);
    sakura(ctx, W / 2 + half, 515, 54, -0.3);
    ctx.strokeStyle = '#F7F3E9'; ctx.lineWidth = 3;
    for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(W / 2 + sx * (half + 70), 515); ctx.lineTo(W / 2 + sx * 690, 515); ctx.stroke(); }
  });
  const text = kit.part(grp, 'ink', new THREE.PlaneGeometry(bw, bh), { p: [bw / 2, bh / 2, 0.104], material: texMat(tex), keep: true, line: 'none' });
  text.userData.tex = tex;

  // wall brackets
  for (const sx of [0.3, bw - 0.3]) kit.part(grp, 'ink', new THREE.BoxGeometry(0.07, 0.07, 0.1), { p: [sx, bh + 0.05, -0.04], line: 'none' });
  return { group: grp, tex };
}

// round vintage hanging sign on an iron bracket. Placed in the façade frame at (u, y), projecting along +z.
export function buildRoundSign(kit, g, u, y, round = SHOPS.cafe.round) {
  const grp = new THREE.Group();
  grp.position.set(u, y, 0);
  g.add(grp);
  // bracket: wall plate, arm, scroll
  kit.part(grp, 'ink', new THREE.BoxGeometry(0.08, 0.4, 0.04), { p: [0, 0, 0.02], line: 'none' });
  kit.beam(grp, 'ink', [0, 0.17, 0.02], [0, 0.17, 0.82], 0.04, 0.04, { line: 'none' });
  kit.rod(grp, 'ink', [0, 0.0, 0.03], [0, 0.17, 0.62], 0.014, { line: 'none', seg: 5 });
  const scroll = new THREE.TorusGeometry(0.1, 0.012, 6, 14, Math.PI * 1.5);
  kit.part(grp, 'ink', scroll, { p: [0, 0.06, 0.15], r: [0, Math.PI / 2, Math.PI * 0.2], line: 'none' });
  // hanging chains + disc
  const sx = 0.0, sz = 0.7, R = 0.36;
  for (const dx of [-0.2, 0.2]) kit.rod(grp, 'ink', [sx, 0.17, sz + dx], [sx, 0.03, sz + dx * 0.9], 0.008, { line: 'none', seg: 4 });
  const disc = new THREE.CylinderGeometry(R, R, 0.07, 36);
  disc.rotateZ(Math.PI / 2);
  kit.part(grp, 'coral', disc, { p: [sx, -0.33, sz], line: 'mid' });
  const rim = new THREE.TorusGeometry(R, 0.024, 8, 36);
  rim.rotateY(Math.PI / 2);
  kit.part(grp, 'trim', rim, { p: [sx + 0.036, -0.33, sz], line: 'none' });
  kit.part(grp, 'trim', rim.clone(), { p: [sx - 0.036, -0.33, sz], line: 'none' });
  const tex = canvasTexture(512, 512, (ctx, W, H) => {
    ctx.fillStyle = '#EF745F'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#F7F3E9'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#F7F3E9';
    if (round.icon === 'cupcake') {
      // cupcake: fluted liner, swirled cream, a cherry on top
      ctx.beginPath(); ctx.moveTo(170, 250); ctx.lineTo(342, 250); ctx.lineTo(318, 362); ctx.lineTo(194, 362); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#EF745F'; ctx.lineWidth = 9;
      for (const x of [214, 240, 266, 292]) { ctx.beginPath(); ctx.moveTo(x + 4, 262); ctx.lineTo(x - 2 + (x - 256) * 0.1, 352); ctx.stroke(); }
      ctx.fillStyle = '#F7F3E9';
      for (const [x, y, r] of [[256, 222, 92], [256, 176, 66], [256, 138, 42]]) { ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.42, 0, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#B9314D'; ctx.beginPath(); ctx.arc(262, 92, 20, 0, Math.PI * 2); ctx.fill();
    } else {
      // cup
      ctx.beginPath(); ctx.moveTo(150, 220); ctx.lineTo(330, 220); ctx.quadraticCurveTo(325, 340, 240, 340); ctx.quadraticCurveTo(155, 340, 150, 220); ctx.fill();
      ctx.lineWidth = 22; ctx.strokeStyle = '#F7F3E9'; ctx.beginPath(); ctx.arc(342, 258, 36, -1.2, 1.5); ctx.stroke();
      ctx.fillRect(130, 352, 220, 16);
      ctx.strokeStyle = '#F7F3E9'; ctx.lineWidth = 12; ctx.lineCap = 'round';
      for (const x of [200, 245, 290]) { ctx.beginPath(); ctx.moveTo(x, 190); ctx.bezierCurveTo(x - 20, 160, x + 20, 140, x, 105); ctx.stroke(); }
    }
    ctx.font = `700 58px ${SERIF}`; ctx.fillStyle = '#F7F3E9';
    ctx.fillText(round.label, W / 2, 432);
  });
  for (const side of [1, -1]) {
    const m = texMat(tex);
    const p = new THREE.CircleGeometry(R - 0.03, 36);
    const mesh = kit.part(grp, 'ink', p, { p: [sx + side * 0.0385, -0.33, sz], r: [0, side * Math.PI / 2, 0], material: m, keep: true, line: 'none' });
    mesh.userData.tex = tex;
  }
  return { tex };
}
