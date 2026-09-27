import { asset } from '../core/assets.js';
import { cloneTemplate } from '../core/dom.js';
import {
  TRACK_05_END_CITY,
  TRACK_05_KISS,
  TRACK_05_MENTOS,
  TRACK_05_NEARBY_AFTER,
  TRACK_05_OPENING,
  TRACK_05_PLACES,
  TRACK_05_RED,
  TRACK_05_WALK,
} from '../data/track05.js';

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

const DOT_STATES = {
  far: { xu: [29, 42], lin: [71, 61] },
  after1: { xu: [35, 45], lin: [66, 58] },
  after2: { xu: [40, 48], lin: [61, 55] },
  after3: { xu: [44, 50], lin: [57, 53] },
  walk: { xu: [46, 50.5], lin: [55, 52] },
  close: { xu: [48.2, 51], lin: [52.6, 51.6] },
};

export function mountTrack05(root, { onComplete, onMarkComplete } = {}) {
  const scene = cloneTemplate('tpl-track-05');
  const opening = scene.querySelector('.t05-opening');
  const openPlate = scene.querySelector('.t05-open-plate');
  const openImage = scene.querySelector('.t05-open-image');
  const openTitle = scene.querySelector('.t05-open-title');
  const openCopy = scene.querySelector('.t05-open-copy');
  const city = scene.querySelector('.t05-city');
  const xuDot = scene.querySelector('.t05-dot.is-xu');
  const linDot = scene.querySelector('.t05-dot.is-lin');
  const placesBox = scene.querySelector('.t05-places');
  const holdPad = scene.querySelector('.t05-hold');
  const holdHint = scene.querySelector('.t05-hold-hint');
  const stillHit = scene.querySelector('.t05-still-hit');
  const stillArt = scene.querySelector('.t05-still-art');
  const candyBox = scene.querySelector('.t05-candies');
  const linesBox = scene.querySelector('.t05-lines');
  const coda = scene.querySelector('.t05-coda');
  const back = scene.querySelector('.t05-back');
  const reduced = prefersReducedMotion();
  const textFadeMs = reduced ? 160 : 520;

  TRACK_05_OPENING.forEach((group) => {
    const wrap = document.createElement('div');
    wrap.className = 't05-open-group';
    wrap.hidden = true;
    group.forEach((text) => {
      const p = document.createElement('p');
      p.className = 't05-open-line';
      p.textContent = text;
      wrap.append(p);
    });
    openCopy.append(wrap);
  });

  TRACK_05_PLACES.forEach((place) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 't05-place';
    btn.dataset.place = place.id;
    btn.style.left = `${place.x}%`;
    btn.style.top = `${place.y}%`;
    const mark = document.createElement('span');
    mark.className = 't05-place-mark';
    const label = document.createElement('span');
    label.className = 't05-place-label';
    label.textContent = place.label;
    btn.append(mark, label);
    placesBox.append(btn);
  });

  let beat = 'opening';
  let locked = false;
  let openingGroup = -1;
  let finished = false;
  let seenPlaces = new Set();
  let mentosStep = 0;
  let candyCount = 0;
  let holding = false;
  let holdProgress = 0;
  let holdRaf = 0;
  let lastHoldTs = 0;

  function setBeat(name) {
    beat = name;
    scene.dataset.beat = name;
  }

  function buildLine(payload) {
    const p = document.createElement('p');
    p.className = 't05-line is-narration';
    const lines = Array.isArray(payload) ? payload : [payload];
    lines.forEach((text) => {
      const row = document.createElement('span');
      row.className = 't05-narr-row';
      row.textContent = text;
      p.append(row);
    });
    return p;
  }

  async function fadeOutLines() {
    const nodes = [...linesBox.children];
    if (!nodes.length) {
      linesBox.classList.remove('is-in');
      return;
    }
    nodes.forEach((node) => node.classList.remove('is-in'));
    await wait(textFadeMs);
    linesBox.replaceChildren();
    linesBox.classList.remove('is-in');
  }

  async function showLine(payload) {
    await fadeOutLines();
    const p = buildLine(payload);
    linesBox.append(p);
    linesBox.classList.add('is-in');
    await wait(20);
    p.classList.add('is-in');
    await wait(textFadeMs);
  }

  async function showOpeningGroup(index) {
    const prev = [...openCopy.children].find((node) => node.classList.contains('is-in'));
    if (prev) {
      prev.classList.remove('is-in');
      await wait(textFadeMs);
      prev.hidden = true;
    }
    openingGroup = index;
    openTitle.classList.toggle('is-out', index >= 0);
    if (index < 0) return;
    const next = openCopy.children[index];
    next.hidden = false;
    await wait(20);
    next.classList.add('is-in');
    await wait(textFadeMs);
  }

  function setDots(state, extra = 0) {
    const pair = DOT_STATES[state];
    const close = DOT_STATES.close;
    const t = extra;
    const xuX = lerp(pair.xu[0], close.xu[0], t);
    const xuY = lerp(pair.xu[1], close.xu[1], t);
    const linX = lerp(pair.lin[0], close.lin[0], t);
    const linY = lerp(pair.lin[1], close.lin[1], t);
    xuDot.style.left = `${xuX}%`;
    xuDot.style.top = `${xuY}%`;
    linDot.style.left = `${linX}%`;
    linDot.style.top = `${linY}%`;
  }

  function placeState() {
    if (seenPlaces.size >= 3) return 'after3';
    if (seenPlaces.size === 2) return 'after2';
    if (seenPlaces.size === 1) return 'after1';
    return 'far';
  }

  async function showStill(src) {
    stillArt.classList.remove('is-lean');
    stillArt.src = src;
    stillHit.hidden = false;
    stillHit.classList.remove('is-out', 'is-dim');
    await wait(40);
    stillHit.classList.add('is-in');
  }

  async function hideStill() {
    stillHit.classList.add('is-out');
    stillHit.classList.remove('is-dim');
    await wait(640);
    stillHit.hidden = true;
    stillHit.classList.remove('is-in', 'is-out');
    candyBox.replaceChildren();
  }

  function dropCandy() {
    if (candyCount >= 2) return;
    candyCount += 1;
    const candy = document.createElement('span');
    candy.className = 't05-candy';
    candy.style.left = candyCount === 1 ? '46%' : '54%';
    candyBox.append(candy);
  }

  async function showCity(mode) {
    city.hidden = false;
    await wait(20);
    city.classList.add('is-in');
    city.classList.toggle('is-dusk', mode === 'end');
    city.classList.toggle('is-hold', mode === 'hold');
    placesBox.hidden = mode !== 'places';
    holdPad.hidden = mode !== 'hold';
    holdHint.hidden = mode !== 'hold';
    openPlate.classList.toggle('is-zoom', mode === 'hold');
    openPlate.classList.toggle('is-dusk', mode === 'end');
    if (mode === 'places') setDots('far');
    if (mode === 'walk') setDots('walk');
    if (mode === 'hold') setDots('walk', holdProgress);
    if (mode === 'end') setDots('close');
  }

  async function hideCity() {
    city.classList.remove('is-in', 'is-dusk', 'is-hold');
    openPlate.classList.remove('is-zoom');
    openImage.style.transform = '';
    await wait(480);
    city.hidden = true;
    holdPad.hidden = true;
    holdHint.hidden = true;
  }

  async function afterPlaces() {
    locked = true;
    setBeat('nearbyAfter');
    city.classList.add('is-dim');
    placesBox.hidden = true;
    await wait(reduced ? 240 : 640);
    await showLine(TRACK_05_NEARBY_AFTER[0]);
    await wait(900);
    await showLine(TRACK_05_NEARBY_AFTER[1]);
    locked = false;
  }

  function stopHold() {
    holding = false;
    if (holdRaf) {
      cancelAnimationFrame(holdRaf);
      holdRaf = 0;
    }
  }

  function tickHold(ts) {
    if (!holding) return;
    if (!lastHoldTs) lastHoldTs = ts;
    const delta = Math.min(48, ts - lastHoldTs);
    lastHoldTs = ts;
    const speed = reduced ? 0.0016 : 0.00042;
    holdProgress = Math.min(1, holdProgress + delta * speed);
    setDots('walk', holdProgress);
    openImage.style.transform = `scale(${1 + holdProgress * 0.045})`;
    if (holdProgress >= 0.92) {
      stopHold();
      finishHold();
      return;
    }
    holdRaf = requestAnimationFrame(tickHold);
  }

  async function finishHold() {
    locked = true;
    setBeat('holdDone');
    holdHint.hidden = true;
    setDots('close');
    await wait(reduced ? 360 : 700);
    await fadeOutLines();
    await hideCity();
    openPlate.classList.add('is-out');
    await wait(520);
    setBeat('redStill');
    await showStill(asset('canon/track05-red-light.png'));
    locked = false;
  }

  function startHold(event) {
    if (locked || beat !== 'hold' || holding) return;
    event.preventDefault();
    holding = true;
    lastHoldTs = 0;
    try {
      holdPad.setPointerCapture(event.pointerId);
    } catch {
      /* capture optional */
    }
    holdRaf = requestAnimationFrame(tickHold);
  }

  async function playCoda() {
    locked = true;
    setBeat('coda');
    await fadeOutLines();
    await hideCity();
    openPlate.classList.add('is-out');
    scene.classList.add('is-coda');
    await wait(720);
    coda.classList.add('is-in');
    await wait(900);
    coda.classList.add('is-hold');
    onMarkComplete?.();
    await wait(700);
    back.hidden = false;
    back.classList.add('is-in');
    locked = false;
  }

  async function advance() {
    if (locked || finished || holding) return;

    if (beat === 'opening') {
      locked = true;
      if (openingGroup < TRACK_05_OPENING.length - 1) {
        await showOpeningGroup(openingGroup + 1);
        locked = false;
        return;
      }
      opening.classList.add('is-out');
      await wait(textFadeMs);
      opening.hidden = true;
      await wait(reduced ? 280 : 720);
      setBeat('places');
      await showCity('places');
      locked = false;
      return;
    }

    if (beat === 'nearbyAfter') {
      locked = true;
      await fadeOutLines();
      await hideCity();
      setBeat('mentosStill');
      await showStill(asset('canon/track05-mentos.png'));
      locked = false;
      return;
    }

    if (beat === 'mentosStill') {
      locked = true;
      mentosStep = 0;
      setBeat('mentos');
      dropCandy();
      stillHit.classList.add('is-dim');
      await showLine(TRACK_05_MENTOS[0]);
      locked = false;
      return;
    }

    if (beat === 'mentos') {
      locked = true;
      mentosStep += 1;
      if (mentosStep === 1) {
        dropCandy();
        await showLine(TRACK_05_MENTOS[1]);
        locked = false;
        return;
      }
      await showLine(TRACK_05_MENTOS[2]);
      setBeat('mentosDone');
      locked = false;
      return;
    }

    if (beat === 'mentosDone') {
      locked = true;
      await fadeOutLines();
      await hideStill();
      openPlate.classList.remove('is-out');
      setBeat('walk');
      await showCity('walk');
      await showLine(TRACK_05_WALK);
      locked = false;
      return;
    }

    if (beat === 'walk') {
      locked = true;
      await fadeOutLines();
      setBeat('hold');
      city.classList.add('is-hold');
      holdPad.hidden = false;
      holdHint.hidden = false;
      openPlate.classList.add('is-zoom');
      locked = false;
      return;
    }

    if (beat === 'redStill') {
      locked = true;
      stillHit.classList.add('is-dim');
      setBeat('redLine');
      await showLine(TRACK_05_RED);
      locked = false;
      return;
    }

    if (beat === 'redLine') {
      locked = true;
      await fadeOutLines();
      stillHit.classList.remove('is-dim');
      stillArt.classList.add('is-lean');
      setBeat('redLean');
      locked = false;
      return;
    }

    if (beat === 'redLean') {
      locked = true;
      stillHit.classList.add('is-out');
      await wait(520);
      stillArt.classList.remove('is-lean');
      stillArt.src = asset('canon/track05-kiss.png');
      await wait(40);
      stillHit.classList.remove('is-out');
      stillHit.classList.add('is-in');
      setBeat('kissStill');
      await wait(reduced ? 420 : 1100);
      locked = false;
      return;
    }

    if (beat === 'kissStill') {
      locked = true;
      stillHit.classList.add('is-dim');
      setBeat('kissLine');
      await showLine(TRACK_05_KISS[0]);
      locked = false;
      return;
    }

    if (beat === 'kissLine') {
      locked = true;
      await showLine(TRACK_05_KISS[1]);
      setBeat('kissDone');
      locked = false;
      return;
    }

    if (beat === 'kissDone') {
      locked = true;
      await fadeOutLines();
      await hideStill();
      openPlate.classList.remove('is-out');
      openPlate.classList.add('is-dusk');
      setBeat('endCity');
      await showCity('end');
      await showLine(TRACK_05_END_CITY);
      locked = false;
      return;
    }

    if (beat === 'endCity') {
      await playCoda();
    }
  }

  placesBox.addEventListener('click', async (event) => {
    const btn = event.target.closest('.t05-place');
    if (!btn || locked || beat !== 'places') return;
    event.stopPropagation();
    const id = btn.dataset.place;
    if (seenPlaces.has(id)) return;
    locked = true;
    seenPlaces.add(id);
    btn.classList.add('is-seen');
    const place = TRACK_05_PLACES.find((item) => item.id === id);
    setDots(placeState());
    await showLine(place.copy);
    if (seenPlaces.size >= 3) {
      await afterPlaces();
      return;
    }
    locked = false;
  });

  holdPad.addEventListener(
    'pointerdown',
    (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      startHold(event);
    },
    { passive: false },
  );

  holdPad.addEventListener('pointerup', (event) => {
    if (!holding) return;
    event.preventDefault();
    event.stopPropagation();
    stopHold();
  });

  holdPad.addEventListener('pointercancel', () => {
    stopHold();
  });

  function bindAdvance(el, beats) {
    el.addEventListener('click', (event) => {
      event.stopPropagation();
      if (beats.includes(beat)) advance();
    });
  }

  bindAdvance(stillHit, [
    'mentosStill',
    'mentos',
    'mentosDone',
    'redStill',
    'redLine',
    'redLean',
    'kissStill',
    'kissLine',
    'kissDone',
  ]);

  scene.addEventListener('pointerup', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (holding) return;
    if (event.target.closest('.reset-progress, .t05-still-hit, .t05-back, .t05-place, .t05-hold')) {
      return;
    }
    if (beat === 'places' || beat === 'hold' || beat === 'coda') return;
    advance();
  });

  window.addEventListener('keydown', function onKey(event) {
    if (!document.body.contains(scene)) {
      window.removeEventListener('keydown', onKey);
      return;
    }
    if (event.key !== ' ' && event.key !== 'Enter') return;
    if (beat === 'coda' || beat === 'places' || beat === 'hold') return;
    event.preventDefault();
    advance();
  });

  back.addEventListener('click', () => {
    if (finished) return;
    finished = true;
    onMarkComplete?.();
    onComplete?.();
  });

  async function start() {
    root.replaceChildren(scene);
    setDots('far');
    await wait(40);
    scene.classList.add('is-in');
    setBeat('opening');
    showOpeningGroup(-1);
  }

  start();
  return scene;
}
