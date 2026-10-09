/**
 * Single Socket.IO client for the `/ops` namespace. Sockets are notification
 * only — on an event components refetch (server wins). Auth = JWT from storage.
 * socket.io-client is imported lazily so it stays out of the initial bundle.
 */
const listeners = new Map();
const statusListeners = new Set();
let socket = null;
let initPromise = null;
let status = 'connecting'; // 'connected' | 'connecting' | 'disconnected'

const OPS_EVENTS = ['order:created', 'order:status', 'stock:low', 'invoice:issued', 'activity:new'];

const socketOrigin = () => {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:4969/api/v1';
  try {
    return new URL(base, window.location.origin).origin;
  } catch {
    return window.location.origin;
  }
};

const setStatus = (next) => {
  if (status === next) return;
  status = next;
  statusListeners.forEach((handler) => handler());
};

const ensureSocket = () => {
  if (socket) return socket;
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');
  if (!token) {
    setStatus('disconnected');
    return null;
  }
  if (!initPromise) {
    initPromise = import('socket.io-client').then(({ io }) => {
      socket = io(`${socketOrigin()}/ops`, {
        auth: { token },
        withCredentials: true,
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 10000,
      });

      socket.on('connect', () => setStatus('connected'));
      socket.on('disconnect', () => setStatus('disconnected'));
      socket.on('connect_error', () => setStatus('disconnected'));

      OPS_EVENTS.forEach((event) => {
        socket.on(event, (payload) => {
          (listeners.get(event) || []).forEach((handler) => {
            try { handler(payload); } catch { /* handler error should not break others */ }
          });
        });
      });
      return socket;
    });
  }
  return socket;
};

/** Subscribe to an ops event; returns an unsubscribe function. */
export const subscribeOps = (event, handler) => {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event).add(handler);
  ensureSocket();
  return () => {
    listeners.get(event)?.delete(handler);
  };
};

/** Current realtime connection status (for a status indicator). */
export const getSocketStatus = () => status;

/** Subscribe to status changes; immediately invokes the handler with current state. */
export const subscribeStatus = (handler) => {
  statusListeners.add(handler);
  ensureSocket();
  return () => statusListeners.delete(handler);
};

export default { subscribeOps, subscribeStatus, getSocketStatus };
