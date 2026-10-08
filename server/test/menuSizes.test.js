import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb, destroyDb } from '../db/pool.js';
import tenantRepo from '../repositories/tenantRepo.js';
import menuRepo from '../repositories/menuRepo.js';
import { placeOrder } from '../services/orderService.js';

let tenant;

describe('flexible menu sizes (Swiggy-style)', () => {
    beforeAll(async () => {
        await getDb().raw('select 1');
        tenant = await tenantRepo.findBySlug('cafe1') || await tenantRepo.create({ slug: 'cafe1', name: 'Cafe One' });
    });

    afterAll(async () => {
        await destroyDb();
    });

    it('creates menu item with custom size variants (ml/g labels)', async () => {
        const item = await menuRepo.create(tenant._id, {
            title: `Cold Coffee ${Date.now()}`,
            subTitle: 'Sized drink',
            category: 'Beverages',
            preparationTime: 3,
            sizes: [
                { label: '250ml', price: 99, isDefault: true },
                { label: '500ml', price: 149 },
                { label: '1L', price: 249 },
            ],
        });
        expect(item.sizes.length).toBe(3);
        expect(item.sizes.find((s) => s.label === '250ml').price).toBe(99);
        expect(item.sizes.find((s) => s.isDefault).label).toBe('250ml');

        const loaded = await menuRepo.findById(tenant._id, item._id);
        expect(loaded.sizes.map((s) => s.label)).toEqual(['250ml', '500ml', '1L']);
    });

    it('supports items with NO size options (single price)', async () => {
        const item = await menuRepo.create(tenant._id, {
            title: `Pastry ${Date.now()}`,
            subTitle: 'No size',
            category: 'Pastries',
            preparationTime: 2,
            price: { medium: 80, large: 80 }, // legacy single price
            sizes: [],
        });
        expect(item.sizes).toEqual([]);
        expect(item.price.medium).toBe(80);

        const result = await placeOrder({
            tenantId: tenant._id,
            body: {
                items: [{ menuItemId: item._id, size: null, quantity: 1 }],
                paymentMethod: 'cash',
            },
        });
        expect(result.status).toBe(201);
        expect(result.data.order.totalAmount).toBe(80);
    });

    it('orders priced from selected size label (not hardcoded medium/large)', async () => {
        const item = await menuRepo.create(tenant._id, {
            title: `Frappé ${Date.now()}`,
            subTitle: 'Sized',
            category: 'Beverages',
            preparationTime: 4,
            sizes: [
                { label: 'Small', price: 120, isDefault: true },
                { label: 'Large', price: 180 },
            ],
        });

        const small = await placeOrder({
            tenantId: tenant._id,
            body: { items: [{ menuItemId: item._id, size: 'Small', quantity: 2 }], paymentMethod: 'cash' },
        });
        expect(small.status).toBe(201);
        expect(small.data.order.totalAmount).toBe(240);

        const large = await placeOrder({
            tenantId: tenant._id,
            body: { items: [{ menuItemId: item._id, size: 'Large', quantity: 1 }], paymentMethod: 'cash' },
        });
        expect(large.status).toBe(201);
        expect(large.data.order.totalAmount).toBe(180);
    });

    it('rejects unknown size label when item has sizes', async () => {
        const item = await menuRepo.create(tenant._id, {
            title: `Sized Only ${Date.now()}`,
            subTitle: 'x',
            category: 'Coffee',
            preparationTime: 1,
            sizes: [{ label: 'Regular', price: 50, isDefault: true }],
        });
        const result = await placeOrder({
            tenantId: tenant._id,
            body: { items: [{ menuItemId: item._id, size: 'Mega', quantity: 1 }], paymentMethod: 'cash' },
        });
        expect(result.status).toBe(400);
        expect(result.message).toMatch(/size/i);
    });

    it('legacy medium/large items still work for backward compatibility', async () => {
        const item = await menuRepo.create(tenant._id, {
            title: `Legacy ${Date.now()}`,
            subTitle: 'old style',
            category: 'Coffee',
            preparationTime: 2,
            price: { medium: 100, large: 150 },
            sizes: [], // empty sizes → use price.medium / price.large
        });
        const med = await placeOrder({
            tenantId: tenant._id,
            body: { items: [{ menuItemId: item._id, size: 'medium', quantity: 1 }], paymentMethod: 'cash' },
        });
        expect(med.status).toBe(201);
        expect(med.data.order.totalAmount).toBe(100);

        const larg = await placeOrder({
            tenantId: tenant._id,
            body: { items: [{ menuItemId: item._id, size: 'large', quantity: 1 }], paymentMethod: 'cash' },
        });
        expect(larg.data.order.totalAmount).toBe(150);
    });
});
