import * as THREE from 'three';
// Five themes share the series' colour names (Butter / Pistachio / Rose / Blue / Terracotta).
export const themes = [
  { wall: '#F4D477', accent: '#EFA8C4', roof: '#9AD5B6', trim: '#F7F3E9' },
  { wall: '#B9DECA', accent: '#EF745F', roof: '#9AD5B6', trim: '#F7F3E9' },
  { wall: '#F1CDD9', accent: '#DA8AA8', roof: '#EFA8C4', trim: '#9AD5B6' },
  { wall: '#C7D9ED', accent: '#729AC9', roof: '#91B7EB', trim: '#F6C445' },
  { wall: '#F0B29D', accent: '#D86651', roof: '#EF745F', trim: '#9AD5B6' },
];
export function createMaterials() {
  const gradient = new THREE.DataTexture(new Uint8Array([185, 222, 255]), 3, 1, THREE.RedFormat);
  gradient.minFilter = gradient.magFilter = THREE.NearestFilter; gradient.needsUpdate = true;
  const colours = {
    ...themes[0],
    cream: '#FFF8E7', paper: '#F7F3E9', kraft: '#E1BE8C', wood: '#C39564', woodLight: '#E1BE8C', woodDark: '#8F6A48',
    leaf: '#75AC8C', leafLight: '#A4CEA3', leafDeep: '#4F8A6B', soil: '#6A4B3B',
    pink: '#EFA8C4', rose: '#E27A9B', coral: '#EF745F', yellow: '#F6C445', blue: '#91B7EB', lilac: '#B7A5DB', white: '#FFFDF4',
    tile: '#E7DBC2', paving: '#E7DEC9', joint: '#67574B', terracotta: '#D9805F', steel: '#CDCDBA', steelDark: '#9FA59B', frame: '#FFF8E7',
  };
  const m = Object.fromEntries(Object.entries(colours).map(([key, color]) => [key, new THREE.MeshToonMaterial({ color, gradientMap: gradient })]));
  m.ink = new THREE.MeshBasicMaterial({ color: '#302B26' });
  m.chalk = new THREE.MeshBasicMaterial({ color: '#34413B' });
  m.glass = new THREE.MeshBasicMaterial({ color: '#B4DEDE', transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide });
  m.reflection = new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0.5, depthWrite: false });
  return m;
}
