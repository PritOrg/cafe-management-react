/**
 * Minimal ESC/POS encoder for network thermal printers (host:9100).
 * Tier 2 — text + cut; ₹ may render as Rs. on codepage-0 printers.
 */
const encodeText = (text) => Buffer.from(String(text || ''), 'utf8');

const buildReceipt = ({ lines = [], cut = true } = {}) => {
    const parts = [Buffer.from([0x1b, 0x40])]; // initialize
    for (const line of lines) {
        parts.push(encodeText(`${line}\n`));
    }
    if (cut) {
        parts.push(Buffer.from([0x1d, 0x56, 0x00])); // GS V 0 full cut
    }
    return Buffer.concat(parts);
};

/**
 * Send ESC/POS job to printer. Requires `net`. Fails soft if host missing.
 */
const printEscPos = async ({ host, port = 9100, lines, cut = true, timeoutMs = 5000 }) => {
    if (!host) {
        const err = new Error('print.printer_host is not configured');
        err.statusCode = 400;
        throw err;
    }
    const net = require('net');
    const payload = buildReceipt({ lines, cut });
    return new Promise((resolve, reject) => {
        const socket = net.connect({ host, port });
        const timer = setTimeout(() => {
            socket.destroy();
            reject(new Error('ESC/POS printer timeout'));
        }, timeoutMs);
        socket.on('connect', () => {
            socket.write(payload);
            socket.end();
        });
        socket.on('error', (err) => {
            clearTimeout(timer);
            reject(err);
        });
        socket.on('close', () => {
            clearTimeout(timer);
            resolve({ bytes: payload.length, host, port });
        });
    });
};

module.exports = { buildReceipt, printEscPos, encodeText };
