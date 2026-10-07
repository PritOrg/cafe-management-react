import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb, destroyDb } from '../db/pool.js';
import tenantRepo from '../repositories/tenantRepo.js';
import inventoryController from '../controllers/inventoryController.js';

const mockRes = () => {
    const r = { statusCode: null, body: null };
    r.status = (c) => { r.statusCode = c; return r; };
    r.json = (b) => { r.body = b; return r; };
    return r;
};

let tenant;

describe('inventoryController integration (Phase H)', () => {
    beforeAll(async () => {
        await getDb().raw('select 1');
        tenant = await tenantRepo.findBySlug('cafe1') || await tenantRepo.create({ slug: 'cafe1', name: 'Cafe One' });
    });

    afterAll(async () => {
        await destroyDb();
    });

    it('creates inventory item then lists/searches it', async () => {
        const create = mockRes();
        await inventoryController.createItem({
            tenantId: tenant._id,
            userId: 'u',
            role: 'admin',
            body: { itemName: `Beans ${Date.now()}`, quantity: 0, unit: 'kg', category: 'Coffee', minQty: 5 },
        }, create);
        expect(create.statusCode).toBe(201);
        expect(create.body.data.itemName).toMatch(/^Beans/);
        const id = create.body.data._id;

        const list = mockRes();
        await inventoryController.listItems({ tenantId: tenant._id, query: { search: create.body.data.itemName } }, list);
        expect(list.statusCode).toBe(200);
        expect(list.body.data.items.length).toBeGreaterThanOrEqual(1);

        // receive stock via movement
        const move = mockRes();
        await inventoryController.addMovement({
            tenantId: tenant._id,
            userId: 'u',
            role: 'admin',
            params: { id },
            body: { type: 'purchase', delta: 50, note: 'first stock' },
        }, move);
        expect(move.statusCode).toBe(201);
        expect(move.body.data.quantity).toBe(50);

        // low stock filter (minQty 5, qty 50 → not low; set qty via adjust)
        const adjust = mockRes();
        await inventoryController.addMovement({
            tenantId: tenant._id,
            userId: 'u',
            role: 'admin',
            params: { id },
            body: { type: 'adjust', delta: -46, note: 'sample down' },
        }, adjust);
        expect(adjust.statusCode).toBe(201);
        expect(adjust.body.data.quantity).toBe(4);

        const low = mockRes();
        await inventoryController.listItems({ tenantId: tenant._id, query: { lowStock: 'true' } }, low);
        expect(low.statusCode).toBe(200);
        expect(low.body.data.items.some((i) => i._id === id)).toBe(true);

        // detail with movements
        const detail = mockRes();
        await inventoryController.getItem({ tenantId: tenant._id, params: { id } }, detail);
        expect(detail.statusCode).toBe(200);
        expect(detail.body.data.movements.length).toBeGreaterThanOrEqual(2);

        // invalid movement type
        const bad = mockRes();
        await inventoryController.addMovement({
            tenantId: tenant._id, userId: 'u', role: 'admin',
            params: { id }, body: { type: 'hack', delta: 1 },
        }, bad);
        expect(bad.statusCode).toBe(400);

        // soft delete
        const del = mockRes();
        await inventoryController.deleteItem({
            tenantId: tenant._id, userId: 'u', role: 'admin', params: { id },
        }, del);
        expect(del.statusCode).toBe(200);
        expect(del.body.data.isActive).toBe(false);
    });

    it('rejects non-admin writes', async () => {
        const res = mockRes();
        await inventoryController.createItem({
            tenantId: tenant._id, userId: 's', role: 'staff',
            body: { itemName: 'Nope', quantity: 1, unit: 'x', category: 'c' },
        }, res);
        expect(res.statusCode).toBe(403);
    });
});
