import * as THREE from 'three';
// One canvas for all print: lettering, the menu, box logos and the painted pizza tops.
export function createAtlas() {
  const canvas = document.createElement('canvas'); canvas.width = 2048; canvas.height = 1536;
  const c = canvas.getContext('2d');
  const cells = {
    sign: [0, 0, 1536, 256], emblem: [1536, 0, 512, 512], board: [0, 256, 512, 640], menu: [512, 256, 512, 512],
    open: [1024, 256, 512, 256], blade: [1024, 512, 512, 256], boxlid: [0, 896, 512, 512], boxside: [512, 768, 512, 256],
    hours: [512, 1024, 512, 256], pizza: [1024, 768, 512, 512], poster: [1536, 512, 512, 512],
  };
  const ink = '#352F2A', cream = '#F4EAD6', coral = '#C9584A', green = '#4F8C66';
  const serif = 'Georgia, "Times New Roman", serif';
  function text(s, x, y, size, color = ink, { font = serif, weight = 'bold', style = '', align = 'center', spacing = 0 } = {}) {
    c.fillStyle = color; c.font = `${style} ${weight} ${size}px ${font}`.trim(); c.textAlign = align;
    if ('letterSpacing' in c) c.letterSpacing = `${spacing}px`; c.fillText(s, x, y); if ('letterSpacing' in c) c.letterSpacing = '0px';
  }
  // a whole pizza seen from above: crust ring, sauce, cheese, pepperoni and basil
  function pizza(x, y, r) {
    c.save(); c.translate(x, y);
    c.fillStyle = '#D99A45'; c.beginPath(); c.arc(0, 0, r, 0, 7); c.fill();
    c.strokeStyle = ink; c.lineWidth = r * 0.04; c.stroke();
    c.fillStyle = '#D9533F'; c.beginPath(); c.arc(0, 0, r * 0.82, 0, 7); c.fill();
    c.fillStyle = '#F6CF62'; for (let i = 0; i < 9; i++) { const a = i * 2.4, d = r * (0.2 + (i % 3) * 0.2); c.beginPath(); c.ellipse(Math.cos(a) * d, Math.sin(a) * d, r * 0.24, r * 0.18, a, 0, 7); c.fill(); }
    c.fillStyle = '#B83F33'; for (let i = 0; i < 6; i++) { const a = i * 1.05 + 0.3, d = r * 0.5; c.beginPath(); c.arc(Math.cos(a) * d, Math.sin(a) * d, r * 0.12, 0, 7); c.fill(); }
    c.fillStyle = '#5E9A62'; for (let i = 0; i < 4; i++) { const a = i * 1.57 + 0.8, d = r * 0.3; c.beginPath(); c.ellipse(Math.cos(a) * d, Math.sin(a) * d, r * 0.09, r * 0.05, a, 0, 7); c.fill(); }
    c.strokeStyle = '#B07432'; c.lineWidth = r * 0.025; for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(0, 0); const a = i * Math.PI / 3; c.lineTo(Math.cos(a) * r * 0.82, Math.sin(a) * r * 0.82); c.stroke(); }
    c.restore();
  }
  function slice(x, y, s) {
    c.save(); c.translate(x, y); c.scale(s, s);
    c.fillStyle = '#F6CF62'; c.strokeStyle = ink; c.lineWidth = 6;
    c.beginPath(); c.moveTo(0, 80); c.lineTo(-60, -50); c.quadraticCurveTo(0, -75, 60, -50); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#D99A45'; c.beginPath(); c.moveTo(-60, -50); c.quadraticCurveTo(0, -75, 60, -50); c.lineTo(56, -38); c.quadraticCurveTo(0, -60, -56, -38); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#C9463A'; for (const [px, py] of [[-20, -15], [18, -5], [-2, 30]]) { c.beginPath(); c.arc(px, py, 12, 0, 7); c.fill(); }
    c.restore();
  }
  for (const [key, [x, y, w, h]] of Object.entries(cells)) {
    c.save(); c.translate(x, y);
    const dark = key === 'board' || key === 'menu';
    c.fillStyle = dark ? '#34413B' : key === 'emblem' || key === 'pizza' ? 'rgba(0,0,0,0)' : cream;
    if (key === 'emblem' || key === 'pizza') c.clearRect(0, 0, w, h); else c.fillRect(0, 0, w, h);
    if (!['sign', 'emblem', 'pizza', 'boxlid', 'boxside'].includes(key)) { c.strokeStyle = dark ? '#C89C70' : ink; c.lineWidth = 4; c.strokeRect(10, 10, w - 20, h - 20); }
    if (key === 'sign') {
      text('PIZZA PICCOLA', w / 2, 150, 132, ink, { spacing: 8 });
      text('WOOD-FIRED  PIZZERIA', w / 2, 222, 46, coral, { font: 'ui-monospace, Menlo, monospace', weight: '', spacing: 10 });
    }
    if (key === 'emblem') { c.fillStyle = cream; c.beginPath(); c.arc(w / 2, h / 2, 250, 0, 7); c.fill(); c.strokeStyle = coral; c.lineWidth = 16; c.stroke(); pizza(w / 2, h / 2, 190); }
    if (key === 'pizza') pizza(w / 2, h / 2, 250);
    if (key === 'board') {
      ['PIZZA', 'PASTA', 'DRINKS', 'GOOD', 'TIMES'].forEach((v, i) => text(v, w / 2, 120 + i * 106, 64, cream, { font: '"Comic Sans MS", "Chalkboard SE", serif', weight: '' }));
      c.strokeStyle = '#F3CF76'; c.lineWidth = 4; c.beginPath(); c.moveTo(120, 420); c.lineTo(392, 420); c.stroke();
    }
    if (key === 'menu') {
      text('PIZZA', w / 2, 100, 70, cream, { font: '"Chalkboard SE", serif', weight: '' });
      [['Margherita', '9'], ['Diavola', '11'], ['Funghi', '10'], ['Quattro', '12'], ['Calzone', '11']].forEach(([n, p], i) => { text(n, 60, 190 + i * 62, 34, cream, { align: 'left', weight: '' }); text(p, w - 60, 190 + i * 62, 34, '#F3CF76', { align: 'right', weight: '' }); });
    }
    if (key === 'open') { text('OPEN', w / 2, 150, 108, coral); text('buon appetito', w / 2, 214, 30, ink, { style: 'italic', weight: '' }); }
    if (key === 'blade') { slice(110, 128, 1.15); text('PIZZA', 330, 160, 92, coral); }
    if (key === 'boxlid') {
      c.fillStyle = '#F1E2C6'; c.fillRect(0, 0, w, h); c.strokeStyle = '#C9A57A'; c.lineWidth = 8; c.strokeRect(14, 14, w - 28, h - 28);
      slice(w / 2, 190, 1.3); text('PIZZA', w / 2, 360, 70, coral); text('PICCOLA', w / 2, 430, 56, coral);
    }
    if (key === 'boxside') { c.fillStyle = '#F1E2C6'; c.fillRect(0, 0, w, h); slice(90, 128, 0.95); text('PIZZA', 300, 118, 70, coral); text('PICCOLA', 300, 190, 56, coral); }
    if (key === 'hours') { text('12:00 — 22:00', w / 2, 118, 54); text('forno a legna', w / 2, 184, 30, green, { style: 'italic', weight: '' }); }
    if (key === 'poster') {
      c.fillStyle = '#86BC99'; c.fillRect(30, 30, (w - 60) / 3, h - 60); c.fillStyle = cream; c.fillRect(30 + (w - 60) / 3, 30, (w - 60) / 3, h - 60);
      c.fillStyle = '#E0715B'; c.fillRect(30 + 2 * (w - 60) / 3, 30, (w - 60) / 3, h - 60);
      pizza(w / 2, 230, 130); text('MARGHERITA', w / 2, 440, 50, ink);
    }
    c.restore();
  }
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 8;
  const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, alphaTest: 0.5 });
  const remap = (geo, key) => {
    const [x, y, cw, ch] = cells[key], uv = geo.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (x + uv.getX(i) * cw) / canvas.width, 1 - (y + (1 - uv.getY(i)) * ch) / canvas.height);
    return geo;
  };
  function attach(parent, key, w, h, pos = [0, 0, 0], turn = 0) {
    const o = new THREE.Mesh(remap(new THREE.PlaneGeometry(w, h), key), material); o.position.set(...pos); o.rotation.y = turn; parent.add(o); return o;
  }
  // round print (pizza tops, the emblem): a disc whose uv covers the square cell
  function disc(parent, key, r, pos = [0, 0, 0], flat = true) {
    const o = new THREE.Mesh(remap(new THREE.CircleGeometry(r, 28), key), material); o.position.set(...pos); if (flat) o.rotation.x = -Math.PI / 2; parent.add(o); return o;
  }
  return { texture, material, attach, disc, canvas };
}
