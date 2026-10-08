import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import generateToken from '../utils/generateToken.js';
import handleError from '../utils/handleError.js';
import { ensureAdmin, ensurePlatformAdmin } from '../middleware/auth.js';

describe('generateToken', () => {
    it('includes id email role tenantId isPlatformAdmin', () => {
        process.env.JWT_SECRET = 'test-secret';
        const token = generateToken({
            _id: 'u1',
            email: 'a@b.c',
            role: 'staff',
            tenantId: 't1',
            isPlatformAdmin: false,
        });
        const payload = jwt.decode(token);
        expect(payload.id).toBe('u1');
        expect(payload.email).toBe('a@b.c');
        expect(payload.role).toBe('staff');
        expect(payload.tenantId).toBe('t1');
        expect(payload.isPlatformAdmin).toBe(false);
    });

    it('marks platform admin true', () => {
        process.env.JWT_SECRET = 'test-secret';
        const token = generateToken({ _id: 'p1', email: 'p@x.y', role: 'admin', isPlatformAdmin: true });
        expect(jwt.decode(token).isPlatformAdmin).toBe(true);
    });
});

describe('handleError util', () => {
    it('sends sendResponse envelope', () => {
        const res = {
            status: (c) => { res.code = c; return res; },
            json: (b) => { res.body = b; return res; },
        };
        handleError(res, new Error('boom'), 418, 'teapot');
        expect(res.code).toBe(418);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('teapot');
    });
});

describe('auth guards', () => {
    const reqWithRole = (role) => ({ role, get: () => 'vitest', ip: '127.0.0.1', userId: 'u', userEmail: 'e@x.y' });

    it('ensureAdmin rejects non-admin', () => {
        const res = { status: (c) => { res.code = c; return res; }, json: (b) => { res.body = b; return res; } };
        let next = false;
        ensureAdmin(reqWithRole('staff'), res, () => { next = true; });
        expect(next).toBe(false);
        expect(res.code).toBe(403);
    });

    it('ensureAdmin allows admin', () => {
        let next = false;
        ensureAdmin(reqWithRole('admin'), { status: () => ({ json: () => {} }) }, () => { next = true; });
        expect(next).toBe(true);
    });

    it('ensurePlatformAdmin rejects non-platform', () => {
        const res = { status: (c) => { res.code = c; return res; }, json: (b) => { res.body = b; return res; } };
        let next = false;
        ensurePlatformAdmin({ isPlatformAdmin: false, get: () => 'v' }, res, () => { next = true; });
        expect(next).toBe(false);
        expect(res.code).toBe(403);
    });

    it('ensurePlatformAdmin allows platform admin', () => {
        let next = false;
        ensurePlatformAdmin({ isPlatformAdmin: true }, { status: () => ({ json: () => {} }) }, () => { next = true; });
        expect(next).toBe(true);
    });
});
