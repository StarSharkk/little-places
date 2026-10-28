import * as THREE from 'three';
import { createBakery } from '@bakery';
import { createCafe } from '@sakura';
import { createFlowerShop } from '@flowers';
import { createCafe as createSweets } from '@sweets';
import { createBookstore } from '@books';
import { createPizzeria } from '@pizza';
import { createLaundry } from '@laundry';
import { createTramStation } from '@tram';
import { createPostOffice } from '@post';
import { createBuilding } from '@yamada';
import { finishModel, createIllustrationShadow } from '@grocery-finish';
import { floorShadow } from './shadowFloor.js';

export const colours=[
 {name:'Butter yellow',colour:'#F6C445'}, {name:'Pistachio',colour:'#9AD5B6'},
 {name:'Rose milk',colour:'#EFA8C4'}, {name:'Blue hour',colour:'#91B7EB'},
 {name:'Terracotta',colour:'#EF745F'},
];
// series swatch order (Butter, Pistachio, Rose, Blue, Terracotta) → the dessert shop's own palettes
const SWEETS_PALETTE=[0,2,4,3,1];
export const buildingCatalog=[
 {id:'cafe',number:'01',title:'Sakura Café',native:'桜カフェ',description:'Coffee, croissants & slow mornings.'},
 {id:'grocery',number:'02',title:'Yamada Grocery',native:'山田雑貨店',description:'Everyday goods & tiny capsule treasures.'},
 {id:'bakery',number:'03',title:'Bonjour Bakery',native:'焼きたてパン',description:'Warm bread. A little joy, daily.'},
 {id:'flowers',number:'04',title:'Hanaya Flowers',native:'花屋',description:'Fresh blooms, picked for you.'},
 {id:'sweets',number:'05',title:'Sakura Sweets',native:'桜スイーツ',description:'Cakes, tarts & something sweet.'},
 {id:'books',number:'06',title:'The Little Bookshop',native:'本屋',description:'Stories, shelves & a reading roof.'},
 {id:'pizza',number:'07',title:'Pizza Piccola',native:'ピッツェリア',description:'Wood-fired pizza & good times.'},
 {id:'laundry',number:'08',title:'Bubble Laundry',native:'コインランドリー',description:'A little place for fresh starts.'},
 {id:'post',number:'09',title:'Little Post Office',native:'郵便局',description:'Letters, parcels & little connections.'},
 {id:'tram',number:'10',title:'Sakura Tram Station',native:'さくら町駅',description:'A quiet stop in a charming town.'}
];
const factories={cafe:createCafe,grocery:createBuilding,bakery:createBakery,flowers:createFlowerShop,books:createBookstore,pizza:createPizzeria,laundry:createLaundry,post:createPostOffice,tram:createTramStation,
 sweets:()=>{
 const sweets=createSweets({shop:'sweets',lineWeights:{outer:1.6,mid:1.2,thin:.9,hatch:.75,soft:.8,hull:1.3}});
 sweets.group.position.set(.75,0,-1.1); // centre its street corner on the wrapper
 // same illustrated shadow as the others (createIllustrationShadow: x − 0.6·y, z + 0.27·y, #92A6CF),
 // falling across its sidewalk and continuing past the base onto the page
 sweets.ground.shadowMat.color.set('#92A6CF');
 sweets.updateShadow(.6,1,-.27,1,{layers:[{clip:true,y:.003},{clip:false,y:-.57}]});
 const [sweetsDoor,...sweetsMenus]=sweets.pickables;sweetsDoor.userData.action='sweetsDoor';for(const o of sweetsMenus)o.userData.action='sweetsMenu';

 return sweets;
 }};
export function createCollection({only}={}){
 const definitionsById={
  cafe:()=>{const cafe=factories.cafe();return {id:'cafe',number:'01',title:'Sakura Café',native:'桜カフェ',description:'Coffee, croissants & slow mornings.',model:cafe,dynamic:[cafe.door.leaf,cafe.sign],scale:.96,pivot:2.85,span:13.4,width:12.7,
   labels:[['A little room in the roof',[-1.2,6.8,1.1]],['Fresh coffee, this way',[0,3.2,2.3]],['A seat in the sunshine',[2.2,.8,3.2]]]};},
  grocery:()=>{const grocery=factories.grocery();return {id:'grocery',number:'02',title:'Yamada Grocery',native:'山田雑貨店',description:'Everyday goods & tiny capsule treasures.',model:grocery,dynamic:[grocery.storefront.shutter],scale:.78,pivot:4.2,span:15.7,width:12.7,
   labels:[['A roof full of little details',[.7,8.8,0]],['Everyday things, thoughtfully stocked',[0,1.5,2.2]],['Four little capsule machines',[3.0,1.5,-.6]]]};},
  bakery:()=>{const bakery=factories.bakery();return {id:'bakery',number:'03',title:'Bonjour Bakery',native:'焼きたてパン',description:'Warm bread. A little joy, daily.',model:bakery,dynamic:bakery.dynamic,scale:1.08,pivot:2.10,span:9.9,width:11.6,
   labels:[['Three little rooftop loaves',[.3,5.25,.7],()=>bakery.roof.visible],['Croissant · bagel · milk bread',[.5,1.45,2.1],()=>bakery.pastries.visible],['Your bread to take home',()=>bakery.pickup.position.clone().add(new THREE.Vector3(0,.7,0))],['The morning oven',[-1.68,1.5,-1.1],()=>!bakery.shell.visible]]};},
  flowers:()=>{const flowers=factories.flowers();return {id:'flowers',number:'04',title:'Hanaya Flowers',native:'花屋',description:'Fresh blooms, picked for you.',model:flowers,dynamic:flowers.dynamic,scale:1.0,pivot:2.55,span:10.8,width:11.8,
   labels:flowers.labels};},
  sweets:()=>{const sweets=factories.sweets();return {id:'sweets',number:'05',title:'Sakura Sweets',native:'桜スイーツ',description:'Cakes, tarts & something sweet.',model:sweets,dynamic:sweets.pickables,scale:.74,pivot:3.3,span:15.8,width:15.6,prebaked:true,
   labels:[['A dormer in the roof',[-2.9,8.0,1.7]],['Something sweet, this way',[2.0,4.3,2.1]],['Tables on the terrace',[-2.0,1.0,4.1]]]};},
  books:()=>{const books=factories.books();return {id:'books',number:'06',title:'The Little Bookshop',native:'本屋',description:'Stories, shelves & a reading roof.',model:books,dynamic:books.dynamic,scale:1.0,pivot:2.4,span:10.6,width:12.4,
   labels:books.labels};},
  pizza:()=>{const pizza=factories.pizza();return {id:'pizza',number:'07',title:'Pizza Piccola',native:'ピッツェリア',description:'Wood-fired pizza & good times.',model:pizza,dynamic:pizza.dynamic,scale:1.0,pivot:2.7,span:12.2,width:13.2,
   labels:pizza.labels};},
  laundry:()=>{const laundry=factories.laundry();return {id:'laundry',number:'08',title:'Bubble Laundry',native:'コインランドリー',description:'A little place for fresh starts.',model:laundry,dynamic:laundry.dynamic,scale:1.0,pivot:2.6,span:12.6,width:13.8,
   labels:laundry.labels};},
  post:()=>{const post=factories.post();return {id:'post',number:'09',title:'Little Post Office',native:'郵便局',description:'Letters, parcels & little connections.',model:post,dynamic:post.dynamic,scale:1.0,pivot:3.7,span:15.6,width:14.6,
   labels:post.labels};},
  tram:()=>{const tram=factories.tram();return {id:'tram',number:'10',title:'Sakura Tram Station',native:'さくら町駅',description:'A quiet stop in a charming town.',model:tram,dynamic:tram.dynamic,scale:1.0,pivot:2.85,span:17.5,width:25.0,labels:tram.labels};}
 };
 const definitions=(only?[only]:buildingCatalog.map(d=>d.id)).map(id=>definitionsById[id]());
 for(const item of definitions){
  const wrapper=new THREE.Group();wrapper.name=item.title;wrapper.userData.buildingId=item.id;
  item.model.group.userData.buildingId=item.id;
  if(item.id==='grocery')item.model.storefront.shutter.userData.action='shutter';
  // Both originals stay independently editable. The exhibition adds one shared
  // outline renderer and keeps the door, sign and shutter as separate batches.
  let lines;
  if(item.prebaked){lines=item.model.outlineMaterials;wrapper.add(item.model.group);item.shadowMaterials=[item.model.ground.shadowMat];}
  else{
   const shadow=createIllustrationShadow(item.model.group);
   // a place whose shadow falls on its own wide forecourt lays it on the paving too (drawn before batching, so ground-level parts can be skipped)
   const paving=item.model.shadowFloor?floorShadow(item.model.group,shadow.material,item.model.shadowFloor):null;
   // bakery and flower shop share the same raised paved base
   if(item.id==='bakery'||item.id==='flowers'||item.id==='books'||item.id==='pizza'||item.id==='laundry'||item.id==='post'||item.id==='tram')shadow.position.y=.35;
   lines=finishModel(item.model.group,item.dynamic);
   // round-shape silhouettes (the café's blossom tree) resize with the edge lines
   if(item.model.outlineMaterials)lines.push(...item.model.outlineMaterials);
   wrapper.add(item.model.group,shadow);item.shadowMaterials=[shadow.material];
   if(paving)wrapper.add(paving);

  }
  item.wrapper=wrapper;item.lines=lines;item.colourIndex=item.id==='books'?1:0;item.hoverMaterials=[];
  for(const target of item.dynamic)target.traverse(object=>{
   if(object.isMesh&&object.material.isMeshToonMaterial){const source=object.material;object.material=source.clone();item.hoverMaterials.push({object,source,target});}
  });
  item.setColour=index=>{if(item.id==='grocery')item.model.setTheme(index);else item.model.setPalette(item.id==='sweets'?SWEETS_PALETTE[index]:index);item.colourIndex=index;};
 }
 return Object.fromEntries(definitions.map(item=>[item.id,item]));
}
