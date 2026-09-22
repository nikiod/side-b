import { cloneTemplate } from '../core/dom.js';

export function mountTrackIntro(root, { onComplete } = {}) {
  const scene = cloneTemplate('tpl-track-intro');
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
