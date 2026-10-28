import * as THREE from 'three';
import { createMaterials, themes } from './materials.js';
import { createAtlas } from './Atlas.js';
import { PavedBase } from './primitives.js';
import { G, ROOF_Y, Facade, Door, SideWalls, Base, Roof } from './Building.js';
import { Interior } from './Interior.js';
import { StreetDetails, TakeawayBoxes, plant } from './Props.js';
import { steam } from '../shared/steam.js';

/** Pizza Piccola — independent model; no renderer, DOM or lights; the page drives every motion. Units: metres. */
export function createPizzeria(options = {}) {
  const root = new THREE.Group(); root.name = 'Pizza Piccola';
  const m = createMaterials(), atlas = createAtlas();

  // the shared paved base, extended on the left for the fenced terrace
  PavedBase(root, m, { w: 9.8, d: 6.8, cx: -0.5, cz: 0.8 });
  Base(root, m);
  SideWalls(root, m, atlas);
  const inside = Interior(root, m, atlas, plant);
  const facade = Facade(root, m, atlas);
  const door = Door(root, m, atlas);
  const roof = Roof(root, m, atlas, plant);
  StreetDetails(root, m, atlas);
  const box = TakeawayBoxes(root, m, atlas);
  // wood smoke from the oven chimney while the fire burns
  const chimney = steam(root, m.smoke, { count: 14, origin: [2.05, ROOF_Y + 1.85, -1.2], spread: 0.12, rise: 1.3, size: 0.16, life: 3.6, drift: [-0.35, 0.1] }), smoke = chimney.mesh;

  root.position.set(...(options.position ?? [0, 0, 0]));
  const state = { oven: true, seeThrough: false };
  const show = () => { inside.fire.visible = state.oven; smoke.visible = state.oven && !state.seeThrough; };
  return {
    group: root, materials: m, atlas, state, door, box, facade, roof, oven: inside,
    dynamic: [facade, roof, door.leaf, inside.mouth, inside.fire, box.lid],
    outlineMaterials: [m.hull, m.pizzaInk],
    // the shadow falls across this building's own wide forecourt, so it is drawn on the paving as well
    shadowFloor: [{ x0: -5.4, x1: 4.4, z0: -2.6, z1: 4.2, y: G.GROUND + 0.004 }],
    labels: [
      ['Rooftop Pizza Sign', [-0.75, 6.1, -0.15]], ['Wood-fired Oven', [-1.8, 2.3, -1.0]], ['Pizza Display', [0.1, 2.0, 0.25]],
      ['Takeaway Window', [3.2, 2.45, 0.5]], ['Outdoor Seating', [-3.3, 1.35, 1.6]], ['Delivery Scooter', [3.3, 1.7, 3.15]],
    ],
    // ambient: the smoke keeps rising while the fire burns and the chimney is in view
    animate(dt, time) { if (!smoke.visible) return false; chimney.update(time); return true; },
    setDoor(a) { door.hinge.rotation.y = -1.35 * a; },
    setBox(a) { box.hinge.rotation.z = 1.75 * a; },
    setOven(on) { state.oven = on; show(); },
    setSeeThrough(v) { state.seeThrough = v; facade.visible = !v; roof.visible = !v; show(); },
    setPalette(i) { const t = themes[i % themes.length]; for (const k of ['wall', 'wallShade', 'roof', 'frame', 'door']) m[k].color.set(t[k]); },
  };
}
export { themes, G };
