import { describe, it, expect, vi, beforeEach } from 'vitest';

const okJson = (data) => ({
    ok: true,
    status: 200,
    headers: new Headers(),
    json: async () => ({ success: true, data, timestamp: 't' }),
});

describe('recipe editor API + payload (TDD)', () => {
    beforeEach(() => {
        vi.resetModules();
        global.fetch = vi.fn(async () => okJson([]));
    });

    it('inventoryAPI recipe methods hit correct endpoints', async () => {
        const api = await import('../../services/api.js');

        await api.inventoryAPI.listRecipesForItem('inv-1');
        expect(global.fetch.mock.calls.at(-1)[0]).toContain('/inventory/inv-1/recipes');

        await api.inventoryAPI.listRecipesForMenu('menu-1');
        expect(global.fetch.mock.calls.at(-1)[0]).toContain('/inventory/recipes/menu/menu-1');

        global.fetch.mockResolvedValue(okJson({ _id: 'r1' }));
        await api.inventoryAPI.addRecipe({
            menuItemId: 'm1',
            inventoryItemId: 'inv-1',
            qty: 0.25,
            unit: 'L',
        });
        expect(global.fetch.mock.calls.at(-1)[0]).toContain('/inventory/recipes');
        expect(global.fetch.mock.calls.at(-1)[1].method).toBe('POST');

        await api.inventoryAPI.removeRecipe('r1');
        expect(global.fetch.mock.calls.at(-1)[1].method).toBe('DELETE');
    });

    it('validates recipe payload before save', async () => {
        const validateRecipe = ({ menuItemId, inventoryItemId, qty, unit }) => {
            const errors = {};
            if (!menuItemId) errors.menuItemId = 'required';
            if (!inventoryItemId) errors.inventoryItemId = 'required';
            if (qty == null || Number.isNaN(Number(qty)) || Number(qty) <= 0) errors.qty = 'must be > 0';
            if (!unit) errors.unit = 'required';
            return errors;
        };

        expect(validateRecipe({}).qty).toBe('must be > 0');
        expect(validateRecipe({ menuItemId: 'm', inventoryItemId: 'i', qty: 0, unit: 'kg' }).qty).toBe('must be > 0');
        expect(validateRecipe({ menuItemId: 'm', inventoryItemId: 'i', qty: 0.2, unit: 'kg' })).toEqual({});
    });

    it('maps recipes to editor rows', async () => {
        const toEditorRows = (recipes = []) => recipes.map((r) => ({
            id: r._id,
            menuItemId: r.menuItemId,
            menuItemTitle: r.menuItemTitle || '—',
            qty: r.qty,
            unit: r.unit,
        }));
        const rows = toEditorRows([
            { _id: 'r1', menuItemId: 'm1', menuItemTitle: 'Latte', qty: 0.2, unit: 'L' },
        ]);
        expect(rows[0].menuItemTitle).toBe('Latte');
        expect(rows[0].qty).toBe(0.2);
    });
});
