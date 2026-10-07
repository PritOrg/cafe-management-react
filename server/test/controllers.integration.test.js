import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb, destroyDb } from '../db/pool.js';
import tenantRepo from '../repositories/tenantRepo.js';
import menuRepo from '../repositories/menuRepo.js';
import staffRepo from '../repositories/staffRepo.js';
import settingsRepo from '../repositories/settingsRepo.js';
import invoiceRepo from '../repositories/invoiceRepo.js';
import menuController from '../controllers/menuController.js';
import orderController from '../controllers/orderController.js';
import settingsController from '../controllers/settingsController.js';
import { resolveTenant } from '../middleware/tenant.js';

const mockRes = () => {
    const r = { statusCode: null, body: null };
    r.status = (c) => { r.statusCode = c; return r; };
    r.json = (b) => { r.body = b; return r; };
    return r;
};

let tenant;

describe('repos + controllers integration', () => {
    beforeAll(async () => {
        await getDb().raw('select 1');
        tenant = await tenantRepo.findBySlug('cafe1') || await tenantRepo.create({ slug: 'cafe1', name: 'Cafe One' });
    });

    afterAll(async () => {
        await destroyDb();
    });

    it('menuRepo CRUD is tenant scoped', async () => {
        const item = await menuRepo.create(tenant._id, {
            title: `Coverage Mocha ${Date.now()}`,
            subTitle: 'Test',
            category: 'Coffee',
            price: { medium: 99, large: 129 },
            preparationTime: 3,
        });
        expect(item.tenantId).toBe(tenant._id);
        const loaded = await menuRepo.findById(tenant._id, item._id);
        expect(loaded.title).toBe(item.title);
        const updated = await menuRepo.updateById(tenant._id, item._id, { title: 'Updated Mocha' });
        expect(updated.title).toBe('Updated Mocha');
        const deleted = await menuRepo.deleteById(tenant._id, item._id);
        expect(deleted).toBeTruthy();
        expect(await menuRepo.findById(tenant._id, item._id)).toBe(null);
    });

    it('staffRepo create/find/update', async () => {
        const email = `staff${Date.now()}@cafe1.local`;
        const created = await staffRepo.create(tenant._id, {
            firstName: 'Coverage',
            lastName: 'Staff',
            email,
            password: 'Passw0rd!1',
            role: 'staff',
        });
        expect(created.email).toBe(email);
        expect(created.password).toBeUndefined();
        const found = await staffRepo.findByEmail(tenant._id, email);
        expect(found.firstName).toBe('Coverage');
        const loginRow = await staffRepo.findByEmailForLogin(tenant._id, email);
        expect(loginRow.password).toBeTruthy();
        const updated = await staffRepo.updateById(tenant._id, created._id, { role: 'admin' });
        expect(updated.role).toBe('admin');
        await staffRepo.deleteById(tenant._id, created._id);
    });

    it('settingsRepo get/update', async () => {
        const before = await settingsRepo.getPublic(tenant._id);
        expect(before.brand.title).toBeTruthy();
        const after = await settingsRepo.update(tenant._id, { brand: { title: 'Renamed Cafe' } });
        expect(after.brand.title).toBe('Renamed Cafe');
        await settingsRepo.update(tenant._id, { brand: { title: 'Cafe Day' } });
    });

    it('invoiceRepo nextNumber increments', async () => {
        const fy = '2026-27';
        const a = await invoiceRepo.nextNumber(tenant._id, 'INV', fy);
        const b = await invoiceRepo.nextNumber(tenant._id, 'INV', fy);
        expect(b.seq).toBe(a.seq + 1);
        expect(a.invoiceNumber).toMatch(/INV\/2026-27\//);
    });

    it('menuController getAllMenuItems envelope', async () => {
        const res = mockRes();
        await menuController.getAllMenuItems({ tenantId: tenant._id }, res);
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.every((m) => m.tenantId === tenant._id)).toBe(true);
    });

    it('orderController getOrders + getOrderById ownership', async () => {
        const res = mockRes();
        await orderController.getOrders({ tenantId: tenant._id, query: {} }, res);
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);

        const first = res.body.data[0];
        if (first) {
            const byId = mockRes();
            await orderController.getOrderById({
                tenantId: tenant._id,
                params: { id: first._id },
                userId: 'someone',
                role: 'admin',
            }, byId);
            expect(byId.statusCode).toBe(200);

            const foreign = mockRes();
            await orderController.getOrderById({
                tenantId: tenant._id,
                params: { id: first._id },
                userId: 'someone-else',
                role: 'customer',
            }, foreign);
            expect(foreign.statusCode).toBe(403);
        }
    });

    it('settingsController public + admin', async () => {
        const pub = mockRes();
        await settingsController.getPublicSettings({ tenantId: tenant._id }, pub);
        expect(pub.statusCode).toBe(200);
        expect(pub.body.data.brand).toBeTruthy();

        const admin = mockRes();
        await settingsController.getSettings({ tenantId: tenant._id }, admin);
        expect(admin.statusCode).toBe(200);

        const upd = mockRes();
        await settingsController.updateSettings({
            tenantId: tenant._id,
            userId: 'u',
            role: 'admin',
            body: { ops: { timezone: 'Asia/Kolkata' } },
        }, upd);
        expect(upd.statusCode).toBe(200);
    });

    it('resolveTenant middleware 200/404/403', async () => {
        let next = false;
        const req = { headers: { host: 'cafe1.localhost:3000' } };
        const res = mockRes();
        await resolveTenant(req, res, () => { next = true; });
        expect(next).toBe(true);
        expect(req.tenantSlug).toBe('cafe1');

        next = false;
        await resolveTenant({ headers: { host: 'nope.example.com' } }, mockRes(), () => { next = true; });
        expect(next).toBe(false);

        await tenantRepo.updateById(tenant._id, { status: 'suspended' });
        next = false;
        const res403 = mockRes();
        await resolveTenant({ headers: { host: 'cafe1.example.com' } }, res403, () => { next = true; });
        expect(next).toBe(false);
        expect(res403.statusCode).toBe(403);
        await tenantRepo.updateById(tenant._id, { status: 'active' });
    });
});
