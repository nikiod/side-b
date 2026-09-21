import { CANON_ASSETS } from '../core/assets.js';
import { cloneTemplate } from '../core/dom.js';
import { TRACK_LIST } from '../data/prologue.js';

export function mountRecordDesk(root, { save, onEnterBooklet }) {
  const scene = cloneTemplate('tpl-record-desk');
  const cdImgs = scene.querySelectorAll('.cd-art');
  cdImgs.forEach((img) => {
    img.src = CANON_ASSETS.cd;
    img.alt = 'SIDE B';
  });

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

  const openCd = () => {
    scene.classList.add('is-open');
  };

  scene.querySelector('.cd-hit').addEventListener('click', openCd);
  scene.querySelector('.closed-booklet').addEventListener('click', () => {
    if (scene.classList.contains('is-open')) onEnterBooklet();
    else openCd();
  });
  scene.querySelector('.booklet-enter').addEventListener('click', () => {
    onEnterBooklet();
  });

  root.replaceChildren(scene);
  return scene;
}
