import * as THREE from 'three';
// The illustrated shadow sits below the page level, so a building with a wide paved forecourt hides most of it
// under its own paving. This copies the shadow onto the paving surface, clipped to the paved rectangle.
function clip(poly, axis, value, keepAbove) {
  const out = [], inside = p => keepAbove ? p[axis] >= value : p[axis] <= value;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length], ia = inside(a), ib = inside(b);
    if (ia) out.push(a);
    if (ia !== ib) { const t = (value - a[axis]) / (b[axis] - a[axis]); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
  }
  return out;
}
// `root` is the model before batching. Only parts that stand above the street cast onto the paving;
// the paving, curbs and plinth would otherwise shade the whole forecourt.
// `layers`: [{ x0, x1, z0, z1, y }, …], e.g. the paved base and the road ring around it.
export function floorShadow(root, shadowMaterial, layers, minHeight = 0.5) {
  root.updateMatrixWorld(true);
  const out = [], box = new THREE.Box3(), v = new THREE.Vector3();
  root.traverse(o => {
    if (!o.isMesh || o.isLineSegments2 || o.material.transparent || o.material.map || !o.visible) return;
    for (let p = o; p; p = p.parent) if (p.userData.live || p.userData.noShadow) return;   // particles, live parts and interiors cast no shadow
    const type = o.geometry.type; if (type !== 'BoxGeometry' && type !== 'ExtrudeGeometry') return;
    box.setFromObject(o); if (box.max.y < minHeight) return;
    const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry, src = g.getAttribute('position');
    for (let i = 0; i + 2 < src.count; i += 3) {
      // same projection as createIllustrationShadow: x − 0.6·y, z + 0.27·y
      const tri = [0, 1, 2].map(k => { v.fromBufferAttribute(src, i + k).applyMatrix4(o.matrixWorld); const h = Math.max(0, v.y); return [v.x - h * 0.6, v.z + h * 0.27]; });
      for (const { x0, x1, z0, z1, y } of layers) {
        let poly = tri;
        for (const [axis, value, above] of [[0, x0, true], [0, x1, false], [1, z0, true], [1, z1, false]]) { poly = clip(poly, axis, value, above); if (poly.length < 3) break; }
        if (poly.length < 3) continue;
        for (let k = 1; k < poly.length - 1; k++) out.push(poly[0][0], y, poly[0][1], poly[k][0], y, poly[k][1], poly[k + 1][0], y, poly[k + 1][1]);
      }
    }
    if (g !== o.geometry) g.dispose();
  });
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(out, 3));
  const mesh = new THREE.Mesh(geometry, shadowMaterial); mesh.renderOrder = 1; mesh.name = 'Shadow on the paving';
  return mesh;
}
