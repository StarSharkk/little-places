import * as THREE from 'three';
import {createMaterials,themes} from './materials.js';
import {createAtlas} from './Atlas.js';
import {group,box,plate,PavedBase} from './primitives.js';
import {Shell,Roof,Storefront} from './Architecture.js';
import {PastryDisplay} from './Pastries.js';
import {Interior,StreetDetails,PaperBag} from './Details.js';
/** Independent model; no renderer, DOM controls or scene ownership. Units: metres. */
export function createBakery(options={}){
 const config={scale:1,position:[0,0,0],...options};
 const root=new THREE.Group();root.name='Bonjour Bakery';
 const materials=createMaterials(),m=materials,atlas=createAtlas();
 // The collection's illustrated paving: curbstones, joints and a trim course, as at the café.
 PavedBase(root,m,{w:7.45,d:5.67,cx:.15,cz:.5});
 const floor=plate(root,5.9,3.57,.14,.10,m.tile,[0,.20,0]);floor.rotation.x=-Math.PI/2;
 for(const z of [2.00,2.64]){const step=plate(root,1.48,.56,.10,.10,m.cream,[-1.92,.19,z]);step.rotation.x=-Math.PI/2;}
 // Permanent low walls remain as a legible footprint in cutaway mode.
 box(root,5.8,.23,.16,m.cream,[0,.38,-1.7]);for(const x of [-2.82,2.82])box(root,.16,.23,3.4,m.cream,[x,.38,0]);
 const shell=Shell(root,m,atlas),roof=Roof(root,m,atlas),storefront=Storefront(root,m,atlas);
 Interior(root,m,atlas);StreetDetails(root,m,atlas);
 const pastries=PastryDisplay(root,m,atlas);
 const pickup=PaperBag(root,m,atlas,[2.00,1.36,-.15]);
 const pickupHome=pickup.position.clone(),pickupAway=new THREE.Vector3(3.05,.955,2.5);
 root.position.set(...config.position);root.scale.setScalar(config.scale);
 const dynamic=[shell,roof,storefront.door.leaf,storefront.glass,pastries,pickup];
 return {group:root,materials,atlas,config,dynamic,door:storefront.door,shell,roof,pastries,pickup,pickupHome,pickupAway,
  setPalette(index){const palette=themes[index%themes.length];for(const [key,value]of Object.entries(palette))m[key].color.set(value);m.roofLine.color.set(palette.roof).multiplyScalar(.8);},
  setPastries(visible){pastries.visible=visible;},
  setSeeThrough(value){shell.visible=!value;roof.visible=!value;storefront.glass.visible=!value;},
 };
}
