import * as THREE from 'three';
// Steam or smoke as one instanced mesh of soft puffs: each rises, drifts, swells and shrinks away over `life` seconds,
// so it needs no transparency. Marked userData.live, so batching and the illustrated shadow leave it alone.
// Keep count ≤ 200 per building.
export function steam(parent, material, { count = 24, origin = [0, 0, 0], spread = 0.3, rise = 1.4, size = 0.14, life = 4, drift = [0.15, 0] } = {}) {
  const geo = new THREE.IcosahedronGeometry(1, 1);
  const mesh = new THREE.InstancedMesh(geo, material, count); mesh.name = 'Steam'; mesh.userData.live = true; mesh.frustumCulled = false;
  const seeds = Array.from({ length: count }, (_, i) => ({ phase: i / count, x: (Math.sin(i * 12.9898) * 0.5) * spread, z: (Math.sin(i * 78.233) * 0.5) * spread }));
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3();
  const update = (time) => {
    seeds.forEach((d, i) => {
      const k = (time / life + d.phase) % 1, swell = Math.sin(Math.PI * k);           // 0 → 1 → 0 over a puff's life
      p.set(origin[0] + d.x + drift[0] * k, origin[1] + rise * k, origin[2] + d.z + drift[1] * k);
      s.setScalar(size * (0.35 + 0.9 * swell) * (0.4 + 0.6 * (1 - k)));
      mesh.setMatrixAt(i, m.compose(p, q, s));
    });
    mesh.instanceMatrix.needsUpdate = true;
  };
  update(0); parent.add(mesh);
  return { mesh, update };
}
