import { cloneTemplate } from '../core/dom.js';

export function mountTrackIntro(root, { track = '01', title = '一天', onComplete } = {}) {
  const scene = cloneTemplate('tpl-track-intro');
  const kicker = scene.querySelector('.intro-kicker');
  const heading = scene.querySelector('.intro-title');
  kicker.textContent = `TRACK ${String(track).padStart(2, '0')}`;
  heading.textContent = title;
  root.replaceChildren(scene);
  requestAnimationFrame(() => {
    scene.classList.add('is-visible');
  });

  if (onComplete) {
    window.setTimeout(() => {
      scene.classList.remove('is-visible');
      window.setTimeout(onComplete, 820);
    }, 2200);
  }

  return scene;
}
