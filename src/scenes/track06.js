import { asset } from '../core/assets.js';
import { cloneTemplate } from '../core/dom.js';
import {
  TRACK_06_AFTER,
  TRACK_06_END,
  TRACK_06_FILES,
  TRACK_06_FRAGS,
  TRACK_06_NOW,
  TRACK_06_OPENING,
  TRACK_06_STOP,
  TRACK_06_TAGS,
  TRACK_06_WARM,
} from '../data/track06.js';

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function mountTrack06(root, { onComplete, onMarkComplete } = {}) {
  const scene = cloneTemplate('tpl-track-06');
  const opening = scene.querySelector('.t06-opening');
  const openPlate = scene.querySelector('.t06-open-plate');
  const openTitle = scene.querySelector('.t06-open-title');
  const openCopy = scene.querySelector('.t06-open-copy');
  const desk = scene.querySelector('.t06-desk');
  const filesBox = scene.querySelector('.t06-files');
  const windowsBox = scene.querySelector('.t06-windows');
  const tabsBox = scene.querySelector('.t06-tabs');
  const linkLine = scene.querySelector('.t06-link-line');
  const linkLabel = scene.querySelector('.t06-link-label');
  const restorePane = scene.querySelector('.t06-restore');
  const restoreHit = scene.querySelector('.t06-restore-hit');
  const restorePct = scene.querySelector('.t06-restore-pct');
  const restoreStatus = scene.querySelector('.t06-restore-status');
  const reconnect = scene.querySelector('.t06-reconnect');
  const fragsBox = scene.querySelector('.t06-frags');
  const currentBox = scene.querySelector('.t06-current');
  const currentHit = scene.querySelector('.t06-current-hit');
  const currentTags = scene.querySelector('.t06-tags');
  const stillHit = scene.querySelector('.t06-still-hit');
  const stillArt = scene.querySelector('.t06-still-art');
  const linesBox = scene.querySelector('.t06-lines');
  const coda = scene.querySelector('.t06-coda');
  const back = scene.querySelector('.t06-back');
  const reduced = prefersReducedMotion();
  const textFadeMs = reduced ? 160 : 520;

  const copyWrap = document.createElement('div');
  copyWrap.className = 't06-open-group';
  copyWrap.hidden = true;
  TRACK_06_OPENING.forEach((text) => {
    const p = document.createElement('p');
    p.className = 't06-open-line';
    p.textContent = text;
    copyWrap.append(p);
  });
  openCopy.append(copyWrap);

  const fileEls = new Map();
  const winEls = new Map();
  let winLayer = 4;
  const PHOTO_SRC = asset('canon/photo.png');
  const MUSIC_THUMBS = [
    asset('canon/track03-song-ice-coffee.png'),
    asset('canon/track03-song-mannareo.png'),
    asset('canon/track03-song-one-and-only.png'),
  ];

  [
    { id: 'chat', label: 'CHAT_01' },
    { id: 'photo', label: 'PHOTO' },
    { id: 'music', label: 'MUSIC' },
    { id: 'untitled', label: 'UNTITLED' },
    { id: 'current', label: 'CURRENT' },
  ].forEach((file) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `t06-file is-${file.id}`;
    btn.dataset.id = file.id;
    const glyph = document.createElement('span');
    glyph.className = 't06-file-glyph';
    glyph.setAttribute('aria-hidden', 'true');
    const name = document.createElement('span');
    name.className = 't06-file-name';
    name.textContent = file.label;
    btn.append(glyph, name);
    if (file.id === 'current') btn.hidden = true;
    if (file.id === 'untitled') btn.classList.add('is-locked');
    filesBox.append(btn);
    fileEls.set(file.id, btn);
  });

  TRACK_06_TAGS.forEach((label) => {
    const tag = document.createElement('span');
    tag.className = 't06-tag';
    tag.textContent = label;
    currentTags.append(tag);
  });

  let beat = 'opening';
  let locked = false;
  let finished = false;
  let restored = new Set();
  let fragIndex = 0;
  let afterStep = 0;
  let holding = false;
  let holdProgress = 0;
  let holdRaf = 0;
  let lastHoldTs = 0;
  let restoreDone = false;

  function setBeat(name) {
    beat = name;
    scene.dataset.beat = name;
  }

  function buildLine(payload) {
    const p = document.createElement('p');
    p.className = 't06-line is-narration';
    const lines = Array.isArray(payload) ? payload : [payload];
    lines.forEach((text) => {
      const row = document.createElement('span');
      row.className = 't06-narr-row';
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

  async function showStill(src) {
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
  }

  function spawnFrag() {
    const spec = TRACK_06_FRAGS[fragIndex];
    if (!spec) return;
    const el = document.createElement('div');
    el.className = `t06-frag is-${spec.kind} is-${fragIndex}`;
    if (spec.kind === 'photo') {
      const shot = document.createElement('span');
      shot.className = 't06-frag-shot';
      el.append(shot);
    } else if (spec.kind === 'pair') {
      spec.lines.forEach((line, i) => {
        const row = document.createElement('span');
        row.className = `t06-frag-msg is-${i === 0 ? 'left' : 'right'}`;
        row.textContent = line;
        el.append(row);
      });
    } else {
      el.textContent = spec.text;
    }
    fragsBox.append(el);
    requestAnimationFrame(() => el.classList.add('is-in'));
    [...fragsBox.children].forEach((node, i, all) => {
      node.classList.toggle('is-faded', all.length > 4 && i < all.length - 4);
    });
    fragIndex += 1;
  }

  function stopHold() {
    holding = false;
    restoreHit.classList.remove('is-holding');
    desk.classList.remove('is-holding');
    if (holdRaf) {
      cancelAnimationFrame(holdRaf);
      holdRaf = 0;
    }
  }

  function tickHold(ts) {
    if (!holding || restoreDone) return;
    if (!lastHoldTs) lastHoldTs = ts;
    const delta = Math.min(48, ts - lastHoldTs);
    lastHoldTs = ts;
    const rate = reduced ? 78 / 2200 : 78 / 5200;
    holdProgress = Math.min(78, holdProgress + delta * rate);
    restorePct.textContent = `${Math.round(holdProgress)}%`;
    restoreHit.style.setProperty('--pct', `${holdProgress}%`);
    if (holdProgress >= 78) {
      stopHold();
      finishRestore();
      return;
    }
    holdRaf = requestAnimationFrame(tickHold);
  }

  async function finishRestore() {
    locked = true;
    restoreDone = true;
    holdProgress = 78;
    restorePct.textContent = '78%';
    restoreHit.disabled = true;
    restoreHit.classList.add('is-stopped');
    restoreStatus.textContent = 'RESTORING';
    restorePane.classList.add('is-cursor');
    await wait(reduced ? 360 : 800);
    setBeat('stopLine');
    await showLine(TRACK_06_STOP);
    locked = false;
  }

  function startHold(event) {
    if (locked || restoreDone || beat !== 'restore' || holding) return;
    event.preventDefault();
    holding = true;
    lastHoldTs = 0;
    restoreHit.classList.add('is-holding');
    desk.classList.add('is-holding');
    restoreStatus.textContent = 'RESTORING';
    try {
      restoreHit.setPointerCapture(event.pointerId);
    } catch {
      /* optional */
    }
    holdRaf = requestAnimationFrame(tickHold);
  }

  async function playCoda() {
    locked = true;
    setBeat('coda');
    await fadeOutLines();
    await hideStill();
    scene.classList.add('is-coda');
    coda.classList.add('is-in');
    await wait(900);
    coda.classList.add('is-hold');
    onMarkComplete?.();
    await wait(700);
    back.hidden = false;
    back.classList.add('is-in');
    locked = false;
  }

  function focusWindow(id) {
    const win = winEls.get(id);
    if (!win) return;
    winLayer += 1;
    win.style.zIndex = String(winLayer);
    windowsBox.querySelectorAll('.t06-win').forEach((node) => {
      node.classList.toggle('is-front', node === win);
    });
    tabsBox.querySelectorAll('.t06-tab').forEach((tab) => {
      tab.classList.toggle('is-on', tab.dataset.id === id);
    });
  }

  function fillWindow(id, body) {
    if (id === 'chat') {
      ['在干嘛', '刚忙完'].forEach((text, i) => {
        const p = document.createElement('p');
        p.className = `t06-win-msg is-${i === 0 ? 'left' : 'right'}`;
        p.textContent = text;
        body.append(p);
      });
    } else if (id === 'photo') {
      const sheet = document.createElement('div');
      sheet.className = 't06-contact';
      const polaroid = document.createElement('figure');
      polaroid.className = 't06-polaroid';
      const img = document.createElement('img');
      img.src = PHOTO_SRC;
      img.alt = '';
      img.draggable = false;
      const cap = document.createElement('figcaption');
      cap.textContent = 'ARCHIVE / 01';
      polaroid.append(img, cap);
      sheet.append(polaroid);
      body.append(sheet);
    } else if (id === 'music') {
      const strip = document.createElement('div');
      strip.className = 't06-music-sheet';
      MUSIC_THUMBS.forEach((src) => {
        const img = document.createElement('img');
        img.src = src;
        img.alt = '';
        img.draggable = false;
        strip.append(img);
      });
      const shared = document.createElement('p');
      shared.className = 't06-win-shared';
      shared.textContent = 'MUSIC SHARED';
      body.append(strip, shared);
    }
    const spec = TRACK_06_FILES.find((file) => file.id === id);
    if (spec) {
      const note = document.createElement('p');
      note.className = 't06-win-note';
      spec.copy.forEach((line) => {
        const row = document.createElement('span');
        row.textContent = line;
        note.append(row);
      });
      body.append(note);
    }
  }

  function openWindow(id) {
    if (winEls.has(id)) {
      focusWindow(id);
      return;
    }
    const spec = TRACK_06_FILES.find((file) => file.id === id);
    const win = document.createElement('article');
    win.className = `t06-win is-${id}`;
    win.dataset.id = id;
    const bar = document.createElement('header');
    bar.className = 't06-win-bar';
    const dots = document.createElement('span');
    dots.className = 't06-win-dots';
    for (let i = 0; i < 3; i += 1) dots.append(document.createElement('i'));
    const title = document.createElement('span');
    title.className = 't06-win-title';
    title.textContent = spec.label;
    bar.append(dots, title);
    const body = document.createElement('div');
    body.className = 't06-win-body';
    fillWindow(id, body);
    win.append(bar, body);
    windowsBox.append(win);
    winEls.set(id, win);
    win.addEventListener('pointerdown', () => focusWindow(id));
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 't06-tab';
    tab.dataset.id = id;
    tab.textContent = spec.label;
    tab.addEventListener('click', (event) => {
      event.stopPropagation();
      focusWindow(id);
    });
    tabsBox.append(tab);
    tabsBox.hidden = false;
    focusWindow(id);
  }

  async function enterArchive(second) {
    desk.hidden = false;
    await wait(40);
    desk.classList.add('is-in');
    if (second) {
      windowsBox.hidden = true;
      tabsBox.hidden = true;
      TRACK_06_FILES.forEach((file) => fileEls.get(file.id)?.classList.add('is-restored'));
      const current = fileEls.get('current');
      current.hidden = false;
      current.classList.add('is-restored');
      const untitled = fileEls.get('untitled');
      untitled.classList.remove('is-locked');
      linkLabel.textContent = 'CONNECTED';
      linkLine.classList.add('is-on');
      setBeat('untitled');
      return;
    }
    setBeat('archive');
  }

  async function afterThreeWindows() {
    linkLabel.textContent = 'CONNECTED';
    linkLine.classList.add('is-on');
    await wait(reduced ? 240 : 600);
    await showLine(TRACK_06_WARM[0]);
    setBeat('warm');
  }

  async function advance() {
    if (locked || finished || holding) return;

    if (beat === 'opening') {
      locked = true;
      openTitle.classList.add('is-out');
      await wait(textFadeMs);
      setBeat('openingStill');
      locked = false;
      return;
    }

    if (beat === 'openingStill') {
      locked = true;
      copyWrap.hidden = false;
      await wait(20);
      copyWrap.classList.add('is-in');
      await wait(textFadeMs);
      setBeat('openingCopy');
      locked = false;
      return;
    }

    if (beat === 'openingCopy') {
      locked = true;
      opening.classList.add('is-out');
      openPlate.classList.add('is-out');
      await wait(720);
      opening.hidden = true;
      openPlate.hidden = true;
      await enterArchive(false);
      locked = false;
      return;
    }

    if (beat === 'warm') {
      locked = true;
      await showLine(TRACK_06_WARM[1]);
      setBeat('warmDesk');
      locked = false;
      return;
    }

    if (beat === 'warmDesk') {
      locked = true;
      await fadeOutLines();
      desk.classList.add('is-dim');
      await wait(520);
      desk.classList.add('is-out');
      await wait(640);
      desk.hidden = true;
      desk.classList.remove('is-in', 'is-out', 'is-dim');
      reconnect.hidden = false;
      await wait(40);
      reconnect.classList.add('is-in');
      setBeat('frags');
      locked = false;
      return;
    }

    if (beat === 'frags') {
      locked = true;
      spawnFrag();
      await wait(reduced ? 160 : 240);
      if (fragIndex >= TRACK_06_FRAGS.length) {
        await wait(400);
        fragsBox.classList.add('is-aside');
        await wait(480);
        currentBox.hidden = false;
        await wait(20);
        currentBox.classList.add('is-in');
        setBeat('current');
      }
      locked = false;
      return;
    }

    if (beat === 'now') {
      locked = true;
      await fadeOutLines();
      reconnect.classList.add('is-out');
      await wait(640);
      reconnect.hidden = true;
      reconnect.classList.remove('is-in', 'is-out');
      await enterArchive(true);
      locked = false;
      return;
    }

    if (beat === 'stopLine') {
      locked = true;
      afterStep = 0;
      await showLine(TRACK_06_AFTER[0]);
      setBeat('after');
      locked = false;
      return;
    }

    if (beat === 'after') {
      locked = true;
      afterStep += 1;
      if (afterStep < TRACK_06_AFTER.length) {
        await showLine(TRACK_06_AFTER[afterStep]);
        locked = false;
        return;
      }
      restoreStatus.textContent = 'RESTORE CANCELLED';
      restorePane.classList.remove('is-cursor');
      restorePane.classList.add('is-cancelled');
      setBeat('cancel');
      locked = false;
      return;
    }

    if (beat === 'cancel') {
      locked = true;
      await fadeOutLines();
      const order = ['chat', 'photo', 'music', 'current', 'untitled'];
      for (const id of order) {
        fileEls.get(id)?.classList.add('is-off');
        await wait(reduced ? 80 : 180);
      }
      restorePane.classList.add('is-off');
      await wait(520);
      desk.classList.add('is-out');
      await wait(720);
      desk.hidden = true;
      setBeat('endStill');
      await showStill(asset('canon/track06-ending-screen.png'));
      locked = false;
      return;
    }

    if (beat === 'endStill') {
      locked = true;
      stillHit.classList.add('is-dim');
      setBeat('endLine');
      await showLine(TRACK_06_END.slice(0, 2));
      locked = false;
      return;
    }

    if (beat === 'endLine') {
      locked = true;
      await showLine(TRACK_06_END[2]);
      setBeat('endDone');
      locked = false;
      return;
    }

    if (beat === 'endDone') {
      await playCoda();
    }
  }

  filesBox.addEventListener('click', async (event) => {
    const btn = event.target.closest('.t06-file');
    if (!btn || locked) return;
    event.stopPropagation();
    const id = btn.dataset.id;
    if (beat === 'archive') {
      const spec = TRACK_06_FILES.find((file) => file.id === id);
      if (!spec) return;
      if (restored.has(id)) {
        openWindow(id);
        return;
      }
      locked = true;
      restored.add(id);
      btn.classList.add('is-restored');
      openWindow(id);
      await wait(220);
      if (restored.size >= 3) await afterThreeWindows();
      locked = false;
      return;
    }
    if ((beat === 'warm' || beat === 'warmDesk') && TRACK_06_FILES.some((file) => file.id === id)) {
      openWindow(id);
      return;
    }
    if (beat === 'untitled' && id === 'untitled') {
      locked = true;
      restorePane.hidden = false;
      await wait(20);
      restorePane.classList.add('is-in');
      setBeat('restore');
      locked = false;
    }
  });

  currentHit.addEventListener('click', async (event) => {
    event.stopPropagation();
    if (locked || beat !== 'current') return;
    locked = true;
    currentTags.hidden = false;
    await wait(20);
    currentTags.classList.add('is-in');
    await wait(320);
    await showLine(TRACK_06_NOW);
    setBeat('now');
    locked = false;
  });

  restoreHit.addEventListener(
    'pointerdown',
    (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      startHold(event);
    },
    { passive: false },
  );

  restoreHit.addEventListener('pointerup', (event) => {
    if (!holding) return;
    event.preventDefault();
    event.stopPropagation();
    stopHold();
  });

  restoreHit.addEventListener('pointercancel', () => {
    stopHold();
  });

  function bindAdvance(el, beats) {
    el.addEventListener('click', (event) => {
      event.stopPropagation();
      if (beats.includes(beat)) advance();
    });
  }

  bindAdvance(stillHit, ['endStill', 'endLine', 'endDone']);

  scene.addEventListener('pointerup', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (holding) return;
    if (
      event.target.closest(
        '.reset-progress, .t06-still-hit, .t06-back, .t06-file, .t06-current-hit, .t06-restore-hit, .t06-win, .t06-tab',
      )
    ) {
      return;
    }
    if (beat === 'restore' || beat === 'coda' || beat === 'archive' || beat === 'untitled') return;
    advance();
  });

  window.addEventListener('keydown', function onKey(event) {
    if (!document.body.contains(scene)) {
      window.removeEventListener('keydown', onKey);
      return;
    }
    if (event.key !== ' ' && event.key !== 'Enter') return;
    if (beat === 'coda' || beat === 'restore' || beat === 'archive' || beat === 'untitled') return;
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
    await wait(40);
    scene.classList.add('is-in');
    setBeat('opening');
  }

  start();
  return scene;
}
