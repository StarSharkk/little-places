# Putting a building on a page

Two pages show buildings: the kit's one-building viewer (standalone) and the Little Places collection page (in the repo). Both read the same model contract, so a building written for one works in the other.

## The model contract

The factory returns:

```js
{
  group,            // THREE.Group, origin at the centre of the paved base, +z = main façade
  materials,        // the token materials (the verify script reads colours from here)
  dynamic,          // leaf groups that move or hide: hinge children, see-through shells, the roof
  labels,           // [['Reading Corner', [x, y, z]], …] in model space, 3–6 of them
  outlineMaterials, // optional: hull materials from buildings/shared/outline.js; the page keeps their resolution updated
  shadowFloor,      // optional: paved layers the shadow is also drawn on (streetEdge(...).floors)
  state,            // anything the page needs to read back (lights on, etc.)
  setPalette(i),    // i = swatch index 0–4, recolours building tokens only
  // one setter per interaction, taking an eased amount 0–1 or a boolean:
  setDoor(a), setSeeThrough(v), setLights(on), …
  animate(dt, time),   // optional ambient motion; return true while more frames are needed
  setNight(amount),    // optional night touches, 0 … 1
  interactions: [      // what a generic page offers as buttons and click targets (the kit's viewer reads it)
    { action: 'myshopDoor', label: ['Open the door', 'Close the door'], set: setDoor },   // toggle: the page eases 0 ↔ 1
    { action: 'myshopBell', label: 'Ring the bell', run: (instant) => bell.start(instant) },  // one-off; instant under reduced motion
  ],
}
```

The module never creates a renderer, camera, light or DOM node and never animates itself; the page drives every amount.

Clicks pass through transparent materials (glass, portholes), so interior parts behind a window are clickable; aim tests at a part that is visible from the default camera.

Moving parts:

```js
const hinge = group(parent, 'Door hinge', [x, y, z]);      // pivot, static
const leaf = group(hinge, 'Open the door');                  // goes in `dynamic`
leaf.userData.action = 'myshopDoor';                          // click target
// build the leaf's meshes inside `leaf`, offset from the pivot
```

`finishModel` bakes the static model and each dynamic group separately, so a dynamic group nested inside another dynamic group gets baked twice. See-through shells (front façade, roof) are dynamic too so they can be hidden.

## Standalone kit

The kit (`kit/` in this skill) is a small Vite project. Copy it into the project folder, `npm install`, `npx playwright install chromium` (or let verify fall back to the system Chrome), `npm run dev` (http://127.0.0.1:5180).

- **Layout:** `buildings/shared/` (primitives, ink hull, A-frame, striped awning, street edges, props, motion, steam, `finish.js` with `finishModel` + `createIllustrationShadow`, `shadowFloor.js`), `buildings/09-little-post-office/` (the reference building), `src/viewer.js` + `src/places.js` (the stage), `scripts/verify.mjs`.
- **A new place:** `buildings/NN-name/` with its own modules, starting from `templates/Building.template.js` (copy it in and rename). The template already has the material keys the shared props expect, a small print atlas (sign, chalkboard), the ink hull, an awning and an A-frame. Import shared parts as `'../shared/…'`. Add an entry to `src/places.js`: `{ id, title, module: () => import('../buildings/NN-name/Name.js'), factory: 'createName' }` plus optional `pivot`, `span`, `width` if the automatic framing is off. Open `/?place=<id>`.
- **The viewer does the rest:** bakes the model, draws the shadow (and `shadowFloor`), lights, night, see-through (if `setSeeThrough` exists), five swatches, labels, turntable and the six views, and makes one button per `interactions` entry. Clicking the model triggers the entry whose `action` is on the clicked part or its ancestors. Reduced motion snaps toggles and calls `run(true)`.
- **Verify:** `npm run verify -- <id>` (dev server running) checks the contract, the budget, NaN geometry, nested dynamic groups, A-frames, every interaction from its button and from a click on a part visible from the default camera, render-on-demand idling, see-through, night, five colour schemes, labels on the stage, reduced motion and 390 px. Screenshots and a JSON report land in `screenshots/<id>-*`. Shop-specific checks go in `buildings/NN-name/verify.extra.mjs` (see the post office's). Look at the screenshots yourself before reporting.
- `npm run build` makes a static site in `dist/`.

## The collection page (Little Places repo)

The page code is dense one-liners and other work may be in progress in the same files, so integrate by **mirroring the most recent building**: `grep -n "post" web/src/main.js web/src/collection.js web/index.html web/scripts/*.mjs` and add a matching line for the new id next to every hit. Then go through the checklist below to catch what grep misses (counts and copy).

### 1 The model module

Put new buildings in `buildings/NN-name/` (the next number, kebab-case name), add an alias for it in `web/vite.config.js` (`'@id': relative('../buildings/NN-name/Name.js')`) and import it in `web/src/collection.js` through that alias. Building modules resolve `three` from `web/` thanks to `dedupe: ['three']`, so they need no `node_modules` of their own. Start from `templates/Building.template.js` and `templates/primitives.js`. Start from `templates/Building.template.js`.

### 2 `web/src/collection.js`

- `import { createX } from './<id>/X.js';` and `const x = createX();`
- A definition after the last one: `{id, number:'07', title, native, description, model:x, dynamic:x.dynamic, scale:1.0, pivot, span, width, labels:x.labels}`. `native` is a short Japanese (or local) name, `description` one short sentence.
- Add the id to the shadow lift list (`shadow.position.y = .35` for buildings on the raised paved base).
- `item.setColour`: add `else if(item.id==='<id>')x.setPalette(index);`
- If the building's default scheme isn't swatch 0, set its starting `colourIndex`.

### 3 `web/src/main.js`

- `state`: one boolean per toggle plus an `…Amount` per animated part.
- `updateActions()`: show the building's buttons only when it is active (`$('#id').hidden = state.active !== '<id>'`), update their label and `aria-pressed`. Add the id to the see-through list if it supports see-through.
- One toggle function per interaction, wired to its button `onclick`.
- Hover tooltip text for each `userData.action`, and the pointer-up dispatch for each action.
- In the render loop: `state.xAmount = reducedMotion.matches ? goal : THREE.MathUtils.damp(state.xAmount, goal, 8, dt)`, snap when within 0.001, call the model setter, and include "still moving" in the check that keeps the render-on-demand loop running.
- Deep links: add the id to the list `select()` accepts from `location.hash`.
- Per-building text (the stage hint, the footer summary) and any per-index arrays.

### 4 `web/index.html` and `web/src/style.css`

- A tab `<button role="tab" id="tab-<id>" data-building="<id>">` with its number.
- A caption button `data-focus="<id>"` in the collection overview.
- The building's action buttons (`class="pill"`, `hidden` by default).
- Every count and number word: the tab count badge, "Six familiar corners", "SIX PLACES. ONE LITTLE COLLECTION.", the meta description, the "Try it" copy.
- Check the collection layout at 1440 px and 390 px; if the overview gets crowded, adjust the CSS height rather than shrinking buildings.

**Overview spacing and rotation are automatic.** `main.js` finds each place's hub (the centre of its model's footprint, shadows excluded) and its turning radius (hub to the farthest footprint corner). Every place turns about its own hub, in the overview and on its own, and owns a slot `2 × radius` wide plus `RAIL_GAP`, so no camera angle can push neighbours together. Don't hand-tune positions or offsets; a building that sits off its model origin is handled by the hub. `npm run check:rotation` turns the camera through 30 angles plus a mouse drag and fails if neighbours overlap or any place drifts while turning.

### 5 Verification and docs

- `web/scripts/verify-<id>.mjs` from `templates/verify.template.mjs`, plus `"check:<id>"` in `web/package.json`.
- Keep the template's `assertAframes(module, factory)` call with the new building's module and factory name; it rebuilds the model unbaked and checks every chalkboard A-frame.
- Bump the building count in the other verify scripts (`'00 The collection N'`, "Overview must show N").
- Root `README.md`: the list of places, the projects table and the interaction summary.
- Run with the dev server up (`npm run dev` in `web/`, default port 5176): `npm run check`, every `check:*`, then `npm run build`.

### Standard screenshots

Save to `web/screenshots/<id>-*.png`: `desktop` (default view), `front`, `right` (side view), `rooftop` (elevation ≈ 80°), `interior` (see-through, zoom ≈ 2), one per interaction state (`door-open`, `lights-off`…), `labels`, `mobile` (390 × 844). Look at them yourself before reporting.
