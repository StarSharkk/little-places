# Croissant rooftop sign (Blender asset)

- `generate_croissant.py` — rebuilds everything headless:
  `/Applications/Blender.app/Contents/MacOS/Blender -b -P series/assets/bakery/croissant/generate_croissant.py` (add `-- --no-render` to skip renders).
- `croissant.blend` — editable source (Subdivision Surface modifier kept live).
- `croissant.glb` — exported model with the modifier applied, normals and a `COLOR_0` crust colour attribute; no external textures. Origin at the centre of the base, 1.0 m wide, tips pointing +Z.
- `renders/` — front, top, side and three-quarter Workbench renders used to check the shape.
- `audit.txt` — topology report written on every build (manifold edges, loose verts, signed volume, self-intersections, dimensions).

The shape is one closed mesh swept along a crescent centre line (100° half-sweep, tips bent forward), with a fat belly and slim horns. Seven rolled layers are carved into the surface by a shingled radius profile, with diagonal grooves that ease through the middle, ±8% irregular widths and grooves that fade out along the horns. Crust colours (#E7AC48 / #F5CB73 / #B97937 / #F7D991) are baked into vertex colours; the material is non-metallic, roughness 0.9.

On the site, `src/bakery/CroissantSign.js` loads the GLB with GLTFLoader and switches the shading to the series' toon ramp. It adds a #49382E back-face outline shell and seats the model on a low cream stand that says BAKERY. Size, yaw, lean and outline width live together in `CROISSANT_SIGN`. `npm run check:croissant` verifies placement and writes screenshots.
