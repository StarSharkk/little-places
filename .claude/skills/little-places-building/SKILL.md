---
name: little-places-building
description: House style and build workflow for the "Little Places" Three.js building collection (isometric toon buildings with ink outlines, warm palette, paved base, illustrated blue shadow, collection web page in series/). Use this skill whenever the user wants to add a new building/shop/place to the collection, redesign or refine an existing one (café, grocery, bakery, flower shop, dessert shop, bookshop…), asks for something "in the same style as the series", or mentions proportions, palette, outlines, props, interactions or verification for these buildings — even if they only name the shop (e.g. "做一个面包店", "make a ramen stall", "add a 07").
---

# Little Places building style

Little Places is a set of small isometric shop buildings rendered with Three.js and shown together on one page (`series/`). Every building must look like it was drawn by the same illustrator: flat toon colour, dark ink outlines, a warm limited palette, a cream paved base, a soft blue projected shadow, and a lot of small lived-in detail that never gets noisy.

The standard below blends the two hands that built the series: the **GPT buildings** (Sakura Café, Yamada Grocery — clean silhouettes, big colour blocks, print on a texture atlas, light geometry) and the **Claude buildings** (Bonjour Bakery, Hanaya Flowers, The Little Bookshop — human-scale proportions, shared paved base, real interiors, grounded props, more interactions). Take restraint from the first and life from the second.

## Where things live

| Path | What it is |
| --- | --- |
| `series/` | The collection page: `src/collection.js` (definitions), `src/main.js` (state, buttons, animation), `index.html`, `src/style.css`, `scripts/verify*.mjs` |
| `series/src/bookstore/` | **The reference implementation.** Copy its structure for a new building |
| `series/src/bakery/`, `flower shop/src/shop/` | Other buildings in the current standard |
| `coffee store/`, `grocery/` | GPT originals; `grocery/src/optimize.js` holds the shared `finishModel` + `createIllustrationShadow` |
| `coffee store_claude/` | Sakura Sweets — an older self-contained kit (`prebaked`), not a template |

Read `references/style.md` before modelling, `references/integration.md` before touching the page, and `references/pitfalls.md` before calling anything finished. `templates/` has starter files.

## Workflow

Work in phases and look at a screenshot at the end of each one. Proportion and silhouette mistakes are cheap in phase 1 and expensive in phase 5.

0. **Look first.** Open the bookstore module and one neighbouring building. Note the measurements in `G` (ground, floor, walls) and how materials, atlas and dynamic parts are organised. Do not refactor or restyle other buildings unless asked; the user has said so repeatedly.
1. **Blockout** — paved base, plinth, walls with real openings, roof, the one signature element (awning, glasshouse, terrace, lantern…). Check silhouette and proportions against `references/style.md` → Proportions.
2. **Façade** — window frames and mullions, glazing, sign with atlas lettering, lamps, doors as hinge groups, trims (dado, cornice, corner posts).
3. **Interior** — floor, wall linings, the furniture that tells what the shop sells, readable through the glass from the default camera.
4. **Life** — roof furniture, street and threshold props, plants and vines. Everything stands on a surface.
5. **Materials and outlines** — every colour from the palette tokens; outlines only where they help; budget check.
6. **Interactions** — 3–4 per building (door + 2–3 that are specific to the shop), each with a button and a click target on the model.
7. **Integrate and verify** — register in the collection, add buttons, write `scripts/verify-<id>.mjs`, run every check plus `npm run build`, capture the standard screenshots. Report only what was actually checked.

## Rules that are easy to get wrong

These are the rules that past work broke. The reasoning is in the reference files.

- **Units are metres at human scale.** Door leaf 2.1–2.2 m, storey 2.9–3.1 m, counter 0.9–0.95 m. Aim for collection `scale: 1.0`; if a building needs 0.8 or 1.1 to sit with the others, its proportions are off.
- **Ground:** street surface at `y = 0.155` on the shared `PavedBase`; shop floor raised to about `0.5`. Every prop's lowest point touches a surface — check A-boards, easels, crates and stools in a close side view.
- **Rendering goes through the shared pipeline:** `MeshToonMaterial` with the 3-step gradient, `userData.outline` per mesh, `finishModel` for batching and ink lines, `createIllustrationShadow` for the shadow. Do not add lights, shadow maps, PBR materials or post-processing.
- **Colours come from tokens.** Building colours (`wall`, `frame`, `accent`, roof if any) change with the five swatches; books, food, plants, wood and metal keep their own colours.
- **Three tiers of detail:** big masses as flat blocks, mid-size parts as geometry, anything smaller than ~5 cm (lettering, posters, patterns, tiny icons) printed on the atlas.
- **Moving parts** live in a hinge group whose child leaf group is listed in `dynamic` and carries `userData.action`. A dynamic group must never sit inside another dynamic group.
- **Budget:** ≤ 120k triangles, ≤ 15k outline segments, roughly ≤ 100 batched meshes per building. Spheres are the usual culprit; pass low segment counts.
- **The signature element must belong to the building.** A giant croissant on a bakery roof was removed as "too abrupt"; a lantern and chimney replaced it. Prefer architecture over mascots.
- **Nothing important behind something else** from the default camera (az 45°, el ≈ 32°): signs not crossed by lamps, doors not hidden by awnings, labels anchored on visible parts.

## Definition of done

- Default, front, side, roof (top-down) and interior (see-through) screenshots look finished, plus 390 px mobile with no horizontal overflow.
- Every interaction works from its button and from a click on the model; reduced-motion snaps instead of animating.
- `npm run check`, every `check:<building>` script and `npm run build` pass with zero console errors.
- The final report says what was verified and what was not (e.g. no real-device or frame-rate test).
