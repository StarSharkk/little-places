import * as THREE from 'three';
import { createMaterials, themes } from './materials.js';
import { createAtlas } from './Atlas.js';
import { G, Facade, Doors, SideWalls, Base, Roof } from './Building.js';
import { Interior } from './Interior.js';
import { StreetDetails, plant, vendingSequence } from './Props.js';
import { streetEdge } from '../shared/street.js';

/** Bubble Laundry — independent model; no renderer, DOM or lights; the page drives every motion. Units: metres. */
export function createLaundry(options = {}) {
  const root = new THREE.Group(); root.name = 'Bubble Laundry';
  const m = createMaterials(), atlas = createAtlas();

  // edge style 'rail' (after 05 Sakura Sweets): clean pavement edge with a rounded corner echoing the glass curve,
  // the road along the front and right, a short iron railing at the front-left and back-right
  const ground = streetEdge(root, { style: 'rail', x0: -4.6, x1: 5.0, z0: -3.0, z1: 4.0, corner: 1.6, sides: ['front', 'right'], width: 1.4,
    rails: [[[-4.45, 3.82], [-1.95, 3.82]], [[4.82, -2.85], [4.82, -2.0]]] });
  Base(root, m);
  SideWalls(root, m, atlas);
  const inside = Interior(root, m, atlas, plant);
  const facade = Facade(root, m, atlas);
  const doors = Doors(root, m, atlas);
  const roof = Roof(root, m, atlas, plant);
  const street = StreetDetails(root, m, atlas), v = street.vending, vend = vendingSequence(v, m, m.pickup);
  const live = inside.live;

  root.position.set(...(options.position ?? [0, 0, 0]));
  const state = { washing: false, speed: 0, seeThrough: false };
  return {
    group: root, materials: m, atlas, state, facade, roof, doors, washer: live, vending: v,
    dynamic: [facade, roof, ...doors.map(d => d.leaf), live.shell, live.drum, live.leaf, v.body, v.button, v.bottle, v.flap],
    outlineMaterials: [m.hull],
    // the shadow falls across the building's own pavement, so it is laid on the paving too
    shadowFloor: ground.floors,
    labels: [
      ['Rooftop Washer Sign', [-1.45, 6.0, 0.35]], ['Washing Machines', [-0.5, 1.75, -0.35]], ['Folding Table', [-0.6, 1.6, 1.08]],
      ['Waiting Bench', [-2.62, 1.3, 0.85]], ['Detergent Vending', [3.55, 2.35, -0.3]], ['Clothes Line', [1.45, 5.45, -1.15]],
    ],
    // ambient: the drum spins up and winds down with deltaTime; the vending sequence runs to its end
    animate(dt) {
      const goal = state.washing ? 1.6 : 0;                                   // turns per second
      state.speed = goal + (state.speed - goal) * Math.exp(-1.8 * dt);      // exact for any frame rate
      if (!state.washing && state.speed < 0.005) state.speed = 0;
      live.drum.rotation.z -= state.speed * Math.PI * 2 * dt;
      const vending = vend.step(dt);
      return state.speed > 0 || vending;
    },
    setWashing(on) {
      state.washing = on;
      m.screenIdle.color.set(on ? '#7CE0C2' : '#3F5A5E'); m.led.color.set(on ? '#7CE07C' : '#9AA3A6');
    },
    startVend(instant = false) { vend.start(instant); },
    get vendRunning() { return vend.running; },
    setDoor(a) { doors[0].hinge.rotation.y = -1.3 * a; doors[1].hinge.rotation.y = 1.3 * a; },
    setMachineDoor(a) { live.hinge.rotation.y = -1.75 * a; },
    setSeeThrough(on) { state.seeThrough = on; facade.visible = !on; roof.visible = !on; },
    setPalette(i) { const t = themes[i % themes.length]; for (const k of ['wall', 'wallShade', 'frame', 'awning', 'deck']) m[k].color.set(t[k]); },
  };
}
export { themes, G };
