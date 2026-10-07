import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import { getDb, destroyDb } from '../db/pool.js';
import { placeOrder } from '../services/orderService.js';
import tenantRepo from '../repositories/tenantRepo.js';
import menuRepo from '../repositories/menuRepo.js';
import customerRepo from '../repositories/customerRepo.js';
import orderRepo from '../repositories/orderRepo.js';

const mockRes = () => {
    const r = { statusCode: null, body: null };
    r.status = (c) => { r.statusCode = c; return r; };
    r.json = (b) => { r.body = b; return r; };
    return r;
};

let tenant;
let menu;

describe('orderService.placeOrder integration', () => {
    beforeAll(async () => {
        await getDb().raw('select 1');
        tenant = await tenantRepo.findBySlug('cafe1');
        if (!tenant) {
            tenant = await tenantRepo.create({ slug: 'cafe1', name: 'Cafe One' });
        }
        const menus = await menuRepo.findAll(tenant._id);
        menu = menus.find((m) => m.title === 'House Latte') || menus[0];
        if (!menu) {
            menu = await menuRepo.create(tenant._id, {
                title: 'House Latte',
                subTitle: 'Hot',
                category: 'Coffee',
                price: { medium: 100, large: 150 },
                preparationTime: 5,
            });
        }
    });

    afterAll(async () => {
        await destroyDb();
    });

    it('places order with server pricing, phone customer, activity log', async () => {
        const phone = `9${Date.now().toString().slice(-9)}`;
        const result = await placeOrder({
            tenantId: tenant._id,
            role: 'customer',
            userId: 'test-user',
            body: {
                items: [{ menuItemId: menu._id, size: 'medium', quantity: 2 }],
                paymentMethod: 'cash',
                phone,
                customerName: 'Integ Guest',
            },
        });

        expect(result.status).toBe(201);
        expect(result.data.orderNumber).toMatch(/^ORD-\d{6}-\d{4}$/);
        const unit = Number(menu.price.medium);
        expect(result.data.order.totalAmount).toBe(unit * 2);
        const expectedTax = Math.round(unit * 2 * 0.05 * 100) / 100;
        expect(result.data.taxAmount).toBe(expectedTax);
        expect(result.data.order.finalAmount).toBe(Math.round((unit * 2 + expectedTax) * 100) / 100);
        expect(result.data.order.items.length).toBe(1);

        const loaded = await orderRepo.findByIdForOwner(tenant._id, result.data.order._id);
        expect(loaded.items[0].itemPrice).toBe(unit);

        const customers = await customerRepo.findByPhone(tenant._id, phone);
        expect(customers.length).toBeGreaterThanOrEqual(1);

        const logs = await getDb()('activity_logs')
            .where({ tenant_id: tenant._id, action: 'order.place' })
            .orderBy('created_at', 'desc')
            .limit(1);
        expect(logs.length).toBe(1);
    });

    it('rejects invalid payment method', async () => {
        const result = await placeOrder({
            tenantId: tenant._id,
            body: { items: [{ menuItemId: menu._id, size: 'medium', quantity: 1 }], paymentMethod: 'credit' },
        });
        expect(result.status).toBe(400);
    });

    it('rejects cross-tenant menu item', async () => {
        const other = await tenantRepo.findBySlug('cafe2') || await tenantRepo.create({ slug: 'cafe2', name: 'Cafe Two' });
        const foreignMenu = await menuRepo.create(other._id, {
            title: 'Other Item',
            subTitle: 'X',
            category: 'Coffee',
            price: { medium: 10, large: 10 },
            preparationTime: 1,
        });
        const result = await placeOrder({
            tenantId: tenant._id,
            body: { items: [{ menuItemId: foreignMenu._id, size: 'medium', quantity: 1 }], paymentMethod: 'cash' },
        });
        expect(result.status).toBe(400);
        expect(result.message).toMatch(/not found/i);
    });
});
