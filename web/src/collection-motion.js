// A ring of the existing objects, not copies. Positions wrap only beyond the
// viewport plus the largest complete footprint (including the ink shadow).
export const COLLECTION_MOTION={pixelsPerSecond:24,radiansPerSecond:.045,resumeRate:4,navigationRate:8,dragRadiansPerPixel:.008,rotationRest:2,edgeMargin:1};
const mod=(v,n)=>((v%n)+n)%n;
export function createCollectionMotion(ids,config=COLLECTION_MOTION){
 const state={cruising:true,hovered:false,touching:false,offset:0,speed:config.pixelsPerSecond,target:null,cycles:0,held:null};
 const angles=Object.fromEntries(ids.map(id=>[id,0])),rest=Object.fromEntries(ids.map(id=>[id,0]));
 let centres=[],period=1,initialShift=0,halfWidth=10,extent=10,unitsPerPixel=1;
 const position=(i,offset=state.offset)=>{const start=-halfWidth-extent-config.edgeMargin;return mod(centres[i]+initialShift-offset-start,period)+start;};
 const api={state,angles,config,get period(){return period;},get unitsPerPixel(){return unitsPerPixel;},
  configure({centres:c,period:p,shift,halfWidth:w,extent:r,unitsPerPixel:u}){centres=c;period=p;initialShift=shift;halfWidth=w;extent=r;unitsPerPixel=u;},
  reset(reduced=false){state.offset=0;state.target=null;state.cruising=!reduced;state.hovered=false;state.touching=false;state.held=null;state.speed=reduced?0:config.pixelsPerSecond;state.cycles=0;},
  setCruising(on){state.cruising=on;if(!on)state.speed=0;else state.target=null;},
  hover(on){state.hovered=on;if(on)state.speed=0;},
  hold(id){state.held=id;state.target=null;state.speed=0;},
  release(){if(state.held)for(const k of ids)rest[k]=config.rotationRest;state.held=null;state.touching=false;},
  // dragging any one place turns the whole collection together, so the ring keeps one shared angle
  dragRotation(id,pixels){for(const k of ids){angles[k]+=pixels*config.dragRadiansPerPixel;rest[k]=config.rotationRest;}},
  scrub(pixels){state.offset-=pixels*unitsPerPixel;state.target=null;state.cruising=false;state.speed=0;},
  pause(){state.cruising=false;state.speed=0;state.target=null;},
  focus(id){const i=ids.indexOf(id);if(i<0)return;state.cruising=false;state.speed=0;state.target=state.offset+position(i);},
  navigate(direction){const origin=state.target??state.offset;const candidates=ids.map((id,i)=>({id,x:position(i,origin)}));
   for(const c of candidates){if(direction>0&&c.x<.01)c.x+=period;if(direction<0&&c.x>-.01)c.x-=period;}
   const next=candidates.sort((a,b)=>direction>0?a.x-b.x:b.x-a.x)[0];state.cruising=false;state.speed=0;state.target=origin+next.x;return next.id;
  },
  position(id){return position(ids.indexOf(id));},
  step(dt,{reduced=false,rotate=false,blocked=false}={}){
   let moving=false;
   if(state.target!==null&&!state.held&&!state.touching){const difference=state.target-state.offset;if(reduced||Math.abs(difference)<.001){state.offset=state.target;state.target=null;}else state.offset=state.target-difference*Math.exp(-config.navigationRate*dt);moving=true;}
   else if(!reduced&&state.cruising&&!state.hovered&&!state.touching&&!state.held&&!blocked){
    const goal=config.pixelsPerSecond,e=Math.exp(-config.resumeRate*dt),distance=goal*dt+(state.speed-goal)*(1-e)/config.resumeRate;
    state.speed=goal+(state.speed-goal)*e;state.offset+=distance*unitsPerPixel;moving=true;
   }
   if(rotate&&!reduced)for(const id of ids){if(state.held)continue;if(rest[id]>0){rest[id]=Math.max(0,rest[id]-dt);continue;}angles[id]=mod(angles[id]+config.radiansPerSecond*dt,Math.PI*2);moving=true;}
   // Rebase the scalar phase, not a visible object's transform, after whole laps.
   if(Math.abs(state.offset)>period){const laps=Math.trunc(state.offset/period);state.offset-=laps*period;if(state.target!==null)state.target-=laps*period;state.cycles+=laps;}
   return moving;
  },
 };
 return api;
}
