import * as THREE from "three";
const geometries = new Map();
export function cached(key, fn) {
  if (!geometries.has(key)) geometries.set(key, fn());
  return geometries.get(key);
}
export function group(p, pos = [0, 0, 0], rotation = 0, name = "") {
  const g = new THREE.Group();
  g.position.set(...pos);
  g.rotation.y = rotation;
  g.name = name;
  p.add(g);
  return g;
}
export function mesh(p, geometry, material, pos = [0, 0, 0], outline = true) {
  const m = new THREE.Mesh(geometry, material);
  m.position.set(...pos);
  m.userData.outline = outline;
  p.add(m);
  return m;
}
export function box(p, w, h, d, material, pos = [0, 0, 0], outline = true) {
  return mesh(
    p,
    cached(`b:${w}:${h}:${d}`, () => new THREE.BoxGeometry(w, h, d)),
    material,
    pos,
    outline,
  );
}
export function cyl(
  p,
  rt,
  rb,
  h,
  material,
  pos = [0, 0, 0],
  n = 12,
  outline = true,
) {
  return mesh(
    p,
    cached(
      `c:${rt}:${rb}:${h}:${n}`,
      () => new THREE.CylinderGeometry(rt, rb, h, n),
    ),
    material,
    pos,
    outline,
  );
}
export function sphere(p, r, material, pos = [0, 0, 0]) {
  return mesh(
    p,
    cached(`s:${r}`, () => new THREE.SphereGeometry(r, 8, 6)),
    material,
    pos,
    false,
  );
}
export function rod(p, a, b, r, material, outline = true) {
  const aV = new THREE.Vector3(...a),
    bV = new THREE.Vector3(...b);
  const m = cyl(
    p,
    r,
    r,
    aV.distanceTo(bV),
    material,
    aV.clone().add(bV).multiplyScalar(0.5).toArray(),
    8,
    outline,
  );
  m.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    bV.sub(aV).normalize(),
  );
  return m;
}
export function tube(p, points, r, material) {
  const curve = new THREE.CatmullRomCurve3(
    points.map((a) => new THREE.Vector3(...a)),
  );
  return mesh(
    p,
    new THREE.TubeGeometry(curve, 32, r, 5, false),
    material,
    [0, 0, 0],
    false,
  );
}
export function roundedShape(w, d, r) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + r, -d / 2);
  s.lineTo(w / 2 - r, -d / 2);
  s.quadraticCurveTo(w / 2, -d / 2, w / 2, -d / 2 + r);
  s.lineTo(w / 2, d / 2 - r);
  s.quadraticCurveTo(w / 2, d / 2, w / 2 - r, d / 2);
  s.lineTo(-w / 2 + r, d / 2);
  s.quadraticCurveTo(-w / 2, d / 2, -w / 2, d / 2 - r);
  s.lineTo(-w / 2, -d / 2 + r);
  s.quadraticCurveTo(-w / 2, -d / 2, -w / 2 + r, -d / 2);
  return s;
}
export function extrusion(
  p,
  shape,
  depth,
  material,
  pos = [0, 0, 0],
  bevel = 0,
) {
  return mesh(
    p,
    new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: bevel > 0,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 1,
      steps: 1,
      curveSegments: 6,
    }),
    material,
    pos,
  );
}
export function sign(p, atlas, key, w, h, pos, rotation = 0, m) {
  const g = group(p, pos, rotation, key);
  if (m) box(g, w + 0.06, h + 0.06, 0.08, m);
  atlas.attach(g, key, w, h, [0, 0, 0.047]);
  return g;
}
