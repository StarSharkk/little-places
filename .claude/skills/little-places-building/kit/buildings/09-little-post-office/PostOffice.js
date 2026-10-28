import * as THREE from 'three';
import { createMaterials, themes } from './materials.js';
import { createAtlas } from './Atlas.js';
import { G, Front, Doors, Walls, Base } from './Shell.js';
import { Roofs } from './Roof.js';
import { Interior } from './Interior.js';
import { StreetDetails, MB } from './Props.js';
import { streetEdge } from '../shared/street.js';
import { timeline, ease } from '../shared/motion.js';

/** Little Post Office — independent model (PostOfficeRoot); no renderer, DOM or lights; the page drives every motion. Units: metres. */
export function createPostOffice(options = {}) {
  const root = new THREE.Group(); root.name = 'PostOfficeRoot';
  const m = createMaterials(), atlas = createAtlas();
  // edge style 'tactile' (after 02 Yamada Grocery): clean edge, yellow tactile strip, road along the front and right
  const ground = streetEdge(root, { style: 'tactile', x0: -5.4, x1: 5.8, z0: -2.9, z1: 4.2, corner: 1.4, sides: ['front', 'right'], width: 1.4 });
  Base(root, m);
  const walls = Walls(root, m, atlas);
  Interior(root, m, atlas);
  const front = Front(root, m, atlas);
  const doors = Doors(root, m, atlas);
  const roofs = Roofs(root, m, atlas);
  const street = StreetDetails(root, m, atlas), post = street.post, cart = street.cart;

  // ---- Send a letter: the envelope appears in front of the post box, glides to the slot and slips in -----------------
  const V = (x, y, z) => new THREE.Vector3(x, y, z), S = V(0, 1.25, 0.85), M = V(0, MB.slotY + 0.004, MB.r + 0.12), Q = V(0, 1.38, 0.62), I = V(0, MB.slotY + 0.004, MB.r - 0.22);
  const bez = (a, c, b, k) => a.clone().multiplyScalar((1 - k) ** 2).add(c.clone().multiplyScalar(2 * k * (1 - k))).add(b.clone().multiplyScalar(k * k));
  const letter = timeline(1.9, (t) => {
    const L = post.letter;
    // hidden with `visible`, never scale 0: batching inverts each moving group's transform, and scale 0 has no inverse
    if (t >= 1.7) { L.position.copy(S); L.scale.setScalar(1); L.visible = false; post.flapHinge.rotation.x = 0; return; }
    L.visible = true; L.scale.setScalar(Math.max(0.02, ease(t / 0.3)));
    if (t < 1.1) L.position.copy(bez(S, Q, M, ease((t - 0.3) / 0.8)));
    else L.position.lerpVectors(M, I, ease((t - 1.1) / 0.6));
    post.flapHinge.rotation.x = 0.9 * Math.sin(Math.PI * Math.min(1, Math.max(0, (t - 1.05) / 0.65)));
  });
  // ---- Deliver a parcel: lift, carry to the window, the flap swings up, in it goes, the flap shuts, a new one appears ----
  const P = cart.parcel, C = P.position.clone(), lift = C.clone().add(V(0, 0.18, 0));
  const win = (G.PWIN.x0 + G.PWIN.x1) / 2, sill = G.FLOOR + G.PWIN.y0 + 0.02, A = V(win, sill, G.WING.z1 + 0.3), B = V(win, sill, G.WING.z1 - 0.5), K = V((C.x + win) / 2, sill + 0.4, (C.z + A.z) / 2 + 0.1);
  const parcel = timeline(3.2, (t) => {
    const open = ease((t - 0.9) / 0.4) * (1 - ease((t - 2.1) / 0.4));
    walls.flapHinge.rotation.x = -1.25 * open;
    P.visible = t < 2.1 || t >= 2.6;
    if (t < 0.35) { P.position.lerpVectors(C, lift, ease(t / 0.35)); P.scale.setScalar(1); }
    else if (t < 1.5) P.position.copy(bez(lift, K, A, ease((t - 0.35) / 1.15)));
    else if (t < 2.1) P.position.lerpVectors(A, B, ease((t - 1.5) / 0.6));
    else { P.position.copy(C); P.scale.setScalar(Math.max(0.02, ease((t - 2.6) / 0.6))); }   // gone inside; a new parcel grows back on the cart
  });

  root.position.set(...(options.position ?? [0, 0, 0]));
  const setDoor = (a) => { doors[0].hinge.rotation.y = -1.3 * a; doors[1].hinge.rotation.y = 1.3 * a; };
  const glassDay = new THREE.Color('#BFE0E4'), glassNight = new THREE.Color('#FFD78A');
  return {
    group: root, materials: m, atlas, front, roofs, doors, post, cart, walls,
    dynamic: [front, roofs, ...doors.map(d => d.leaf), post.body, post.flap, post.letter, cart.cart, P, walls.flap],
    outlineMaterials: [m.hull],
    shadowFloor: ground.floors,
    labels: [
      ['Clock Tower', [G.TOWER.cx, G.TOWER.top + 0.9, G.TOWER.cz + 0.4]], ['Curved Glass Hall', [-3.0, 3.0, 1.4]], ['Post Box', [2.1, 1.75, 2.95]],
      ['Parcel Window', [3.45, 2.75, 1.85]], ['Rooftop Garden', [1.4, G.TOP + 1.3, -0.95]], ['Upstairs Sorting Room', [-3.75, G.F2 + 1.0, 0.7]],
    ],
    animate(dt) { const a = letter.step(dt), b = parcel.step(dt); return a || b; },
    sendLetter(instant = false) { letter.start(instant); },
    deliverParcel(instant = false) { parcel.start(instant); },
    get letterRunning() { return letter.running; },
    get parcelRunning() { return parcel.running; },
    setDoor,
    // buttons and click targets for a generic viewer (the skill's kit); the Little Places page wires its own.
    // `set` takes an eased amount 0–1 for a toggle, `run(instant)` starts a one-off sequence
    interactions: [
      { action: 'postDoor', label: ['Open the door', 'Close the door'], set: setDoor },
      { action: 'postLetter', label: 'Send a letter', run: (instant) => letter.start(instant) },
      { action: 'postParcel', label: 'Deliver a parcel', run: (instant) => parcel.start(instant) },
    ],
    // night: the glass hall and doors glow warm from inside (lamps, clock, signs are unlit and light themselves)
    setNight(t) { m.glass.color.copy(glassDay).lerp(glassNight, t); m.glass.opacity = 0.16 + 0.3 * t; },
    setSeeThrough(on) { front.visible = !on; roofs.visible = !on; },
    setPalette(i) { const t = themes[i % themes.length]; for (const k of ['wall', 'wall2', 'roof', 'frame', 'cap', 'awning', 'deck']) m[k].color.set(t[k]); },
  };
}
export { themes, G };
