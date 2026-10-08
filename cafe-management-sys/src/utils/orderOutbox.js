import { ordersAPI } from '../services/api';

// Offline order outbox — failed POST /orders are queued in IndexedDB and replayed
// on reconnect. Server dedupes on clientOrderId, so replays never duplicate.

const DB_NAME = 'cafe-outbox';
const STORE = 'orders';

const openDb = () =>
  new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'clientOrderId' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const withStore = async (mode, fn) => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const txn = db.transaction(STORE, mode);
    const store = txn.objectStore(STORE);
    let result;
    try {
      result = fn(store);
    } catch (err) {
      reject(err);
      return;
    }
    txn.oncomplete = () => resolve(result && 'result' in result ? result.result : result);
    txn.onerror = () => reject(txn.error);
  });
};

export const addToOutbox = (entry) => withStore('readwrite', (store) => store.put(entry));

export const removeFromOutbox = (clientOrderId) => withStore('readwrite', (store) => store.delete(clientOrderId));

export const listOutbox = () => withStore('readonly', (store) => store.getAll());

export const outboxCount = async () => {
  try {
    return (await listOutbox()).length;
  } catch {
    return 0;
  }
};

/** Replay queued orders (idempotent via clientOrderId). Returns how many synced. */
export const flushOutbox = async () => {
  let entries = [];
  try {
    entries = await listOutbox();
  } catch {
    return 0;
  }
  let synced = 0;
  for (const entry of entries) {
    try {
      // eslint-disable-next-line no-await-in-loop
      await ordersAPI.create(entry.orderData);
      // eslint-disable-next-line no-await-in-loop
      await removeFromOutbox(entry.clientOrderId);
      synced += 1;
    } catch {
      /* leave queued for the next attempt */
    }
  }
  if (synced > 0 && typeof window !== 'undefined') {
    window.dispatchEvent(new Event('outbox:changed'));
  }
  return synced;
};
