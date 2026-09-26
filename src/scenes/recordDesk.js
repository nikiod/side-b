import { CANON_ASSETS } from '../core/assets.js';
import { cloneTemplate } from '../core/dom.js';
import { TRACK_LIST } from '../data/prologue.js';

export function mountRecordDesk(root, { save, onEnterBooklet, onEnterTrack02, onEnterTrack03 }) {
  const scene = cloneTemplate('tpl-record-desk');
  const caseImg = scene.querySelector('.case-art');
  caseImg.src = CANON_ASSETS.sideBCase;
  caseImg.alt = 'SIDE B';

  const peek = scene.querySelector('.peek-photo');
  peek.src = CANON_ASSETS.firstDatePhoto;
  peek.alt = '';

  const list = scene.querySelector('.track-list');
  const track01Done = Boolean(save?.track01Completed);
  const track02Done = Boolean(save?.track02Completed);
  const track03Done = Boolean(save?.track03Completed);
  const trackTitles = {
    '01': '一天',
    '02': '没有送出去',
    '03': '晚安曲',
  };

  function trackStatus(track) {
    if (track.id === '01' && track01Done) return 'COMPLETED';
    if (track.id === '02' && track02Done) return 'COMPLETED';
    if (track.id === '03' && track03Done) return 'COMPLETED';
    if (track.id === '02' && track01Done) return 'AVAILABLE';
    if (track.id === '03' && track02Done) return 'AVAILABLE';
    if (track.id === '04' && track03Done) return 'AVAILABLE';
    return '';
  }

  function trackLabel(track, status) {
    const title = trackTitles[track.id];
    if (status && title) return `${track.label} ${title}`;
    return track.label;
  }

  TRACK_LIST.forEach((track) => {
    const li = document.createElement('li');
    const status = trackStatus(track);
    li.className = 'track-row';
    if (status) li.classList.add('has-state');
    if (track.id === '01') {
      li.classList.add('is-focus');
      if (save.prologueCompleted || track01Done) li.classList.add('is-unlocked');
    } else if (track.id === '02' && track01Done) {
      li.classList.add('is-unlocked');
    } else if (track.id === '03' && track02Done) {
      li.classList.add('is-unlocked');
    } else if (track.id === '04' && track03Done) {
      li.classList.add('is-unlocked');
    } else {
      li.classList.add('is-locked');
    }

    const num = document.createElement('span');
    num.className = 'track-num';
    num.textContent = trackLabel(track, status);

    const canOpen02 = track.id === '02' && track01Done;
    const canOpen03 = track.id === '03' && track02Done;

    if (canOpen02 || canOpen03) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'track-open';
      btn.append(num);
      if (status) {
        const state = document.createElement('span');
        state.className = 'track-state';
        state.textContent = status;
        btn.append(state);
      }
      btn.addEventListener('click', (event) => {
        event.stopPropagation();
        if (canOpen03) onEnterTrack03?.();
        else onEnterTrack02?.();
      });
      li.append(btn);
    } else {
      li.append(num);
      if (status) {
        const state = document.createElement('span');
        state.className = 'track-state';
        state.textContent = status;
        li.append(state);
      }
    }
    list.append(li);
  });

  const sheet = scene.querySelector('.track-sheet');

  const openCase = () => {
    scene.classList.add('is-open');
    sheet.setAttribute('aria-hidden', 'false');
  };

  if (track01Done) openCase();

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
