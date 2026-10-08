import { io } from 'socket.io-client';

/**
 * Single Socket.IO client for the `/ops` namespace. Sockets are notification
 * only — on an event components refetch (server wins). Auth = JWT from storage.
 */
const listeners = new Map();
let socket = null;

const socketOrigin = () => {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:4969/api/v1';
  try {
    return new URL(base, window.location.origin).origin;
  } catch {
    return window.location.origin;
  }
};

const OPS_EVENTS = ['order:created', 'order:status', 'stock:low', 'invoice:issued', 'activity:new'];

const ensureSocket = () => {
  if (socket) return socket;
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');
  if (!token) return null;

  socket = io(`${socketOrigin()}/ops`, {
    auth: { token },
    withCredentials: true,
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
  });

  OPS_EVENTS.forEach((event) => {
    socket.on(event, (payload) => {
      (listeners.get(event) || []).forEach((handler) => {
        try { handler(payload); } catch { /* handler error should not break others */ }
      });
    });
  });

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

export default { subscribeOps };
