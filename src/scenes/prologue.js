import { CANON_ASSETS } from '../core/assets.js';
import { cloneTemplate } from '../core/dom.js';
import { BOOKLET_LINES } from '../data/prologue.js';

export function mountPrologue(root, { onPolaroidClick }) {
  const scene = cloneTemplate('tpl-prologue');
  const notes = scene.querySelector('.notes-body');
  BOOKLET_LINES.forEach((line) => {
    const p = document.createElement('p');
    p.className = line ? 'notes-line' : 'notes-gap';
    p.textContent = line;
    notes.append(p);
  });

  const photo = scene.querySelector('.polaroid-photo');
  photo.src = CANON_ASSETS.firstDatePhoto;
  photo.alt = '';

  const spread = scene.querySelector('.booklet-spread');
  const notesPage = scene.querySelector('.page-notes');
  const photoPage = scene.querySelector('.page-photo');
  const polaroidHit = scene.querySelector('.polaroid-hit');

  scene.querySelector('.page-turn').addEventListener('click', () => {
    if (spread.dataset.page !== '0') return;
    spread.dataset.page = '1';
    scene.classList.add('is-photo');
    notesPage.classList.add('is-leaving');
    requestAnimationFrame(() => {
      photoPage.classList.add('is-in');
      requestAnimationFrame(() => {
        polaroidHit.classList.add('is-revealed');
      });
    });
  });

  const slot = scene.querySelector('.polaroid-slot');
  slot.addEventListener('transitionend', (event) => {
    if (event.propertyName === 'transform') {
      polaroidHit.classList.add('is-settled');
    }
  });

  polaroidHit.addEventListener('click', () => {
    if (!polaroidHit.classList.contains('is-revealed')) return;
    onPolaroidClick();
  });

  root.replaceChildren(scene);
  return scene;
}
