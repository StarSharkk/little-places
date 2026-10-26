import * as THREE from "three";
import { themes } from "./themes.js";
export const palette = themes[0];
export function createMaterials() {
  const gradient = new THREE.DataTexture(
    new Uint8Array([155, 211, 255]),
    3,
    1,
    THREE.RedFormat,
  );
  gradient.minFilter = gradient.magFilter = THREE.NearestFilter;
  gradient.needsUpdate = true;
  const materials = {};
  for (const [key, color] of Object.entries(palette)) {
    if (key === "name" || key === "label") continue;
    materials[key] = new THREE.MeshToonMaterial({
      color,
      gradientMap: gradient,
    });
  }
  materials.ink = new THREE.MeshBasicMaterial({ color: palette.ink });
  materials.line = new THREE.MeshBasicMaterial({ color: palette.line });
  materials.asphalt = new THREE.MeshBasicMaterial({ color: palette.asphalt });
  return materials;
}
export const config = {
  width: 4.6,
  depth: 3.8,
  height: 7.4,
  upperFloorHeights: [3.55, 5.55],
  furniture: true,
};
