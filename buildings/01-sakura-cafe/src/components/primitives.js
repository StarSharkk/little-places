import * as THREE from "three";
const cache = new Map();
export function geometry(key, create) {
  if (!cache.has(key)) cache.set(key, create());
  return cache.get(key);
}
export function part(parent, geo, mat, pos = [0, 0, 0], outline = true) {
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(...pos);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.outline = outline;
  parent.add(mesh);
  return mesh;
}
export function box(p, w, h, d, m, pos = [0, 0, 0]) {
  return part(
    p,
    geometry(`box${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d)),
    m,
    pos,
  );
}
export function cylinder(p, rt, rb, h, m, pos = [0, 0, 0], segments = 16) {
  return part(
    p,
    geometry(
      `c${rt},${rb},${h},${segments}`,
      () => new THREE.CylinderGeometry(rt, rb, h, segments),
    ),
    m,
    pos,
  );
}
export function ball(p, r, m, pos = [0, 0, 0]) {
  return part(
    p,
    geometry(`s${r}`, () => new THREE.IcosahedronGeometry(r, 1)),
    m,
    pos,
    false,
  );
}
export function rod(p, a, b, r, m) {
  const start = new THREE.Vector3(...a),
    end = new THREE.Vector3(...b);
  const mesh = cylinder(
    p,
    r,
    r,
    start.distanceTo(end),
    m,
    start.clone().add(end).multiplyScalar(0.5).toArray(),
    8,
  );
  mesh.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    end.sub(start).normalize(),
  );
  return mesh;
}
export function archShape(w, h) {
  const s = new THREE.Shape(),
    r = w / 2;
  s.moveTo(-r, 0);
  s.lineTo(r, 0);
  s.lineTo(r, h - r);
  s.absarc(0, h - r, r, 0, Math.PI, false);
  s.lineTo(-r, 0);
  return s;
}
export function extrude(p, shape, depth, m, pos = [0, 0, 0], bevel = 0) {
  return part(
    p,
    new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: bevel > 0,
      bevelSegments: 1,
      steps: 1,
      bevelSize: bevel,
      bevelThickness: bevel,
      curveSegments: 20,
    }),
    m,
    pos,
  );
}
export function arch(p, w, h, d, m, pos) {
  return extrude(p, archShape(w, h), d, m, pos);
}
export function label(
  p,
  text,
  w,
  h,
  pos,
  color = "#252525",
  bg = null,
  size = 64,
) {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = Math.round((1024 * h) / w);
  const ctx = c.getContext("2d");
  if (bg) {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, c.width, c.height);
  }
  ctx.fillStyle = color;
  ctx.font = `600 ${size}px Georgia, serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, c.width / 2, c.height / 2, 960);
  const map = new THREE.CanvasTexture(c);
  map.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshBasicMaterial({
    map,
    transparent: !bg,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });
  return part(p, new THREE.PlaneGeometry(w, h), mat, pos, false);
}
export function group(p, pos = [0, 0, 0], rotation = 0) {
  const g = new THREE.Group();
  g.position.set(...pos);
  g.rotation.y = rotation;
  p.add(g);
  return g;
}
