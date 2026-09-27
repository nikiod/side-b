import { cloneTemplate } from '../core/dom.js';
import { CANON_ASSETS, asset } from '../core/assets.js';
import {
  TRACK_01_MESSAGES,
  HE_REPLY,
  DAY_ROUTE_SCRAPS,
  FIRST_MEETING_LINES,
  NOODLE_ENTRANCE_LINES,
  NOODLE_INTERIOR_PROMPT,
  NOODLE_INTERIOR_LIN_PROMPT,
  NOODLE_INTERIOR_CHOICES,
  NOODLE_INTERIOR_BRANCHES,
  EXHIBIT_ITEMS,
  CINEMA_OPENING,
  CINEMA_ENDING,
  DINNER_PROMPT,
  DINNER_CHOICES,
  DINNER_BRANCHES,
  DINNER_CUE,
  POLAROID_LINES,
} from '../data/track01.js';

const CORRECT = DAY_ROUTE_SCRAPS.map((scrap) => scrap.id);
const EXHIBIT_HALL_SRC = asset('canon/track01-scene04-indie-exhibition.png');
const CINEMA_SRC = asset('canon/track01-scene05-cinema.png');
const DINNER_SRC = asset('canon/track01-scene06-dinner.png');

function watchCanonImage(src) {
  const img = new Image();
  img.onerror = () => {
    console.error(`[SIDE B] image failed: ${src}`);
  };
  img.src = src;
}

function shuffle(list) {
  const next = [...list];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  if (next.every((scrap, index) => scrap.id === CORRECT[index])) {
    next.reverse();
  }
  return next;
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function scrapMarkup(scrap) {
  const times = scrap.times.map((time) => `<span class="scrap-time">${time}</span>`).join('');
  return `<span class="scrap-title">${scrap.title}</span>${times}`;
}

export function mountTrack01(root, { save, onSave, onComplete } = {}) {
  const scene = cloneTemplate('tpl-track-01');
  const phone = scene.querySelector('.phone');
  const lines = scene.querySelector('.phone-lines');
  const fromEl = scene.querySelector('.phone-from');
  const reply = scene.querySelector('.phone-reply');
  const route = scene.querySelector('.route');
  const pile = scene.querySelector('.scrap-pile');
  const slotsEl = scene.querySelector('.route-slots');
  const note = scene.querySelector('.route-note');
  const meeting = scene.querySelector('.meeting');
  const meetingLines = scene.querySelector('.meeting-lines');
  const noodleEntrance = scene.querySelector('.noodle-entrance');
  const noodleLines = scene.querySelector('.noodle-lines');
  const noodleInterior = scene.querySelector('.noodle-interior');
  const interiorLines = scene.querySelector('.interior-lines');
  const interiorChoices = scene.querySelector('.interior-choices');
  const interiorHint = scene.querySelector('.interior-hint');
  const exhibitHall = scene.querySelector('.exhibit-hall');
  const exhibitHotspots = scene.querySelector('.exhibit-hotspots');
  const exhibitHint = scene.querySelector('.exhibit-hint');
  const exhibitView = scene.querySelector('.exhibit-view');
  const exhibitLarge = scene.querySelector('.exhibit-large');
  const exhibitViewLines = scene.querySelector('.exhibit-view-lines');
  const cinema = scene.querySelector('.cinema');
  const cinemaNote = scene.querySelector('.cinema-note');
  const cinemaTime = scene.querySelector('.cinema-time');
  const cinemaCaption = scene.querySelector('.cinema-caption');
  const dinner = scene.querySelector('.dinner');
  const dinnerLines = scene.querySelector('.dinner-lines');
  const dinnerChoices = scene.querySelector('.dinner-choices');
  const dinnerCue = scene.querySelector('.dinner-cue');
  const dayPolaroid = scene.querySelector('.day-polaroid');
  const polaroidHit = scene.querySelector('.day-polaroid-hit');
  const polaroidPhoto = scene.querySelector('.day-polaroid-photo');
  const polaroidLines = [...scene.querySelectorAll('.day-polaroid-line')];

  fromEl.textContent = TRACK_01_MESSAGES[0].from;
  reply.textContent = HE_REPLY;
  reply.hidden = true;

  TRACK_01_MESSAGES.forEach((message, index) => {
    const p = document.createElement('p');
    p.className = 'phone-line';
    p.dataset.index = String(index);
    p.textContent = message.text;
    lines.append(p);
  });

  FIRST_MEETING_LINES.forEach((line, index) => {
    const p = document.createElement('p');
    const side = line.speaker === '许遥' ? 'left' : 'right';
    p.className = `meeting-line is-${side}`;
    p.dataset.index = String(index);
    p.innerHTML = `<span class="meeting-speaker">${line.speaker}</span><span class="meeting-text">${line.text}</span>`;
    meetingLines.append(p);
  });

  NOODLE_ENTRANCE_LINES.forEach((line, index) => {
    const p = document.createElement('p');
    const side = noodleSide(line.speaker);
    p.className = `noodle-line is-${side}`;
    p.dataset.index = String(index);
    p.innerHTML = `<span class="meeting-speaker">${line.speaker}</span><span class="meeting-text">${line.text}</span>`;
    noodleLines.append(p);
  });

  function interiorLineMarkup(line) {
    const p = document.createElement('p');
    p.className = `interior-line is-${noodleSide(line.speaker)}`;
    p.innerHTML = `<span class="meeting-speaker">${line.speaker}</span><span class="meeting-text">${line.text}</span>`;
    return p;
  }

  NOODLE_INTERIOR_CHOICES.forEach((choice) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'interior-choice';
    btn.dataset.id = choice.id;
    btn.textContent = choice.text;
    interiorChoices.append(btn);
  });

  DINNER_CHOICES.forEach((choice) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'dinner-choice';
    btn.dataset.id = choice.id;
    btn.textContent = choice.text;
    dinnerChoices.append(btn);
  });

  function dinnerLineMarkup(line) {
    const p = document.createElement('p');
    p.className = `dinner-line is-${noodleSide(line.speaker)}`;
    p.innerHTML = `<span class="meeting-speaker">${line.speaker}</span><span class="meeting-text">${line.text}</span>`;
    return p;
  }

  watchCanonImage(EXHIBIT_HALL_SRC);
  watchCanonImage(CINEMA_SRC);
  watchCanonImage(DINNER_SRC);
  watchCanonImage(CANON_ASSETS.firstDatePhoto);
  polaroidPhoto.src = CANON_ASSETS.firstDatePhoto;
  polaroidLines.forEach((line, index) => {
    line.textContent = POLAROID_LINES[index] || '';
  });
  EXHIBIT_ITEMS.forEach((item) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `exhibit-hotspot is-${item.id}`;
    btn.dataset.id = item.id;
    btn.textContent = item.label;
    btn.setAttribute('aria-label', item.label);
    const pick = (event) => {
      event.preventDefault();
      event.stopPropagation();
      openExhibitItem(item.id);
    };
    btn.addEventListener('click', pick);
    btn.addEventListener('pointerup', (event) => {
      event.stopPropagation();
    });
    exhibitHotspots.append(btn);
    watchCanonImage(item.src);
  });
  exhibitLarge.addEventListener('error', () => {
    const failed = exhibitLarge.getAttribute('src');
    if (failed) console.error(`[SIDE B] image failed: ${failed}`);
  });

  for (let i = 0; i < DAY_ROUTE_SCRAPS.length; i += 1) {
    const slot = document.createElement('div');
    slot.className = 'route-slot';
    slot.dataset.index = String(i);
    slotsEl.append(slot);
  }

  const placements = new Array(DAY_ROUTE_SCRAPS.length).fill(null);

  shuffle(DAY_ROUTE_SCRAPS).forEach((scrap, index) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `scrap scrap-${scrap.kind}`;
    btn.dataset.id = scrap.id;
    btn.style.setProperty('--n', String(index));
    btn.innerHTML = scrapMarkup(scrap);
    pile.append(btn);
  });

  const scraps = [...pile.querySelectorAll('.scrap')];
  const slots = [...slotsEl.querySelectorAll('.route-slot')];

  function occupiedSlot(id) {
    return placements.findIndex((value) => value === id);
  }

  function firstOpenSlot() {
    return placements.findIndex((value) => value == null);
  }

  function place(id, slotIndex) {
    const el = scraps.find((node) => node.dataset.id === id);
    const current = occupiedSlot(id);
    if (current !== -1) placements[current] = null;
    if (placements[slotIndex]) {
      const displaced = scraps.find((node) => node.dataset.id === placements[slotIndex]);
      pile.append(displaced);
      displaced.classList.remove('is-placed');
    }
    placements[slotIndex] = id;
    slots[slotIndex].append(el);
    el.classList.add('is-placed');
  }

  function unplace(id) {
    const current = occupiedSlot(id);
    if (current === -1) return;
    placements[current] = null;
    const el = scraps.find((node) => node.dataset.id === id);
    pile.append(el);
    el.classList.remove('is-placed');
  }

  let noteTimer = 0;

  function setNote(text) {
    window.clearTimeout(noteTimer);
    if (!text) {
      if (!note.textContent || note.hidden) {
        note.hidden = true;
        note.textContent = '';
        note.classList.remove('is-fading');
        return;
      }
      note.classList.add('is-fading');
      noteTimer = window.setTimeout(() => {
        note.hidden = true;
        note.textContent = '';
        note.classList.remove('is-fading');
      }, 320);
      return;
    }
    note.classList.remove('is-fading');
    note.hidden = false;
    note.textContent = text;
  }

  function resolveIfReady() {
    if (scene.classList.contains('is-routed')) return;
    if (placements.some((value) => value == null)) {
      setNote('');
      return;
    }
    if (placements.join() !== CORRECT.join()) {
      scraps.forEach((el) => {
        el.disabled = false;
      });
      scene.classList.remove('is-routed');
      setNote('时间好像对不上。');
      return;
    }
    scraps.forEach((el) => {
      el.disabled = true;
    });
    scene.classList.add('is-routed');
    setNote('这样可以。');
    onSave?.({
      track01Started: true,
      firstMeetingCompleted: true,
      routeSolved: true,
    });
    enterNoodleEntrance();
  }

  function bindScrap(el) {
    let dragging = false;
    let originX = 0;
    let originY = 0;
    let startX = 0;
    let startY = 0;

    el.addEventListener('pointerdown', (event) => {
      if (scene.classList.contains('is-routed') || el.disabled) return;
      if (note.textContent === '时间好像对不上。') setNote('');
      dragging = false;
      originX = event.clientX;
      originY = event.clientY;
      const rect = el.getBoundingClientRect();
      startX = rect.left;
      startY = rect.top;
      el.setPointerCapture(event.pointerId);
      el.classList.add('is-hold');
    });

    el.addEventListener('pointermove', (event) => {
      if (!el.classList.contains('is-hold')) return;
      const dx = event.clientX - originX;
      const dy = event.clientY - originY;
      if (Math.abs(dx) + Math.abs(dy) > 8) dragging = true;
      if (!dragging) return;
      el.classList.add('is-dragging');
      el.style.setProperty('--drag-x', `${startX + dx}px`);
      el.style.setProperty('--drag-y', `${startY + dy}px`);
    });

    el.addEventListener('pointerup', (event) => {
      if (!el.classList.contains('is-hold')) return;
      el.classList.remove('is-hold', 'is-dragging');
      el.style.removeProperty('--drag-x');
      el.style.removeProperty('--drag-y');

      if (dragging) {
        const hit = slots.find((slot) => {
          const box = slot.getBoundingClientRect();
          return (
            event.clientX >= box.left &&
            event.clientX <= box.right &&
            event.clientY >= box.top &&
            event.clientY <= box.bottom
          );
        });
        if (hit) place(el.dataset.id, Number(hit.dataset.index));
        else if (occupiedSlot(el.dataset.id) !== -1) unplace(el.dataset.id);
      } else if (occupiedSlot(el.dataset.id) !== -1) {
        unplace(el.dataset.id);
      } else {
        const open = firstOpenSlot();
        if (open !== -1) place(el.dataset.id, open);
      }
      resolveIfReady();
    });
  }

  scraps.forEach(bindScrap);

  let messageIndex = 0;
  let meetingIndex = -1;
  let meetingLocked = false;
  let meetingDone = Boolean(save?.firstMeetingCompleted);
  let noodleIndex = -1;
  let noodleLocked = false;
  let noodleStarted = false;
  let noodleDone = Boolean(save?.zhaimianEntranceCompleted);
  let interiorStarted = false;
  let interiorLocked = false;
  let interiorDone = Boolean(save?.zhaimianInteriorCompleted);
  let interiorQueue = [];
  let interiorQueueIndex = -1;
  let interiorChoiceId = save?.zhaimianInteriorChoice || '';
  let interiorChoicesOpen = false;
  let exhibitStarted = false;
  let exhibitLocked = false;
  let exhibitDone = Boolean(save?.exhibitCompleted);
  let exhibitItem = null;
  let exhibitLineIndex = -1;
  let exhibitViewOpen = false;
  let cinemaStarted = false;
  let cinemaDone = Boolean(save?.cinemaCompleted);
  let cinemaCanEnd = false;
  let dinnerStarted = false;
  let dinnerLocked = false;
  let dinnerDone = Boolean(save?.dinnerCompleted);
  let dinnerChoiceId = save?.dinnerChoice || '';
  let dinnerChoicesOpen = false;
  let dinnerQueue = [];
  let dinnerQueueIndex = -1;
  let dinnerCueOpen = false;
  let polaroidStarted = false;
  let polaroidReady = false;

  function showMessage(index) {
    messageIndex = index;
    lines.querySelectorAll('.phone-line').forEach((line, i) => {
      line.classList.toggle('is-in', i <= index);
    });
    if (index >= TRACK_01_MESSAGES.length - 1) {
      reply.hidden = false;
      reply.classList.add('is-in');
    }
  }

  function revealMeetingLine(index) {
    meetingIndex = index;
    meetingLines.querySelectorAll('.meeting-line').forEach((line, i) => {
      line.classList.toggle('is-in', i === index);
    });
  }

  function placeSolvedRoute() {
    CORRECT.forEach((id, index) => place(id, index));
    scraps.forEach((el) => {
      el.disabled = true;
    });
    scene.classList.add('is-routed');
    setNote('这样可以。');
  }

  function noodleSide(speaker) {
    if (speaker === '许遥') return 'xu';
    if (speaker === '林禾') return 'lin';
    return '';
  }

  function revealNoodleLine(index) {
    noodleIndex = index;
    noodleLines.querySelectorAll('.noodle-line').forEach((line, i) => {
      line.classList.toggle('is-in', i === index);
    });
  }

  async function enterNoodleEntrance({ immediate = false } = {}) {
    if (noodleStarted) return;
    noodleStarted = true;

    if (!immediate) {
      await wait(800);
      route.classList.add('is-out');
      route.setAttribute('aria-hidden', 'true');
      scene.classList.add('is-noodle');
      await wait(400);
    } else {
      scene.classList.add('is-shot', 'is-wide', 'is-noodle');
      phone.classList.add('is-gone');
      meeting.classList.add('is-out');
      route.classList.add('is-out');
      route.setAttribute('aria-hidden', 'true');
    }

    scene.dataset.beat = 'zhaimianEntrance';
    noodleEntrance.classList.add('is-in');
    noodleEntrance.setAttribute('aria-hidden', 'false');

    if (noodleDone) {
      await enterNoodleInterior({ immediate: true, completed: interiorDone });
      return;
    }

    await wait(500);
    revealNoodleLine(0);
  }

  async function advanceNoodle() {
    if (scene.dataset.beat !== 'zhaimianEntrance' || noodleDone || noodleLocked) return;
    if (noodleIndex < 0) return;

    noodleLocked = true;
    if (noodleIndex >= NOODLE_ENTRANCE_LINES.length - 1) {
      await finishNoodleEntrance();
      return;
    }

    revealNoodleLine(noodleIndex + 1);
    await wait(360);
    if (noodleIndex >= NOODLE_ENTRANCE_LINES.length - 1) {
      await finishNoodleEntrance();
      return;
    }
    noodleLocked = false;
  }

  async function finishNoodleEntrance() {
    await wait(800);
    noodleDone = true;
    onSave?.({
      track01Started: true,
      firstMeetingCompleted: true,
      routeSolved: true,
      zhaimianEntranceCompleted: true,
    });
    await enterNoodleInterior();
  }

  function showInteriorLine(line) {
    showInteriorLines(line ? [line] : []);
  }

  function showInteriorLines(lines) {
    interiorLines.replaceChildren();
    lines.forEach((line) => {
      const node = interiorLineMarkup(line);
      interiorLines.append(node);
      requestAnimationFrame(() => {
        node.classList.add('is-in');
      });
    });
  }

  function setInteriorChoicesOpen(open) {
    interiorChoicesOpen = open;
    interiorChoices.hidden = !open;
    interiorChoices.setAttribute('aria-hidden', open ? 'false' : 'true');
  }

  function setInteriorHint(open) {
    interiorHint.hidden = !open;
    interiorHint.setAttribute('aria-hidden', open ? 'false' : 'true');
    interiorHint.classList.toggle('is-in', open);
  }

  function persistInterior(extra = {}) {
    onSave?.({
      track01Started: true,
      firstMeetingCompleted: true,
      routeSolved: true,
      zhaimianEntranceCompleted: true,
      zhaimianInteriorCompleted: interiorDone,
      zhaimianInteriorChoice: interiorChoiceId,
      ...extra,
    });
  }

  async function enterNoodleInterior({ immediate = false, completed = false } = {}) {
    if (interiorStarted && !immediate) return;
    interiorStarted = true;

    if (!immediate) {
      await wait(700);
      noodleEntrance.classList.remove('is-in');
      noodleEntrance.setAttribute('aria-hidden', 'true');
      scene.classList.add('is-interior');
      await wait(520);
    } else {
      noodleEntrance.classList.remove('is-in');
      noodleEntrance.setAttribute('aria-hidden', 'true');
      scene.classList.add('is-shot', 'is-wide', 'is-noodle', 'is-interior');
    }

    scene.dataset.beat = 'zhaimianInterior';
    noodleInterior.classList.add('is-in');
    noodleInterior.setAttribute('aria-hidden', 'false');

    setInteriorHint(false);
    if (completed || interiorDone) {
      interiorDone = true;
      interiorLines.replaceChildren();
      setInteriorChoicesOpen(false);
      setInteriorHint(true);
      return;
    }

    await wait(500);
    showInteriorLines([NOODLE_INTERIOR_PROMPT, NOODLE_INTERIOR_LIN_PROMPT]);
  }

  async function pickInteriorChoice(id) {
    if (interiorDone || interiorLocked || !interiorChoicesOpen) return;
    const choice = NOODLE_INTERIOR_CHOICES.find((item) => item.id === id);
    if (!choice) return;

    interiorLocked = true;
    interiorChoiceId = id;
    setInteriorChoicesOpen(false);
    persistInterior();
    interiorQueue = [...NOODLE_INTERIOR_BRANCHES[id]];
    interiorQueueIndex = 0;
    showInteriorLine(interiorQueue[0]);
    await wait(360);
    if (interiorQueue.length === 1) {
      await wait(480);
      interiorLines.replaceChildren();
      setInteriorHint(true);
    }
    interiorLocked = false;
  }

  async function finishInterior() {
    if (!interiorDone) {
      interiorDone = true;
      persistInterior({ zhaimianInteriorCompleted: true });
    }
    await enterExhibit();
  }

  function persistExhibit(extra = {}) {
    onSave?.({
      track01Started: true,
      firstMeetingCompleted: true,
      routeSolved: true,
      zhaimianEntranceCompleted: true,
      zhaimianInteriorCompleted: true,
      zhaimianInteriorChoice: interiorChoiceId,
      exhibitCompleted: exhibitDone,
      exhibitSeen: exhibitItem?.id || save?.exhibitSeen || '',
      ...extra,
    });
  }

  function setExhibitHint(open) {
    exhibitHint.hidden = !open;
    exhibitHint.setAttribute('aria-hidden', open ? 'false' : 'true');
    exhibitHint.classList.toggle('is-in', open);
  }

  function showExhibitLine(line) {
    exhibitViewLines.replaceChildren();
    if (!line) return;
    const p = document.createElement('p');
    p.className = `exhibit-view-line is-${noodleSide(line.speaker)}`;
    p.innerHTML = `<span class="meeting-speaker">${line.speaker}</span><span class="meeting-text">${line.text}</span>`;
    exhibitViewLines.append(p);
    requestAnimationFrame(() => {
      p.classList.add('is-in');
    });
  }

  async function enterExhibit({ immediate = false, completed = false } = {}) {
    if (exhibitStarted && !immediate) return;
    exhibitStarted = true;

    setInteriorHint(false);
    noodleInterior.classList.remove('is-in');
    noodleInterior.setAttribute('aria-hidden', 'true');

    if (!immediate) {
      scene.classList.add('is-exhibit');
      await wait(520);
    } else {
      scene.classList.add('is-shot', 'is-wide', 'is-noodle', 'is-interior', 'is-exhibit');
      phone.classList.add('is-gone');
      meeting.classList.add('is-out');
      route.classList.add('is-out');
    }

    scene.dataset.beat = 'exhibit';
    exhibitHall.classList.add('is-in');
    exhibitHall.setAttribute('aria-hidden', 'false');

    if (completed || exhibitDone) {
      exhibitDone = true;
      exhibitHotspots.classList.add('is-in');
      setExhibitHint(true);
      return;
    }

    await wait(360);
    exhibitHotspots.classList.add('is-in');
  }

  async function openExhibitItem(id) {
    if (exhibitDone || exhibitLocked || exhibitViewOpen) return;
    const item = EXHIBIT_ITEMS.find((entry) => entry.id === id);
    if (!item) return;

    exhibitLocked = true;
    exhibitItem = item;
    exhibitLineIndex = 0;
    exhibitViewOpen = true;
    setExhibitHint(false);
    exhibitLarge.src = item.src;
    exhibitView.hidden = false;
    exhibitView.classList.add('is-in');
    persistExhibit({ exhibitSeen: item.id });
    showExhibitLine(item.lines[0]);
    await wait(320);
    exhibitLocked = false;
  }

  async function closeExhibitView() {
    exhibitView.classList.remove('is-in');
    exhibitView.hidden = true;
    exhibitViewLines.replaceChildren();
    exhibitViewOpen = false;
    exhibitLineIndex = -1;
    setExhibitHint(true);
  }

  async function advanceExhibit() {
    if (scene.dataset.beat !== 'exhibit' || exhibitLocked) return;
    if (!exhibitHint.hidden) {
      await finishExhibit();
      return;
    }
    if (!exhibitViewOpen || !exhibitItem) return;

    exhibitLocked = true;
    if (exhibitLineIndex >= exhibitItem.lines.length - 1) {
      await wait(280);
      await closeExhibitView();
      exhibitLocked = false;
      return;
    }

    exhibitLineIndex += 1;
    showExhibitLine(exhibitItem.lines[exhibitLineIndex]);
    await wait(280);
    exhibitLocked = false;
  }

  async function finishExhibit() {
    if (cinemaStarted) return;
    if (!exhibitDone) {
      exhibitDone = true;
      persistExhibit({ exhibitCompleted: true });
    }
    await enterCinema();
  }

  function persistCinema(extra = {}) {
    onSave?.({
      track01Started: true,
      firstMeetingCompleted: true,
      routeSolved: true,
      zhaimianEntranceCompleted: true,
      zhaimianInteriorCompleted: true,
      zhaimianInteriorChoice: interiorChoiceId,
      exhibitCompleted: true,
      exhibitSeen: exhibitItem?.id || save?.exhibitSeen || '',
      cinemaCompleted: cinemaDone,
      ...extra,
    });
  }

  function showCinemaNote(entry) {
    cinemaTime.textContent = entry.time;
    cinemaCaption.textContent = entry.text;
    cinemaNote.hidden = false;
    cinemaNote.classList.remove('is-in');
    requestAnimationFrame(() => {
      cinemaNote.classList.add('is-in');
    });
  }

  function hideCinemaNote() {
    cinemaNote.classList.remove('is-in');
  }

  function leaveExhibitHall() {
    setExhibitHint(false);
    exhibitView.classList.remove('is-in');
    exhibitView.hidden = true;
    exhibitViewLines.replaceChildren();
    exhibitViewOpen = false;
    exhibitLineIndex = -1;
    exhibitHall.classList.remove('is-in');
    exhibitHall.setAttribute('aria-hidden', 'true');
  }

  async function enterCinema({ immediate = false, completed = false } = {}) {
    if (cinemaStarted && !immediate) return;
    cinemaStarted = true;
    cinemaCanEnd = false;

    leaveExhibitHall();
    scene.dataset.beat = 'cinema';

    if (!immediate) {
      scene.classList.add('is-cinema');
      await wait(700);
    } else {
      scene.classList.add('is-shot', 'is-wide', 'is-noodle', 'is-interior', 'is-exhibit', 'is-cinema');
      phone.classList.add('is-gone');
      meeting.classList.add('is-out');
      route.classList.add('is-out');
      route.setAttribute('aria-hidden', 'true');
    }

    cinema.classList.add('is-in');
    cinema.setAttribute('aria-hidden', 'false');

    if (completed || cinemaDone) {
      cinemaDone = true;
      cinemaNote.hidden = true;
      return;
    }

    await wait(700);
    showCinemaNote(CINEMA_OPENING);
    await wait(1700);
    hideCinemaNote();
    await wait(520);
    await wait(1500);
    showCinemaNote(CINEMA_ENDING);
    cinemaCanEnd = true;
  }

  async function finishCinema() {
    if (!cinemaCanEnd || cinemaDone) return;
    cinemaCanEnd = false;
    cinemaDone = true;
    hideCinemaNote();
    persistCinema({ cinemaCompleted: true });
    await wait(520);
    cinemaNote.hidden = true;
    await enterDinner();
  }

  async function advanceCinema() {
    if (scene.dataset.beat !== 'cinema' || !cinemaCanEnd || cinemaDone) return;
    await finishCinema();
  }

  function persistDinner(extra = {}) {
    onSave?.({
      track01Started: true,
      firstMeetingCompleted: true,
      routeSolved: true,
      zhaimianEntranceCompleted: true,
      zhaimianInteriorCompleted: true,
      zhaimianInteriorChoice: interiorChoiceId,
      exhibitCompleted: true,
      exhibitSeen: exhibitItem?.id || save?.exhibitSeen || '',
      cinemaCompleted: true,
      dinnerCompleted: dinnerDone,
      dinnerChoice: dinnerChoiceId,
      ...extra,
    });
  }

  function showDinnerLine(line) {
    dinnerLines.replaceChildren();
    if (!line) return;
    const node = dinnerLineMarkup(line);
    dinnerLines.append(node);
    requestAnimationFrame(() => {
      node.classList.add('is-in');
    });
  }

  function setDinnerChoicesOpen(open) {
    dinnerChoicesOpen = open;
    dinnerChoices.hidden = !open;
    dinnerChoices.setAttribute('aria-hidden', open ? 'false' : 'true');
  }

  function showDinnerCue() {
    dinnerCueOpen = true;
    dinnerCue.hidden = false;
    dinnerCue.textContent = DINNER_CUE;
    requestAnimationFrame(() => {
      dinnerCue.classList.add('is-in');
    });
  }

  function hideDinnerCue() {
    dinnerCueOpen = false;
    dinnerCue.classList.remove('is-in');
    dinnerCue.hidden = true;
  }

  async function enterDinner({ immediate = false, settled = false } = {}) {
    if (dinnerStarted && !immediate) return;
    dinnerStarted = true;

    cinema.classList.remove('is-in');
    cinema.setAttribute('aria-hidden', 'true');
    cinemaNote.hidden = true;

    if (!immediate) {
      scene.classList.add('is-dinner');
      await wait(700);
    } else {
      scene.classList.add('is-shot', 'is-wide', 'is-noodle', 'is-interior', 'is-exhibit', 'is-cinema', 'is-dinner');
      phone.classList.add('is-gone');
      meeting.classList.add('is-out');
      route.classList.add('is-out');
      route.setAttribute('aria-hidden', 'true');
    }

    dinner.classList.add('is-in');
    dinner.setAttribute('aria-hidden', 'false');

    if (settled || dinnerDone) {
      dinnerDone = true;
      dinnerLines.replaceChildren();
      setDinnerChoicesOpen(false);
      hideDinnerCue();
      scene.dataset.beat = 'firstDayPolaroid';
      return;
    }

    scene.dataset.beat = 'dinner';
    setDinnerChoicesOpen(false);
    hideDinnerCue();
    await wait(500);
    showDinnerLine(DINNER_PROMPT);
    await wait(420);
    setDinnerChoicesOpen(true);
  }

  async function pickDinnerChoice(id) {
    if (dinnerDone || dinnerLocked || !dinnerChoicesOpen) return;
    const choice = DINNER_CHOICES.find((item) => item.id === id);
    if (!choice || !DINNER_BRANCHES[id]) return;

    dinnerLocked = true;
    dinnerChoiceId = id;
    setDinnerChoicesOpen(false);
    persistDinner();
    dinnerQueue = [...DINNER_BRANCHES[id]];
    dinnerQueueIndex = 0;
    showDinnerLine(dinnerQueue[0]);
    await wait(320);
    dinnerLocked = false;
  }

  async function advanceDinner() {
    if (scene.dataset.beat !== 'dinner' || dinnerLocked || dinnerDone) return;
    if (dinnerCueOpen) {
      await finishDinner();
      return;
    }
    if (dinnerChoicesOpen || dinnerQueueIndex < 0) return;

    dinnerLocked = true;
    if (dinnerQueueIndex >= dinnerQueue.length - 1) {
      dinnerLines.replaceChildren();
      dinnerQueueIndex = -1;
      await wait(700);
      showDinnerCue();
      dinnerLocked = false;
      return;
    }

    dinnerQueueIndex += 1;
    showDinnerLine(dinnerQueue[dinnerQueueIndex]);
    await wait(320);
    dinnerLocked = false;
  }

  async function finishDinner() {
    if (!dinnerCueOpen || dinnerDone) return;
    dinnerDone = true;
    dinnerLines.replaceChildren();
    hideDinnerCue();
    persistDinner({ dinnerCompleted: true });
    await enterPolaroid();
  }

  async function startFromDinner() {
    root.replaceChildren(scene);
    await wait(40);
    await enterDinner({ immediate: true });
  }

  async function startFromPolaroid() {
    root.replaceChildren(scene);
    await wait(40);
    await enterPolaroid({ immediate: true });
  }

  async function enterPolaroid({ immediate = false } = {}) {
    if (polaroidStarted) return;
    polaroidStarted = true;
    polaroidReady = false;
    scene.dataset.beat = 'firstDayPolaroid';

    dinner.classList.remove('is-in');
    dinner.setAttribute('aria-hidden', 'true');
    dinnerLines.replaceChildren();
    setDinnerChoicesOpen(false);
    hideDinnerCue();

    if (!immediate) {
      scene.classList.add('is-polaroid');
      await wait(1200);
    } else {
      scene.classList.add('is-shot', 'is-wide', 'is-noodle', 'is-interior', 'is-exhibit', 'is-cinema', 'is-dinner', 'is-polaroid');
      phone.classList.add('is-gone');
      meeting.classList.add('is-out');
      route.classList.add('is-out');
      route.setAttribute('aria-hidden', 'true');
    }

    dayPolaroid.hidden = false;
    requestAnimationFrame(() => {
      dayPolaroid.classList.add('is-photo');
    });
    await wait(900);
    await wait(1000);
    showPolaroidLine(0);
    await wait(1000);
    showPolaroidLine(1);
    polaroidHit.disabled = false;
    polaroidReady = true;
  }

  function showPolaroidLine(index) {
    const line = polaroidLines[index];
    if (!line) return;
    line.hidden = false;
    requestAnimationFrame(() => {
      line.classList.add('is-in');
    });
  }

  function completePolaroid() {
    if (!polaroidReady) return;
    polaroidReady = false;
    polaroidHit.disabled = true;
    onComplete?.();
  }

  async function startFromExhibit() {
    root.replaceChildren(scene);
    await wait(40);
    await enterExhibit({ immediate: true, completed: true });
  }

  async function advanceInterior() {
    if (scene.dataset.beat !== 'zhaimianInterior' || interiorLocked) return;
    if (!interiorHint.hidden) {
      await finishInterior();
      return;
    }
    if (interiorChoicesOpen) return;
    if (interiorQueueIndex < 0 && !interiorDone) {
      interiorLocked = true;
      showInteriorLine(NOODLE_INTERIOR_PROMPT);
      setInteriorChoicesOpen(true);
      await wait(200);
      interiorLocked = false;
      return;
    }
    if (interiorDone || interiorQueueIndex < 0) return;

    interiorLocked = true;
    if (interiorQueueIndex >= interiorQueue.length - 1) {
      await wait(400);
      interiorLines.replaceChildren();
      setInteriorHint(true);
      interiorLocked = false;
      return;
    }

    interiorQueueIndex += 1;
    showInteriorLine(interiorQueue[interiorQueueIndex]);
    await wait(320);
    if (interiorQueueIndex >= interiorQueue.length - 1) {
      await wait(480);
      interiorLines.replaceChildren();
      setInteriorHint(true);
      interiorLocked = false;
      return;
    }
    interiorLocked = false;
  }

  async function startFromInterior() {
    root.replaceChildren(scene);
    await wait(40);
    phone.classList.add('is-gone');
    meeting.classList.add('is-out');
    route.classList.add('is-out');
    route.setAttribute('aria-hidden', 'true');
    await enterNoodleInterior({ immediate: true, completed: interiorDone });
  }

  async function startFromNoodleEntrance() {
    root.replaceChildren(scene);
    await wait(40);
    await enterNoodleEntrance({ immediate: true });
  }

  async function showRoute() {
    scene.dataset.beat = 'route';
    scene.classList.add('is-dim', 'is-wide');
    scene.classList.remove('is-close');
    meeting.classList.add('is-out');
    phone.classList.add('is-gone');
    await wait(520);
    meeting.classList.remove('is-in');
    route.classList.add('is-in');
    route.setAttribute('aria-hidden', 'false');
    if (save?.routeSolved) {
      placeSolvedRoute();
      if (!save?.zhaimianEntranceCompleted) enterNoodleEntrance();
    }
  }

  async function finishMeeting() {
    meetingDone = true;
    meetingLocked = true;
    onSave?.({
      track01Started: true,
      firstMeetingCompleted: true,
      routeSolved: false,
    });
    await wait(700);
    meetingLines.classList.add('is-out');
    scene.classList.add('is-dim');
    await wait(480);
    await showRoute();
  }

  async function advanceMeeting() {
    if (scene.dataset.beat !== 'meeting' || meetingDone || meetingLocked) return;
    const current = FIRST_MEETING_LINES[meetingIndex];
    if (!current) return;

    meetingLocked = true;
    if (current.pauseAfter) await wait(700);
    if (meetingIndex >= FIRST_MEETING_LINES.length - 1) {
      await finishMeeting();
      return;
    }
    revealMeetingLine(meetingIndex + 1);
    if (meetingIndex >= FIRST_MEETING_LINES.length - 1) {
      await finishMeeting();
      return;
    }
    meetingLocked = false;
  }

  async function showMeeting() {
    scene.dataset.beat = 'meeting';
    reply.classList.add('is-out');
    await wait(280);
    phone.classList.add('is-gone');
    scene.classList.remove('is-close');
    scene.classList.add('is-wide');
    await wait(1000);
    meeting.classList.add('is-in');
    meeting.setAttribute('aria-hidden', 'false');
    revealMeetingLine(0);
  }

  async function startFromRoute() {
    root.replaceChildren(scene);
    await wait(40);
    scene.classList.add('is-shot', 'is-wide', 'is-dim');
    phone.classList.add('is-gone');
    meeting.classList.add('is-out');
    await showRoute();
  }

  async function startFromMeeting() {
    root.replaceChildren(scene);
    await wait(40);
    scene.classList.add('is-shot', 'is-wide');
    phone.classList.add('is-gone');
    await showMeeting();
  }

  async function start() {
    root.replaceChildren(scene);
    await wait(40);
    scene.classList.add('is-shot', 'is-close');
    await wait(900);
    scene.dataset.beat = 'phone';
    phone.classList.add('is-in');
    showMessage(0);
    await wait(480);
    showMessage(1);
  }

  phone.addEventListener('click', (event) => {
    if (scene.dataset.beat !== 'phone') return;
    if (event.target.closest('.phone-reply')) {
      showMeeting();
      return;
    }
    if (messageIndex < TRACK_01_MESSAGES.length - 1) {
      showMessage(messageIndex + 1);
    }
  });

  interiorChoices.addEventListener('click', (event) => {
    const btn = event.target.closest('.interior-choice');
    if (!btn) return;
    event.stopPropagation();
    pickInteriorChoice(btn.dataset.id);
  });

  dinnerChoices.addEventListener('click', (event) => {
    const btn = event.target.closest('.dinner-choice');
    if (!btn) return;
    event.stopPropagation();
    pickDinnerChoice(btn.dataset.id);
  });

  polaroidHit.addEventListener('click', (event) => {
    event.stopPropagation();
    completePolaroid();
  });

  interiorHint.addEventListener('click', (event) => {
    event.stopPropagation();
    finishInterior();
  });

  exhibitHint.addEventListener('click', (event) => {
    event.stopPropagation();
    finishExhibit();
  });

  exhibitView.addEventListener('click', (event) => {
    event.stopPropagation();
    advanceExhibit();
  });

  scene.addEventListener('pointerup', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (event.target.closest('.reset-progress')) return;
    if (event.target.closest('.scrap')) return;
    if (event.target.closest('.phone')) return;
    if (event.target.closest('.interior-choice')) return;
    if (event.target.closest('.dinner-choice')) return;
    if (event.target.closest('.day-polaroid-hit')) return;
    if (event.target.closest('.exhibit-hotspot')) return;
    if (event.target.closest('.exhibit-hint')) return;
    if (scene.dataset.beat === 'firstDayPolaroid') return;
    if (scene.dataset.beat === 'dinner') {
      advanceDinner();
      return;
    }
    if (scene.dataset.beat === 'cinema') {
      advanceCinema();
      return;
    }
    if (scene.dataset.beat === 'exhibit') {
      advanceExhibit();
      return;
    }
    if (scene.dataset.beat === 'zhaimianInterior') {
      advanceInterior();
      return;
    }
    if (scene.dataset.beat === 'zhaimianEntrance') {
      advanceNoodle();
      return;
    }
    advanceMeeting();
  });

  const onKey = (event) => {
    if (event.key !== ' ' && event.key !== 'Enter') return;
    if (scene.dataset.beat === 'firstDayPolaroid') {
      event.preventDefault();
      return;
    }
    if (scene.dataset.beat === 'dinner') {
      event.preventDefault();
      advanceDinner();
      return;
    }
    if (scene.dataset.beat === 'cinema') {
      event.preventDefault();
      advanceCinema();
      return;
    }
    if (scene.dataset.beat === 'exhibit') {
      event.preventDefault();
      advanceExhibit();
      return;
    }
    if (scene.dataset.beat === 'zhaimianInterior') {
      event.preventDefault();
      advanceInterior();
      return;
    }
    if (scene.dataset.beat === 'zhaimianEntrance') {
      event.preventDefault();
      advanceNoodle();
      return;
    }
    if (scene.dataset.beat !== 'meeting') return;
    event.preventDefault();
    advanceMeeting();
  };
  window.addEventListener('keydown', onKey);
  const observer = new MutationObserver(() => {
    if (!document.body.contains(scene)) {
      window.removeEventListener('keydown', onKey);
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  if (save?.dinnerCompleted) {
    startFromPolaroid();
  } else if (save?.cinemaCompleted) {
    startFromDinner();
  } else if (save?.exhibitCompleted) {
    startFromExhibit();
  } else if (save?.zhaimianInteriorCompleted || save?.zhaimianEntranceCompleted) {
    startFromInterior();
  } else if (save?.routeSolved) {
    startFromRoute();
  } else if (save?.firstMeetingCompleted) {
    startFromRoute();
  } else if (save?.track01Started) {
    start();
  } else {
    start();
  }

  return scene;
}
