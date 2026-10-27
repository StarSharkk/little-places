# SAKURA CAFÉ — isometric corner house (Three.js)

A two-storey European corner café built as a real 3D model and drawn like a flat vector illustration:
orthographic camera, toon shading with three discrete tones, and constant-pixel-width ink outlines.

```sh
npm install
npm run dev        # http://127.0.0.1:5280
npm run build      # production bundle in dist/
```

## Controls

| Action | Input |
| --- | --- |
| Rotate | drag (touch: one finger) |
| Zoom | wheel / pinch / `+` `−` (zooms toward the cursor) |
| Pan | right-drag, shift-drag, two fingers |
| Open / close door | click the door, or the **Open door** button |
| Coffee menu | click the **SAKURA CAFÉ** sign or the chalkboard · `Esc` closes |
| Colour | five swatches — every material (including the door and signs) follows |
| Reset View | restores the 45° / 33° isometric camera |

Interactive objects lighten slightly on hover and show a small label.

## Reusing the café in another scene

The building is one `THREE.Group`, independent of this page:

```js
import { createCafe } from './src/cafe/CafeBuilding.js';

const cafe = createCafe({ paletteIndex: 0, decorationDensity: 1, ground: false });
street.add(cafe.group);
cafe.group.position.set(12, 0, -6);

cafe.setResolution(innerWidth, innerHeight);   // call on resize (outline pixel widths)
cafe.update(dt);                               // door animation; returns true while moving
cafe.toggleDoor();  cafe.setPalette(2);
// raycast `cafe.pickables` and read `userData.action` ('door' | 'menu') up the parent chain
```

Options (see `src/cafe/config.js`): footprint (`Xb Xf Zb Zf chamfer`), storey and roof heights, overhang,
window/door positions per façade (`facades`), the five `PALETTES`, `annex`, and `decorationDensity`
(0 architecture only · 0.5 + furniture · 1 full set). `ground: false` omits the road/sidewalk/shadow base.
Window heights live in `Window.js` (`WIN`) — change them together with `eaveH`.

The camera-bound light only matters for this demo: the toon material needs one `DirectionalLight`
(intensity π) in the host scene, and `cafe.updateShadow(lx, ly, lz)` re-projects the flat ground shadow
(only when `ground` is on).

## Structure

```
src/cafe/
  config.js        palettes, proportions, openings, density
  kit.js           toon materials (role → palette colour), outline baking, hull outlines, geometry helpers
  Walls.js         footprint, façade frames, wall panels with real openings, plinth, string course, cornice, quoins
  Roof.js          sheared-extrusion roof slabs, fascia/rake boards, ridge, tile courses, chimney, dormer
  Window.js        display + arched windows (surround, sill, sash, glass, shutters, flower box), oculus
  Door.js          arched double-framed entrance, hinged glazed leaf, steps, interior counter
  Awning.js        striped awning with scalloped valance
  Sign.js          SAKURA CAFÉ board (canvas text) and round projecting sign
  Decoration.js    chalkboard, bistro sets, cups, pots, lamps, fence, blossom tree, bicycle, ivy, birds …
  Ground.js        road slab, sidewalk, tile joints, re-projected flat shadow
  CafeBuilding.js  assembles everything → { group, pickables, toggleDoor, setPalette, … }
src/main.js        demo scene: camera, input, UI
```

## How the look is made

* **Orthographic camera**, azimuth 45°, elevation 33° (clamped 16°–64° when dragging).
* **Materials**: `MeshToonMaterial` with a 3-tone gradient map for solids, `MeshBasicMaterial` for glass,
  ink and printed signs. No textures except canvas text, no PBR, no bloom, no shadow maps.
* **Outlines**: `EdgesGeometry` feature edges → merged `LineSegments2` in three weights
  (outer 2.3 px, structure 1.5 px, detail 1 px). Smooth organic shapes (blossoms, tubes) get an
  inverted-hull silhouette with the same pixel width. Intersections that edge detection cannot see
  (dormer/chimney on the roof) have hand-placed lines. Line width thins slightly on small screens.
* **Bevels** are shading-only: outlines are computed from the un-bevelled proxy so edges stay single and uniform.
* **Performance**: parts are merged per material when the model is baked (≈60 draw calls total, door and sign kept
  separate so they can move / highlight), geometry is built once, DPR is capped at 1.75, MSAA only, and the
  canvas renders on demand — nothing is drawn while the view is still.
* The light is attached to the camera, so the illustration keeps the same lit/shaded faces while rotating; the flat
  ground shadow is re-projected from it.

Fonts: Playfair Display / DM Sans from Google Fonts, falling back to Georgia / system-ui offline.
Menu items are sample content.
