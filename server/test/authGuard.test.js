import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import { ensureAuthenticated } from '../middleware/auth.js';

const SECRET = 'auth-guard-test-secret';
process.env.JWT_SECRET = SECRET;

const mockRes = () => {
    const r = { req: { id: 'r1' }, body: null, statusCode: null };
    r.status = (c) => { r.statusCode = c; return r; };
    r.json = (b) => { r.body = b; return r; };
    return r;
};
const mockReq = (authorization) => ({
    headers: authorization ? { authorization } : {},
    ip: '1.2.3.4',
    get: () => 'test-ua',
});
const tick = () => new Promise((resolve) => setTimeout(resolve, 15));

describe('ensureAuthenticated', () => {
    it('rejects a missing Bearer header', () => {
        const res = mockRes();
        const next = () => { throw new Error('next should not run'); };
        ensureAuthenticated(mockReq(), res, next);
        expect(res.statusCode).toBe(401);
        expect(res.body.message).toMatch(/token is required/i);
    });

    it('rejects a non-Bearer scheme', () => {
        const res = mockRes();
        ensureAuthenticated(mockReq('Basic abc'), res, () => {});
        expect(res.statusCode).toBe(401);
    });

    it('rejects a garbage token', async () => {
        const res = mockRes();
        ensureAuthenticated(mockReq('Bearer not-a-real-jwt'), res, () => {});
        await tick();
        expect(res.statusCode).toBe(401);
        expect(res.body.message).toMatch(/invalid access token/i);
    });

    it('rejects a valid token that lacks id/email payload', async () => {
        const token = jwt.sign({ foo: 'bar' }, SECRET);
        const res = mockRes();
        ensureAuthenticated(mockReq(`Bearer ${token}`), res, () => {});
        await tick();
        expect(res.statusCode).toBe(401);
        expect(res.body.message).toMatch(/payload/i);
    });

    it('accepts a valid token, sets userId and calls next', async () => {
        const token = jwt.sign({ id: 'u1', email: 'a@b.c', role: 'admin' }, SECRET, { expiresIn: '5m' });
        const res = mockRes();
        const req = mockReq(`Bearer ${token}`);
        let calls = 0;
        ensureAuthenticated(req, res, () => { calls += 1; });
        await tick();
        expect(calls).toBe(1);
        expect(req.userId).toBe('u1');
    });
});