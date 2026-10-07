import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb, destroyDb } from '../db/pool.js';
import tenantRepo from '../repositories/tenantRepo.js';
import menuRepo from '../repositories/menuRepo.js';
import staffRepo from '../repositories/staffRepo.js';
import orderController from '../controllers/orderController.js';
import invoiceController from '../controllers/invoiceController.js';
import customerController from '../controllers/customerController.js';
import authController from '../controllers/authController.js';
import tenantController from '../controllers/tenantController.js';
import staffController from '../controllers/staffController.js';
import menuController from '../controllers/menuController.js';

const mockRes = () => {
    const r = { statusCode: null, body: null, headers: {}, setHeader() { return r; }, send(b) { r.body = b; return r; } };
    r.status = (c) => { r.statusCode = c; return r; };
    r.json = (b) => { r.body = b; return r; };
    return r;
};

let tenant;
let menu;
let staffUser;
let staffToken;

describe('HTTP controllers integration', () => {
    beforeAll(async () => {
        await getDb().raw('select 1');
        tenant = await tenantRepo.findBySlug('cafe1') || await tenantRepo.create({ slug: 'cafe1', name: 'Cafe One' });
        menu = (await menuRepo.findAll(tenant._id))[0];
        if (!menu) {
            menu = await menuRepo.create(tenant._id, {
                title: 'Ctrl Latte', subTitle: 'Hot', category: 'Coffee',
                price: { medium: 110, large: 150 }, preparationTime: 4,
            });
        }
        staffUser = await staffRepo.create(tenant._id, {
            firstName: 'Ctrl', lastName: 'Admin',
            email: `ctrl${Date.now()}@cafe1.local`,
            password: 'Passw0rd!1', role: 'admin',
        });
        const loginRes = mockRes();
        await authController.login({
            tenantId: tenant._id,
            ip: '127.0.0.1',
            get: () => 'vitest',
            body: { email: staffUser.email, password: 'Passw0rd!1' },
        }, loginRes);
        if (loginRes.statusCode !== 200) {
            throw new Error(`login failed: ${loginRes.body?.message}`);
        }
        staffToken = loginRes.body?.data?.token;
        expect(staffToken).toBeTruthy();
    });

    afterAll(async () => {
        await destroyDb();
    });

    it('auth login success + failure shapes', async () => {
        const ok = mockRes();
        await authController.login({ tenantId: tenant._id, ip: '127.0.0.1', get: () => 't', body: { email: staffUser.email, password: 'Passw0rd!1' } }, ok);
        expect(ok.statusCode).toBe(200);
        expect(ok.body.data.userType).toBe('staffOrAdmin');
        expect(ok.body.data.user.password).toBeUndefined();

        const bad = mockRes();
        await authController.login({ tenantId: tenant._id, ip: '127.0.0.1', get: () => 't', body: { email: staffUser.email, password: 'WrongPass1!' } }, bad);
        expect(bad.statusCode).toBe(401);

        const missing = mockRes();
        await authController.login({ tenantId: tenant._id, body: {} }, missing);
        expect(missing.statusCode).toBe(400);
    });

    it('order place → history → status update', async () => {
        const phone = `9${Date.now().toString().slice(-9)}`;
        const place = mockRes();
        await orderController.placeOrder({
            tenantId: tenant._id, role: 'customer', userId: 'u',
            body: { items: [{ menuItemId: menu._id, size: 'medium', quantity: 1 }], paymentMethod: 'upi_manual', phone, customerName: 'Http Guest' },
        }, place);
        expect(place.statusCode).toBe(201);
        const orderId = place.body.data.order._id;

        const hist = mockRes();
        await orderController.getOrderHistory({ tenantId: tenant._id, query: { phone } }, hist);
        expect(hist.statusCode).toBe(200);
        expect(hist.body.data.orders.length).toBeGreaterThanOrEqual(1);

        const histNoPhone = mockRes();
        await orderController.getOrderHistory({ tenantId: tenant._id, query: {} }, histNoPhone);
        expect(histNoPhone.statusCode).toBe(400);

        const upd = mockRes();
        await orderController.updateOrderStatus({ tenantId: tenant._id, params: { id: orderId }, body: { status: 'preparing' }, userId: 'u', role: 'staff' }, upd);
        expect(upd.statusCode).toBe(200);
        expect(upd.body.data.status).toBe('preparing');

        const badStatus = mockRes();
        await orderController.updateOrderStatus({ tenantId: tenant._id, params: { id: orderId }, body: { status: 'nope' } }, badStatus);
        expect(badStatus.statusCode).toBe(400);

        const byStatus = mockRes();
        await orderController.getOrdersByStatus({ tenantId: tenant._id, query: { status: 'preparing' } }, byStatus);
        expect(byStatus.statusCode).toBe(200);

        const today = mockRes();
        await orderController.getTodaysOrders({ tenantId: tenant._id }, today);
        expect(today.statusCode).toBe(200);
    });

    it('invoice controller issue/list/pdf/void', async () => {
        const phone = `9${Date.now().toString().slice(-9)}`;
        const place = mockRes();
        await orderController.placeOrder({
            tenantId: tenant._id, body: { items: [{ menuItemId: menu._id, size: 'medium', quantity: 1 }], paymentMethod: 'cash', phone, customerName: 'Inv Http' },
        }, place);
        const orderId = place.body.data.order._id;

        const settingsRepo = (await import('../repositories/settingsRepo.js'));
        await settingsRepo.update(tenant._id, {
            gst: { ...settingsRepo.DEFAULTS.gst, gstin: '27AAAAA0000A1Z5', legalName: 'LLP', legalAddress: 'Addr', stateCode: '27' },
        });

        const issue = mockRes();
        await invoiceController.issueForOrder({ tenantId: tenant._id, params: { id: orderId }, userId: 'u', role: 'admin', body: { interState: true } }, issue);
        expect(issue.statusCode).toBe(201);
        const inv = issue.body.data;
        expect(inv.igstAmount).toBeGreaterThan(0);
        expect(inv.cgstAmount).toBe(0);

        const list = mockRes();
        await invoiceController.listInvoices({ tenantId: tenant._id, query: { limit: 5 } }, list);
        expect(list.statusCode).toBe(200);

        const pdf = mockRes();
        await invoiceController.getInvoicePdf({ tenantId: tenant._id, params: { id: inv.id }, query: { format: 'thermal80' } }, pdf);
        expect(Buffer.isBuffer(pdf.body)).toBe(true);

        const voided = mockRes();
        await invoiceController.voidInvoice({ tenantId: tenant._id, params: { id: inv.id }, userId: 'u', role: 'admin', body: { reason: 'ctrl void' } }, voided);
        expect(voided.statusCode).toBe(200);
    });

    it('customer controller list/summary/soft delete', async () => {
        const phone = `9${Date.now().toString().slice(-9)}`;
        await orderController.placeOrder({
            tenantId: tenant._id, body: { items: [{ menuItemId: menu._id, size: 'medium', quantity: 1 }], paymentMethod: 'cash', phone, customerName: 'Cust Http' },
        }, mockRes());

        const list = mockRes();
        await customerController.getAllCustomers({ tenantId: tenant._id, query: { search: phone } }, list);
        expect(list.statusCode).toBe(200);
        const cust = list.body.data.items[0];
        expect(cust).toBeTruthy();

        const sum = mockRes();
        await customerController.getCustomerSummary({ tenantId: tenant._id, params: { id: cust._id } }, sum);
        expect(sum.statusCode).toBe(200);
        expect(sum.body.data.ordersCount).toBeGreaterThanOrEqual(1);

        const orders = mockRes();
        await customerController.getCustomerOrders({ tenantId: tenant._id, params: { id: cust._id } }, orders);
        expect(orders.statusCode).toBe(200);

        const detail = mockRes();
        await customerController.getCustomerById({ tenantId: tenant._id, params: { id: cust._id } }, detail);
        expect(detail.statusCode).toBe(200);

        const del = mockRes();
        await customerController.removeCustomer({ tenantId: tenant._id, params: { id: cust._id }, userId: 'u', role: 'admin' }, del);
        expect(del.statusCode).toBe(200);
    });

    it('tenant + staff + menu controllers', async () => {
        const slug = `t${Date.now()}`;
        const created = mockRes();
        await tenantController.createTenant({ body: { slug, name: 'Temp Cafe' }, userId: 'p' }, created);
        expect(created.statusCode).toBe(201);

        const listed = mockRes();
        await tenantController.listTenants({}, listed);
        expect(listed.statusCode).toBe(200);

        const patched = mockRes();
        await tenantController.updateTenant({ params: { id: created.body.data._id }, body: { status: 'suspended' } }, patched);
        expect(patched.statusCode).toBe(200);
        expect(patched.body.data.status).toBe('suspended');

        const email = `sc${Date.now()}@cafe1.local`;
        const addStaff = mockRes();
        await staffController.addStaff({ tenantId: tenant._id, userId: 'u', role: 'admin', body: { firstName: 'S', lastName: 'T', email, password: 'Passw0rd!1', role: 'staff' } }, addStaff);
        expect(addStaff.statusCode).toBe(201);

        const staffList = mockRes();
        await staffController.getAllStaff({ tenantId: tenant._id }, staffList);
        expect(staffList.statusCode).toBe(200);

        const updStaff = mockRes();
        await staffController.updateStaff({ tenantId: tenant._id, params: { id: addStaff.body.data._id }, body: { role: 'admin' } }, updStaff);
        expect(updStaff.statusCode).toBe(200);

        const rm = mockRes();
        await staffController.removeStaff({ tenantId: tenant._id, params: { id: addStaff.body.data._id } }, rm);
        expect(rm.statusCode).toBe(200);

        const createMenu = mockRes();
        await menuController.createMenuItem({
            tenantId: tenant._id, userId: 'u', role: 'admin',
            body: { title: `M${Date.now()}`, subTitle: 's', priceMedium: '10', priceLarge: '15', category: 'Coffee', preparationTime: '2', calories: '10' },
        }, createMenu);
        expect(createMenu.statusCode).toBe(201);

        const updMenu = mockRes();
        await menuController.updateMenuItem({ tenantId: tenant._id, params: { id: createMenu.body.data._id }, body: { title: 'Renamed' } }, updMenu);
        expect(updMenu.statusCode).toBe(200);

        const delMenu = mockRes();
        await menuController.deleteMenuItem({ tenantId: tenant._id, params: { id: createMenu.body.data._id } }, delMenu);
        expect(delMenu.statusCode).toBe(200);
    });
});
