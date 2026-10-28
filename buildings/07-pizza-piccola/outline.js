import * as THREE from 'three';
import {mergeVertices} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
// Ink silhouette for rounded forms (same technique as the café and dessert-shop trees): a back-facing copy
// pushed outwards by a constant number of pixels. `resolution` mirrors LineMaterial so the collection's resize
// loop updates it with the edge lines.
export function createHullMaterial(width=1.5,color='#3B2B22'){
 const resolution=new THREE.Vector2(1440,900);
 const material=new THREE.ShaderMaterial({side:THREE.BackSide,
  uniforms:{uRes:{value:resolution},uWidth:{value:width},uColor:{value:new THREE.Color(color)}},
  vertexShader:`uniform vec2 uRes;uniform float uWidth;
   void main(){vec4 clip=projectionMatrix*modelViewMatrix*vec4(position,1.0);vec3 vn=normalize(normalMatrix*normal);
   vec2 d=(projectionMatrix*vec4(vn,0.0)).xy*uRes*.5;d=length(d)>1e-5?normalize(d):vec2(0.0);
   clip.xy+=d*(2.0*uWidth)/uRes*clip.w;gl_Position=clip;}`,
  fragmentShader:`uniform vec3 uColor;void main(){gl_FragColor=vec4(uColor,1.0);}`});
 material.resolution=resolution;return material;
}
// Hull twin of a mesh. Extruded shapes have split normals at their caps; welding first gives one smooth normal
// per corner so the pushed-out silhouette has no cracks.
export function hull(mesh,material){
 const g=mesh.geometry.clone();g.deleteAttribute('normal');g.deleteAttribute('uv');
 const welded=mergeVertices(g,1e-4);welded.computeVertexNormals();g.dispose();
 const twin=new THREE.Mesh(welded,material);twin.position.copy(mesh.position);twin.quaternion.copy(mesh.quaternion);twin.scale.copy(mesh.scale);
 twin.userData.outline=false;mesh.parent.add(twin);return twin;
}
