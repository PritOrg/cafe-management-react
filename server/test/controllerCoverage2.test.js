import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb, destroyDb } from '../db/pool.js';
import tenantRepo from '../repositories/tenantRepo.js';
import menuRepo from '../repositories/menuRepo.js';
import orderController from '../controllers/orderController.js';
import staffController from '../controllers/staffController.js';
import tenantController from '../controllers/tenantController.js';
import { placeOrder } from '../services/orderService.js';

const mockRes = () => {
    const r = { statusCode: null, body: null };
    r.status = (c) => { r.statusCode = c; return r; };
    r.json = (b) => { r.body = b; return r; };
    return r;
};

let tenant;
let menu;
let orderId;

describe('controller coverage: orders/staff/tenants', () => {
    beforeAll(async () => {
        await getDb().raw('select 1');
        tenant = await tenantRepo.findBySlug('cafe1') || await tenantRepo.create({ slug: 'cafe1', name: 'Cafe One' });
        menu = (await menuRepo.findAll(tenant._id)).find((m) => !m.sizes?.length && Number(m.price?.medium) > 0)
            || (await menuRepo.findAll(tenant._id))[0];
        const placed = await placeOrder({
            tenantId: tenant._id,
            body: { items: [{ menuItemId: menu._id, size: 'medium', quantity: 1 }], paymentMethod: 'cash' },
        });
        orderId = placed.data.order._id;
    });

    afterAll(async () => {
        await destroyDb();
    });

    it('orderController getOrders/getById/status/today', async () => {
        const all = mockRes();
        await orderController.getOrders({ tenantId: tenant._id, query: {} }, all);
        expect(all.statusCode).toBe(200);

        const byId = mockRes();
        await orderController.getOrderById({ tenantId: tenant._id, params: { id: orderId }, userId: 'x', role: 'admin' }, byId);
        expect(byId.statusCode).toBe(200);

        const prep = mockRes();
        await orderController.updateOrderStatus({ tenantId: tenant._id, params: { id: orderId }, body: { status: 'preparing' }, userId: 'u', role: 'staff' }, prep);
        expect(prep.statusCode).toBe(200);

        const ready = mockRes();
        await orderController.updateOrderStatus({ tenantId: tenant._id, params: { id: orderId }, body: { status: 'ready' }, userId: 'u', role: 'staff' }, ready);
        expect(ready.statusCode).toBe(200);

        const served = mockRes();
        await orderController.updateOrderStatus({ tenantId: tenant._id, params: { id: orderId }, body: { status: 'served' }, userId: 'u', role: 'staff' }, served);
        expect(served.statusCode).toBe(200);

        const today = mockRes();
        await orderController.getTodaysOrders({ tenantId: tenant._id }, today);
        expect(today.statusCode).toBe(200);

        const byStatus = mockRes();
        await orderController.getOrdersByStatus({ tenantId: tenant._id, query: { status: 'served' } }, byStatus);
        expect(byStatus.statusCode).toBe(200);

        const missing = mockRes();
        await orderController.updateOrderStatus({ tenantId: tenant._id, params: { id: '00000000-0000-0000-0000-000000000000' }, body: { status: 'ready' } }, missing);
        expect(missing.statusCode).toBe(404);

        const histMissingPhone = mockRes();
        await orderController.getOrderHistory({ tenantId: tenant._id, query: {} }, histMissingPhone);
        expect(histMissingPhone.statusCode).toBe(400);
    });

    it('staffController list/add/update/remove + 404', async () => {
        const list = mockRes();
        await staffController.getAllStaff({ tenantId: tenant._id }, list);
        expect(list.statusCode).toBe(200);

        const email = `cov${Date.now()}@cafe1.local`;
        const add = mockRes();
        await staffController.addStaff({ tenantId: tenant._id, userId: 'u', role: 'admin', body: { firstName: 'C', lastName: 'V', email, password: 'Passw0rd!1', role: 'staff' } }, add);
        expect(add.statusCode).toBe(201);

        const upd = mockRes();
        await staffController.updateStaff({ tenantId: tenant._id, params: { id: add.body.data._id }, body: { role: 'admin' } }, upd);
        expect(upd.statusCode).toBe(200);

        const missing = mockRes();
        await staffController.updateStaff({ tenantId: tenant._id, params: { id: '00000000-0000-0000-0000-000000000000' }, body: { role: 'admin' } }, missing);
        expect(missing.statusCode).toBe(404);

        const rm = mockRes();
        await staffController.removeStaff({ tenantId: tenant._id, params: { id: add.body.data._id } }, rm);
        expect(rm.statusCode).toBe(200);

        const rmMissing = mockRes();
        await staffController.removeStaff({ tenantId: tenant._id, params: { id: '00000000-0000-0000-0000-000000000000' } }, rmMissing);
        expect(rmMissing.statusCode).toBe(404);
    });

    it('tenantController list/create/update + validation', async () => {
        const list = mockRes();
        await tenantController.listTenants({}, list);
        expect(list.statusCode).toBe(200);

        const slug = `cov-${Date.now()}`;
        const create = mockRes();
        await tenantController.createTenant({ userId: 'p', body: { slug, name: 'Cov Cafe' } }, create);
        expect(create.statusCode).toBe(201);

        const dup = mockRes();
        await tenantController.createTenant({ userId: 'p', body: { slug, name: 'Cov Cafe' } }, dup);
        expect(dup.statusCode).toBe(409);

        const badSlug = mockRes();
        await tenantController.createTenant({ userId: 'p', body: { slug: 'BAD SLUG!', name: 'x' } }, badSlug);
        expect(badSlug.statusCode).toBe(400);

        const noName = mockRes();
        await tenantController.createTenant({ userId: 'p', body: { slug: 'ok-slug' } }, noName);
        expect(noName.statusCode).toBe(400);

        const patch = mockRes();
        await tenantController.updateTenant({ params: { id: create.body.data._id }, body: { status: 'suspended' } }, patch);
        expect(patch.statusCode).toBe(200);

        const badStatus = mockRes();
        await tenantController.updateTenant({ params: { id: create.body.data._id }, body: { status: 'nope' } }, badStatus);
        expect(badStatus.statusCode).toBe(400);

        const patchMissing = mockRes();
        await tenantController.updateTenant({ params: { id: '00000000-0000-0000-0000-000000000000' }, body: { name: 'X' } }, patchMissing);
        expect(patchMissing.statusCode).toBe(404);
    });
});
