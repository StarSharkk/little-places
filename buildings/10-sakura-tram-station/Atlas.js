import * as THREE from 'three';

/** One padded original atlas; lettering, clock, posters and products share one texture. */
export function createAtlas(){
 const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=1536;
 const c=canvas.getContext('2d'),cells={sign:[0,0,1024,256],route:[1024,0,512,128],clock:[1536,0,512,512],timetable:[0,256,512,640],map:[512,256,512,640],drinks:[1024,128,512,640],ticket:[1536,512,512,256],poster:[1024,768,512,512],vertical:[0,896,256,640],machine:[256,896,512,512],number:[768,896,256,256]};
 const text=(s,x,y,size,col='#352F2A',font='sans-serif')=>{c.fillStyle=col;c.font=`600 ${size}px ${font}`;c.textAlign='center';c.fillText(s,x,y);};
 for(const [key,[x,y,w,h]] of Object.entries(cells)){
  c.save();c.translate(x,y);c.fillStyle='#F6EDD7';c.fillRect(0,0,w,h);
  c.strokeStyle='#527565';c.lineWidth=8;c.strokeRect(10,10,w-20,h-20);
  if(key==='sign'){text('さくら町駅',w/2,125,100);text('SAKURA TRAM STATION',w/2,205,42);}
  if(key==='route'){c.fillStyle='#355F50';c.fillRect(0,0,w,h);text('さくら町',w/2,90,75,'#F6EDD7');}
  if(key==='clock'){
   c.fillStyle='#F6EDD7';c.fillRect(0,0,w,h);c.strokeStyle='#735743';c.lineWidth=16;c.beginPath();c.arc(256,256,230,0,Math.PI*2);c.stroke();
   for(let i=0;i<12;i++){const a=i/12*Math.PI*2;c.beginPath();c.moveTo(256+Math.sin(a)*185,256-Math.cos(a)*185);c.lineTo(256+Math.sin(a)*211,256-Math.cos(a)*211);c.lineWidth=i%3?6:11;c.stroke();}
   c.lineCap='round';c.lineWidth=13;c.beginPath();c.moveTo(256,256);c.lineTo(189,159);c.moveTo(256,256);c.lineTo(342,182);c.stroke();text('SAKURA',256,355,26);
  }
  if(key==='timetable'){
   text('時刻表',w/2,80,52);text('WEEKDAY · PLATFORM 1',w/2,124,22);
   ['07   05  20  35  50','08   00  15  30  45','09   10  30  50','10   10  30  50','11   10  30  50','12   00  20  40','13   00  20  40','14   10  30  50','15   00  15  30'].forEach((s,i)=>text(s,w/2,190+i*44,26,'#416F60','monospace'));
   text('Please wait behind the yellow line',w/2,600,21);
  }
  if(key==='map'){
   text('まちの案内',w/2,75,45);c.fillStyle='#CFE0CB';c.fillRect(35,110,442,390);
   c.strokeStyle='#FBF5E8';c.lineWidth=32;for(let i=0;i<4;i++){c.beginPath();c.moveTo(60+i*110,120);c.lineTo(110+i*90,485);c.stroke();}for(let i=0;i<3;i++){c.beginPath();c.moveTo(40,180+i*120);c.lineTo(470,130+i*130);c.stroke();}
   c.strokeStyle='#D97755';c.lineWidth=9;c.beginPath();c.moveTo(50,430);c.bezierCurveTo(300,400,160,200,450,180);c.stroke();for(const [a,b]of[[90,420],[250,325],[410,190]]){c.fillStyle='#416F60';c.beginPath();c.arc(a,b,15,0,7);c.fill();}text('YOU ARE HERE · SAKURA',w/2,560,25);text('A little journey starts here.',w/2,603,23);
  }
  if(key==='drinks'){
   c.fillStyle='#E2765F';c.fillRect(0,0,w,h);text('DRINKS',w/2,60,46,'#F6EDD7');
   c.fillStyle='#E7EEE3';c.fillRect(32,92,w-64,420);
   for(let row=0;row<4;row++)for(let col=0;col<5;col++){const a=65+col*94,b=125+row*96;c.fillStyle=['#E9B756','#8BBBA7','#D77C68','#94B9D8','#F3E3BD'][(row+col)%5];c.fillRect(a,b,42,63);c.fillStyle='#F6EDD7';c.fillRect(a+2,b+23,38,19);c.fillStyle='#527565';c.fillRect(a+4,b+69,34,6);}
   text('COLD · ¥150',w/2,572,36,'#F6EDD7');
  }
  if(key==='ticket'){text('さくら町 → 小さな旅',w/2,85,35);text('SAKURA LINE  ·  ¥180',w/2,146,32);text('10 / ONE LITTLE JOURNEY',w/2,205,22);}
  if(key==='poster'){c.fillStyle='#A7C5B4';c.fillRect(20,20,w-40,h-40);text('桜まつり',w/2,90,52);c.fillStyle='#F2A9BF';for(let i=0;i<8;i++){c.beginPath();c.arc(150+(i%3)*80,180+Math.floor(i/3)*70,60,0,7);c.fill();}text('SPRING IN SAKURA',w/2,420,34);text('Take the scenic route',w/2,470,26);}
  if(key==='vertical'){for(const[i,s]of[...'さくら町駅'].entries())text(s,w/2,112+i*94,72);}
  if(key==='machine'){text('きっぷ',w/2,90,68);text('TICKETS',w/2,155,38);c.fillStyle='#416F60';c.fillRect(45,190,w-90,170);text('¥180  /  ¥300',w/2,265,42,'#FFF4D8');text('Single   Day pass',w/2,320,28,'#FFF4D8');text('Touch to begin',w/2,430,32);}
  if(key==='number'){c.fillStyle='#568875';c.fillRect(0,0,w,h);text('709',w/2,180,110,'#F6EDD7');}
  c.restore();
 }
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
 const material=new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide});
 function attach(parent,key,w,h,pos=[0,0,0],turn=0){
  const [x,y,cw,ch]=cells[key],geo=new THREE.PlaneGeometry(w,h),uv=geo.attributes.uv;
  for(let i=0;i<uv.count;i++)uv.setXY(i,(x+2+uv.getX(i)*(cw-4))/2048,1-(y+2+(1-uv.getY(i))*(ch-4))/1536);
  const o=new THREE.Mesh(geo,material);o.position.set(...pos);o.rotation.y=turn;o.userData.outline=false;parent.add(o);return o;
 }
 return {attach,texture,material,canvas};
}
