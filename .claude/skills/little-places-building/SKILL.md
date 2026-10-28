---
name: little-places-building
description: House style and build workflow for the "Little Places" Three.js building collection (isometric toon buildings with ink outlines, warm palette, paved base, illustrated blue shadow, collection web page in web/). Use this skill whenever the user wants to add a new building/shop/place to the collection, redesign or refine an existing one (café, grocery, bakery, flower shop, dessert shop, bookshop…), asks for something "in the same style as the series", or mentions proportions, palette, outlines, props, interactions or verification for these buildings — even if they only name the shop (e.g. "做一个面包店", "make a ramen stall", "add a 07").
---

# Little Places building style

Little Places is a set of small isometric shop buildings rendered with Three.js and shown together on one page (`web/`). Every building must look like it was drawn by the same illustrator: flat toon colour, dark ink outlines, a warm limited palette, a cream paved base, a soft blue projected shadow, and a lot of small lived-in detail that never gets noisy.

The standard below blends the two hands that built the series: the **GPT buildings** (Sakura Café, Yamada Grocery — clean silhouettes, big colour blocks, print on a texture atlas, light geometry) and the **Claude buildings** (Bonjour Bakery, Hanaya Flowers, The Little Bookshop — human-scale proportions, shared paved base, real interiors, grounded props, more interactions). Take restraint from the first and life from the second.

## Where things live

| Path | What it is |
| --- | --- |
| `web/` | The collection page: `src/collection.js` (definitions), `src/main.js` (state, buttons, animation), `index.html`, `src/style.css`, `scripts/verify*.mjs` |
| `buildings/06-little-bookshop/` | **The reference implementation.** Copy its structure for a new building |
| `buildings/03-bonjour-bakery/`, `buildings/04-hanaya-flowers/src/shop/` | Other buildings in the current standard |
| `buildings/01-sakura-cafe/`, `buildings/02-yamada-grocery/` | GPT originals; `buildings/02-yamada-grocery/src/optimize.js` holds the shared `finishModel` + `createIllustrationShadow` |
| `buildings/05-sakura-sweets/` | Sakura Sweets — an older self-contained kit (`prebaked`), not a template |
| `.claude/skills/little-places-building/` | This skill (Claude Code loads it from here); the packaged copy for claude.ai is `skill/little-places-building.skill` |

Read `references/style.md` before modelling, `references/integration.md` before touching the page, and `references/pitfalls.md` before calling anything finished. `templates/` has starter files (primitives, building skeleton, outline hull, A-frame chalkboard, verify script).

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
- **Chalkboard A-frames come from `templates/ABoard.js`, never hand-built.** The two leaves hinge together at the top and hang down and outwards (Λ), with the hinge at `L·cos(a)` so both feet land on the ground. This has gone wrong in four buildings (floating boards, boards opening into a V); the verify template asserts it.
- **Ground:** street surface at `y = 0.155` on the shared `PavedBase`; shop floor raised to about `0.5`. Every prop's lowest point touches a surface — check A-boards, easels, crates and stools in a close side view.
- **Rendering goes through the shared pipeline:** `MeshToonMaterial` with the 3-step gradient, `userData.outline` per mesh, `finishModel` for batching and ink lines, `createIllustrationShadow` for the shadow. Do not add lights, shadow maps, PBR materials or post-processing.
- **Round shapes are inked too.** Tree canopies, shrubs, trunks, round pots and globes get a constant-pixel ink silhouette via `templates/outline.js` (inverted hull), not just edge lines — see `references/style.md` → Round shapes.
- **Colours come from tokens.** Building colours (`wall`, `frame`, `accent`, roof if any) change with the five swatches; books, food, plants, wood and metal keep their own colours.
- **Three tiers of detail:** big masses as flat blocks, mid-size parts as geometry, anything smaller than ~5 cm (lettering, posters, patterns, tiny icons) printed on the atlas.
- **Moving parts** live in a hinge group whose child leaf group is listed in `dynamic` and carries `userData.action`. A dynamic group must never sit inside another dynamic group.
- **Budget:** ≤ 120k triangles, ≤ 15k outline segments, roughly ≤ 100 batched meshes per building. Spheres are the usual culprit; pass low segment counts.
- **The signature element must belong to the building.** A giant croissant on a bakery roof was removed as "too abrupt"; a lantern and chimney replaced it. Prefer architecture over mascots.
- **Every building shows its light and shadow.** Toon shading on the faces plus the blue projected shadow falling back-left and slightly forward. If that shadow lands on the building's own forecourt (a terrace, a wide pavement) it must be drawn on the paving too (`shadowFloor`), or the building looks pasted on. See `references/style.md` → Ground and shadow.
- **Outdoor floors are the dessert shop's white.** Paving `#FBF7EB` with soft beige joints `#D8CBA9` (no ink on the joints), cream curb stones at the edge. Every building, old or new. Don't add roads around buildings unless the user asks.
- **Awnings are always striped** — two-colour bands (coral and cream by default) with one scallop per stripe on the valance. No plain canopies.
- **Roof and wall contrast.** A flat roof or roof terrace takes the opposite temperature to the walls: warm walls (butter, rose, terracotta) get a green roof floor, cool walls (mint, blue) a cream or butter one. Put the roof colour in the theme so it changes with the swatches.
- **Rooftop signs face the camera.** A flat sign or giant prop on the roof turns to the default camera's azimuth (`rotation.y = 25°`) so it faces the viewer instead of showing its edge.
- **Nothing important behind something else** from the default camera (azimuth 25°, elevation 28°, collection at 220%): signs not crossed by lamps, doors not hidden by awnings, labels anchored on visible parts.

## Definition of done

- Default, front, side, roof (top-down) and interior (see-through) screenshots look finished, plus 390 px mobile with no horizontal overflow.
- Every interaction works from its button and from a click on the model; reduced-motion snaps instead of animating.
- `npm run check`, every `check:<building>` script, `check:navigation`, `check:rotation` and `npm run build` pass with zero console errors.
- The final report says what was verified and what was not (e.g. no real-device or frame-rate test).
