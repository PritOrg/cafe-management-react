import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb, destroyDb } from '../db/pool.js';
import tenantRepo from '../repositories/tenantRepo.js';
import activityRepo from '../repositories/activityRepo.js';
import analyticsService from '../services/analyticsService.js';
import menuRepo from '../repositories/menuRepo.js';
import { placeOrder } from '../services/orderService.js';

let tenant;
let orderId;

describe('order history tab + analytics GST split', () => {
    beforeAll(async () => {
        await getDb().raw('select 1');
        tenant = await tenantRepo.findBySlug('cafe1') || await tenantRepo.create({ slug: 'cafe1', name: 'Cafe One' });
        const menu = (await menuRepo.findAll(tenant._id)).find((m) => !m.sizes?.length && Number(m.price?.medium) > 0)
            || (await menuRepo.findAll(tenant._id))[0];
        const placed = await placeOrder({
            tenantId: tenant._id,
            body: {
                items: [{ menuItemId: menu._id, size: 'medium', quantity: 2 }],
                paymentMethod: 'cash',
                phone: '9812345678',
                customerName: 'GST Guest',
            },
        });
        orderId = placed.data.order._id;
        await activityRepo.log({
            tenantId: tenant._id,
            actorId: '33333333-3333-3333-3333-333333333333',
            actorType: 'admin',
            action: 'order.status_change',
            entity: 'order',
            entityId: orderId,
            meta: { status: 'preparing', before: 'pending' },
        });
    });

    afterAll(async () => {
        await destroyDb();
    });

    it('entity history returns order activity rows for History tab', async () => {
        const rows = await getDb()('activity_logs')
            .where({ tenant_id: tenant._id, entity: 'order', entity_id: orderId })
            .orderBy('created_at', 'desc');
        expect(rows.length).toBeGreaterThanOrEqual(1);
        expect(rows.some((r) => r.action === 'order.place')).toBe(true);
        expect(rows.every((r) => r.entity_id === orderId)).toBe(true);
    });

    it('summary includes GST split (taxable vs tax)', async () => {
        const s = await analyticsService.summary(tenant._id);
        expect(s).toHaveProperty('taxableMinor');
        expect(s).toHaveProperty('taxMinor');
        expect(s).toHaveProperty('cgstMinor');
        expect(s).toHaveProperty('sgstMinor');
        expect(s.taxMinor).toBeGreaterThanOrEqual(0);
        // intra-state: cgst + sgst === tax
        expect(s.cgstMinor + s.sgstMinor).toBe(s.taxMinor);
        expect(s.taxableMinor).toBeGreaterThanOrEqual(0);
    });

    it('sales series exposes tax totals for period', async () => {
        const s = await analyticsService.salesSeries(tenant._id, '7d');
        expect(s).toHaveProperty('taxMinor');
        expect(s).toHaveProperty('taxableMinor');
        expect(s.cgstMinor + s.sgstMinor).toBe(s.taxMinor);
    });
});
