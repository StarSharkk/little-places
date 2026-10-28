import './cta.css';
import './fit.css';
import './zili-label.js';
// "Explore a place" scrolls down to the explorer (the showcase below the collection) without touching the hash, which
// the collection and the explorer both route on. Arriving from another page as /#explorer lands there once it exists.
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const toExplorer = () => document.getElementById('explorer')?.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'start' });
document.getElementById('explore-link')?.addEventListener('click', (event) => { event.preventDefault(); toExplorer(); });
if (location.hash === '#explorer') {
  history.replaceState(null, '', location.pathname + location.search);
  const wait = (tries = 0) => (document.getElementById('explorer') ? requestAnimationFrame(toExplorer) : tries < 100 && setTimeout(() => wait(tries + 1), 50));
  wait();
}
