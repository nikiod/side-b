import { CANON_ASSETS } from '../core/assets.js';
import { cloneTemplate } from '../core/dom.js';
import { TRACK_LIST } from '../data/prologue.js';

export function mountRecordDesk(root, { save, onEnterBooklet }) {
  const scene = cloneTemplate('tpl-record-desk');
  const caseImg = scene.querySelector('.case-art');
  caseImg.src = CANON_ASSETS.sideBCase;
  caseImg.alt = 'SIDE B';

  const peek = scene.querySelector('.peek-photo');
  peek.src = CANON_ASSETS.firstDatePhoto;
  peek.alt = '';

  const list = scene.querySelector('.track-list');
  TRACK_LIST.forEach((track) => {
    const li = document.createElement('li');
    li.className = 'track-row';
    if (track.id === '01') {
      li.classList.add('is-focus');
      if (save.prologueCompleted) li.classList.add('is-unlocked');
    } else {
      li.classList.add('is-locked');
    }
    li.innerHTML = `<span class="track-num">${track.label}</span>`;
    list.append(li);
  });

  const sheet = scene.querySelector('.track-sheet');

  const openCase = () => {
    scene.classList.add('is-open');
    sheet.setAttribute('aria-hidden', 'false');
  };

  scene.querySelector('.case-hit').addEventListener('click', openCase);
  scene.querySelector('.booklet-cover-hit').addEventListener('click', () => {
    if (scene.classList.contains('is-open')) onEnterBooklet();
    else openCase();
  });
  scene.querySelector('.booklet-enter').addEventListener('click', () => {
    onEnterBooklet();
  });

  root.replaceChildren(scene);
  return scene;
}
