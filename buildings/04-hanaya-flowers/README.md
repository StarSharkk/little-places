# Hanaya Flowers · 花屋

Fourth place for the Little Places collection: a one-storey flower shop with a **glasshouse on the roof** (the bakery wears a cake, the café a dormer, the grocery a rooftop of antennas). Real Three.js geometry, flat toon materials, transparent glass, a single canvas text atlas. It is written with the same primitives, materials pipeline and outline finishing as `grocery/` and `series/src/bakery`, so it renders identically in the collection.

```sh
cd "flower shop"
npm install
npm run dev        # http://127.0.0.1:5177
npm run build && npm run preview   # http://127.0.0.1:4177
```

Node.js 20.19+ / 22.12+ (same as the collection). The viewer imports `../grocery/src/optimize.js` for outlines and the projected shadow, so keep the folders side by side.

## What is on the model

- **Storefront** — a wall slab with real openings: an arched door under a striped *shell hood*, a wide display window with a striped scalloped awning, double mouldings, a brand sign printed from the atlas, a flower wreath and OPEN card on the door.
- **Roof terrace + glasshouse** — mint roof slab with a parapet, flower boxes hung over the edge, pots, a bench, and a glass-and-frame glasshouse (sill, posts, rafters, gable ends, finials) full of potted plants on tiered benches. One bay of the roof is a hinged **vent**.
- **Inside** — checker floor, back shelving with pots and hanging dried bunches, a florist's workbench (paper roll, ribbon spools, till, bouquet), a wrapping table with stools, a tiered display stand behind the window, hanging planters. Visible through the glass, and fully through *See-through*.
- **Ground** — the collection's illustrated paving (`PavedBase` in `primitives.js`: slab, trim course, curb stones, joints), the same as the café forecourt and the bakery. Street props stand on it at `GROUND = 0.155`.
- **Street** — four buckets of cut flowers, topiary, pots, watering can, chalkboard ("Fresh blooms"), a flower cart, a ladder shelf, climbing roses on a trellis, a round hanging sign, a side plaque.
- **Flowers** — tulips, daisies, roses, lavender, sunflowers and baby's-breath fillers are generated from a few low-poly parts (`Flowers.js`), arranged by golden-angle bunches rather than scattered by hand.

## Interactions (state is owned by the host page, like the other buildings)

| Object | Action |
| --- | --- |
| `door.leaf` (`userData.action = 'flowerDoor'`) | rotate `door.hinge.rotation.y` towards `-0.56π` |
| `vent.leaf` (`'flowerVent'`) | `setVent(0..1)` lifts the glasshouse pane |
| `pickup` (`'flowerPick'`) | move between `pickHome` (workbench) and `pickAway` (cart) |
| See-through | `setSeeThrough(true)` hides shell, roof, vent and window glazing |
| Colour | `setPalette(0..4)` — Butter, Pistachio, Rose, Blue, Terracotta |

## Reusing it

```js
import { createFlowerShop } from './shop/FlowerShop.js';
import { finishModel, createIllustrationShadow } from '../grocery/src/optimize.js';

const shop = createFlowerShop({ scale: 1, position: [0, 0, 0] });
const shadow = createIllustrationShadow(shop.group);          // before batching
const lines = finishModel(shop.group, shop.dynamic);          // batches + screen-width outlines
scene.add(shop.group, shadow);
lines.forEach(m => m.resolution.set(width, height));          // on resize
```

`shop.dynamic` lists the parts that must stay out of the static batches (`shell`, `roof`, `vent.leaf`, `door.leaf`, window glazing, `pickup`) — they keep their own transforms and visibility. A movable part must **not** be nested inside another dynamic group (finishModel bakes each dynamic group's meshes into that group).

### Adding it to the `series/` collection

`series/` currently has uncommitted work, so nothing there was touched. To register the shop, mirror what the bakery does:

1. `series/vite.config.js` — add the alias `'@flowers': relative('../flower shop/src/shop/FlowerShop.js')`.
2. `series/src/collection.js` — `import { createFlowerShop } from '@flowers';`, create it next to the others and add a definition:

   ```js
   { id:'flowers', number:'04', title:'Hanaya Flowers', native:'花屋', description:'Fresh blooms, picked for you.',
     model:flowers, dynamic:flowers.dynamic, scale:1.0, pivot:2.55, span:10.8, width:11.8, labels:flowers.labels }
   ```

   and in `item.setColour`: `else if(item.id==='flowers')flowers.setPalette(index)`.
3. `series/src/main.js` — tab + deep link (`#flowers`), and in the loop animate `flowers.door.hinge.rotation.y`, `flowers.setVent(amount)` and `flowers.pickup.position` exactly like the bakery's door and bag; handle the actions `flowerDoor`, `flowerVent`, `flowerPick` in `pick` / `pointerup`.

Suggested `pivot/span/width` values come from this folder's viewer (`src/main.js`: `PIVOT`, `SPAN`, `WIDTH`).

## Files

```
src/shop/FlowerShop.js   createFlowerShop(): assembly + API
src/shop/Architecture.js walls with openings, arched windows, awning, shell hood, storefront, door
src/shop/Roof.js         terrace roof, parapet planters, glasshouse, hinged vent
src/shop/Flowers.js      bloom generators, bunches, buckets, pots, planter boxes, bouquet, watering can
src/shop/Details.js      interior, street furniture, cart, ladder shelf, roses, hanging sign
src/shop/Atlas.js        one 2048 × 1024 canvas for every printed label
src/shop/materials.js    shared toon materials + five themes
src/shop/primitives.js   cached geometry helpers, arch / wall-with-holes builders
src/main.js              standalone viewer (same renderer set-up as the collection)
scripts/verify.mjs       Chrome/Playwright checks, writes screenshots/verification.json
scripts/shot.mjs         one-off screenshot helper: node scripts/shot.mjs name az el zoom x y z
```

All geometry is code; the only texture is a Canvas drawn at runtime. No reference screenshots or downloaded models are embedded.

## Verification

`npm run check` (with a server running) drives desktop 1440 × 1040 and mobile 390 × 844: door button and a raycast click on the 3D door, glasshouse vent, See-through and bouquet pickup, all five palettes, labels, front/side views, orbit drag, zoom, and a mobile overflow check. Results are recorded in `screenshots/verification.json`. Headless Chrome here uses software WebGL, so frame rates were not measured; physical devices and M1 performance are untested.
