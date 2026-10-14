import { cloneTemplate } from '../core/dom.js';
import {
  TRACK_09_CHOICES,
  TRACK_09_IMAGES,
  TRACK_09_OPENING,
  TRACK_09_SHARED,
  TRACK_09_ZERO,
} from '../data/track09.js';

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function mountTrack09(root, { onChoose, onComplete, onMarkComplete } = {}) {
  const scene = cloneTemplate('tpl-track-09');
  const opening = scene.querySelector('.t09-opening');
  const openLines = scene.querySelector('.t09-open-lines');
  const linesBox = scene.querySelector('.t09-lines');
  const choice = scene.querySelector('.t09-choice');
  const walk = scene.querySelector('.t09-walk');
  const walkMedia = walk.querySelector('.track09-media');
  const walkCopy = walk.querySelector('.t09-copy-line');
  const snack = scene.querySelector('.t09-snack');
  const snackCopy = snack.querySelector('.t09-copy-line');
  const snackFood = scene.querySelector('.t09-dish');
  const zero = scene.querySelector('.t09-zero');
  const zeroCopy = scene.querySelector('.t09-zero-copy');
  const talk = scene.querySelector('.t09-talk');
  const sit = scene.querySelector('.t09-sit');
  const home = scene.querySelector('.t09-home');
  const homeMedia = home.querySelector('.track09-media');
  const homeCopy = home.querySelector('.t09-copy-line');
  const homeDoor = scene.querySelector('.t09-door');
  const homeLamp = scene.querySelector('.t09-lamp');
  const homeCat = scene.querySelector('.t09-cat');
  const homeNext = scene.querySelector('.t09-home-next');
  const ending = scene.querySelector('.t09-ending');
  const endingCopy = scene.querySelector('.t09-ending-copy');
  const endingSide = scene.querySelector('.t09-ending-side');
  const finalPage = scene.querySelector('.t09-final');
  const back = scene.querySelector('.t09-back');
  const whisper = scene.querySelector('.t09-whisper');
  const forward = scene.querySelector('.t09-forward');
  const reduced = prefersReducedMotion();
  const fadeMs = reduced ? 160 : 480;

  let phase = 'opening';
  let step = 'title';
  let locked = true;
  let choiceLocked = false;
  let finished = false;
  let marked = false;
  let walkAsked = false;
  let homeStep = 'door';
  let zeroIndex = 0;
  let sceneToken = 0;
  let sharedLocked = false;
  const timers = [];

  function clearTimers() {
    while (timers.length) window.clearTimeout(timers.pop());
  }

  function later(fn, ms) {
    const token = sceneToken;
    const id = window.setTimeout(() => {
      if (token !== sceneToken) return;
      fn();
    }, reduced ? Math.min(ms, 220) : ms);
    timers.push(id);
  }

  function setCopy(node, lines) {
    if (!node) return;
    node.replaceChildren();
    if (!lines?.length) {
      node.hidden = true;
      return;
    }
    lines.forEach((text) => {
      const row = document.createElement('span');
      row.textContent = text;
      node.append(row);
    });
    node.hidden = false;
  }

  function cleanupTrack09Scene() {
    sceneToken += 1;
    clearTimers();
    walkMedia.classList.remove('is-tree', 'is-bird', 'is-river', 'is-forward');
    homeMedia.classList.remove('is-open', 'is-lit');
    whisper.hidden = true;
    whisper.className = 't09-whisper';
    whisper.textContent = '';
    forward.hidden = true;
    homeNext.hidden = true;
    homeDoor.hidden = false;
    homeLamp.hidden = true;
    homeCat.hidden = true;
    snackFood.classList.remove('is-on', 'is-eaten');
    endingSide.hidden = true;
    endingSide.classList.remove('is-in');
    [walkCopy, snackCopy, homeCopy, endingCopy].forEach((node) => setCopy(node, null));
    linesBox.replaceChildren();
    zeroCopy.replaceChildren();
    talk.replaceChildren();
    sit.hidden = true;
  }

  function setPhase(name, nextStep) {
    phase = name;
    step = nextStep;
    scene.dataset.phase = name;
    scene.dataset.step = nextStep;
  }

  function probe(img, src, stage) {
    if (!img) return;
    const test = new Image();
    test.onload = () => {
      img.src = src;
      img.hidden = false;
      stage?.classList.remove('is-fallback');
    };
    test.onerror = () => {
      img.removeAttribute('src');
      img.hidden = true;
      stage?.classList.add('is-fallback');
    };
    test.src = src;
  }

  function buildLine(lines) {
    const p = document.createElement('p');
    p.className = 't09-line';
    lines.forEach((text) => {
      const row = document.createElement('span');
      row.textContent = text;
      p.append(row);
    });
    return p;
  }

  function lineHosts() {
    return [linesBox, zeroCopy];
  }

  async function fadeOutLines() {
    const hosts = lineHosts();
    const nodes = hosts.flatMap((host) => [...host.children]);
    if (!nodes.length) return;
    nodes.forEach((node) => node.classList.remove('is-in'));
    await wait(fadeMs);
    hosts.forEach((host) => host.replaceChildren());
  }

  async function showLine(lines) {
    await fadeOutLines();
    const host = phase === 'zeroZeroSeven' ? zeroCopy : linesBox;
    const p = buildLine(lines);
    host.append(p);
    await wait(20);
    p.classList.add('is-in');
    await wait(fadeMs);
  }

  function showWhisper(kind, text) {
    whisper.className = `t09-whisper is-in is-${kind}`;
    whisper.textContent = text;
    whisper.hidden = false;
    later(() => {
      whisper.classList.remove('is-in');
      whisper.hidden = true;
    }, 1200);
  }

  function hideBranches() {
    cleanupTrack09Scene();
    [choice, walk, snack, zero, home, ending, finalPage].forEach((node) => {
      node.hidden = true;
      node.classList.remove('is-in', 'is-out');
    });
  }

  function reveal(node) {
    node.hidden = false;
    requestAnimationFrame(() => node.classList.add('is-in'));
  }

  function appendOpenLine(text, extra = '') {
    const line = document.createElement('p');
    line.className = extra ? `t09-open-line ${extra}` : 't09-open-line';
    line.textContent = text;
    openLines.append(line);
    return line;
  }

  async function revealOpenLine(node) {
    await wait(20);
    node.classList.add('is-in');
    await wait(reduced ? 160 : 520);
  }

  async function start() {
    root.replaceChildren(scene);
    await wait(40);
    scene.classList.add('is-in');
    setPhase('opening', 'title');
    await wait(reduced ? 160 : 520);
    const first = appendOpenLine(TRACK_09_OPENING[0][0]);
    await revealOpenLine(first);
    await wait(reduced ? 180 : 780);
    const next = appendOpenLine(TRACK_09_OPENING[0][1], 'is-next');
    await revealOpenLine(next);
    setPhase('opening', 'hold');
    locked = false;
  }

  async function advanceOpening() {
    if (phase !== 'opening' || locked || step !== 'hold') return;
    locked = true;
    opening.classList.add('is-out');
    await wait(reduced ? 160 : 640);
    opening.hidden = true;
    locked = false;
    enterChoice();
  }

  function enterChoice() {
    setPhase('choice', 'pick');
    hideBranches();
    probe(choice.querySelector('.t09-choice-art'), TRACK_09_IMAGES.choice, choice);
    reveal(choice);
  }

  function pickChoice(id) {
    if (phase !== 'choice' || locked || choiceLocked) return;
    choiceLocked = true;
    locked = true;
    onChoose?.(id);
    choice.classList.add('is-out');
    window.setTimeout(() => {
      choice.hidden = true;
      locked = false;
      if (id === 'NIGHT WALK') enterNightWalk();
      else if (id === 'LATE SNACK') enterLateSnack();
      else if (id === '00:07') enterZero();
      else enterHome();
    }, reduced ? 160 : 420);
  }

  function enterNightWalk() {
    setPhase('nightWalk', 'enter');
    walkAsked = false;
    hideBranches();
    walk.querySelector('.t09-walk-art').src = TRACK_09_IMAGES.night;
    reveal(walk);
  }

  function pokeWalk(kind) {
    if (phase !== 'nightWalk' || locked) return;
    if (step === 'walkForward' || step === 'exit') return;
    const name = kind === 'river' ? 'river' : kind;
    walkMedia.classList.remove('is-tree', 'is-bird', 'is-river');
    void walkMedia.offsetWidth;
    walkMedia.classList.add(`is-${name}`);
    const note = kind === 'tree' ? '风有一点。' : kind === 'bird' ? '飞走了。' : '水动了一下。';
    showWhisper(name, note);
    if (walkAsked || step !== 'enter') return;
    walkAsked = true;
    locked = true;
    setPhase('nightWalk', 'explore');
    later(() => {
      setCopy(walkCopy, ['再走一会儿？']);
      forward.hidden = false;
      setPhase('nightWalk', 'question');
      locked = false;
    }, 500);
  }

  function walkContinue() {
    if (phase !== 'nightWalk' || locked) return;
    if (step === 'question') {
      locked = true;
      setCopy(walkCopy, ['嗯。']);
      setPhase('nightWalk', 'walkForward');
      later(() => {
        locked = false;
      }, 400);
      return;
    }
    if (step === 'walkForward') {
      locked = true;
      walkMedia.classList.add('is-forward');
      later(() => {
        setCopy(walkCopy, ['再走一段。']);
        forward.hidden = false;
        setPhase('nightWalk', 'exit');
        locked = false;
      }, 420);
      return;
    }
    if (step === 'exit') enterShared();
  }

  async function enterLateSnack() {
    setPhase('lateSnack', 'enter');
    hideBranches();
    snack.querySelector('.t09-snack-art').src = TRACK_09_IMAGES.snack;
    snack.querySelectorAll('.t09-food-pick').forEach((btn) => {
      btn.hidden = false;
    });
    reveal(snack);
    locked = true;
    setCopy(snackCopy, ['吃点什么？']);
    await wait(fadeMs);
    locked = false;
  }

  async function chooseSnack(kind) {
    if (phase !== 'lateSnack' || locked || step !== 'enter') return;
    locked = true;
    setPhase('lateSnack', 'chooseFood');
    snack.querySelectorAll('.t09-food-pick').forEach((btn) => {
      btn.hidden = true;
    });
    setCopy(snackCopy, kind === 'hot' ? ['那吃热的。'] : ['这个也行。']);
    snackFood.classList.add('is-on');
    await wait(fadeMs);
    setCopy(snackCopy, ['这个好吃吗？']);
    setPhase('lateSnack', 'eat');
    locked = false;
  }

  async function eatSnack() {
    if (phase !== 'lateSnack' || locked) return;
    if (step === 'exit') {
      enterShared();
      return;
    }
    if (step !== 'eat') return;
    locked = true;
    snackFood.classList.add('is-eaten');
    setCopy(snackCopy, ['还行，你尝尝。']);
    setPhase('lateSnack', 'exit');
    locked = false;
  }

  function showTalk(line) {
    [...talk.children].forEach((node, index, list) => {
      node.classList.toggle('is-prev', index === list.length - 1);
      node.classList.toggle('is-gone', index < list.length - 1);
    });
    const row = document.createElement('p');
    row.className = 't09-talk-line';
    if (line.who === '林禾') row.classList.add('is-lin');
    else if (line.who === '许遥') row.classList.add('is-xu');
    else row.classList.add('is-note');
    if (line.who) {
      const who = document.createElement('span');
      who.className = 't09-talk-who';
      who.textContent = line.who;
      row.append(who);
    }
    const text = document.createElement('span');
    text.className = 't09-talk-text';
    text.textContent = line.text;
    row.append(text);
    talk.append(row);
    requestAnimationFrame(() => row.classList.add('is-in'));
    later(() => {
      talk.querySelectorAll('.t09-talk-line.is-gone').forEach((node) => node.remove());
    }, 680);
  }

  function enterZero() {
    zeroIndex = 0;
    setPhase('zeroZeroSeven', 'mark');
    hideBranches();
    reveal(zero);
    locked = true;
    later(() => {
      if (phase !== 'zeroZeroSeven') return;
      showTalk(TRACK_09_ZERO[0]);
      setPhase('zeroZeroSeven', 'talk');
      locked = false;
    }, 880);
  }

  function advanceTalk() {
    if (phase !== 'zeroZeroSeven' || locked || step !== 'talk') return;
    if (zeroIndex >= TRACK_09_ZERO.length - 1) return;
    locked = true;
    const prev = TRACK_09_ZERO[zeroIndex];
    zeroIndex += 1;
    const next = TRACK_09_ZERO[zeroIndex];
    const revealLine = () => {
      if (phase !== 'zeroZeroSeven') return;
      showTalk(next);
      if (next.sitAfter) {
        setPhase('zeroZeroSeven', 'rest');
        later(() => {
          if (phase !== 'zeroZeroSeven') return;
          sit.hidden = false;
          locked = false;
        }, 720);
        return;
      }
      locked = false;
    };
    if (prev.pauseAfter) later(revealLine, 760);
    else revealLine();
  }

  function leaveZero() {
    if (phase !== 'zeroZeroSeven' || locked || step !== 'rest') return;
    enterShared();
  }

  function enterHome() {
    homeStep = 'door';
    setPhase('home', 'door');
    hideBranches();
    home.querySelector('.t09-home-art').src = TRACK_09_IMAGES.home;
    homeDoor.hidden = false;
    homeLamp.hidden = true;
    homeCat.hidden = true;
    homeNext.hidden = true;
    reveal(home);
  }

  function openDoor() {
    if (phase !== 'home' || locked || homeStep !== 'door') return;
    locked = true;
    homeStep = 'light';
    setPhase('home', 'light');
    homeDoor.hidden = true;
    homeMedia.classList.add('is-open');
    later(() => {
      homeLamp.hidden = false;
      locked = false;
    }, 400);
  }

  function turnLight() {
    if (phase !== 'home' || locked || homeStep !== 'light') return;
    locked = true;
    homeStep = 'cat';
    setPhase('home', 'cat');
    homeLamp.hidden = true;
    homeMedia.classList.add('is-lit');
    later(() => {
      homeCat.hidden = false;
      locked = false;
    }, 400);
  }

  function meetCat() {
    if (phase !== 'home' || locked || homeStep !== 'cat') return;
    locked = true;
    homeStep = 'enter';
    setPhase('home', 'enter');
    homeCat.hidden = true;
    setCopy(homeCopy, ['布总过来了。']);
    later(() => {
      setCopy(homeCopy, ['布总过来了。', '进去吧。']);
      homeNext.hidden = false;
      locked = false;
    }, 600);
  }

  function leaveHome() {
    if (phase !== 'home' || locked || homeStep !== 'enter') return;
    homeStep = 'done';
    enterShared();
  }

  async function enterShared() {
    if (sharedLocked || phase === 'sharedEnding' || phase === 'final') return;
    sharedLocked = true;
    locked = true;
    const fromZero = phase === 'zeroZeroSeven';
    if (fromZero) {
      zero.classList.add('is-out');
      await wait(fadeMs);
    }
    await fadeOutLines();
    hideBranches();
    scene.querySelectorAll('.t09-line').forEach((node) => node.remove());
    setPhase('sharedEnding', 'line1');
    ending.querySelector('.t09-ending-art').src = TRACK_09_IMAGES.ending;
    reveal(ending);
    setCopy(endingCopy, TRACK_09_SHARED[0]);
    locked = false;
  }

  async function advanceShared() {
    if (phase !== 'sharedEnding' || locked || step !== 'line1') return;
    locked = true;
    setCopy(endingCopy, null);
    setPhase('sharedEnding', 'pause');
    await wait(reduced ? 240 : 600);
    if (phase !== 'sharedEnding') return;
    setCopy(endingCopy, TRACK_09_SHARED[1]);
    setPhase('sharedEnding', 'line2');
    await wait(reduced ? 500 : 1500);
    if (phase !== 'sharedEnding') return;
    endingSide.hidden = false;
    endingSide.classList.add('is-in');
    setPhase('sharedEnding', 'sideB');
    locked = false;
  }

  function enterFinal() {
    if (phase !== 'sharedEnding' || step !== 'sideB' || locked) return;
    locked = true;
    ending.classList.add('is-out');
    window.setTimeout(() => {
      ending.hidden = true;
      setPhase('final', 'done');
      reveal(finalPage);
      markDone();
      back.hidden = false;
      back.classList.add('is-in');
      locked = false;
    }, reduced ? 160 : 480);
  }

  function markDone() {
    if (marked) return;
    marked = true;
    onMarkComplete?.();
  }

  function advance() {
    if (locked) return;
    if (phase === 'opening') advanceOpening();
    else if (phase === 'nightWalk' && step === 'exit') enterShared();
    else if (phase === 'lateSnack' && step === 'exit') enterShared();
    else if (phase === 'zeroZeroSeven' && step === 'talk') advanceTalk();
    else if (phase === 'sharedEnding' && step === 'line1') advanceShared();
  }

  scene.querySelectorAll('.t09-track').forEach((btn) => {
    btn.addEventListener('pointerup', (event) => {
      event.stopPropagation();
      pickChoice(btn.dataset.choice);
    });
  });

  scene.querySelectorAll('.night-hotspot').forEach((btn) => {
    btn.addEventListener('pointerup', (event) => {
      event.stopPropagation();
      pokeWalk(btn.dataset.env);
    });
  });

  forward.addEventListener('pointerup', (event) => {
    event.stopPropagation();
    walkContinue();
  });

  scene.querySelectorAll('.t09-food-pick').forEach((btn) => {
    btn.addEventListener('pointerup', (event) => {
      event.stopPropagation();
      chooseSnack(btn.dataset.food);
    });
  });

  snackFood.addEventListener('pointerup', (event) => {
    event.stopPropagation();
    eatSnack();
  });

  sit.addEventListener('pointerup', (event) => {
    event.stopPropagation();
    leaveZero();
  });

  homeDoor.addEventListener('pointerup', (event) => {
    event.stopPropagation();
    openDoor();
  });

  homeLamp.addEventListener('pointerup', (event) => {
    event.stopPropagation();
    turnLight();
  });

  homeCat.addEventListener('pointerup', (event) => {
    event.stopPropagation();
    meetCat();
  });

  homeNext.addEventListener('pointerup', (event) => {
    event.stopPropagation();
    leaveHome();
  });

  endingSide.addEventListener('pointerup', (event) => {
    event.stopPropagation();
    enterFinal();
  });

  scene.addEventListener('pointerup', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (
      event.target.closest(
        '.reset-progress, .t09-track, .night-hotspot, .t09-forward, .t09-food-pick, .t09-dish, .t09-sit, .t09-door, .t09-lamp, .t09-cat, .t09-home-next, .t09-ending-side, .t09-back',
      )
    ) {
      return;
    }
    advance();
  });

  back.addEventListener('click', () => {
    if (finished || phase !== 'final') return;
    finished = true;
    markDone();
    onComplete?.();
  });

  TRACK_09_CHOICES.forEach((item) => {
    const btn = scene.querySelector(`[data-choice="${item.id}"]`);
    if (btn) btn.textContent = item.label;
  });

  start();
  return scene;
}
