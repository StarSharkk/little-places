import * as THREE from 'three';
import { createBakery } from './bakery/Bakery.js';
import { createCafe } from '@sakura';
import { createFlowerShop } from '@flowers';
import { createCafe as createSweets } from '@sweets';
import { createBuilding } from '@yamada';
import { finishModel, createIllustrationShadow } from '@grocery-finish';

export const colours=[
 {name:'Butter yellow',colour:'#F6C445'}, {name:'Pistachio',colour:'#9AD5B6'},
 {name:'Rose milk',colour:'#EFA8C4'}, {name:'Blue hour',colour:'#91B7EB'},
 {name:'Terracotta',colour:'#EF745F'},
];
export function createCollection(){
 const cafe=createCafe();
 const grocery=createBuilding();
 const bakery=createBakery();
 const flowers=createFlowerShop();
 // The dessert shop arrives already batched and outlined by its own kit; thinner house lines match the series.
 const sweets=createSweets({shop:'sweets',lineWeights:{outer:1.6,mid:1.2,thin:.9,hatch:.75,soft:.8,hull:1.3}});
 sweets.group.position.set(.75,0,-1.1); // centre its street corner on the wrapper
 sweets.updateShadow(-.206,.824,.549); // the scene's fixed light, so its ground shadow sits like the others'
 const [sweetsDoor,...sweetsMenus]=sweets.pickables;sweetsDoor.userData.action='sweetsDoor';for(const o of sweetsMenus)o.userData.action='sweetsMenu';
 const definitions=[
  {id:'cafe',number:'01',title:'Sakura Café',native:'桜カフェ',description:'Coffee, croissants & slow mornings.',model:cafe,dynamic:[cafe.door.leaf,cafe.sign],scale:.96,pivot:2.85,span:13.4,width:12.7,
   labels:[['A little room in the roof',[-1.2,6.8,1.1]],['Fresh coffee, this way',[0,3.2,2.3]],['A seat in the sunshine',[2.2,.8,3.2]]]},
  {id:'grocery',number:'02',title:'Yamada Grocery',native:'山田雑貨店',description:'Everyday goods & tiny capsule treasures.',model:grocery,dynamic:[grocery.storefront.shutter],scale:.78,pivot:4.2,span:15.7,width:12.7,
   labels:[['A roof full of little details',[.7,8.8,0]],['Everyday things, thoughtfully stocked',[0,1.5,2.2]],['Four little capsule machines',[3.0,1.5,-.6]]]},
  {id:'bakery',number:'03',title:'Bonjour Bakery',native:'焼きたてパン',description:'Warm bread. A little joy, daily.',model:bakery,dynamic:bakery.dynamic,scale:1.08,pivot:2.10,span:9.9,width:11.6,
   labels:[['A little louvred lantern',[0,5.2,0],()=>bakery.roof.visible],['Croissant · bagel · milk bread',[.5,1.45,2.1],()=>bakery.pastries.visible],['Your bread to take home',()=>bakery.pickup.position.clone().add(new THREE.Vector3(0,.7,0))],['The morning oven',[-1.68,1.5,-1.1],()=>!bakery.shell.visible]]},
  {id:'flowers',number:'04',title:'Hanaya Flowers',native:'花屋',description:'Fresh blooms, picked for you.',model:flowers,dynamic:flowers.dynamic,scale:1.0,pivot:2.55,span:10.8,width:11.8,
   labels:flowers.labels},
  {id:'sweets',number:'05',title:'Sakura Sweets',native:'桜スイーツ',description:'Cakes, tarts & something sweet.',model:sweets,dynamic:sweets.pickables,scale:.6,pivot:2.9,span:15,width:15.6,prebaked:true,
   labels:[['A dormer in the roof',[-2.9,8.0,1.7]],['Something sweet, this way',[2.0,4.3,2.1]],['Tables on the terrace',[-2.0,1.0,4.1]]]},
 ];
 for(const item of definitions){
  const wrapper=new THREE.Group();wrapper.name=item.title;wrapper.userData.buildingId=item.id;
  item.model.group.userData.buildingId=item.id;
  if(item.id==='grocery')item.model.storefront.shutter.userData.action='shutter';
  // Both originals stay independently editable. The exhibition adds one shared
  // outline renderer and keeps the door, sign and shutter as separate batches.
  let lines;
  if(item.prebaked){lines=item.model.outlineMaterials;wrapper.add(item.model.group);}
  else{
   const shadow=createIllustrationShadow(item.model.group);
   // bakery and flower shop share the same raised paved base
   if(item.id==='bakery'||item.id==='flowers')shadow.position.y=.35;
   lines=finishModel(item.model.group,item.dynamic);
   wrapper.add(item.model.group,shadow);
  }
  item.wrapper=wrapper;item.lines=lines;item.colourIndex=0;item.hoverMaterials=[];
  for(const target of item.dynamic)target.traverse(object=>{
   if(object.isMesh&&object.material.isMeshToonMaterial){const source=object.material;object.material=source.clone();item.hoverMaterials.push({object,source,target});}
  });
  item.setColour=index=>{if(item.id==='cafe')cafe.setPalette(index);else if(item.id==='grocery')grocery.setTheme(index);else if(item.id==='flowers')flowers.setPalette(index);else if(item.id==='sweets')sweets.setPalette(index);else bakery.setPalette(index);item.colourIndex=index;};
 }
 return Object.fromEntries(definitions.map(item=>[item.id,item]));
}
