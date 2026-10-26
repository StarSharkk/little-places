import * as THREE from "three";
import { atlasColour, themes } from "./themes.js";
// All signage and products share one 2048² RGBA atlas (~21.3 MiB with mipmaps).
// The source artwork is original, rendered locally, and contains no external image assets.
export class TextureAtlas {
  constructor(theme = themes[0]) {
    this.theme = theme;
    this.canvas = document.createElement("canvas");
    this.canvas.width = this.canvas.height = 2048;
    this.context = this.canvas.getContext("2d");
    this.regions = new Map();
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.anisotropy = 4;
    this.material = new THREE.MeshBasicMaterial({
      map: this.texture,
      side: THREE.FrontSide,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    this.drawAll();
  }
  tile(name, x, y, w, h, draw) {
    const s = 256;
    const r = { x: x * s + 3, y: y * s + 3, w: w * s - 6, h: h * s - 6 };
    this.regions.set(name, r);
    this.artAspect =
      {
        shop: 7.84,
        canopy: 4.57,
        shutter: 1.86,
        capsuleCats: 1.421, capsuleBakery: 1.421, capsulePlants: 1.421, capsuleRetro: 1.421,
        gachaLabel: 6.429, merchLabel: 1.1,
        vendingGreen: 0.533,
        vertical: 0.203,
        posterGold: 0.545,
        posterRed: 0.558,
        posterBlue: 0.558,
        street: 4.28,
        noParking: 1,
        warning: 1,
        electric: 0.292,
        upperSign: 0.292,
        grocery: 0.544,
        citrus: 0.5,
        hvac: 1.655,
        notice: 4.53,
        streetMark: 2.31,
        bottleLabel: 0.75,
        crate: 3.3,
        interior: 1.88,
        hours: 1,
      }[name] || w / h;
    const ctx = this.context;
    ctx.save();
    ctx.beginPath();
    ctx.rect(r.x, r.y, r.w, r.h);
    ctx.clip();
    ctx.translate(r.x, r.y);
    ctx.scale(r.w / 1000, r.h / 1000);
    draw(ctx);
    ctx.restore();
    this.texture.needsUpdate = true;
  }
  plane(name, width, height) {
    const r = this.regions.get(name);
    if (!r) throw new Error(`Unknown atlas region: ${name}`);
    const geo = new THREE.PlaneGeometry(width, height),
      uv = geo.attributes.uv;
    for (let i = 0; i < uv.count; i++)
      uv.setXY(
        i,
        (r.x + uv.getX(i) * r.w) / 2048,
        1 - (r.y + (1 - uv.getY(i)) * r.h) / 2048,
      );
    const mesh = new THREE.Mesh(geo, this.material);
    mesh.userData.outline = false;
    return mesh;
  }
  attach(parent, name, width, height, pos = [0, 0, 0], rotation = 0) {
    const mesh = this.plane(name, width, height);
    mesh.position.set(...pos);
    mesh.rotation.y = rotation;
    parent.add(mesh);
    return mesh;
  }
  colour(value) { return atlasColour(value, this.theme); }
  setTheme(theme) { this.theme = theme; this.drawAll(); }
  drawAll() {
    this.context.clearRect(0, 0, 2048, 2048);
    this.context.fillStyle = this.theme.trim;
    this.context.fillRect(0, 0, 2048, 2048);
    const fill = (c, color) => {
      c.fillStyle = color;
      c.fillRect(0, 0, 1000, 1000);
    };
    const text = (c, t, x, y, size, color = this.colour("#394140"), weight = 700) => {
      c.fillStyle = color;
      c.font = `${weight} ${size}px "Hiragino Kaku Gothic ProN", "Noto Sans CJK JP", "Arial", sans-serif`;
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.save();
      c.translate(x, y);
      c.scale(
        Math.min(1 / this.artAspect, 900 / Math.max(1, c.measureText(t).width)),
        1,
      );
      c.fillText(t, 0, 0);
      c.restore();
    };
    const border = (c, color = this.colour("#9e9d91"), width = 12) => {
      c.strokeStyle = color;
      c.lineWidth = width;
      c.strokeRect(20, 20, 960, 960);
    };
    const vertical = (c, t, color = this.colour("#383d3c"), size = 190) => {
      [...t].forEach((ch, i, arr) =>
        text(
          c,
          ch,
          500,
          190 + (i * 650) / Math.max(1, arr.length - 1),
          size,
          color,
        ),
      );
    };
    const bottle = (
      c,
      x,
      y,
      w,
      h,
      color,
      labelColor = this.colour("#eee7c9"),
      label = "麦",
    ) => {
      c.fillStyle = color;
      c.beginPath();
      c.moveTo(x + w * 0.32, y);
      c.lineTo(x + w * 0.68, y);
      c.lineTo(x + w * 0.68, y + h * 0.18);
      c.quadraticCurveTo(x + w, y + h * 0.24, x + w, y + h * 0.34);
      c.lineTo(x + w, y + h);
      c.lineTo(x, y + h);
      c.lineTo(x, y + h * 0.34);
      c.quadraticCurveTo(x, y + h * 0.24, x + w * 0.32, y + h * 0.18);
      c.closePath();
      c.fill();
      c.fillStyle = this.colour("#b9ad80");
      c.fillRect(x + w * 0.3, y, w * 0.4, h * 0.055);
      c.fillStyle = labelColor;
      c.fillRect(x + 3, y + h * 0.43, w - 6, h * 0.35);
      text(c, label, x + w / 2, y + h * 0.61, w * 0.65, this.colour("#424638"));
    };
    this.tile("shop", 0, 0, 4, 1, (c) => {
      fill(c, this.colour("#e7e3ce"));
      border(c, this.colour("#9b9d91"), 8);
      c.strokeStyle = this.colour("#923f37");
      c.lineWidth = 9;
      c.beginPath();
      c.ellipse(110, 500, 48, 376, 0, 0, Math.PI * 2);
      c.stroke();
      text(c, "山", 110, 500, 280, this.colour("#923f37"));
      [..."山田雑貨店"].forEach((ch, i) =>
        text(c, ch, 260 + i * 145, 430, 500, this.colour("#923f37")),
      );
      text(c, "YAMADA GROCERY  •  SINCE 1968", 530, 835, 97, this.colour("#64685c"));
      text(c, "雑貨", 916, 495, 57, this.colour("#e9e5d6"));
    });
    this.tile("canopy", 4, 0, 4, 1, (c) => {
      fill(c, this.colour("#a8493c"));
      text(c, "食品 ・ 雑貨 ・ 日用品", 500, 450, 270, this.colour("#e7dfc7"));
      text(c, "山田商店   /   雑貨と暮らしの店", 500, 835, 85, this.colour("#dfc2a7"));
    });
    this.tile("shutter", 0, 1, 4, 2, (c) => {
      fill(c, this.colour("#b6c2be"));
      for (let y = 0; y < 1000; y += 27) {
        c.fillStyle = this.colour("#839591");
        c.fillRect(0, y, 1000, 3);
        c.fillStyle = this.colour("#cfd5c9");
        c.fillRect(0, y + 4, 1000, 3);
      }
      c.globalAlpha = 0.92;
      text(c, "山田雑貨店", 500, 220, 150, this.colour("#384f5a"));
      text(c, "食品・雑貨・日用品", 500, 400, 68, this.colour("#555d55"));
      text(c, "定休日 日曜日", 500, 580, 98, this.colour("#913f38"));
      text(c, "地域の皆さまと、創業五十八年。", 500, 760, 42, this.colour("#4e625e"));
      text(c, "TEL 03 - 3841 - 1968", 500, 875, 42, this.colour("#384f5a"));
    });
    const vending = (c, green = false) => {
      fill(c, green ? this.colour("#69816e") : this.colour("#dfdcd0"));
      border(c, green ? this.colour("#475d50") : this.colour("#a89f91"), 14);
      c.fillStyle = green ? this.colour("#e5ddaa") : this.colour("#a7453b");
      c.fillRect(32, 25, 936, 130);
      text(
        c,
        green ? "お茶と、ひとやすみ。" : "100円 から",
        500,
        90,
        73,
        green ? this.colour("#3a5544") : this.colour("#f6e9cf"),
      );
      c.fillStyle = this.colour("#293b40");
      c.fillRect(65, 177, 870, 599);
      const colors = green
        ? [this.colour("#66844d"), this.colour("#b8ad5d"), this.colour("#507a6b"), this.colour("#b4c4a4")]
        : [this.colour("#b35c4c"), this.colour("#cfb75b"), this.colour("#60838a"), this.colour("#738457")];
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 5; col++) {
          const x = 95 + col * 164,
            y = 192 + row * 190;
          bottle(
            c,
            x + 20,
            y,
            83,
            124,
            colors[(col + row) % 4],
            green ? this.colour("#d8dfc0") : this.colour("#ebe1be"),
            green ? "茶" : ["麦", "水", "珈", "果"][col % 4],
          );
          c.fillStyle = this.colour("#e4dfc9");
          c.fillRect(x, y + 131, 130, 29);
          text(
            c,
            "¥" + (100 + ((col + row) % 3) * 20),
            x + 65,
            y + 146,
            22,
            this.colour("#39423e"),
          );
          c.fillStyle = this.colour("#caa24e");
          c.beginPath();
          c.ellipse(x + 65, y + 170, 22, 7, 0, 0, 7);
          c.fill();
        }
      }
      c.fillStyle = this.colour("#3d4c4c");
      c.fillRect(85, 827, 585, 107);
      c.fillStyle = this.colour("#74867d");
      c.fillRect(108, 844, 535, 51);
      c.fillStyle = this.colour("#4c5853");
      c.fillRect(738, 806, 160, 70);
      text(c, "取り出し口", 385, 900, 29, this.colour("#e3dfc8"));
      text(c, "COLD", 825, 927, 30, this.colour("#e9e5cc"));
    };
    // The former drinks-machine space now holds original capsule-toy cards.
    const toyCard=(c,title,kind,colour)=>{
      fill(c,this.theme.trim);border(c,this.theme.ink,9);
      text(c,title,500,130,155,this.theme.ink);
      for(let i=0;i<3;i++) {
        const x=210+i*290;
        c.fillStyle=[this.theme.red,this.theme.yellow,this.theme.green][i];
        if(kind==='cat') {
          c.beginPath();c.ellipse(x,570,95,145,0,0,Math.PI*2);c.fill();
          c.beginPath();c.moveTo(x-85,490);c.lineTo(x-65,350);c.lineTo(x-5,440);c.lineTo(x+65,350);c.lineTo(x+85,490);c.fill();
          c.fillStyle=this.theme.ink;c.fillRect(x-40,540,14,22);c.fillRect(x+26,540,14,22);c.fillRect(x-8,590,16,13);
        } else if(kind==='bread') {
          c.beginPath();c.ellipse(x,570,110,155,0,0,Math.PI*2);c.fill();
          c.strokeStyle=this.theme.trim;c.lineWidth=16;for(let j=0;j<3;j++){c.beginPath();c.moveTo(x-55+j*45,495);c.lineTo(x-75+j*45,575);c.stroke();}
        } else if(kind==='plant') {
          c.fillRect(x-75,590,150,180);c.fillStyle=this.theme.leaf;
          c.beginPath();c.ellipse(x-45,490,45,130,-.45,0,Math.PI*2);c.fill();
          c.beginPath();c.ellipse(x+40,470,45,150,.4,0,Math.PI*2);c.fill();
        } else {
          c.fillRect(x-100,450,200,220);c.fillStyle=this.theme.trim;c.fillRect(x-70,480,140,100);
          c.fillStyle=this.theme.ink;c.fillRect(x-58,520,116,13);c.fillRect(x+45,610,20,20);
        }
      }
      text(c,'全３種 • 200円',500,890,96,this.theme.ink);
    };
    this.tile('capsuleCats',4,1,1,1,c=>toyCard(c,'まちのねこ','cat',this.theme.red));
    this.tile('capsuleBakery',5,1,1,1,c=>toyCard(c,'小さなパン屋','bread',this.theme.yellow));
    this.tile('capsulePlants',4,2,1,1,c=>toyCard(c,'てのひら植物','plant',this.theme.green));
    this.tile('capsuleRetro',5,2,1,1,c=>toyCard(c,'レトロ雑貨','retro',this.theme.blue));
    this.tile('gachaLabel',4,3,1,1,c=>{fill(c,this.theme.trim);text(c,'ガチャ • 200円',500,500,420,this.theme.ink);});
    this.tile('merchLabel',5,3,1,1,c=>{fill(c,this.theme.trim);border(c,this.theme.redDark,18);text(c,'日用品',500,300,200,this.theme.ink);text(c,'山田',500,700,250,this.theme.redDark);});
    this.tile("vendingGreen", 6, 1, 2, 3, (c) => vending(c, true));
    this.tile("vertical", 0, 3, 1, 3, (c) => {
      fill(c, this.colour("#e4e2d2"));
      border(c, this.colour("#6e776f"), 8);
      c.fillStyle = this.colour("#a9483c");
      c.fillRect(15, 15, 970, 190);
      text(c, "雑貨", 500, 110, 100, this.colour("#eee6d2"));
      [..."やまだ"].forEach((t, i) => text(c, t, 500, 370 + i * 230, 190));
    });
    this.tile("posterGold", 1, 3, 1, 2, (c) => {
      fill(c, this.colour("#c4b465"));
      border(c, this.colour("#595941"));
      text(c, "調味料", 500, 140, 180, this.colour("#443c30"));
      text(c, "あります", 500, 285, 105, this.colour("#443c30"));
      bottle(c, 370, 400, 240, 420, this.colour("#4e6245"), this.colour("#e2d4a2"), "醤");
      text(c, "毎日の食卓に", 500, 920, 68, this.colour("#55482f"));
    });
    this.tile("posterRed", 2, 3, 1, 2, (c) => {
      fill(c, this.colour("#e4ddc7"));
      border(c, this.colour("#a24738"), 20);
      text(c, "夏の", 500, 155, 130, this.colour("#a24738"));
      text(c, "おすすめ", 500, 300, 110, this.colour("#a24738"));
      c.fillStyle = this.colour("#c6a351");
      c.fillRect(240, 430, 420, 320);
      c.fillStyle = this.colour("#efead8");
      c.fillRect(240, 420, 420, 65);
      c.strokeStyle = this.colour("#be9b51");
      c.lineWidth = 45;
      c.strokeRect(240, 430, 420, 320);
      c.fillStyle = this.colour("#e4ddc7");
      c.fillRect(285, 520, 330, 130);
      text(c, "米", 450, 590, 145, this.colour("#a24738"));
      text(c, "おいしいお米", 500, 875, 110, this.colour("#734d34"));
    });
    this.tile("posterBlue", 3, 3, 1, 2, (c) => {
      fill(c, this.colour("#526f80"));
      border(c, this.colour("#c5d0c5"), 10);
      text(c, "冷", 500, 150, 175, this.colour("#e4e4d2"));
      text(c, "ラムネ", 500, 320, 125, this.colour("#e4e4d2"));
      bottle(c, 335, 430, 300, 390, this.colour("#9dbbb0"), this.colour("#e9e9cc"), "涼");
      text(c, "昭和の味", 500, 920, 78, this.colour("#e4e4d2"));
    });
    this.tile("street", 0, 6, 2, 1, (c) => {
      fill(c, this.colour("#49687b"));
      border(c, this.colour("#d7e0d7"), 16);
      text(c, "花見町 三丁目", 500, 355, 300, this.colour("#e8e7d8"));
      text(c, "HANAMI-CHO  3", 500, 770, 140, this.colour("#e0e4d8"));
    });
    this.tile("noParking", 2, 5, 1, 1, (c) => {
      fill(c, this.colour("#e1dfcf"));
      c.fillStyle = this.colour("#426c85");
      c.beginPath();
      c.arc(500, 500, 425, 0, 7);
      c.fill();
      c.strokeStyle = this.colour("#b55349");
      c.lineWidth = 95;
      c.stroke();
      c.beginPath();
      c.moveTo(190, 190);
      c.lineTo(810, 810);
      c.stroke();
    });
    this.tile("warning", 3, 5, 1, 1, (c) => {
      fill(c, this.colour("#d1bc63"));
      for (let i = -2; i < 5; i++) {
        c.fillStyle = this.colour("#414440");
        c.beginPath();
        c.moveTo(i * 420, 0);
        c.lineTo(i * 420 + 190, 0);
        c.lineTo(i * 420 + 820, 1000);
        c.lineTo(i * 420 + 630, 1000);
        c.fill();
      }
    });
    this.tile("electric", 4, 4, 1, 2, (c) => {
      fill(c, this.colour("#4d697b"));
      border(c, this.colour("#d6ddd1"), 10);
      vertical(c, "青葉町", this.colour("#e5e2cb"), 175);
      text(c, "３丁目", 500, 920, 70, this.colour("#e5e2cb"));
    });
    this.tile("upperSign", 5, 4, 1, 2, (c) => {
      fill(c, this.colour("#dcdcc5"));
      border(c, this.colour("#647d63"), 14);
      vertical(c, "みどり歯科", this.colour("#4f7151"), 145);
    });
    this.tile("grocery", 6, 4, 1, 2, (c) => {
      fill(c, this.colour("#c4ae64"));
      border(c, this.colour("#887b51"), 10);
      text(c, "お茶", 500, 190, 160, this.colour("#3a4638"));
      bottle(c, 325, 390, 350, 440, this.colour("#6a5f39"), this.colour("#d9c780"), "茶");
      text(c, "暮らしの、いつもの。", 500, 920, 49, this.colour("#3a4638"));
    });
    this.tile("citrus", 7, 4, 1, 2, (c) => {
      fill(c, this.colour("#8a9b6c"));
      text(c, "瀬戸内", 500, 125, 130, this.colour("#e6e3c1"));
      text(c, "みかん", 500, 290, 130, this.colour("#e6e3c1"));
      for (const [x, y, r] of [
        [350, 620, 200],
        [660, 660, 180],
      ]) {
        c.fillStyle = this.colour("#c6924b");
        c.beginPath();
        c.arc(x, y, r, 0, 7);
        c.fill();
        c.fillStyle = this.colour("#4c7151");
        c.beginPath();
        c.ellipse(x + 35, y - r, 90, 35, -0.5, 0, 7);
        c.fill();
      }
      text(c, "果汁100%", 500, 920, 85, this.colour("#e6e3c1"));
    });
    this.tile("hvac", 4, 6, 2, 2, (c) => {
      fill(c, this.colour("#d1d6cc"));
      border(c, this.colour("#788880"), 12);
      c.strokeStyle = this.colour("#52665f");
      for (let r = 65; r < 390; r += 35) {
        c.lineWidth = 9;
        c.beginPath();
        c.ellipse(450, 500, r / 1.655, r, 0, 0, 7);
        c.stroke();
      }
      for (let i = 0; i < 12; i++) {
        const a = (i * Math.PI) / 6;
        c.lineWidth = 5;
        c.beginPath();
        c.moveTo(450 + (Math.cos(a) * 40) / 1.655, 500 + Math.sin(a) * 40);
        c.lineTo(450 + (Math.cos(a) * 380) / 1.655, 500 + Math.sin(a) * 380);
        c.stroke();
      }
      c.fillStyle = this.colour("#73877c");
      c.beginPath();
      c.ellipse(450, 500, 65 / 1.655, 65, 0, 0, 7);
      c.fill();
      for (let y = 160; y < 800; y += 36) c.fillRect(870, y, 75, 12);
      text(c, "MACHI AIR", 260, 55, 29, this.colour("#4b6a62"));
    });
    this.tile("notice", 2, 6, 2, 1, (c) => {
      fill(c, this.colour("#e9e2c9"));
      border(c, this.colour("#8a9a85"), 15);
      text(c, "地域とともに、山田雑貨店。", 500, 300, 90, this.colour("#5a6e5d"));
      text(c, "営業時間  9:00 — 20:00", 500, 660, 64, this.colour("#786953"));
    });
    this.tile("streetMark", 0, 7, 2, 1, (c) => {
      fill(c, this.colour("#737c7c"));
      text(c, "止 ま れ", 500, 500, 210, this.colour("#dcded2"));
    });
    this.tile("bottleLabel", 2, 7, 1, 1, (c) => {
      fill(c, this.colour("#ddd3aa"));
      border(c, this.colour("#92814e"), 15);
      text(c, "果汁", 500, 330, 190, this.colour("#394d37"));
      text(c, "山田", 500, 680, 220, this.colour("#9a4a3d"));
    });
    this.tile("crate", 3, 7, 1, 1, (c) => {
      fill(c, this.colour("#8b4339"));
      text(c, "山田", 500, 400, 210, this.colour("#ded3ab"));
      text(c, "YAMADA", 500, 740, 96, this.colour("#d9c59e"));
    });
    this.tile("interior",6,6,2,2,c=>{
      fill(c,this.theme.dark);
      const edge=()=>{c.strokeStyle=this.theme.ink;c.lineWidth=5;};
      // Six different merchandise silhouettes, with three consciously arranged shelves.
      const goods=(x,y,type,colour)=>{
        c.fillStyle=colour;edge();
        if(type==='bag') {
          c.beginPath();c.moveTo(x-48,y+15);c.lineTo(x+48,y+15);c.lineTo(x+59,y+192);c.lineTo(x-59,y+192);c.closePath();c.fill();c.stroke();
          c.fillStyle=this.theme.trim;c.fillRect(x-35,y+70,70,62);text(c,'米',x,y+100,48,this.theme.ink);
        } else if(type==='books') {
          for(let i=0;i<4;i++){c.fillStyle=i%2?this.theme.red:this.theme.blue;c.fillRect(x-57+i*3,y+130-i*30,114,27);c.strokeRect(x-57+i*3,y+130-i*30,114,27);c.fillStyle=this.theme.trim;c.fillRect(x-43+i*3,y+136-i*30,92,13);}
        } else if(type==='cup') {
          c.fillRect(x-45,y+75,85,105);c.strokeRect(x-45,y+75,85,105);c.strokeRect(x+42,y+95,28,55);
          c.fillStyle=this.theme.trim;c.beginPath();c.ellipse(x-2,y+75,43,14,0,0,Math.PI*2);c.fill();c.stroke();
        } else if(type==='tissue') {
          c.fillRect(x-62,y+115,124,70);c.strokeRect(x-62,y+115,124,70);c.fillStyle=this.theme.trim;c.beginPath();c.moveTo(x-30,y+120);c.lineTo(x-20,y+65);c.lineTo(x+40,y+90);c.lineTo(x+20,y+127);c.closePath();c.fill();c.stroke();
        } else if(type==='towels') {
          for(let i=0;i<3;i++){c.fillStyle=i%2?this.theme.trim:colour;c.fillRect(x-60,y+135-i*39,120,35);c.strokeRect(x-60,y+135-i*39,120,35);}c.fillStyle=this.theme.paper;c.fillRect(x-11,y+55,22,115);
        } else {
          c.fillRect(x-48,y+35,96,152);c.strokeRect(x-48,y+35,96,152);c.fillStyle=this.theme.trim;c.fillRect(x-35,y+80,70,55);text(c,'雑貨',x,y+109,32,this.theme.ink);
        }
      };
      const rows=[['cup','towels','books','cup','towels','books'],['bag','box','tissue','bag','tissue','box'],['tissue','books','box','towels','bag','cup']];
      const colours=[this.theme.red,this.theme.green,this.theme.yellow,this.theme.blue,this.theme.paper,this.theme.red];
      rows.forEach((row,r)=>{
        row.forEach((type,i)=>goods(95+i*162,65+r*294,type,colours[(i+r)%colours.length]));
        c.fillStyle=this.theme.wood;c.fillRect(20,265+r*294,960,32);edge();c.strokeRect(20,265+r*294,960,32);
        c.fillStyle=this.theme.trim;c.fillRect(20,298+r*294,960,17);
        for(let i=0;i<6;i++){c.fillStyle=this.theme.trim;c.fillRect(66+i*162,271+r*294,60,19);text(c,'¥'+(180+i*40),96+i*162,281+r*294,17,this.theme.ink);}
      });
      text(c,'雑貨と、暮らしの小さな楽しみ。',500,972,32,this.theme.trim);
    });
    this.tile("hours", 1, 5, 1, 1, (c) => {
      fill(c, this.colour("#e6dfc6"));
      border(c, this.colour("#9d4b3e"), 16);
      text(c, "営業中", 500, 320, 220, this.colour("#9d4b3e"));
      text(c, "9:00—20:00", 500, 700, 105, this.colour("#4d5b4d"));
    });
  }
  dispose() {
    this.texture.dispose();
    this.material.dispose();
  }
}
