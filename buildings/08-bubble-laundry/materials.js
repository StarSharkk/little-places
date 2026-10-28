import * as THREE from 'three';
import { createHullMaterial } from './outline.js';
// Swatch order (Butter, Pistachio, Rose, Blue, Terracotta), named for the laundry as Butter Yellow / Mint Green /
// Sakura Pink / Sky Blue / Coral Orange. Only the building colours change: walls, trims, awning stripe and the
// roof deck (warm walls → a green deck). Washers, clothes, plants and wood keep their own colours.
export const themes = [
  { wall: '#F3D27E', wallShade: '#E4BC62', frame: '#7EC0B4', awning: '#6FA8D6', deck: '#A8CDBB' },
  { wall: '#A8CDBB', wallShade: '#8EBBA6', frame: '#4E8F84', awning: '#6FA8D6', deck: '#F4EAD6' },
  { wall: '#F2C4CC', wallShade: '#E5A9B4', frame: '#7EC0B4', awning: '#E58FA3', deck: '#A8CDBB' },
  { wall: '#AAC7E0', wallShade: '#8FB1D2', frame: '#5C8FC7', awning: '#5C8FC7', deck: '#F3DFA0' },
  { wall: '#F2B49B', wallShade: '#E39A7F', frame: '#7EC0B4', awning: '#E0715B', deck: '#A8CDBB' },
];
export function createMaterials() {
  const gradient = new THREE.DataTexture(new Uint8Array([185, 222, 255]), 3, 1, THREE.RedFormat);
  gradient.minFilter = gradient.magFilter = THREE.NearestFilter; gradient.needsUpdate = true;
  const colours = {
    ...themes[0],
    cream: '#F4EAD6', stripe: '#F7F2E6', paper: '#FBF5E8', stone: '#E3D6BC', paving: '#FBF7EB', joint: '#D8CBA9',
    wood: '#C89C70', woodLight: '#DDBA8E', walnut: '#735743', brass: '#D6A34B', steel: '#C9CED0', steelDark: '#8E958D',
    iron: '#33403A', rail: '#4F8A6A', leaf: '#7FAF8A', leafLight: '#A9CFA0', leafDeep: '#5E8F6E', terracotta: '#C9765F', soil: '#6A4B3B',
    blossom: '#F2B3C6', blossomDeep: '#E58FA8', trunk: '#7A5A48',
    tile: '#EFE3C8', interior: '#F6EBCF', coral: '#E0715B',
    // washers: enamel bodies, chrome rings, dark drums
    washBlue: '#8DBBE3', washPink: '#F0A9B8', washButter: '#F3D27E', washCream: '#F6F0E2', chrome: '#E3E8EA', rubber: '#5A5F66', drum: '#7E8790',
    // clothes and plastics
    shirtBlue: '#7FA8D8', shirtPink: '#F2A6BC', shirtYellow: '#F6D57A', shirtMint: '#9CD3BE', shirtWhite: '#F7F4EC', basketBlue: '#8FC4E6', basketPink: '#F3B2C4',
    vendBody: '#A9CFEA', bike: '#2F5B4A', tyre: '#3A3633', seat: '#6A4B3B',
    bottleBlue: '#6FA8D6', bottlePink: '#E98AA8', bottleGreen: '#7FC2A0', bottleYellow: '#F3CF76',
  };
  const m = Object.fromEntries(Object.entries(colours).map(([k, color]) => [k, new THREE.MeshToonMaterial({ color, gradientMap: gradient })]));
  m.ink = new THREE.MeshBasicMaterial({ color: '#352F2A' });
  m.chalk = new THREE.MeshBasicMaterial({ color: '#34413B' });
  // glass: storefront panes, washer portholes and the vending window — transparent, never outlined, never shadowed
  m.glass = new THREE.MeshBasicMaterial({ color: '#BFE0E4', transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide });
  m.porthole = new THREE.MeshBasicMaterial({ color: '#A9D2EE', transparent: true, opacity: 0.32, depthWrite: false });
  m.reflection = new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0.45, depthWrite: false });
  m.glass.renderOrder = 2;
  // light sources are unlit so they read as lit (and glow in Night mode)
  m.glow = new THREE.MeshBasicMaterial({ color: '#FFE3A1' });
  m.signGlow = new THREE.MeshBasicMaterial({ color: '#FFF6DC' });
  m.screenIdle = new THREE.MeshBasicMaterial({ color: '#3F5A5E' });
  m.screenRun = new THREE.MeshBasicMaterial({ color: '#7CE0C2' });
  m.led = new THREE.MeshBasicMaterial({ color: '#9AA3A6' });       // the running washer's status light (switched)
  m.ledOn = new THREE.MeshBasicMaterial({ color: '#7CE07C' });      // the other machines' ready lights
  m.pickup = new THREE.MeshBasicMaterial({ color: '#6E7A7E' });     // vending pickup light (switched)
  m.roofGlass = new THREE.MeshBasicMaterial({ color: '#7FB6E8' });  // opaque blue porthole of the giant sign
  m.dryerGlass = new THREE.MeshBasicMaterial({ color: '#C4D6E2' });  // tinted dryer portholes (no drum behind them)
  // ink silhouettes for round forms
  m.hull = createHullMaterial(1.25, '#352F2A');
  return m;
}
