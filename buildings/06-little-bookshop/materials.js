import * as THREE from 'three';
// Five schemes in the collection's swatch order (Butter, Pistachio, Rose, Blue, Terracotta), named for the
// bookshop as Butter / Mint / Coral pink / Powder blue / Lavender. Only the building colours change;
// books, plants and wooden furniture keep their own colours.
export const themes = [
  // deck: the rooftop terrace floor, chosen to contrast the wall (yellow walls → a green deck)
  { name: 'Butter yellow', wall: '#F3CF76', frame: '#DDB052', accent: '#D77C68', deck: '#A8CDBB' },
  { name: 'Mint green',    wall: '#A8CDBB', frame: '#7FB39C', accent: '#D77C68', deck: '#F4EAD6' },
  { name: 'Coral pink',    wall: '#EBB3A6', frame: '#D58E7E', accent: '#94B9D8', deck: '#A8CDBB' },
  { name: 'Powder blue',   wall: '#AAC7E0', frame: '#83A8CB', accent: '#F3CF76', deck: '#F4EAD6' },
  { name: 'Lavender',      wall: '#C5B9DE', frame: '#A497C9', accent: '#F3CF76', deck: '#F4EAD6' },
];
export const DEFAULT_THEME = 1; // mint
export const BOOK_COLOURS = ['#D77C68', '#94B9D8', '#F3CF76', '#7FAF8A', '#735743', '#C89C70', '#E9A6B4', '#5F7FA3', '#B5585A', '#E7DCC0', '#8C78B4', '#3F6B5E'];
export function createMaterials() {
  const gradient = new THREE.DataTexture(new Uint8Array([185, 222, 255]), 3, 1, THREE.RedFormat);
  gradient.minFilter = gradient.magFilter = THREE.NearestFilter; gradient.needsUpdate = true;
  const colours = {
    ...themes[DEFAULT_THEME],
    cream: '#F4EAD6', paper: '#FBF5E8', wood: '#C89C70', woodLight: '#DDBA8E', walnut: '#735743',
    yellow: '#F3CF76', coral: '#D77C68', blue: '#94B9D8', leaf: '#7FAF8A', leafLight: '#A9CFA0', leafDeep: '#5E8F6E',
    interior: '#F1E3C6', floorWood: '#D8B48A', shelf: '#8A6A50', shelfLight: '#B88F68', stone: '#E3D6BC', paving: '#FBF7EB', joint: '#D8CBA9', brass: '#D6A34B',
    terracotta: '#C9765F', soil: '#6A4B3B', steel: '#BFC3B8', typewriter: '#5E8F86', fabric: '#E9DCC0', rug: '#C9765F',
  };
  delete colours.name;
  const m = Object.fromEntries(Object.entries(colours).map(([key, color]) => [key, new THREE.MeshToonMaterial({ color, gradientMap: gradient })]));
  // indoor and outdoor books are separate so the shop lights only warm the books inside
  m.books = BOOK_COLOURS.map(color => new THREE.MeshToonMaterial({ color, gradientMap: gradient }));
  m.booksOut = BOOK_COLOURS.map(color => new THREE.MeshToonMaterial({ color, gradientMap: gradient }));
  m.paperIn = m.paper.clone();
  m.ink = new THREE.MeshBasicMaterial({ color: '#352F2A' });
  m.chalk = new THREE.MeshBasicMaterial({ color: '#34413B' });
  m.glass = new THREE.MeshBasicMaterial({ color: '#BFE0DC', transparent: true, opacity: 0.14, depthWrite: false, side: THREE.DoubleSide });
  m.reflection = new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0.45, depthWrite: false });
  m.glow = new THREE.MeshBasicMaterial({ color: '#FFE3A1' });       // lamp shades / bulbs (switchable)
  return m;
}
// Interior lighting is drawn, not computed: warm emissive on the room's surfaces and books, glowing shades.
// With the lights off the room drops to a dusky tone so the change reads from the street.
const DUSK = new THREE.Color('#8C93A8');
function light(mat, on, glow) {
  mat.userData.base ??= mat.color.clone();
  mat.color.copy(mat.userData.base); if (!on) mat.color.multiply(DUSK);
  mat.emissive.set(on ? '#FFC870' : '#000000'); mat.emissiveIntensity = on ? glow : 0;
}
export function setInteriorLights(m, on) {
  for (const key of ['interior', 'floorWood', 'shelf', 'shelfLight', 'paperIn']) light(m[key], on, 0.12);
  for (const b of m.books) light(b, on, 0.08);
  m.glow.color.set(on ? '#FFE3A1' : '#CFC8B8');
}
