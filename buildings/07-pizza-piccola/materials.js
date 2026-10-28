import * as THREE from 'three';
import { createHullMaterial } from './outline.js';
// Swatch order (Butter, Pistachio, Rose, Blue, Terracotta). Only the building colours change: brick wall,
// brick accents, roof membrane, window frames and the door. Awnings, pizza, wood and plants keep their own.
export const themes = [
  // Default roof terrace uses warm orange; other swatches retain their contrasting roofs.
  { wall: '#F3CF76', wallShade: '#E2B65C', roof: '#E7A16C', frame: '#7FB39C', door: '#E0715B' },
  { wall: '#A8CDBB', wallShade: '#8EBBA6', roof: '#F3CF76', frame: '#5E9C7C', door: '#E0715B' },
  { wall: '#EBB3A6', wallShade: '#DD9A8B', roof: '#A8CDBB', frame: '#7FB39C', door: '#C9584A' },
  { wall: '#AAC7E0', wallShade: '#8FB1D2', roof: '#F3CF76', frame: '#6F98C9', door: '#E0715B' },
  { wall: '#F0B29D', wallShade: '#E2977F', roof: '#A8CDBB', frame: '#7FB39C', door: '#C9584A' },
];
export function createMaterials() {
  const gradient = new THREE.DataTexture(new Uint8Array([185, 222, 255]), 3, 1, THREE.RedFormat);
  gradient.minFilter = gradient.magFilter = THREE.NearestFilter; gradient.needsUpdate = true;
  const colours = {
    ...themes[0],
    cream: '#F4EAD6', paper: '#FBF5E8', stone: '#E3D6BC', paving: '#FBF7EB', joint: '#D8CBA9',
    wood: '#C89C70', woodLight: '#DDBA8E', walnut: '#735743', brass: '#D6A34B', steel: '#C7CBC2', steelDark: '#8E958D',
    coral: '#E0715B', stripe: '#F7EEDC', mint: '#9CC9AA', mintDeep: '#6FA584', iron: '#33403A',
    leaf: '#7FAF8A', leafLight: '#A9CFA0', leafDeep: '#5E8F6E', terracotta: '#C9765F', soil: '#6A4B3B',
    pink: '#EFA8C4', flowerRed: '#E36A55', butter: '#F3CF76',
    brickRed: '#C9634F', tile: '#E8C9A6', interior: '#F3E4C8', soot: '#3B2B22',
    crust: '#D99A45', cheese: '#F6CF62', tomato: '#D9533F', pepperoni: '#C9463A', basil: '#5E9A62',
    card: '#F1E2C6', tyre: '#3A3633', jar: '#E9DCC0',
  };
  const m = Object.fromEntries(Object.entries(colours).map(([k, color]) => [k, new THREE.MeshToonMaterial({ color, gradientMap: gradient })]));
  m.ink = new THREE.MeshBasicMaterial({ color: '#352F2A' });
  m.chalk = new THREE.MeshBasicMaterial({ color: '#34413B' });
  m.glass = new THREE.MeshBasicMaterial({ color: '#BFE0DC', transparent: true, opacity: 0.14, depthWrite: false, side: THREE.DoubleSide });
  m.doorGlass = new THREE.MeshBasicMaterial({ color: '#BFDDE8' });
  m.reflection = new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0.45, depthWrite: false });
  m.glow = new THREE.MeshBasicMaterial({ color: '#FFE3A1' });
  m.fire = new THREE.MeshBasicMaterial({ color: '#F28A3A' });
  m.fireCore = new THREE.MeshBasicMaterial({ color: '#FFD66B' });
  m.smoke = new THREE.MeshToonMaterial({ color: '#EDE6DA', gradientMap: gradient });
  // ink silhouettes for round forms (pots, plants, dome, scooter) and the dark-brown rooftop slice
  m.hull = createHullMaterial(1.25, '#352F2A');
  m.pizzaInk = createHullMaterial(1.5, '#3B2B22');
  m.pizzaLine = new THREE.MeshBasicMaterial({ color: '#3B2B22' });
  return m;
}
