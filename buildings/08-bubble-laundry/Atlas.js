import * as THREE from 'three';
// One canvas for all print: the shop sign, light boxes, posters, the vending header, the clock and small labels.
export function createAtlas() {
  const canvas = document.createElement('canvas'); canvas.width = 2048; canvas.height = 1536;
  const c = canvas.getContext('2d');
  const cells = {
    sign: [0, 0, 1536, 256], coin: [1536, 0, 256, 512], coinWide: [1792, 0, 256, 128], open: [0, 256, 512, 256], hours: [512, 256, 512, 256],
    board: [1024, 256, 512, 640], howto: [0, 512, 512, 512], poster: [512, 512, 512, 512], vend: [1536, 512, 512, 256],
    clock: [1536, 768, 256, 256], price: [1792, 768, 256, 128], mag: [0, 1024, 512, 256], steps: [512, 1024, 1024, 384],
  };
  const ink = '#4A3426', cream = '#F7F0DE', mint = '#4E9C90', blue = '#5C8FC7', coral = '#C9584A';
  const serif = 'Georgia, "Times New Roman", serif', round = '"Avenir Next", "Trebuchet MS", sans-serif';
  function text(s, x, y, size, color = ink, { font = serif, weight = 'bold', style = '', align = 'center', spacing = 0 } = {}) {
    c.fillStyle = color; c.font = `${style} ${weight} ${size}px ${font}`.trim(); c.textAlign = align;
    if ('letterSpacing' in c) c.letterSpacing = `${spacing}px`; c.fillText(s, x, y); if ('letterSpacing' in c) c.letterSpacing = '0px';
  }
  const bubble = (x, y, r) => { c.strokeStyle = blue; c.lineWidth = Math.max(3, r * 0.18); c.fillStyle = '#DDEEFB'; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.stroke(); c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(x - r * 0.35, y - r * 0.35, r * 0.25, 0, 7); c.fill(); };
  function washerIcon(x, y, s, col = '#8DBBE3') { c.save(); c.translate(x, y); c.scale(s, s); c.fillStyle = col; c.strokeStyle = ink; c.lineWidth = 6; c.fillRect(-50, -60, 100, 120); c.strokeRect(-50, -60, 100, 120); c.fillStyle = '#DDEEFB'; c.beginPath(); c.arc(0, 10, 32, 0, 7); c.fill(); c.stroke(); c.fillStyle = ink; c.fillRect(-38, -50, 30, 10); c.restore(); }
  for (const [key, [x, y, w, h]] of Object.entries(cells)) {
    c.save(); c.translate(x, y);
    const dark = key === 'board';
    c.fillStyle = dark ? '#34413B' : key === 'clock' ? 'rgba(0,0,0,0)' : cream;
    if (key === 'clock') c.clearRect(0, 0, w, h); else c.fillRect(0, 0, w, h);
    if (!['sign', 'clock', 'coin', 'coinWide', 'vend', 'price'].includes(key)) { c.strokeStyle = dark ? '#C89C70' : ink; c.lineWidth = 4; c.strokeRect(10, 10, w - 20, h - 20); }
    if (key === 'sign') {
      text('Bubble Laundry', w / 2 + 20, 170, 132, ink, { spacing: 2 });
      bubble(120, 120, 46); bubble(185, 70, 24); bubble(205, 175, 16); bubble(w - 120, 110, 34); bubble(w - 70, 170, 18);
    }
    if (key === 'coin') {
      c.fillStyle = '#FFFFFF'; c.fillRect(0, 0, w, h); c.fillStyle = blue; c.fillRect(0, 0, w, 70); c.fillRect(0, h - 70, w, 70);
      washerIcon(w / 2, 170, 0.9); text('COIN', w / 2, 320, 64, ink, { font: round }); text('LAUNDRY', w / 2, 392, 46, ink, { font: round });
    }
    if (key === 'coinWide') { c.fillStyle = '#FFFFFF'; c.fillRect(0, 0, w, h); c.strokeStyle = blue; c.lineWidth = 8; c.strokeRect(6, 6, w - 12, h - 12); text('COIN', w / 2, 58, 44, ink, { font: round }); text('LAUNDRY', w / 2, 104, 34, ink, { font: round }); }
    if (key === 'open') { text('OPEN', w / 2, 150, 104, coral); text('24 hours', w / 2, 212, 30, mint, { style: 'italic', weight: '' }); }
    if (key === 'hours') { text('Wash  ¥400', w / 2, 100, 46); text('Dry  ¥100 / 10 min', w / 2, 168, 36, mint, { weight: '' }); }
    if (key === 'board') {
      ['FRESH', 'CLOTHES', 'BRIGHT', 'DAYS'].forEach((v, i) => text(v, w / 2, 140 + i * 112, 70, cream, { font: '"Chalkboard SE", serif', weight: '' }));
      c.strokeStyle = '#F3CF76'; c.lineWidth = 6; c.beginPath(); c.arc(w / 2, 560, 34, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
      c.fillStyle = '#F3CF76'; c.beginPath(); c.arc(w / 2 - 16, 545, 5, 0, 7); c.arc(w / 2 + 16, 545, 5, 0, 7); c.fill();
    }
    if (key === 'howto') {
      text('HOW TO WASH', w / 2, 80, 44, ink, { font: round });
      ['1  Load', '2  Detergent', '3  Coins', '4  Start'].forEach((v, i) => { washerIcon(80, 160 + i * 88, 0.42, ['#8DBBE3', '#F0A9B8', '#F3D27E', '#9CD3BE'][i]); text(v, 140, 176 + i * 88, 38, ink, { align: 'left', weight: '' }); });
    }
    if (key === 'poster') {
      c.fillStyle = '#DDEEFB'; c.fillRect(30, 30, w - 60, h - 60);
      for (let i = 0; i < 7; i++) bubble(80 + i * 60, 90 + (i % 3) * 40, 16 + (i % 2) * 10);
      c.strokeStyle = ink; c.lineWidth = 4; c.beginPath(); c.moveTo(60, 230); c.lineTo(w - 60, 230); c.stroke();
      [['#F2A6BC', 110], ['#7FA8D8', 230], ['#F6D57A', 350]].forEach(([col, px]) => { c.fillStyle = col; c.beginPath(); c.moveTo(px - 50, 240); c.lineTo(px + 50, 240); c.lineTo(px + 40, 360); c.lineTo(px - 40, 360); c.closePath(); c.fill(); c.stroke(); });
      text('fresh & fluffy', w / 2, 440, 46, ink, { style: 'italic', weight: '' });
    }
    if (key === 'vend') { c.fillStyle = blue; c.fillRect(0, 0, w, h); text('DETERGENT', w / 2, 120, 76, '#FFFFFF', { font: round }); text('softener · stain · fresh', w / 2, 190, 34, '#DDEEFB', { font: round, weight: '' }); }
    if (key === 'clock') { c.fillStyle = cream; c.beginPath(); c.arc(w / 2, h / 2, 118, 0, 7); c.fill(); c.strokeStyle = ink; c.lineWidth = 10; c.stroke(); for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; c.fillStyle = ink; c.fillRect(w / 2 + Math.cos(a) * 92 - 4, h / 2 + Math.sin(a) * 92 - 4, 8, 8); } c.lineWidth = 9; c.beginPath(); c.moveTo(w / 2, h / 2); c.lineTo(w / 2 + 40, h / 2 - 50); c.moveTo(w / 2, h / 2); c.lineTo(w / 2 - 70, h / 2 + 10); c.stroke(); }
    if (key === 'price') { c.fillStyle = '#FFFFFF'; c.fillRect(0, 0, w, h); text('¥120', w / 2, 84, 60, coral, { font: round }); }
    if (key === 'mag') { ['#F2A6BC', '#7FA8D8', '#F6D57A', '#9CD3BE'].forEach((col, i) => { c.fillStyle = col; c.fillRect(24 + i * 120, 30, 104, 196); c.strokeStyle = ink; c.lineWidth = 3; c.strokeRect(24 + i * 120, 30, 104, 196); c.fillStyle = cream; c.fillRect(36 + i * 120, 50, 80, 22); }); }
    if (key === 'steps') {
      text('Wash  →  Dry  →  Fold', w / 2, 120, 78, ink, { font: round });
      [['#8DBBE3', 220], ['#F3D27E', 512], ['#F0A9B8', 804]].forEach(([col, px]) => washerIcon(px, 260, 0.9, col));
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
  function disc(parent, key, r, pos = [0, 0, 0]) {
    const o = new THREE.Mesh(remap(new THREE.CircleGeometry(r, 28), key), material); o.position.set(...pos); parent.add(o); return o;
  }
  return { texture, material, attach, disc, canvas };
}
