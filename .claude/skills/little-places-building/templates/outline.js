import * as THREE from "three";
// Template copy of buildings/01-sakura-cafe/src/components/outline.js.
// Ink silhouette for round, organic shapes (blossom, trunk, pot). Edge lines only catch hard corners,
// so smooth forms get an inverted hull: a back-facing copy pushed out by a constant number of pixels.
// `resolution` mirrors LineMaterial so the viewer's resize loop can update it alongside the edge lines.
export function createHullMaterial(width = 1.25, color = "#252525") {
  const resolution = new THREE.Vector2(1440, 900);
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {
      uRes: { value: resolution },
      uWidth: { value: width },
      uColor: { value: new THREE.Color(color) },
    },
    vertexShader: /* glsl */ `
      uniform vec2 uRes; uniform float uWidth;
      void main() {
        vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        vec3 vn = normalize(normalMatrix * normal);
        vec2 d = (projectionMatrix * vec4(vn, 0.0)).xy * uRes * 0.5;
        d = length(d) > 1e-5 ? normalize(d) : vec2(0.0);
        clip.xy += d * (2.0 * uWidth) / uRes * clip.w;
        gl_Position = clip;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      void main() { gl_FragColor = vec4(uColor, 1.0); }`,
  });
  material.resolution = resolution;
  return material;
}
// Adds the hull twin of an existing mesh (same geometry and transform).
export function hull(mesh, material) {
  const twin = new THREE.Mesh(mesh.geometry, material);
  twin.position.copy(mesh.position);
  twin.quaternion.copy(mesh.quaternion);
  twin.scale.copy(mesh.scale);
  twin.userData.outline = false;
  mesh.parent.add(twin);
  return twin;
}
