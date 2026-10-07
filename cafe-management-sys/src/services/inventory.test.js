import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('inventoryAPI client', () => {
    beforeEach(() => {
        vi.resetModules();
        global.fetch = vi.fn(async () => ({
            ok: true,
            status: 200,
            headers: new Headers(),
            json: async () => ({ success: true, data: { items: [] } }),
        }));
    });

    it('list, create, movement, delete hit correct endpoints', async () => {
        const api = await import('../services/api.js');
        await api.inventoryAPI.list({ lowStock: 'true', search: 'milk' });
        expect(global.fetch.mock.calls.at(-1)[0]).toContain('/inventory?lowStock=true&search=milk');

        global.fetch.mockResolvedValue({
            ok: true, status: 201, headers: new Headers(),
            json: async () => ({ success: true, data: { _id: 'i1' } }),
        });
        await api.inventoryAPI.create({ itemName: 'Milk', quantity: 2, unit: 'L', category: 'Dairy', minQty: 5 });
        expect(global.fetch.mock.calls.at(-1)[1].method).toBe('POST');

        await api.inventoryAPI.addMovement('i1', { type: 'purchase', delta: 10 });
        expect(global.fetch.mock.calls.at(-1)[0]).toContain('/inventory/i1/movements');

        await api.inventoryAPI.update('i1', { minQty: 3 });
        await api.inventoryAPI.remove('i1');
        expect(global.fetch.mock.calls.at(-1)[1].method).toBe('DELETE');
        await api.inventoryAPI.getById('i1');
    });
});
