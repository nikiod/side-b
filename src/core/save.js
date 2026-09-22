const SAVE_KEY = 'sideBSave';

export function defaultSave() {
  return {
    prologueCompleted: false,
    currentTrack: 0,
    discoveredItems: [],
    track01Started: false,
    firstMeetingCompleted: false,
    routeSolved: false,
  };
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultSave();
    const parsed = JSON.parse(raw);
    return {
      ...defaultSave(),
      ...parsed,
      discoveredItems: Array.isArray(parsed.discoveredItems)
        ? parsed.discoveredItems
        : [],
    };
  } catch {
    return defaultSave();
  }
}

export function writeSave(next) {
  const save = { ...defaultSave(), ...next };
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  return save;
}

export function clearSave() {
  localStorage.removeItem(SAVE_KEY);
}
