# Interactive Building Explorer

The Explorer is appended below the existing collection and footer. It does not replace the original gallery, tabs, camera or building instances.

- `src/explorer.js`: additive section, text directory, anchored static preview, one lazy renderer/OrbitControls pair, auto-fit orthographic camera, picking, labels, palettes, night, fullscreen, routing and resource disposal.
- `src/explorer-actions.js`: maps the existing building APIs to controls and raycast actions. Door poses and one-off sequences use the existing model geometry and setters.
- `src/explorer.css`: scoped layout and responsive styling. The original page styles are unchanged.
- `src/collection.js`: `buildingCatalog` supplies metadata; `createCollection({only: id})` instantiates and batches only one chosen building. Calling `createCollection()` still creates the unchanged ten-place collection.
- `src/main.js`: forwards caption clicks to Explorer and drives it from the existing animation clock. Offscreen/hidden views do not update or render their continuous effects.

The original `#collection`, `#cafe`, etc. remain intact. Explorer uses `#explore/cafe`, `#explore/tram`, etc. Caption clicks scroll down; directory and previous/next selections update the hash without changing page scroll. Browser hash navigation restores and scrolls to the chosen building.

There are at most two rendering canvases: the existing Collection and the single Explorer. Explorer is created on demand and holds only one independent model at a time. Switches release outgoing batched geometry, materials, textures and render lists; resources owned by the original Collection are protected. A switch does not install additional canvas listeners, observers or animation loops.

The ten PNGs in `public/previews/` are rendered from the existing Collection, not extra WebGL preview scenes. Regenerate with `npm run previews:explorer`. Hover cards are viewport-clamped and anchored to the row; pointer movement does not change their position. Mobile has a horizontal text directory and no hover cards.

Use buttons for Explorer zoom. The wheel scrolls the page, while mouse drag rotates. On touchscreens vertical gestures remain available for page scrolling. Fullscreen uses the browser API with a CSS expanded fallback.

Verification: `npm run check:explorer`, `npm run check:navigation`, `npm run check:rotation`, the existing building checks, and `npm run build`. Existing dedicated building regressions use the original tabs; the new Explorer check covers the changed caption destination and its isolated interactions. Screenshots/reports are saved in `screenshots/`.

Desktop layout uses the viewport height so the directory, model and complete toolbar fit together at the reference 1440 × 813 viewport. Camera focus excludes the projected blue shadow, with a small vertical adjustment; framing still includes the full base and shadow. `npm run check:explorer-layout` checks all ten models at four desktop viewport sizes, fullscreen/reset and 390 px mobile overflow.

Explorer now opens and resets at 145%. Dedicated building interactions sit at the upper-left of the 3D stage, freeing toolbar height; mobile uses a horizontally scrollable action strip above the canvas. Fitting checks actual rendered geometry on view changes so enlarging the scene does not clip the roof or base.
