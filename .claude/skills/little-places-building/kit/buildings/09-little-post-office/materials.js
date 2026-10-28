import * as THREE from 'three';
import { createHullMaterial } from './outline.js';
// Swatch order (Butter, Pistachio, Rose, Blue, Terracotta) = Classic / Mint Green / Sakura Pink / Sky Blue / Coral Orange.
// Only the building colours change: walls, the wing's warmer wall, roofs, frames, the tower cap, the awning stripe and
// the garden deck. The post box, clock, glass, parcels and furniture keep their own colours.
export const themes = [
  { wall: '#F3CF76', wall2: '#F5D994', roof: '#82B8A2', frame: '#527C6E', cap: '#E87558', awning: '#DF7860', deck: '#C9DFC8' },
  { wall: '#E7F1E8', wall2: '#BFDCC8', roof: '#5E9C7C', frame: '#3F6E5F', cap: '#5E9C7C', awning: '#7FB39C', deck: '#F4EAD6' },
  { wall: '#F8E6E6', wall2: '#F2C4CC', roof: '#E58FA3', frame: '#8E5866', cap: '#E58FA3', awning: '#E58FA3', deck: '#C9DFC8' },
  { wall: '#E8EFF6', wall2: '#AAC7E0', roof: '#5C8FC7', frame: '#3F628E', cap: '#5C8FC7', awning: '#5C8FC7', deck: '#F3E3B0' },
  { wall: '#F8E8DA', wall2: '#F2B49B', roof: '#E0715B', frame: '#527C6E', cap: '#E0715B', awning: '#E0715B', deck: '#C9DFC8' },
];
export function createMaterials() {
  const gradient = new THREE.DataTexture(new Uint8Array([185, 222, 255]), 3, 1, THREE.RedFormat);
  gradient.minFilter = gradient.magFilter = THREE.NearestFilter; gradient.needsUpdate = true;
  const colours = {
    ...themes[0],
    cream: '#F4EAD6', stripe: '#F7F2E6', paper: '#FBF5E8', stone: '#E3D6BC', paving: '#FBF7EB', joint: '#D8CBA9',
    wood: '#BC8C5A', woodLight: '#D9B48A', walnut: '#6E523F', brass: '#D6A34B', steel: '#C9CED0', steelDark: '#7D8580', chrome: '#E3E8EA',
    iron: '#2F3A36', rail: '#527C6E', leaf: '#7FAF8A', leafLight: '#A9CFA0', leafDeep: '#5E8F6E', terracotta: '#C9765F', soil: '#6A4B3B',
    blossom: '#F2B3C6', blossomDeep: '#E58FA8', trunk: '#7A5A48',
    postRed: '#D94D3D', postDark: '#A9372B', kraft: '#C99A62', kraftLight: '#DDB98A', tape: '#E9D9A6', label: '#FBF5E8',
    floorWood: '#D7AE7E', interior: '#F6E7CB', tile: '#E9DCC0',
    bike: '#2F5B4A', tyre: '#3A3633', seat: '#6A4B3B', shirtPink: '#F2A6BC', shirtBlue: '#7FA8D8', shirtYellow: '#F6D57A',
    stampBlue: '#7FA8D8', stampGreen: '#7FC2A0',
  };
  const m = Object.fromEntries(Object.entries(colours).map(([k, color]) => [k, new THREE.MeshToonMaterial({ color, gradientMap: gradient })]));
  m.ink = new THREE.MeshBasicMaterial({ color: '#352F2A' });
  m.chalk = new THREE.MeshBasicMaterial({ color: '#34413B' });
  m.slot = new THREE.MeshBasicMaterial({ color: '#2A2522' });
  // glass: hall, doors, skylight — transparent, never outlined, never in the shadow. At night it warms (setNight).
  m.glass = new THREE.MeshBasicMaterial({ color: '#BFE0E4', transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide });
  m.reflection = new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0.45, depthWrite: false });
  // light sources are unlit, so they read as lit and glow in Night mode
  m.glow = new THREE.MeshBasicMaterial({ color: '#FFD78A' });
  m.signGlow = new THREE.MeshBasicMaterial({ color: '#FFF4D8' });
  m.hull = createHullMaterial(1.25, '#352F2A');
  return m;
}
