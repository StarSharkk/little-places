// Starter for a new Little Places building. Copy to buildings/NN-name/<Name>.js, rename createShop, then split into
// Shell / Roof / Interior / Props / Atlas modules as it grows (see buildings/09-little-post-office/).
import * as THREE from 'three';
import { group, box, plate, rod, cylinder, sphere, rectPath, wallWithHoles } from '../shared/primitives.js';
import { createHullMaterial, hull } from '../shared/outline.js';
import { streetEdge } from '../shared/street.js';
import { ABoard } from '../shared/ABoard.js';
import { Awning } from '../shared/awning.js';

// Shared measurements in metres (style.md → Proportions). +z is the main façade, +x the side entrance.
export const G = {
  GROUND: 0.155, FLOOR: 0.505,              // street surface on the paved base; raised shop floor
  X0: -2.9, X1: 2.9, Z0: -1.9, Z1: 1.7, T: 0.2,
  TOP: 3.65,                                // underside of the roof slab (≈ 3.1 m storey)
  DOOR_H: 2.2,
};

// Swatch order: Butter, Pistachio, Rose, Blue, Terracotta. Only these tokens change with the swatches.
export const themes = [
  // roof: warm walls get a green roof floor, cool walls a cream or butter one (style.md → roof and wall contrast)
  { wall: '#F3CF76', frame: '#DDB052', accent: '#D77C68', roof: '#9CC7A8' },
  { wall: '#A8CDBB', frame: '#7FB39C', accent: '#D77C68', roof: '#F4EAD6' },
  { wall: '#EBB3A6', frame: '#D58E7E', accent: '#94B9D8', roof: '#9CC7A8' },
  { wall: '#AAC7E0', frame: '#83A8CB', accent: '#F3CF76', roof: '#F3E3B0' },
  { wall: '#F0B29D', frame: '#D86651', accent: '#9AD5B6', roof: '#9CC7A8' },
];

function createMaterials() {
  const gradient = new THREE.DataTexture(new Uint8Array([185, 222, 255]), 3, 1, THREE.RedFormat);
  gradient.minFilter = gradient.magFilter = THREE.NearestFilter; gradient.needsUpdate = true;
  const colours = {
    ...themes[0], cream: '#F4EAD6', paper: '#FBF5E8', wood: '#C89C70', woodLight: '#DDBA8E', walnut: '#735743',
    stone: '#E3D6BC', paving: '#FBF7EB', joint: '#D8CBA9', brass: '#D6A34B',
    leaf: '#7FAF8A', leafLight: '#A9CFA0', leafDeep: '#5E8F6E', terracotta: '#C9765F', soil: '#6A4B3B',
    interior: '#F1E3C6', floorWood: '#D8B48A',
    // keys the shared street props expect (props.js: plant, Bench, Bicycle, CherryTree, StreetLamp)
    iron: '#2F3A36', steelDark: '#7D8580', chrome: '#E3E8EA', label: '#FBF5E8', trunk: '#7A5A48', blossom: '#F2B3C6', blossomDeep: '#E58FA8',
    bike: '#2F5B4A', tyre: '#3A3633', seat: '#6A4B3B', shirtPink: '#F2A6BC', shirtBlue: '#7FA8D8', shirtYellow: '#F6D57A', stripe: '#F7F2E6',
  };
  const m = Object.fromEntries(Object.entries(colours).map(([k, color]) => [k, new THREE.MeshToonMaterial({ color, gradientMap: gradient })]));
  m.ink = new THREE.MeshBasicMaterial({ color: '#352F2A' });
  m.glass = new THREE.MeshBasicMaterial({ color: '#BFE0DC', transparent: true, opacity: 0.14, depthWrite: false, side: THREE.DoubleSide });
  m.reflection = new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0.45, depthWrite: false });
  m.glow = new THREE.MeshBasicMaterial({ color: '#FFE3A1' });
  m.chalk = new THREE.MeshBasicMaterial({ color: '#34413B' });     // the A-frame's board
  m.hull = createHullMaterial(1.25, '#352F2A');                    // ink for round shapes; list it in outlineMaterials
  return m;
}

// Print (style.md → three tiers of detail): one canvas, one cell per item. ABoard needs a 'board' cell.
function createAtlas() {
  const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 512; const c = canvas.getContext('2d');
  const cells = { sign: [0, 0, 1024, 256], board: [0, 256, 512, 256] };
  c.fillStyle = '#F4EAD6'; c.fillRect(0, 0, 1024, 256); c.fillStyle = '#4A3426'; c.font = 'bold 140px Georgia, serif'; c.textAlign = 'center'; c.fillText('MY SHOP', 512, 180);
  c.fillStyle = '#34413B'; c.fillRect(0, 256, 512, 256); c.fillStyle = '#F7F0DE'; c.font = '56px "Chalkboard SE", serif'; c.fillText('open today', 256, 400);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshBasicMaterial({ map: texture, alphaTest: 0.5, side: THREE.DoubleSide });
  return {
    attach(parent, key, w, h, pos = [0, 0, 0]) {
      const [x, y, cw, ch] = cells[key], geo = new THREE.PlaneGeometry(w, h), uv = geo.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, (x + uv.getX(i) * cw) / canvas.width, 1 - (y + (1 - uv.getY(i)) * ch) / canvas.height);
      const o = new THREE.Mesh(geo, material); o.position.set(...pos); parent.add(o); return o;
    },
  };
}

/** Independent model: no renderer, DOM, lights or animation of its own. */
export function createShop(options = {}) {
  const root = new THREE.Group(); root.name = 'My Shop';
  const m = createMaterials(), atlas = createAtlas(), inked = (o) => (hull(o, m.hull), o);
  const { GROUND, FLOOR, X0, X1, Z0, Z1, T, TOP, DOOR_H } = G, H = TOP - FLOOR;

  // Phase 1 — blockout: base, plinth, walls with real openings, roof slab
  // the ground: pick 'curb', 'rail' or 'tactile' (references/style.md → Ground and edge)
  const ground = streetEdge(root, { style: 'curb', x0: -3.7, x1: 5.2, z0: -2.5, z1: 3.7 });
  box(root, X1 - X0 + 0.08, FLOOR - GROUND, Z1 - Z0 + 0.08, m.stone, [(X0 + X1) / 2, (FLOOR + GROUND) / 2, (Z0 + Z1) / 2]);
  const facade = group(root, 'Front façade', [0, FLOOR, Z1 - T / 2]);
  wallWithHoles(facade, X1 - X0, H, T, [rectPath(THREE.Path, -2.4, 0.55, 0.6, 2.45), rectPath(THREE.Path, 1.0, 0, 2.0, DOOR_H)], m.wall);
  box(facade, 3.0, 1.9, 0.012, m.glass, [-0.9, 1.5, -0.04], false);
  box(root, X1 - X0 + 0.2, 0.15, Z1 - Z0 + 0.2, m.cream, [(X0 + X1) / 2, TOP + 0.075, (Z0 + Z1) / 2]);
  box(root, X1 - X0 - 0.1, 0.03, Z1 - Z0 - 0.1, m.roof, [(X0 + X1) / 2, TOP + 0.165, (Z0 + Z1) / 2]);

  // Moving part: static hinge at the pivot, dynamic leaf with a click action
  const hinge = group(facade, 'Door hinge', [1.0, 0.02, 0.02]);
  const leaf = group(hinge, 'Open the door'); leaf.userData.action = 'myshopDoor';
  box(leaf, 0.98, DOOR_H - 0.04, 0.06, m.frame, [0.49, (DOOR_H - 0.04) / 2, 0]);
  box(leaf, 0.7, 1.2, 0.012, m.glass, [0.49, 1.35, 0.035], false);
  rod(leaf, [0.85, 0.95, 0.06], [0.85, 1.2, 0.06], 0.015, m.brass, 8);

  // sign on the fascia, a chalkboard on the street (never hand-build the A-frame)
  plate(facade, 2.6, 0.46, 0.06, 0.04, m.frame, [-0.6, H - 0.33, T / 2 + 0.03]); atlas.attach(facade, 'sign', 2.4, 0.38, [-0.6, H - 0.33, T / 2 + 0.064]);
  ABoard(root, m, atlas, [-2.6, GROUND, 2.6], 0.3);
  Awning(facade, m, { len: 3.4, out: 0.7, drop: 0.36, pos: [-0.9, 2.5, T / 2] });   // over the shop window, clear of the sign

  // Phases 2–4 go here: façade trims, interior, roof, street props, plants. Round shapes: inked(…).

  root.position.set(...(options.position ?? [0, 0, 0]));
  const setDoor = (a) => { hinge.rotation.y = -1.4 * a; };
  return {
    group: root, materials: m, dynamic: [leaf], state: {}, shadowFloor: ground.floors, outlineMaterials: [m.hull],
    labels: [['Front door', [1.5, 2.9, Z1]], ['Shop window', [-0.9, 2.2, Z1]], ['Roof', [0, TOP + 0.4, 0]]],
    setDoor,
    // one entry per interaction: `set` for a toggle the page eases 0 ↔ 1, `run(instant)` for a one-off sequence
    interactions: [{ action: 'myshopDoor', label: ['Open the door', 'Close the door'], set: setDoor }],
    setPalette(i) { const t = themes[i % themes.length]; for (const k of ['wall', 'frame', 'accent', 'roof']) m[k].color.set(t[k]); },
  };
}
