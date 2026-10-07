import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb, destroyDb } from '../db/pool.js';
import tenantRepo from '../repositories/tenantRepo.js';
import activityRepo from '../repositories/activityRepo.js';
import activityController from '../controllers/activityController.js';
import { placeOrder } from '../services/orderService.js';
import menuRepo from '../repositories/menuRepo.js';

const mockRes = () => {
    const r = { statusCode: null, body: null };
    r.status = (c) => { r.statusCode = c; return r; };
    r.json = (b) => { r.body = b; return r; };
    return r;
};

let tenant;

describe('activity log API (Phase G)', () => {
    beforeAll(async () => {
        await getDb().raw('select 1');
        tenant = await tenantRepo.findBySlug('cafe1') || await tenantRepo.create({ slug: 'cafe1', name: 'Cafe One' });
    });

    afterAll(async () => {
        await destroyDb();
    });

    it('order place writes activity row with action + entity', async () => {
        const menu = (await menuRepo.findAll(tenant._id)).find((m) => !m.sizes?.length && Number(m.price?.medium) > 0)
            || (await menuRepo.findAll(tenant._id))[0];
        const result = await placeOrder({
            tenantId: tenant._id,
            body: {
                items: [{ menuItemId: menu._id, size: 'medium', quantity: 1 }],
                paymentMethod: 'cash',
                phone: '9800001111',
                customerName: 'Act Log',
            },
        });
        expect(result.status).toBe(201);

        const logs = await activityRepo.listByTenant(tenant._id, 50);
        const orderLog = logs.find((l) => l.action === 'order.place');
        expect(orderLog).toBeTruthy();
        expect(orderLog.entity).toBe('order');
        expect(orderLog.entityId).toBeTruthy();
        expect(orderLog.tenantId).toBe(tenant._id);
    });

    it('GET /api/activity returns tenant-scoped rows', async () => {
        await activityRepo.log({
            tenantId: tenant._id,
            actorId: '22222222-2222-2222-2222-222222222222',
            actorType: 'admin',
            action: 'test.activity',
            entity: 'test',
            entityId: '33333333-3333-3333-3333-333333333333',
            meta: { note: 'hello' },
        });

        const res = mockRes();
        await activityController.listActivities({ tenantId: tenant._id, query: { action: 'test.activity' } }, res);
        expect(res.statusCode).toBe(200);
        expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
        expect(res.body.data.items[0].action).toBe('test.activity');
        expect(res.body.data.items[0].requestId).toBeNull();
    });

    it('filters by entity type + id', async () => {
        const res = mockRes();
        await activityController.listActivities({
            tenantId: tenant._id,
            query: { entityType: 'test', entityId: '33333333-3333-3333-3333-333333333333' },
        }, res);
        expect(res.statusCode).toBe(200);
        expect(res.body.data.items.every((r) => r.entity === 'test')).toBe(true);
    });

    it('entity history endpoint returns rows for one record', async () => {
        const res = mockRes();
        await activityController.getEntityHistory({
            tenantId: tenant._id,
            params: { type: 'test', id: '33333333-3333-3333-3333-333333333333' },
        }, res);
        expect(res.statusCode).toBe(200);
        expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('never stores password fields in meta', async () => {
        const rows = await getDb()('activity_logs')
            .where({ tenant_id: tenant._id })
            .select('meta');
        const dump = JSON.stringify(rows);
        expect(dump.toLowerCase()).not.toContain('password');
    });
});
