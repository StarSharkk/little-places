import * as THREE from 'three';
import { createCafe } from '@sakura';
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
 const definitions=[
  {id:'cafe',number:'01',title:'Sakura Café',native:'桜カフェ',description:'Coffee, croissants & slow mornings.',model:cafe,dynamic:[cafe.door.leaf,cafe.sign],scale:.96,pivot:2.85,span:13.4,width:12.7,
   labels:[['A little room in the roof',[-1.2,6.8,1.1]],['Fresh coffee, this way',[0,3.2,2.3]],['A seat in the sunshine',[2.2,.8,3.2]]]},
  {id:'grocery',number:'02',title:'Yamada Grocery',native:'山田雑貨店',description:'Everyday goods & tiny capsule treasures.',model:grocery,dynamic:[grocery.storefront.shutter],scale:.78,pivot:4.2,span:15.7,width:12.7,
   labels:[['A roof full of little details',[.7,8.8,0]],['Everyday things, thoughtfully stocked',[0,1.5,2.2]],['Four little capsule machines',[3.0,1.5,-.6]]]},
 ];
 for(const item of definitions){
  const wrapper=new THREE.Group();wrapper.name=item.title;wrapper.userData.buildingId=item.id;
  item.model.group.userData.buildingId=item.id;
  if(item.id==='grocery')item.model.storefront.shutter.userData.action='shutter';
  // Both originals stay independently editable. The exhibition adds one shared
  // outline renderer and keeps the door, sign and shutter as separate batches.
  const shadow=createIllustrationShadow(item.model.group);
  const lines=finishModel(item.model.group,item.dynamic);
  wrapper.add(item.model.group,shadow);
  item.wrapper=wrapper;item.lines=lines;item.colourIndex=0;item.hoverMaterials=[];
  for(const target of item.dynamic)target.traverse(object=>{
   if(object.isMesh&&object.material.isMeshToonMaterial){const source=object.material;object.material=source.clone();item.hoverMaterials.push({object,source,target});}
  });
  item.setColour=index=>{if(item.id==='cafe')cafe.setPalette(index);else grocery.setTheme(index);item.colourIndex=index;};
 }
 return Object.fromEntries(definitions.map(item=>[item.id,item]));
}
