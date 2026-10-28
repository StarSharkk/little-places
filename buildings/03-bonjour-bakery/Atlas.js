import * as THREE from 'three';
// One atlas for all lettering; geometry carries the shape, texture carries print.
export function createAtlas(){
 const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=1536;const c=canvas.getContext('2d');
 const cells={brand:[0,0,1536,256],menu:[1536,0,512,640],open:[0,256,512,256],bag:[512,256,512,512],label:[1024,256,512,256],hours:[0,512,512,256],box:[1024,512,512,256],side:[0,768,1024,256],tags:[1024,768,1024,256],
  plinth:[1536,640,512,128],special:[0,1024,512,512],poster:[512,1024,512,512],wallmenu:[1024,1024,768,384],number:[1792,1024,256,128],crate:[1792,1152,256,128],blade:[1024,1408,512,128]};
 const bg='#FFF8E7',ink='#302B26',coral='#BC5845',mint='#5E9D7E',dark=['menu','wallmenu','special'];
 function text(s,x,y,size=42,color=ink,font='Georgia'){c.fillStyle=color;c.font=`${font==='Georgia'?'bold ':''}${size}px ${font}`;c.textAlign='center';c.fillText(s,x,y);}
 function loaf(x,y,s,color='#D99A45'){c.save();c.translate(x,y);c.scale(s,s);c.fillStyle=color;c.strokeStyle=ink;c.lineWidth=6;c.beginPath();c.ellipse(0,0,90,46,0,0,Math.PI*2);c.fill();c.stroke();c.strokeStyle='#FFE3A3';c.lineWidth=9;for(const dx of [-45,-5,35]){c.beginPath();c.moveTo(dx-14,-20);c.lineTo(dx+16,18);c.stroke();}c.restore();}
 for(const [key,[x,y,w,h]]of Object.entries(cells)){c.save();c.translate(x,y);const dk=dark.includes(key);c.fillStyle=dk?'#34413B':key==='crate'?'#C39564':bg;c.fillRect(0,0,w,h);c.strokeStyle=dk?'#E1BE8C':ink;c.lineWidth=3;c.strokeRect(12,12,w-24,h-24);
 if(key==='brand'){
  // The fascia plane is ~12:1 while this cell is 6:1, so lettering is drawn half-width to land undistorted.
  c.save();c.translate(w/2,0);c.scale(.5,1);text('BAKERY',0,168,170,ink);c.restore();
  c.save();c.translate(w*.17,0);c.scale(.5,1);text('Bonjour',0,150,92,coral);c.restore();
  c.save();c.translate(w*.83,0);c.scale(.5,1);text('EST. 1987',0,128,52,mint,'monospace');text('BAKED WITH LOVE',0,186,40,coral,'monospace');c.restore();
 }
 if(key==='menu'){text('Fresh today',w/2,88,49,bg);text('—  BAKED AT 7 AM  —',w/2,140,21,'#E1BE8C','monospace');['Croissant     4','Baguette      5','Milk bread    6','Sesame bagel  3'].forEach((v,i)=>text(v,w/2,240+i*74,28,bg,'monospace'));text('a little joy, daily',w/2,570,27,'#F6C445');}
 if(key==='wallmenu'){text('Bonjour menu',w/2,86,54,bg);[['Croissant','4'],['Pain au chocolat','5'],['Strawberry cake','8'],['Cupcake','3'],['Coffee','4']].forEach(([n,p],i)=>{c.textAlign='left';c.fillStyle=bg;c.font='26px monospace';c.fillText(n,70,150+i*46);c.textAlign='right';c.fillText(p,w-70,150+i*46);});}
 if(key==='special'){text('TODAY’S',w/2,96,52,'#F6C445');text('SPECIAL',w/2,156,60,bg);loaf(w/2,270,1.25);text('Strawberry',w/2,384,40,bg);text('shortcake  8',w/2,436,36,'#EFA8C4','monospace');}
 if(key==='poster'){c.fillStyle='#F6E2B0';c.fillRect(24,24,w-48,h-48);loaf(w/2,200,1.7);text('fresh',w/2,340,70,coral);text('BREAD',w/2,420,78,ink);text('every morning',w/2,468,26,mint,'monospace');}
 if(key==='open'){text('OPEN',w/2,145,91,coral);text('come on in',w/2,204,29);}
 if(key==='bag'){text('b.',w/2,240,183,coral);text('BONJOUR',w/2,330,47);text('MADE WITH LOVE',w/2,392,24,coral,'monospace');}
 if(key==='label'){text('FRESHLY BAKED',w/2,105,44,coral);text('small batches · every day',w/2,179,25,ink,'monospace');}
 if(key==='hours'){text('7:00 — 17:00',w/2,119,53);text('your daily bread',w/2,182,28,coral);}
 if(key==='box'){text('BONJOUR',w/2,108,53);text('a box of happy things',w/2,175,28,coral);}
 if(key==='side'){text('BREAD & BUTTER',w/2,118,70);text('a little corner of happiness',w/2,193,33,coral);}
 if(key==='tags'){['CROISSANT','BAGEL','DONUT','CUPCAKE'].forEach((v,i)=>{text(v,128+i*256,112,24);text(['4.00','3.00','2.50','3.00'][i],128+i*256,174,30,coral);});}
 if(key==='plinth'){c.fillStyle='#FFF8E7';c.fillRect(0,0,w,h);if('letterSpacing' in c)c.letterSpacing='18px';text('BAKERY',w/2+9,94,78,ink);if('letterSpacing' in c)c.letterSpacing='0px';}
 if(key==='number'){text('Nº 7',w/2,88,64,ink);}
 if(key==='crate'){text('BONJOUR',w/2,82,44,'#5A3F28');}
 if(key==='blade'){loaf(90,64,.5);text('PAIN',w/2+40,84,58,ink);}
 c.restore();}
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
 const material=new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide});
 function attach(parent,key,w,h,pos=[0,0,0],turn=0){const [x,y,cw,ch]=cells[key];const geo=new THREE.PlaneGeometry(w,h),uv=geo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,(x+uv.getX(i)*cw)/canvas.width,1-(y+(1-uv.getY(i))*ch)/canvas.height);const o=new THREE.Mesh(geo,material);o.position.set(...pos);o.rotation.y=turn;parent.add(o);return o;}
 return {texture,material,attach,canvas};
}
