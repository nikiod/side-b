import { cloneTemplate } from '../core/dom.js';
import {
  TRACK_08_DAYS,
  TRACK_08_ENDING,
  TRACK_08_HOME,
  TRACK_08_HOME_CAPTION,
  TRACK_08_HOME_NEED,
  TRACK_08_IMAGES,
  TRACK_08_MSG,
  TRACK_08_TODAY,
} from '../data/track08.js';

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function mountTrack08(root, { onComplete, onMarkComplete } = {}) {
  const scene = cloneTemplate('tpl-track-08');
  const opening = scene.querySelector('.t08-opening');
  const openArt = scene.querySelector('.t08-open-art');
  const openTitle = scene.querySelector('.t08-open-title');
  const msgHit = scene.querySelector('.t08-msg');
  const linesBox = scene.querySelector('.t08-lines');
  const journal = scene.querySelector('.t08-journal');
  const journalTitle = scene.querySelector('.t08-journal-title');
  const journalBody = scene.querySelector('.t08-journal-body');
  const todayDetail = scene.querySelector('.t08-today-detail');
  const todayDetailInner = scene.querySelector('.t08-today-detail-inner');
  const journalTurn = scene.querySelector('.t08-journal-turn');
  const dailyLife = scene.querySelector('.t08-daily-life');
  const dailyArt = scene.querySelector('.t08-daily-art');
  const dailyContinue = scene.querySelector('.t08-daily-continue');
  const home = scene.querySelector('.t08-home');
  const homeArt = scene.querySelector('.track08-home-image');
  const homeCaption = scene.querySelector('.t08-home-caption');
  const homeNote = scene.querySelector('.t08-home-note');
  const homeContinue = scene.querySelector('.t08-home-continue');
  const night = scene.querySelector('.t08-night');
  const nightArt = scene.querySelector('.t08-night-art');
  const coda = scene.querySelector('.t08-coda');
  const back = scene.querySelector('.t08-back');
  const reduced = prefersReducedMotion();
  const fadeMs = reduced ? 160 : 480;

  let phase = 'opening';
  let locked = false;
  let finished = false;
  let marked = false;
  let openStep = 0;
  let endStep = 0;
  let dayIndex = 0;
  let activeTodayMoment = null;
  const todayDone = new Set();
  const dayDone = new Set();
  const homeDone = new Set();
  const timeButtons = new Map();

  function setPhase(name) {
    phase = name;
    scene.dataset.phase = name;
    console.log('[TRACK08 PHASE]', name);
  }

  function setImage(img, path) {
    if (!img) return;
    img.removeAttribute('hidden');
    img.src = path;
    console.log('[TRACK08 IMAGE]', path);
  }

  function showHomeImage() {
    const path = TRACK_08_IMAGES.home;
    const logSize = () => {
      console.log('HOME IMAGE', homeArt.naturalWidth, homeArt.naturalHeight, homeArt.currentSrc);
    };
    if (homeArt.getAttribute('src') === path && homeArt.complete && homeArt.naturalWidth) {
      logSize();
      return;
    }
    homeArt.onload = logSize;
    homeArt.src = path;
  }

  function homeImageWrap() {
    const existing = homeArt.closest('.home-image-wrap');
    if (existing) return existing;
    const wrap = document.createElement('div');
    wrap.className = 'home-image-wrap';
    homeArt.replaceWith(wrap);
    wrap.append(homeArt);
    return wrap;
  }

  function buildLine(lines, extra = '') {
    const p = document.createElement('p');
    p.className = `t08-line${extra ? ` ${extra}` : ''}`;
    lines.forEach((text) => {
      const row = document.createElement('span');
      row.className = 't08-line-row';
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
    await wait(fadeMs);
    linesBox.replaceChildren();
    linesBox.classList.remove('is-in');
  }

  async function showLine(lines, extra = '') {
    await fadeOutLines();
    const p = buildLine(lines, extra);
    linesBox.append(p);
    linesBox.classList.add('is-in');
    await wait(20);
    p.classList.add('is-in');
    await wait(fadeMs);
  }

  function stamp(btn) {
    if (btn.querySelector('.t08-stamp')) return;
    const mark = document.createElement('span');
    mark.className = 't08-stamp';
    mark.textContent = 'DONE';
    btn.append(mark);
    btn.classList.add('is-done');
  }

  function showTurn(show) {
    journalTurn.hidden = !show;
    journalTurn.classList.toggle('is-in', show);
  }

  function closeTodayDetail({ completeActive = false } = {}) {
    if (completeActive && activeTodayMoment && !todayDone.has(activeTodayMoment)) {
      todayDone.add(activeTodayMoment);
      const btn = timeButtons.get(activeTodayMoment);
      if (btn) stamp(btn);
    }
    activeTodayMoment = null;
    todayDetail.classList.remove('is-in');
    todayDetail.hidden = true;
    todayDetailInner.replaceChildren();
    if (todayDone.size === TRACK_08_TODAY.length) showTurn(true);
  }

  function placeTodayDetail(anchor, preferred) {
    todayDetail.hidden = false;
    todayDetail.style.left = '0px';
    todayDetail.style.top = '0px';
    const panel = todayDetail.getBoundingClientRect();
    const a = anchor.getBoundingClientRect();
    const box = scene.getBoundingClientRect();
    const w = panel.width || 240;
    const h = panel.height || 160;
    let left = a.right - box.left + 16;
    let top = a.top - box.top;
    if (preferred === 'below') {
      left = a.left - box.left - 24;
      top = a.bottom - box.top + 12;
    } else if (preferred === 'left') {
      left = a.left - box.left - w - 16;
      top = a.top - box.top - 12;
    } else if (preferred === 'up-right') {
      left = a.right - box.left + 8;
      top = a.top - box.top - h - 8;
    }
    left = clamp(left, 16, Math.max(16, box.width - w - 16));
    top = clamp(top, 72, Math.max(72, box.height - h - 72));
    todayDetail.style.left = `${left}px`;
    todayDetail.style.top = `${top}px`;
  }

  function fillTodayDetail(beat) {
    todayDetailInner.replaceChildren();
    if (beat.kind === 'objects') {
      const sceneBox = document.createElement('div');
      sceneBox.className = 't08-mini-scene';
      beat.objects.forEach((item) => {
        const obj = document.createElement('button');
        obj.type = 'button';
        obj.className = `t08-life-obj is-${item.id}`;
        obj.innerHTML = `<span>${item.label}</span>`;
        obj.addEventListener('pointerup', (event) => {
          event.stopPropagation();
          if (phase !== 'today') return;
          const line = todayDetailInner.querySelector('.t08-mini-line');
          if (line) line.textContent = item.mark;
        });
        sceneBox.append(obj);
      });
      const line = document.createElement('p');
      line.className = 't08-mini-line';
      line.textContent = '顺手弄一下。';
      todayDetailInner.append(sceneBox, line);
      return;
    }
    beat.lines.forEach((text) => {
      const row = document.createElement('p');
      row.textContent = text;
      todayDetailInner.append(row);
    });
  }

  function openTodayDetail(beat, btn) {
    if (activeTodayMoment === beat.id) {
      closeTodayDetail({ completeActive: true });
      return;
    }
    closeTodayDetail({ completeActive: true });
    activeTodayMoment = beat.id;
    fillTodayDetail(beat);
    todayDetail.hidden = false;
    requestAnimationFrame(() => {
      placeTodayDetail(btn, beat.place);
      todayDetail.classList.add('is-in');
    });
  }

  function clearJournal() {
    closeTodayDetail();
    journalBody.replaceChildren();
    showTurn(false);
  }

  function placeScrap(host, kind, lines, x, y) {
    const scrap = document.createElement('div');
    scrap.className = `t08-scrap is-${kind}`;
    scrap.style.left = `${x}%`;
    scrap.style.top = `${y}%`;
    lines.forEach((text) => {
      const row = document.createElement('p');
      row.textContent = text;
      scrap.append(row);
    });
    host.append(scrap);
    requestAnimationFrame(() => scrap.classList.add('is-in'));
  }

  function openToday() {
    setPhase('today');
    journal.hidden = false;
    journalTitle.textContent = 'TODAY';
    clearJournal();
    TRACK_08_TODAY.forEach((beat) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 't08-time';
      btn.dataset.id = beat.id;
      btn.style.left = `${beat.x}%`;
      btn.style.top = `${beat.y}%`;
      btn.innerHTML = `<span class="t08-time-num">${beat.time}</span>`;
      btn.addEventListener('pointerup', (event) => {
        event.stopPropagation();
        if (locked || phase !== 'today') return;
        openTodayDetail(beat, btn);
      });
      timeButtons.set(beat.id, btn);
      journalBody.append(btn);
    });
    requestAnimationFrame(() => journal.classList.add('is-in'));
  }

  function finishTodayIfReady() {
    if (todayDone.size !== TRACK_08_TODAY.length) return;
    closeTodayDetail();
    showTurn(true);
  }

  function renderDayPage() {
    const page = TRACK_08_DAYS[dayIndex];
    if (!page) {
      finishAnotherDays();
      return;
    }
    setPhase('anotherDays');
    journal.hidden = false;
    journal.classList.add('is-in');
    journalTitle.textContent = 'ANOTHER DAY';
    clearJournal();
    dayDone.clear();
    page.items.forEach((item, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 't08-day-hit';
      btn.style.left = `${12 + (index % 3) * 28}%`;
      btn.style.top = `${28 + Math.floor(index / 3) * 26}%`;
      btn.textContent = item.label;
      btn.addEventListener('pointerup', (event) => {
        event.stopPropagation();
        if (locked || phase !== 'anotherDays' || page.auto) return;
        if (dayDone.has(item.id)) return;
        dayDone.add(item.id);
        stamp(btn);
        placeScrap(journalBody, 'note', item.lines, 18 + index * 16, 58 + (index % 2) * 10);
        if (dayDone.size === page.items.length) showTurn(true);
      });
      journalBody.append(btn);
    });
    if (page.auto) {
      page.items.forEach((item, index) => {
        window.setTimeout(() => {
          const btn = journalBody.children[index];
          if (btn) stamp(btn);
          placeScrap(journalBody, 'note', item.lines, 24 + index * 14, 52);
        }, reduced ? 80 : 220);
      });
      window.setTimeout(() => {
        if (phase === 'anotherDays' && TRACK_08_DAYS[dayIndex] === page) turnDay();
      }, reduced ? 520 : 1100);
    }
  }

  function turnDay() {
    if (locked || phase !== 'anotherDays') return;
    locked = true;
    journal.classList.add('is-flip');
    window.setTimeout(() => {
      journal.classList.remove('is-flip');
      dayIndex += 1;
      locked = false;
      renderDayPage();
    }, reduced ? 180 : 420);
  }

  async function finishAnotherDays() {
    locked = true;
    clearJournal();
    journal.classList.add('is-out');
    await wait(reduced ? 240 : 520);
    journal.hidden = true;
    journal.classList.remove('is-in', 'is-out');
    locked = false;
    renderDailyLife();
  }

  function renderDailyLife() {
    locked = true;
    setPhase('dailyLife');
    dailyLife.hidden = false;
    setImage(dailyArt, TRACK_08_IMAGES.daily);
    requestAnimationFrame(() => dailyLife.classList.add('is-in'));
    locked = false;
  }

  async function leaveDailyLife() {
    if (phase !== 'dailyLife' || locked) return;
    locked = true;
    dailyLife.classList.add('is-out');
    await wait(reduced ? 240 : 520);
    dailyLife.hidden = true;
    dailyLife.classList.remove('is-in', 'is-out');
    locked = false;
    renderHomeIntro();
  }

  async function renderHomeIntro() {
    locked = true;
    setPhase('homeIntro');
    home.hidden = false;
    homeCaption.replaceChildren();
    TRACK_08_HOME_CAPTION.forEach((text) => {
      const row = document.createElement('span');
      row.textContent = text;
      homeCaption.append(row);
    });
    homeCaption.hidden = false;
    homeNote.hidden = true;
    homeNote.classList.remove('is-in');
    homeContinue.hidden = false;
    homeContinue.classList.add('is-in');
    showHomeImage();
    requestAnimationFrame(() => home.classList.add('is-in'));
    locked = false;
  }

  function clearHomeHotspots() {
    home.querySelectorAll('.t08-hotspot').forEach((node) => node.remove());
  }

  async function enterHomeRoom() {
    if (phase !== 'homeIntro' || locked) return;
    locked = true;
    setPhase('homeRoom');
    homeCaption.hidden = true;
    homeContinue.hidden = true;
    homeContinue.classList.remove('is-in');
    homeNote.hidden = true;
    homeDone.clear();
    clearHomeHotspots();
    const wrap = homeImageWrap();
    showHomeImage();
    TRACK_08_HOME.forEach((item) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `t08-hotspot is-${item.id}${item.align === 'end' ? ' is-end' : ''}`;
      btn.style.left = `${item.x}%`;
      btn.style.top = `${item.y}%`;
      btn.innerHTML = `<span class="t08-hotspot-mark"><span class="t08-hotspot-dot"></span><span class="t08-hotspot-label">${item.label}</span></span>`;
      btn.addEventListener('pointerup', (event) => {
        event.stopPropagation();
        if (phase !== 'homeRoom') return;
        homeDone.add(item.id);
        btn.classList.add('is-open');
        homeNote.replaceChildren();
        item.copy.forEach((text) => {
          const row = document.createElement('p');
          row.textContent = text;
          homeNote.append(row);
        });
        homeNote.hidden = false;
        homeNote.classList.add('is-in');
        if (homeDone.size >= TRACK_08_HOME_NEED) {
          homeContinue.hidden = false;
          requestAnimationFrame(() => homeContinue.classList.add('is-in'));
        }
      });
      wrap.append(btn);
    });
    locked = false;
  }

  async function leaveHomeRoom() {
    if (phase !== 'homeRoom' || locked) return;
    if (homeDone.size < TRACK_08_HOME_NEED) return;
    locked = true;
    homeContinue.classList.remove('is-in');
    home.classList.add('is-out');
    await wait(reduced ? 280 : 600);
    home.hidden = true;
    home.classList.remove('is-in', 'is-out', 'is-dim');
    clearHomeHotspots();
    locked = false;
    enterEnding();
  }

  async function enterEnding() {
    locked = true;
    setPhase('ending');
    endStep = 0;
    night.hidden = false;
    setImage(nightArt, TRACK_08_IMAGES.night);
    requestAnimationFrame(() => night.classList.add('is-in'));
    await wait(reduced ? 240 : 520);
    await showLine(TRACK_08_ENDING[0]);
    locked = false;
  }

  async function advanceEnding() {
    if (locked || phase !== 'ending') return;
    locked = true;
    if (endStep === 0) {
      await showLine(TRACK_08_ENDING[1]);
      endStep = 1;
      locked = false;
      return;
    }
    if (endStep === 1) {
      await showLine(TRACK_08_ENDING[2], 'is-clock');
      await wait(reduced ? 280 : 700);
      endStep = 2;
      locked = false;
      return;
    }
    if (endStep === 2) {
      await showLine(TRACK_08_ENDING[3]);
      endStep = 3;
      locked = false;
      return;
    }
    await playCoda();
  }

  async function playCoda() {
    if (phase === 'complete') return;
    locked = true;
    setPhase('complete');
    await fadeOutLines();
    night.classList.add('is-out');
    await wait(reduced ? 280 : 640);
    night.hidden = true;
    coda.classList.add('is-in');
    markDone();
    await wait(reduced ? 400 : 800);
    back.hidden = false;
    back.classList.add('is-in');
    locked = false;
  }

  function markDone() {
    if (marked) return;
    marked = true;
    onMarkComplete?.();
  }

  async function advanceOpening() {
    if (locked || phase !== 'opening') return;
    locked = true;
    if (openStep === 0) {
      openTitle.classList.add('is-in');
      setImage(openArt, TRACK_08_IMAGES.opening);
      await wait(reduced ? 280 : 700);
      msgHit.hidden = false;
      await wait(20);
      msgHit.classList.add('is-in');
      openStep = 1;
      locked = false;
      return;
    }
    if (openStep === 1) {
      locked = false;
      return;
    }
    if (openStep === 2) {
      opening.classList.add('is-out');
      await wait(fadeMs);
      opening.hidden = true;
      locked = false;
      openToday();
    }
  }

  msgHit.addEventListener('pointerup', async (event) => {
    event.stopPropagation();
    if (locked || phase !== 'opening' || openStep !== 1) return;
    locked = true;
    openStep = 2;
    msgHit.classList.add('is-out');
    await showLine(TRACK_08_MSG);
    await wait(reduced ? 280 : 700);
    await fadeOutLines();
    msgHit.hidden = true;
    locked = false;
    advanceOpening();
  });

  todayDetail.addEventListener('pointerup', (event) => {
    event.stopPropagation();
    if (phase !== 'today') return;
    if (event.target.closest('.t08-life-obj')) return;
    closeTodayDetail({ completeActive: true });
    finishTodayIfReady();
  });

  journal.addEventListener('pointerup', (event) => {
    if (phase !== 'today') return;
    if (event.target.closest('.t08-time, .t08-today-detail, .t08-journal-turn')) return;
    closeTodayDetail({ completeActive: true });
    finishTodayIfReady();
  });

  journalTurn.addEventListener('pointerup', (event) => {
    event.stopPropagation();
    if (locked) return;
    if (phase === 'today' && todayDone.size === TRACK_08_TODAY.length) {
      closeTodayDetail();
      locked = true;
      journal.classList.add('is-flip');
      window.setTimeout(() => {
        journal.classList.remove('is-flip');
        locked = false;
        renderDayPage();
      }, reduced ? 180 : 420);
      return;
    }
    if (phase === 'anotherDays') {
      const page = TRACK_08_DAYS[dayIndex];
      if (page && !page.auto && dayDone.size === page.items.length) turnDay();
    }
  });

  dailyContinue.addEventListener('pointerup', (event) => {
    event.stopPropagation();
    leaveDailyLife();
  });

  homeContinue.addEventListener('pointerup', (event) => {
    event.stopPropagation();
    if (phase === 'homeIntro') enterHomeRoom();
    else if (phase === 'homeRoom') leaveHomeRoom();
  });

  scene.addEventListener('pointerup', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (
      event.target.closest(
        '.reset-progress, .t08-back, .t08-msg, .t08-journal-turn, .t08-time, .t08-day-hit, .t08-life-obj, .t08-hotspot, .t08-home-continue, .t08-today-detail, .t08-daily-continue',
      )
    ) {
      return;
    }
    if (phase === 'opening') advanceOpening();
    else if (phase === 'ending') advanceEnding();
  });

  window.addEventListener('keydown', function onKey(event) {
    if (!document.body.contains(scene)) {
      window.removeEventListener('keydown', onKey);
      return;
    }
    if (event.key !== ' ' && event.key !== 'Enter') return;
    if (phase === 'opening') {
      event.preventDefault();
      advanceOpening();
    } else if (phase === 'dailyLife') {
      event.preventDefault();
      leaveDailyLife();
    } else if (phase === 'homeIntro') {
      event.preventDefault();
      enterHomeRoom();
    } else if (phase === 'homeRoom' && homeDone.size >= TRACK_08_HOME_NEED) {
      event.preventDefault();
      leaveHomeRoom();
    } else if (phase === 'ending') {
      event.preventDefault();
      advanceEnding();
    }
  });

  back.addEventListener('click', () => {
    if (finished) return;
    finished = true;
    markDone();
    onComplete?.();
  });

  async function start() {
    root.replaceChildren(scene);
    await wait(40);
    scene.classList.add('is-in');
    setPhase('opening');
    await wait(reduced ? 240 : 520);
    advanceOpening();
  }

  start();
  return scene;
}
