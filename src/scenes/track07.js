import { asset } from '../core/assets.js';
import { cloneTemplate } from '../core/dom.js';
import {
  TRACK_07_KEY,
  TRACK_07_LIN_NOTE,
  TRACK_07_NIGHTS,
  TRACK_07_NODES,
  TRACK_07_OPENING,
  TRACK_07_RELATION,
  TRACK_07_SIGHTS,
  TRACK_07_XU_NOTE,
} from '../data/track07.js';

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function mountTrack07(root, { onComplete, onMarkComplete } = {}) {
  const scene = cloneTemplate('tpl-track-07');
  const opening = scene.querySelector('.t07-opening');
  const openTitle = scene.querySelector('.t07-open-title');
  const openCopy = scene.querySelector('.t07-open-copy');
  const sides = scene.querySelector('.t07-sides');
  const rail = scene.querySelector('.t07-rail');
  const field = scene.querySelector('.t07-field');
  const trace = scene.querySelector('.t07-trace');
  const hint = scene.querySelector('.t07-hint');
  const hintLabel = scene.querySelector('.t07-hint-label');
  const clickHint = scene.querySelector('.t07-click-hint');
  const clip = scene.querySelector('.t07-clip');
  const clipArt = scene.querySelector('.t07-clip-art');
  const clipNote = scene.querySelector('.t07-clip-note');
  const slip = scene.querySelector('.t07-slip');
  const slipKicker = scene.querySelector('.t07-slip-kicker');
  const slipCopy = scene.querySelector('.t07-slip-copy');
  const stillHit = scene.querySelector('.t07-still-hit');
  const stillArt = scene.querySelector('.t07-still-art');
  const msgHit = scene.querySelector('.t07-msg');
  const linesBox = scene.querySelector('.t07-lines');
  const coda = scene.querySelector('.t07-coda');
  const back = scene.querySelector('.t07-back');
  const reduced = prefersReducedMotion();
  const textFadeMs = reduced ? 160 : 520;
  const isMobile = window.matchMedia('(max-width: 820px)').matches;

  TRACK_07_OPENING.forEach((group) => {
    const wrap = document.createElement('div');
    wrap.className = 't07-open-group';
    wrap.hidden = true;
    group.forEach((text) => {
      const p = document.createElement('p');
      p.className = 't07-open-line';
      p.textContent = text;
      wrap.append(p);
    });
    openCopy.append(wrap);
  });

  const slotPx = () => (isMobile ? 64 : 82);
  let xuNext = 0;
  let linNext = 0;
  const timelineNodes = [];

  function placeNode(el, side, slot) {
    el.dataset.slot = String(slot);
    el.style.top = `${12 + slot * slotPx()}px`;
    if (isMobile) {
      el.style.left = side === 'xu' ? '6%' : '54%';
      el.style.right = 'auto';
      el.style.maxWidth = '40%';
      return;
    }
    if (side === 'xu') {
      el.style.left = slot % 2 === 0 ? '8%' : '27%';
      el.style.right = 'auto';
      el.style.maxWidth = '20%';
      return;
    }
    if (slot % 2 === 0) {
      el.style.left = '73%';
      el.style.right = 'auto';
    } else {
      el.style.left = 'auto';
      el.style.right = '8%';
    }
    el.style.maxWidth = '20%';
  }

  function takeSlot(side) {
    if (side === 'xu') {
      const slot = xuNext;
      xuNext += 1;
      return slot;
    }
    const slot = linNext;
    linNext += 1;
    return slot;
  }

  function syncFieldScroll() {
    const gap = slotPx();
    const keep = 5;
    const shown = Math.max(xuNext, linNext, 1);
    const offset = Math.max(0, (shown - keep) * gap);
    field.style.transform = `translateY(${-offset}px)`;
    field.querySelectorAll('.t07-node').forEach((el) => {
      if (!el.classList.contains('is-in')) return;
      const slot = Number(el.dataset.slot || 0);
      const sideCount = el.classList.contains('is-lin') ? linNext : xuNext;
      const age = sideCount - slot;
      el.classList.toggle('is-faded', age > 5);
      el.classList.toggle('is-gone', age > 7);
    });
  }

  [
    { side: 'xu', text: '生活' },
    { side: 'lin', text: '生活' },
  ].forEach((origin) => {
    const el = document.createElement('div');
    el.className = `t07-node is-${origin.side} is-origin is-in`;
    el.dataset.origin = 'true';
    placeNode(el, origin.side, takeSlot(origin.side));
    const label = document.createElement('span');
    label.className = 't07-node-label';
    label.textContent = origin.text;
    el.append(label);
    field.append(el);
  });

  TRACK_07_NODES.forEach((node) => {
    const el = document.createElement(node.kind === 'relation' ? 'button' : 'div');
    if (node.kind === 'relation') el.type = 'button';
    el.className = `t07-node is-${node.side} is-${node.kind}`;
    el.dataset.at = String(node.at);
    el.dataset.side = node.side;
    if (node.index) {
      const idx = document.createElement('span');
      idx.className = 't07-node-index';
      idx.textContent = node.index;
      el.append(idx);
    }
    const label = document.createElement('span');
    label.className = 't07-node-label';
    label.textContent = node.text;
    el.append(label);
    field.append(el);
    timelineNodes.push(el);
    if (node.kind === 'relation') {
      el.addEventListener('click', (event) => {
        event.stopPropagation();
        if (locked || beat !== 'sides') return;
        openSlip('NOTE', [TRACK_07_RELATION]);
      });
    }
  });

  TRACK_07_SIGHTS.forEach((sight) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 't07-sight';
    btn.dataset.at = String(sight.at);
    btn.addEventListener('click', (event) => {
      event.stopPropagation();
      if (locked || beat !== 'sides') return;
      openSlip(sight.kicker, sight.copy);
    });
    field.append(btn);
  });

  let beat = 'opening';
  let locked = false;
  let finished = false;
  let openingGroup = -1;
  let progress = 0;
  let dragging = false;
  let lastY = 0;
  let activePointer = null;
  let gate = null;
  let hinted = false;
  let linNoteStep = 0;
  let xuyaoLifeShown = false;
  let linheLifeShown = false;
  let xuyaoLifeClosed = false;
  let linheLifeClosed = false;
  let seenKey = false;
  let ended = false;
  let codaStarted = false;
  let ordinaryStarted = false;
  const endingClicks = ['reflection', 'continuation', 'nightsStill', 'nightsLine', 'nightsHold'];

  function setBeat(name) {
    beat = name;
    scene.dataset.beat = name;
  }

  function buildLine(payload) {
    const p = document.createElement('p');
    p.className = 't07-line is-narration';
    const lines = Array.isArray(payload) ? payload : [payload];
    lines.forEach((text) => {
      const row = document.createElement('span');
      row.className = 't07-narr-row';
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

  async function showLine(payload, { center = false } = {}) {
    await fadeOutLines();
    const p = buildLine(payload);
    if (center) p.classList.add('is-center');
    linesBox.append(p);
    linesBox.classList.add('is-in');
    await wait(20);
    p.classList.add('is-in');
    await wait(textFadeMs);
  }

  function openSlip(kicker, copy) {
    slipKicker.textContent = kicker;
    slipCopy.replaceChildren();
    copy.forEach((text) => {
      const row = document.createElement('p');
      row.textContent = text;
      slipCopy.append(row);
    });
    slip.hidden = false;
    requestAnimationFrame(() => slip.classList.add('is-in'));
  }

  function closeSlip() {
    slip.classList.remove('is-in');
    slip.hidden = true;
  }

  function cap() {
    if (!xuyaoLifeClosed) return 0.3;
    if (!linheLifeClosed) return 0.45;
    if (!seenKey) return 0.8;
    return 0.8;
  }

  function timelineLive() {
    return beat === 'sides' && !finished && document.body.contains(scene);
  }

  function dragSpan() {
    return clamp(window.innerHeight * 0.92, 500, 700);
  }

  function revealNodes() {
    timelineNodes.forEach((el) => {
      if (el.dataset.placed === 'true') return;
      if (progress + 0.008 < Number(el.dataset.at)) return;
      el.dataset.placed = 'true';
      placeNode(el, el.dataset.side, takeSlot(el.dataset.side));
      requestAnimationFrame(() => el.classList.add('is-in'));
    });
    [...field.querySelectorAll('.t07-sight')].forEach((dot) => {
      if (dot.dataset.placed === 'true') return;
      if (progress < Number(dot.dataset.at)) return;
      dot.dataset.placed = 'true';
      const y = Math.max(xuNext, linNext) * slotPx();
      dot.style.top = `${y}px`;
      dot.classList.add('is-in');
    });
    syncFieldScroll();
  }

  function renderProgress() {
    if (rail) rail.style.setProperty('--t07-line', `${22 + progress * 78}%`);
    const fade = progress < 0.75 ? 0.35 * (1 - progress / 0.75) : 0;
    trace.style.opacity = String(fade);
    revealNodes();
  }

  function plantThumb(side, src) {
    const el = document.createElement('div');
    el.className = `t07-node is-${side} is-thumb is-in`;
    placeNode(el, side, takeSlot(side));
    const img = document.createElement('img');
    img.className = 't07-thumb-art';
    img.src = src;
    img.alt = '';
    img.draggable = false;
    el.append(img);
    field.append(el);
    syncFieldScroll();
  }

  async function openCollage(which) {
    locked = true;
    gate = which;
    scene.classList.add('is-clipping');
    clip.classList.toggle('is-left', which === 'xu');
    clip.classList.toggle('is-right', which === 'lin');
    clipArt.src = which === 'xu' ? asset('canon/track07-xuyao-life.png') : asset('canon/track07-linhe-life.png');
    clipNote.replaceChildren();
    const lines = which === 'xu' ? TRACK_07_XU_NOTE : TRACK_07_LIN_NOTE[0];
    if (which === 'lin') linNoteStep = 0;
    lines.forEach((text) => {
      const row = document.createElement('span');
      row.textContent = text;
      clipNote.append(row);
    });
    clip.hidden = false;
    await wait(30);
    clip.classList.add('is-in');
  }

  async function hitGate() {
    if (gate || locked) return;
    if (!xuyaoLifeShown && progress >= 0.3) {
      xuyaoLifeShown = true;
      await openCollage('xu');
      return;
    }
    if (xuyaoLifeClosed && !linheLifeShown && progress >= 0.45) {
      linheLifeShown = true;
      await openCollage('lin');
      return;
    }
    if (xuyaoLifeClosed && linheLifeClosed && !seenKey && progress >= 0.8) {
      gate = 'key';
      locked = true;
      seenKey = true;
      hideHint();
      scene.classList.remove('is-clipping');
      await showLine(TRACK_07_KEY[0], { center: true });
      setBeat('reflection');
      showClickHint();
      locked = false;
      return;
    }
  }

  async function closeClip() {
    const closing = gate;
    clip.classList.remove('is-in');
    await wait(420);
    clip.hidden = true;
    clip.classList.remove('is-left', 'is-right');
    scene.classList.remove('is-clipping');
    if (closing === 'xu') {
      xuyaoLifeClosed = true;
      plantThumb('xu', asset('canon/track07-xuyao-life.png'));
    }
    if (closing === 'lin') {
      linheLifeClosed = true;
      plantThumb('lin', asset('canon/track07-linhe-life.png'));
    }
    gate = null;
    locked = false;
  }

  async function finishTimeline() {
    if (ended) return;
    ended = true;
    locked = true;
    setBeat('fade');
    hideClickHint();
    await fadeOutLines();
    sides.classList.add('is-out');
    await wait(reduced ? 420 : 820);
    sides.hidden = true;
    scene.classList.add('is-navy');
    stillArt.src = asset('canon/track07-two-nights.png');
    stillHit.hidden = false;
    await wait(40);
    stillHit.classList.add('is-in');
    setBeat('nightsStill');
    await wait(reduced ? 240 : 600);
    locked = false;
  }

  async function playOrdinaryDays() {
    if (ordinaryStarted || ended) return;
    ordinaryStarted = true;
    locked = true;
    setBeat('ordinary');
    hideClickHint();
    const items = [
      { side: 'xu', text: '又到周一', kind: 'note' },
      { side: 'lin', text: '工作', kind: 'note' },
      { side: 'xu', text: '做饭', kind: 'receipt' },
      { side: 'lin', text: '看书', kind: 'book' },
      { side: 'xu', text: '看电影', kind: 'ticket' },
      { side: 'lin', text: '又到周一', kind: 'calendar' },
      { side: 'xu', text: '睡觉', kind: 'note' },
      { side: 'lin', text: '睡觉', kind: 'note' },
    ];
    const gap = reduced ? 140 : 300;
    items.forEach((item) => {
      const el = document.createElement('div');
      el.className = `t07-node is-${item.side} is-${item.kind} is-ordinary`;
      placeNode(el, item.side, takeSlot(item.side));
      const label = document.createElement('span');
      label.className = 't07-node-label';
      label.textContent = item.text;
      el.append(label);
      field.append(el);
    });
    syncFieldScroll();
    const spawned = [...field.querySelectorAll('.t07-node.is-ordinary')];
    for (const el of spawned) {
      await wait(20);
      el.classList.add('is-in');
      await wait(gap);
    }
    await wait(500);
    await finishTimeline();
  }

  function hideHint() {
    if (hinted) return;
    hinted = true;
    hint.classList.add('is-out');
  }

  function showClickHint() {
    if (!clickHint) return;
    clickHint.hidden = false;
    requestAnimationFrame(() => clickHint.classList.add('is-in'));
  }

  function hideClickHint() {
    if (!clickHint) return;
    clickHint.classList.remove('is-in');
    clickHint.hidden = true;
  }

  function nudge(delta) {
    if (!timelineLive() || locked || gate) return;
    hideHint();
    const next = clamp(progress + delta, 0, cap());
    if (Math.abs(next - progress) >= 0.00015) {
      progress = next;
      renderProgress();
    }
    hitGate();
  }

  function wheelDelta(event) {
    let dy = event.deltaY;
    if (event.deltaMode === 1) dy *= 16;
    if (event.deltaMode === 2) dy *= window.innerHeight;
    return dy / (window.innerHeight * 2.6);
  }

  function onWheel(event) {
    if (!document.body.contains(scene)) {
      window.removeEventListener('wheel', onWheel);
      return;
    }
    if (!timelineLive()) return;
    event.preventDefault();
    if (locked || gate) return;
    nudge(wheelDelta(event));
  }

  function onPointerDown(event) {
    if (!timelineLive() || locked || gate) return;
    if (event.target.closest('.t07-sight, .t07-node.is-relation, .t07-clip, .t07-slip')) {
      return;
    }
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    dragging = true;
    activePointer = event.pointerId;
    lastY = event.clientY;
    try {
      sides.setPointerCapture(event.pointerId);
    } catch {
      /* optional */
    }
  }

  function onPointerMove(event) {
    if (!dragging || event.pointerId !== activePointer) return;
    event.preventDefault();
    const delta = lastY - event.clientY;
    lastY = event.clientY;
    nudge(delta / dragSpan());
  }

  function endPointer(event) {
    if (event && activePointer != null && event.pointerId !== activePointer) return;
    dragging = false;
    activePointer = null;
  }

  async function playCoda() {
    if (codaStarted) return;
    codaStarted = true;
    locked = true;
    setBeat('coda');
    await fadeOutLines();
    stillHit.classList.add('is-out');
    await wait(640);
    stillHit.hidden = true;
    scene.classList.add('is-coda');
    coda.classList.add('is-in');
    onMarkComplete?.();
    await wait(900);
    coda.classList.add('is-hold');
    await wait(700);
    back.hidden = false;
    back.classList.add('is-in');
    locked = false;
  }

  async function advance() {
    if (locked || finished) return;

    if (beat === 'opening') {
      locked = true;
      if (openingGroup < TRACK_07_OPENING.length - 1) {
        const prev = [...openCopy.children].find((node) => node.classList.contains('is-in'));
        if (prev) {
          prev.classList.remove('is-in');
          await wait(textFadeMs);
          prev.hidden = true;
        }
        openingGroup += 1;
        openTitle.classList.add('is-out');
        const next = openCopy.children[openingGroup];
        next.hidden = false;
        await wait(20);
        next.classList.add('is-in');
        await wait(textFadeMs);
        locked = false;
        return;
      }
      opening.classList.add('is-out');
      await wait(textFadeMs);
      opening.hidden = true;
      sides.hidden = false;
      if (hintLabel) hintLabel.textContent = isMobile ? '向下' : 'SCROLL / DRAG';
      await wait(40);
      sides.classList.add('is-in');
      setBeat('sides');
      renderProgress();
      locked = false;
      return;
    }

    if (beat === 'reflection') {
      locked = true;
      hideClickHint();
      await showLine(TRACK_07_KEY[1], { center: true });
      setBeat('continuation');
      await wait(reduced ? 160 : 400);
      showClickHint();
      locked = false;
      return;
    }

    if (beat === 'continuation') {
      locked = true;
      hideClickHint();
      await fadeOutLines();
      await playOrdinaryDays();
      return;
    }

    if (beat === 'nightsStill') {
      locked = true;
      setBeat('nightsLine');
      await showLine(TRACK_07_NIGHTS.slice(0, 2));
      locked = false;
      return;
    }

    if (beat === 'nightsLine') {
      locked = true;
      await showLine(TRACK_07_NIGHTS[2]);
      setBeat('nightsHold');
      locked = false;
      return;
    }

    if (beat === 'nightsHold') {
      locked = true;
      await fadeOutLines();
      await wait(reduced ? 220 : 500);
      stillHit.classList.add('is-dimmer');
      await wait(520);
      msgHit.hidden = false;
      await wait(20);
      msgHit.classList.add('is-in');
      setBeat('message');
      locked = false;
    }
  }

  clip.addEventListener('click', async (event) => {
    event.stopPropagation();
    if (gate === 'xu') {
      await closeClip();
      return;
    }
    if (gate === 'lin') {
      if (linNoteStep === 0) {
        linNoteStep = 1;
        clipNote.replaceChildren();
        TRACK_07_LIN_NOTE[1].forEach((text) => {
          const row = document.createElement('span');
          row.textContent = text;
          clipNote.append(row);
        });
        return;
      }
      await closeClip();
    }
  });

  slip.addEventListener('click', (event) => {
    event.stopPropagation();
    closeSlip();
  });

  msgHit.addEventListener('click', async (event) => {
    event.stopPropagation();
    if (locked || beat !== 'message') return;
    locked = true;
    msgHit.classList.add('is-pulse');
    await wait(420);
    msgHit.classList.remove('is-in', 'is-pulse');
    await wait(360);
    msgHit.hidden = true;
    stillHit.classList.add('is-out');
    await wait(640);
    stillHit.hidden = true;
    await playCoda();
  });

  window.addEventListener('wheel', onWheel, { passive: false });
  sides.addEventListener('pointerdown', onPointerDown);
  sides.addEventListener('pointermove', onPointerMove, { passive: false });
  sides.addEventListener('pointerup', endPointer);
  sides.addEventListener('pointercancel', endPointer);
  sides.addEventListener('lostpointercapture', endPointer);

  stillHit.addEventListener('click', (event) => {
    event.stopPropagation();
    if (endingClicks.includes(beat) && beat.startsWith('nights')) advance();
  });

  scene.addEventListener('pointerup', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (dragging) return;
    if (event.target.closest('.reset-progress, .t07-back, .t07-msg, .t07-clip, .t07-slip')) {
      return;
    }
    if (endingClicks.includes(beat)) {
      if (beat.startsWith('nights') && event.target.closest('.t07-still-hit')) return;
      advance();
      return;
    }
    if (
      event.target.closest(
        '.t07-still-hit, .t07-sight, .t07-node',
      )
    ) {
      return;
    }
    if (beat === 'sides' || beat === 'coda' || beat === 'message' || beat === 'fade' || beat === 'ordinary') return;
    advance();
  });

  window.addEventListener('keydown', function onKey(event) {
    if (!document.body.contains(scene)) {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('wheel', onWheel);
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === ' ') {
      if (timelineLive()) {
        event.preventDefault();
        nudge(event.key === 'ArrowUp' ? -0.04 : 0.04);
        return;
      }
    }
    if (event.key !== ' ' && event.key !== 'Enter') return;
    if (beat === 'sides' || beat === 'coda' || beat === 'message' || beat === 'ordinary' || beat === 'fade') return;
    event.preventDefault();
    advance();
  });

  back.addEventListener('click', () => {
    if (finished) return;
    finished = true;
    window.removeEventListener('wheel', onWheel);
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
