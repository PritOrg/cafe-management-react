import { describe, it, expect } from 'vitest';
import { attachApiResponse, responseTimeTracker } from '../middleware/apiResponse.js';

const mockRes = () => {
    const r = { statusCode: 200, body: null, req: {} };
    r.status = (c) => { r.statusCode = c; return r; };
    r.json = (b) => { r.body = b; return r; };
    r.set = (k, v) => { r[k] = v; return r; };
    return r;
};

describe('apiResponse middleware', () => {
    it('attachApiResponse sets req/res helpers', () => {
        const req = { id: 'r1', method: 'GET', originalUrl: '/x' };
        const res = mockRes();
        let next = false;
        attachApiResponse(req, res, () => { next = true; });
        expect(next).toBe(true);
        expect(req.apiResponse).toBeTruthy();
        expect(res.apiResponse).toBe(req.apiResponse);

        res.apiResponse.success({ a: 1 }, 'worked', 200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toEqual({ a: 1 });
        expect(res.body.meta.requestId).toBe('r1');
    });

    it('apiResponse.error maps status', () => {
        const req = { id: 'r2', method: 'GET', originalUrl: '/e' };
        const res = mockRes();
        attachApiResponse(req, res, () => {});
        res.apiResponse.error('Nope', 404);
        expect(res.statusCode).toBe(404);
        expect(res.body.success).toBe(false);
    });

    it('responseTimeTracker sets header', () => {
        const res = mockRes();
        res.end = function end() {};
        let next = false;
        responseTimeTracker({}, res, () => { next = true; });
        expect(next).toBe(true);
        res.end();
        expect(res['X-Response-Time']).toMatch(/ms$/);
    });
});

describe('healthCheckHandler', () => {
    it('returns health json', async () => {
        const monitor = await import('../middleware/healthMonitor.js');
        // Force metrics init in case interval hasn't fired
        if (monitor.healthMonitor && monitor.healthMonitor.updateSystemMetrics) {
            await monitor.healthMonitor.updateSystemMetrics();
        }
        const healthRes = mockRes();
        monitor.healthCheckHandler({ originalUrl: '/health' }, healthRes);
        expect(healthRes.body).toBeTruthy();
        expect(healthRes.statusCode === 200 || healthRes.statusCode === 503).toBe(true);
    });
});
