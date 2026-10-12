import { describe, it, expect, vi } from 'vitest';
import { attachTokenFromQuery } from '../middleware/auth.js';

const next = vi.fn();

describe('attachTokenFromQuery', () => {
    beforeEach(() => next.mockClear());

    it('lifts a ?token= query param into the Bearer header and strips it', () => {
        const req = { headers: {}, query: { token: 'abc123', mode: 'a4' } };
        attachTokenFromQuery(req, {}, next);
        expect(req.headers.authorization).toBe('Bearer abc123');
        expect(req.tokenFromQuery).toBe('abc123');
        expect(req.query.token).toBeUndefined();
        expect(req.query.mode).toBe('a4'); // other params intact
        expect(next).toHaveBeenCalledOnce();
    });

    it('keeps an existing Authorization header and does not touch the query', () => {
        const req = { headers: { authorization: 'Bearer existing' }, query: { token: 'x', mode: 'a4' } };
        attachTokenFromQuery(req, {}, next);
        expect(req.headers.authorization).toBe('Bearer existing');
        expect(req.query.token).toBe('x');
        expect(next).toHaveBeenCalledOnce();
    });

    it('is a no-op when there is no token param', () => {
        const req = { headers: {}, query: { mode: 'a4' } };
        attachTokenFromQuery(req, {}, next);
        expect(req.headers.authorization).toBeUndefined();
        expect(next).toHaveBeenCalledOnce();
    });
});