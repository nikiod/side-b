import { cloneTemplate } from '../core/dom.js';
import {
  TRACK_01_MESSAGES,
  HE_REPLY,
  DAY_ROUTE_SCRAPS,
  FIRST_MEETING_LINES,
} from '../data/track01.js';

const CORRECT = DAY_ROUTE_SCRAPS.map((scrap) => scrap.id);

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

export function mountTrack01(root, { save, onSave } = {}) {
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

  function setNote(text) {
    if (!text) {
      note.hidden = true;
      note.textContent = '';
      return;
    }
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
  }

  function bindScrap(el) {
    let dragging = false;
    let originX = 0;
    let originY = 0;
    let startX = 0;
    let startY = 0;

    el.addEventListener('pointerdown', (event) => {
      if (el.disabled) return;
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
    if (save?.routeSolved) placeSolvedRoute();
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

  scene.addEventListener('pointerup', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (event.target.closest('.reset-progress')) return;
    if (event.target.closest('.scrap')) return;
    if (event.target.closest('.phone')) return;
    advanceMeeting();
  });

  const onKey = (event) => {
    if (event.key !== ' ' && event.key !== 'Enter') return;
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

  if (save?.routeSolved) {
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
