"""Stylized croissant rooftop sign for Bonjour Bakery — regenerates croissant.blend / croissant.glb.

Run headless from this folder's parent project:
    /Applications/Blender.app/Contents/MacOS/Blender -b -P series/assets/bakery/croissant/generate_croissant.py
Optional: append `-- --no-render` to skip the four check renders.

The croissant is one continuous, closed mesh: a variable-radius sweep along a crescent centre line.
Rolled dough layers are shaped into the surface (local radius bulges with a shingled, slightly
overhanging profile and diagonal grooves), not stacked spheres. A Subdivision Surface modifier
smooths it; the GLB is exported with modifiers applied. Units: metres, width ≈ 1.0, origin at the
centre of the base, tips pointing to Blender −Y (glTF +Z), which the Three.js side turns towards
the default isometric camera.
"""
import bpy, bmesh, math, os, random, sys
from mathutils import Vector
from mathutils.bvhtree import BVHTree

HERE = os.path.dirname(os.path.abspath(__file__))
P = dict(
    width=1.0,        # tip to tip
    depth=0.5,        # back of the belly to the front of the tips
    height=0.3,       # crown height
    layers=7,         # rolled dough layers (5–7)
    fold=0.24,        # groove depth between layers (fraction of local radius)
    skew=0.55,        # how diagonally the layers wrap around the body
    tip=0.13,         # tip radius as a fraction of the belly radius
    sweep_deg=100,    # half-angle of the crescent; > 90° bends the tips forward, < 180° keeps it open
    rings=110, around=28, cap_rings=7,
    subdiv=1, seed=11,
)
COL = dict(crust='#E7AC48', butter='#F5CB73', toasted='#B97937', light='#F7D991')


def srgb_to_linear(h):
    c = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    return [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c]


def mix(a, b, t):
    return [a[i] + (b[i] - a[i]) * t for i in range(3)]


def build_mesh(p):
    rnd = random.Random(p['seed'])
    n, N, M, K = p['layers'], p['rings'], p['around'], p['cap_rings']
    phi_m = math.radians(p['sweep_deg'])
    R = p['height'] / 1.36                                  # belly radius from the target height
    # ellipse arc: belly at the back (+Y), tips swing forward (−Y)
    a = (p['width'] / 2 - R * p['tip'] * 1.1) / math.sin(phi_m)
    b = max(0.05, (p['depth'] - R * 1.2 - R * p['tip']) / (1 - math.cos(phi_m)))

    def body(t):  # fat belly, long tapering horns, ends stay round
        s = math.sin(math.pi * t)
        return R * (p['tip'] + (1 - p['tip']) * s ** 1.35)

    def centre(t):
        ph = -phi_m + 2 * phi_m * t
        return Vector((a * math.sin(ph), b * math.cos(ph) - b * 0.42, body(t) * 0.82 * 0.55))

    # layer boundaries: widest in the middle, a little irregular so it never looks machined
    w = [(0.45 + math.sin(math.pi * (i + 0.5) / n)) * (1 + rnd.uniform(-0.08, 0.08)) for i in range(n)]
    total = sum(w); bounds = [0.0]
    for v in w: bounds.append(bounds[-1] + v / total)
    amp = [1 + rnd.uniform(-0.06, 0.06) for _ in range(n)]

    def layer(t, th):
        # grooves run diagonally (a chevron mirrored about the middle, eased through the centre so the
        # middle layer has no seam), like dough rolled from a triangle
        side = 1 if t >= 0.5 else -1
        tt = min(max(t + p['skew'] * math.cos(th) / n * math.tanh((t - 0.5) * 9) * 0.5, 0.0), 0.99999)
        i = 0
        while tt >= bounds[i + 1]: i += 1
        u = (tt - bounds[i]) / (bounds[i + 1] - bounds[i])
        if side < 0: u = 1 - u                     # u runs from the belly side towards the tip
        # shingled profile: rises from the groove, crowns past mid-layer, then rolls over into the next groove
        f = math.sin(math.pi * min(1.0, u ** 0.8)) ** 0.55
        return f, i

    def section(t):
        e = 1e-3
        T = (centre(min(1, t + e)) - centre(max(0, t - e))).normalized()
        T_h = Vector((T.x, T.y, 0)).normalized()
        S = T_h.cross(Vector((0, 0, 1))).normalized()       # horizontal side vector, stable along the arc
        return T, T_h, S

    lin = {k: srgb_to_linear(v) for k, v in COL.items()}
    verts, colours, rows = [], [], []

    def ring(t, scale, offset):
        c = centre(t); _, T_h, S = section(t)
        c = c + T_h * offset
        row = []
        for j in range(M):
            th = 2 * math.pi * j / M
            cs, sn = math.cos(th), math.sin(th)
            f, li = layer(t, th)
            fold = p['fold'] * math.sin(math.pi * t) ** 0.6            # grooves fade out along the horns
            r = body(t) * (1 - fold * (1 - f)) * amp[li] * scale
            r *= 1 + 0.018 * math.sin(3 * th + 7 * t) * (1 - abs(sn))   # gentle, low-frequency surface swell
            v = c + S * (r * 1.2 * cs) + Vector((0, 0, r * 0.82 * sn * (0.55 if sn < 0 else 1)))
            row.append(len(verts)); verts.append(v)
            groove = (1 - f) ** 1.4
            tipness = 1 - math.sin(math.pi * t) ** 0.5
            top = max(0.0, sn) ** 2
            col = mix(lin['crust'], lin['toasted'], min(1, groove * 1.05 + tipness * 0.45))
            col = mix(col, lin['butter'], top * f * (1 - tipness) * 0.55)
            col = mix(col, lin['light'], (top ** 3) * (f ** 4) * (1 - tipness) * 0.5)
            col = mix(col, lin['butter'], 0.06 * (li % 2))                   # very slight layer-to-layer shift
            colours.append(col)
        return row

    # cap (quarter-circle shrink beyond each tip) + body
    for k in range(K, 0, -1):
        al = k / (K + 1) * math.pi / 2
        rows.append(ring(0.0, math.cos(al), -body(0) * 0.95 * math.sin(al)))
    for i in range(N + 1):
        rows.append(ring(i / N, 1.0, 0.0))
    for k in range(1, K + 1):
        al = k / (K + 1) * math.pi / 2
        rows.append(ring(1.0, math.cos(al), body(1) * 0.95 * math.sin(al)))
    # poles
    _, T0, _ = section(0.0); _, T1, _ = section(1.0)
    pole0 = len(verts); verts.append(centre(0.0) - T0 * body(0) * 0.95); colours.append(lin['toasted'])
    pole1 = len(verts); verts.append(centre(1.0) + T1 * body(1) * 0.95); colours.append(lin['toasted'])

    faces = []
    for r0, r1 in zip(rows, rows[1:]):
        for j in range(M):
            faces.append((r0[j], r0[(j + 1) % M], r1[(j + 1) % M], r1[j]))
    for j in range(M):
        faces.append((pole0, rows[0][(j + 1) % M], rows[0][j]))
        faces.append((pole1, rows[-1][j], rows[-1][(j + 1) % M]))
    return verts, faces, colours


def make_material():
    mat = bpy.data.materials.new('Croissant crust')
    mat.use_nodes = True
    nt = mat.node_tree
    bsdf = nt.nodes.get('Principled BSDF')
    attr = nt.nodes.new('ShaderNodeVertexColor'); attr.layer_name = 'Col'
    nt.links.new(attr.outputs['Color'], bsdf.inputs['Base Color'])
    bsdf.inputs['Roughness'].default_value = 0.9
    bsdf.inputs['Metallic'].default_value = 0.0
    for name in ('Specular IOR Level', 'Specular'):
        if name in bsdf.inputs: bsdf.inputs[name].default_value = 0.15
    return mat


def audit(obj):
    """Topology checks on the evaluated (subdivided) mesh."""
    dg = bpy.context.evaluated_depsgraph_get()
    me = obj.evaluated_get(dg).to_mesh()
    bm = bmesh.new(); bm.from_mesh(me)
    non_manifold = sum(1 for e in bm.edges if not e.is_manifold)
    loose = sum(1 for v in bm.verts if not v.link_edges)
    # outward normals: the signed volume of a closed, outward-facing mesh is positive
    vol = bm.calc_volume(signed=True)
    tree = BVHTree.FromBMesh(bm)
    bm.faces.ensure_lookup_table()
    hits = 0
    for i, j in tree.overlap(tree):
        if i >= j: continue
        fi, fj = bm.faces[i], bm.faces[j]
        if set(v.index for v in fi.verts) & set(v.index for v in fj.verts): continue
        hits += 1
        if hits <= 3: print('INTERSECT_AT', tuple(round(c, 3) for c in fi.calc_center_median()))
    dims = obj.dimensions.copy()
    report = dict(verts=len(bm.verts), faces=len(bm.faces), non_manifold_edges=non_manifold, loose_verts=loose,
                  signed_volume=round(vol, 5), self_intersections=hits,
                  width=round(dims.x, 3), depth=round(dims.y, 3), height=round(dims.z, 3))
    bm.free(); obj.evaluated_get(dg).to_mesh_clear()
    return report


def render_views(obj):
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_WORKBENCH'
    sh = scene.display.shading
    sh.light = 'STUDIO'; sh.color_type = 'VERTEX'; sh.show_object_outline = True; sh.object_outline_color = (0.29, 0.22, 0.18)
    sh.show_cavity = True; sh.cavity_type = 'WORLD'; sh.show_specular_highlight = False
    scene.render.resolution_x, scene.render.resolution_y = 900, 640
    scene.render.film_transparent = False
    world = scene.world or bpy.data.worlds.new('World'); scene.world = world
    world.color = (0.93, 0.9, 0.82)
    cam_data = bpy.data.cameras.new('Check camera'); cam_data.type = 'ORTHO'; cam_data.ortho_scale = 1.35
    cam = bpy.data.objects.new('Check camera', cam_data); bpy.context.collection.objects.link(cam)
    scene.camera = cam
    target = Vector((0, 0, p_height() / 2))
    views = {
        'front': Vector((0, -3, target.z)), 'top': Vector((0, 0, 3)),
        'side': Vector((3, 0, target.z)), 'iso': Vector((2.1, -2.1, 2.3)),
    }
    out = os.path.join(HERE, 'renders'); os.makedirs(out, exist_ok=True)
    for name, pos in views.items():
        cam.location = pos
        d = (target - pos).normalized()
        cam.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
        if name == 'top': cam.rotation_euler = (0, 0, 0)
        scene.render.filepath = os.path.join(out, f'{name}.png')
        bpy.ops.render.render(write_still=True)
    bpy.data.objects.remove(cam)


def p_height():
    return P['height']


def main():
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    bpy.ops.wm.read_factory_settings(use_empty=True)
    verts, faces, colours = build_mesh(P)
    me = bpy.data.meshes.new('Croissant')
    me.from_pydata([tuple(v) for v in verts], [], faces)
    me.validate(); me.update()
    bm = bmesh.new(); bm.from_mesh(me)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me); bm.free()
    for poly in me.polygons: poly.use_smooth = True
    attr = me.color_attributes.new('Col', 'FLOAT_COLOR', 'POINT')
    for i, c in enumerate(colours): attr.data[i].color = (*c, 1.0)
    me.color_attributes.active_color = attr
    obj = bpy.data.objects.new('Croissant', me)
    bpy.context.collection.objects.link(obj)
    sub = obj.modifiers.new('Subdivision', 'SUBSURF'); sub.levels = P['subdiv']; sub.render_levels = P['subdiv']
    obj.data.materials.append(make_material())
    # origin: centre of the base
    bb = [obj.matrix_world @ Vector(c) for c in obj.bound_box]
    minz = min(v.z for v in bb); cx = (min(v.x for v in bb) + max(v.x for v in bb)) / 2; cy = (min(v.y for v in bb) + max(v.y for v in bb)) / 2
    me.transform(__import__('mathutils').Matrix.Translation((-cx, -cy, -minz)))
    # normalise the footprint to the requested width (uniform in plan, so proportions hold)
    span = max(v.x for v in bb) - min(v.x for v in bb)
    k = P['width'] / span
    me.transform(__import__('mathutils').Matrix.Diagonal((k, k, 1, 1)))
    bpy.context.view_layer.update()
    report = audit(obj)
    print('CROISSANT_AUDIT', report)
    with open(os.path.join(HERE, 'audit.txt'), 'w') as fh:
        fh.write(repr(dict(params=P, **report)) + '\n')
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, 'croissant.blend'))
    bpy.ops.object.select_all(action='DESELECT'); obj.select_set(True); bpy.context.view_layer.objects.active = obj
    kw = dict(filepath=os.path.join(HERE, 'croissant.glb'), export_format='GLB', use_selection=True,
              export_apply=True, export_yup=True, export_normals=True, export_materials='EXPORT')
    try:
        bpy.ops.export_scene.gltf(**kw, export_vertex_color='ACTIVE')
    except TypeError:
        bpy.ops.export_scene.gltf(**kw, export_colors=True)
    if '--no-render' not in argv:
        render_views(obj)


main()
