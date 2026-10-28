// Starter for a new Little Places building. Copy to buildings/NN-name/<Name>.js, rename createShop,
// then split into Architecture / Interior / Props / Atlas modules as it grows (see buildings/06-little-bookshop/).
import * as THREE from 'three';
import { group, box, plate, rod, cylinder, sphere, rectPath, wallWithHoles, PavedBase } from './primitives.js';

// Shared measurements in metres (style.md → Proportions). +z is the main façade, +x the side entrance.
export const G = {
  GROUND: 0.155, FLOOR: 0.505,              // street surface on the paved base; raised shop floor
  X0: -2.9, X1: 2.9, Z0: -1.9, Z1: 1.7, T: 0.2,
  TOP: 3.65,                                // underside of the roof slab (≈ 3.1 m storey)
  DOOR_H: 2.2,
};

// Swatch order: Butter, Pistachio, Rose, Blue, Terracotta. Only these tokens change with the swatches.
export const themes = [
  { wall: '#F3CF76', frame: '#DDB052', accent: '#D77C68' },
  { wall: '#A8CDBB', frame: '#7FB39C', accent: '#D77C68' },
  { wall: '#EBB3A6', frame: '#D58E7E', accent: '#94B9D8' },
  { wall: '#AAC7E0', frame: '#83A8CB', accent: '#F3CF76' },
  { wall: '#F0B29D', frame: '#D86651', accent: '#9AD5B6' },
];

function createMaterials() {
  const gradient = new THREE.DataTexture(new Uint8Array([185, 222, 255]), 3, 1, THREE.RedFormat);
  gradient.minFilter = gradient.magFilter = THREE.NearestFilter; gradient.needsUpdate = true;
  const colours = {
    ...themes[0], cream: '#F4EAD6', paper: '#FBF5E8', wood: '#C89C70', woodLight: '#DDBA8E', walnut: '#735743',
    stone: '#E3D6BC', paving: '#FBF7EB', joint: '#D8CBA9', brass: '#D6A34B',
    leaf: '#7FAF8A', leafLight: '#A9CFA0', leafDeep: '#5E8F6E', terracotta: '#C9765F', soil: '#6A4B3B',
    interior: '#F1E3C6', floorWood: '#D8B48A',
  };
  const m = Object.fromEntries(Object.entries(colours).map(([k, color]) => [k, new THREE.MeshToonMaterial({ color, gradientMap: gradient })]));
  m.ink = new THREE.MeshBasicMaterial({ color: '#352F2A' });
  m.glass = new THREE.MeshBasicMaterial({ color: '#BFE0DC', transparent: true, opacity: 0.14, depthWrite: false, side: THREE.DoubleSide });
  m.reflection = new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0.45, depthWrite: false });
  m.glow = new THREE.MeshBasicMaterial({ color: '#FFE3A1' });
  return m;
}

/** Independent model: no renderer, DOM, lights or animation of its own. */
export function createShop(options = {}) {
  const root = new THREE.Group(); root.name = 'My Shop';
  const m = createMaterials();
  const { GROUND, FLOOR, X0, X1, Z0, Z1, T, TOP, DOOR_H } = G, H = TOP - FLOOR;

  // Phase 1 — blockout: base, plinth, walls with real openings, roof slab
  PavedBase(root, m, { w: 8.9, d: 6.2, cx: 0.75, cz: 0.6 });
  box(root, X1 - X0 + 0.08, FLOOR - GROUND, Z1 - Z0 + 0.08, m.stone, [(X0 + X1) / 2, (FLOOR + GROUND) / 2, (Z0 + Z1) / 2]);
  const facade = group(root, 'Front façade', [0, FLOOR, Z1 - T / 2]);
  wallWithHoles(facade, X1 - X0, H, T, [rectPath(THREE.Path, -2.4, 0.55, 0.6, 2.45), rectPath(THREE.Path, 1.0, 0, 2.0, DOOR_H)], m.wall);
  box(facade, 3.0, 1.9, 0.012, m.glass, [-0.9, 1.5, -0.04], false);
  box(root, X1 - X0 + 0.2, 0.15, Z1 - Z0 + 0.2, m.cream, [(X0 + X1) / 2, TOP + 0.075, (Z0 + Z1) / 2]);

  // Moving part: static hinge at the pivot, dynamic leaf with a click action
  const hinge = group(facade, 'Door hinge', [1.0, 0.02, 0.02]);
  const leaf = group(hinge, 'Open the door'); leaf.userData.action = 'myshopDoor';
  box(leaf, 0.98, DOOR_H - 0.04, 0.06, m.frame, [0.49, (DOOR_H - 0.04) / 2, 0]);
  box(leaf, 0.7, 1.2, 0.012, m.glass, [0.49, 1.35, 0.035], false);
  rod(leaf, [0.85, 0.95, 0.06], [0.85, 1.2, 0.06], 0.015, m.brass, 8);

  // Phases 2–4 go here: façade trims and sign (atlas), interior, roof, street props, plants.

  root.position.set(...(options.position ?? [0, 0, 0]));
  return {
    group: root, materials: m, dynamic: [leaf], state: {},
    labels: [['Front door', [1.5, 2.9, Z1]]],
    setDoor(a) { hinge.rotation.y = -1.4 * a; },
    setPalette(i) { const t = themes[i % themes.length]; for (const k of ['wall', 'frame', 'accent']) m[k].color.set(t[k]); },
  };
}
