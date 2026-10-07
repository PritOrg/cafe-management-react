import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb, destroyDb } from '../db/pool.js';
import tenantRepo from '../repositories/tenantRepo.js';
import menuRepo from '../repositories/menuRepo.js';
import inventoryRepo from '../repositories/inventoryRepo.js';
import recipeRepo from '../repositories/recipeRepo.js';
import modifierRepo from '../repositories/modifierRepo.js';
import inventoryController from '../controllers/inventoryController.js';
import menuController from '../controllers/menuController.js';
import { placeOrder } from '../services/orderService.js';

const mockRes = () => {
    const r = { statusCode: null, body: null };
    r.status = (c) => { r.statusCode = c; return r; };
    r.json = (b) => { r.body = b; return r; };
    return r;
};

let tenant;

describe('recipe editor + modifier pricing on order', () => {
    beforeAll(async () => {
        await getDb().raw('select 1');
        tenant = await tenantRepo.findBySlug('cafe1') || await tenantRepo.create({ slug: 'cafe1', name: 'Cafe One' });
    });

    afterAll(async () => {
        await destroyDb();
    });

    it('inventory detail returns linked menu recipes for editor UI', async () => {
        const menu = await menuRepo.create(tenant._id, {
            title: `Recipe UI ${Date.now()}`,
            subTitle: 'x',
            category: 'Coffee',
            price: { medium: 100, large: 120 },
            preparationTime: 2,
        });
        const inv = await inventoryRepo.create(tenant._id, {
            itemName: 'Milk',
            quantity: 50,
            unit: 'L',
            category: 'Dairy',
            minQty: 5,
            menuItemId: menu._id,
        });
        await recipeRepo.add(tenant._id, {
            menuItemId: menu._id,
            inventoryItemId: inv._id,
            qty: 0.15,
            unit: 'L',
        });

        const res = mockRes();
        await inventoryController.getItem({ tenantId: tenant._id, params: { id: inv._id } }, res);
        expect(res.statusCode).toBe(200);
        expect(res.body.data.movements).toBeDefined();
        // recipes listed for this inventory item
        const recipes = await recipeRepo.listForInventory(tenant._id, inv._id);
        expect(recipes.length).toBe(1);
        expect(recipes[0].qty).toBe(0.15);
        expect(recipes[0].menuItemId).toBe(menu._id);
    });

    it('menu create API accepts modifierGroupIds + sizes (multipart/JSON)', async () => {
        const group = await modifierRepo.createGroup(tenant._id, {
            name: 'Milk type',
            displayType: 'radio',
            options: [
                { name: 'Regular', priceDelta: 0 },
                { name: 'Almond', priceDelta: 20 },
            ],
        });

        const res = mockRes();
        await menuController.createMenuItem({
            tenantId: tenant._id,
            userId: 'u',
            role: 'admin',
            body: {
                title: `API Menu ${Date.now()}`,
                subTitle: 'mods',
                priceMedium: '120',
                priceLarge: '150',
                category: 'Coffee',
                preparationTime: '3',
                sizes: JSON.stringify([
                    { label: 'Regular', price: 120, isDefault: true },
                    { label: 'Large', price: 150 },
                ]),
                modifierGroupIds: group._id,
            },
        }, res);
        expect(res.statusCode).toBe(201);
        expect(res.body.data.sizes.length).toBe(2);
        expect((res.body.data.modifierGroups || []).some((g) => g._id === group._id)).toBe(true);
    });

    it('order prices include modifier priceDelta from selected options', async () => {
        const group = await modifierRepo.createGroup(tenant._id, {
            name: 'Extras order test',
            displayType: 'checkbox',
            options: [{ name: 'Whipped cream', priceDelta: 30 }],
        });
        const menu = await menuRepo.create(tenant._id, {
            title: `Mod Order ${Date.now()}`,
            subTitle: 'x',
            category: 'Coffee',
            price: { medium: 100, large: 100 },
            preparationTime: 2,
            modifierGroupIds: [group._id],
            sizes: [{ label: 'Regular', price: 100, isDefault: true }],
        });

        const result = await placeOrder({
            tenantId: tenant._id,
            body: {
                items: [{
                    menuItemId: menu._id,
                    size: 'Regular',
                    quantity: 1,
                    options: [{ name: 'Whipped cream', priceDelta: 30 }],
                }],
                paymentMethod: 'cash',
            },
        });
        expect(result.status).toBe(201);
        // base 100 + modifier 30 + 5% GST
        const expectedTax = Math.round(130 * 0.05 * 100) / 100;
        expect(result.data.order.totalAmount).toBe(130);
        expect(result.data.taxAmount).toBe(expectedTax);
    });
});
