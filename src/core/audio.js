import { asset } from './assets.js';

const MUTE_KEY = 'side-b-music-muted';
const TARGET_VOLUME = 0.25;
const FADE_MS = 1000;

const SOURCES = {
  intro: asset('audio/side-b-intro.mp3'),
  main: asset('audio/side-b-main.mp3'),
  story: asset('audio/side-b-story.mp3'),
  ending: asset('audio/side-b-ending.mp3'),
};

const SCENE_BGM = {
  prologue: 'intro',
  track01: 'main',
  track02: 'main',
  track03: null,
  track04: 'story',
  track05: 'story',
  track06: 'story',
  track07: 'story',
  track08: 'story',
  track09: 'ending',
};

function readMuted() {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

function writeMuted(muted) {
  try {
    localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
  } catch {
    // Storage can be blocked. The in-memory flag still holds for this visit.
  }
}

export function createAudioManager() {
  const audio = new Audio();
  audio.loop = true;
  audio.preload = 'auto';
  audio.volume = 0;
  audio.setAttribute('playsinline', '');

  let currentTrack = null;
  let intent = 'intro';
  let isMuted = readMuted();
  const targetVolume = TARGET_VOLUME;
  let unlocked = false;
  let token = 0;
  let raf = 0;
  let cancelFade = null;
  let settleTimer = 0;

  function begin() {
    token += 1;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    if (cancelFade) cancelFade();
    return token;
  }

  function fadeTo(volume, ms, gen) {
    if (cancelFade) cancelFade();
    return new Promise((resolve) => {
      const from = audio.volume;
      const start = performance.now();
      cancelFade = () => {
        cancelFade = null;
        resolve(false);
      };
      const step = (now) => {
        if (gen !== token) {
          cancelFade = null;
          resolve(false);
          return;
        }
        const t = Math.min(1, Math.max(0, (now - start) / ms));
        audio.volume = Math.min(1, Math.max(0, from + (volume - from) * t));
        if (t < 1) {
          raf = requestAnimationFrame(step);
        } else {
          raf = 0;
          cancelFade = null;
          audio.volume = Math.min(1, Math.max(0, volume));
          resolve(true);
        }
      };
      raf = requestAnimationFrame(step);
    });
  }

  function safePlay() {
    const pendingPlay = audio.play();
    if (pendingPlay && typeof pendingPlay.catch === 'function') {
      pendingPlay.catch(() => {});
    }
    return pendingPlay;
  }

  function load(track) {
    if (!SOURCES[track]) return;
    if (audio.dataset.bgm === track) return;
    audio.src = SOURCES[track];
    audio.dataset.bgm = track;
  }

  function seekStart() {
    try {
      if (audio.currentTime !== 0) audio.currentTime = 0;
    } catch {
      // A new src starts at 0 once metadata arrives.
    }
  }

  function clearSettle() {
    if (!settleTimer) return;
    clearTimeout(settleTimer);
    settleTimer = 0;
  }

  function onThisFile(track) {
    if (!track || audio.dataset.bgm !== track) return false;
    if (currentTrack === track) return true;
    // The opening gesture starts playback before a track is committed.
    // Silence leaves the element paused with currentTrack cleared, so the next cue restarts.
    return currentTrack === null && !audio.paused;
  }

  async function restore(track, gen) {
    intent = track;
    currentTrack = track;
    if (isMuted || gen !== token) {
      audio.pause();
      audio.volume = 0;
      return;
    }
    if (audio.paused) {
      audio.volume = 0;
      try {
        await audio.play();
      } catch {
        return;
      }
    }
    if (gen !== token || intent !== track || isMuted) {
      if (isMuted) audio.pause();
      return;
    }
    if (audio.volume < targetVolume - 0.02) {
      await fadeTo(targetVolume, FADE_MS, gen);
    }
  }

  async function switchTrack(track) {
    if (!unlocked) {
      intent = track;
      return;
    }

    if (onThisFile(track) && intent === track && currentTrack === track && (isMuted || !audio.paused)) {
      return;
    }

    if (onThisFile(track)) {
      clearSettle();
      const gen = begin();
      await restore(track, gen);
      return;
    }

    intent = track;
    const gen = begin();
    clearSettle();

    const audible = !audio.paused && audio.volume > 0.001;
    if (audible) {
      const faded = await fadeTo(0, FADE_MS, gen);
      if (!faded || gen !== token || intent !== track) return;
    }

    if (gen !== token || intent !== track) return;
    audio.pause();
    audio.volume = 0;

    if (!track) {
      currentTrack = null;
      return;
    }

    load(track);
    seekStart();
    currentTrack = track;

    if (isMuted || gen !== token || intent !== track) return;

    try {
      await audio.play();
    } catch {
      return;
    }
    if (gen !== token || intent !== track || isMuted) {
      if (isMuted) audio.pause();
      return;
    }
    await fadeTo(targetVolume, FADE_MS, gen);
  }

  function cue(scene) {
    if (!Object.prototype.hasOwnProperty.call(SCENE_BGM, scene)) return;
    return switchTrack(SCENE_BGM[scene]);
  }

  function primeFromGesture() {
    if (unlocked) return;
    unlocked = true;
    if (isMuted) return;

    const key = intent && SOURCES[intent] ? intent : 'intro';
    if (audio.dataset.bgm !== key) {
      audio.src = SOURCES[key];
      audio.dataset.bgm = key;
      seekStart();
    }
    audio.volume = 0;
    safePlay();
    settleTimer = window.setTimeout(() => {
      settleTimer = 0;
      if (!unlocked || isMuted || intent !== key) {
        if (isMuted) audio.pause();
        return;
      }
      if (currentTrack === key && !audio.paused) return;
      currentTrack = key;
      const gen = token;
      fadeTo(targetVolume, FADE_MS, gen);
    }, 0);
  }

  function pause() {
    audio.pause();
  }

  function resume() {
    if (isMuted || !currentTrack) return;
    safePlay();
  }

  async function fadeOut() {
    const gen = begin();
    const done = await fadeTo(0, FADE_MS, gen);
    return done && gen === token;
  }

  async function fadeIn() {
    if (isMuted) return false;
    const gen = begin();
    const done = await fadeTo(targetVolume, FADE_MS, gen);
    return done && gen === token;
  }

  async function mute() {
    if (isMuted) return;
    isMuted = true;
    writeMuted(true);
    const gen = begin();
    if (settleTimer) {
      clearTimeout(settleTimer);
      settleTimer = 0;
    }
    if (!audio.paused && audio.volume > 0.001) {
      const faded = await fadeTo(0, FADE_MS, gen);
      if (!faded || gen !== token) return;
    }
    if (gen !== token) return;
    audio.volume = 0;
    audio.pause();
  }

  async function unmute() {
    if (!isMuted) return;
    isMuted = false;
    writeMuted(false);
    unlocked = true;
    if (settleTimer) {
      clearTimeout(settleTimer);
      settleTimer = 0;
    }
    if (intent !== currentTrack) {
      await switchTrack(intent);
      return;
    }
    if (!currentTrack) return;
    const gen = begin();
    audio.volume = 0;
    try {
      await audio.play();
    } catch {
      return;
    }
    if (gen !== token || isMuted) {
      if (isMuted) audio.pause();
      return;
    }
    await fadeTo(targetVolume, FADE_MS, gen);
  }

  function mount(app) {
    const button = app.querySelector('#music-toggle');
    const paint = () => {
      if (!button) return;
      button.textContent = isMuted ? '♪ OFF' : '♪ ON';
      button.setAttribute('aria-pressed', isMuted ? 'true' : 'false');
      button.setAttribute('aria-label', isMuted ? '音乐关闭' : '音乐开启');
    };

    app.addEventListener('pointerdown', (event) => {
      const target = event.target;
      if (target instanceof Element && target.closest('#music-toggle')) return;
      primeFromGesture();
    }, true);

    button?.addEventListener('click', (event) => {
      event.stopPropagation();
      if (isMuted) unmute();
      else mute();
      paint();
    });

    paint();
  }

  return {
    play: switchTrack,
    switchTrack,
    pause,
    resume,
    fadeIn,
    fadeOut,
    mute,
    unmute,
    cue,
    mount,
    isMuted: () => isMuted,
  };
}

export const audioManager = createAudioManager();
