const { getDb } = require('../db/pool');
const { mapInventory } = require('../db/mappers');

const cols = ['id', 'tenant_id', 'item_name', 'quantity', 'unit', 'category', 'min_qty', 'is_active', 'last_updated', 'created_at', 'updated_at'];

const mapItem = (row) => row && ({
    ...mapInventory(row),
    minQty: Number(row.min_qty ?? 0),
    isActive: row.is_active !== false,
});

const findAll = async (tenantId, { search, lowStock, includeInactive = false } = {}) => {
    let q = getDb()('inventory').where({ tenant_id: tenantId });
    if (!includeInactive) q = q.andWhere('is_active', true);
    if (search) {
        const s = `%${search}%`;
        q = q.where((b) => {
            b.whereILike('item_name', s).orWhereILike('category', s).orWhereILike('unit', s);
        });
    }
    if (lowStock) q = q.whereRaw('quantity <= min_qty');
    const rows = await q.orderBy('item_name');
    return rows.map(mapItem);
};

const findById = async (tenantId, id) => {
    const row = await getDb()('inventory').where({ id, tenant_id: tenantId }).first();
    return row ? mapItem(row) : null;
};

const create = async (tenantId, data, trx = getDb()) => {
    const [row] = await trx('inventory').insert({
        tenant_id: tenantId,
        item_name: data.itemName,
        quantity: data.quantity || 0,
        unit: data.unit,
        category: data.category,
        min_qty: data.minQty || 0,
        menu_item_id: data.menuItemId || null,
    }).returning(cols.concat(['menu_item_id']));
    return { ...mapItem(row), menuItemId: row.menu_item_id };
};

const updateById = async (tenantId, id, data, trx = getDb()) => {
    const patch = { updated_at: new Date(), last_updated: new Date() };
    if (data.itemName !== undefined) patch.item_name = data.itemName;
    if (data.quantity !== undefined) patch.quantity = data.quantity;
    if (data.unit !== undefined) patch.unit = data.unit;
    if (data.category !== undefined) patch.category = data.category;
    if (data.minQty !== undefined) patch.min_qty = data.minQty;
    const [row] = await trx('inventory').where({ id, tenant_id: tenantId }).update(patch).returning(cols);
    return row ? mapItem(row) : null;
};

const softDelete = async (tenantId, id) => {
    const [row] = await getDb()('inventory')
        .where({ id, tenant_id: tenantId })
        .update({ is_active: false, updated_at: new Date() })
        .returning(cols);
    return row ? mapItem(row) : null;
};

const addMovement = async (tenantId, inventoryId, { type, delta, note, refOrderId, actorId }, trx = getDb()) => {
    const item = await trx('inventory').where({ id: inventoryId, tenant_id: tenantId }).first();
    if (!item) return null;

    const signed = Number(delta);
    if (!Number.isFinite(signed) || signed === 0) {
        const err = new Error('delta must be a non-zero number');
        err.statusCode = 400;
        throw err;
    }
    if (type === 'purchase' && signed < 0) {
        const err = new Error('purchase delta must be positive');
        err.statusCode = 400;
        throw err;
    }
    if (type === 'waste' && signed > 0) {
        const err = new Error('waste delta must be negative');
        err.statusCode = 400;
        throw err;
    }

    await trx('inventory_movements').insert({
        tenant_id: tenantId,
        inventory_id: inventoryId,
        type,
        delta: signed,
        ref_order_id: (refOrderId && /^[0-9a-f-]{36}$/i.test(String(refOrderId))) ? refOrderId : null,
        note: note || null,
        actor_id: (actorId && /^[0-9a-f-]{36}$/i.test(String(actorId))) ? actorId : null,
    });

    const nextQty = Number(item.quantity) + signed;
    const [updated] = await trx('inventory')
        .where({ id: inventoryId, tenant_id: tenantId })
        .update({ quantity: nextQty, last_updated: new Date(), updated_at: new Date() })
        .returning(cols);
    return mapItem(updated);
};

const listMovements = async (tenantId, inventoryId, limit = 50) => {
    const rows = await getDb()('inventory_movements')
        .where({ tenant_id: tenantId, inventory_id: inventoryId })
        .orderBy('created_at', 'desc')
        .limit(limit);
    return rows.map((r) => ({
        _id: r.id,
        type: r.type,
        delta: Number(r.delta),
        note: r.note,
        refOrderId: r.ref_order_id,
        createdAt: r.created_at,
    }));
};

const lowStockCount = async (tenantId) => {
    const [{ count }] = await getDb()('inventory')
        .where({ tenant_id: tenantId, is_active: true })
        .whereRaw('quantity <= min_qty')
        .count('* as count');
    return Number(count);
};

module.exports = { findAll, findById, create, updateById, softDelete, addMovement, listMovements, lowStockCount, mapItem };
