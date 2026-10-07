import { describe, it, expect, vi, beforeEach } from 'vitest';

const okJson = (data, extra = {}) => ({
    ok: true,
    status: 200,
    headers: new Headers(),
    json: async () => ({ success: true, message: 'ok', data, timestamp: 't', ...extra }),
});

describe('api.js remaining clients', () => {
    beforeEach(() => {
        sessionStorage.clear();
        localStorage.clear();
        vi.resetModules();
        global.fetch = vi.fn();
    });

    it('staffAPI + customersAPI + tenantsAPI + settingsAPI + invoicesAPI', async () => {
        global.fetch.mockResolvedValue(okJson([]));
        const api = await import('../services/api.js');

        await api.staffAPI.getAll();
        expect(global.fetch.mock.calls.at(-1)[0]).toContain('/staff-admin');

        await api.staffAPI.add({ firstName: 'A', lastName: 'B', email: 'a@b.c', role: 'staff' });
        expect(global.fetch.mock.calls.at(-1)[1].method).toBe('POST');

        await api.staffAPI.update('id1', { role: 'admin' });
        expect(global.fetch.mock.calls.at(-1)[1].method).toBe('PUT');

        await api.staffAPI.remove('id1');
        expect(global.fetch.mock.calls.at(-1)[1].method).toBe('DELETE');

        await api.customersAPI.list({ search: 'x' });
        expect(global.fetch.mock.calls.at(-1)[0]).toContain('/customers?search=x');

        await api.customersAPI.getById('c1');
        await api.customersAPI.getOrders('c1');
        await api.customersAPI.getSummary('c1');
        await api.customersAPI.softDelete('c1');

        await api.tenantsAPI.getAll();
        await api.tenantsAPI.create({ slug: 'cafe9', name: 'Nine' });
        await api.tenantsAPI.update('t1', { status: 'suspended' });

        await api.settingsAPI.getPublic();
        expect(global.fetch.mock.calls.at(-1)[0]).toContain('/settings/public');
        await api.settingsAPI.get();
        await api.settingsAPI.update({ brand: { title: 'X' } });

        await api.invoicesAPI.list({ limit: 5 });
        await api.invoicesAPI.getById('i1');
        await api.invoicesAPI.issueForOrder('o1', { interState: true });
        await api.invoicesAPI.void('i1', 'nope');
        expect(api.invoicesAPI.pdfUrl('i1', 'thermal58')).toContain('format=thermal58');
    });

    it('ordersAPI filters + status + history', async () => {
        global.fetch.mockResolvedValue(okJson([]));
        const api = await import('../services/api.js');
        await api.ordersAPI.getAll({ status: 'pending' });
        expect(global.fetch.mock.calls.at(-1)[0]).toContain('status=pending');
        await api.ordersAPI.getToday();
        await api.ordersAPI.getRecent(3);
        await api.ordersAPI.getByStatus('ready');
        await api.ordersAPI.getHistory('9999999999');
        await api.ordersAPI.getById('o1');
        await api.ordersAPI.updateStatus('o1', 'served');
        expect(global.fetch.mock.calls.at(-1)[1].method).toBe('PUT');
    });

    it('menuAPI create/update/delete + getById', async () => {
        global.fetch.mockResolvedValue(okJson({ _id: 'm1' }));
        const api = await import('../services/api.js');
        await api.menuAPI.getById('m1');
        await api.menuAPI.create({ title: 'X', subTitle: 'Y' });
        await api.menuAPI.update('m1', { title: 'Z' });
        await api.menuAPI.delete('m1');
        expect(global.fetch.mock.calls.at(-1)[1].method).toBe('DELETE');
    });

    it('analyticsAPI endpoints', async () => {
        global.fetch.mockResolvedValue(okJson({ series: [] }));
        const api = await import('../services/api.js');
        await api.analyticsAPI.getSummary();
        await api.analyticsAPI.getSales('7d');
        await api.analyticsAPI.getOrderStats('30d');
        await api.analyticsAPI.getTopItems('30d', 5);
        await api.analyticsAPI.getCategoryMix('30d');
        await api.analyticsAPI.getDashboardStats();
        await api.analyticsAPI.getRevenueStats('7d');
        expect(global.fetch.mock.calls.length).toBeGreaterThanOrEqual(7);
    });

    it('getCurrentUser + isAuthenticated + getUserType', async () => {
        sessionStorage.setItem('user', JSON.stringify({ role: 'staff' }));
        sessionStorage.setItem('token', 'abc');
        sessionStorage.setItem('userType', 'staffOrAdmin');
        const api = await import('../services/api.js');
        expect(api.authAPI.getCurrentUser().role).toBe('staff');
        expect(api.authAPI.isAuthenticated()).toBe(true);
        expect(api.authAPI.getUserType()).toBe('staffOrAdmin');
        expect(api.healthAPI.check).toBeTypeOf('function');
    });

    it('error path throws with status message', async () => {
        global.fetch.mockResolvedValue({
            ok: false,
            status: 404,
            headers: new Headers(),
            json: async () => ({ message: 'Resource not found' }),
        });
        const api = await import('../services/api.js');
        await expect(api.menuAPI.getById('nope')).rejects.toThrow(/not found/i);
    });
});
