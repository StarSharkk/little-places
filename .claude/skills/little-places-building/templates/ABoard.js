// Template: the series' chalkboard A-frame (used by the flower shop, bookshop and pizzeria).
// Copy into the building's Props module; needs group/box/rod from primitives and an atlas cell called 'board'.
import { group, box, rod } from './primitives.js';

export // Chalkboard A-frame. The two leaves hinge together at the TOP and hang down and outwards, so the board reads as
// a Λ and both feet land on the ground: hinge height = L·cos(a). (Hinging at the feet opens it into a V.)
function ABoard(p, m, atlas, pos, turn, { L = 1.0, a = 0.2, w = 0.65 } = {}) {
  const g = group(p, 'Chalkboard A-frame', pos); g.rotation.y = turn;
  const H = L * Math.cos(a);
  for (const s of [1, -1]) {
    const leaf = group(g, s > 0 ? 'Front leaf' : 'Back leaf', [0, H, 0]); leaf.rotation.x = -s * a;
    for (const x of [-(w / 2 - 0.025), w / 2 - 0.025]) box(leaf, 0.045, L, 0.045, m.walnut, [x, -L / 2, 0]);
    box(leaf, w, 0.05, 0.045, m.walnut, [0, -0.025, 0]); box(leaf, w, 0.04, 0.045, m.walnut, [0, -L + 0.16, 0]);
    box(leaf, w - 0.09, 0.74, 0.02, m.chalk, [0, -L + 0.56, s * 0.003], false);
    if (s > 0) atlas.attach(leaf, 'board', w - 0.15, 0.66, [0, -L + 0.56, 0.016]);
  }
  rod(g, [-w / 2 - 0.02, H, 0], [w / 2 + 0.02, H, 0], 0.014, m.brass, 8);                       // top hinge
  for (const x of [-(w / 2 - 0.05), w / 2 - 0.05]) rod(g, [x, H * 0.45, Math.sin(a) * L * 0.55], [x, H * 0.45, -Math.sin(a) * L * 0.55], 0.006, m.ink, 4); // spreader chains
  return g;
}
