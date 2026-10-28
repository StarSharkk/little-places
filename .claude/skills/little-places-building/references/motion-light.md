# Motion, light, particles, transparency

Read this when a building moves on its own (drums, trams, letters, steam) or glows (neon, lamps, night windows).

## Ambient motion

- The page drives time. A model may expose `animate(dt, time)`; the page calls it every frame only while the place is on screen, the tab is visible and reduced motion is off. Return `true` while you need more frames, `false` when still — when every model returns `false` the page stops drawing. Example: Pizza Piccola's chimney smoke (`buildings/07-pizza-piccola/Pizzeria.js`).
- With reduced motion `animate` is never called: the model's starting pose must look finished on its own.
- One-off motions the user triggers stay setters (`setX(amount)`) driven by the page when they are a single 0…1 pose (doors, lids). A multi-step sequence that should be repeatable (a letter posted, a parcel carried through a window) is a `timeline(duration, pose)` stepped from `animate`: `start(instant)` plays it (or snaps to the end with reduced motion), `running` tells the page and the verify script when it is done. Example: `buildings/09-little-post-office/PostOffice.js`.
- Shared helpers in `buildings/shared/`, imported as `'../shared/motion.js'`:
  - `track(points, { closed })` → `place(object, u)` puts an object at `u` ∈ 0…1 along a path, evenly by distance, facing along it (trams, letters, conveyors).
  - `shuttle(time, { travel, dwell })` → 0…1 there-and-back timetable with eased starts and stops at each end.
  - `spin(object, time, turnsPerSecond, axis)` for drums, fans, wheels.
  - `timeline(duration, pose)` and `ease(k)` for repeatable sequences; write the pose as a function of `t` only, so any `t` gives a valid frame.
- Street furniture shared by several buildings (`plant`, `Bicycle` with clothes or letters, `Bench`, `CherryTree`, `StreetLamp`) lives in `buildings/shared/props.js`; import it rather than copying.

## How moving parts are built

`finishModel` merges everything in a group into one mesh. So:
- **A rigid part** (drum, tram body, door, letter) is its own group in `dynamic`; animate that group's transform. Two parts that move differently are two dynamic groups, never nested.
- **Hide, never scale to 0.** A dynamic group at scale 0 has no inverse matrix, and baking writes NaN into its geometry (it vanishes for good). Use `visible = false` at rest and keep any grow-in scale ≥ 0.02.
- **A part that travels away from its parent** (the parcel leaving the cart) belongs to the street or building group, not to the thing it starts on, so its path is written in building coordinates.
- **A part that changes every frame** (particles, instanced meshes, morphing water) sets `userData.live = true`: it is neither merged nor cast into the shadow.

## Light and night

- No lights are added. The page's Night button blends the lights, stage and shadows to dusk; toon surfaces dim, while anything with `MeshBasicMaterial` keeps its colour and so reads as lit. Make every light source unlit: bulbs, lamp shades, neon tubes, lit windows, signs, screens.
- `setNight(amount)` (0 day … 1 night) is optional, for extra touches: switch on neon (swap a dull toon colour for a bright basic one), warm the window glass, light a marquee. Keep it cheap: colour changes only, no geometry.
- A "glow" is a bright basic colour plus a slightly larger, paler basic halo shape behind it — never bloom or post-processing.

## Particles

- `steam(parent, material, { count, origin, spread, rise, size, life, drift })` in `buildings/shared/steam.js`: one instanced mesh of puffs that rise, swell and shrink away, so no transparency is needed. Update it from `animate`.
- At most 200 particles per building, one instanced mesh per effect, no outlines on particles.

## Transparency

- Glass, water and mist: `MeshBasicMaterial`, `transparent: true`, opacity 0.12–0.35, `depthWrite: false`, never outlined, never in the shadow. Set `renderOrder` by layer (water 1, glass 2, mist 3) so overlaps draw in a stable order.
- Prefer opaque tricks (shrinking puffs, pale colours) over stacked transparent layers.

## Curved forms

- Curved walls (a round corner, a bow front): build the wall as an `ExtrudeGeometry` of a `Shape` with `absarc`, so it still casts the illustrated shadow and gets ink edges; windows are holes in that shape.
- Japanese and other swept roofs: sweep a curved eave profile with `ExtrudeGeometry` along the ridge, add ridge and gable boards as separate extrusions, and print tile rows rather than modelling each tile. Give the curved parts an ink silhouette with `templates/outline.js`.
