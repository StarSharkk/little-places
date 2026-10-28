import * as THREE from 'three';
import { group, box, plate, cylinder, sphere, mesh, cached, rounded, rectPath } from './primitives.js';
import { hull } from './outline.js';
import { G, rng } from './Building.js';
import { ABoard } from './ABoard.js';
import { Basket, Bottle } from './Interior.js';
import { plant, Bicycle, Bench, CherryTree, StreetLamp } from '../shared/props.js';
export { plant };

const inked = (o, m) => (hull(o, m.hull), o);


// ---- the detergent vending machine (interactive) ---------------------------------------------------------------
// Local origin on the ground, front +z. The display window and the pickup bin are real holes through the cabinet.
const V = { W: 0.92, H: 1.86, D: 0.72, win: [-0.38, 0.78, 0.16, 1.64], bin: [-0.32, 0.18, 0.12, 0.44] };
function VendingMachine(p, m, atlas, pos, turn) {
  const { W, H, D, win, bin } = V, front = D / 2, root = group(p, 'Detergent vending machine', pos); root.rotation.y = turn;
  const body = group(root, 'Buy detergent'); body.userData.action = 'laundryVend';
  const geo = cached('vend-body', () => {
    const s = rounded(W, H, 0.06), c = (r) => rectPath(THREE.Path, r[0], r[1] - H / 2, r[2], r[3] - H / 2);
    s.holes.push(c(win), c(bin));
    const e = new THREE.ExtrudeGeometry(s, { depth: D, bevelEnabled: false, curveSegments: 8 }); e.translate(0, H / 2, -D / 2); return e;
  });
  mesh(body, geo, m.vendBody, [0, 0, 0]);
  box(body, W - 0.04, H - 0.04, 0.03, m.vendBody, [0, H / 2, -front + 0.03]);                    // back panel
  box(body, win[2] - win[0], win[3] - win[1], 0.02, m.paper, [(win[0] + win[2]) / 2, (win[1] + win[3]) / 2, -front + 0.06], false);
  plate(body, W - 0.08, 0.22, 0.04, 0.03, m.frame, [0, H - 0.14, front + 0.01]); atlas.attach(body, 'vend', W - 0.14, 0.17, [0, H - 0.14, front + 0.032]);
  // three shelves of bottles, set back so there is a drop gap in front of them
  const shelfFront = front - 0.13, shelves = [0.82, 1.1, 1.38], cols = [-0.28, -0.11, 0.06];
  for (const y of shelves) { box(body, win[2] - win[0] - 0.02, 0.02, D - 0.2, m.steel, [(win[0] + win[2]) / 2, y, shelfFront - (D - 0.2) / 2]); atlas.attach(body, 'price', 0.1, 0.05, [cols[1] - 0.01, y - 0.035, shelfFront + 0.002]); }
  const kinds = [m.bottleBlue, m.bottlePink, m.bottleGreen, m.bottleYellow];
  shelves.forEach((y, r) => cols.forEach((x, c) => { if (r === 1 && c === 1) return; Bottle(body, m, [x, y + 0.01, shelfFront - 0.05], kinds[(r + c) % 4], 0.75); }));
  box(body, win[2] - win[0], win[3] - win[1], 0.012, m.glass, [(win[0] + win[2]) / 2, (win[1] + win[3]) / 2, front - 0.03], false);
  const ref = box(body, 0.02, 0.5, 0.006, m.reflection, [win[0] + 0.12, 1.25, front - 0.02], false); ref.rotation.z = -0.25;
  // pickup bin: a dark tray inside the lower hole
  box(body, bin[2] - bin[0], 0.02, D * 0.5, m.rubber, [(bin[0] + bin[2]) / 2, bin[1] + 0.01, front - D * 0.25]);
  box(body, bin[2] - bin[0], bin[3] - bin[1], 0.02, m.rubber, [(bin[0] + bin[2]) / 2, (bin[1] + bin[3]) / 2, front - D * 0.5]);
  // button panel, coin and note slots, the pickup light
  for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++) { if (r === 1 && c === 0) continue; const b = cylinder(body, 0.028, 0.028, 0.02, [m.coral, m.shirtYellow][c], [0.27 + c * 0.1, 1.42 - r * 0.2, front + 0.012], false, 12); b.rotation.x = Math.PI / 2; }
  box(body, 0.12, 0.02, 0.012, m.ink, [0.32, 0.9, front + 0.006], false); box(body, 0.04, 0.09, 0.012, m.ink, [0.32, 0.72, front + 0.006], false);
  const light = sphere(root, [0.03, 0.02, 0.012], m.pickup, [(bin[0] + bin[2]) / 2, bin[3] + 0.06, front + 0.006], [10, 6]);
  for (const x of [-W / 2 + 0.1, W / 2 - 0.1]) box(root, 0.1, 0.05, D - 0.1, m.rubber, [x, 0.025, 0], false);
  // moving parts (each its own group): the chosen button, the bottle, the pickup flap
  const button = group(root, 'Vending button', [0.27, 1.22, front + 0.012]); button.userData.action = 'laundryVend';
  const bb = cylinder(button, 0.03, 0.03, 0.024, m.coral, [0, 0, 0], false, 12); bb.rotation.x = Math.PI / 2; sphere(button, [0.012, 0.012, 0.006], m.paper, [0, 0, 0.013], [6, 4]);
  const bottle = group(root, 'Chosen bottle', [cols[1], shelves[1] + 0.01, shelfFront - 0.05]);
  Bottle(bottle, m, [0, 0, 0], m.bottleBlue, 0.75);
  const flapHinge = group(root, 'Pickup flap hinge', [(bin[0] + bin[2]) / 2, bin[3], front + 0.006]);
  const flap = group(flapHinge, 'Pickup flap');
  plate(flap, bin[2] - bin[0] + 0.02, bin[3] - bin[1] + 0.01, 0.015, 0.02, m.steel, [0, -(bin[3] - bin[1]) / 2, 0]);
  box(flap, 0.16, 0.02, 0.012, m.steelDark, [0, -(bin[3] - bin[1]) + 0.05, 0.01], false);
  // the route: forward into the drop gap, down behind the cabinet face, into the bin
  const route = [[cols[1], shelves[1] + 0.01, shelfFront - 0.05], [cols[1], shelves[1] + 0.03, front - 0.085], [cols[1], bin[1] + 0.03, front - 0.085], [cols[1] + 0.04, bin[1] + 0.03, front - 0.12]].map(v => new THREE.Vector3(...v));
  const legs = route.slice(1).map((v, i) => v.distanceTo(route[i])), total = legs.reduce((a, b) => a + b, 0);
  const along = (u, out) => { let d = u * total; for (let i = 0; i < legs.length; i++) { if (d <= legs[i] || i === legs.length - 1) return out.lerpVectors(route[i], route[i + 1], Math.min(1, d / legs[i])); d -= legs[i]; } return out; };
  return { root, body, button, bottle, flapHinge, flap, light, along, start: route[0] };
}

// The vending sequence, timed in seconds and advanced by deltaTime:
// press 0–0.3 · travel 0.3–1.7 · flap opens 1.7–2.1 (pickup light on) · wait · taken 2.7–3.1 · close and restock 3.1–3.6
export function vendingSequence(v, m, light) {
  const ease = k => k * k * (3 - 2 * k), clamp = THREE.MathUtils.clamp, END = 3.6;
  const s = { t: -1 };
  const pose = (t) => {
    v.button.position.z = V.D / 2 + 0.012 - 0.016 * Math.sin(Math.PI * clamp(t / 0.3, 0, 1));
    const travel = ease(clamp((t - 0.3) / 1.4, 0, 1));
    if (t < 3.1) { v.along(travel, v.bottle.position); v.bottle.scale.setScalar(1 - ease(clamp((t - 2.7) / 0.4, 0, 1))); }
    else { v.bottle.position.copy(v.start); v.bottle.scale.setScalar(ease(clamp((t - 3.1) / 0.5, 0, 1))); }   // restocked unseen at scale 0, then grows back
    const open = ease(clamp((t - 1.7) / 0.4, 0, 1)) * (1 - ease(clamp((t - 3.1) / 0.4, 0, 1)));
    v.flapHinge.rotation.x = 1.2 * open;
    light.color.set(t >= 1.7 && t < END - 0.1 ? '#FFD66B' : '#6E7A7E');
  };
  return {
    get running() { return s.t >= 0; },
    start(instant) { if (s.t >= 0) return; if (instant) { pose(END); return; } s.t = 0; },
    step(dt) { if (s.t < 0) return false; s.t += dt; if (s.t >= END) { s.t = -1; pose(END); return false; } pose(s.t); return true; },
    pose,
  };
}


export function StreetDetails(root, m, atlas) {
  const { GROUND: Y } = G, g = group(root, 'Life around the laundry');
  Bench(g, m, [-1.35, Y, 2.95], 0);
  Basket(g, m, [-0.85, Y + 0.47, 2.92], { mat: m.basketPink, w: 0.42, d: 0.32, h: 0.22, turn: 0.1 });
  ABoard(g, m, atlas, [-2.75, Y, 3.25], 0.3);
  StreetLamp(g, m, [-3.95, Y, 2.75]);
  CherryTree(g, m, [-3.85, Y, 0.95]);
  const r = rng(11);
  for (let i = 0; i < 18; i++) { const a = r() * 6.28, d = 0.5 + r() * 1.6; const pt = cylinder(g, 0.03 + r() * 0.015, 0.03, 0.004, i % 3 ? m.blossom : m.blossomDeep, [-3.6 + Math.cos(a) * d, Y + 0.004, 1.6 + Math.sin(a) * d * 0.9], false, 6); pt.rotation.y = r() * 3; }
  Bicycle(g, m, [2.95, Y, 3.3], 0.12);
  Basket(g, m, [4.2, Y, 2.55], { mat: m.basketBlue, turn: -0.3 });
  Basket(g, m, [4.2, Y + 0.27, 2.55], { mat: m.basketPink, w: 0.44, d: 0.32, h: 0.2, turn: -0.2, full: true });
  plant(g, m, [0.18, Y, 2.52], { r: 0.16, h: 0.26, kind: 'leafy' });
  plant(g, m, [1.98, Y, 2.62], { r: 0.15, h: 0.24, kind: 'flowers' });
  plant(g, m, [4.45, Y, -1.65], { r: 0.2, h: 0.32, kind: 'bush' });
  plant(g, m, [4.45, Y, 0.75], { r: 0.18, h: 0.3, kind: 'leafy' });
  plant(g, m, [-3.85, Y, -1.7], { r: 0.17, h: 0.28, kind: 'bush' });
  // drain grate and a manhole cover in the pavement
  box(g, 0.62, 0.012, 0.24, m.iron, [0.95, Y + 0.006, 3.72], false);
  for (let i = 0; i < 6; i++) box(g, 0.012, 0.014, 0.2, m.steelDark, [0.7 + i * 0.1, Y + 0.008, 3.72], false);
  inked(cylinder(g, 0.32, 0.32, 0.016, m.steelDark, [-0.45, Y + 0.008, 3.55], true, 28), m);
  for (let i = 0; i < 4; i++) box(g, 0.5 - i * 0.1, 0.004, 0.02, m.iron, [-0.45, Y + 0.018, 3.43 + i * 0.08], false);
  // the vending machine stands against the right wall, facing the street
  const v = VendingMachine(g, m, atlas, [G.X1 + 0.42, Y, -0.3], Math.PI / 2);
  return { group: g, vending: v };
}
