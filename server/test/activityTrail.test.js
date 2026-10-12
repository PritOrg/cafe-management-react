import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb, destroyDb } from '../db/pool.js';
import tenantRepo from '../repositories/tenantRepo.js';
import menuRepo from '../repositories/menuRepo.js';
import { placeOrder } from '../services/orderService.js';
import { issueForOrder } from '../services/invoiceService.js';
import { updateOrderStatus } from '../controllers/orderController.js';

let tenant;
let menu;

const stubRes = () => ({
    status() { return this; },
    json() {},
});

const statusReq = (orderId, status, i) => ({
    tenantId: tenant._id,
    userId: 'f99a4d2b-8eb2-4f52-9b1a-8f3e6c42b111',
    role: 'staff',
    id: `req-${i}`,
    params: { id: orderId },
    body: { status },
});

describe('order end-to-end activity trail (Phase G)', () => {
    beforeAll(async () => {
        await getDb().raw('select 1');
        tenant = await tenantRepo.findBySlug('cafe1');
        if (!tenant) tenant = await tenantRepo.create({ slug: 'cafe1', name: 'Cafe One' });
        menu = await menuRepo.create(tenant._id, {
            title: `Trail Latte ${Date.now()}`,
            subTitle: 'Hot',
            category: 'Coffee',
            price: { medium: 100, large: 150 },
            preparationTime: 2,
        });
    });

    afterAll(async () => {
        await destroyDb();
    });

    it('place + 3 status transitions + invoice issue produce >=5 activity rows', async () => {
        const phone = `96${Date.now().toString().slice(-8)}`;
        const placed = await placeOrder({
            tenantId: tenant._id,
            role: 'customer',
            userId: 'f99a4d2b-8eb2-4f52-9b1a-8f3e6c42b111',
            body: {
                items: [{ menuItemId: menu._id, size: 'medium', quantity: 1 }],
                paymentMethod: 'cash',
                phone,
                customerName: 'Trail Guest',
            },
        });
        const orderId = placed.data.order._id;
        expect(placed.status).toBe(201);

        for (const [i, status] of ['preparing', 'ready', 'served'].entries()) {
            const res = stubRes();
            await updateOrderStatus(statusReq(orderId, status, i), res);
        }
        const issued = await issueForOrder(tenant._id, orderId, {});
        const invoiceId = issued.invoice.id || issued.invoice._id;

        const rows = await getDb()('activity_logs')
            .where({ tenant_id: tenant._id })
            .whereIn('entity_id', [orderId, invoiceId])
            .whereIn('action', ['order.place', 'order.status', 'invoice.issue']);
        const actions = rows.map((r) => r.action);
        expect(rows.length).toBeGreaterThanOrEqual(5);
        expect(actions).toContain('order.place');
        expect(actions).toContain('invoice.issue');
        expect(actions.filter((a) => a === 'order.status').length >= 3).toBe(true);
        expect(actions.every((a) => !String(a).includes('password'))).toBe(true);
    });
});