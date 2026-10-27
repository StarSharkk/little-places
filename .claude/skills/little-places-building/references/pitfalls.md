# Pitfalls (all of these happened in this project)

Each entry: what went wrong → why it matters → what to do instead.

## Grounding and proportions

- **Floating A-board** (flower shop and bakery). The splayed legs were placed at the wrong height, so the board hovered. → Props are read as "standing on the street"; one floating object breaks the illusion for the whole building. → Build every prop from its feet up at `GROUND` (0.155) or `FLOOR`, and check a close side view.
- **Building squeezed small** (Sakura Sweets at `scale: .74`). Its own units were larger than the others, so it was shrunk and then looked meagre. → Mixed scales make doors and people-scale props disagree between buildings. → Model at the proportions in `style.md` and keep `scale` near 1.0.
- **Shadow hidden under a big base** (Sakura Sweets). A large raised base swallowed the projected shadow. → The blue shadow is part of the series' look. → Keep the base close to the building footprint plus forecourt, and lift the shadow layer with the paved base.

## Signature elements

- **Rooftop croissant** (bakery). Even after a careful Blender model it looked "太突兀" (too abrupt) and was removed. → A giant product on the roof turns a building into a mascot. → Express the shop through architecture and display: a lantern, a chimney, a window full of pastries.
- **Rough primitive food** ("not just a rough cylinder"). → Close-up items are where quality is judged. → If an item is a focal point, give it a real profile (lathe, extrude, layered parts) or keep it small and in the background.

## Readability from the default camera

- **Sign lamps crossing the lettering** (bookshop). → The sign is the building's name; nothing may cross it. → Put gooseneck lamps beyond the ends of the text.
- **Awning hiding the door** (bookshop). The canopy covers the upper half of the door from 45°/32°. → The door is the main click target. → Keep at least the lower half of every clickable part visible, and click that part in the verify script.
- **Vines reading as string.** Sparse leaves on a long stem look like a cable. → Use dense leaves (10+ per metre, slightly larger scale) and several overlapping stems.
- **Labels floating in the wrong place.** Labels are not occluded, so an interior label can hover over the roof. → Anchor labels on parts visible from the default camera.

## Code and pipeline

- **Dynamic group inside another dynamic group** → baked twice, flickers or double outlines. Hinge (static) → leaf (dynamic) only.
- **Custom geometry without UVs** → `mergeGeometries` fails when batching with UV'd geometry. Give custom `BufferGeometry` a `uv` attribute.
- **Inline `//` comment inside a one-line statement** in `collection.js` swallowed the rest of the line and the page returned 500. → The page files are dense one-liners; put comments on their own line.
- **Timing in verify scripts** under software GL: fixed waits flake. → Wait with `page.waitForFunction` on the state you expect, and allow ~400 ms after toggling labels.
- **Clicking a 3D part that the camera can't see** (book click after zooming elsewhere) → reset to the default view first, then project the part's local point to the screen.
- **Heavy scenes** (bakery 465k → 327k tris, flowers 204k). → Use low sphere segments and fewer outlines; check the budget before polishing.

## Process

- **Claiming success without looking.** The user asked to be told only what was actually verified. → Look at each screenshot, run every check, and list what was not verified.
- **Touching other buildings.** The user does not want other parts of the project rebuilt or deleted for a new task. → Integration changes to shared files are additive; anything else needs a question first.
- **Committing unrelated work.** Other sessions may be editing `series/` at the same time. → Stage only your own hunks; leave unrelated changes untouched and mention them.
