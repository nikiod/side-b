import { loadSave, writeSave, clearSave } from './save.js';
import { mountRecordDesk } from '../scenes/recordDesk.js';
import { mountPrologue } from '../scenes/prologue.js';
import { mountTrackIntro } from '../scenes/trackIntro.js';
import { mountTrack01 } from '../scenes/track01.js';
import { mountTrack02 } from '../scenes/track02.js';
import { mountTrack03 } from '../scenes/track03.js';
import { TRACK_02_TITLE } from '../data/track02.js';

export function createGame(app) {
  const root = app.querySelector('#scene-root');
  const flash = app.querySelector('#flash-layer');
  let save = loadSave();

  function showDesk() {
    mountRecordDesk(root, {
      save,
      onEnterBooklet: showPrologue,
      onEnterTrack02: showTrack02,
      onEnterTrack03: showTrack03,
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

  function showTrack02() {
    mountTrackIntro(root, {
      track: TRACK_02_TITLE.kicker,
      title: TRACK_02_TITLE.name,
      onComplete() {
        mountTrack02(root, {
          onComplete() {
            persist({ track02Completed: true });
            showDesk();
          },
        });
      },
    });
  }

  function showTrack03() {
    persist({ track03Started: true, currentTrack: 3 });
    mountTrack03(root, {
      onMarkComplete() {
        persist({ track03Completed: true });
      },
      onComplete() {
        persist({ track03Completed: true });
        showDesk();
      },
    });
  }

  function showTrack01() {
    mountTrack01(root, {
      save,
      onSave: persist,
      onComplete() {
        persist({ track01Completed: true });
        showDesk();
      },
    });
  }

  app.querySelector('#reset-progress').addEventListener('click', () => {
    clearSave();
    window.location.reload();
  });

  return {
    start() {
      if (save.track01Completed) {
        showDesk();
        return;
      }
      if (save.track01Started || save.firstMeetingCompleted || save.routeSolved) {
        showTrack01();
        return;
      }
      showDesk();
    },
  };
}
