import { loadSave, writeSave, clearSave } from './save.js';
import { mountRecordDesk } from '../scenes/recordDesk.js';
import { mountPrologue } from '../scenes/prologue.js';
import { mountTrackIntro } from '../scenes/trackIntro.js';
import { mountTrack01 } from '../scenes/track01.js';

export function createGame(app) {
  const root = app.querySelector('#scene-root');
  const flash = app.querySelector('#flash-layer');
  let save = loadSave();

  function showDesk() {
    mountRecordDesk(root, {
      save,
      onEnterBooklet: showPrologue,
    });
  }

  function showPrologue() {
    mountPrologue(root, {
      onPolaroidClick: enterTrackIntro,
    });
  }

  function enterTrackIntro() {
    if (!save.discoveredItems.includes('firstDatePhoto')) {
      save.discoveredItems = [...save.discoveredItems, 'firstDatePhoto'];
    }
    save = writeSave({
      ...save,
      prologueCompleted: true,
      currentTrack: 1,
      track01Started: true,
    });

    flash.className = 'flash-layer is-firing';
    const finish = () => {
      flash.removeEventListener('animationend', finish);
      flash.className = 'flash-layer';
    };
    flash.addEventListener('animationend', finish);
    mountTrackIntro(root, {
      onComplete: showTrack01,
    });
  }

  function persist(patch) {
    save = writeSave({
      ...save,
      ...patch,
    });
    return save;
  }

  function showTrack01() {
    mountTrack01(root, {
      save,
      onSave: persist,
    });
  }

  app.querySelector('#reset-progress').addEventListener('click', () => {
    clearSave();
    window.location.reload();
  });

  return {
    start() {
      if (save.track01Started || save.firstMeetingCompleted || save.routeSolved) {
        showTrack01();
        return;
      }
      showDesk();
    },
  };
}
