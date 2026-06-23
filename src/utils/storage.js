export const STORAGE_KEY = 'exhibition-mood-test:v5';

export function loadSavedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearSavedState() {
  localStorage.removeItem(STORAGE_KEY);
}
