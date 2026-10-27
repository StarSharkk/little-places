import * as THREE from 'three';
import { createMaterials, themes, DEFAULT_THEME, setInteriorLights } from './materials.js';
import { createAtlas } from './Atlas.js';
import { PavedBase } from './primitives.js';
import { G, Shell, SideWalls, Storefront, Base, Awning } from './Architecture.js';
import { Roof } from './Roof.js';
import { Terrace } from './Terrace.js';
import { Interior } from './Interior.js';
import { StreetDetails, Lectern } from './Props.js';

/** The Little Bookshop — independent model; no renderer, DOM or scene ownership. Units: metres. */
export function createBookstore(options = {}) {
  const config = { scale: 1, position: [0, 0, 0], ...options };
  const root = new THREE.Group(); root.name = 'The Little Bookshop';
  const m = createMaterials(), atlas = createAtlas();

  // the collection's paved forecourt, a little wider than the bakery's to hold the side deck
  PavedBase(root, m, { w: 8.9, d: 6.2, cx: 0.75, cz: 0.6 });
  Base(root, m, atlas);
  SideWalls(root, m);
  Interior(root, m, atlas);
  const shell = Shell(root, m, atlas);
  const front = Storefront(root, m, atlas);
  Awning(root, m);
  const roof = Roof(root, m, atlas, g => Terrace(g, m, atlas));
  StreetDetails(root, m, atlas);
  const book = Lectern(root, m, atlas, [4.02, G.FLOOR, 1.02], Math.PI / 2 - 0.35);

  root.position.set(...config.position); root.scale.setScalar(config.scale);
  const dynamic = [shell, roof, ...front.doors.map(d => d.leaf), book.leaf];
  const state = { lights: true };
  setInteriorLights(m, true);
  return {
    group: root, materials: m, atlas, config, dynamic, shell, roof, doors: front.doors, book, state,
    labels: [
      ['Reading Corner', [-2.1, 1.75, -1.15]], ['Book Display', [-0.4, 1.65, 1.3]], ['Cashier', [1.75, 1.95, -0.98]],
      ['Book Collection', [-0.15, 3.25, -1.5]], ['Rooftop Terrace', [0.65, 4.95, 0.2]], ['Vintage Typewriter', [-1.28, 5.0, -1.36]],
    ],
    setDoor(a) { front.doors[0].hinge.rotation.y = -1.35 * a; front.doors[1].hinge.rotation.y = 1.35 * a; },
    setBook(a) { const e = a * a * (3 - 2 * a); book.hinge.rotation.z = Math.PI * (1 - e); },
    setLights(on) { state.lights = on; setInteriorLights(m, on); },
    setSeeThrough(v) { shell.visible = !v; roof.visible = !v; },
    setPalette(index) { const t = themes[index % themes.length]; for (const key of ['wall', 'frame', 'accent']) m[key].color.set(t[key]); },
  };
}
export { themes, DEFAULT_THEME, G };
