import { describe, it, expect } from 'vitest';
import { extractTenantSlug } from '../middleware/tenant.js';
import { requestId, REQUEST_ID_HEADER } from '../middleware/requestId.js';
import { sendResponse } from '../middleware/auth.js';

describe('tenant slug extraction', () => {
    it('parses subdomain hostnames', () => {
        expect(extractTenantSlug('cafe1.app.com')).toBe('cafe1');
        expect(extractTenantSlug('cafe1.localhost:3000')).toBe('cafe1');
        expect(extractTenantSlug('CAFE1.App.Com')).toBe('cafe1');
    });

    it('returns null for local/apex hosts', () => {
        expect(extractTenantSlug('localhost:4969')).toBe(null);
        expect(extractTenantSlug('127.0.0.1:3000')).toBe(null);
        expect(extractTenantSlug('app.com')).toBe(null);
        expect(extractTenantSlug('')).toBe(null);
    });
});

describe('requestId middleware', () => {
    it('generates uuid when header missing', () => {
        const req = { get: () => undefined };
        const res = { setHeader: (k, v) => { res[k] = v; } };
        let nextCalled = false;
        requestId(req, res, () => { nextCalled = true; });
        expect(nextCalled).toBe(true);
        expect(req.id).toMatch(/^[0-9a-f-]{36}$/i);
        expect(res[REQUEST_ID_HEADER]).toBe(req.id);
    });

    it('propagates valid client request id', () => {
        const req = { get: (h) => (h === REQUEST_ID_HEADER ? 'client-req-1' : undefined) };
        const res = { setHeader: () => {} };
        requestId(req, res, () => {});
        expect(req.id).toBe('client-req-1');
    });

    it('replaces invalid client request id', () => {
        const req = { get: (h) => (h === REQUEST_ID_HEADER ? 'bad id with spaces!' : undefined) };
        const res = { setHeader: () => {} };
        requestId(req, res, () => {});
        expect(req.id).not.toBe('bad id with spaces!');
        expect(req.id).toMatch(/^[0-9a-f-]{36}$/i);
    });
});

describe('sendResponse envelope', () => {
    it('includes requestId when present on res.req', () => {
        const calls = {};
        const res = {
            req: { id: 'req-abc' },
            status(c) { calls.code = c; return this; },
            json(b) { calls.body = b; return this; },
        };
        sendResponse(res, 201, true, 'ok', { a: 1 });
        expect(calls.code).toBe(201);
        expect(calls.body.success).toBe(true);
        expect(calls.body.message).toBe('ok');
        expect(calls.body.requestId).toBe('req-abc');
        expect(calls.body.data).toEqual({ a: 1 });
        expect(calls.body.timestamp).toBeTruthy();
    });

    it('omits data when null', () => {
        const res = { status: () => res, json: (b) => b };
        const body = sendResponse(res, 200, true, 'done');
        expect(body.data).toBeUndefined();
        expect(body.success).toBe(true);
    });
});
