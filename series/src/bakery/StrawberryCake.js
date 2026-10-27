import * as THREE from 'three';
import { cached, group, mesh, ring, sphere } from './primitives.js';

// Closed, gently filleted cylinders: no hard cap edge, texture or faceted icing.
function roundedCylinder(radius, height, fillet) {
  return cached(`cake-cylinder:${radius}:${height}:${fillet}`, () => {
    const points = [new THREE.Vector2(0, 0), new THREE.Vector2(radius - fillet, 0)];
    for (let i = 1; i <= 8; i++) {
      const a = -Math.PI / 2 + i / 8 * Math.PI / 2;
      points.push(new THREE.Vector2(radius - fillet + fillet * Math.cos(a), fillet + fillet * Math.sin(a)));
    }
    points.push(new THREE.Vector2(radius, height - fillet));
    for (let i = 1; i <= 8; i++) {
      const a = i / 8 * Math.PI / 2;
      points.push(new THREE.Vector2(radius - fillet + fillet * Math.cos(a), height - fillet + fillet * Math.sin(a)));
    }
    points.push(new THREE.Vector2(0, height));
    return new THREE.LatheGeometry(points, 64);
  });
}

function creamGeometry() {
  return cached('shortcake-piped-cream', () => {
    const position = [], uv = [], indices = [], segments = 36, rows = 20;
    for (let j = 0; j <= rows; j++) {
      const t = j / rows;
      const r = t === 0 ? 0 : .135 * Math.pow(Math.sin(Math.PI * Math.pow(t, .62)), .9);
      for (let i = 0; i <= segments; i++) {
        const a = i / segments * Math.PI * 2;
        const fluted = r * (1 + .12 * Math.cos(6 * a - t * 4));
        position.push(fluted * Math.cos(a) + .035 * t ** 3, t * .245, fluted * Math.sin(a));
        uv.push(i / segments, t);
      }
    }
    for (let j = 0; j < rows; j++) for (let i = 0; i < segments; i++) {
      const a = j * (segments + 1) + i, b = a + segments + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(position, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geometry.setIndex(indices);geometry.computeVertexNormals();
    return geometry;
  });
}

function strawberryGeometry() {
  return cached('shortcake-tapered-strawberry', () => {
    const curve = new THREE.SplineCurve([
      new THREE.Vector2(0, 0), new THREE.Vector2(.035, .015),
      new THREE.Vector2(.080, .085), new THREE.Vector2(.134, .180),
      new THREE.Vector2(.153, .265), new THREE.Vector2(.131, .327),
      new THREE.Vector2(.070, .355), new THREE.Vector2(0, .359),
    ]);
    return new THREE.LatheGeometry(curve.getPoints(28), 32);
  });
}

// A back-face shell gives each tiny curved object a quiet continuous silhouette.
// It is retained by the existing material batching, without triangle wireframes.
function outlinedObject(parent, geometry, material, ink, centerY, expansion) {
  mesh(parent, geometry, material, [0, 0, 0], false);
  const outline = mesh(parent, geometry, ink, [0, centerY * (1 - expansion), 0], false);
  outline.scale.setScalar(expansion);
}

function Strawberry(parent, m, ink, angle) {
  const g = group(parent, 'Fresh strawberry', [Math.cos(angle) * .41, .77, Math.sin(angle) * .41]);
  outlinedObject(g, strawberryGeometry(), m.berry, ink, .18, 1.06);
  // Five flattened, pointed leaves form a small calyx on the broad shoulder.
  for (let i = 0; i < 5; i++) {
    const a = i * Math.PI * 2 / 5 + angle;
    const leaf = mesh(g, cached('cake-leaf', () => new THREE.SphereGeometry(1, 12, 8)), m.mint, [Math.cos(a) * .057, .359, Math.sin(a) * .057], false);
    leaf.scale.set(.035, .016, .092);leaf.rotation.y = Math.PI / 2 - a;
    leaf.rotation.x = .12;
  }
  // A few discrete seeds on the outward surface; deliberately no noisy texture.
  for (let i = 0; i < 6; i++) {
    const a = i * 2.399 + angle, y = i % 2 ? .245 : .165;
    const radius = i % 2 ? .151 : .125;
    const seed = sphere(g, [.008, .013, .004], m.seed, [Math.cos(a) * radius, y, Math.sin(a) * radius]);
    seed.rotation.y = Math.PI / 2 - a;
  }
  return g;
}

export function StrawberryCake(parent, materials, roofSurfaceY, scale = 1) {
  const cake = group(parent, 'Japanese strawberry shortcake', [0, roofSurfaceY, 0]);
  cake.scale.setScalar(scale);
  const toon = color => {const m = materials.cream.clone();m.color.set(color);return m;};
  const m = {
    cream: materials.cream, ink: materials.ink,
    sponge: toon('#F5DCA0'), filling: toon('#F3C4CE'),
    berry: toon('#E65D57'), mint: toon('#9AD5B6'), seed: toon('#FFE2AA'),
  };
  const silhouette = new THREE.MeshBasicMaterial({color:'#302B26',side:THREE.BackSide});
  function layer(name, radius, height, fillet, bottom, material) {
    const g = group(cake, name, [0, bottom, 0]);
    mesh(g, roundedCylinder(radius, height, fillet), material, [0, 0, 0], false);
    return g;
  }
  function contour(radius, y, thickness = .006) {
    const line = ring(cake, radius, thickness, m.ink, [0, y, 0]);line.rotation.x = -Math.PI / 2;
  }
  layer('Rounded cream display plate', 1.12, .09, .032, 0, m.cream);
  // Rings sit outside the fillets instead of intersecting their curved skins.
  contour(1.112, .082);contour(1.122, .022);
  layer('Bottom cream', 1.0, .12, .035, .09, m.cream);
  layer('Lower sponge', .99, .15, .015, .21, m.sponge);
  layer('Strawberry cream filling', .995, .075, .014, .36, m.filling);
  layer('Upper sponge', .99, .15, .015, .435, m.sponge);
  layer('Rounded frosting', 1.015, .185, .055, .585, m.cream);
  // Fine layer contours read at illustration scale without outlining every face.
  for (const y of [.21, .36, .435, .585]) contour(.994, y, .006);
  contour(.998, .758);contour(1.002, .115);
  for (let i = 0; i < 4; i++) Strawberry(cake, m, silhouette, Math.PI / 4 + i * Math.PI / 2);
  for (let i = 0; i < 8; i++) {
    const a = Math.PI / 8 + i * Math.PI / 4;
    const cream = group(cake, 'Piped cream rosette', [Math.cos(a) * .79, .77, Math.sin(a) * .79]);
    cream.rotation.y = -a;
    outlinedObject(cream, creamGeometry(), m.cream, silhouette, .12, 1.06);
  }
  cake.updateWorldMatrix(true, true);
  const bounds = new THREE.Box3().setFromObject(cake);
  const diameter = new THREE.Box3().setFromObject(cake.getObjectByName('Rounded frosting')).getSize(new THREE.Vector3()).x;
  const berries = cake.children.filter(o => o.name === 'Fresh strawberry');
  const rosettes = cake.children.filter(o => o.name === 'Piped cream rosette');
  const closestToppings = Math.min(...berries.flatMap(b => rosettes.map(c => b.position.distanceTo(c.position))));
  parent.userData.cakeAudit = {
    diameter, roofWidth: 6.04, diameterRatio: diameter / 6.04,
    strawberryCount: berries.length, creamRosetteCount: rosettes.length,
    closestToppingCenters: closestToppings,
    roofSurfaceY, pedestalBottomY: bounds.min.y, decorationTopY: bounds.max.y,
    center: [0, 0],
  };
  return cake;
}
