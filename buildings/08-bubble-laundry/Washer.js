import * as THREE from 'three';
import { group, box, plate, sphere, cylinder, ring, mesh, cached, rounded, discPath } from './primitives.js';
import { hull } from './outline.js';

// A front-loading washer (or dryer). Local origin on the floor, front facing +z.
// The cabinet is a rounded profile extruded front to back with a real porthole hole through it, so the drum sits
// inside a tunnel and its clothes are visible through the door glass. A "live" washer splits into three moving
// groups for the page: the cabinet (click to start), the drum (spins) and the door leaf (opens on its left hinge).
export function Washer(parent, m, {
  pos = [0, 0, 0], turn = 0, w = 0.68, h = 0.92, d = 0.62, r = 0.2, doorY = 0.44, body = m.washBlue,
  live = false, solid = false, glass = m.porthole, clothes = [m.shirtPink, m.shirtBlue, m.shirtYellow, m.shirtWhite, m.shirtMint], name = 'Washer', screen = m.screenIdle, led = m.ledOn,
} = {}) {
  const g = group(parent, name, pos); g.rotation.y = turn;
  const shell = live ? group(g, 'Start washing') : g; if (live) shell.userData.action = 'laundryWash';
  const front = d / 2, cy = 0.04 + (h - 0.04) / 2;
  // cabinet: rounded front profile, porthole tunnel (unless it is the solid rooftop sign)
  const geo = cached(`washer:${w}:${h}:${d}:${r}:${doorY}:${solid}`, () => {
    const s = rounded(w, h - 0.04, Math.min(w, h) * 0.09);
    if (!solid) s.holes.push(discPath(THREE.Path, 0, doorY - cy, r - 0.01, true));
    const e = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false, curveSegments: 14 }); e.translate(0, 0, -d / 2); return e;
  });
  mesh(shell, geo, body, [0, cy, 0]);
  for (const [x, z] of [[-w / 2 + 0.07, -front + 0.07], [w / 2 - 0.07, -front + 0.07], [-w / 2 + 0.07, front - 0.07], [w / 2 - 0.07, front - 0.07]]) box(shell, 0.06, 0.04, 0.06, m.rubber, [x, 0.02, z], false);
  // control strip: display, knob, two buttons, coin slot and tray, status light
  const sy = h - 0.12 * (h / 0.92);
  plate(shell, w - 0.06, 0.17 * (h / 0.92), 0.03, 0.03, m.washCream, [0, sy, front + 0.012]);
  box(shell, w * 0.25, 0.065 * (h / 0.92), 0.012, screen, [-w * 0.22, sy, front + 0.03], false);
  const knob = cylinder(shell, w * 0.06, w * 0.06, 0.035, m.chrome, [w * 0.25, sy, front + 0.035], true, 20); knob.rotation.x = Math.PI / 2; hull(knob, m.hull);
  box(shell, 0.008, w * 0.05, 0.012, m.ink, [w * 0.25, sy + w * 0.02, front + 0.055], false);
  for (const [x, mat] of [[0.0, m.coral], [w * 0.09, m.washBlue]]) { const b = cylinder(shell, w * 0.024, w * 0.024, 0.02, mat, [x, sy + 0.025, front + 0.03], false, 12); b.rotation.x = Math.PI / 2; }
  box(shell, w * 0.07, 0.01, 0.012, m.ink, [w * 0.045, sy - 0.03, front + 0.03], false);
  sphere(shell, [0.014, 0.014, 0.01], led, [w * 0.12, sy - 0.035, front + 0.03], [8, 6]);
  // detergent drawer under the strip, rubber gasket round the porthole
  plate(shell, w * 0.3, 0.06, 0.02, 0.015, m.washCream, [-w * 0.22, sy - 0.12 * (h / 0.92), front + 0.01]);
  ring(shell, r - 0.005, 0.026, m.rubber, [0, doorY, front + 0.006], 28, 6);
  // drum: a recessed tub with lifters and clothes; turns about the porthole axis
  let drum = null;
  if (!solid) {
    drum = group(g, live ? 'Washer drum' : 'Drum', [0, doorY, front - 0.14]);
    const back = cylinder(drum, r - 0.02, r - 0.02, 0.02, m.drum, [0, 0, -0.09], false, 24); back.rotation.x = Math.PI / 2;
    ring(drum, r - 0.025, 0.012, m.steel, [0, 0, 0.08], 24, 4);
    for (let i = 0; i < 3; i++) { const a = i * 2.094, l = box(drum, 0.03, 0.05, 0.16, m.steel, [Math.cos(a) * (r - 0.05), Math.sin(a) * (r - 0.05), 0], false); l.rotation.z = a + Math.PI / 2; }
    clothes.forEach((mat, i) => { const a = i * 1.3 + 0.4, rr = (r - 0.07) * (0.5 + (i % 2) * 0.45); const c = sphere(drum, [0.07, 0.045, 0.05], mat, [Math.cos(a) * rr, Math.sin(a) * rr, -0.02 + (i % 3) * 0.03], [8, 5]); c.rotation.z = a; });
  }
  // door: chrome ring with domed glass and a handle, hinged on its left edge so it swings outwards
  const hinge = group(g, live ? 'Washer door hinge' : 'Door hinge', [-(r + 0.03), doorY, front + 0.04]);
  const leaf = group(hinge, live ? 'Open the washer door' : 'Door'); if (live) leaf.userData.action = 'laundryMachineDoor';
  const rim = ring(leaf, r, 0.04, m.chrome, [r + 0.03, 0, 0], 32, 8); hull(rim, m.hull);
  sphere(leaf, [r - 0.02, r - 0.02, 0.05], glass, [r + 0.03, 0, 0], [14, 7]);
  box(leaf, 0.035, r * 0.55, 0.03, m.chrome, [2 * r + 0.07, 0, 0.02]);
  for (const y of [-r * 0.5, r * 0.5]) cylinder(hinge, 0.018, 0.018, 0.06, m.steel, [0, y, -0.02], false, 8);
  return { group: g, shell, drum, hinge, leaf };
}
