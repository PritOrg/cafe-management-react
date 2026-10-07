import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb, destroyDb } from '../db/pool.js';
import { summary, salesSeries, orderStats, topItems, categoryMix } from '../services/analyticsService.js';
import tenantRepo from '../repositories/tenantRepo.js';

let tenant;

describe('analyticsService integration', () => {
    beforeAll(async () => {
        await getDb().raw('select 1');
        tenant = await tenantRepo.findBySlug('cafe1');
        if (!tenant) tenant = await tenantRepo.create({ slug: 'cafe1', name: 'Cafe One' });
    });

    afterAll(async () => {
        await destroyDb();
    });

    it('summary returns structured metrics', async () => {
        const s = await summary(tenant._id);
        expect(s).toHaveProperty('revenue');
        expect(s).toHaveProperty('ordersCount');
        expect(s).toHaveProperty('aov');
        expect(s).toHaveProperty('pendingCount');
        expect(s).toHaveProperty('topItems');
        expect(s).toHaveProperty('prevDayDeltaBps');
        expect(typeof s.revenueMinor).toBe('number');
        expect(Array.isArray(s.topItems)).toBe(true);
    });

    it('salesSeries returns series array', async () => {
        const s = await salesSeries(tenant._id, '7d');
        expect(Array.isArray(s.series)).toBe(true);
        expect(Array.isArray(s.breakdown)).toBe(true);
        expect(typeof s.totalRevenue).toBe('number');
        expect(typeof s.revenueChangePct).toBe('number');
    });

    it('orderStats returns status and payment maps', async () => {
        const s = await orderStats(tenant._id, '7d');
        expect(s.byStatus).toBeTypeOf('object');
        expect(Array.isArray(s.byPaymentMethod)).toBe(true);
    });

    it('topItems and categoryMix return arrays', async () => {
        const top = await topItems(tenant._id, '7d', 5);
        const mix = await categoryMix(tenant._id, '7d');
        expect(Array.isArray(top)).toBe(true);
        expect(Array.isArray(mix)).toBe(true);
    });
});
