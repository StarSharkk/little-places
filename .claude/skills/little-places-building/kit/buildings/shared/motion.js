import * as THREE from 'three';
// Small motion helpers shared by the buildings. Models stay passive: the page calls model.animate(dt, time) every
// frame while the place is on screen, and the model returns true while it needs further frames.

// A track through 3D points (trams, letters, conveyor belts). place(object, u) puts the object at 0 ≤ u ≤ 1 along
// it (evenly by distance) and turns it to face along the track.
export function track(points, { closed = false } = {}) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)), closed, 'centripetal');
  const tangent = new THREE.Vector3();
  return {
    curve, length: curve.getLength(),
    place(object, u) {
      const t = curve.getUtoTmapping(closed ? ((u % 1) + 1) % 1 : THREE.MathUtils.clamp(u, 0, 1));
      curve.getPoint(t, object.position); curve.getTangent(t, tangent);
      object.rotation.y = Math.atan2(tangent.x, tangent.z);
      return object;
    },
  };
}

// Back-and-forth timetable: wait `dwell` s, ease out along the route in `travel` s, wait, ease back. Returns 0…1.
export function shuttle(time, { travel = 6, dwell = 2 } = {}) {
  const leg = travel + dwell, t = time % (2 * leg), back = t >= leg, k = THREE.MathUtils.clamp(((back ? t - leg : t) - dwell) / travel, 0, 1);
  const e = k * k * (3 - 2 * k);
  return back ? 1 - e : e;
}

// A constant spin (laundry drums, fans, wheels): call in animate with the elapsed time.
export const spin = (object, time, turnsPerSecond, axis = 'z') => { object.rotation[axis] = time * turnsPerSecond * Math.PI * 2; };

// A one-shot sequence over `duration` seconds, advanced by deltaTime from the model's animate(). pose(t) places the
// parts at time t; the resting pose is pose(duration), so the sequence can run again from the same state.
// start(true) (reduced motion) jumps straight to the resting pose.
export function timeline(duration, pose) {
  let t = -1; pose(duration);
  return {
    get running() { return t >= 0; },
    start(instant = false) { if (t >= 0) return; if (instant) { pose(duration); return; } t = 0; pose(0); },
    step(dt) { if (t < 0) return false; t += dt; if (t >= duration) { t = -1; pose(duration); return false; } pose(t); return true; },
  };
}
export const ease = (k) => { k = Math.min(1, Math.max(0, k)); return k * k * (3 - 2 * k); };
