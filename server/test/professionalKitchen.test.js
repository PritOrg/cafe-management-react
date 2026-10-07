import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb, destroyDb } from '../db/pool.js';
import tenantRepo from '../repositories/tenantRepo.js';
import categoryRepo from '../repositories/categoryRepo.js';
import modifierRepo from '../repositories/modifierRepo.js';
import recipeRepo from '../repositories/recipeRepo.js';
import menuRepo from '../repositories/menuRepo.js';
import inventoryRepo from '../repositories/inventoryRepo.js';
import { placeOrder } from '../services/orderService.js';
import inventoryController from '../controllers/inventoryController.js';
import kitchenController from '../controllers/kitchenController.js';

const mockRes = () => {
    const r = { statusCode: null, body: null };
    r.status = (c) => { r.statusCode = c; return r; };
    r.json = (b) => { r.body = b; return r; };
    return r;
};

let tenant;

describe('professional kitchen: categories, modifiers, recipes, alerts, kitchen board', () => {
    beforeAll(async () => {
        await getDb().raw('select 1');
        tenant = await tenantRepo.findBySlug('cafe1') || await tenantRepo.create({ slug: 'cafe1', name: 'Cafe One' });
    });

    afterAll(async () => {
        await destroyDb();
    });

    it('creates tenant-scoped categories', async () => {
        const cat = await categoryRepo.create(tenant._id, { name: `Coffee ${Date.now()}`, slug: `coffee-${Date.now()}` });
        expect(cat.tenantId).toBe(tenant._id);
        const list = await categoryRepo.findAll(tenant._id);
        expect(list.some((c) => c._id === cat._id)).toBe(true);

        const other = await tenantRepo.findBySlug('cafe2') || await tenantRepo.create({ slug: 'cafe2', name: 'Cafe Two' });
        const listB = await categoryRepo.findAll(other._id);
        expect(listB.some((c) => c._id === cat._id)).toBe(false);
    });

    it('modifier groups have priced options (radio/checkbox)', async () => {
        const group = await modifierRepo.createGroup(tenant._id, {
            name: 'Milk',
            displayType: 'radio',
            options: [
                { name: 'Regular', priceDelta: 0 },
                { name: 'Almond', priceDelta: 20 },
                { name: 'Oat', priceDelta: 30 },
            ],
        });
        expect(group.options.length).toBe(3);
        expect(group.options.find((o) => o.name === 'Almond').priceDelta).toBe(20);

        const loaded = await modifierRepo.getGroup(tenant._id, group._id);
        expect(loaded.displayType).toBe('radio');
    });

    it('menu item can attach modifier groups', async () => {
        const group = await modifierRepo.createGroup(tenant._id, {
            name: 'Extra shots',
            displayType: 'checkbox',
            options: [{ name: 'Extra shot', priceDelta: 40 }],
        });
        const menu = await menuRepo.create(tenant._id, {
            title: `Chef Special ${Date.now()}`,
            subTitle: 'With mods',
            category: 'Coffee',
            price: { medium: 150, large: 180 },
            preparationTime: 4,
            modifierGroupIds: [group._id],
        });
        expect(menu.modifierGroups.some((g) => g._id === group._id)).toBe(true);
    });

    it('recipes (BOM) auto-deduct inventory on order', async () => {
        const menu = await menuRepo.create(tenant._id, {
            title: `Recipe Latte ${Date.now()}`,
            subTitle: 'BOM test',
            category: 'Coffee',
            price: { medium: 120, large: 160 },
            preparationTime: 3,
        });
        const inv = await inventoryRepo.create(tenant._id, {
            itemName: 'Espresso beans',
            quantity: 1000,
            unit: 'g',
            category: 'Coffee',
            minQty: 100,
            menuItemId: menu._id,
        });
        // recipe: 20g beans per medium latte
        const recipe = await recipeRepo.add(tenant._id, {
            menuItemId: menu._id,
            inventoryItemId: inv._id,
            qty: 20,
            unit: 'g',
        });
        expect(recipe.qty).toBe(20);

        const before = await inventoryRepo.findById(tenant._id, inv._id);
        expect(before.quantity).toBe(1000);

        const order = await placeOrder({
            tenantId: tenant._id,
            body: {
                items: [{ menuItemId: menu._id, size: 'medium', quantity: 3 }],
                paymentMethod: 'cash',
            },
        });
        expect(order.status).toBe(201);

        const after = await inventoryRepo.findById(tenant._id, inv._id);
        // 3 lattes * 20g = 60g deducted
        expect(after.quantity).toBe(940);

        const moves = await inventoryRepo.listMovements(tenant._id, inv._id);
        const orderMove = moves.find((m) => m.type === 'order');
        expect(orderMove).toBeTruthy();
        expect(orderMove.delta).toBe(-60);
        expect(orderMove.refOrderId).toBeTruthy();
    });

    it('low stock alerts return items at/below min', async () => {
        const inv = await inventoryRepo.create(tenant._id, {
            itemName: 'Low milk',
            quantity: 2,
            unit: 'L',
            category: 'Dairy',
            minQty: 5,
        });
        const res = mockRes();
        await inventoryController.listItems({ tenantId: tenant._id, query: { lowStock: 'true' } }, res);
        expect(res.statusCode).toBe(200);
        expect(res.body.data.items.some((i) => i._id === inv._id)).toBe(true);
        expect(res.body.data.items.every((i) => Number(i.quantity) <= Number(i.minQty || 0))).toBe(true);
    });

    it('kitchen board returns active orders for service', async () => {
        const menu = (await menuRepo.findAll(tenant._id))[0];
        await placeOrder({
            tenantId: tenant._id,
            body: { items: [{ menuItemId: menu._id, size: 'medium', quantity: 1 }], paymentMethod: 'cash' },
        });
        const res = mockRes();
        await kitchenController.getActiveOrders({ tenantId: tenant._id }, res);
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
        // pending/preparing/ready should appear
        const statuses = new Set(res.body.data.map((o) => o.status));
        expect([...statuses].every((s) => ['pending', 'preparing', 'ready', 'served'].includes(s))).toBe(true);
    });

    it('order line supports custom instructions + modifier prices', async () => {
        const group = await modifierRepo.createGroup(tenant._id, {
            name: 'Extras',
            displayType: 'checkbox',
            options: [{ name: 'Extra shot', priceDelta: 40 }],
        });
        const menu = await menuRepo.create(tenant._id, {
            title: `Custom Instr ${Date.now()}`,
            subTitle: 'x',
            category: 'Coffee',
            price: { medium: 100, large: 120 },
            preparationTime: 2,
            modifierGroupIds: [group._id],
        });
        const res = mockRes();
        // orderService computes from menu price + options priceDelta in canonical payload
        const { placeOrder: place } = await import('../services/orderService.js');
        const result = await place({
            tenantId: tenant._id,
            body: {
                items: [{
                    menuItemId: menu._id,
                    size: 'medium',
                    quantity: 1,
                    options: [{ name: 'Extra shot', priceDelta: 40 }],
                    specialInstructions: 'Extra hot, less sugar',
                }],
                paymentMethod: 'cash',
            },
        });
        expect(result.status).toBe(201);
        const loaded = await getDb()('order_items')
            .where({ order_id: result.data.order._id })
            .first();
        expect(loaded.special_instructions).toBe('Extra hot, less sugar');
        expect(JSON.stringify(loaded.customizations)).toContain('Extra shot');
        // base 100 + modifier priceDelta 40
        expect(Number(loaded.item_price)).toBe(140);
    });
});
