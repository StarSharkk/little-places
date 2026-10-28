import * as THREE from "three";
import { themes } from "./themes.js";
import { config as defaults, createMaterials } from "./materials.js";
import { TextureAtlas } from "./TextureAtlas.js";
import { group, box, rod, tube, sign } from "./components/primitives.js";
import { FacadeDetails, ShopInterior } from "./components/FacadeDetails.js";
import { Storefront } from "./components/Storefront.js";
import { CapsuleBank } from "./components/CapsuleMachine.js";
import { Packet, NotebookStack } from "./components/Merchandise.js";
import { VendingMachine } from "./components/VendingMachine.js";
import { RooftopEquipment, AirUnit } from "./components/RooftopEquipment.js";
import {
  StreetProps,
  Crate,
  ShopAccents,
} from "./components/StreetProps.js";
function Window(
  p,
  m,
  { pos = [0, 0, 0], w = 1.42, h = 1.33, rotation = 0, balcony = false, livedIn = false } = {},
) {
  const g = group(p, pos, rotation, "Sliding residential window");
  box(g, w + 0.16, h + 0.15, 0.12, m.trim);
  box(g, w, h, 0.12, m.dark, [0, 0, 0.035]);
  box(g, w - 0.1, h - 0.1, 0.045, m.glass, [0, 0, 0.115]);
  for (const x of [-w / 2, 0, w / 2])
    box(g, 0.036, h, 0.055, m.steel, [x, 0, 0.16]);
  for (const y of [-h / 2, h / 2])
    box(g, w, 0.035, 0.055, m.steel, [0, y, 0.16]);
  box(g, 0.055, 0.12, 0.07, m.trim, [-0.04, 0, 0.2]);
  box(g, w + 0.22, 0.075, 0.25, m.concrete, [0, -h / 2 - 0.08, 0.07]);
  // Cream curtains and quiet reflected sky, placed behind the aluminium mullions.
  box(g, 0.21, h - 0.1, 0.006, m.trim, [-w / 2 + 0.15, 0, 0.145], false);
  box(g, 0.16, h - 0.1, 0.006, m.trim, [w / 2 - 0.13, 0, 0.145], false);
  const reflection = box(
    g,
    0.035,
    h * 0.68,
    0.008,
    m.glassLight,
    [w * 0.2, 0, 0.145],
    false,
  );
  reflection.rotation.z = -0.18;
  if (livedIn) {
    box(g, w * .37, h - .1, .008, m.paper, [-w * .27, 0, .147], false);
    for (let x = -w * .42; x < -w * .1; x += .08)
      box(g, .012, h - .12, .01, m.trim, [x, 0, .154], false);
  }
  if (balcony) {
    box(g, w + 0.26, 0.065, 0.56, m.concrete, [0, -h / 2 - 0.1, 0.32]);
    for (let x = -w / 2 - 0.08; x < w / 2 + 0.1; x += 0.16)
      rod(g, [x, -h / 2, 0.56], [x, -h / 2 + 0.5, 0.56], 0.011, m.steel, false);
    rod(
      g,
      [-w / 2 - 0.1, -h / 2 + 0.5, 0.56],
      [w / 2 + 0.1, -h / 2 + 0.5, 0.56],
      0.025,
      m.steel,
    );
  }
  return g;
}
export function createBuilding(options = {}) {
  const c = { ...defaults, ...options };
  const root = new THREE.Group();
  root.name = "Yamada grocery store / 山田雑貨店";
  const m = createMaterials(),
    atlas = new TextureAtlas();
  const shell = group(root, [0, 0.23, 0], 0, "Three-storey building");
  box(shell, c.width, c.height - 3.28, c.depth, m.wall, [
    0,
    (c.height + 3.28) / 2,
    0,
  ]);
  box(shell, c.width, 0.25, c.depth, m.trim, [0, 3.18, 0]);
  box(shell, c.width, 0.16, c.depth, m.concrete, [0, 0.08, 0]);
  box(shell, 0.18, 3.1, c.depth, m.tile, [-c.width / 2 + 0.09, 1.7, 0]);
  box(shell, 0.18, 3.1, c.depth, m.tile, [c.width / 2 - 0.09, 1.7, 0]);
  box(shell, c.width, 3.1, 0.18, m.tile, [0, 1.7, -c.depth / 2 + 0.09]);
  // Upper concrete structure has actual floor rims, parapets and shallow joint lines.
  for (const y of [3.38, 5.34, 7.28])
    box(shell, c.width + 0.1, 0.085, c.depth + 0.1, m.trim, [0, y, 0]);
  for (const x of [-c.width / 2, c.width / 2])
    for (const z of [-c.depth / 2, c.depth / 2])
      box(shell, 0.12, c.height, 0.12, m.trim, [x, c.height / 2, z]);
  for (const y of c.upperFloorHeights) {
    for (const x of [-1.13, 1.13])
      Window(shell, m, {
        pos: [x, y + 0.66, c.depth / 2 + 0.02],
        w: 1.55,
        h: 1.23,
        balcony: y < 5,
        livedIn: (x < 0 && y > 5) || (x > 0 && y < 5),
      });
    for (const z of [-0.98, 0.99])
      Window(shell, m, {
        pos: [c.width / 2 + 0.02, y + 0.64, z],
        w: 1.21,
        h: 1.15,
        rotation: Math.PI / 2,
      });
    Window(shell, m, {
      pos: [-c.width / 2 - 0.02, y + 0.6, 0],
      w: 1.6,
      h: 1.17,
      rotation: -Math.PI / 2,
    });
    Window(shell, m, {
      pos: [0, y + 0.6, -c.depth / 2 - 0.02],
      w: 1.7,
      h: 1.17,
      rotation: Math.PI,
    });
  }
  // A small drying rail and folded linen bring a residential scale to the second storey.
  rod(shell, [-1.78, 4.12, 2.43], [-0.7, 4.12, 2.43], 0.014, m.steel);
  box(shell, 0.26, 0.34, 0.018, m.paper, [-1.55, 3.99, 2.43], false);
  box(shell, 0.21, 0.29, 0.018, m.trim, [-1.19, 4.015, 2.43], false);
  for (const x of [-1.64, -1.46, -1.26, -1.1])
    box(shell, 0.021, 0.055, 0.032, m.wood, [x, 4.14, 2.43], false);
  // Narrow ceramic-tile joints provide the characteristic first-floor shop façade.
  for (let y = 0.3; y < 3.1; y += 0.23)
    box(
      shell,
      0.006,
      0.009,
      c.depth,
      m.steel,
      [c.width / 2 + 0.094, y, 0],
      false,
    );
  for (let z = -1.8; z < 1.9; z += 0.25)
    box(
      shell,
      0.008,
      2.81,
      0.008,
      m.steel,
      [c.width / 2 + 0.096, 1.7, z],
      false,
    );
  // External drainage and electricity conduits route around the actual windows.
  for (const x of [-2.06, 2.03]) {
    tube(
      shell,
      [
        [x, 0.22, 1.99],
        [x, 3.3, 1.99],
        [x + 0.13, 3.53, 1.99],
        [x + 0.13, 7.35, 1.99],
      ],
      0.034,
      m.steel,
    );
    for (let y = 0.7; y < 7.2; y += 1.1)
      box(shell, 0.12, 0.045, 0.13, m.trim, [x, y, 2.0]);
  }
  tube(
    shell,
    [
      [2.39, 7.3, -1.53],
      [2.39, 4.97, -1.53],
      [2.39, 4.78, -1.25],
      [2.39, 0.3, -1.25],
    ],
    0.039,
    m.trim,
  );
  tube(
    shell,
    [
      [2.4, 5.4, -1.8],
      [2.4, 5.4, 0.1],
      [2.4, 5.15, 0.35],
      [2.4, 3.4, 0.35],
    ],
    0.021,
    m.steel,
  );
  AirUnit(shell, m, atlas, [1.13, 3.49, 2.21], 0, 0.68);
  AirUnit(shell, m, atlas, [2.55, 5.28, 0.91], Math.PI / 2, 0.75);
  AirUnit(shell, m, atlas, [2.55, 3.65, -0.95], Math.PI / 2, 0.82);
  const storefront = Storefront(shell, m, atlas, c);
  ShopInterior(storefront.group, m, atlas);
  FacadeDetails(shell, m, atlas, c);
  RooftopEquipment(shell, m, atlas, c);
  // Side signs use one atlas material; their solid metal housings create real depth.
  const side = group(
    shell,
    [c.width / 2 + 0.12, 0, 0],
    Math.PI / 2,
    "Side-wall advertisements",
  );
  for (const [key, x, y, w, h] of [
    ["posterGold", 1.32, 3.1, 0.36, 0.64],
    ["posterRed", 0.8, 3.1, 0.36, 0.64],
    ["posterBlue", 0.28, 3.1, 0.36, 0.64],
    ["grocery", -0.49, 3.1, 0.45, 0.68],
    ["citrus", -1.19, 3.1, 0.45, 0.68],
  ])
    sign(side, atlas, key, w, h, [x, y, 0.03], 0, m.trim);
  sign(side, atlas, "notice", 1.45, 0.32, [0.6, 4.93, 0.04], 0, m.steel);
  sign(side, atlas, "street", 1.2, 0.28, [0.1, 0.6, 0.04], 0, m.trim);
  const capsuleBank=CapsuleBank(root,m,atlas,{pos:[2.72,.23,-.59],rotation:Math.PI/2});
  const teaMachine=VendingMachine(root, m, atlas, {
    pos: [2.72, 0.23, 0.55],
    rotation: Math.PI / 2,
    green: true,
  });
  teaMachine.scale.z=.84;
  // Stock has clearance from the wall and from every poster, including its frame.
  const stockShelf=group(shell,[0,0,0],0,'Side shop stock shelf');
  box(stockShelf,.64,.07,2.28,m.trim,[2.72,2.21,0]);
  for(const z of [-.9,.9]) {
    rod(stockShelf,[2.4,2.0,z],[2.4,2.21,z],.018,m.steel);
    rod(stockShelf,[2.4,2.0,z],[2.98,2.21,z],.018,m.steel);
  }
  const fruit=Crate(stockShelf,m,atlas,[2.76,2.25,-.59],true,m.yellow);
  fruit.rotation.y=Math.PI/2;
  const packages=group(stockShelf,[2.75,2.25,.4],Math.PI/2,'Shelf groceries');
  Packet(packages,m,atlas,[-.1,0,0],{colour:m.red,scale:.9});
  Packet(packages,m,atlas,[.1,0,0],{colour:m.paper,scale:.9});
  NotebookStack(stockShelf,m,[2.76,2.25,.92],.9);
  // Power meter and small service door on the rear keep rotation credible.
  box(shell, 0.64, 1.92, 0.08, m.steel, [-0.9, 1.16, -c.depth / 2 - 0.08]);
  box(shell, 0.07, 0.17, 0.06, m.ink, [-0.69, 1.16, -c.depth / 2 - 0.14]);
  for (const x of [0.45, 0.96]) {
    box(shell, 0.31, 0.39, 0.17, m.trim, [x, 2.12, -c.depth / 2 - 0.15]);
    tube(
      shell,
      [
        [x, 1.9, -2],
        [x, 1.3, -2],
        [x + 0.2, 1.2, -2],
        [x + 0.2, 0.3, -2],
      ],
      0.018,
      m.steel,
    );
  }
  if (c.furniture) {
    StreetProps(root, m, atlas, c);
    ShopAccents(root, m, atlas);
  }
    root.updateMatrixWorld(true);
  const posterBounds=side.children.filter(o=>['posterGold','posterRed','posterBlue','grocery','citrus'].includes(o.name)).map(o=>new THREE.Box3().setFromObject(o));
  const stockBounds=new THREE.Box3().setFromObject(stockShelf);
  const layoutAudit={posterCount:posterBounds.length,
    posterStockIntersections:posterBounds.filter(b=>b.intersectsBox(stockBounds)).length,
    minimumPosterClearance:Math.min(...posterBounds.map(b=>b.min.y))-stockBounds.max.y,
    posterWallClearance:Math.min(...posterBounds.map(b=>b.min.x))-(c.width/2+.09),
    capsuleMachineCount:capsuleBank.userData.machineCount};
  return { group: root, materials: m, atlas, storefront, config: c, capsuleBank, layoutAudit,
    setTheme(index) {
      const theme = themes[index];
      if (!theme) throw new RangeError('Unknown colour theme');
      for (const [key, material] of Object.entries(m)) material.color.set(theme[key]);
      atlas.setTheme(theme);
    },
  };
}
