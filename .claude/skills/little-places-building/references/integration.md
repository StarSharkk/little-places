# Adding a building to the collection

The page code is dense one-liners and other work may be in progress in the same files, so integrate by **mirroring the most recent building**: `grep -n "books" series/src/main.js series/src/collection.js series/index.html series/scripts/*.mjs` and add a matching line for the new id next to every hit. Then go through the checklist below to catch what grep misses (counts and copy).

## 1 The model module

Put new buildings in `series/src/<id>/` (no Vite alias needed). Start from `templates/Building.template.js` and `templates/primitives.js`. The factory returns:

```js
{
  group,            // THREE.Group, origin at the centre of the paved base, +z = main façade
  materials,        // the token materials (the verify script reads colours from here)
  dynamic,          // leaf groups that move or hide: hinge children, see-through shells, the roof
  labels,           // [['Reading Corner', [x, y, z]], …] in model space, 3–6 of them
  state,            // anything the page needs to read back (lights on, etc.)
  setPalette(i),    // i = swatch index 0–4, recolours building tokens only
  // one setter per interaction, taking an eased amount 0–1 or a boolean:
  setDoor(a), setSeeThrough(v), setLights(on), …
}
```

The module never creates a renderer, camera, light or DOM node and never animates itself; the page drives every amount.

Moving parts:

```js
const hinge = group(parent, 'Door hinge', [x, y, z]);      // pivot, static
const leaf = group(hinge, 'Open the door');                  // goes in `dynamic`
leaf.userData.action = 'myshopDoor';                          // click target
// build the leaf's meshes inside `leaf`, offset from the pivot
```

`finishModel` bakes the static model and each dynamic group separately, so a dynamic group nested inside another dynamic group gets baked twice. See-through shells (front façade, roof) are dynamic too so they can be hidden.

## 2 `series/src/collection.js`

- `import { createX } from './<id>/X.js';` and `const x = createX();`
- A definition after the last one: `{id, number:'07', title, native, description, model:x, dynamic:x.dynamic, scale:1.0, pivot, span, width, labels:x.labels}`. `native` is a short Japanese (or local) name, `description` one short sentence.
- Add the id to the shadow lift list (`shadow.position.y = .35` for buildings on the raised paved base).
- `item.setColour`: add `else if(item.id==='<id>')x.setPalette(index);`
- If the building's default scheme isn't swatch 0, set its starting `colourIndex`.

## 3 `series/src/main.js`

- `state`: one boolean per toggle plus an `…Amount` per animated part.
- `updateActions()`: show the building's buttons only when it is active (`$('#id').hidden = state.active !== '<id>'`), update their label and `aria-pressed`. Add the id to the see-through list if it supports see-through.
- One toggle function per interaction, wired to its button `onclick`.
- Hover tooltip text for each `userData.action`, and the pointer-up dispatch for each action.
- In the render loop: `state.xAmount = reducedMotion.matches ? goal : THREE.MathUtils.damp(state.xAmount, goal, 8, dt)`, snap when within 0.001, call the model setter, and include "still moving" in the check that keeps the render-on-demand loop running.
- Deep links: add the id to the list `select()` accepts from `location.hash`.
- Per-building text (the stage hint, the footer summary) and any per-index arrays.

## 4 `series/index.html` and `series/src/style.css`

- A tab `<button role="tab" id="tab-<id>" data-building="<id>">` with its number.
- A caption button `data-focus="<id>"` in the collection overview.
- The building's action buttons (`class="pill"`, `hidden` by default).
- Every count and number word: the tab count badge, "Six familiar corners", "SIX PLACES. ONE LITTLE COLLECTION.", the meta description, the "Try it" copy.
- Check the collection layout at 1440 px and 390 px; if the overview gets crowded, adjust the CSS height rather than shrinking buildings.

## 5 Verification and docs

- `series/scripts/verify-<id>.mjs` from `templates/verify.template.mjs`, plus `"check:<id>"` in `series/package.json`.
- Bump the building count in the other verify scripts (`'00 The collection N'`, "Overview must show N").
- Root `README.md`: the list of places, the projects table and the interaction summary.
- Run with the dev server up (`npm run dev` in `series/`, default port 5176): `npm run check`, every `check:*`, then `npm run build`.

## Standard screenshots

Save to `series/screenshots/<id>-*.png`: `desktop` (default view), `front`, `right` (side view), `rooftop` (elevation ≈ 80°), `interior` (see-through, zoom ≈ 2), one per interaction state (`door-open`, `lights-off`…), `labels`, `mobile` (390 × 844). Look at them yourself before reporting.
