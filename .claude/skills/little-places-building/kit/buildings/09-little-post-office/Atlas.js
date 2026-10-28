import * as THREE from 'three';
// One canvas for all print: the curved name sign, the 〒 mark, clock face, posters, stamps, labels and envelopes.
export function createAtlas() {
  const canvas = document.createElement('canvas'); canvas.width = 2048; canvas.height = 1536;
  const c = canvas.getContext('2d');
  const cells = {
    sign: [0, 0, 1536, 256], mark: [1536, 0, 256, 256], clock: [1792, 0, 256, 256], hours: [0, 256, 512, 256], parcels: [512, 256, 768, 192],
    board: [1280, 256, 512, 640], notice: [0, 512, 512, 512], poster: [512, 512, 512, 512], postcards: [1792, 256, 256, 512],
    stamps: [1024, 896, 512, 384], envelope: [1536, 896, 256, 160], flag: [1792, 768, 256, 384], post: [1536, 1056, 256, 128],
    label: [1536, 1184, 256, 128], pobox: [0, 1024, 512, 256], counter: [512, 1024, 512, 256],
  };
  const ink = '#4A3426', cream = '#F7F0DE', red = '#D94D3D', green = '#527C6E';
  const serif = 'Georgia, "Times New Roman", serif', round = '"Avenir Next", "Trebuchet MS", sans-serif';
  function text(s, x, y, size, color = ink, { font = serif, weight = 'bold', style = '', align = 'center', spacing = 0 } = {}) {
    c.fillStyle = color; c.font = `${style} ${weight} ${size}px ${font}`.trim(); c.textAlign = align;
    if ('letterSpacing' in c) c.letterSpacing = `${spacing}px`; c.fillText(s, x, y); if ('letterSpacing' in c) c.letterSpacing = '0px';
  }
  // the Japanese postal mark 〒: two bars and a stem, in a circle when `ring`
  function mark(x, y, s, col = red, ring = true) {
    c.save(); c.translate(x, y); c.scale(s, s);
    if (ring) { c.fillStyle = col; c.beginPath(); c.arc(0, 0, 100, 0, 7); c.fill(); col = '#FFFFFF'; }
    c.fillStyle = col; c.fillRect(-58, -52, 116, 20); c.fillRect(-58, -12, 116, 20); c.fillRect(-10, -12, 20, 76);
    c.restore();
  }
  function envelope(x, y, s) {
    c.save(); c.translate(x, y); c.scale(s, s); c.fillStyle = '#FFFFFF'; c.strokeStyle = ink; c.lineWidth = 6; c.fillRect(-90, -55, 180, 110); c.strokeRect(-90, -55, 180, 110);
    c.beginPath(); c.moveTo(-90, -55); c.lineTo(0, 10); c.lineTo(90, -55); c.stroke(); c.fillStyle = red; c.beginPath(); c.moveTo(-14, 18); c.bezierCurveTo(-30, 0, -10, -10, 0, 4); c.bezierCurveTo(10, -10, 30, 0, 14, 18); c.lineTo(0, 32); c.closePath(); c.fill(); c.restore();
  }
  for (const [key, [x, y, w, h]] of Object.entries(cells)) {
    c.save(); c.translate(x, y);
    const dark = key === 'board', clear = key === 'mark' || key === 'clock';
    c.fillStyle = dark ? '#34413B' : cream;
    if (clear) c.clearRect(0, 0, w, h); else c.fillRect(0, 0, w, h);
    if (!['sign', 'mark', 'clock', 'envelope', 'flag', 'post', 'label', 'parcels'].includes(key)) { c.strokeStyle = dark ? '#C89C70' : ink; c.lineWidth = 4; c.strokeRect(10, 10, w - 20, h - 20); }
    if (key === 'sign') { text('POST OFFICE', w / 2 - 70, 172, 140, ink, { font: round, spacing: 8 }); mark(w - 170, 128, 0.82); }
    if (key === 'mark') mark(w / 2, h / 2, 1.18);
    if (key === 'clock') {
      c.fillStyle = cream; c.beginPath(); c.arc(w / 2, h / 2, 120, 0, 7); c.fill();
      for (let i = 0; i < 60; i++) { const a = i * Math.PI / 30, long = i % 5 === 0; c.strokeStyle = ink; c.lineWidth = long ? 7 : 3; c.beginPath(); c.moveTo(w / 2 + Math.cos(a) * (long ? 92 : 100), h / 2 + Math.sin(a) * (long ? 92 : 100)); c.lineTo(w / 2 + Math.cos(a) * 110, h / 2 + Math.sin(a) * 110); c.stroke(); }
      [['XII', 0], ['III', 3], ['VI', 6], ['IX', 9]].forEach(([n, k]) => { const a = k * Math.PI / 6 - Math.PI / 2; text(n, w / 2 + Math.cos(a) * 72, h / 2 + Math.sin(a) * 72 + 10, 26, ink, { weight: '' }); });
    }
    if (key === 'hours') { text('8:30 — 17:00', w / 2, 110, 52); text('sat 9 — 12  ·  sun closed', w / 2, 180, 30, green, { weight: '' }); }
    if (key === 'parcels') { c.fillStyle = green; c.fillRect(0, 0, w, h); text('PARCEL COUNTER', w / 2 + 50, 122, 64, '#FFFFFF', { font: round, spacing: 3 }); mark(70, 96, 0.5, '#FFFFFF', false); }
    if (key === 'board') {
      ['POST', 'LETTERS', 'PACKAGES', 'CARDS'].forEach((v, i) => text(v, w / 2, 130 + i * 110, 64, cream, { font: '"Chalkboard SE", serif', weight: '' }));
      c.save(); c.strokeStyle = cream; c.lineWidth = 5; c.strokeRect(w / 2 - 50, 540, 100, 64); c.beginPath(); c.moveTo(w / 2 - 50, 540); c.lineTo(w / 2, 580); c.lineTo(w / 2 + 50, 540); c.stroke(); c.restore();
    }
    if (key === 'notice') {
      text('NOTICES', w / 2, 70, 44, ink, { font: round });
      [['#F2A6BC', 40, 100], ['#F6D57A', 270, 110], ['#7FA8D8', 60, 290], ['#B9DCC8', 280, 300]].forEach(([col, px, py]) => { c.fillStyle = col; c.fillRect(px, py, 190, 160); c.fillStyle = ink; for (let i = 0; i < 4; i++) c.fillRect(px + 20, py + 30 + i * 28, 150 - (i % 2) * 50, 8); c.fillStyle = red; c.beginPath(); c.arc(px + 95, py + 8, 10, 0, 7); c.fill(); });
    }
    if (key === 'poster') { c.fillStyle = '#F6D57A'; c.fillRect(30, 30, w - 60, h - 60); envelope(w / 2, 200, 1.6); text('WRITE', w / 2, 380, 64, ink); text('a letter today', w / 2, 440, 36, red, { style: 'italic', weight: '' }); }
    if (key === 'postcards') { ['#7FA8D8', '#F2A6BC', '#7FC2A0', '#F6D57A'].forEach((col, i) => { c.fillStyle = col; c.fillRect(28, 28 + i * 118, 200, 104); c.strokeStyle = ink; c.lineWidth = 3; c.strokeRect(28, 28 + i * 118, 200, 104); c.fillStyle = cream; c.beginPath(); c.arc(80, 80 + i * 118, 22, 0, 7); c.fill(); }); }
    if (key === 'stamps') {
      text('STAMPS', w / 2, 60, 44, ink, { font: round });
      for (let r = 0; r < 2; r++) for (let k = 0; k < 4; k++) { const sx = 40 + k * 112, sy = 90 + r * 140; c.fillStyle = ['#7FA8D8', '#F2A6BC', '#7FC2A0', '#F6D57A'][(r + k) % 4]; c.fillRect(sx, sy, 92, 116); c.strokeStyle = '#FFFFFF'; c.setLineDash([6, 6]); c.lineWidth = 6; c.strokeRect(sx + 4, sy + 4, 84, 108); c.setLineDash([]); mark(sx + 46, sy + 52, 0.25, red, false); }
    }
    if (key === 'envelope') { c.fillStyle = '#FFFFFF'; c.fillRect(0, 0, w, h); c.strokeStyle = '#D8CBA9'; c.lineWidth = 4; c.strokeRect(4, 4, w - 8, h - 8); c.fillStyle = red; c.fillRect(w - 56, 14, 40, 48); c.fillStyle = ink; for (let i = 0; i < 3; i++) c.fillRect(50, 80 + i * 22, 130 - i * 20, 7); }
    if (key === 'flag') { c.fillStyle = red; c.fillRect(0, 0, w, h); c.fillStyle = '#FFFFFF'; c.fillRect(0, h - 40, w, 12); mark(w / 2, h / 2 - 30, 0.95, '#FFFFFF', false); }
    if (key === 'post') { c.fillStyle = red; c.fillRect(0, 0, w, h); text('POST', w / 2, 92, 78, '#FFFFFF', { font: round, spacing: 6 }); }
    if (key === 'label') { c.fillStyle = '#FFFFFF'; c.fillRect(0, 0, w, h); c.fillStyle = red; c.fillRect(0, 0, 40, h); c.fillStyle = ink; for (let i = 0; i < 3; i++) c.fillRect(60, 26 + i * 30, 160 - i * 30, 10); }
    if (key === 'pobox') { for (let r = 0; r < 3; r++) for (let k = 0; k < 6; k++) { const bx = 24 + k * 78, by = 24 + r * 72; c.fillStyle = '#D6A34B'; c.fillRect(bx, by, 68, 62); c.fillStyle = ink; c.fillRect(bx + 26, by + 26, 16, 6); text(String(101 + r * 6 + k), bx + 34, by + 20, 16, ink, { weight: '' }); } }
    if (key === 'counter') { text('POST & PARCELS', w / 2, 110, 52, ink, { font: round }); mark(w / 2, 180, 0.45); }
    c.restore();
  }
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 8;
  const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, alphaTest: 0.5 });
  const uvOf = (key, u, v) => { const [x, y, cw, ch] = cells[key]; return [(x + u * cw) / canvas.width, 1 - (y + (1 - v) * ch) / canvas.height]; };
  const remap = (geo, key) => { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, ...uvOf(key, uv.getX(i), uv.getY(i))); return geo; };
  function attach(parent, key, w, h, pos = [0, 0, 0], turn = 0) {
    const o = new THREE.Mesh(remap(new THREE.PlaneGeometry(w, h), key), material); o.position.set(...pos); o.rotation.y = turn; parent.add(o); return o;
  }
  function disc(parent, key, r, pos = [0, 0, 0]) {
    const o = new THREE.Mesh(remap(new THREE.CircleGeometry(r, 32), key), material); o.position.set(...pos); parent.add(o); return o;
  }
  // print on a curved band: an open cylinder segment (outer face), centred on +z
  function band(parent, key, radius, height, arc, pos = [0, 0, 0]) {
    const geo = new THREE.CylinderGeometry(radius, radius, height, 32, 1, true, -arc / 2, arc);
    const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, ...uvOf(key, uv.getX(i), uv.getY(i)));
    const o = new THREE.Mesh(geo, material); o.position.set(...pos); parent.add(o); return o;
  }
  return { texture, material, attach, disc, band, canvas };
}
