import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb, destroyDb } from '../db/pool.js';
import tenantRepo from '../repositories/tenantRepo.js';
import menuRepo from '../repositories/menuRepo.js';
import staffRepo from '../repositories/staffRepo.js';
import customerRepo from '../repositories/customerRepo.js';
import inventoryRepo from '../repositories/inventoryRepo.js';
import discountRepo from '../repositories/discountRepo.js';
import menuController from '../controllers/menuController.js';
import staffController from '../controllers/staffController.js';
import discountController from '../controllers/discountController.js';
import activityRepo from '../repositories/activityRepo.js';

const mockRes = () => {
    const r = { statusCode: null, body: null };
    r.status = (c) => { r.statusCode = c; return r; };
    r.json = (b) => { r.body = b; return r; };
    return r;
};

let tenant;

const adminReq = () => ({
    tenantId: tenant._id,
    userId: '11111111-1111-1111-1111-111111111111',
    role: 'admin',
});

describe('soft-delete consistency', () => {
    beforeAll(async () => {
        await getDb().raw('select 1');
        tenant = await tenantRepo.findBySlug('cafe1') || await tenantRepo.create({ slug: 'cafe1', name: 'Cafe One' });
    });

    afterAll(async () => {
        await destroyDb();
    });

    it('menu delete is soft (availability=false), row remains', async () => {
        const item = await menuRepo.create(tenant._id, {
            title: `SoftMenu ${Date.now()}`,
            subTitle: 'x',
            category: 'Coffee',
            price: { medium: 50, large: 60 },
            preparationTime: 1,
            sizes: [],
        });
        const res = mockRes();
        await menuController.deleteMenuItem({ ...adminReq(), params: { id: item._id } }, res);
        expect(res.statusCode).toBe(200);

        const raw = await getDb()('menu_items').where({ id: item._id }).first();
        expect(raw).toBeTruthy();
        expect(raw.availability).toBe(false);

        const listed = await menuRepo.findAll(tenant._id);
        expect(listed.some((m) => m._id === item._id)).toBe(false);

        const logs = await activityRepo.listByTenant(tenant._id, 20);
        expect(logs.some((l) => l.action === 'menu.soft_delete' || l.action === 'menu.delete')).toBe(true);
    });

    it('staff delete is soft (is_active=false), row remains', async () => {
        const created = await staffRepo.create(tenant._id, {
            firstName: 'Soft',
            lastName: 'Staff',
            email: `soft${Date.now()}@cafe1.local`,
            password: 'Passw0rd!1',
            role: 'staff',
        });
        const res = mockRes();
        await staffController.removeStaff({ ...adminReq(), params: { id: created._id } }, res);
        expect(res.statusCode).toBe(200);

        const raw = await getDb()('staff_admins').where({ id: created._id }).first();
        expect(raw).toBeTruthy();
        expect(raw.is_active).toBe(false);

        const listed = await staffRepo.findAll(tenant._id);
        expect(listed.some((s) => s._id === created._id)).toBe(false);
    });

    it('inventory delete is soft (is_active=false) — already covered pattern', async () => {
        const inv = await inventoryRepo.create(tenant._id, {
            itemName: `SoftInv ${Date.now()}`,
            quantity: 1,
            unit: 'u',
            category: 'c',
        });
        const deleted = await inventoryRepo.softDelete(tenant._id, inv._id);
        expect(deleted.isActive).toBe(false);
        const listed = await inventoryRepo.findAll(tenant._id);
        expect(listed.some((i) => i._id === inv._id)).toBe(false);
    });

    it('customer delete is soft (is_active=false) — already covered pattern', async () => {
        const phone = `9${Date.now().toString().slice(-9)}`;
        const cust = await customerRepo.upsertByPhone(tenant._id, {
            phone,
            firstName: 'Soft',
            lastName: 'Guest',
        });
        const deleted = await customerRepo.softDelete(tenant._id, cust._id);
        expect(deleted.isActive).toBe(false);
        const detail = await customerRepo.findById(tenant._id, cust._id);
        expect(detail.isActive).toBe(false);
    });

    it('discount delete is soft (is_active=false) after migration', async () => {
        // discountRepo may not have softDelete yet — controller should
        const created = await getDb()('discounts').insert({
            tenant_id: tenant._id,
            code: `SOFT${Date.now()}`,
            discount_percentage: 10,
            max_discount_amount: 20,
            min_order_amount: 0,
            expires_at: new Date(Date.now() + 86400000),
        }).returning('*');

        const res = mockRes();
        await discountController.removeDiscount({ ...adminReq(), params: { id: created[0].id } }, res);
        expect(res.statusCode).toBe(200);
        expect(res.body.data.isActive).toBe(false);

        const raw = await getDb()('discounts').where({ id: created[0].id }).first();
        expect(raw).toBeTruthy();
        expect(raw.is_active).toBe(false);

        const listed = await discountRepo.findAll(tenant._id);
        expect(listed.some((d) => d._id === created[0].id)).toBe(false);
    });
});
