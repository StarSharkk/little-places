import { group, box, cyl, sphere } from './primitives.js';

// Everyday goods use short, broad silhouettes, rather than re-labelled bottles.
export function Packet(parent, m, atlas, pos, {colour=m.yellow, scale=1}={}) {
  const g=group(parent,pos,0,'Packaged groceries');g.scale.setScalar(scale);
  box(g,.16,.25,.105,colour,[0,.125,0]);
  box(g,.17,.024,.115,m.paper,[0,.254,0]);
  atlas.attach(g,'merchLabel',.132,.12,[0,.13,.058]);
  return g;
}
export function NotebookStack(parent,m,pos,scale=1) {
  const g=group(parent,pos,0,'Notebooks and stationery');g.scale.setScalar(scale);
  for(let i=0;i<3;i++) {
    box(g,.25,.035,.17,i===1?m.green:m.blue,[i*.012,i*.04+.018,0]);
    box(g,.205,.018,.173,m.paper,[i*.012+.012,i*.04+.018,.002],false);
    box(g,.025,.038,.174,m.red,[-.11+i*.012,i*.04+.018,0],false);
  }
  return g;
}
export function Cup(parent,m,pos,colour=m.green) {
  const g=group(parent,pos,0,'Ceramic cup');
  cyl(g,.073,.058,.125,colour,[0,.064,0],12);
  cyl(g,.063,.063,.006,m.paper,[0,.13,0],12,false);
  cyl(g,.048,.048,.007,m.dark,[0,.133,0],12,false);
  // Handle kept readable at miniature scale.
  box(g,.05,.07,.025,colour,[.081,.07,0]);box(g,.025,.033,.028,m.paper,[.085,.072,.002],false);
  return g;
}
export function FruitCrateContents(parent,m) {
  for(const x of [-.2,0,.2])for(const z of [-.105,.105]) {
    sphere(parent,.078,m.yellow,[x,.315,z]);
    const leaf=box(parent,.047,.012,.023,m.leaf,[x+.02,.388,z],false);leaf.rotation.y=.5;
  }
}
