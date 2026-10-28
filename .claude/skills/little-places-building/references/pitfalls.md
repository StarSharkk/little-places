# Pitfalls (all of these happened in this project)

Each entry: what went wrong → why it matters → what to do instead.

## Grounding and proportions

- **A-frame chalkboards, four times** (flower shop and bakery: boards floating; bookshop and pizzeria: leaves hinged at the feet and tilted outwards, so the frame opened into a V). → Props are read as "standing on the street"; one wrong board breaks the illusion for the whole building. → Use `buildings/shared/ABoard.js` as is: leaves hinge at the top (`[0, L·cos(a), 0]`), hang down with `rotation.x = −s·a`, feet at y = 0 of the group placed at `GROUND`. The verify template's `assertAframes` fails if the lowest point is off the ground or the feet aren't wider apart than the hinge. Build every other prop from its feet up too, and look at a close side view.
- **Building squeezed small** (Sakura Sweets at `scale: .74`). Its own units were larger than the others, so it was shrunk and then looked meagre. → Mixed scales make doors and people-scale props disagree between buildings. → Model at the proportions in `style.md` and keep `scale` near 1.0.
- **Shadow hidden under a big base** (Sakura Sweets). A large raised base swallowed the projected shadow. → The blue shadow is part of the series' look. → Keep the base close to the building footprint plus forecourt, and lift the shadow layer with the paved base.

## Signature elements

- **Plain cream awning** (the bookshop's first version). → Every awning in the series is striped.
- **Rooftop slice seen edge-on.** A flat sign facing the street shows only its edge from the default camera. → Turn it to the default azimuth (25°) to face the viewer.

- **Rooftop croissant** (bakery). Even after a careful Blender model it looked "太突兀" (too abrupt) and was removed. → A giant product on the roof turns a building into a mascot. → Express the shop through architecture and display: a lantern, a chimney, a window full of pastries.
- **Rough primitive food** ("not just a rough cylinder"). → Close-up items are where quality is judged. → If an item is a focal point, give it a real profile (lathe, extrude, layered parts) or keep it small and in the background.

## Readability from the default camera

- **Sign lamps crossing the lettering** (bookshop). → The sign is the building's name; nothing may cross it. → Put gooseneck lamps beyond the ends of the text.
- **Awning hiding the door** (bookshop). The canopy covers the upper half of the door from the default camera. → The door is the main click target. → Keep at least the lower half of every clickable part visible, and click that part in the verify script.
- **Vines reading as string.** Sparse leaves on a long stem look like a cable. → Use dense leaves (10+ per metre, slightly larger scale) and several overlapping stems.
- **Labels floating in the wrong place.** Labels are not occluded, so an interior label can hover over the roof. → Anchor labels on parts visible from the default camera.

## Code and pipeline

- **Rotating after inking** (`inked(cylinder(…)).rotation.x = …`, pizzeria air unit). The ink shell copies the transform when it is made. → Rotate first: `inked(upright(cylinder(…)))`.
- **Hero interior on the back wall** (the laundry's first washer row was invisible from the street). → See style.md → Composition.

- **Floors drifting apart.** The early buildings used beige paving `#E7DEC9` with dark joints, the dessert shop white `#FBF7EB` with soft joints; side by side they looked like different towns. → One paving colour for all outdoor floors, joints never inked.

- **Shadow lost under its own paving** (Pizza Piccola's terrace). → Add `shadowFloor` so the shadow is drawn on the paving; cast it only from parts taller than 0.5 m, or the paving shades the whole forecourt blue.
- **Overview crowding** — twice. A fixed 11.4 m step let wide places overlap; spacing by the footprint measured along the screen fixed the default view but changed with every drag, so places slid into each other when rotated, and each one swung around its model origin instead of its middle. → Each place turns about its footprint centre and owns a rotation-proof slot (its turning circle); `check:rotation` guards it.

- **Round shapes without outlines** (the original Sakura Café tree). Edge lines skip smooth surfaces, so its pink balls had no ink while every wall did, and it looked flatter than the Sweets tree. → Hull every feature-sized round form (`templates/outline.js`).
- **Hull material never resized** → a hull whose `resolution` is never set draws lines of the wrong width. Expose it in `outlineMaterials` so the page updates it with the edge lines.
- **Dynamic group inside another dynamic group** → baked twice, flickers or double outlines. Hinge (static) → leaf (dynamic) only.
- **A dynamic part scaled to 0 at rest** (the post office's letter) → NaN in the baked geometry, the part never shows again. Hide it with `visible` instead.
- **Custom geometry without UVs** → `mergeGeometries` fails when batching with UV'd geometry. Give custom `BufferGeometry` a `uv` attribute.
- **Inline `//` comment inside a one-line statement** in `collection.js` swallowed the rest of the line and the page returned 500. → The page files are dense one-liners; put comments on their own line.
- **Captions on other gallery pages.** The overview shows a few places per page; a caption on another page is hidden and can't be clicked, and the overview slides between pages. → In the verify script, click `#gallery-next` until it is disabled (or the caption shows), then wait for the caption with `locator.waitFor({ state: 'visible' })`.
- **Timing in verify scripts** under software GL: fixed waits flake. → Wait with `page.waitForFunction` on the state you expect, and allow ~400 ms after toggling labels.
- **Clicking a 3D part that the camera can't see** (book click after zooming elsewhere) → reset to the default view first, then project the part's local point to the screen.
- **Heavy scenes** (bakery 465k → 327k tris, flowers 204k). → Use low sphere segments and fewer outlines; check the budget before polishing.
- **A tube along a `Shape` outline** (Pizza Piccola's cheese edge). `shape.getPoints(n)` samples every curve `n` times, and `tube()` makes 3 segments per point, so one ink line became ~18k triangles. → Use `shape.getSpacedPoints(80–100)` for tubes that follow an outline.
- **A click target hidden inside its own housing** (the pizza oven's mouth sat behind the curve of the dome). → Put clickable parts on the outermost surface, and make the visible thing in front (the flames) carry the same `userData.action`. Debug with a raycast that skips hidden ancestors.

## Process

- **Claiming success without looking.** The user asked to be told only what was actually verified. → Look at each screenshot, run every check, and list what was not verified.
- **A green check is not a good-looking building.** The kit's first test kiosk passed every automatic check with its TEA sign hidden under the awning. → Checks prove the mechanics; composition (style.md, "nothing important behind something else") is judged on the default screenshot.
- **Touching other buildings.** The user does not want other parts of the project rebuilt or deleted for a new task. → Integration changes to shared files are additive; anything else needs a question first.
- **Committing unrelated work.** Other sessions may be editing `web/` at the same time. → Stage only your own hunks; leave unrelated changes untouched and mention them.
