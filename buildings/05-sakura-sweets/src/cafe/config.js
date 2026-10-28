// Everything tweakable about the café lives here: proportions, openings, palettes, prop density.

export const INK = '#252525';

export const PALETTES = [
  { id: 'butter', name: 'Butter', wall: '#F6C445', trim: '#F7F3E9', roof: '#CE775D', door: '#9AD5B6', shutter: '#9AD5B6', awning: '#EF745F', flower: '#EFA8C4' },
  { id: 'cream',  name: 'Cream',  wall: '#F7F3E9', trim: '#F1E6CC', roof: '#EF745F', door: '#9AD5B6', shutter: '#91B7EB', awning: '#EF745F', flower: '#EFA8C4' },
  { id: 'mint',   name: 'Mint',   wall: '#9AD5B6', trim: '#F7F3E9', roof: '#6CB290', door: '#F6C445', shutter: '#F7F3E9', awning: '#EF745F', flower: '#EFA8C4' },
  { id: 'sky',    name: 'Sky',    wall: '#91B7EB', trim: '#F7F3E9', roof: '#6B93D1', door: '#F6C445', shutter: '#F7F3E9', awning: '#EF745F', flower: '#EFA8C4' },
  { id: 'sakura', name: 'Sakura', wall: '#EFA8C4', trim: '#F7F3E9', roof: '#D2799F', door: '#9AD5B6', shutter: '#9AD5B6', awning: '#EF745F', flower: '#F7F3E9' },
];

// Shopfront copy. The building is the same; `shop` picks what the signs, board and menu say.
export const SHOPS = {
  cafe: {
    name: 'Sakura Café', sub: 'CAFÉ', round: { label: 'COFFEE', icon: 'cup' },
    board: { title: 'Today', tagline: 'fresh & warm', icon: 'cup', rows: [['Espresso', '3.2'], ['Flat white', '4.4'], ['Sakura latte', '5.2'], ['Matcha', '5.4'], ['Croissant', '3.6']] },
  },
  sweets: {
    name: 'Sakura Sweets', sub: 'SWEETS', round: { label: 'SWEETS', icon: 'cupcake' },
    board: { title: 'Sweets', tagline: 'baked this morning', icon: 'cake', rows: [['Shortcake', '6.5'], ['Matcha roll', '5.8'], ['Mont blanc', '6.2'], ['Sakura mochi', '3.5'], ['Fruit tart', '5.6']] },
  },
};

export const defaults = {
  shop: 'sweets',
  // footprint of the main block (local metres). The front corner (+x,+z) is chamfered for the entrance.
  Xb: 4.6, Xf: 2.8, Zb: 2.9, Zf: 2.5, chamfer: 1.55,
  plinthH: 0.5,
  bandY: 3.42,       // storey separation band
  eaveH: 6.35,       // wall top / eave line
  roofSlope: 0.86,   // rise per metre of run
  overhang: 0.48,
  wallT: 0.32,
  portalT: 0.95,     // depth of the entrance reveal in the chamfer

  // openings in each façade's local coords: u from the façade's screen-left end.
  facades: {
    L: { // long street façade
      display: [{ u: 0.75, w: 1.9 }, { u: 3.5, w: 1.9 }],
      upper: [{ u: 1.15, w: 1.1 }, { u: 3.9, w: 1.1 }],
    },
    R: { // short side façade (gable end)
      display: [{ u: 0.475, w: 1.85 }],
      upper: [{ u: 0.85, w: 1.1 }],
    },
  },
  dormerX: -2.9,
  chimneyX: 0.55,
  annex: true,
  decorationDensity: 1, // 0 = bare architecture, 1 = full set, 0.5 = essentials
  // outline widths in CSS px; hosts with thinner house lines can pass their own
  lineWeights: { outer: 2.3, mid: 1.5, thin: 1.0, hatch: 0.9, soft: 1.0, hull: 1.7 },
  plate: { x0: -7.9, x1: 6.4, z0: -4.0, z1: 6.2 },
};
