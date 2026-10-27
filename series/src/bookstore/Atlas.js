import * as THREE from 'three';
// One canvas for all print: geometry carries the shape, the texture carries lettering and tiny artwork.
export function createAtlas() {
  const canvas = document.createElement('canvas'); canvas.width = 2048; canvas.height = 1536;
  const c = canvas.getContext('2d');
  const cells = {
    sign: [0, 0, 1536, 256], board: [1536, 0, 512, 640], picks: [0, 256, 512, 512], open: [512, 256, 512, 256],
    hours: [512, 512, 512, 256], books: [1024, 256, 512, 256], poster: [1024, 512, 512, 512], poster2: [0, 768, 512, 512],
    postcards: [512, 768, 512, 256], bag: [512, 1024, 512, 512], recommend: [1024, 1024, 512, 512], page: [1536, 640, 512, 384], pageL: [1536, 640, 256, 384], pageR: [1792, 640, 256, 384],
    sale: [0, 1280, 512, 256], mat: [1536, 1024, 512, 256],
  };
  const ink = '#352F2A', cream = '#F4EAD6', coral = '#C46553', mint = '#4F8C76';
  const serif = 'Georgia, "Times New Roman", serif';
  function text(s, x, y, size, color = ink, { font = serif, weight = 'bold', style = '', align = 'center' } = {}) {
    c.fillStyle = color; c.font = `${style} ${weight} ${size}px ${font}`.trim(); c.textAlign = align; c.fillText(s, x, y);
  }
  function bookIcon(x, y, s, col) { c.save(); c.translate(x, y); c.scale(s, s); c.fillStyle = col; c.fillRect(-40, -55, 80, 110); c.fillStyle = cream; c.fillRect(-28, -40, 56, 10); c.fillRect(-28, -22, 40, 6); c.strokeStyle = ink; c.lineWidth = 5; c.strokeRect(-40, -55, 80, 110); c.restore(); }
  for (const [key, [x, y, w, h]] of Object.entries(cells)) {
    if (key === 'pageL' || key === 'pageR') continue; // halves of the open book's spread
    c.save(); c.translate(x, y);
    const dark = key === 'board' || key === 'recommend' || key === 'sale';
    c.fillStyle = dark ? '#34413B' : cream; c.fillRect(0, 0, w, h);
    if (key !== 'sign' && key !== 'page' && key !== 'mat') { c.strokeStyle = dark ? '#C89C70' : ink; c.lineWidth = 4; c.strokeRect(10, 10, w - 20, h - 20); }
    if (key === 'sign') {
      // the board is ~6.8:1 like this cell, so lettering is drawn true to shape
      if ('letterSpacing' in c) c.letterSpacing = '10px';
      text('bookstore', w / 2 + 5, 178, 168, ink, { weight: '600', style: 'italic' });
      if ('letterSpacing' in c) c.letterSpacing = '0px';
      c.fillStyle = coral; c.beginPath(); c.arc(120, 128, 12, 0, 7); c.arc(w - 120, 128, 12, 0, 7); c.fill();
    }
    if (key === 'board') {
      text('Today', w / 2, 92, 58, cream); text('—  NEW & USED  —', w / 2, 140, 22, '#C89C70', { font: 'monospace', weight: '' });
      ['Poetry', 'Travel', 'Picture books', 'Cookbooks', 'Mysteries'].forEach((v, i) => text(v, w / 2, 230 + i * 70, 34, cream, { weight: '' }));
      text('come in & browse', w / 2, 600, 28, '#F3CF76', { style: 'italic', weight: '' });
    }
    if (key === 'picks') {
      text("TODAY'S", w / 2, 92, 48, coral); text('PICKS', w / 2, 150, 66, ink);
      bookIcon(150, 300, 1.1, '#94B9D8'); bookIcon(256, 290, 1.25, '#D77C68'); bookIcon(362, 300, 1.1, '#7FAF8A');
      text('chosen by our staff', w / 2, 440, 28, mint, { style: 'italic', weight: '' });
    }
    if (key === 'open') { text('OPEN', w / 2, 150, 96, coral); text('come on in', w / 2, 210, 30); }
    if (key === 'hours') { text('9:00 — 20:00', w / 2, 118, 54); text('closed on mondays', w / 2, 184, 28, coral, { weight: '' }); }
    if (key === 'books') { text('BOOKS', w / 2, 150, 110, cream === '#F4EAD6' ? ink : ink); text('·  new  &  used  ·', w / 2, 212, 30, mint, { weight: '' }); }
    if (key === 'poster') {
      c.fillStyle = '#94B9D8'; c.fillRect(30, 30, w - 60, h - 60);
      c.fillStyle = '#F3CF76'; c.beginPath(); c.arc(w / 2, 200, 90, 0, 7); c.fill();
      c.fillStyle = '#7FAF8A'; c.beginPath(); c.moveTo(30, 380); c.quadraticCurveTo(220, 250, 482, 360); c.lineTo(482, 482); c.lineTo(30, 482); c.fill();
      text('READ', w / 2, 440, 70, cream); text('outside', w / 2, 120, 40, ink, { style: 'italic', weight: '' });
    }
    if (key === 'poster2') {
      c.fillStyle = '#E9A6B4'; c.fillRect(30, 30, w - 60, h - 60);
      bookIcon(w / 2, 230, 2, '#F4EAD6');
      text('BOOK', w / 2, 400, 64, ink); text('FAIR', w / 2, 462, 64, coral);
    }
    if (key === 'postcards') { ['#94B9D8', '#F3CF76', '#E9A6B4', '#7FAF8A'].forEach((col, i) => { c.fillStyle = col; c.fillRect(30 + i * 120, 40, 100, 176); c.strokeStyle = ink; c.lineWidth = 3; c.strokeRect(30 + i * 120, 40, 100, 176); c.fillStyle = cream; c.beginPath(); c.arc(80 + i * 120, 110, 26, 0, 7); c.fill(); }); }
    if (key === 'bag') { bookIcon(w / 2, 200, 1.6, coral); text('the little', w / 2, 360, 46, ink, { style: 'italic', weight: '' }); text('BOOKSHOP', w / 2, 420, 52, ink); }
    if (key === 'recommend') {
      text('We recommend', w / 2, 80, 44, cream, { style: 'italic', weight: '' });
      [['#D77C68', 'The Lighthouse'], ['#94B9D8', 'Small Things'], ['#F3CF76', 'A Room of One'], ['#7FAF8A', 'Garden Notes']].forEach(([col, t], i) => {
        c.fillStyle = col; c.fillRect(48, 120 + i * 92, 50, 70); text(t, 120, 168 + i * 92, 30, cream, { weight: '', align: 'left' });
      });
    }
    if (key === 'sale') { text('ANY  2  FOR', w / 2, 96, 44, cream, { weight: '' }); text('€ 5', w / 2, 196, 92, '#F3CF76'); }
    if (key === 'mat') { c.fillStyle = '#B98C5E'; c.fillRect(0, 0, w, h); c.strokeStyle = ink; c.lineWidth = 8; c.strokeRect(14, 14, w - 28, h - 28); text('hello, reader', w / 2, 150, 58, ink, { style: 'italic', weight: '' }); }
    if (key === 'page') {
      c.fillStyle = '#FBF5E8'; c.fillRect(0, 0, w, h);
      c.fillStyle = '#E9DFC9'; c.fillRect(236, 0, 40, h);
      text('Chapter One', 128, 70, 30, ink, { style: 'italic', weight: '' });
      c.fillStyle = '#B9AE98';
      for (let i = 0; i < 11; i++) c.fillRect(30, 110 + i * 22, 190 - (i % 4 === 3 ? 70 : 0), 6);
      for (let i = 0; i < 6; i++) c.fillRect(286, 40 + i * 22, 190 - (i % 3 === 2 ? 60 : 0), 6);
      c.fillStyle = '#94B9D8'; c.fillRect(296, 186, 176, 150);
      c.fillStyle = '#F3CF76'; c.beginPath(); c.arc(420, 230, 22, 0, 7); c.fill();
      c.fillStyle = '#7FAF8A'; c.beginPath(); c.moveTo(296, 336); c.quadraticCurveTo(360, 250, 472, 300); c.lineTo(472, 336); c.fill();
      c.strokeStyle = ink; c.lineWidth = 3; c.strokeRect(296, 186, 176, 150);
    }
    c.restore();
  }
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 8;
  const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
  function attach(parent, key, w, h, pos = [0, 0, 0], turn = 0) {
    const [x, y, cw, ch] = cells[key];
    const geo = new THREE.PlaneGeometry(w, h), uv = geo.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (x + uv.getX(i) * cw) / canvas.width, 1 - (y + (1 - uv.getY(i)) * ch) / canvas.height);
    const o = new THREE.Mesh(geo, material); o.position.set(...pos); o.rotation.y = turn; parent.add(o); return o;
  }
  return { texture, material, attach, canvas };
}
