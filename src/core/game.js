import { loadSave, writeSave, clearSave } from './save.js';
import { mountRecordDesk } from '../scenes/recordDesk.js';
import { mountPrologue } from '../scenes/prologue.js';
import { mountTrackIntro } from '../scenes/trackIntro.js';
import { mountTrack01 } from '../scenes/track01.js';
import { mountTrack02 } from '../scenes/track02.js';
import { mountTrack03 } from '../scenes/track03.js';
import { mountTrack04 } from '../scenes/track04.js';
import { mountTrack05 } from '../scenes/track05.js';
import { mountTrack06 } from '../scenes/track06.js';
import { mountTrack07 } from '../scenes/track07.js';
import { mountTrack08 } from '../scenes/track08.js';
import { mountTrack09 } from '../scenes/track09.js';
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
      onEnterTrack04: showTrack04,
      onEnterTrack05: showTrack05,
      onEnterTrack06: showTrack06,
      onEnterTrack07: showTrack07,
      onEnterTrack08: showTrack08,
      onEnterTrack09: showTrack09,
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

  function showTrack09() {
    persist({ track09Started: true, currentTrack: 9 });
    mountTrack09(root, {
      onChoose(choice) {
        persist({ track09Choice: choice });
      },
      onMarkComplete() {
        persist({ track09Completed: true });
      },
      onComplete() {
        persist({ track09Completed: true });
        showDesk();
      },
    });
  }

  function showTrack08() {
    persist({ track08Started: true, currentTrack: 8 });
    mountTrack08(root, {
      onMarkComplete() {
        persist({ track08Completed: true });
      },
      onComplete() {
        persist({ track08Completed: true });
        showDesk();
      },
    });
  }

  function showTrack07() {
    persist({ track07Started: true, currentTrack: 7 });
    mountTrack07(root, {
      onMarkComplete() {
        persist({ track07Completed: true });
      },
      onComplete() {
        persist({ track07Completed: true });
        showDesk();
      },
    });
  }

  function showTrack06() {
    persist({ track06Started: true, currentTrack: 6 });
    mountTrack06(root, {
      onMarkComplete() {
        persist({ track06Completed: true });
      },
      onComplete() {
        persist({ track06Completed: true });
        showDesk();
      },
    });
  }

  function showTrack05() {
    persist({ track05Started: true, currentTrack: 5 });
    mountTrack05(root, {
      onMarkComplete() {
        persist({ track05Completed: true });
      },
      onComplete() {
        persist({ track05Completed: true });
        showDesk();
      },
    });
  }

  function showTrack04() {
    persist({ track04Started: true, currentTrack: 4 });
    mountTrack04(root, {
      onMarkComplete() {
        persist({ track04Completed: true });
      },
      onComplete() {
        persist({ track04Completed: true });
        showDesk();
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
