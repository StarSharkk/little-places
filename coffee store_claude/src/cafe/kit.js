// Toolkit shared by every café component: palette-aware toon materials, outline baking,
// geometry helpers. Components describe parts; `bake` then merges them per material (few draw calls)
// and extracts clean feature edges as screen-space-width lines.
import * as THREE from 'three';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { INK } from './config.js';

const mix = (a, b, t) => new THREE.Color(a).lerp(new THREE.Color(b), t);

// role -> colour. Basic roles ignore light.
const ROLES = {
  wall: p => p.wall,
  wallDeep: p => mix(p.wall, INK, 0.13),
  trim: p => p.trim,
  stone: p => mix(p.trim, '#BFB08C', 0.45),
  stoneDeep: p => mix(p.trim, '#BFB08C', 0.8),
  roof: p => p.roof,
  roofDark: p => mix(p.roof, INK, 0.3),
  door: p => p.door,
  shutter: p => p.shutter,
  awning: p => p.awning,
  flower: p => p.flower,
  coral: () => '#EF745F',
  cream: () => '#F7F3E9',
  mint: () => '#9AD5B6',
  leaf: () => mix('#9AD5B6', INK, 0.26),
  sky: () => '#91B7EB',
  sakura: () => '#EFA8C4',
  yellow: () => '#F6C445',
  wood: () => '#B98760',
  woodDark: () => mix('#B98760', INK, 0.35),
  soil: () => '#6A4B3B',
  brick: () => mix('#EF745F', INK, 0.12),
  interior: () => mix('#F6C445', '#F7F3E9', 0.55),
  interiorDeep: () => mix('#EF745F', '#F6C445', 0.45),
  chalk: () => mix(INK, '#8AA79B', 0.3),
  ink: () => INK,
  glass: () => '#A9C8F0',
  glassHi: () => '#F7F3E9',
  road: () => mix('#91B7EB', '#F7F3E9', 0.6),
  pave: () => '#FBF7EB',
  hull: () => INK,
};
const BASIC = new Set(['ink', 'glass', 'glassHi']);

function gradientMap() {
  // three discrete tones: shade / mid / light
  const data = new Uint8Array([168, 214, 255]);
  const tex = new THREE.DataTexture(data, 3, 1, THREE.RedFormat);
  tex.minFilter = tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

export class Kit {
  constructor(palette, weights = {}) {
    const w = { outer: 2.3, mid: 1.5, thin: 1.0, hatch: 0.9, soft: 1.0, hull: 1.7, ...weights };
    this.palette = palette;
    this.gradient = gradientMap();
    this.mats = new Map();
    this.clones = [];
    this.lineMats = {
      outer: new LineMaterial({ color: INK, linewidth: w.outer }),
      mid: new LineMaterial({ color: INK, linewidth: w.mid }),
      thin: new LineMaterial({ color: INK, linewidth: w.thin }),
      hatch: new LineMaterial({ color: INK, linewidth: w.hatch }),
      soft: new LineMaterial({ color: '#D8CBA9', linewidth: w.soft }),
    };
    for (const m of Object.values(this.lineMats)) m.alphaToCoverage = false;
    this.hullMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: { uRes: { value: new THREE.Vector2(1, 1) }, uWidth: { value: w.hull }, uColor: { value: new THREE.Color(INK) } },
      vertexShader: /* glsl */`
        uniform vec2 uRes; uniform float uWidth;
        void main() {
          vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          vec3 vn = normalize(normalMatrix * normal);
          vec2 d = (projectionMatrix * vec4(vn, 0.0)).xy * uRes * 0.5;
          d = length(d) > 1e-5 ? normalize(d) : vec2(0.0);
          clip.xy += d * (2.0 * uWidth) / uRes * clip.w;
          gl_Position = clip;
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uColor;
        void main() { gl_FragColor = vec4(uColor, 1.0); }`,
    });
  }

  roleColor(role) {
    if (!ROLES[role]) throw new Error(`Unknown material role: ${role}`);
    return new THREE.Color(ROLES[role](this.palette));
  }

  mat(role) {
    if (role === 'hull') return this.hullMat;
    let m = this.mats.get(role);
    if (m) return m;
    m = this._make(role);
    this.mats.set(role, m);
    return m;
  }

  _make(role) {
    let m;
    if (BASIC.has(role)) {
      m = new THREE.MeshBasicMaterial({ color: this.roleColor(role) });
      if (role === 'glass') { m.transparent = true; m.opacity = 0.74; m.depthWrite = false; }
      if (role === 'glassHi') { m.transparent = true; m.opacity = 0.7; m.depthWrite = false; }
    } else {
      m = new THREE.MeshToonMaterial({ color: this.roleColor(role), gradientMap: this.gradient });
      m.emissive = new THREE.Color(0xf7f3e9);
      m.emissiveIntensity = 0;
    }
    m.polygonOffset = true;
    m.polygonOffsetFactor = 1;
    m.polygonOffsetUnits = 1;
    m.userData.role = role;
    return m;
  }

  cloneMat(role, tag) {
    const m = this.mat(role).clone();
    m.userData.role = role;
    m.userData.tag = tag;
    this.clones.push(m);
    return m;
  }

  setPalette(palette) {
    this.palette = palette;
    for (const m of [...this.mats.values(), ...this.clones]) this._recolor(m);
  }

  _recolor(m) {
    m.color.copy(this.roleColor(m.userData.role));
    if (m.userData.hover && !m.emissive) m.color.lerp(new THREE.Color('#ffffff'), m.userData.hover * 0.28);
  }

  setHover(tag, amount) {
    for (const m of this.clones) {
      if (m.userData.tag !== tag) continue;
      m.userData.hover = amount;
      if (m.emissive) m.emissiveIntensity = amount * 0.34;
      else this._recolor(m);
    }
  }

  // ---- parts ---------------------------------------------------------------------------
  part(parent, role, geo, o = {}) {
    const mesh = new THREE.Mesh(geo, o.material || this.mat(role));
    mesh.userData.role = role;
    mesh.userData.line = o.line ?? 'mid';
    if (o.angle !== undefined) mesh.userData.angle = o.angle;
    if (o.keep) mesh.userData.keep = true;
    if (o.p) mesh.position.set(...o.p);
    if (o.r) mesh.rotation.set(...o.r);
    if (o.s) mesh.scale.set(...o.s);
    if (o.name) mesh.name = o.name;
    parent.add(mesh);
    return mesh;
  }

  // sphere-like organic blob with a constant-pixel-width silhouette outline (inverted hull)
  blob(parent, role, radius, p, o = {}) {
    const sg = new THREE.SphereGeometry(1, o.seg ?? 18, o.seg ? Math.ceil(o.seg * 0.7) : 12);
    const s = o.s || [1, 1, 1];
    this.part(parent, role, sg, { p, s: s.map(v => v * radius), line: 'none' });
    this.part(parent, 'hull', sg, { p, s: s.map(v => v * radius), line: 'none' });
  }

  // hull outline for any smooth mesh already added (e.g. lathe pots)
  hull(parent, geo, o = {}) {
    return this.part(parent, 'hull', geo, { ...o, line: 'none' });
  }

  // hand-placed line segments (intersections, tile courses…). pts: [x,y,z, x,y,z, ...] pairs
  seg(parent, cls, pts) {
    const o = new THREE.Object3D();
    o.userData.seg = { cls, arr: pts };
    parent.add(o);
    return o;
  }

  // box-section beam between two points; `up` keeps the section oriented
  beam(parent, role, a, b, h, t, o = {}) {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
    const len = A.distanceTo(B);
    const x = B.clone().sub(A).normalize();
    const up = new THREE.Vector3(...(o.up || [0, 1, 0]));
    const y = up.sub(x.clone().multiplyScalar(up.dot(x))).normalize();
    const z = new THREE.Vector3().crossVectors(x, y);
    const g = new THREE.BoxGeometry(len, h, t);
    g.applyMatrix4(new THREE.Matrix4().makeBasis(x, y, z).setPosition(A.clone().add(B).multiplyScalar(0.5)));
    return this.part(parent, role, g, { line: o.line, angle: o.angle });
  }

  rod(parent, role, a, b, r, o = {}) {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
    const len = A.distanceTo(B);
    const g = new THREE.CylinderGeometry(r, r, len, o.seg ?? 8, 1, o.open);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize()));
    g.translate(...A.clone().add(B).multiplyScalar(0.5).toArray());
    return this.part(parent, role, g, { line: o.line ?? 'thin' });
  }

  // ---- bake ----------------------------------------------------------------------------
  bakeAll(root) {
    const dynamics = [];
    root.traverse(o => { if (o !== root && o.userData.dynamic) dynamics.push(o); });
    dynamics.reverse().forEach(d => this.bake(d));
    this.bake(root);
  }

  bake(root) {
    root.updateMatrixWorld(true);
    const inv = root.matrixWorld.clone().invert();
    const meshes = [], segObjs = [];
    const walk = o => {
      if (o !== root && o.userData.dynamic) return;
      if (o.isMesh && !o.userData.baked) meshes.push(o);
      if (o.userData.seg) segObjs.push(o);
      for (const c of o.children) walk(c);
    };
    walk(root);

    const byRole = new Map();
    const segs = { outer: [], mid: [], thin: [], hatch: [], soft: [] };
    const m4 = new THREE.Matrix4();
    const tmp = new THREE.Vector3();
    const pushPositions = (arr, attr, mat) => {
      for (let i = 0; i < attr.count; i++) {
        tmp.fromBufferAttribute(attr, i).applyMatrix4(mat);
        arr.push(tmp.x, tmp.y, tmp.z);
      }
    };

    for (const mesh of meshes) {
      const ud = mesh.userData;
      m4.multiplyMatrices(inv, mesh.matrixWorld);
      const cls = ud.line ?? 'mid';
      if (cls !== 'none') {
        const src = mesh.geometry.userData.edgeSrc || mesh.geometry;
        const eg = new THREE.EdgesGeometry(src, ud.angle ?? 35);
        pushPositions(segs[cls], eg.attributes.position, m4);
        eg.dispose();
      }
      if (!ud.keep) {
        let g = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
        for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
        g.applyMatrix4(m4);
        if (!byRole.has(ud.role)) byRole.set(ud.role, []);
        byRole.get(ud.role).push(g);
        mesh.removeFromParent();
      }
    }
    for (const o of segObjs) {
      m4.multiplyMatrices(inv, o.matrixWorld);
      const a = o.userData.seg.arr;
      for (let i = 0; i < a.length; i += 3) {
        tmp.set(a[i], a[i + 1], a[i + 2]).applyMatrix4(m4);
        segs[o.userData.seg.cls].push(tmp.x, tmp.y, tmp.z);
      }
      o.userData.seg = null;
    }

    const tag = root.userData.tag;
    for (const [role, geos] of byRole) {
      const merged = mergeGeometries(geos, false);
      const material = role === 'hull' ? this.hullMat : tag ? this.cloneMat(role, tag) : this.mat(role);
      const mesh = new THREE.Mesh(merged, material);
      mesh.userData.baked = true;
      mesh.userData.role = role;
      mesh.name = `merged:${role}`;
      if (role === 'glass' || role === 'glassHi') mesh.renderOrder = 2;
      root.add(mesh);
      geos.forEach(g => g.dispose());
    }
    for (const [cls, arr] of Object.entries(segs)) {
      if (!arr.length) continue;
      const g = new LineSegmentsGeometry();
      g.setPositions(new Float32Array(arr));
      const l = new LineSegments2(g, this.lineMats[cls]);
      l.frustumCulled = false;
      l.userData.baked = true;
      l.name = `lines:${cls}`;
      root.add(l);
    }
  }

  // lines keep a constant pixel width; on small screens they thin out so the drawing stays airy
  setResolution(w, h) {
    const s = Math.min(1, Math.max(0.55, Math.min(w, h * 1.5) / 1150));
    for (const m of Object.values(this.lineMats)) {
      m.userData.base ??= m.linewidth;
      m.linewidth = m.userData.base * s;
      m.resolution.set(w, h);
    }
    this.hullMat.uniforms.uRes.value.set(w, h);
    this.hullMat.userData.base ??= this.hullMat.uniforms.uWidth.value;
    this.hullMat.uniforms.uWidth.value = this.hullMat.userData.base * s;
  }

  syncLineColors() {
    this.lineMats.hatch.color.copy(this.roleColor('roofDark'));
  }
}

// ---- geometry helpers --------------------------------------------------------------------
export function rectPath(P, x0, y0, x1, y1) {
  const s = new P();
  s.moveTo(x0, y0); s.lineTo(x1, y0); s.lineTo(x1, y1); s.lineTo(x0, y1); s.closePath();
  return s;
}

// rectangle whose top is a (semi-)elliptical arch of height `rise`
export function archPath(P, x0, y0, x1, yTop, rise) {
  const s = new P();
  s.moveTo(x0, y0); s.lineTo(x1, y0); s.lineTo(x1, yTop - rise);
  s.absellipse((x0 + x1) / 2, yTop - rise, (x1 - x0) / 2, rise, 0, Math.PI, false, 0);
  s.closePath();
  return s;
}

export function roundRectPath(P, x0, y0, x1, y1, r) {
  const s = new P();
  s.moveTo(x0 + r, y0); s.lineTo(x1 - r, y0); s.absarc(x1 - r, y0 + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x1, y1 - r); s.absarc(x1 - r, y1 - r, r, 0, Math.PI / 2, false);
  s.lineTo(x0 + r, y1); s.absarc(x0 + r, y1 - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x0, y0 + r); s.absarc(x0 + r, y0 + r, r, Math.PI, Math.PI * 1.5, false);
  s.closePath();
  return s;
}

export function polyPath(P, pts) {
  const s = new P();
  pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
  s.closePath();
  return s;
}

// extrude along +z. Optional restrained bevel (shading only: outlines use the un-bevelled proxy).
export function extrude(shape, depth, bevel = 0, seg = 28) {
  const base = { depth, bevelEnabled: false, curveSegments: seg, steps: 1 };
  const plain = new THREE.ExtrudeGeometry(shape, base);
  if (!bevel) return plain;
  const g = new THREE.ExtrudeGeometry(shape, { ...base, bevelEnabled: true, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 2 });
  // later transforms (rotateX, translate, shear…) must reach the outline proxy too
  const apply = g.applyMatrix4.bind(g);
  g.applyMatrix4 = m => { apply(m); plain.applyMatrix4(m); return g; };
  g.userData.edgeSrc = plain;
  return g;
}

export function shearY(geo, a, b, c) {
  geo.applyMatrix4(new THREE.Matrix4().set(1, 0, 0, 0, a, 1, b, c, 0, 0, 1, 0, 0, 0, 0, 1));
  return geo;
}

// polygon inset by per-edge distances (CCW polygon, positive = inwards)
export function insetPolygon(pts, dists) {
  const n = pts.length;
  const lines = [];
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % n];
    const dx = b[0] - a[0], dz = b[1] - a[1];
    const len = Math.hypot(dx, dz);
    const nx = -dz / len, nz = dx / len; // left normal = inward for CCW
    lines.push({ p: [a[0] + nx * dists[i], a[1] + nz * dists[i]], d: [dx / len, dz / len] });
  }
  const out = [];
  for (let i = 0; i < n; i++) {
    const L0 = lines[(i + n - 1) % n], L1 = lines[i];
    const den = L0.d[0] * L1.d[1] - L0.d[1] * L1.d[0];
    const t = ((L1.p[0] - L0.p[0]) * L1.d[1] - (L1.p[1] - L0.p[1]) * L1.d[0]) / den;
    out.push([L0.p[0] + L0.d[0] * t, L0.p[1] + L0.d[1] * t]);
  }
  return out;
}

// canvas texture helper
export function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.userData.redraw = () => { ctx.clearRect(0, 0, w, h); draw(ctx, w, h); tex.needsUpdate = true; };
  return tex;
}

export const D2R = Math.PI / 180;
