import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { destroyDb } from '../db/pool.js';
import tenantRepo from '../repositories/tenantRepo.js';
import { getSummary, getSales, getOrderStats, getTopItems, getCategoryMix } from '../controllers/analyticsController.js';

const mockRes = () => {
    const r = { statusCode: null, body: null };
    r.status = (c) => { r.statusCode = c; return r; };
    r.json = (b) => { r.body = b; return r; };
    return r;
};

let tenant;

describe('analyticsController integration', () => {
    beforeAll(async () => {
        tenant = await tenantRepo.findBySlug('cafe1') || await tenantRepo.create({ slug: 'cafe1', name: 'Cafe One' });
    });

    afterAll(async () => {
        await destroyDb();
    });

    it('getSummary returns envelope data', async () => {
        const res = mockRes();
        await getSummary({ tenantId: tenant._id }, res);
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('revenue');
        expect(res.body.data).toHaveProperty('ordersCount');
    });

    it('getSales + getOrderStats + top-items + category-mix', async () => {
        const sales = mockRes();
        await getSales({ tenantId: tenant._id, query: { period: 'bogus' } }, sales);
        expect(sales.statusCode).toBe(200);
        expect(Array.isArray(sales.body.data.series)).toBe(true);

        const stats = mockRes();
        await getOrderStats({ tenantId: tenant._id, query: { period: '7d' } }, stats);
        expect(stats.statusCode).toBe(200);

        const top = mockRes();
        await getTopItems({ tenantId: tenant._id, query: { limit: '5' } }, top);
        expect(top.statusCode).toBe(200);

        const mix = mockRes();
        await getCategoryMix({ tenantId: tenant._id, query: { period: '30d' } }, mix);
        expect(mix.statusCode).toBe(200);
        expect(Array.isArray(mix.body.data)).toBe(true);
    });
});
