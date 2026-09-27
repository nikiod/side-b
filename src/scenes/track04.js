import { cloneTemplate } from '../core/dom.js';
import {
  TRACK_04_CODA,
  TRACK_04_DAYS,
  TRACK_04_HOME,
  TRACK_04_LEFT_OUT,
  TRACK_04_NO_SLOT,
  TRACK_04_OPENING,
  TRACK_04_PLAN1_DONE,
  TRACK_04_PLAN2_HINT,
  TRACK_04_ROUND1,
  TRACK_04_ROUND2,
  TRACK_04_UNSAID,
  TRACK_04_WINTER,
  TRACK_04_WINTER_LEAD,
} from '../data/track04.js';

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function pointInRect(x, y, rect) {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

export function mountTrack04(root, { onComplete, onMarkComplete } = {}) {
  const scene = cloneTemplate('tpl-track-04');
  const opening = scene.querySelector('.t04-opening');
  const openPlate = scene.querySelector('.t04-open-plate');
  const openTitle = scene.querySelector('.t04-open-title');
  const openCopy = scene.querySelector('.t04-open-copy');
  const stillHit = scene.querySelector('.t04-still-hit');
  const stillArt = scene.querySelector('.t04-still-art');
  const planner = scene.querySelector('.t04-planner');
  const paper = scene.querySelector('.t04-planner-paper');
  const week = scene.querySelector('.t04-week');
  const tray = scene.querySelector('.t04-tray');
  const floatLayer = scene.querySelector('.t04-float');
  const planNote = scene.querySelector('.t04-plan-note');
  const linesBox = scene.querySelector('.t04-lines');
  const coda = scene.querySelector('.t04-coda');
  const back = scene.querySelector('.t04-back');
  const reduced = prefersReducedMotion();
  const textFadeMs = reduced ? 160 : 520;

  TRACK_04_DAYS.forEach((name, index) => {
    const day = document.createElement('div');
    day.className = 't04-day';
    day.dataset.day = String(index);
    const label = document.createElement('span');
    label.className = 't04-day-name';
    label.textContent = name;
    const slot = document.createElement('div');
    slot.className = 't04-day-slot';
    day.append(label, slot);
    week.append(day);
  });

  const slots = [...week.querySelectorAll('.t04-day-slot')];

  TRACK_04_OPENING.forEach((group) => {
    const wrap = document.createElement('div');
    wrap.className = 't04-open-group';
    wrap.hidden = true;
    group.forEach((text) => {
      const p = document.createElement('p');
      p.className = 't04-open-line';
      p.textContent = text;
      wrap.append(p);
    });
    openCopy.append(wrap);
  });

  let beat = 'opening';
  let locked = false;
  let openingGroup = -1;
  let homeStep = 0;
  let unsaidStep = 0;
  let unsayTries = 0;
  let finished = false;
  let drag = null;
  const chips = new Map();

  function setBeat(name) {
    beat = name;
    scene.dataset.beat = name;
  }

  function buildLine(payload) {
    const p = document.createElement('p');
    p.className = 't04-line is-narration';
    const lines = Array.isArray(payload) ? payload : [payload];
    lines.forEach((text) => {
      const row = document.createElement('span');
      row.className = 't04-narr-row';
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

  async function showStill(src, variant) {
    stillArt.src = src;
    stillArt.classList.toggle('is-home', variant === 'home');
    stillArt.classList.toggle('is-wide', variant === 'wide');
    stillHit.hidden = false;
    stillHit.classList.remove('is-out', 'is-dim');
    await wait(40);
    stillHit.classList.add('is-in');
  }

  function setPlanNote(lines) {
    planNote.replaceChildren();
    const texts = Array.isArray(lines) ? lines : [lines];
    texts.forEach((text) => {
      const row = document.createElement('span');
      row.className = 't04-plan-note-row';
      row.textContent = text;
      planNote.append(row);
    });
    planNote.hidden = false;
    requestAnimationFrame(() => planNote.classList.add('is-in'));
  }

  function clearPlanNote() {
    planNote.classList.remove('is-in');
    planNote.hidden = true;
    planNote.replaceChildren();
  }

  function makeChip(spec, round) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = `t04-chip is-${spec.kind}`;
    chip.textContent = spec.label;
    chip.dataset.id = spec.id;
    chip.dataset.round = String(round);
    chip.draggable = false;
    if (spec.unsayable) chip.dataset.unsayable = '1';
    chip.style.setProperty('--rot', `${(Math.random() * 4 - 2).toFixed(2)}deg`);
    chips.set(spec.id, chip);
    return chip;
  }

  function restInTray(chip) {
    chip.classList.remove('is-dragging', 'is-snapped');
    chip.removeAttribute('data-slot');
    chip.style.position = '';
    chip.style.left = '';
    chip.style.top = '';
    chip.style.width = '';
    tray.append(chip);
  }

  function snapToSlot(chip, slot) {
    chip.classList.remove('is-dragging');
    chip.classList.add('is-snapped');
    chip.style.position = '';
    chip.style.left = '';
    chip.style.top = '';
    chip.style.width = '';
    chip.dataset.slot = slot.closest('.t04-day').dataset.day;
    slot.append(chip);
    window.setTimeout(() => chip.classList.remove('is-snapped'), 320);
  }

  function round1Placed() {
    return TRACK_04_ROUND1.every((spec) => chips.get(spec.id)?.dataset.slot);
  }

  function slotFromPoint(x, y) {
    return slots.find((slot) => pointInRect(x, y, slot.getBoundingClientRect()));
  }

  function moveDrag(clientX, clientY) {
    if (!drag) return;
    const board = paper.getBoundingClientRect();
    const width = drag.chip.offsetWidth;
    const height = drag.chip.offsetHeight;
    let x = clientX - board.left + paper.scrollLeft - drag.offsetX;
    let y = clientY - board.top + paper.scrollTop - drag.offsetY;
    x = Math.min(Math.max(8, x), paper.scrollWidth - width - 8);
    y = Math.min(Math.max(8, y), paper.scrollHeight - height - 8);
    drag.chip.style.left = `${x}px`;
    drag.chip.style.top = `${y}px`;
    slots.forEach((slot) => {
      slot.classList.toggle('is-hot', pointInRect(clientX, clientY, slot.getBoundingClientRect()));
    });
  }

  function bounceUnsaid(chip) {
    restInTray(chip);
    chip.classList.remove('is-bounce');
    void chip.offsetWidth;
    chip.classList.add('is-bounce');
    window.setTimeout(() => chip.classList.remove('is-bounce'), 420);
  }

  async function afterUnsaidTry() {
    unsayTries += 1;
    if (unsayTries === 2) {
      setPlanNote(TRACK_04_NO_SLOT);
      return;
    }
    if (unsayTries < 3) return;
    locked = true;
    setBeat('planCrowd');
    planner.classList.add('is-crowded');
    const unsaid = chips.get('unsaid');
    if (unsaid) restInTray(unsaid);
    await wait(reduced ? 280 : 720);
    clearPlanNote();
    await wait(80);
    setPlanNote(TRACK_04_LEFT_OUT);
    locked = false;
  }

  function endDrag(clientX, clientY) {
    if (!drag) return;
    const chip = drag.chip;
    const unsayable = chip.dataset.unsayable === '1';
    planner.classList.remove('is-dragging');
    slots.forEach((slot) => slot.classList.remove('is-hot'));
    try {
      chip.releasePointerCapture(drag.pointerId);
    } catch {
      /* already released */
    }
    const slot = slotFromPoint(clientX, clientY);
    drag = null;
    if (unsayable) {
      bounceUnsaid(chip);
      afterUnsaidTry();
      return;
    }
    if (slot) snapToSlot(chip, slot);
    else restInTray(chip);
    if (beat === 'plan1' && round1Placed()) {
      setBeat('plan1Ready');
      setPlanNote(TRACK_04_PLAN1_DONE);
    }
  }

  function startDrag(event, chip) {
    if (locked || drag) return;
    if (beat !== 'plan1' && beat !== 'plan2') return;
    if (chip.classList.contains('is-squeeze')) return;
    event.preventDefault();
    const rect = chip.getBoundingClientRect();
    chip.setPointerCapture(event.pointerId);
    floatLayer.append(chip);
    chip.classList.add('is-dragging');
    chip.style.position = 'absolute';
    chip.style.width = `${rect.width}px`;
    planner.classList.add('is-dragging');
    const board = paper.getBoundingClientRect();
    drag = {
      chip,
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };
    chip.style.left = `${rect.left - board.left + paper.scrollLeft}px`;
    chip.style.top = `${rect.top - board.top + paper.scrollTop}px`;
  }

  function injectSqueeze(hostChip, label, kind) {
    const slot = hostChip.closest('.t04-day-slot');
    if (!slot) return;
    const squeeze = document.createElement('span');
    squeeze.className = `t04-chip is-${kind} is-squeeze`;
    squeeze.textContent = label;
    squeeze.dataset.id = `squeeze-${label}`;
    slot.append(squeeze);
  }

  async function enterPlanner() {
    locked = true;
    setBeat('plan1');
    stillHit.classList.add('is-out');
    await fadeOutLines();
    await wait(420);
    stillHit.hidden = true;
    planner.hidden = false;
    await wait(40);
    planner.classList.add('is-in');
    TRACK_04_ROUND1.forEach((spec) => {
      tray.append(makeChip(spec, 1));
    });
    locked = false;
  }

  async function enterRound2() {
    locked = true;
    setBeat('plan2');
    clearPlanNote();
    const eat = chips.get('eat');
    const weekend = chips.get('weekend');
    if (eat) injectSqueeze(eat, '工作', 'label');
    if (weekend) injectSqueeze(weekend, '临时有事', 'receipt');
    TRACK_04_ROUND2.forEach((spec, index) => {
      const chip = makeChip(spec, 2);
      chip.classList.add('is-enter');
      chip.style.setProperty('--enter-delay', `${index * 70}ms`);
      tray.append(chip);
    });
    await wait(40);
    setPlanNote(TRACK_04_PLAN2_HINT);
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
    if (locked || finished || drag) return;

    if (beat === 'opening') {
      locked = true;
      if (openingGroup < TRACK_04_OPENING.length - 1) {
        await showOpeningGroup(openingGroup + 1);
        locked = false;
        return;
      }
      opening.classList.add('is-out');
      openPlate.classList.add('is-out');
      await wait(720);
      opening.hidden = true;
      openPlate.hidden = true;
      setBeat('homeStill');
      await showStill('/canon/track04-home-life.png', 'home');
      locked = false;
      return;
    }

    if (beat === 'homeStill') {
      locked = true;
      stillHit.classList.add('is-dim');
      homeStep = 0;
      setBeat('homeLines');
      await showLine(TRACK_04_HOME[0]);
      locked = false;
      return;
    }

    if (beat === 'homeLines') {
      locked = true;
      homeStep += 1;
      if (homeStep < TRACK_04_HOME.length) {
        await showLine(TRACK_04_HOME[homeStep]);
        locked = false;
        return;
      }
      await enterPlanner();
      return;
    }

    if (beat === 'plan1Ready') {
      await enterRound2();
      return;
    }

    if (beat === 'planCrowd') {
      locked = true;
      planner.classList.add('is-out');
      clearPlanNote();
      await wait(720);
      planner.hidden = true;
      setBeat('unsaidStill');
      await showStill('/canon/track04-unsaid.png', 'wide');
      locked = false;
      return;
    }

    if (beat === 'unsaidStill') {
      locked = true;
      stillHit.classList.add('is-dim');
      unsaidStep = 0;
      setBeat('unsaidLines');
      await showLine(TRACK_04_UNSAID[0]);
      locked = false;
      return;
    }

    if (beat === 'unsaidLines') {
      locked = true;
      if (unsaidStep === 0) {
        unsaidStep = 1;
        await showLine(TRACK_04_UNSAID[1]);
        locked = false;
        return;
      }
      stillHit.classList.add('is-out');
      await fadeOutLines();
      await wait(620);
      stillHit.hidden = true;
      scene.classList.add('is-navy');
      setBeat('winterLead');
      await wait(280);
      await showLine(TRACK_04_WINTER_LEAD);
      locked = false;
      return;
    }

    if (beat === 'winterLead') {
      locked = true;
      await fadeOutLines();
      scene.classList.remove('is-navy');
      setBeat('winterStill');
      await showStill('/canon/track04-ending-winter.png', 'wide');
      locked = false;
      return;
    }

    if (beat === 'winterStill') {
      locked = true;
      stillHit.classList.add('is-dim');
      setBeat('winterLines');
      await showLine(TRACK_04_WINTER);
      locked = false;
      return;
    }

    if (beat === 'winterLines') {
      await playCoda();
    }
  }

  paper.addEventListener(
    'pointerdown',
    (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      const chip = event.target.closest('.t04-chip');
      if (!chip) return;
      startDrag(event, chip);
    },
    { passive: false },
  );

  paper.addEventListener(
    'pointermove',
    (event) => {
      if (!drag || event.pointerId !== drag.pointerId) return;
      event.preventDefault();
      moveDrag(event.clientX, event.clientY);
    },
    { passive: false },
  );

  paper.addEventListener('pointerup', (event) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    endDrag(event.clientX, event.clientY);
  });

  paper.addEventListener('pointercancel', (event) => {
    if (!drag) return;
    endDrag(event.clientX, event.clientY);
  });

  window.addEventListener('resize', () => {
    if (!drag) return;
    const chip = drag.chip;
    restInTray(chip);
    drag = null;
    planner.classList.remove('is-dragging');
    slots.forEach((slot) => slot.classList.remove('is-hot'));
  });

  function bindAdvance(el, beats) {
    el.addEventListener('click', (event) => {
      event.stopPropagation();
      if (beats.includes(beat)) advance();
    });
  }

  bindAdvance(stillHit, [
    'homeStill',
    'homeLines',
    'unsaidStill',
    'unsaidLines',
    'winterStill',
    'winterLines',
  ]);

  scene.addEventListener('pointerup', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (drag) return;
    if (event.target.closest('.reset-progress, .t04-still-hit, .t04-back')) return;
    if (event.target.closest('.t04-chip') && (beat === 'plan1' || beat === 'plan2')) return;
    if (beat === 'plan1' || beat === 'plan2' || beat === 'coda') return;
    advance();
  });

  window.addEventListener('keydown', function onKey(event) {
    if (!document.body.contains(scene)) {
      window.removeEventListener('keydown', onKey);
      return;
    }
    if (event.key !== ' ' && event.key !== 'Enter') return;
    if (beat === 'coda' || beat === 'plan1' || beat === 'plan2') return;
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
