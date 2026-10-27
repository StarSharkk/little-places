import * as THREE from 'three';
// One atlas for all lettering: geometry carries the shape, the texture carries the print.
export function createAtlas() {
  const canvas = document.createElement('canvas'); canvas.width = 2048; canvas.height = 1024;
  const c = canvas.getContext('2d');
  const cells = { brand: [0, 0, 1536, 256], board: [1536, 0, 512, 640], open: [0, 256, 512, 256], wrap: [512, 256, 512, 512], label: [1024, 256, 512, 256], hours: [0, 512, 512, 256], tag: [1024, 512, 512, 256], side: [0, 768, 1024, 256], prices: [1024, 768, 1024, 256] };
  const bg = '#FFF8E7', ink = '#302B26', rose = '#C8587A', leaf = '#4F8A6B';
  const sans = '"Hiragino Sans","Noto Sans JP","PingFang SC",sans-serif';
  function text(s, x, y, size = 42, color = ink, font = 'Georgia', bold = true) {
    c.fillStyle = color; c.font = `${bold && font === 'Georgia' ? 'bold ' : ''}${size}px ${font}`; c.textAlign = 'center'; c.fillText(s, x, y);
  }
  function blossom(x, y, r, color = '#EFA8C4') {
    c.save(); c.translate(x, y); c.fillStyle = color;
    for (let i = 0; i < 5; i++) { c.rotate(Math.PI * 2 / 5); c.beginPath(); c.ellipse(0, -r * 0.6, r * 0.38, r * 0.62, 0, 0, 7); c.fill(); }
    c.fillStyle = '#F6C445'; c.beginPath(); c.arc(0, 0, r * 0.28, 0, 7); c.fill(); c.restore();
  }
  for (const [key, [x, y, w, h]] of Object.entries(cells)) {
    c.save(); c.translate(x, y);
    c.fillStyle = key === 'board' ? '#34413B' : bg; c.fillRect(0, 0, w, h);
    c.strokeStyle = key === 'board' ? '#E1BE8C' : ink; c.lineWidth = 3; c.strokeRect(12, 12, w - 24, h - 24);
    if (key === 'brand') {
      text('HANAYA', w / 2 + 40, 142, 124, ink); text('F L O W E R S   ·   F R E S H   E V E R Y   D A Y', w / 2 + 40, 214, 31, rose, 'monospace');
      blossom(212, 130, 54); blossom(w - 150, 130, 54, '#F6C445');
      c.fillStyle = leaf; c.font = `bold 52px ${sans}`; c.textAlign = 'center'; c.fillText('花屋', w - 150, 232);
    }
    if (key === 'board') {
      text('Fresh blooms', w / 2, 84, 47, bg); text('—  PICKED THIS MORNING  —', w / 2, 132, 19, '#E1BE8C', 'monospace');
      ['Tulip         3', 'Ranunculus   4', 'Sweet pea    3', 'Lavender     5', 'Peony        6'].forEach((v, i) => text(v, w / 2, 224 + i * 70, 27, bg, 'monospace'));
      blossom(w / 2, 590, 34); text('a bunch for someone', w / 2 + 2, 626, 22, '#F6C445');
    }
    if (key === 'open') { text('OPEN', w / 2, 142, 91, rose); text('come on in', w / 2, 204, 29); }
    if (key === 'wrap') { blossom(w / 2, 190, 90); text('hana', w / 2, 350, 110, rose); text('WITH LOVE', w / 2, 410, 36, leaf, 'monospace'); }
    if (key === 'label') { text('FRESH CUT', w / 2, 112, 56, rose); text('every morning · cold water', w / 2, 182, 25, ink, 'monospace'); }
    if (key === 'hours') { text('8:00 — 18:00', w / 2, 118, 53); text('flowers for every day', w / 2, 182, 27, rose); }
    if (key === 'tag') { text('A BUNCH', w / 2, 105, 52); text('for someone you love', w / 2, 172, 26, rose); }
    if (key === 'side') { text('SEASONAL BOUQUETS', w / 2, 118, 66); text('a little corner of spring', w / 2, 193, 33, rose); }
    if (key === 'prices') { ['TULIP', 'ROSE', 'DAISY', 'LILAC'].forEach((v, i) => { text(v, 128 + i * 256, 112, 25); text(['3.00', '5.00', '2.50', '4.00'][i], 128 + i * 256, 176, 30, rose); }); }
    c.restore();
  }
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 4;
  const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
  function attach(parent, key, w, h, pos = [0, 0, 0], turn = 0) {
    const [x, y, cw, ch] = cells[key];
    const geo = new THREE.PlaneGeometry(w, h), uv = geo.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (x + uv.getX(i) * cw) / canvas.width, 1 - (y + (1 - uv.getY(i)) * ch) / canvas.height);
    const o = new THREE.Mesh(geo, material); o.position.set(...pos); o.rotation.y = turn; parent.add(o); return o;
  }
  return { texture, material, attach, canvas };
}
