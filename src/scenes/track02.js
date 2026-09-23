import { CANON_ASSETS } from '../core/assets.js';
import { cloneTemplate } from '../core/dom.js';
import {
  JAZZ_CD_LINES,
  NOW_LIKE_THIS,
  SPARSE_CODA,
  SPARSE_SCRAPS,
} from '../data/track02.js';

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function lineMarkup(line) {
  if (typeof line === 'string') return `<span class="sparse-text">${line}</span>`;
  return `<span class="sparse-who">${line.speaker}</span><span class="sparse-text">${line.text}</span>`;
}

const MARKS = ['02.A', '02.B', '02.C', '02.D'];
const REACH = ['22%', '44%', '66%', '90%'];
const PLACE = [
  { side: 'above', tilt: '-1.1deg', stem: '22px' },
  { side: 'below', tilt: '0.7deg', stem: '16px' },
  { side: 'above', tilt: '-0.45deg', stem: '30px' },
  { side: 'below', tilt: '1.05deg', stem: '12px' },
];

export function mountTrack02(root, { onComplete } = {}) {
  const scene = cloneTemplate('tpl-track-02');
  const pile = scene.querySelector('.sparse-scraps');
  const rail = scene.querySelector('.sparse-rail');
  const coda = scene.querySelector('.sparse-coda');
  const nowBox = scene.querySelector('.now-like-this');
  const jazz = scene.querySelector('.jazz-cd');
  const jazzHit = scene.querySelector('.jazz-cd-hit');
  const jazzArt = scene.querySelector('.jazz-cd-art');
  const jazzNotes = scene.querySelector('.jazz-cd-notes');

  jazzArt.src = CANON_ASSETS.cd;

  SPARSE_SCRAPS.forEach((scrap, index) => {
    const place = PLACE[index];
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `sparse-stop is-${scrap.id} is-${place.side}`;
    btn.dataset.id = scrap.id;
    btn.dataset.index = String(index);
    btn.style.setProperty('--tilt', place.tilt);
    btn.style.setProperty('--stem', place.stem);
    const body = scrap.lines.map((line) => `<p class="sparse-line">${lineMarkup(line)}</p>`).join('');
    const mark = `<span class="sparse-mark"><span class="sparse-dot"></span><span class="sparse-index">${MARKS[index]}</span></span>`;
    const stem = '<span class="sparse-stem"></span>';
    const clip = `<span class="sparse-clip"><span class="sparse-time">${scrap.time}</span>${body}</span>`;
    btn.innerHTML = place.side === 'above' ? `${clip}${stem}${mark}` : `${mark}${stem}${clip}`;
    pile.append(btn);
  });

  SPARSE_CODA.forEach((text) => {
    const span = document.createElement('span');
    span.className = 'sparse-coda-line';
    span.textContent = text;
    coda.append(span);
  });

  NOW_LIKE_THIS.forEach((line) => {
    const p = document.createElement('p');
    p.className = `now-line ${line.speaker === '许遥' ? 'is-xu' : 'is-lin'}`;
    p.innerHTML = `<span class="now-who">${line.speaker}</span><span class="now-text">${line.text}</span>`;
    nowBox.append(p);
  });

  JAZZ_CD_LINES.forEach((text) => {
    const span = document.createElement('span');
    span.className = 'jazz-cd-line';
    span.textContent = text;
    jazzNotes.append(span);
  });

  const scraps = [...pile.querySelectorAll('.sparse-stop')];
  const codaLines = [...coda.querySelectorAll('.sparse-coda-line')];
  const nowLines = [...nowBox.querySelectorAll('.now-line')];
  const jazzLines = [...jazzNotes.querySelectorAll('.jazz-cd-line')];
  let shown = -1;
  let locked = false;
  let codaStarted = false;
  let jazzReady = false;
  let finished = false;

  function reveal(index) {
    const el = scraps[index];
    if (!el) return;
    shown = index;
    rail.style.setProperty('--reach', REACH[index]);
    if (index > 0) scraps[index - 1].classList.add('is-past');
    el.classList.add('is-in');
    if (index >= scraps.length - 1) {
      el.classList.add('is-rest');
      playCoda();
    }
  }

  async function playCoda() {
    if (codaStarted) return;
    codaStarted = true;
    locked = true;
    scraps.forEach((el, index) => {
      if (index < scraps.length - 1) el.classList.add('is-dim');
    });
    await wait(800);
    codaLines[0].classList.add('is-in');
    await wait(1000);
    codaLines[1].classList.add('is-in');
    await wait(1200);
    enterNowLikeThis();
  }

  async function enterNowLikeThis() {
    scene.dataset.beat = 'nowLikeThis';
    scene.classList.add('is-now');
    nowBox.setAttribute('aria-hidden', 'false');
    await wait(800);
    nowLines[0].classList.add('is-in');
    await wait(1000);
    nowLines[0].classList.remove('is-in');
    await wait(720);
    nowLines[1].classList.add('is-in');
    await wait(1000);
    enterJazzCd();
  }

  async function enterJazzCd() {
    scene.dataset.beat = 'jazzCd';
    scene.classList.add('is-jazz');
    jazz.hidden = false;
    await wait(40);
    jazz.classList.add('is-in');
    await wait(900);
    jazzLines[0].classList.add('is-in');
    await wait(1000);
    jazzLines[1].classList.add('is-in');
    await wait(1000);
    jazzHit.disabled = false;
    jazzReady = true;
  }

  function completeTrack() {
    if (!jazzReady || finished) return;
    finished = true;
    jazzReady = false;
    jazzHit.disabled = true;
    onComplete?.();
  }

  pile.addEventListener('click', (event) => {
    const btn = event.target.closest('.sparse-stop');
    if (!btn || locked || codaStarted) return;
    if (Number(btn.dataset.index) !== shown) return;
    if (shown >= scraps.length - 1) return;
    locked = true;
    reveal(shown + 1);
    window.setTimeout(() => {
      if (!codaStarted) locked = false;
    }, 420);
  });

  jazzHit.addEventListener('click', (event) => {
    event.stopPropagation();
    completeTrack();
  });

  async function start() {
    root.replaceChildren(scene);
    await wait(40);
    scene.classList.add('is-in');
    scene.dataset.beat = 'sparseContact';
    scene.classList.add('is-sparse');
    reveal(0);
  }

  start();
  return scene;
}
