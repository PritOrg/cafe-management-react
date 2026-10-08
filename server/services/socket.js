/**
 * Realtime ops notifications over Socket.IO (namespace `/ops`).
 * Auth = JWT in the handshake; each socket joins `tenant:<id>` so tenants never
 * see each other's events. Sockets are notification-only — clients refetch.
 */
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const events = require('./events');

const OPS_EVENTS = ['order:created', 'order:status', 'stock:low', 'invoice:issued', 'activity:new'];

const roomFor = (tenantId) => `tenant:${tenantId}`;

let io = null;

const allowedOrigin = (origin, callback) => {
    if (!origin) return callback(null, true);
    try {
        const host = new URL(origin).hostname.toLowerCase();
        const configured = (process.env.CORS_ORIGINS || '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
        if (configured.includes(origin)) return callback(null, true);
        if (host === 'localhost' || host.endsWith('.localhost') || host === '127.0.0.1') return callback(null, true);
        const publicDomain = (process.env.PUBLIC_DOMAIN || '').toLowerCase();
        if (publicDomain && (host === publicDomain || host.endsWith(`.${publicDomain}`))) return callback(null, true);
    } catch {
        /* malformed origin */
    }
    return callback(null, false);
};

const initSocket = (httpServer) => {
    if (io) return io;

    io = new Server(httpServer, {
        cors: { origin: allowedOrigin, credentials: true },
    });

    const ops = io.of('/ops');

    ops.use((socket, next) => {
        const token = socket.handshake.auth?.token || socket.handshake.query?.token;
        if (!token) return next(new Error('Authentication required'));
        return jwt.verify(token, process.env.JWT_SECRET || 'newSecret', (err, decoded) => {
            if (err) return next(new Error('Invalid token'));
            socket.data.user = decoded;
            return next();
        });
    });

    ops.on('connection', (socket) => {
        const user = socket.data.user || {};
        const tenantId = user.tenantId || user.tenant_id;
        if (tenantId) socket.join(roomFor(tenantId));
        socket.emit('ready', { tenantId: tenantId || null });
    });

    OPS_EVENTS.forEach((event) => {
        events.on(event, (payload) => {
            if (!payload || !payload.tenantId) return;
            ops.to(roomFor(payload.tenantId)).emit(event, payload);
        });
    });

    return io;
};

module.exports = { initSocket, OPS_EVENTS };
