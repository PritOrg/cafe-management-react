import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb, destroyDb } from '../db/pool.js';
import tenantRepo from '../repositories/tenantRepo.js';
import menuRepo from '../repositories/menuRepo.js';
import inventoryRepo from '../repositories/inventoryRepo.js';
import settingsRepo from '../repositories/settingsRepo.js';
import { placeOrder } from '../services/orderService.js';

let tenant;
let trackedMenu;
let inventoryItem;

describe('orderService stock deduction (subtract_stock)', () => {
    beforeAll(async () => {
        await getDb().raw('select 1');
        tenant = await tenantRepo.findBySlug('cafe1') || await tenantRepo.create({ slug: 'cafe1', name: 'Cafe One' });

        trackedMenu = await menuRepo.create(tenant._id, {
            title: `Stock Latte ${Date.now()}`,
            subTitle: 'Track',
            category: 'Coffee',
            price: { medium: 100, large: 150 },
            preparationTime: 2,
            subtractStock: true,
        });

        inventoryItem = await inventoryRepo.create(tenant._id, {
            itemName: trackedMenu.title,
            quantity: 100,
            unit: 'g',
            category: 'Coffee',
            minQty: 10,
            menuItemId: trackedMenu._id,
        });
    });

    afterAll(async () => {
        await destroyDb();
    });

    it('creates order movement reason=order when subtract_stock menu sold', async () => {
        const before = await inventoryRepo.findById(tenant._id, inventoryItem._id);
        expect(before.quantity).toBe(100);

        const result = await placeOrder({
            tenantId: tenant._id,
            body: {
                items: [{ menuItemId: trackedMenu._id, size: 'medium', quantity: 2 }],
                paymentMethod: 'cash',
            },
        });
        expect(result.status).toBe(201);

        // stock hook: if implemented, qty drops and movement exists
        const after = await inventoryRepo.findById(tenant._id, inventoryItem._id);
        const movements = await inventoryRepo.listMovements(tenant._id, inventoryItem._id);
        const orderMoves = movements.filter((m) => m.type === 'order' || (m.note || '').includes('order'));

        // Contract: after this test passes implementation, quantity < before and order movement exists
        if (after.quantity !== before.quantity) {
            expect(after.quantity).toBe(before.quantity - 2);
            expect(orderMoves.length).toBeGreaterThanOrEqual(1);
            expect(orderMoves[0].refOrderId).toBeTruthy();
        } else {
            // Fail until deduction is implemented
            expect(after.quantity).toBeLessThan(before.quantity);
        }
    });

    it('skips stock deduction when the tenant disables inventory tracking', async () => {
        const before = await inventoryRepo.findById(tenant._id, inventoryItem._id);
        const current = await settingsRepo.getOrCreate(tenant._id);
        await settingsRepo.update(tenant._id, { ops: { ...current.ops, inventory_enabled: false } });
        try {
            const result = await placeOrder({
                tenantId: tenant._id,
                body: {
                    items: [{ menuItemId: trackedMenu._id, size: 'medium', quantity: 3 }],
                    paymentMethod: 'cash',
                },
            });
            expect(result.status).toBe(201);
            const after = await inventoryRepo.findById(tenant._id, inventoryItem._id);
            expect(after.quantity).toBe(before.quantity); // unchanged — deductions are off
        } finally {
            await settingsRepo.update(tenant._id, { ops: { ...current.ops, inventory_enabled: true } });
        }
    });
});
