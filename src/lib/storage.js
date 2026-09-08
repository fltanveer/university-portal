import { buildInitialState } from '../data/mockData';

const KEY = 'studyfound.portal.v3';

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return buildInitialState();
    const parsed = JSON.parse(raw);
    // Schema bumps discard the old snapshot rather than migrating a mock.
    if (parsed?.version !== 3) return buildInitialState();
    return parsed;
  } catch {
    return buildInitialState();
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (err) {
    // Quota exceeded / private mode — the app keeps working in memory.
    console.warn('Could not persist portal state:', err);
  }
}

export function resetState() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* no-op */
  }
  return buildInitialState();
}
