import { group, box, cyl, rod, tube, sign } from './primitives.js';
import { Packet, NotebookStack, Cup } from './Merchandise.js';

// Details follow actual services: power above the shop, drains at the edges,
// and a compact stock counter behind the shutter. No random placement.
export function FacadeDetails(parent, materials, atlas, config) {
  const m = materials;
  const g = group(parent, [0, 0, 0], 0, 'Facade service fittings');
  const sideX = config.width / 2 + 0.13;
  const frontZ = config.depth / 2 + 0.14;

  // Galvanised service tray and junction boxes, routed below residential windows.
  box(g, 0.08, 0.09, 3.35, m.steel, [sideX, 5.05, 0]);
  for (const z of [-1.42, -0.4, 0.52, 1.45]) {
    box(g, 0.13, 0.15, 0.12, m.trim, [sideX, 5.05, z]);
    rod(g, [sideX, 4.95, z], [sideX + 0.08, 4.95, z], 0.017, m.ink, false);
  }
  for (const height of [3.97, 4.04, 4.11]) {
    tube(g, [[sideX + 0.02, height, -1.8], [sideX + 0.06, height - 0.045, -0.8],
      [sideX + 0.06, height - 0.055, 0.2], [sideX + 0.02, height, 1.77]], 0.008, m.ink);
  }
  box(g, 0.17, 0.36, 0.27, m.steel, [sideX + 0.05, 4.15, 1.63]);
  box(g, 0.025, 0.24, 0.19, m.trim, [sideX + 0.15, 4.15, 1.63]);
  cyl(g, 0.025, 0.025, 0.07, m.ink, [sideX + 0.18, 4.15, 1.63], 8);

  // Rainwater shoe meets the wall rather than ending in midair.
  tube(g, [[-2.06, 0.46, 1.99], [-2.06, 0.22, 1.99], [-2.06, 0.16, 2.13]], 0.043, m.steel);
  box(g, 0.21, 0.025, 0.28, m.ink, [-2.06, 0.1, 2.13]);

  // The building number is a small enamel plate, not another large billboard.
  sign(g, atlas, 'street', 0.73, 0.17, [-1.6, 3.54, frontZ + 0.04], 0, m.steel);

  return g;
}

export function ShopInterior(parent, m, atlas) {
  const g = group(parent, [0, 0, 0], 0, 'Recessed shop counter');
  box(g, 3.65, 0.07, 1.55, m.wood, [0, 0.105, -0.67]);
  box(g, 2.13, 0.78, 0.39, m.wood, [-0.5, 0.51, -0.38]);
  box(g, 2.22, 0.065, 0.47, m.trim, [-0.5, 0.94, -0.36]);
  for (const x of [-1.38, -0.5, 0.38]) {
    box(g, 0.035, 0.65, 0.015, m.paper, [x, 0.53, -0.176], false);
  }
  atlas.attach(g, 'notice', 1.83, .27, [-.5, .57, -.158]);
  // A till and varied goods replace the former bottle display.
  box(g, 0.29, 0.06, 0.25, m.dark, [-1.1, 1.01, -0.36]);
  const register = box(g, 0.23, 0.15, 0.18, m.steel, [-1.1, 1.1, -0.38]);
  register.rotation.x = -0.15;
  box(g, 0.14, 0.055, 0.015, m.dark, [-1.1, 1.14, -0.281]);
  NotebookStack(g,m,[-.63,.98,-.36],.85);
  Cup(g,m,[-.22,.98,-.34],m.green);
  Packet(g,m,atlas,[.07,.98,-.36],{colour:m.yellow});
  Packet(g,m,atlas,[.29,.98,-.38],{colour:m.red,scale:.8});
  // Stock shelf sits beside the counter, with an unobstructed passage.
  box(g, 0.61, 0.07, 0.45, m.wood, [1.23, 0.36, -0.51]);
  box(g, 0.61, 0.07, 0.45, m.wood, [1.23, 0.84, -0.51]);
  for (const x of [0.95, 1.51]) box(g, 0.04, 0.89, 0.4, m.steel, [x, 0.49, -0.51]);
  for (const x of [1.07, 1.38]) {
    Packet(g,m,atlas,[x,.4,-.51],{colour:m.paper,scale:1.1});
  }
  NotebookStack(g,m,[1.12,.88,-.51],.8);
  Cup(g,m,[1.4,.88,-.51],m.blue);
  return g;
}
