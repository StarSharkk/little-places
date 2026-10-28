// The zili design label "boils" like a hand-drawn animation: its wobble and grain noise get a new seed a few
// times a second. Still under reduced motion; paused while the tab is hidden.
const turbulences = [...document.querySelectorAll('.zili-label feTurbulence[data-boil]')];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const SEEDS = [5, 11, 17, 23], FRAME_MS = 140;
let frame = 0, last = 0;
function boil(now) {
  requestAnimationFrame(boil);
  if (reducedMotion.matches || document.hidden || now - last < FRAME_MS || !turbulences[0].closest('svg').getClientRects().length) return;   // hidden on narrow phones
  last = now; frame = (frame + 1) % SEEDS.length;
  turbulences.forEach((t, i) => t.setAttribute('seed', String(SEEDS[(frame + i * 2) % SEEDS.length] + i * 3)));
}
if (turbulences.length) requestAnimationFrame(boil);
