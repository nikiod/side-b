import { cloneTemplate } from '../core/dom.js';

export function mountTrackIntro(root) {
  const scene = cloneTemplate('tpl-track-intro');
  root.replaceChildren(scene);
  requestAnimationFrame(() => {
    scene.classList.add('is-visible');
  });
  return scene;
}
