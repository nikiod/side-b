import { cloneTemplate } from '../core/dom.js';
import {
  TRACK_03_BRIDGE,
  TRACK_03_CHAT_LEAD,
  TRACK_03_GOODNIGHT,
  TRACK_03_MEET,
  TRACK_03_OPENING,
  TRACK_03_OPENING_AFTER,
  TRACK_03_SONGS,
  TRACK_03_TIME,
  TRACK_03_TODAY,
} from '../data/track03.js';

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function mountTrack03(root, { onComplete, onMarkComplete } = {}) {
  const scene = cloneTemplate('tpl-track-03');
  const opening = scene.querySelector('.t03-opening');
  const openPlate = scene.querySelector('.t03-open-plate');
  const openTitle = scene.querySelector('.t03-open-title');
  const openCopy = scene.querySelector('.t03-open-copy');
  const montage = scene.querySelector('.t03-montage');
  const ghosts = scene.querySelector('.t03-ghosts');
  const stillHit = scene.querySelector('.t03-still-hit');
  const stillArt = scene.querySelector('.t03-still-art');
  const linesBox = scene.querySelector('.t03-lines');
  const coda = scene.querySelector('.t03-coda');
  const back = scene.querySelector('.t03-back');
  const reduced = prefersReducedMotion();

  TRACK_03_SONGS.forEach((song) => {
    const card = document.createElement('img');
    card.className = 't03-card';
    card.src = song.src;
    card.alt = '';
    card.draggable = false;
    montage.append(card);

    const img = document.createElement('img');
    img.className = 't03-ghost';
    img.src = song.src;
    img.alt = '';
    img.draggable = false;
    ghosts.append(img);
  });

  const cards = [...montage.querySelectorAll('.t03-card')];
  const ghostEls = [...ghosts.querySelectorAll('.t03-ghost')];
  const openingGroups = [
    TRACK_03_OPENING.slice(0, 2),
    TRACK_03_OPENING.slice(2),
    TRACK_03_OPENING_AFTER,
  ];

  openingGroups.forEach((group) => {
    const wrap = document.createElement('div');
    wrap.className = 't03-open-group';
    wrap.hidden = true;
    group.forEach((text) => {
      const p = document.createElement('p');
      p.className = 't03-open-line';
      p.textContent = text;
      wrap.append(p);
    });
    openCopy.append(wrap);
  });

  let beat = 'opening';
  let locked = false;
  let openingGroup = -1;
  let chatLeadStep = 0;
  let meetStep = 0;
  let finished = false;
  const textFadeMs = reduced ? 160 : 520;

  function setBeat(name) {
    beat = name;
    scene.dataset.beat = name;
  }

  function buildLine(payload) {
    const p = document.createElement('p');
    if (Array.isArray(payload)) {
      p.className = 't03-line is-narration';
      payload.forEach((text) => {
        const row = document.createElement('span');
        row.className = 't03-narr-row';
        row.textContent = text;
        p.append(row);
      });
    } else if (typeof payload === 'string') {
      p.className = 't03-line is-narration';
      p.textContent = payload;
    } else if (payload.speaker) {
      p.className = `t03-line is-speak is-${payload.speaker === '许遥' ? 'left' : 'right'}`;
      const who = document.createElement('span');
      who.className = 't03-who';
      who.textContent = payload.speaker;
      const text = document.createElement('span');
      text.className = 't03-text';
      text.textContent = payload.text;
      p.append(who, text);
    } else {
      p.className = 't03-line is-narration';
      p.textContent = payload.text;
    }
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

  function stackCard(frontIndex) {
    cards.forEach((card, index) => {
      card.classList.remove('is-front', 'is-back-1', 'is-back-2', 'is-gone');
      if (index === frontIndex) card.classList.add('is-front');
      else if (index === frontIndex - 1) card.classList.add(reduced ? 'is-gone' : 'is-back-1');
      else if (index === frontIndex - 2) card.classList.add(reduced ? 'is-gone' : 'is-back-2');
      else if (index < frontIndex) card.classList.add('is-gone');
    });
  }

  async function playMontage() {
    locked = true;
    setBeat('montage');
    montage.hidden = false;
    if (reduced) montage.classList.add('is-reduced');
    await wait(40);
    montage.classList.add('is-in');
    const dwells = reduced ? [420, 420, 420, 420, 420] : [1180, 1000, 850, 750, 700];
    for (let i = 0; i < cards.length; i += 1) {
      stackCard(i);
      await wait(dwells[i]);
    }
    await wait(reduced ? 420 : 800);
    await playBridge();
  }

  async function playBridge() {
    setBeat('bridge');
    scene.classList.add('is-dim');
    montage.classList.add('is-recede');
    await wait(reduced ? 280 : 720);
    await showLine(TRACK_03_BRIDGE.slice(0, 2));
    await wait(1100);
    await showLine(TRACK_03_BRIDGE.slice(2));
    setBeat('bridgeReady');
    locked = false;
  }

  async function showStill(src, wide) {
    stillArt.src = src;
    stillArt.classList.toggle('is-wide', Boolean(wide));
    stillHit.hidden = false;
    stillHit.classList.remove('is-out', 'is-dim');
    await wait(40);
    stillHit.classList.add('is-in');
  }

  async function enterGoodnightChat() {
    locked = true;
    setBeat('goodnightStill');
    stillArt.src = '/canon/track03-goodnight-chat.png';
    stillArt.classList.remove('is-wide');
    stillHit.hidden = false;
    stillHit.classList.remove('is-out', 'is-dim');
    await wait(40);
    stillHit.classList.add('is-in');
    montage.classList.add('is-gone');
    await wait(reduced ? 280 : 640);
    montage.hidden = true;
    locked = false;
  }

  async function playTime() {
    locked = true;
    setBeat('time');
    await fadeOutLines();
    stillHit.classList.add('is-out');
    await wait(420);
    stillHit.hidden = true;
    ghosts.classList.add('is-in');
    for (const ghost of ghostEls) {
      ghost.classList.add('is-flash');
      await wait(260);
      ghost.classList.remove('is-flash');
    }
    ghosts.classList.remove('is-in');
    await showLine(TRACK_03_TIME[0]);
    await wait(900);
    await showLine(TRACK_03_TIME[1]);
    await wait(900);
    await showLine(TRACK_03_TIME[2]);
    await wait(600);
    await showLine(TRACK_03_TIME[3]);
    setBeat('timeReady');
    locked = false;
  }

  async function playCoda() {
    locked = true;
    setBeat('coda');
    stillHit.classList.add('is-out');
    await fadeOutLines();
    await wait(720);
    stillHit.hidden = true;
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

  async function advance() {
    if (locked || finished) return;

    if (beat === 'opening') {
      locked = true;
      if (openingGroup < openingGroups.length - 1) {
        await showOpeningGroup(openingGroup + 1);
        locked = false;
        return;
      }
      opening.classList.add('is-out');
      openPlate.classList.add('is-out');
      await wait(720);
      opening.hidden = true;
      openPlate.hidden = true;
      await playMontage();
      return;
    }

    if (beat === 'bridgeReady') {
      locked = true;
      await fadeOutLines();
      await enterGoodnightChat();
      return;
    }

    if (beat === 'goodnightStill') {
      locked = true;
      stillHit.classList.add('is-dim');
      chatLeadStep = 0;
      setBeat('chatLead');
      await showLine(TRACK_03_CHAT_LEAD[0]);
      locked = false;
      return;
    }

    if (beat === 'chatLead') {
      locked = true;
      chatLeadStep += 1;
      if (chatLeadStep < TRACK_03_CHAT_LEAD.length) {
        await showLine(TRACK_03_CHAT_LEAD[chatLeadStep]);
        locked = false;
        return;
      }
      await fadeOutLines();
      const xu = buildLine(TRACK_03_GOODNIGHT[0]);
      linesBox.append(xu);
      linesBox.classList.add('is-in');
      await wait(20);
      xu.classList.add('is-in');
      await wait(900);
      const lin = buildLine(TRACK_03_GOODNIGHT[1]);
      linesBox.append(lin);
      await wait(20);
      lin.classList.add('is-in');
      await wait(textFadeMs);
      setBeat('nightSong');
      locked = false;
      return;
    }

    if (beat === 'nightSong') {
      locked = true;
      await showLine(TRACK_03_GOODNIGHT[2]);
      setBeat('todayTalk');
      locked = false;
      return;
    }

    if (beat === 'todayTalk') {
      locked = true;
      await showLine(TRACK_03_TODAY);
      await wait(1400);
      await playTime();
      return;
    }

    if (beat === 'timeReady') {
      locked = true;
      await fadeOutLines();
      setBeat('meetStill');
      await showStill('/canon/track03-meet-again.png', true);
      locked = false;
      return;
    }

    if (beat === 'meetStill') {
      locked = true;
      stillHit.classList.add('is-dim');
      setBeat('meetLines');
      meetStep = 1;
      await showLine(TRACK_03_MEET.slice(0, 2));
      locked = false;
      return;
    }

    if (beat === 'meetLines') {
      locked = true;
      if (meetStep === 1) {
        await showLine(TRACK_03_MEET[2]);
        meetStep = 2;
        locked = false;
        return;
      }
      await playCoda();
    }
  }

  function bindAdvance(el, beats) {
    el.addEventListener('click', (event) => {
      event.stopPropagation();
      if (beats.includes(beat)) advance();
    });
  }

  bindAdvance(stillHit, [
    'goodnightStill',
    'chatLead',
    'nightSong',
    'todayTalk',
    'meetStill',
    'meetLines',
  ]);

  scene.addEventListener('pointerup', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (event.target.closest('.reset-progress, .t03-still-hit, .t03-back')) return;
    if (
      beat === 'montage' ||
      beat === 'bridge' ||
      beat === 'coda' ||
      beat === 'time'
    ) {
      return;
    }
    advance();
  });

  window.addEventListener('keydown', function onKey(event) {
    if (!document.body.contains(scene)) {
      window.removeEventListener('keydown', onKey);
      return;
    }
    if (event.key !== ' ' && event.key !== 'Enter') return;
    if (
      beat === 'coda' ||
      beat === 'montage' ||
      beat === 'bridge' ||
      beat === 'time'
    ) {
      return;
    }
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
    showOpeningGroup(-1);
  }

  start();
  return scene;
}
