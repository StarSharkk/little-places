// SAKURA CAFÉ — assembles the corner building into a single reusable THREE.Group.
//
//   const cafe = createCafe({ paletteIndex: 0, decorationDensity: 1 });
//   street.add(cafe.group);               // drop into an existing street scene
//   cafe.group.position.set(x, 0, z);
//
// Everything is merged per material at the end (a dozen draw calls) and outlined with
// screen-space-width lines. `cafe.pickables` lists the interactive roots (door, sign, blackboard).
import * as THREE from 'three';
import { Kit, extrude, rectPath, polyPath } from './kit.js';
import { PALETTES, SHOPS, defaults } from './config.js';
import { makeGeometry, makeFrames, buildWalls, wallPanel, makeFrame } from './Walls.js';
import { buildRoof } from './Roof.js';
import { WIN, addWindow, addOculus, openingPath } from './Window.js';
import { buildDoor, buildInterior, doorOpening } from './Door.js';
import { addAwning } from './Awning.js';
import { buildSign, buildRoundSign } from './Sign.js';
import { buildGround } from './Ground.js';
import { buildDecoration } from './Decoration.js';

function holePath(s) {
  if (s.kind === 'circle') { const p = new THREE.Path(); p.absarc(s.cx, s.cy, s.r, 0, Math.PI * 2, true); return p; }
  return openingPath(s);
}

export function createCafe(options = {}) {
  const cfg = {
    ...defaults, ...options,
    facades: { ...defaults.facades, ...(options.facades || {}) },
    plate: { ...defaults.plate, ...(options.plate || {}) },
  };
  const palette = PALETTES[options.paletteIndex ?? 0];
  const kit = new Kit(palette, cfg.lineWeights);
  const group = new THREE.Group();
  group.name = 'SakuraCafe';
  const G = makeGeometry(cfg);
  const frames = makeFrames(group, cfg);
  const { L, C, R, B, W } = frames;

  // ---- openings ----------------------------------------------------------------
  const disp = (u, w, o = {}) => ({ kind: 'rect', comp: 'display', u, w, y0: WIN.displayY0, y1: WIN.displayY1, ...o });
  const upper = (u, w, o = {}) => ({ kind: 'arch', comp: 'arch', u, w, y0: WIN.upperY0, y1: WIN.upperY1, ...o });
  const ur = cfg.Zf - cfg.chamfer - G.zr;
  const spec = {
    L: [...cfg.facades.L.display.map(d => disp(d.u, d.w)), ...cfg.facades.L.upper.map(d => upper(d.u, d.w))],
    R: [...cfg.facades.R.display.map(d => disp(d.u, d.w)), ...cfg.facades.R.upper.map(d => upper(d.u, d.w)),
      { kind: 'circle', comp: 'oculus', cx: ur, cy: G.Hr - 1.3, r: 0.36 }],
    C: [
      { ...doorOpening(C), comp: 'door' },
      { kind: 'circle', comp: 'oculus', cx: C.len / 2, cy: 5.48, r: 0.33 },
    ],
    B: [0.9, 3.15, 5.4].flatMap(u => [disp(u, 1.1, { y0: 1.15, y1: 2.7, bulkhead: false }), upper(u, 1.1, { shutters: true, box: true })]),
    W: [upper(2.15, 1.1), { kind: 'circle', comp: 'oculus', cx: G.zr + cfg.Zb, cy: G.Hr - 1.3, r: 0.36 }],
  };

  buildWalls(kit, group, frames, G, cfg, name => spec[name].map(holePath));
  for (const [name, list] of Object.entries(spec)) {
    for (const s of list) {
      if (s.comp === 'display' || s.comp === 'arch') addWindow(kit, frames[name], s);
      else if (s.comp === 'oculus') addOculus(kit, frames[name].g, s.cx, s.cy, s.r);
    }
  }

  buildRoof(kit, group, cfg, G);

  // ---- entrance, signage, awnings --------------------------------------------
  const door = buildDoor(kit, C);
  buildInterior(kit, C);
  const sign = buildSign(kit, C, cfg);
  const roundSign = buildRoundSign(kit, R.g, 3.0, 3.55, SHOPS[cfg.shop].round);
  const aw = (f, u, w, extra = {}) => addAwning(kit, f.g, { u, w, y: 3.3, depth: 0.88, drop: 0.42, valance: 0.2, ...extra });
  const l0 = cfg.facades.L.display[0].u - 0.3, l1 = cfg.facades.L.display.at(-1).u + cfg.facades.L.display.at(-1).w + 0.3;
  aw(L, l0, l1 - l0);
  const r0 = cfg.facades.R.display[0].u - 0.3, r1 = cfg.facades.R.display[0].u + cfg.facades.R.display[0].w + 0.3;
  aw(R, r0, r1 - r0);

  const annex = cfg.annex ? buildAnnex(kit, group, cfg, G) : null;

  // ---- ground + shadow -----------------------------------------------------------
  const ground = options.ground === false ? null : buildGround(kit, group, cfg);
  const deco = buildDecoration(kit, group, cfg, G, frames, { ground, annex });

  if (ground) addShadowCasters(ground, cfg, G, annex, deco);

  // ---- bake (merge + outline) ---------------------------------------------------
  kit.bakeAll(group);
  kit.syncLineColors();

  // ---- runtime API ------------------------------------------------------------------
  const pickables = [door.pivot, sign.group, ...(deco.pickables || [])];
  const state = { open: 0, openTarget: 0, palette: options.paletteIndex ?? 0 };
  const OPEN_ANGLE = -1.05; // swings outward over the steps (still shows its face to the camera)
  const api = {
    group, kit, cfg, frames, pickables, ground, state, shop: SHOPS[cfg.shop],
    // everything a host must keep in sync with its canvas size (line materials + the hull shader)
    outlineMaterials: [...Object.values(kit.lineMats), { resolution: { set: (w, h) => kit.hullMat.uniforms.uRes.value.set(w, h) } }],
    palettes: PALETTES,
    toggleDoor() { state.openTarget = state.openTarget ? 0 : 1; return state.openTarget; },
    setPalette(i) { state.palette = i; kit.setPalette(PALETTES[i]); kit.syncLineColors(); },
    setHover(tag, v) { kit.setHover(tag, v); },
    // returns true while something is animating
    update(dt) {
      let busy = false;
      const d = state.openTarget - state.open;
      if (Math.abs(d) > 0.0005) {
        state.open += d * Math.min(1, dt * 7);
        const e = state.open * state.open * (3 - 2 * state.open);
        door.pivot.rotation.y = OPEN_ANGLE * e;
        busy = true;
      } else if (state.open !== state.openTarget) {
        state.open = state.openTarget; door.pivot.rotation.y = OPEN_ANGLE * state.open;
      }
      return busy;
    },
    updateShadow(lx, ly, lz) { ground?.update(lx, ly, lz); },
    setResolution(w, h) { kit.setResolution(w, h); },
    refreshFonts() {
      for (const o of [door.tagTex, sign.tex, roundSign.tex, ...(deco.textures || [])]) o?.userData.redraw?.();
    },
    bounds: cfg.plate,
  };
  return api;
}

function addShadowCasters(ground, cfg, G, annex, deco) {
  const { Xb, Xf, Zb, Zf, chamfer: c, overhang: e } = cfg;
  const { foot, H, Hr, zr } = G;
  // walls prism
  ground.casters.push(foot.flatMap(([x, z]) => [[x, 0, z], [x, H, z]]));
  // roof prism (with overhang) incl. ridge
  ground.casters.push([
    [-Xb - e, H - 0.4, Zf + e], [Xf + e, H - 0.4, Zf + e], [Xf + e, H - 0.4, -Zb - e], [-Xb - e, H - 0.4, -Zb - e],
    [-Xb - e, Hr, zr], [Xf + e, Hr, zr],
  ]);
  // chimney
  const cx = cfg.chimneyX;
  ground.casters.push([[-0.41, 1, -0.37], [0.41, 1, -0.37], [0.41, 1, 0.37], [-0.41, 1, 0.37]].flatMap(([x, , z]) =>
    [[cx + x, Hr - 0.6, zr + z], [cx + x, Hr + 1.5, zr + z]]));
  if (annex) ground.casters.push(annex.casterPoints);
  if (deco?.casters) deco.casters.forEach(c => ground.casters.push(c));
}

// ---- low service annex on the left ------------------------------------------
function buildAnnex(kit, group, cfg, G) {
  const { Xb, Zf } = cfg;
  const aw = 2.3, az0 = -1.9, ha = 3.7, t = 0.3;
  const xl = -Xb - aw;
  const front = makeFrame(group, 'AF', [xl, 0, Zf], 0, aw, t);
  const side = makeFrame(group, 'AS', [xl, 0, az0], -Math.PI / 2, Zf - az0, t);

  const fspec = { kind: 'arch', comp: 'arch', u: 0.5, w: 1.3, y0: 1.0, y1: 2.9, shutters: false, box: true };
  wallPanel(kit, front, [[0, 0], [aw, 0], [aw, ha], [0, ha]], [openingPath(fspec)]);
  addWindow(kit, front, fspec);
  const sspec = { kind: 'rect', comp: 'display', u: 1.0, w: 1.5, y0: 1.2, y1: 2.8, bulkhead: false };
  wallPanel(kit, side, [[0, 0], [Zf - az0, 0], [Zf - az0, ha], [0, ha]], [openingPath(sspec)]);
  addWindow(kit, side, sspec);

  // core + plinth
  kit.part(group, 'wallDeep', new THREE.BoxGeometry(aw - 0.25, ha, Zf - az0 - 0.25), { p: [xl + aw / 2 + 0.15, ha / 2, (Zf + az0) / 2 - 0.1], line: 'none' });
  kit.part(group, 'stone', extrude(rectPath(THREE.Shape, -aw / 2 - 0.08, -(Zf - az0) / 2 - 0.08, aw / 2 + 0.08, (Zf - az0) / 2 + 0.08), 0.5, 0.02).rotateX(-Math.PI / 2),
    { p: [xl + aw / 2, 0, (Zf + az0) / 2], line: 'outer' });

  // lean-to roof
  const e = 0.4, sa = 0.26, tt = 0.15;
  const shape = polyPath(THREE.Shape, [[xl - e, -(az0 - e)], [-Xb + 0.0, -(az0 - e)], [-Xb + 0.0, -(Zf + e)], [xl - e, -(Zf + e)]]);
  const slab = extrude(shape, tt, 0.015);
  slab.rotateX(-Math.PI / 2);
  slab.applyMatrix4(new THREE.Matrix4().set(1, 0, 0, 0, 0, 1, -sa, ha + sa * Zf - tt, 0, 0, 1, 0, 0, 0, 0, 1));
  kit.part(group, 'roof', slab, { line: 'outer', angle: 25 });
  // roof tiles
  const lines = [];
  const yTop = z => ha + sa * (Zf - z);
  for (let z = Zf + e - 0.4; z > az0 - e + 0.2; z -= 0.4) lines.push(xl - e + 0.05, yTop(z) + 0.03, z, -Xb - 0.02, yTop(z) + 0.03, z);
  kit.seg(group, 'hatch', lines);
  // fascia + cornice
  kit.beam(group, 'trim', [xl - e, yTop(Zf + e) - 0.14, Zf + e + 0.035], [-Xb, yTop(Zf + e) - 0.14, Zf + e + 0.035], 0.26, 0.07, { line: 'mid' });
  kit.beam(group, 'trim', [xl - e - 0.035, yTop(Zf + e) - 0.14, Zf + e], [xl - e - 0.035, yTop(az0 - e) - 0.14, az0 - e], 0.26, 0.07, { line: 'mid' });
  kit.part(front.g, 'trim', new THREE.BoxGeometry(aw + 0.12, 0.2, 0.16), { p: [aw / 2, ha - 0.1, 0.08], line: 'mid' });
  kit.part(side.g, 'trim', new THREE.BoxGeometry(Zf - az0 + 0.12, 0.2, 0.16), { p: [(Zf - az0) / 2, ha - 0.1, 0.08], line: 'mid' });
  kit.part(front.g, 'trim', new THREE.BoxGeometry(aw + 0.1, 0.16, 0.1), { p: [aw / 2, 0.58, 0.05], line: 'mid' });

  const casterPoints = [];
  for (const x of [xl - e, -Xb]) for (const z of [az0 - e, Zf + e]) casterPoints.push([x, 0, z], [x, ha + 0.2, z]);
  return { frames: { front, side }, casterPoints, xl, az0, ha, aw };
}
