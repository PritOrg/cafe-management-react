import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('api.js fetch client', () => {
    beforeEach(() => {
        sessionStorage.clear();
        localStorage.clear();
        vi.resetModules();
        global.fetch = vi.fn();
    });

    it('unwrap + auth login path builds headers with X-Request-Id', async () => {
        const body = { success: true, message: 'ok', data: { token: 't', user: { role: 'staff' }, userType: 'staffOrAdmin' }, timestamp: 'x' };
        global.fetch.mockResolvedValue({
            ok: true,
            status: 200,
            headers: new Headers({ 'X-Request-Id': 'srv-1' }),
            json: async () => body,
        });

        const api = await import('../services/api.js');
        const res = await api.authAPI.login({ email: 'a@b.c', password: 'Passw0rd!1' });
        expect(res.data.token).toBe('t');
        expect(res.requestId).toBe('srv-1');

        const [url, config] = global.fetch.mock.calls[0];
        expect(url).toContain('/auth/login');
        expect(config.headers['X-Request-Id']).toBeTruthy();
        expect(config.headers['Content-Type']).toBe('application/json');
    });

    it('ordersAPI.create posts JSON', async () => {
        global.fetch.mockResolvedValue({
            ok: true,
            status: 201,
            headers: new Headers(),
            json: async () => ({ success: true, data: { orderNumber: 'ORD-1' } }),
        });
        const api = await import('../services/api.js');
        const res = await api.ordersAPI.create({ items: [], paymentMethod: 'cash' });
        expect(res.data.orderNumber).toBe('ORD-1');
        const [, config] = global.fetch.mock.calls[0];
        expect(config.method).toBe('POST');
        expect(JSON.parse(config.body).paymentMethod).toBe('cash');
    });

    it('logout clears storage keys', async () => {
        sessionStorage.setItem('token', 'x');
        sessionStorage.setItem('user', '{}');
        sessionStorage.setItem('userType', 'staffOrAdmin');
        const api = await import('../services/api.js');
        api.authAPI.logout();
        expect(sessionStorage.getItem('token')).toBe(null);
        expect(localStorage.getItem('token')).toBe(null);
    });

    it('menuAPI.getAll hits /menu', async () => {
        global.fetch.mockResolvedValue({
            ok: true,
            status: 200,
            headers: new Headers(),
            json: async () => ({ success: true, data: [] }),
        });
        const api = await import('../services/api.js');
        await api.menuAPI.getAll();
        expect(global.fetch.mock.calls[0][0]).toContain('/menu');
    });
});
