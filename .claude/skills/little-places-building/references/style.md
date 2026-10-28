# Style reference

Contents: 1 Rendering · 2 Palette · 3 Proportions · 4 Detail tiers and budget · 5 Ground and shadow · 6 Print (atlas) · 7 Composition and life

## 1 Rendering

The page owns the renderer, camera and lights (`series/src/main.js`): `OrthographicCamera`, `HemisphereLight(0xffffff, 0xc3b59e, 1.8)` plus one `DirectionalLight(0xffffff, 1.4)` at (-3, 12, 8), default view at azimuth 25°, elevation 28°, distance 23.5 (`VIEW` in `main.js`, matched to the owner's preferred angle); the collection opens at 220% on desktop, 155% on phones, single places at 145%. Front faces (+z) read a little wider than side faces (+x). A building module owns none of these. It returns a `THREE.Group` and never touches the DOM.

**Materials**

- Solid surfaces: `MeshToonMaterial` with one shared 3-step gradient map. This is what gives the flat illustrated light:
  ```js
  const gradient = new THREE.DataTexture(new Uint8Array([185, 222, 255]), 3, 1, THREE.RedFormat);
  gradient.minFilter = gradient.magFilter = THREE.NearestFilter; gradient.needsUpdate = true;
  ```
- Glass: `MeshBasicMaterial`, colour around `#BFE0DC`, `transparent`, opacity 0.13–0.16, `depthWrite: false`, `DoubleSide`. Add one or two thin diagonal white reflection strips (opacity ≈ 0.45) per pane; the glass itself should almost disappear so the interior reads.
- Ink and chalk details: `MeshBasicMaterial` (`#352F2A` ink, `#34413B` chalkboard).
- Lamps and bulbs: one `MeshBasicMaterial` "glow" (`#FFE3A1`) that interactions can recolour.
- No `MeshStandardMaterial`, no shadow maps, no extra lights, no post-processing. Light changes (night, lights off) are drawn by changing colours and emissive values, not by adding lights.

**Outlines**

- Set `mesh.userData.outline = true` on parts whose edges carry the drawing: walls, frames, furniture, signs, display books, pots. `finishModel` turns those into ink lines (`EdgesGeometry` at 28°, colour `#252525`, width 1.05 px; boxes taller than 2 m get 1.45 px).
- Leave edge outlines off for things that would turn into scribble: shelf books, tiny leaves and berries, thin rods, tubes, tiny trims, glass, atlas planes. `rod`, `tube`, `sphere` and `cone` in the primitives default to no outline for this reason.
- Lines are batched per building and per dynamic part, so outlined meshes in a moving leaf get their own line set automatically.

**Round shapes get an ink silhouette (inverted hull)**

Edge lines only appear at hard corners, so a sphere, a canopy or a round pot would otherwise have no outline at all and look pasted on. Give every *feature-sized* round form — tree canopies and blossom clusters, potted shrubs and topiary balls, trunks and branches, round pots and tubs, lamp globes — an ink silhouette, the cute "drawn" look of the Sakura Sweets and Sakura Café trees.

- Use `templates/outline.js`: `createHullMaterial(1.25)` makes one back-facing ink material that pushes a copy of the mesh outwards by a constant number of **pixels** (so the line stays as thin as the edge lines at every zoom); `hull(mesh, material)` adds that copy with the same geometry and transform.
- Use smooth geometry for hulled shapes (`IcosahedronGeometry(r, 3)` or spheres with ≥ 16 segments; cylinders with ≥ 24 segments), otherwise the silhouette shows facets.
- Width 1.25 px matches the series; the Sweets kit uses 1.3.
- Expose the material as `outlineMaterials: [m.hull]` on the model. The collection appends it to the building's line materials so it gets `resolution` updates on resize, and a standalone viewer must do the same.
- Skip hulls for small repeated items (leaves under ~6 cm, berries, petals, shelf books): there the line is louder than the shape. Each hull doubles the triangles of its shape, so count it in the budget.

## 2 Palette

**Fixed tokens (never change with the swatches)**

| Token | Hex | Use |
| --- | --- | --- |
| ink | `#352F2A` (lines `#252525`) | outlines, lettering, tiny dark details |
| paper / page | `#F7F3E9` | page background — the ground plane colour |
| cream | `#F4EAD6` | trims, cornices, awnings, sign boards |
| paper (light) | `#FBF5E8` | pages, cups, light fabric |
| wood | `#C89C70` | furniture, decks |
| wood light | `#DDBA8E` | planks, crates |
| walnut | `#735743` | dark frames, legs, railings |
| stone | `#E3D6BC` | plinths, thresholds, skirting |
| paving / joint | `#FBF7EB` / `#D8CBA9` | the paved base — the dessert shop's white paving with soft beige joints (no outline on joints) |
| brass | `#D6A34B` | handles, rails, fittings |
| leaf / light / deep | `#7FAF8A` / `#A9CFA0` / `#5E8F6E` | plants |
| terracotta | `#C9765F` | pots |
| butter / coral / powder blue | `#F3CF76` / `#D77C68` / `#94B9D8` | small accents (cushions, umbrellas, mugs) |
| glow | `#FFE3A1` | lamps on |
| shadow | `#92A6CF` | the projected shadow |

**The five swatches** (page order, shared by every building): Butter yellow `#F6C445`, Pistachio `#9AD5B6`, Rose milk `#EFA8C4`, Blue hour `#91B7EB`, Terracotta `#EF745F`.

Each building defines `themes[5]` in that order, softened for walls, e.g. the bakery `{wall, accent, roof, trim}` and the bookshop `{wall, frame, accent}`:

| Swatch | Wall (soft) | Frame (deeper) | Accent |
| --- | --- | --- | --- |
| Butter | `#F3CF76` | `#DDB052` | coral |
| Pistachio / mint | `#A8CDBB` | `#7FB39C` | coral |
| Rose | `#EBB3A6` | `#D58E7E` | powder blue |
| Blue | `#AAC7E0` | `#83A8CB` | butter |
| Terracotta | `#F0B29D` | `#D86651` | pistachio |

A building may name a scheme differently (the bookshop's fifth is lavender `#C5B9DE`), but the swatch button keeps its page name, so say so in the report. `setPalette(i)` only recolours `wall`, `frame`, `accent` (and roof/trim if the building has them). If the building's natural default isn't swatch 0, set its initial `colourIndex` in `collection.js`.

Saturation rule of thumb: walls are the softest colour in the scene; accents are small; the darkest values are walnut and ink. One loud colour per building (an orange-red roof, a coral rug) is enough.

## 3 Proportions

The common standard (between the compact GPT café and the roomier Claude shops):

| Element | Size |
| --- | --- |
| Door leaf | 2.1–2.2 m tall; single 0.9–1.0 m wide, double 1.2–1.4 m |
| Storey (floor to floor) | 2.9–3.1 m; shop ground floor up to 3.2 m |
| Shop floor above street | 0.30–0.35 m (street `0.155`, floor ≈ `0.5`), reached by 2–4 treads |
| Building body footprint | about 5.5–6.5 × 3.5–4.5 m |
| Paved base | about 8.5–9 × 6–6.5 m, so there is a pavement of 1.5–2 m in front |
| Window | sill 0.5–0.6 m above floor, head ≈ 2.4–2.5 m |
| Wall thickness | 0.2 m |
| Sign board | 0.5–0.7 m tall, about 2/3 of the façade width |
| Counter / table / seat | 0.9–0.95 / 0.72–0.78 / 0.45 m |
| Books on shelves | 0.17–0.32 m tall, 0.025–0.07 m thick |
| Overall height | one storey + terrace ≈ 4.7 m; two storeys + pitched roof ≈ 6.5–7 m |

Collection framing values for a new building start from the bookshop's and get tuned by screenshot: `scale: 1.0, pivot: 2.4, span: 10.6, width: 12.4` (pivot ≈ half the height of the main mass; span and width grow with height and base size). If the building only looks right at a scale far from 1.0, fix the model rather than the scale.

## 4 Detail tiers and budget

| Tier | What | How |
| --- | --- | --- |
| Large | walls, roofs, base, awning canopy | flat toon blocks, clean silhouette, outlined |
| Medium (5 cm – 1 m) | frames, mullions, doors, lamps, furniture, crates, pots, shelves | real geometry; outline the ones that define shape |
| Small (< 5 cm) | lettering, posters, menus, patterns, price cards, page text | printed on the atlas, applied to planes |

Budget per building: ≤ 120k triangles, ≤ 15k outline segments, ≈ 100 batched meshes (one per material plus line sets). For reference, measured in the collection: café 57k, grocery 40k, bookshop 96k, sweets 149k, bakery 169k, flowers 204k triangles. The last two are over the target; do not copy their sphere counts.

The verify template measures the budget and fails above it; Pizza Piccola came in at 131k on its first run and 90k after trimming.

Ways to stay in budget: `sphere(…, [8, 6])` for leaves and small fruit, `cylinder` segment counts of 10–18, cached geometry with quantised sizes (the bookshop rounds book sizes to 5 mm so they share geometry), no outlines on repeated small items.

## 5 Ground and shadow

- `PavedBase(root, m, { w, d, cx, cz })`: 0.15 m slab with top at 0.155, a cream trim course below, a ring of curb stones, faint expansion joints. All outdoor floors use the dessert shop's colours: paving `#FBF7EB`, joints `#D8CBA9` drawn as thin unoutlined rods. A ring of road around every building was tried and rejected — streets belong only to buildings that already have them (grocery, dessert shop). Size it so the building plus its forecourt/deck fits with ≈ 0.3 m margin.
- Raised floor: a stone plinth with a cream top lip, from 0.155 to the shop floor.
- `createIllustrationShadow(group)` projects every opaque `BoxGeometry`/`ExtrudeGeometry` (volume > 0.025 m³) to `x − 0.6·y, z + 0.27·y` at y = −0.355, colour `#92A6CF`. For buildings on the raised paved base the collection lifts it to `y = 0.35`; add the new id to that list in `collection.js`. The shadow therefore falls back-left; keep the main façade facing +z and the side entrance facing +x so both stay in light.
- Only boxes and extrusions cast this shadow, so a cylinder-heavy object (a tree, a pot) casts none — that is intended.
- **The shadow must be seen.** It is drawn just below the page (`y ≈ 0`), so wherever it falls on the building's own paved base it is hidden under the paving. A building whose shadow falls mostly on its own forecourt (Pizza Piccola's terrace) sets `shadowFloor: [{ x0, x1, z0, z1, y: GROUND + 0.004 }]` on the model (one entry per floor level); the collection then adds `floorShadow()` (`series/src/shadowFloor.js`), the same projection clipped to each rectangle and cast only by parts taller than 0.5 m, so the paving and curbs don't shade themselves.
- Light comes from the back-right: faces pointing +x and +z are lit, shadows go to −x and +z. Keep that consistent; never add a second shadow direction.

## 6 Print (atlas)

One `CanvasTexture` (2048 × 1536) per building holds every word and tiny picture, split into named cells; `attach(parent, key, w, h, pos, turn)` puts a cell on a plane. Keep cell aspect equal to the plane's so letters are not stretched.

- Sign: serif (Georgia) for names, often italic lowercase or spaced capitals; two small coral dots as ornaments.
- Boards: chalk-green background with cream lettering and a wood border.
- Posters and cards: cream ground, 4 px ink frame, one or two flat colour shapes.
- Copy is short and friendly English (with optional Japanese/French flavour matching the shop): "come on in", "Today's picks", "9:00 — 20:00 · closed on mondays".
- A plane lying flat needs `rotation.x = -Math.PI / 2` after `attach`.

## 7 Composition and life

- Main façade faces +z, a secondary entrance or deck faces +x — both are lit and visible from the default camera.
- Awnings are striped: alternating coral (`#E0715B`/`#D77C68`) and cream bands about 0.22–0.28 m wide, a scalloped valance with one scallop per stripe, side cheeks and iron arms. Curved (bowed) awnings stripe the same way, one extruded profile per band.
- Roof surfaces contrast the walls: yellow walls → green roof floor (`#A8CDBB`); mint or blue walls → cream or butter. Store it as a theme token (`deck`, `roof`).
- Flat rooftop signs and props turn 25° (the default azimuth) to face the camera.
- One signature element that comes from architecture (awning, glasshouse, lantern, terrace, dormer). Keep it in proportion with the building.
- Interior visible through the glass: back wall shelving, a counter, one cosy corner, pendant lamps. Line the inside of the back and side walls with a warm plaster colour.
- Outside: 8–15 prop groups around one theme (for a bookshop: crates, a picks stand, a chalkboard, a bench with an open book). Leave clear walking space at the door and on the steps.
- Plants soften corners: pots at ends of walls and steps, one climbing vine, trailing plants over a parapet. Vines need enough leaves to read as foliage, not string.
- Small narrative touches: an open book on a chair, a coffee cup, a blanket over a chair back, an umbrella stand.
