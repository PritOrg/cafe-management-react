import { describe, it, expect } from 'vitest';
import { allowRoles } from '../middleware/roles.js';

const mockRes = () => {
    const r = { statusCode: null, body: null };
    r.status = (c) => { r.statusCode = c; return r; };
    r.json = (b) => { r.body = b; return r; };
    return r;
};

describe('allowRoles', () => {
    it('forbids unlisted roles', () => {
        const res = mockRes();
        let next = false;
        allowRoles('admin', 'staff')({ role: 'customer' }, res, () => { next = true; });
        expect(next).toBe(false);
        expect(res.statusCode).toBe(403);
    });

    it('allows listed roles', () => {
        let next = false;
        allowRoles('admin', 'staff')({ role: 'staff' }, mockRes(), () => { next = true; });
        expect(next).toBe(true);
    });
});
