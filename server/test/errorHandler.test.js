import { describe, it, expect } from 'vitest';
import { globalErrorHandler, handleNotFound, AppError } from '../middleware/errorHandler.js';

const mockRes = () => {
    const r = { statusCode: null, body: null };
    r.status = (c) => { r.statusCode = c; return r; };
    r.json = (b) => { r.body = b; return r; };
    return r;
};

const mockReq = () => ({
    method: 'GET',
    originalUrl: '/test',
    ip: '127.0.0.1',
    get: () => 'test-agent',
});

describe('errorHandler', () => {
    it('maps pg 23505 duplicate to 409 in production', () => {
        const prev = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';
        const res = mockRes();
        globalErrorHandler({ code: '23505', detail: 'Value already exists', message: 'x' }, mockReq(), res, () => {});
        expect(res.statusCode).toBe(409);
        expect(res.body.success).toBe(false);
        process.env.NODE_ENV = prev;
    });

    it('maps invalid input 22P02 to 400 in production', () => {
        const prev = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';
        const res = mockRes();
        globalErrorHandler({ code: '22P02', message: 'invalid uuid' }, mockReq(), res, () => {});
        expect(res.statusCode).toBe(400);
        process.env.NODE_ENV = prev;
    });

    it('handleNotFound creates AppError 404', () => {
        let err = null;
        handleNotFound({ originalUrl: '/nope' }, {}, (e) => { err = e; });
        expect(err).toBeInstanceOf(AppError);
        expect(err.statusCode).toBe(404);
    });
});
