---
name: little-places-building
description: House style and build workflow for "Little Places" Three.js buildings (isometric toon buildings with ink outlines, warm palette, paved base, illustrated blue shadow). Works on its own — the skill ships a starter kit with the rendering pipeline, a viewer and a reference building — or inside the Little Places repo and its collection page (web/). Use this skill whenever the user wants to add a new building/shop/place to the collection, redesign or refine an existing one (café, grocery, bakery, flower shop, dessert shop, bookshop…), asks for something "in the same style as the series", or mentions proportions, palette, outlines, props, interactions or verification for these buildings — even if they only name the shop (e.g. "做一个面包店", "make a ramen stall", "add a 07").
---

# Little Places building style

Little Places is a set of small isometric shop buildings rendered with Three.js. Every building must look like it was drawn by the same illustrator: flat toon colour, dark ink outlines, a warm limited palette, a cream paved base, a soft blue projected shadow, and a lot of small lived-in detail that never gets noisy.

The standard below blends the two hands that built the series: the **GPT buildings** (Sakura Café, Yamada Grocery — clean silhouettes, big colour blocks, print on a texture atlas, light geometry) and the **Claude buildings** (Bonjour Bakery, Hanaya Flowers, The Little Bookshop — human-scale proportions, shared paved base, real interiors, grounded props, more interactions). Take restraint from the first and life from the second.

## Two ways to work

- **Standalone (any folder):** copy `kit/` from this skill into the project folder, then `npm install`, `npx playwright install chromium` and `npm run dev` (port 5180). The kit has everything the series needs and nothing else: `buildings/shared/` (primitives, ink hull, A-frame, striped awning, street edges, props, motion, steam, and the rendering pipeline `finish.js` + `shadowFloor.js`), a one-building viewer (`src/viewer.js`, registry in `src/places.js`), a generic check (`npm run verify -- <id>`) and the reference building `buildings/09-little-post-office/`. Build new places in `buildings/<NN-name>/` from `templates/Building.template.js` and register them in `src/places.js`. Read `references/integration.md` → Standalone kit.
- **Inside the Little Places repo** (there is a `web/src/collection.js`): use the repo's own files — the table below — and add the building to the collection page (`references/integration.md` → The collection page). Don't copy the kit into the repo; its files came from there.

## Where things live in the repo

| Path | What it is |
| --- | --- |
| `web/` | The collection page: `src/collection.js` (definitions), `src/main.js` (state, buttons, animation), `index.html`, `src/style.css`, `scripts/verify*.mjs` |
| `buildings/06-little-bookshop/` | **The reference implementation.** Copy its structure for a new building |
| `buildings/03-bonjour-bakery/`, `buildings/04-hanaya-flowers/src/shop/` | Other buildings in the current standard |
| `buildings/01-sakura-cafe/`, `buildings/02-yamada-grocery/` | GPT originals; `buildings/02-yamada-grocery/src/optimize.js` holds the shared `finishModel` + `createIllustrationShadow` |
| `buildings/05-sakura-sweets/` | Sakura Sweets — an older self-contained kit (`prebaked`), not a template |
| `buildings/08-bubble-laundry/` | Reference for motion: a reusable component (`Washer.js`), a deltaTime drum, a timed sequence (vending) and a curved glass corner |
| `buildings/09-little-post-office/` | Reference for curved architecture (a round tower set half into a two-storey façade over the door, two storeys of curved glass, print on a curved band) and repeatable sequences (`timeline`) |
| `buildings/shared/` | Shared helpers: path motion, spin, timelines, steam particles, street edges, street props |
| `.claude/skills/little-places-building/` | This skill; `skill/build.sh` refreshes its kit from the repo and packages `skill/little-places-building.skill` |

Read `references/style.md` before modelling, `references/motion-light.md` for anything that moves on its own, glows or steams, `references/integration.md` before touching a page, and `references/pitfalls.md` before calling anything finished. Shared parts are in `buildings/shared/` (the kit's copy is `kit/buildings/shared/`); `templates/` has the building skeleton and the collection page's verify template.

## Workflow

Work in phases and look at a screenshot at the end of each one. Proportion and silhouette mistakes are cheap in phase 1 and expensive in phase 5.

0. **Look first.** Open the reference building (`buildings/09-little-post-office/`; in the repo also the bookshop) and, in the repo, one neighbouring building. Note the measurements in `G` (ground, floor, walls) and how materials, atlas and dynamic parts are organised. Do not refactor or restyle other buildings unless asked; the user has said so repeatedly.
1. **Blockout** — paved base, plinth, walls with real openings, roof, the one signature element (awning, glasshouse, terrace, lantern…). Check silhouette and proportions against `references/style.md` → Proportions.
2. **Façade** — window frames and mullions, glazing, sign with atlas lettering, lamps, doors as hinge groups, trims (dado, cornice, corner posts).
3. **Interior** — floor, wall linings, the furniture that tells what the shop sells, readable through the glass from the default camera.
4. **Life** — roof furniture, street and threshold props, plants and vines. Everything stands on a surface.
5. **Materials and outlines** — every colour from the palette tokens; outlines only where they help; budget check.
6. **Interactions** — 3–4 per building (door + 2–3 that are specific to the shop), each with a button and a click target on the model.
7. **Integrate and verify** — standalone: register in `src/places.js`, list the model's `interactions`, run `npm run verify -- <id>` (add `verify.extra.mjs` for the shop's own checks). In the repo: register in the collection, add buttons, write `web/scripts/verify-<id>.mjs`, run every check plus `npm run build`. Look at the screenshots; report only what was actually checked.

## Rules that are easy to get wrong

These are the rules that past work broke. The reasoning is in the reference files.

- **Units are metres at human scale.** Door leaf 2.1–2.2 m, storey 2.9–3.1 m, counter 0.9–0.95 m. Aim for collection `scale: 1.0`; if a building needs 0.8 or 1.1 to sit with the others, its proportions are off.
- **Chalkboard A-frames come from `buildings/shared/ABoard.js`, never hand-built.** The two leaves hinge together at the top and hang down and outwards (Λ), with the hinge at `L·cos(a)` so both feet land on the ground. This has gone wrong in four buildings (floating boards, boards opening into a V); the verify template asserts it.
- **Ground:** street surface at `y = 0.155` (from `streetEdge`); shop floor raised to about `0.5`. Every prop's lowest point touches a surface — check A-boards, easels, crates and stools in a close side view.
- **Rendering goes through the shared pipeline:** `MeshToonMaterial` with the 3-step gradient, `userData.outline` per mesh, `finishModel` for batching and ink lines, `createIllustrationShadow` for the shadow (`buildings/shared/finish.js` in the kit; the viewer or collection page calls them, never the model). Do not add lights, shadow maps, PBR materials or post-processing.
- **Round shapes are inked too.** Tree canopies, shrubs, trunks, round pots and globes get a constant-pixel ink silhouette via `buildings/shared/outline.js` (inverted hull), not just edge lines — see `references/style.md` → Round shapes.
- **Colours come from tokens.** Building colours (`wall`, `frame`, `accent`, roof if any) change with the five swatches; books, food, plants, wood and metal keep their own colours.
- **Three tiers of detail:** big masses as flat blocks, mid-size parts as geometry, anything smaller than ~5 cm (lettering, posters, patterns, tiny icons) printed on the atlas.
- **Moving parts** live in a hinge group whose child leaf group is listed in `dynamic` and carries `userData.action`. A dynamic group must never sit inside another dynamic group. Continuous motion goes through `animate(dt, time)`, particles through `userData.live`; light sources are unlit materials so Night mode lights them.
- **Budget:** ≤ 120k triangles, ≤ 15k outline segments, roughly ≤ 100 batched meshes per building. Spheres are the usual culprit; pass low segment counts.
- **The signature element must belong to the building.** A giant croissant on a bakery roof was removed as "too abrupt"; a lantern and chimney replaced it. Prefer architecture over mascots.
- **Every building shows its light and shadow.** Toon shading on the faces plus the blue projected shadow falling back-left and slightly forward. If that shadow lands on the building's own forecourt (a terrace, a wide pavement) it must be drawn on the paving too (`shadowFloor`), or the building looks pasted on. See `references/style.md` → Ground and shadow.
- **Outdoor floors are the dessert shop's white, with one of three edges.** Paving `#FBF7EB`, soft beige joints `#D8CBA9` (never inked). Build the ground with `streetEdge()` from `buildings/shared/street.js` and pick the edge at random, varying it between neighbours: `'curb'` (cream curb stones), `'rail'` (clean edge, road along the public sides, a short iron railing — like 05 and 08) or `'tactile'` (yellow tactile paving, clean edge, road — like 02). Roads only run along public sides, never as a full ring. It returns `floors` for `shadowFloor`.
- **Awnings are always striped** — two-colour bands (coral and cream by default) with one scallop per stripe on the valance: `Awning()` from `buildings/shared/awning.js`. No plain canopies.
- **Roof and wall contrast.** A flat roof or roof terrace takes the opposite temperature to the walls: warm walls (butter, rose, terracotta) get a green roof floor, cool walls (mint, blue) a cream or butter one. Put the roof colour in the theme so it changes with the swatches.
- **Rooftop signs face the camera.** A flat sign or giant prop on the roof turns to the default camera's azimuth (`rotation.y = 25°`) so it faces the viewer instead of showing its edge.
- **Nothing important behind something else** from the default camera (azimuth 25°, elevation 28°, collection at 220%): signs not crossed by lamps, doors not hidden by awnings, labels anchored on visible parts.

## Definition of done

- Default, front, side, roof (top-down) and interior (see-through) screenshots look finished, plus 390 px mobile with no horizontal overflow.
- Every interaction works from its button and from a click on the model; reduced-motion snaps instead of animating.
- Standalone: `npm run verify -- <id>` passes and `npm run build` works. In the repo: `npm run check`, every `check:<building>` script, `check:navigation`, `check:rotation` and `npm run build` pass with zero console errors.
- The final report says what was verified and what was not (e.g. no real-device or frame-rate test).
