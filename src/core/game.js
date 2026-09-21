import { loadSave, writeSave, clearSave } from './save.js';
import { mountRecordDesk } from '../scenes/recordDesk.js';
import { mountPrologue } from '../scenes/prologue.js';
import { mountTrackIntro } from '../scenes/trackIntro.js';

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
    });

    flash.className = 'flash-layer is-firing';
    const finish = () => {
      flash.removeEventListener('animationend', finish);
      flash.className = 'flash-layer';
    };
    flash.addEventListener('animationend', finish);
    mountTrackIntro(root);
  }

  app.querySelector('#reset-progress').addEventListener('click', () => {
    clearSave();
    window.location.reload();
  });

  return {
    start: showDesk,
  };
}
