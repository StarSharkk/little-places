import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { LineSegments2 } from "three/addons/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
// Bake static meshes by shared material. Articulated parts remain separate local batches.
export function finishModel(root, dynamic = []) {
  const lineMaterials = [];
  root.updateMatrixWorld(true);
  function bake(target, exclude) {
    const inverse = target.matrixWorld.clone().invert();
    const batches = new Map(),
      edges = [],
      boldEdges = [],
      remove = [];
    target.traverse((o) => {
      if (
        !o.isMesh ||
        exclude.some((e) => {
          let p = o;
          while (p) {
            if (p === e) return true;
            p = p.parent;
          }
          return false;
        })
      )
        return;
      const transform = inverse.clone().multiply(o.matrixWorld);
      let g = o.geometry.clone();
      if (g.index) g = g.toNonIndexed();
      g.applyMatrix4(transform);
      const key = o.material.uuid;
      if (!batches.has(key))
        batches.set(key, { material: o.material, items: [] });
      batches.get(key).items.push(g);
      if (o.userData.outline) {
        const e = new THREE.EdgesGeometry(o.geometry, 28);
        e.applyMatrix4(transform);
        const a = e.getAttribute("position").array;
        const dest =
          o.geometry.type === "BoxGeometry" && o.geometry.parameters.height > 2
            ? boldEdges
            : edges;
        for (const n of a) dest.push(n);
        e.dispose();
      }
      remove.push(o);
    });
    for (const mesh of remove) mesh.removeFromParent();
    for (const { material, items } of batches.values()) {
      const geo = mergeGeometries(items, false);
      if (!geo) throw new Error("Cannot merge building geometry");
      const mesh = new THREE.Mesh(geo, material);
      mesh.castShadow = !material.transparent;
      mesh.receiveShadow = true;
      target.add(mesh);
      for (const g of items) g.dispose();
    }
    for (const [positions, width] of [
      [edges, 1.05],
      [boldEdges, 1.45],
    ]) {
      if (!positions.length) continue;
      const geometry = new LineSegmentsGeometry();
      geometry.setPositions(positions);
      const mat = new LineMaterial({
        color: "#252525",
        linewidth: width,
        worldUnits: false,
        depthTest: true,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      });
      mat.onBeforeCompile = (shader) => {
        shader.vertexShader = shader.vertexShader.replace(
          "gl_Position = clip;",
          "gl_Position = clip; gl_Position.z -= 0.000045 * gl_Position.w;",
        );
      };
      const lines = new LineSegments2(geometry, mat);
      lines.computeLineDistances();
      target.add(lines);
      lineMaterials.push(mat);
    }
  }
  bake(root, dynamic);
  for (const d of dynamic) bake(d, []);
  return lineMaterials;
}
// A projected silhouette is crisp at any DPR and needs no live shadow map.
export function createIllustrationShadow(root) {
  root.updateMatrixWorld(true);
  const geos = [];
  root.traverse((o) => {
    if (
      !o.isMesh ||
      o.isLineSegments2 ||
      o.material.transparent ||
      o.material.map
    )
      return;
    const type = o.geometry.type;
    if (type !== "BoxGeometry" && type !== "ExtrudeGeometry") return;
    const params = o.geometry.parameters;
    if (
      type === "BoxGeometry" &&
      params.width * params.height * params.depth < 0.025
    )
      return;
    let g = o.geometry.clone();
    if (g.index) g = g.toNonIndexed();
    g.applyMatrix4(o.matrixWorld);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = Math.max(0, p.getY(i));
      p.setXYZ(i, p.getX(i) - y * 0.6, -0.355, p.getZ(i) + y * 0.27);
    }
    g.deleteAttribute("normal");
    g.deleteAttribute("uv");
    geos.push(g);
  });
  const geometry = mergeGeometries(geos, false);
  for (const g of geos) g.dispose();
  const shadow = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({
      color: "#92A6CF",
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  // The shadow is constructed before batching the building. Draw it after the
  // opaque ground even though its material was created first.
  shadow.renderOrder = 1;
  return shadow;
}
