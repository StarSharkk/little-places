import * as THREE from 'three';
import { createMaterials, themes } from './materials.js';
import { createAtlas } from './Atlas.js';
import { group, box, plate, PavedBase } from './primitives.js';
import { Shell, Storefront } from './Architecture.js';
import { Roof, Vent } from './Roof.js';
import { Interior, StreetDetails, Pickup } from './Details.js';

/** Independent model; no renderer, DOM controls or scene ownership. Units: metres. */
export function createFlowerShop(options = {}) {
  const config = { scale: 1, position: [0, 0, 0], ...options };
  const root = new THREE.Group(); root.name = 'Hanaya Flowers';
  const materials = createMaterials(), m = materials, atlas = createAtlas();

  // The collection's illustrated paving (same footprint as the bakery, same vocabulary as the café forecourt).
  PavedBase(root, m, { w: 7.45, d: 5.67, cx: 0.15, cz: 0.5 });
  const floor = plate(root, 5.9, 3.57, 0.14, 0.1, m.tile, [0, 0.2, 0]); floor.rotation.x = -Math.PI / 2;

  const shell = Shell(root, m, atlas), storefront = Storefront(root, m, atlas);
  Interior(root, m, atlas);
  const street = StreetDetails(root, m, atlas);
  const roof = Roof(root, m, atlas), vent = Vent(root, m);
  const pickup = Pickup(root, m, atlas);
  const pickHome = new THREE.Vector3(-1.55, 1.23, -1.05), pickAway = new THREE.Vector3(2.955, 0.815, 2.547);
  pickup.position.copy(pickHome);

  root.position.set(...config.position); root.scale.setScalar(config.scale);
  // Articulated or toggleable parts stay out of the static batches (see grocery/optimize.js finishModel).
  const dynamic = [shell, roof, vent.leaf, storefront.door.leaf, storefront.glass, pickup];
  const labels = [
    ['A glasshouse on the roof', [-0.3, 5.6, -0.15], () => roof.visible],
    ['Buckets of cut flowers', [0.7, 1.35, 2.5]],
    ['Climbing roses', [2.64, 2.6, 1.95]],
    ['Pick a bouquet', () => pickup.position.clone().add(new THREE.Vector3(0, 0.75, 0))],
    ['The florist’s workbench', [-1.9, 1.6, -1.15], () => !shell.visible],
  ];
  return {
    group: root, materials, atlas, config, dynamic, door: storefront.door, shell, roof, vent, pickup, pickHome, pickAway, labels, street,
    setVent(a) { vent.hinge.rotation.x = -1.0 * a; },
    setSeeThrough(v) { shell.visible = !v; roof.visible = !v; vent.leaf.visible = !v; storefront.glass.visible = !v; },
    setPalette(index) { const palette = themes[index % themes.length]; for (const [key, value] of Object.entries(palette)) m[key].color.set(value); },
  };
}
