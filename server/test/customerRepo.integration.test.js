import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb, destroyDb } from '../db/pool.js';
import tenantRepo from '../repositories/tenantRepo.js';
import customerRepo from '../repositories/customerRepo.js';
import { placeOrder } from '../services/orderService.js';
import menuRepo from '../repositories/menuRepo.js';

let tenant;
let customerId;
let phone;

describe('customerRepo + controller integration', () => {
    beforeAll(async () => {
        await getDb().raw('select 1');
        tenant = await tenantRepo.findBySlug('cafe1') || await tenantRepo.create({ slug: 'cafe1', name: 'Cafe One' });
        phone = `9${Date.now().toString().slice(-9)}`;
        let menu = (await menuRepo.findAll(tenant._id)).find((m) => !m.sizes?.length && Number(m.price?.medium) > 0);
        if (!menu) {
            menu = await menuRepo.create(tenant._id, {
                title: `Cust Latte ${Date.now()}`,
                subTitle: 'Hot',
                category: 'Coffee',
                price: { medium: 110, large: 150 },
                preparationTime: 3,
                sizes: [],
            });
        }
        await placeOrder({
            tenantId: tenant._id,
            body: {
                items: [{ menuItemId: menu._id, size: 'medium', quantity: 3 }],
                paymentMethod: 'cash',
                phone,
                customerName: 'Coverage Guest',
            },
        });
        const found = await customerRepo.findByPhone(tenant._id, phone);
        customerId = found[0]._id;
    });

    afterAll(async () => {
        await destroyDb();
    });

    it('lists customers with search', async () => {
        const page = await customerRepo.list(tenant._id, { search: phone, limit: 10 });
        expect(page.items.length).toBeGreaterThanOrEqual(1);
        expect(page.total).toBeGreaterThanOrEqual(1);
        expect(page.page).toBe(1);
    });

    it('summary derives LTV and favorites from orders', async () => {
        const s = await customerRepo.summary(tenant._id, customerId);
        expect(s.ordersCount).toBeGreaterThanOrEqual(1);
        expect(s.lifetimeValue).toBeGreaterThan(0);
        expect(s.favoriteItems.length).toBeGreaterThanOrEqual(1);
        expect(['Silver', 'Gold', 'Platinum']).toContain(s.membershipLevel);
    });

    it('findOrders returns order rows', async () => {
        const orders = await customerRepo.findOrders(tenant._id, customerId);
        expect(orders.length).toBeGreaterThanOrEqual(1);
        expect(orders[0].orderNumber).toMatch(/^ORD-/);
    });

    it('soft delete sets is_active false', async () => {
        const deleted = await customerRepo.softDelete(tenant._id, customerId);
        expect(deleted.isActive).toBe(false);
        const again = await customerRepo.findById(tenant._id, customerId);
        expect(again.isActive).toBe(false);
    });

    it('updateLoyalty increments points', async () => {
        const updated = await customerRepo.updateLoyalty(tenant._id, customerId, { addPoints: 25, membershipLevel: 'Gold' });
        expect(updated.loyaltyPoints).toBeGreaterThanOrEqual(25);
        expect(updated.membershipLevel).toBe('Gold');
    });
});
