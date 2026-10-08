const KEY = 'favourites';

const load = () => {
  try {
    const raw = localStorage.getItem(KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
};

let ids = load();
const listeners = new Set();

const emit = () => listeners.forEach((listener) => listener());

const persist = () => {
  try { localStorage.setItem(KEY, JSON.stringify([...ids])); } catch { /* ignore */ }
};

export const favouritesStore = {
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    return ids;
  },
  toggle(id) {
    if (!id) return;
    const next = new Set(ids);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    ids = next;
    persist();
    emit();
  },
  clear() {
    ids = new Set();
    persist();
    emit();
  },
};

export default favouritesStore;
